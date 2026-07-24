'use strict';

const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../models');

async function main() {
  const email = String(process.env.PROVISION_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.PROVISION_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) throw new Error('Runtime administrator credentials are required');
  await sequelize.sync();
  const hash = await bcrypt.hash(password, 10);
  await User.upsert({ email, password: hash, name: 'Runtime Administrator', role: 'admin' });
  await sequelize.close();
}

main().catch((error) => {
  console.error(`Runtime database initialization failed: ${error.message}`);
  process.exitCode = 1;
});
