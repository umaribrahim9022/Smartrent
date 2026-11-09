const request = require('supertest');

jest.mock('../models/User');
jest.mock('../models/Property');
jest.mock('../models/Booking');
jest.mock('../models/Report');

const User = require('../models/User');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const Report = require('../models/Report');
const { app } = require('../app');
const { generateToken } = require('./helpers/authHelper');
const mockQuery = require('./helpers/mockQuery');

const ADMIN_ID = '507f1f77bcf86cd799439099';
const RENTER_ID = '507f1f77bcf86cd799439010';

describe('Admin Management Module (TC-20 to TC-23)', () => {
  afterEach(() => jest.clearAllMocks());

  // TC-20: Administrator views registered users
  test('TC-20: admin can view the complete list of users', async () => {
    User.findById.mockResolvedValue({ _id: ADMIN_ID, role: 'admin' });
    User.find.mockReturnValue(
      mockQuery([
        { _id: 'u1', name: 'Ali Raza', role: 'renter' },
        { _id: 'u2', name: 'Hammad Haider', role: 'owner' }
      ])
    );

    const token = generateToken(ADMIN_ID, 'admin');
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.users.length).toBe(2);
  });

  // TC-21: Administrator monitors property listings
  test('TC-21: admin can see all active property listings', async () => {
    User.findById.mockResolvedValue({ _id: ADMIN_ID, role: 'admin' });
    Property.find.mockReturnValue(
      mockQuery([{ _doc: { _id: 'p1', title: 'Lahore Apartment', status: 'Available' } }])
    );

    const res = await request(app).get('/api/properties');

    expect(res.statusCode).toBe(200);
    expect(res.body.data.properties.length).toBe(1);
  });

  // TC-22: Administrator generates system reports
  test('TC-22: system report is generated successfully', async () => {
    User.findById.mockResolvedValue({ _id: ADMIN_ID, role: 'admin' });
    User.countDocuments.mockResolvedValue(10);
    Property.countDocuments.mockResolvedValue(5);
    Booking.countDocuments.mockResolvedValue(8);
    Report.create.mockResolvedValue({
      _id: 'r1',
      reportType: 'System Analytics',
      metrics: { totalUsers: 10, totalProperties: 5, totalBookings: 8 }
    });

    const token = generateToken(ADMIN_ID, 'admin');
    const res = await request(app)
      .post('/api/admin/reports')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.report.metrics.totalUsers).toBe(10);
  });

  // TC-23: Unauthorized user attempts to access admin panel
  test('TC-23: non-admin user is denied access to the admin panel', async () => {
    User.findById.mockResolvedValue({ _id: RENTER_ID, role: 'renter' });

    const token = generateToken(RENTER_ID, 'renter');
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('TC-23b: request with no token at all is rejected', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.statusCode).toBe(401);
  });
});
