const request = require('supertest');
const bcrypt = require('bcryptjs');

jest.mock('../models/User');
jest.mock('../utils/sendEmail', () => jest.fn().mockResolvedValue({ messageId: 'test-message-id' }));
const User = require('../models/User');
const { app } = require('../app');

describe('Auth Module (TC-01 to TC-05)', () => {
  afterEach(() => jest.clearAllMocks());

  // TC-01: User enters valid login credentials
  test('TC-01: valid login succeeds and returns a token', async () => {
    const hashedPassword = await bcrypt.hash('Password123', 10);
    User.findOne.mockResolvedValue({
      _id: 'u1',
      name: 'Ali Raza',
      email: 'ali@example.com',
      role: 'renter',
      password: hashedPassword,
      isVerified: true
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ali@example.com', password: 'Password123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('ali@example.com');
  });

  // TC-02: User enters incorrect password
  test('TC-02: incorrect password returns Invalid Credentials error', async () => {
    const hashedPassword = await bcrypt.hash('Password123', 10);
    User.findOne.mockResolvedValue({
      _id: 'u1',
      email: 'ali@example.com',
      role: 'renter',
      password: hashedPassword,
      isVerified: true
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ali@example.com', password: 'WrongPassword' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid/i);
  });

  // TC-03: User attempts login with unregistered email
  test('TC-03: login with unregistered email returns User Not Found style error', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nouser@example.com', password: 'Password123' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid/i);
  });

  // TC-04: User registers with valid information
  test('TC-04: register with valid info creates account and returns OTP message', async () => {
    User.findOne.mockResolvedValue(null); // no existing user
    User.create.mockResolvedValue({
      _id: 'u2',
      name: 'Hammad Haider',
      email: 'hammad@example.com',
      role: 'renter',
      isVerified: false
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Hammad Haider',
      email: 'hammad@example.com',
      password: 'Password123'
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/OTP/i);
    expect(res.body.email).toBe('hammad@example.com');
  });

  // TC-05: User registers using an already registered email
  test('TC-05: register with already-registered email returns Email Already Exists error', async () => {
    User.findOne.mockResolvedValue({ _id: 'u1', email: 'ali@example.com', isVerified: true });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Ali Raza',
      email: 'ali@example.com',
      password: 'Password123'
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });
});
