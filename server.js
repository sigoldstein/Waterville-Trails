require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3002;

// Database configuration
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Road segment endpoints
app.get('/api/segments/search', async (req, res) => {
    try {
        const { query, type } = req.query;
        let sqlQuery = 'SELECT id, name, road_type, distance, safety_rating, traffic_level FROM road_segments WHERE 1=1';
        const params = [];
        
        if (query) {
            params.push(`%${query}%`);
            sqlQuery += ` AND name ILIKE $${params.length}`;
        }
        
        if (type) {
            params.push(type);
            sqlQuery += ` AND road_type = $${params.length}`;
        }
        
        sqlQuery += ' ORDER BY name LIMIT 50';
        
        const result = await pool.query(sqlQuery, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error searching segments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/segments/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 1000 } = req.query; // radius in meters, default 1km
        
        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }
        
        const result = await pool.query(`
            SELECT 
                id, name, road_type, 
                ST_AsGeoJSON(geometry) as geometry,
                distance, safety_rating, traffic_level,
                ST_Distance(
                    geometry::geography,
                    ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
                ) as distance_from_point
            FROM road_segments
            WHERE ST_DWithin(
                geometry::geography,
                ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
                $3
            )
            ORDER BY distance_from_point
            LIMIT 100
        `, [lat, lng, radius]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching nearby segments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/segments/filtered', async (req, res) => {
    try {
        console.log('Received filter request:', req.body);
        
        const { 
            searchText,
            roadType,
            hasSidewalk,
            hasBikeLane,
            safetyRating,
            trafficLevel
        } = req.body;
        
        // First, let's check if we have any data at all
        const countResult = await pool.query('SELECT COUNT(*) FROM road_segments');
        console.log('Total segments in database:', countResult.rows[0].count);
        
        let sqlQuery = `
            SELECT 
                id, 
                name, 
                road_type,
                ST_AsGeoJSON(geometry) as geometry,
                COALESCE(distance, 0) as length,
                safety_rating,
                traffic_level,
                sidewalk_available as has_sidewalk,
                bike_lane_available as has_bike_lane
            FROM road_segments 
            WHERE 1=1
        `;
        const params = [];
        
        // Only apply search filter if there's actual text
        if (searchText && searchText.trim() !== '') {
            params.push(`%${searchText}%`);
            sqlQuery += ` AND name ILIKE $${params.length}`;
        }
        
        // Only apply road type filter if a type is selected
        if (roadType && roadType !== '') {
            params.push(roadType);
            sqlQuery += ` AND road_type = $${params.length}`;
        }
        
        // Only apply safety rating filter if a rating is selected
        if (safetyRating && safetyRating !== '') {
            params.push(safetyRating);
            sqlQuery += ` AND safety_rating = $${params.length}`;
        }
        
        // Only apply traffic level filter if a level is selected
        if (trafficLevel && trafficLevel !== '') {
            params.push(trafficLevel);
            sqlQuery += ` AND traffic_level = $${params.length}`;
        }
        
        // Handle sidewalk filter - if checked, show only with sidewalks, if unchecked, show all
        if (hasSidewalk === true) {
            sqlQuery += ' AND sidewalk_available = true';
        }
        
        // Handle bike lane filter - if checked, show only with bike lanes, if unchecked, show all
        if (hasBikeLane === true) {
            sqlQuery += ' AND bike_lane_available = true';
        }
        
        sqlQuery += ' ORDER BY name LIMIT 100';
        
        console.log('Executing SQL query:', sqlQuery);
        console.log('With parameters:', params);
        
        const result = await pool.query(sqlQuery, params);
        console.log('Query returned', result.rows.length, 'segments');
        
        // If no results with filters, try without filters to see what data we have
        if (result.rows.length === 0) {
            const allSegments = await pool.query(`
                SELECT 
                    id, 
                    name, 
                    road_type,
                    ST_AsGeoJSON(geometry) as geometry,
                    COALESCE(distance, 0) as length,
                    safety_rating,
                    traffic_level,
                    sidewalk_available as has_sidewalk,
                    bike_lane_available as has_bike_lane
                FROM road_segments 
                ORDER BY name 
                LIMIT 100
            `);
            console.log('Sample of all segments:', allSegments.rows);
            res.json(allSegments.rows);
        } else {
            res.json(result.rows);
        }
    } catch (error) {
        console.error('Error fetching filtered segments:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

app.get('/api/segments/:id', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id, name, road_type,
                ST_AsGeoJSON(geometry) as geometry,
                distance, safety_rating, traffic_level,
                sidewalk_available, bike_lane_available,
                description
            FROM road_segments 
            WHERE id = $1
        `, [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Segment not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching segment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Test endpoint to check database connection and data
app.get('/api/test', async (req, res) => {
    try {
        // Test database connection
        const result = await pool.query('SELECT COUNT(*) FROM road_segments');
        console.log('Database connection successful. Total segments:', result.rows[0].count);
        
        // Get a sample of segments
        const sampleResult = await pool.query('SELECT * FROM road_segments LIMIT 5');
        console.log('Sample segments:', sampleResult.rows);
        
        res.json({
            connection: 'success',
            totalSegments: result.rows[0].count,
            sampleSegments: sampleResult.rows
        });
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({ error: 'Database connection failed', details: error.message });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 
