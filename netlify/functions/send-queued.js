// Every 5 minutes: sends any automatic messages (confirmations, notices, reminders) still waiting in the queue.
const { schedule } = require('@netlify/functions');
const { Pool } = require('pg');
const { drain } = require('../../outbox');
exports.run = async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false, max: 2 });
  try { return await drain(pool, { limit: 150, budgetMs: 20000 }); } finally { await pool.end(); }
};
exports.handler = schedule('*/5 * * * *', async () => { console.log(JSON.stringify(await exports.run())); return { statusCode: 200 }; });
