const Property = require('../models/Property');
const Groq = require('groq-sdk');
const { toFile } = require('groq-sdk');

// Lazy Groq client getter
let _groq = null;
const getGroqClient = () => {
  if (!_groq && process.env.GROQ_API_KEY) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
};

// Unified AI completion with Groq (fallback to OpenRouter)
const callLLM = async ({ prompt, systemPrompt, jsonMode = false, maxTokens = 1500 }) => {
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  // Try Groq first (lightning fast & high quality)
  if (process.env.GROQ_API_KEY) {
    try {
      const options = {
        model: 'openai/gpt-oss-120b',
        messages,
        temperature: 0.1,
        max_completion_tokens: maxTokens
      };
      if (jsonMode) options.response_format = { type: 'json_object' };

      const client = getGroqClient();
      if (!client) throw new Error('Groq client not initialized');
      const res = await client.chat.completions.create(options);
      const content = res.choices[0]?.message?.content?.trim();
      if (content) return content;
    } catch (err) {
      console.warn('Groq LLM call warning:', err.message);
    }
  }

  // Fallback to OpenRouter if Groq fails
  if (process.env.OPENROUTER_API_KEY) {
    const body = {
      model: 'openai/gpt-oss-120b',
      messages,
      temperature: 0.1
    };
    if (jsonMode) body.response_format = { type: 'json_object' };

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'SmartRent AI',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || 'OpenRouter error');
    return data.choices[0].message.content.trim();
  }

  throw new Error('No AI provider configured');
};

// Build flexible location query matching area and city
const buildLocationFilter = (area, city) => {
  const terms = [];
  if (area) {
    area.split(/\s+/).forEach(w => {
      const clean = w.trim().toLowerCase();
      if (clean.length > 2) terms.push(clean);
    });
  }
  if (city) {
    city.split(/\s+/).forEach(w => {
      const clean = w.trim().toLowerCase();
      if (clean.length > 2 && !terms.includes(clean)) terms.push(clean);
    });
  }

  if (terms.length === 0) return null;

  // Match each keyword across location, title, or description
  const conditions = terms.map(term => ({
    $or: [
      { location: { $regex: term, $options: 'i' } },
      { title: { $regex: term, $options: 'i' } },
      { description: { $regex: term, $options: 'i' } }
    ]
  }));

  return conditions.length === 1 ? conditions[0] : { $and: conditions };
};

exports.handleChatMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // ── Step 1: AI Parameter Extraction ──
    const extractionPrompt = `
You are an expert real estate NLP parser for SmartRent in Pakistan.
Extract property search filters from the user message into a strict JSON object.

JSON Schema:
{
  "intent": "search" | "greeting" | "faq" | "general",
  "city": string in English lowercase or null (e.g. "lahore", "karachi", "islamabad", "rawalpindi"),
  "area": string in English lowercase or null (e.g. "johar town", "dha", "gulberg", "bahria town", "model town", "clifton"),
  "budget": number or null (maximum rent budget in PKR, e.g. 50k->50000, 1 lakh->100000, پچاس ہزار->50000),
  "minBudget": number or null,
  "bedrooms": number or null,
  "propertyTypes": array of strings ["Apartment", "House", "Villa", "Studio"] or null,
  "wantsCheap": boolean,
  "wantsLuxury": boolean,
  "language": "ur" | "roman_urdu" | "en"
}

Translation & Mapping Rules:
- "lahore/لاہور" -> city: "lahore"
- "islamabad/اسلام آباد" -> city: "islamabad"
- "karachi/کراچی" -> city: "karachi"
- "johar town/جوہر ٹاؤن" -> area: "johar town", city: "lahore"
- "dha/ڈی ایچ اے" -> area: "dha"
- "ghar/makan/مکان/گھر" -> "House"
- "flat/apartment/فلیٹ/اپارٹمنٹ" -> "Apartment"
- "studio/اسٹوڈیو" -> "Studio"
- "ghar ya apartment/مکان یا فلیٹ" -> ["House", "Apartment"]
- "50k se kam/under 50k/50 ہزار سے کم" -> budget: 50000
- If the user uses Urdu alphabet (اردو رسم الخط), language must be "ur".
- If the user writes Urdu in English alphabets (e.g. "muje ghar chahiye"), language is "roman_urdu".
- If English, language is "en".

User Message: "${message}"
Return ONLY valid JSON.
`;

    let extraction = { intent: 'search', language: 'en' };
    try {
      const rawJson = await callLLM({ prompt: extractionPrompt, jsonMode: true, maxTokens: 1200 });
      extraction = JSON.parse(rawJson);
    } catch (e) {
      console.error('AI Extraction Error:', e.message);
    }

    let matchingProperties = [];
    let isExactMatch = true;

    // ── Step 2: Handle greetings and FAQs directly via AI ──
    if (extraction.intent === 'greeting') {
      const greetingPrompt = `
User: "${message}"
Language: ${extraction.language}
You are the SmartRent AI property assistant. Respond with a warm, welcoming greeting in the same language. Explain that you can find properties by city, area, budget (e.g., under 50k), bedrooms, or property type.
`;
      const reply = await callLLM({ prompt: greetingPrompt, maxTokens: 150 });
      return res.status(200).json({ success: true, data: { reply, properties: [] } });
    }

    if (extraction.intent === 'faq') {
      const faqPrompt = `
User: "${message}"
Language: ${extraction.language}
You are the SmartRent AI property assistant. Answer the user question in the same language regarding booking a property (click 'Book Now'), contacting owners ('Message Owner'), or rent prediction.
`;
      const reply = await callLLM({ prompt: faqPrompt, maxTokens: 200 });
      return res.status(200).json({ success: true, data: { reply, properties: [] } });
    }

    // ── Step 3: Database Query with Smart Fallbacks ──
    const baseFilter = { status: { $ne: 'Rented' } };
    const queryFilter = { ...baseFilter };

    // Property types (array or single string)
    if (Array.isArray(extraction.propertyTypes) && extraction.propertyTypes.length > 0) {
      queryFilter.propertyType = { $in: extraction.propertyTypes };
    } else if (extraction.propertyType) {
      queryFilter.propertyType = extraction.propertyType;
    }

    // Bedrooms
    if (extraction.bedrooms) {
      queryFilter.bedrooms = extraction.bedrooms;
    }

    // Location matching
    const locFilter = buildLocationFilter(extraction.area, extraction.city);
    if (locFilter) {
      if (locFilter.$and) queryFilter.$and = locFilter.$and;
      else if (locFilter.$or) queryFilter.$or = locFilter.$or;
      else Object.assign(queryFilter, locFilter);
    }

    // Sort order
    let sortOption = { createdAt: -1 };
    if (extraction.wantsCheap) sortOption = { price: 1 };
    else if (extraction.wantsLuxury) sortOption = { price: -1 };

    // 1st attempt: with exact budget constraint
    if (extraction.budget) {
      const budgetFilter = { ...queryFilter, price: { $lte: extraction.budget } };
      matchingProperties = await Property.find(budgetFilter).sort(sortOption).limit(4);
    } else {
      matchingProperties = await Property.find(queryFilter).sort(sortOption).limit(4);
    }

    // 2nd attempt: If 0 results found under exact budget, check without budget cap in same area/city
    if (matchingProperties.length === 0 && extraction.budget) {
      isExactMatch = false;
      matchingProperties = await Property.find(queryFilter).sort({ price: 1 }).limit(3);
    }

    // 3rd attempt: If still 0 results and an area was specified, try wider search in city
    if (matchingProperties.length === 0 && extraction.city) {
      const cityFilter = { ...baseFilter, location: { $regex: extraction.city, $options: 'i' } };
      matchingProperties = await Property.find(cityFilter).sort({ price: 1 }).limit(3);
      isExactMatch = false;
    }

    // Fallback: If nothing matched at all, get featured available listings
    if (matchingProperties.length === 0) {
      matchingProperties = await Property.find(baseFilter).sort({ price: 1 }).limit(3);
      isExactMatch = false;
    }

    // ── Step 4: AI-Generated Accurate Response ──
    const propertiesSummary = matchingProperties.map(p => ({
      title: p.title,
      price: `${p.price} PKR`,
      location: p.location,
      type: p.propertyType,
      bedrooms: `${p.bedrooms} Bed`
    }));

    const responsePrompt = `
You are the SmartRent AI property assistant in Pakistan.
Generate a concise, helpful, friendly response for the user based on their search and the database results.

User's Original Query: "${message}"
Detected Language: ${extraction.language}
Criteria: City: ${extraction.city || 'Any'}, Area: ${extraction.area || 'Any'}, Budget: ${extraction.budget ? `${extraction.budget} PKR` : 'Any'}, Types: ${extraction.propertyTypes ? extraction.propertyTypes.join('/') : 'Any'}
Exact Match Found: ${isExactMatch}

Database Properties Found (${matchingProperties.length}):
${JSON.stringify(propertiesSummary, null, 2)}

Language Guidelines:
- If user asked in Urdu script (اردو), reply in fluent, polite Urdu script (اردو رسم الخط).
- If user asked in Roman Urdu (e.g. "muje 50k me chahiye"), reply in friendly Roman Urdu.
- If user asked in English, reply in English.

Content Guidelines:
- State clearly how many properties matched their criteria.
- If exact matches were found within their budget, highlight them with enthusiasm (e.g. mention the prices like 42,000 PKR, 48,000 PKR).
- If no property was found under their exact budget but close options exist, explain honestly that the closest options in that area start slightly above (e.g. 77,000 PKR).
- Keep the response concise, clear, and direct (2 to 4 sentences).
- Do NOT output JSON or code blocks. Output ONLY the response text.
`;

    let reply = '';
    try {
      reply = await callLLM({ prompt: responsePrompt, maxTokens: 1000 });
    } catch (err) {
      console.error('AI Response Generation Error:', err.message);
      // Clean fallback if AI generation fails
      if (matchingProperties.length > 0) {
        reply = `✅ Found ${matchingProperties.length} properties matching your search! Check them out below.`;
      } else {
        reply = "Sorry, no properties are currently available matching that criteria.";
      }
    }

    return res.status(200).json({
      success: true,
      data: { reply, properties: matchingProperties }
    });

  } catch (error) {
    next(error);
  }
};

// ── Voice Audio Transcription via Groq Whisper + Urdu Script Enhancement ──
exports.handleVoiceTranscribe = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'Audio recording is required' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ success: false, message: 'GROQ_API_KEY is not configured on server' });
    }

    const mimeType = req.file.mimetype || 'audio/webm';
    let ext = 'webm';
    if (mimeType.includes('wav')) ext = 'wav';
    else if (mimeType.includes('mp4') || mimeType.includes('m4a')) ext = 'm4a';
    else if (mimeType.includes('ogg')) ext = 'ogg';

    const audioFile = await toFile(req.file.buffer, `voice_input.${ext}`, { type: mimeType });

    // Check if Urdu mode is active (default to Urdu unless explicitly en-US/en)
    const rawLang = (req.query?.lang || req.body?.lang || 'ur-PK').toLowerCase();
    const isUrduMode = !rawLang.includes('en');

    const transcriptionParams = {
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      prompt: isUrduMode
        ? 'لاہور، اسلام آباد، کراچی، جوہر ٹاؤن، مکان، فلیٹ، اسٹوڈیو، کرایہ، بیڈروم۔'
        : 'Property search in Pakistan: Lahore, Islamabad, Karachi, DHA, Johar Town, rent, budget, bedrooms.',
      temperature: 0.0,
      response_format: 'verbose_json',
    };

    if (isUrduMode) {
      transcriptionParams.language = 'ur';
    } else {
      transcriptionParams.language = 'en';
    }

    const client = getGroqClient();
    if (!client) {
      return res.status(500).json({ success: false, message: 'Groq client not available' });
    }

    const transcription = await client.audio.transcriptions.create(transcriptionParams);

    let transcript = (transcription.text || '').trim();

    // Filter out common Whisper silence/noise hallucinations
    const hallucinations = [
      'Það er hljóð', 'hljóð', 'E aí', 'Amara.org', 'Thank you', 'Thanks for watching',
      'Subtitles by', 'subscribe', 'Watching', 'you', '.'
    ];

    const isHallucination = hallucinations.some(h => 
      transcript.toLowerCase() === h.toLowerCase() || 
      (transcript.length < 15 && transcript.toLowerCase().includes(h.toLowerCase()))
    );

    if (isHallucination || transcript.length < 2) {
      transcript = '';
    }

    // ── Enforce 100% Pure Urdu Language Script in Urdu Mode ──
    if (isUrduMode && transcript) {
      try {
        const urduEnhancePrompt = `
You are an expert Urdu translator and speech corrector for a Pakistani property rental app (SmartRent).
User input/speech transcript: "${transcript}"

Instructions:
Convert this into natural, fluent Urdu script (اردو رسم الخط).
Examples:
- "Stúrjó, Elahór" -> "لاہور میں اسٹوڈیو"
- "studio in lahore" -> "لاہور میں اسٹوڈیو"
- "50k range lahore ghar" -> "لاہور میں 50 ہزار کی رینج میں گھر"
- "lahore johar town studio apartment" -> "لاہور جوہر ٹاؤن میں اسٹوڈیو اپارٹمنٹ"
- "muje 50 hazar se kam me lahore me ghar chahiye" -> "مجھے 50 ہزار سے کم میں لاہور میں گھر چاہیے"

Respond ONLY with the Urdu script text. Do not output English or reasoning.
`;

        const urduConv = await client.chat.completions.create({
          model: 'openai/gpt-oss-120b',
          messages: [{ role: 'user', content: urduEnhancePrompt }],
          temperature: 0.1,
          max_completion_tokens: 300
        });

        const urduText = urduConv.choices[0]?.message?.content?.trim();
        if (urduText && urduText.length > 0) {
          transcript = urduText;
        }
      } catch (convErr) {
        console.error('Urdu converter error:', convErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        text: transcript,
        language: isUrduMode ? 'ur' : 'en'
      }
    });
  } catch (error) {
    console.error('Voice transcription error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Voice transcription failed'
    });
  }
};