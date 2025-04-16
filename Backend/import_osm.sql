-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Define Waterville's coordinates as a PostGIS point in EPSG:4326
WITH waterville AS (
    SELECT ST_SetSRID(ST_MakePoint(-69.6317, 44.5530), 4326) AS geom
)

-- Select roads and trails within a 10-mile (~16.1 km) radius
SELECT osm_id, name, highway, ST_AsText(ST_Transform(way, 4326))
FROM planet_osm_line, waterville
WHERE highway IN ('path', 'footway', 'cycleway', 'track', 'bridleway', 'unclassified', 'residential')
AND ST_DWithin(
    ST_Transform(way, 4326)::geography, 
    waterville.geom::geography, 
    16100  -- Distance in meters (16.1 km = 10 miles)
);
