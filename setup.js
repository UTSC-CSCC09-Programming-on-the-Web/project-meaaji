const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function setup() {
  console.log('🚀 Setting up Draw2StoryPlay project...\n');

  // Check if .env file exists
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file from template...');
    try {
      const envExample = fs.readFileSync(path.join(__dirname, 'env.example'), 'utf8');
      fs.writeFileSync(envPath, envExample);
      console.log('✓ .env file created successfully');
      console.log('⚠️  Please update the .env file with your actual database credentials and API keys\n');
    } catch (error) {
      console.error('✗ Error creating .env file:', error.message);
    }
  } else {
    console.log('✓ .env file already exists');
  }

  // Install dependencies
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✓ Dependencies installed successfully\n');
  } catch (error) {
    console.error('✗ Error installing dependencies:', error.message);
    process.exit(1);
  }

  // Test database connection
  console.log('🔍 Testing database connection...');
  try {
    const { pool } = require('./config/database');
    await pool.query('SELECT 1');
    console.log('✓ Database connection successful\n');
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    console.log('Please ensure:');
    console.log('1. PostgreSQL is running');
    console.log('2. Draw2PlayDB database exists');
    console.log('3. Your database credentials in .env are correct\n');
    process.exit(1);
  }

  // Run migrations
  console.log('🗄️  Running database migrations...');
  try {
    execSync('npm run migrate', { stdio: 'inherit' });
    console.log('✓ Database migrations completed successfully\n');
  } catch (error) {
    console.error('✗ Error running migrations:', error.message);
    process.exit(1);
  }

  console.log('🎉 Setup completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Update your .env file with actual credentials and API keys');
  console.log('2. Run "npm run dev" to start the development server');
  console.log('3. Visit http://localhost:3000/api/health to test the API');
  console.log('4. Check http://localhost:3000/api for available endpoints');
}

// Run setup
setup().catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
}); 