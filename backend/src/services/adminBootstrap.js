const { User } = require('../models');

const bootstrapAdminUser = async () => {
  const {
    ADMIN_USERNAME = 'admin',
    ADMIN_EMAIL,
    ADMIN_PASSWORD
  } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return;
  }

  const existingUser = await User.findOne({ where: { email: ADMIN_EMAIL } });

  if (!existingUser) {
    await User.create({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin'
    });
    console.log(`Initialized admin user: ${ADMIN_EMAIL}`);
    return;
  }

  if (existingUser.role !== 'admin') {
    existingUser.role = 'admin';
    await existingUser.save();
    console.log(`Promoted existing user to admin: ${ADMIN_EMAIL}`);
    return;
  }

  console.log(`Admin bootstrap skipped, user already exists: ${ADMIN_EMAIL}`);
};

module.exports = {
  bootstrapAdminUser
};
