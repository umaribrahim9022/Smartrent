const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { server } = require('./app');
const connectDB = require('./config/db');
const config = require('./config/index');

// Connect to Database
connectDB();

// Start Server with Socket.io Enabled HTTP Server
const PORT = process.env.PORT || config.port || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
