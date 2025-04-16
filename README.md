# Waterville Routes and Segments

A web application for viewing and managing routes and segments in Waterville.

## Prerequisites

- Docker
- Docker Compose

## Installation

1. Clone the repository
2. Create a `.env` file in the root directory with the following variables:
   ```
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=waterville
   DB_HOST=db
   DB_PORT=5432
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=24h
   ```

## Running the Application

1. Start the application and database:
   ```bash
   docker-compose up --build
   ```

2. Access the application at http://localhost:3000

## Development

- The application is built with Node.js and Express
- The database is PostgreSQL with PostGIS extension
- The frontend is built with vanilla JavaScript and CSS
- The application uses JWT for authentication

## API Endpoints

- `/api/routes` - Get all routes
- `/api/segments` - Get all segments
- `/api/auth/login` - Login
- `/api/auth/logout` - Logout

## License

MIT
