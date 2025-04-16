#!/bin/bash

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
while ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
  sleep 1
done

# Create database if it doesn't exist
echo "Creating database if it doesn't exist..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME"

# Connect to the database and create tables
echo "Creating tables..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
-- Create segments table
CREATE TABLE IF NOT EXISTS segments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    length DECIMAL(10,2),
    safety_rating INTEGER CHECK (safety_rating BETWEEN 1 AND 5),
    traffic_rating INTEGER CHECK (traffic_rating BETWEEN 1 AND 5),
    geometry GEOMETRY(LineString, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create routes table
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    segments INTEGER[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table (if using authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_segments_geometry ON segments USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_segments_safety_rating ON segments (safety_rating);
CREATE INDEX IF NOT EXISTS idx_segments_traffic_rating ON segments (traffic_rating);
EOF

# Load initial data if CSV file exists
if [ -f "waterville_trails.csv" ]; then
    echo "Loading initial data from CSV..."
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
    \copy segments(name, description, length, safety_rating, traffic_rating, geometry) 
    FROM 'waterville_trails.csv' 
    WITH (FORMAT csv, HEADER true);
EOF
fi

echo "Database initialization complete!" 