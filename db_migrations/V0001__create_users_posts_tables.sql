-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    faction VARCHAR(255),
    custom_role VARCHAR(255),
    status VARCHAR(255),
    avatar TEXT,
    is_banned BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Insert owner account
INSERT INTO users (username, password, role, avatar) 
VALUES ('TOURIST_WAGNERA', 'wagnera_tut$45$', 'owner', 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner')
ON CONFLICT (username) DO NOTHING;

-- Insert welcome post
INSERT INTO posts (user_id, title, content)
SELECT id, 'Добро пожаловать на Russian Town!', 'Рады приветствовать вас на официальном сайте сервера Russian Town в Brick Rigs!'
FROM users WHERE username = 'TOURIST_WAGNERA'
ON CONFLICT DO NOTHING;