const fs = require('fs');
const csv = require('csv-parser');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function importRoads() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Truncate existing data
    await client.query('TRUNCATE TABLE road_segments CASCADE;');

    // Create a temporary table to store the raw data
    await client.query(`
      CREATE TEMP TABLE temp_roads (
        osm_id bigint,
        name text,
        highway text,
        geometry text
      );
    `);

    // Read and process the CSV file
    const results = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('waterville_trails.csv')
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    // Insert data into the temporary table
    for (const row of results) {
      await client.query(
        'INSERT INTO temp_roads (osm_id, name, highway, geometry) VALUES ($1, $2, $3, $4)',
        [row.osm_id, row.name, row.highway, row.st_astext]
      );
    }

    // Insert into road_segments table with corrected distance calculation
    await client.query(`
      INSERT INTO road_segments (
        osm_id,
        name,
        road_type,
        geometry,
        distance,
        safety_rating,
        traffic_level,
        sidewalk_available,
        bike_lane_available
      )
      SELECT 
        osm_id,
        name,
        highway as road_type,
        ST_GeomFromText(geometry, 4326) as geometry,
        -- Convert meters to miles (1 meter = 0.000621371 miles)
        ROUND((ST_Length(ST_Transform(ST_GeomFromText(geometry, 4326), 3857)) * 0.000621371)::numeric, 2) as distance,
        CASE 
          WHEN highway IN ('footway', 'path', 'pedestrian', 'cycleway') THEN 'high'
          WHEN highway IN ('residential', 'service') THEN 'medium'
          ELSE 'low'
        END as safety_rating,
        CASE 
          WHEN highway IN ('footway', 'path', 'pedestrian', 'cycleway', 'service') THEN 'low'
          WHEN highway IN ('residential') THEN 'medium'
          ELSE 'high'
        END as traffic_level,
        CASE 
          WHEN highway IN ('footway', 'path', 'pedestrian') THEN true
          ELSE false
        END as sidewalk_available,
        CASE 
          WHEN highway IN ('cycleway') THEN true
          ELSE false
        END as bike_lane_available
      FROM temp_roads;
    `);

    await client.query('COMMIT');
    console.log('Road segments imported successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error importing road segments:', err);
  } finally {
    client.release();
    pool.end();
  }
}

importRoads(); 