const request = require('supertest');

jest.mock('../models/User');
jest.mock('../models/Property');
jest.mock('../models/Recommendation');

const User = require('../models/User');
const Property = require('../models/Property');
const Recommendation = require('../models/Recommendation');
const { app } = require('../app');
const { generateToken } = require('./helpers/authHelper');
const mockQuery = require('./helpers/mockQuery');

const TENANT_ID = '507f1f77bcf86cd799439022';

describe('AI Recommendation Module (TC-11)', () => {
  afterEach(() => jest.clearAllMocks());

  // TC-11: User requests AI recommendations
  test('TC-11: personalized recommendations are returned based on preferences', async () => {
    // First call in protect(), second call inside the controller itself
    User.findById.mockResolvedValue({
      _id: TENANT_ID,
      role: 'renter',
      preferences: {
        preferredLocation: 'Lahore',
        preferredType: 'Apartment',
        maxBudget: 50000,
        bedrooms: 2
      }
    });

    Property.find.mockReturnValue(
      mockQuery([
        {
          _id: 'p1',
          _doc: {
            _id: 'p1',
            title: 'Lahore Apartment',
            location: 'Lahore',
            propertyType: 'Apartment',
            price: 45000,
            bedrooms: 2
          },
          location: 'Lahore',
          propertyType: 'Apartment',
          price: 45000,
          bedrooms: 2
        },
        {
          _id: 'p2',
          _doc: {
            _id: 'p2',
            title: 'Karachi Villa',
            location: 'Karachi',
            propertyType: 'Villa',
            price: 90000,
            bedrooms: 4
          },
          location: 'Karachi',
          propertyType: 'Villa',
          price: 90000,
          bedrooms: 4
        }
      ])
    );

    Recommendation.findOneAndUpdate.mockResolvedValue({});

    const token = generateToken(TENANT_ID, 'renter');
    const res = await request(app)
      .get('/api/recommendations')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recommendations.length).toBe(2);
    // The Lahore apartment matches location+type+budget+bedrooms, so it should rank first
    expect(res.body.data.recommendations[0].title).toBe('Lahore Apartment');
    expect(res.body.data.recommendations[0].matchPercentage).toBeGreaterThan(
      res.body.data.recommendations[1].matchPercentage
    );
  });
});
