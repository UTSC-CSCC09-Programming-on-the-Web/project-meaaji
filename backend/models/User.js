import {query} from '../config/database.js'

class User {
  // Create a new user
  static async create(userData) {
    const {
      google_id,
      email,
      display_name,
      first_name,
      last_name,
      profile_picture_url,
    } = userData;

    try {
      const result = await query(
        `
        INSERT INTO users (google_id, email, display_name, first_name, last_name, profile_picture_url)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
        [
          google_id,
          email,
          display_name,
          first_name,
          last_name,
          profile_picture_url,
        ],
      );

      return result.rows[0];
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const result = await query("SELECT * FROM users WHERE id = $1", [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error finding user by ID:", error);
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const result = await query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error finding user by email:", error);
      throw error;
    }
  }

  // Find user by Google ID
  static async findByGoogleId(googleId) {
    try {
      const result = await query("SELECT * FROM users WHERE google_id = $1", [
        googleId,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error finding user by Google ID:", error);
      throw error;
    }
  }

  // Update user subscription status
  static async updateSubscriptionStatus(
    userId,
    status,
    subscriptionId = null,
    stripeCustomerId = null,
  ) {
    try {
      const result = await query(
        `
        UPDATE users 
        SET subscription_status = $2, 
            subscription_id = $3, 
            stripe_customer_id = $4,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `,
        [userId, status, subscriptionId, stripeCustomerId],
      );

      return result.rows[0];
    } catch (error) {
      console.error("Error updating subscription status:", error);
      throw error;
    }
  }

  // Update user profile
  static async updateProfile(userId, profileData) {
    const { display_name, first_name, last_name, profile_picture_url } =
      profileData;

    try {
      const result = await query(
        `
        UPDATE users 
        SET display_name = $2,
            first_name = $3,
            last_name = $4,
            profile_picture_url = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `,
        [userId, display_name, first_name, last_name, profile_picture_url],
      );

      return result.rows[0];
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  // Update last login
  static async updateLastLogin(userId) {
    try {
      await query(
        `
        UPDATE users 
        SET last_login = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
        [userId],
      );
    } catch (error) {
      console.error("Error updating last login:", error);
      throw error;
    }
  }

  // Get user statistics
  static async getUserStats(userId) {
    try {
      const result = await query(
        `
        SELECT 
          (SELECT COUNT(*) FROM drawings WHERE user_id = $1) as total_drawings,
          (SELECT COUNT(*) FROM stories WHERE user_id = $1) as total_stories,
          (SELECT COUNT(*) FROM games WHERE user_id = $1) as total_games,
          (SELECT COUNT(*) FROM drawings WHERE user_id = $1 AND is_public = true) as public_drawings,
          (SELECT COUNT(*) FROM stories WHERE user_id = $1 AND is_public = true) as public_stories,
          (SELECT COUNT(*) FROM games WHERE user_id = $1 AND is_public = true) as public_games
      `,
        [userId],
      );

      return result.rows[0];
    } catch (error) {
      console.error("Error getting user stats:", error);
      throw error;
    }
  }

  // Delete user (soft delete)
  static async delete(userId) {
    try {
      const result = await query(
        `
        UPDATE users 
        SET is_active = false, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `,
        [userId],
      );

      return result.rows[0];
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }
}

export default User;
