const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../src/models/User');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function initAdmin() {
  const { MONGO_URI, ADMIN_USERNAME = 'admin', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in backend/.env');
  }

  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  });

  let user = await User.findOne({ email: ADMIN_EMAIL });

  if (!user) {
    user = await User.create({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin'
    });
    console.log(`Created admin user: ${user.email}`);
  } else if (user.role !== 'admin') {
    user.role = 'admin';
    await user.save();
    console.log(`Promoted existing user to admin: ${user.email}`);
  } else {
    console.log(`Admin user already exists: ${user.email}`);
  }

  await mongoose.connection.close();
}

initAdmin().catch(async (error) => {
  console.error(error.message);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  process.exit(1);
});
