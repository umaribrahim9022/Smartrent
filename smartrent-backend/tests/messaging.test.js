const request = require('supertest');

jest.mock('../models/User');
jest.mock('../models/Conversation');
jest.mock('../models/Message');

const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { app } = require('../app');
const { generateToken } = require('./helpers/authHelper');
const mockQuery = require('./helpers/mockQuery');

const TENANT_ID = '507f1f77bcf86cd799439033';
const LANDLORD_ID = '507f1f77bcf86cd799439044';
const CONVERSATION_ID = '507f1f77bcf86cd799439055';

describe('Messaging Module (TC-13 to TC-15)', () => {
  afterEach(() => jest.clearAllMocks());

  // TC-13: Tenant sends a message to landlord
  test('TC-13: tenant message is delivered and stored', async () => {
    User.findById.mockResolvedValue({ _id: TENANT_ID, role: 'renter' });
    Message.create.mockResolvedValue({
      _id: 'm1',
      conversation: CONVERSATION_ID,
      sender: TENANT_ID,
      messageText: 'Hi, is this property still available?'
    });
    Conversation.findByIdAndUpdate.mockResolvedValue({});

    const token = generateToken(TENANT_ID, 'renter');
    const res = await request(app)
      .post('/api/messaging/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ conversationId: CONVERSATION_ID, messageText: 'Hi, is this property still available?' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message.messageText).toBe('Hi, is this property still available?');
  });

  // TC-14: Landlord replies to a tenant message
  test('TC-14: landlord reply is delivered to the tenant', async () => {
    User.findById.mockResolvedValue({ _id: LANDLORD_ID, role: 'owner' });
    Message.create.mockResolvedValue({
      _id: 'm2',
      conversation: CONVERSATION_ID,
      sender: LANDLORD_ID,
      messageText: 'Yes, it is still available!'
    });
    Conversation.findByIdAndUpdate.mockResolvedValue({});

    const token = generateToken(LANDLORD_ID, 'owner');
    const res = await request(app)
      .post('/api/messaging/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ conversationId: CONVERSATION_ID, messageText: 'Yes, it is still available!' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.message.sender).toBe(LANDLORD_ID);
  });

  // TC-15: User opens conversation history
  test('TC-15: full chat history is displayed in order', async () => {
    User.findById.mockResolvedValue({ _id: TENANT_ID, role: 'renter' });
    Message.find.mockReturnValue(
      mockQuery([
        { _id: 'm1', messageText: 'Hi, is this property still available?', sender: TENANT_ID },
        { _id: 'm2', messageText: 'Yes, it is still available!', sender: LANDLORD_ID }
      ])
    );

    const token = generateToken(TENANT_ID, 'renter');
    const res = await request(app)
      .get(`/api/messaging/messages/${CONVERSATION_ID}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.messages.length).toBe(2);
  });
});
