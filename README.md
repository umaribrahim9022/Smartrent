# SmartRent.AI — Intelligent Rental Search & Management Platform

SmartRent.AI is a modern, AI-powered property rental platform designed to match tenants with properties based on personalized preferences, budget, and location.

---

## Architecture Overview

```
Smartrent/
├── smartrent-backend/       # Node.js, Express, Socket.io, MongoDB
│   ├── controllers/         # Auth, Property, Booking, Messages, Analytics
│   ├── models/              # Mongoose schemas
│   ├── routes/              # Express API endpoints
│   ├── services/            # AI recommendation & rent prediction engines
│   └── server.js            # Server entrypoint
├── smartrent-frontend/      # React 19, Vite, Tailwind CSS v4, Lucide Icons
│   ├── src/pages/           # Home, Properties, Login, Register, Admin, Messages
│   ├── src/components/      # Navbar, Footer, Chatbot, VoiceAssistant
│   └── src/index.css        # Custom design system with light/dark theme support
```

---

## Local Development

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Atlas or local)

### 2. Backend Setup
```bash
cd smartrent-backend
npm install
cp .env.example .env
# Fill in your Mongo URI and API keys in .env
npm run dev
```

### 3. Frontend Setup
```bash
cd smartrent-frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on: `http://localhost:5173`
Backend runs on: `http://localhost:5000`

---

## Deployment to Railway

This repository is monorepo-ready for Railway:
1. In Railway, click **New Project** ➔ **Deploy from GitHub repo** ➔ Select `Smartrent`.
2. **Backend Service:**
   - **Root Directory:** `/smartrent-backend`
   - **Start Command:** `npm start`
   - **Variables:** Add all environment variables from `smartrent-backend/.env.example`.
3. **Database:**
   - Click **+ New** ➔ **Database** ➔ **MongoDB** (Railway generates the connection string automatically).
4. **Frontend Service:**
   - Click **+ New** ➔ **GitHub Repo** (same repo).
   - **Root Directory:** `/smartrent-frontend`
   - **Build Command:** `npm run build`
   - **Variables:** Set `VITE_API_BASE_URL` to your backend's public Railway URL.

