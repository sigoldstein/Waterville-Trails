-- Drop existing users table if it exists
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a default admin user (password: admin123)
INSERT INTO users (name, email, password_hash)
VALUES ('Admin User', 'admin@example.com', '$2a$10$X7J3QZq3Yq3Yq3Yq3Yq3YO3Yq3Yq3Yq3Yq3Yq3Yq3Yq3Yq3Yq3Yq')
ON CONFLICT (email) DO NOTHING; 