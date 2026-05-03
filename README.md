# Waterville Routes and Segments

A web application for viewing and managing routes and segments in Waterville.

## Prerequisites

- Node.js 18+
- npm
- Docker
- Docker Compose

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and adjust values if needed.

## Running the Application

### With Docker

The Docker setup runs PostgreSQL/PostGIS, imports `waterville_trails.csv`, and starts the Express app.

1. Use these database values in `.env` when running with Docker:
   ```bash
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=waterville
   DB_HOST=db
   DB_PORT=5432
   PORT=3000
   NODE_ENV=development
   ```
2. Start the application and database:
   ```bash
   docker-compose up --build
   ```
3. Access the application at http://localhost:3000

### Local Node Server

The server has local defaults matching `.env.example` and listens on port `3000` if `PORT` is not set. A local PostgreSQL/PostGIS database named `waterville` must be running first.

1. Initialize the schema:
   ```bash
   node init_db.js
   ```
2. Import road segment data:
   ```bash
   npm run import
   ```
3. Start the app:
   ```bash
   npm start
   ```
4. Access the application at http://localhost:3000

## Development

- The application is built with Node.js and Express
- The database is PostgreSQL with PostGIS extension
- The frontend is built with vanilla JavaScript and CSS

## API Endpoints

- `GET /api/test` - Check database connection and return sample road segments
- `GET /api/segments/search?query=&type=` - Search road segments by name and/or road type
- `GET /api/segments/nearby?lat=&lng=&radius=` - Find road segments near a coordinate
- `POST /api/segments/filtered` - Return road segments matching frontend filter criteria
- `GET /api/segments/:id` - Get one road segment by id

## License

MIT
