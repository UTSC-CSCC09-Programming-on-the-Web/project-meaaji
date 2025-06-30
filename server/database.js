import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize SQLite database
const db = new sqlite3.Database(join(__dirname, 'users.db'));

// Create users table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      picture TEXT,
      stripe_customer_id TEXT,
      subscription_status TEXT DEFAULT 'inactive',
      subscription_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Database helper functions
export const dbHelpers = {
  // Get user by Google ID
  getUser: (googleId) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [googleId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Create or update user
  upsertUser: (userData) => {
    return new Promise((resolve, reject) => {
      const { id, email, name, picture } = userData;
      db.run(`
        INSERT OR REPLACE INTO users (id, email, name, picture, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [id, email, name, picture], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },

  // Update user subscription status
  updateSubscription: (googleId, subscriptionData) => {
    return new Promise((resolve, reject) => {
      const { stripeCustomerId, subscriptionStatus, subscriptionId } = subscriptionData;
      db.run(`
        UPDATE users 
        SET stripe_customer_id = ?, subscription_status = ?, subscription_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [stripeCustomerId, subscriptionStatus, subscriptionId, googleId], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  },

  // Get user by Stripe customer ID
  getUserByStripeId: (stripeCustomerId) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE stripe_customer_id = ?', [stripeCustomerId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Get user by email
  getUserByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
};

export default db;