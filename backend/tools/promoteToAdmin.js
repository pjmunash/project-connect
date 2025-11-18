// save as backend/tools/promoteToAdmin.js
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const User = require('../src/models/User');

async function promote(email){
  await mongoose.connect(process.env.MONGO_URI);
  const u = await User.findOne({ email });
  if (!u){ console.error('User not found'); process.exit(1) }
  u.role = 'admin';
  await u.save();
  console.log('Promoted', u.email);
  process.exit(0);
}

const email = process.argv[2];
if (!email) { console.error('Usage: node promoteToAdmin.js you@example.com'); process.exit(1) }
promote(email).catch(e => { console.error(e); process.exit(1) });
