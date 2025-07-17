const { query } = require("../config/database");

class Storybook {
  static async create({ user_id, title, prompt, image_url, pages, images }) {
    const result = await query(
      `INSERT INTO storybooks (user_id, title, prompt, image_url, pages, images) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user_id, title, prompt, image_url, JSON.stringify(pages), JSON.stringify(images)]
    );
    return result.rows[0];
  }

  static async findByUser(user_id) {
    const result = await query(
      `SELECT * FROM storybooks WHERE user_id = $1 ORDER BY created_at DESC`,
      [user_id]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await query(
      `SELECT * FROM storybooks WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async deleteById(id, user_id) {
    const result = await query(
      `DELETE FROM storybooks WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, user_id]
    );
    return result.rowCount > 0;
  }

  static async deleteAllByUser(user_id) {
    await query(
      `DELETE FROM storybooks WHERE user_id = $1`,
      [user_id]
    );
  }
}

module.exports = Storybook; 