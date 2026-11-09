const request = require('supertest');

jest.mock('../models/User');
const User = require('../models/User');
const { app } = require('../app');
const { generateToken } = require('./helpers/authHelper');

const USER_ID = '507f1f77bcf86cd799439066';

describe('Profile Management Module (TC-18)', () => {
  afterEach(() => jest.clearAllMocks());

  // TC-18: User updates profile information
  test('TC-18: profile changes are saved successfully', async () => {
    const fakeUserDoc = {
      _id: USER_ID,
      role: 'renter',
      name: 'Imrah',
      address: '',
      preferences: {},
      save: jest.fn().mockResolvedValue(true)
    };

    // First lookup: authMiddleware.protect()
    // Second lookup: userController.updateProfile()
    User.findById.mockResolvedValue(fakeUserDoc);

    const token = generateToken(USER_ID, 'renter');
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Imrah Khan',
        address: 'Lahore, Pakistan',
        preferences: { preferredLocation: 'Lahore', maxBudget: 60000 }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(fakeUserDoc.save).toHaveBeenCalled();
    expect(res.body.data.user.name).toBe('Imrah Khan');
    expect(res.body.data.user.address).toBe('Lahore, Pakistan');
  });
});
