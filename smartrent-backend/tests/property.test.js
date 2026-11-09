const request = require('supertest');

jest.mock('../models/User');
jest.mock('../models/Property');

const User = require('../models/User');
const Property = require('../models/Property');
const { app } = require('../app');
const { generateToken } = require('./helpers/authHelper');
const mockQuery = require('./helpers/mockQuery');

const OWNER_ID = '507f1f77bcf86cd799439011';

describe('Property Module (TC-06 to TC-10)', () => {
  beforeEach(() => {
    // protect() middleware always looks up the logged-in user by id
    User.findById.mockResolvedValue({ _id: OWNER_ID, role: 'owner' });
  });

  afterEach(() => jest.clearAllMocks());

  // TC-06: Landlord adds a new property listing
  test('TC-06: owner can create a new property listing', async () => {
    Property.create.mockResolvedValue({
      _id: 'p1',
      title: 'Cozy 2-Bed Apartment',
      location: 'Lahore',
      price: 40000,
      owner: OWNER_ID
    });

    const token = generateToken(OWNER_ID, 'owner');
    const res = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Cozy 2-Bed Apartment',
        description: 'Nice place',
        price: 40000,
        location: 'Lahore',
        bedrooms: 2,
        propertyType: 'Apartment'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.property.title).toBe('Cozy 2-Bed Apartment');
  });

  // TC-07: Landlord updates property information
  test('TC-07: owner can update their own property', async () => {
    Property.findById.mockResolvedValue({ _id: 'p1', owner: OWNER_ID });
    Property.findByIdAndUpdate.mockResolvedValue({
      _id: 'p1',
      title: 'Updated Title',
      price: 45000,
      owner: OWNER_ID
    });

    const token = generateToken(OWNER_ID, 'owner');
    const res = await request(app)
      .put('/api/properties/p1')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Title', price: 45000 });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.property.title).toBe('Updated Title');
  });

  // TC-08: Landlord deletes a property listing
  test('TC-08: owner can delete their own property', async () => {
    Property.findById.mockResolvedValue({ _id: 'p1', owner: OWNER_ID });
    Property.findByIdAndDelete.mockResolvedValue({ _id: 'p1' });

    const token = generateToken(OWNER_ID, 'owner');
    const res = await request(app)
      .delete('/api/properties/p1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Property.findByIdAndDelete).toHaveBeenCalledWith('p1');
  });

  // TC-09: Tenant searches properties using valid filters
  test('TC-09: search with valid filters returns matching properties', async () => {
    Property.find.mockReturnValue(
      mockQuery([
        {
          _doc: {
            _id: 'p1',
            title: 'Lahore Apartment',
            location: 'Lahore',
            price: 30000,
            viewsCount: 0,
            bookingsCount: 0
          }
        }
      ])
    );

    const res = await request(app).get('/api/properties?location=Lahore');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.properties.length).toBe(1);
    expect(res.body.data.properties[0].location).toBe('Lahore');
  });

  // TC-10: Tenant searches with criteria that match no property
  test('TC-10: search with no matching criteria returns an empty list', async () => {
    Property.find.mockReturnValue(mockQuery([]));

    const res = await request(app).get('/api/properties?location=Atlantis');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.properties).toEqual([]);
    expect(res.body.count).toBe(0);
  });
});
