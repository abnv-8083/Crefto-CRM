/**
 * One-time migration: old role system → the new 3-role system
 *   super_admin / admin / sales_manager → manager
 *   support_agent                       → developer
 *   sales_rep / viewer                  → sales_rep
 *
 * Also marks every existing user as approvalStatus:'approved' so nobody
 * is locked out by the new manager-approval requirement.
 *
 * Uses the native driver (bypasses mongoose validation/hydration) so
 * documents with legacy role values can be updated safely.
 *
 * Run: node src/seeds/migrateRoles.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');

const ROLE_MAP = {
  super_admin: 'manager',
  admin: 'manager',
  sales_manager: 'manager',
  support_agent: 'developer',
  sales_rep: 'sales_rep',
  viewer: 'sales_rep',
};

const migrate = async () => {
  await connectDB();

  const users = mongoose.connection.collection('users');
  const raw = await users.find({}).toArray();

  let rolesChanged = 0;
  let approved = 0;

  for (const u of raw) {
    const update = {};
    const newRole = ROLE_MAP[u.role];
    if (newRole && newRole !== u.role) {
      update.role = newRole;
      rolesChanged++;
    }
    if (u.approvalStatus !== 'approved') {
      update.approvalStatus = 'approved';
      approved++;
    }
    if (Object.keys(update).length) {
      await users.updateOne({ _id: u._id }, { $set: update });
    }
  }

  console.log(`✅ Migration complete: ${raw.length} users scanned`);
  console.log(`   roles remapped: ${rolesChanged}`);
  console.log(`   approved:       ${approved}`);
  await mongoose.disconnect();
  process.exit(0);
};

migrate().catch((err) => {
  console.error('❌ Migration error:', err);
  process.exit(1);
});
