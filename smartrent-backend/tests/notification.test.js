const request = require('supertest');

jest.mock('../models/User');
jest.mock('../models/Property');
jest.mock('../models/Booking');
jest.mock('../models/Notification');

const User = require('../models/User');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const { app } = require('../app');
const { generateToken } = require('./helpers/authHelper');
const mockQuery = require('./helpers/mockQuery');

const RENTER_ID = '507f1f77bcf86cd799439077';
const OWNER_ID = '507f1f77bcf86cd799439088';

describe('Notification Module (TC-19)', () => {
  afterEach(() => jest.clearAllMocks());

  // TC-19: System generates a notification (here: triggered by a new booking request)
  test('TC-19: a notification is created and delivered to the property owner', async () => {
    User.findById.mockResolvedValue({ _id: RENTER_ID, role: 'renter' });
    Property.findById.mockResolvedValue({
      _id: 'p1',
      title: 'Lahore Apartment',
      owner: OWNER_ID,
      bookingsCount: 0,
      save: jest.fn().mockResolvedValue(true)
    });
    Booking.create.mockResolvedValue({ _id: 'b1', property: 'p1', renter: RENTER_ID });
    Notification.create.mockResolvedValue({
      _id: 'n1',
      user: OWNER_ID,
      text: 'New booking request received for your property: "Lahore Apartment"',
      type: 'booking'
    });

    const token = generateToken(RENTER_ID, 'renter');
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ propertyId: 'p1', startDate: '2026-10-01', endDate: '2026-11-01', totalPrice: 40000 });

    expect(res.statusCode).toBe(201);
    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ user: OWNER_ID, type: 'booking' })
    );
  });

  test('TC-19b: notification is displayed to the intended user', async () => {
    User.findById.mockResolvedValue({ _id: OWNER_ID, role: 'owner' });
    Notification.find.mockReturnValue(
      mockQuery([{ _id: 'n1', text: 'New booking request received', isRead: false }])
    );

    const token = generateToken(OWNER_ID, 'owner');
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.notifications.length).toBe(1);
  });
});
