const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const config = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  db: {
    uri: process.env.MONGO_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '90d',
  }
};

if (!config.db.uri) {
  console.error("FATAL ERROR: MONGO_URI is not defined.");
  process.exit(1);
}

if (!config.jwt.secret) {
  console.error("FATAL ERROR: JWT_SECRET is not defined.");
  process.exit(1);
}

module.exports = config;
