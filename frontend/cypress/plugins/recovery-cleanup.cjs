// Explicit opt-in cleanup for test accounts only. Never modifies users/passwords.
const path = require('node:path');
const { createRequire } = require('node:module');
module.exports = (on, config) => {
  let connection;
  const uri = config.env.RESET_MONGO_URI || process.env.RESET_MONGO_URI;
  const expectedName = config.env.RESET_DB_NAME || process.env.RESET_DB_NAME;
  // Keep connection credentials in the Node process, not Cypress browser env.
  delete config.env.RESET_MONGO_URI;
  const requireBackend = createRequire(path.resolve(config.projectRoot, '../backend/package.json'));
  on('task', {
    async 'recovery:cleanup'({ email }) {
      if (config.env.RESET_DB_CLEANUP !== true) throw new Error('RESET_DB_CLEANUP must be true for test cleanup.');
      if (!uri || !expectedName) throw new Error('Fill RESET_MONGO_URI and RESET_DB_NAME locally for the backend test database.');
      email = String(email || '').trim().toLowerCase();
      const allowed = ['AKUN04_EMAIL', 'AKUN06_EMAIL', 'AKUN07_EMAIL']
        .map(key => String(config.env[key] || '').trim().toLowerCase()).filter(Boolean);
      if (!email || !allowed.includes(email)) throw new Error('Cleanup account is not in the test allowlist.');
      if (!connection) {
        const mongoose = requireBackend('mongoose');
        try {
          connection = await mongoose.createConnection(uri, {
            serverSelectionTimeoutMS: 10000,
          }).asPromise();
        } catch {
          throw new Error('Cannot connect to the configured test DB. Check local URI/access.');
        }
      }
      if (connection.name !== expectedName) {
        throw new Error('Connected database does not match RESET_DB_NAME. No records deleted.');
      }
      // Scoped filters: password-reset OTP only and rate limit for exactly one email.
      const otp = await connection.db.collection('otps').deleteMany({ email, type: 'PASSWORD_RESET' });
      const rate = await connection.db.collection('otpratelimits').deleteMany({ email });
      return { otpDeleted: otp.deletedCount, rateLimitDeleted: rate.deletedCount };
    },
  });
  on('after:run', async () => { if (connection) await connection.close(); connection = undefined; });
};
