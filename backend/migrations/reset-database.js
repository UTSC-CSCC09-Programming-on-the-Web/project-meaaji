import { query } from "../config/database.js";

const resetDatabase = async () => {
  try {
    console.log("⚠️  WARNING: This will drop all tables and recreate them!");
    console.log("This will delete all data in the database.");
    
    // Drop all tables
    console.log("Dropping all tables...");
    await query(`
      DROP TABLE IF EXISTS migrations CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS storybooks CASCADE;
    `);
    console.log("✓ All tables dropped");

    // Run migrations to recreate tables
    console.log("Running migrations to recreate tables...");
    const { runMigrations } = await import('./run-migrations.js');
    await runMigrations();
    
    console.log("✓ Database reset completed successfully!");
  } catch (error) {
    console.error("✗ Database reset failed:", error);
    process.exit(1);
  }
};

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  resetDatabase()
    .then(() => {
      console.log("Database reset complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Database reset failed:", error);
      process.exit(1);
    });
}

export { resetDatabase }; 