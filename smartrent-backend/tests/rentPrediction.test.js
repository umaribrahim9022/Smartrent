const request = require('supertest');

jest.mock('../models/RentPrediction');
const RentPrediction = require('../models/RentPrediction');
const { app } = require('../app');

describe('Rent Prediction Module (TC-12)', () => {
  afterEach(() => jest.clearAllMocks());

  // TC-12: User requests rent prediction
  test('TC-12: system generates and returns an estimated rental price', async () => {
    RentPrediction.create.mockResolvedValue({ _id: 'rp1' });

    const res = await request(app).post('/api/rent-prediction').send({
      location: 'Lahore',
      bedrooms: 2,
      bathrooms: 2,
      propertyType: 'Apartment',
      sqft: 1200
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.predictedRent).toBe('number');
    expect(res.body.data.predictedRent).toBeGreaterThan(0);
    expect(res.body.data.confidenceScore).toBeCloseTo(0.88);
  });

  test('TC-12b: missing required fields returns a validation error', async () => {
    const res = await request(app).post('/api/rent-prediction').send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
