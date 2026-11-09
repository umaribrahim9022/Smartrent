const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Property = require('./models/Property');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    await User.deleteMany({});
    await Property.deleteMany({});

    // Plain text pass karein (Model pre-save hook hashing handle karega)
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@smartrent.com',
      password: 'password123',
      role: 'admin'
    });

    const owner = await User.create({
      name: 'Sarah Landlord',
      email: 'owner@smartrent.com',
      password: 'password123',
      role: 'owner'
    });

    const renter = await User.create({
      name: 'Alex Renter',
      email: 'renter@smartrent.com',
      password: 'password123',
      role: 'renter'
    });

    console.log('Database re-seeded successfully!');
    process.exit();
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
};

seedDB();