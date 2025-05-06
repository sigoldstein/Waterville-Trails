const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Drop existing tables
    await client.query(`
      DROP TABLE IF EXISTS route_segments CASCADE;
      DROP TABLE IF EXISTS routes CASCADE;
      DROP TABLE IF EXISTS road_segments CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Read and execute the schema file
    const schema = fs.readFileSync('schema.sql', 'utf8');
    await client.query(schema);

    await client.query('COMMIT');
    console.log('Database initialized successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error initializing database:', err);
  } finally {
    client.release();
    pool.end();
  }
}

initDatabase(); 