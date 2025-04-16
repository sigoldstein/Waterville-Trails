const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkData() {
  const client = await pool.connect();
  try {
    // Get total count
    const countResult = await client.query('SELECT COUNT(*) FROM road_segments');
    console.log(`Total road segments imported: ${countResult.rows[0].count}`);

    // Get sample of different road types
    const typesResult = await client.query(`
      SELECT road_type, COUNT(*) as count 
      FROM road_segments 
      GROUP BY road_type 
      ORDER BY count DESC
    `);
    console.log('\nRoad types distribution:');
    typesResult.rows.forEach(row => {
      console.log(`${row.road_type}: ${row.count} segments`);
    });

    // Get sample records
    const sampleResult = await client.query(`
      SELECT id, name, road_type, distance, safety_rating, traffic_level
      FROM road_segments
      WHERE name IS NOT NULL
      LIMIT 5
    `);
    console.log('\nSample road segments:');
    sampleResult.rows.forEach(row => {
      console.log(row);
    });

  } catch (err) {
    console.error('Error checking data:', err);
  } finally {
    client.release();
    pool.end();
  }
}

checkData(); 