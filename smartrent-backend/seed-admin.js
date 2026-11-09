require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path if needed
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find or create admin
    let admin = await User.findOne({ email: 'admin@smartrent.com' });
    
    if (admin) {
      admin.password = 'admin123';
      admin.role = 'admin';
      admin.isVerified = true;
      await admin.save();
      console.log('Admin updated successfully!');
    } else {
      admin = await User.create({
        name: 'Super Admin',
        email: 'admin@smartrent.com',
        password: 'admin123',
        role: 'admin',
        isVerified: true
      });
      console.log('Admin created successfully!');
    }

    console.log('Email: admin@smartrent.com');
    console.log('Password: admin123');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createAdmin();
