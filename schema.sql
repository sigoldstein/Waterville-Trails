-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create tables for Waterville Wander

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create road_segments table
CREATE TABLE IF NOT EXISTS road_segments (
    id SERIAL PRIMARY KEY,
    osm_id BIGINT NOT NULL,
    name VARCHAR(255),
    road_type VARCHAR(50) NOT NULL,
    geometry GEOMETRY(LINESTRING, 4326) NOT NULL,
    distance DECIMAL(10,2),
    elevation_gain DECIMAL(10,2),
    grade DECIMAL(5,2),
    safety_rating VARCHAR(20) CHECK (safety_rating IN ('high', 'medium', 'low')),
    traffic_level VARCHAR(20) CHECK (traffic_level IN ('low', 'medium', 'high')),
    sidewalk_available BOOLEAN,
    bike_lane_available BOOLEAN,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create routes table
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    coordinates JSONB NOT NULL,
    distance DECIMAL(10,2),
    elevation_gain DECIMAL(10,2),
    safety_rating VARCHAR(20) CHECK (safety_rating IN ('high', 'medium', 'low')),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create route_segments table (junction table)
CREATE TABLE IF NOT EXISTS route_segments (
    route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
    segment_id INTEGER REFERENCES road_segments(id) ON DELETE CASCADE,
    segment_order INTEGER NOT NULL,
    PRIMARY KEY (route_id, segment_id)
);

-- Create spatial index on road_segments
CREATE INDEX IF NOT EXISTS road_segments_geometry_idx ON road_segments USING GIST (geometry);

-- Create a function to get road segments within radius
CREATE OR REPLACE FUNCTION get_road_segments_in_radius(
    center_lat FLOAT,
    center_lon FLOAT,
    radius_meters FLOAT
)
RETURNS TABLE (
    id BIGINT,
    osm_id BIGINT,
    name TEXT,
    road_type TEXT,
    geometry GEOMETRY,
    distance FLOAT,
    elevation_gain FLOAT,
    grade FLOAT,
    safety_rating TEXT,
    traffic_level TEXT,
    sidewalk_available BOOLEAN,
    bike_lane_available BOOLEAN,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rs.id,
        rs.osm_id,
        rs.name,
        rs.road_type,
        rs.geometry,
        rs.distance,
        rs.elevation_gain,
        rs.grade,
        rs.safety_rating,
        rs.traffic_level,
        rs.sidewalk_available,
        rs.bike_lane_available,
        rs.description
    FROM road_segments rs
    WHERE ST_DWithin(
        rs.geometry,
        ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326),
        radius_meters
    );
END;
$$ LANGUAGE plpgsql; 