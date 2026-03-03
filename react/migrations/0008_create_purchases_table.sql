-- Migration: Create purchases table
CREATE TABLE purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    items TEXT NOT NULL, -- JSON string of purchased items
    total_amount DECIMAL(10, 2) NOT NULL,
    purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    stripe_payment_id TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);