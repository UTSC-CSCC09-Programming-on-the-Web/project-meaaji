const fs = require("fs");
const path = require("path");
const { query } = require("../config/database");

// Create migrations table to track which migrations have been run
const createMigrationsTable = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✓ Migrations table created/verified");
  } catch (error) {
    console.error("Error creating migrations table:", error);
    throw error;
  }
};

// Check if a migration has already been executed
const isMigrationExecuted = async (filename) => {
  try {
    const result = await query(
      "SELECT id FROM migrations WHERE filename = $1",
      [filename],
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("Error checking migration status:", error);
    throw error;
  }
};

// Mark a migration as executed
const markMigrationExecuted = async (filename) => {
  try {
    await query("INSERT INTO migrations (filename) VALUES ($1)", [filename]);
  } catch (error) {
    console.error("Error marking migration as executed:", error);
    throw error;
  }
};

// Execute a single migration file
const executeMigration = async (filename) => {
  try {
    const filePath = path.join(__dirname, filename);
    const sql = fs.readFileSync(filePath, "utf8");

    console.log(`Executing migration: ${filename}`);
    await query(sql);
    await markMigrationExecuted(filename);
    console.log(`✓ Migration ${filename} executed successfully`);
  } catch (error) {
    console.error(`✗ Error executing migration ${filename}:`, error);
    throw error;
  }
};

// Get all migration files in order
const getMigrationFiles = () => {
  const files = fs
    .readdirSync(__dirname)
    .filter((file) => file.endsWith(".sql"))
    .sort(); // This will sort them alphabetically, so 001_, 002_, etc. will be in order

  return files;
};

// Run all migrations
const runMigrations = async () => {
  try {
    console.log("Starting database migrations...");

    // Create migrations table if it doesn't exist
    await createMigrationsTable();

    // Get all migration files
    const migrationFiles = getMigrationFiles();
    console.log(`Found ${migrationFiles.length} migration files`);

    // Execute each migration in order
    for (const filename of migrationFiles) {
      const isExecuted = await isMigrationExecuted(filename);

      if (isExecuted) {
        console.log(`- Migration ${filename} already executed, skipping`);
      } else {
        await executeMigration(filename);
      }
    }

    console.log("✓ All migrations completed successfully!");
  } catch (error) {
    console.error("✗ Migration failed:", error);
    process.exit(1);
  }
};

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log("Database setup complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Database setup failed:", error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
