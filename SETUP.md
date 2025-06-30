# Draw2StoryPlay Database Setup Guide

This guide will help you set up the Draw2PlayDB PostgreSQL database and configure the Draw2StoryPlay application.

## Prerequisites

- Node.js (version 18 or higher)
- PostgreSQL (version 12 or higher)
- npm or yarn package manager

## Database Setup

### 1. Create the Database

You mentioned you've already created the `Draw2PlayDB` database using the PostgreSQL CLI. If you haven't, here's how:

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create the database
CREATE DATABASE "Draw2PlayDB";

-- Verify the database was created
\l

-- Exit psql
\q
```

### 2. Configure Environment Variables

1. Copy the environment template:
   ```bash
   cp env.example .env
   ```

2. Edit the `.env` file and update the database configuration:
   ```env
   # Database Configuration
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=Draw2PlayDB
   DB_PASSWORD=your_actual_password_here
   DB_PORT=5432
   ```

   **Important**: Replace `your_actual_password_here` with your actual PostgreSQL password.

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Database Migrations

```bash
npm run migrate
```

This will create all the necessary tables:
- `users` - User accounts and authentication
- `drawings` - User drawings and sketches
- `stories` - AI-generated storybooks
- `games` - AI-generated interactive games
- `collaborations` - Collaborative drawing sessions
- `collaboration_participants` - Session participants

### 5. Test the Setup

```bash
npm run dev
```

Visit `http://localhost:3000/api/health` to verify the database connection is working.

## Automated Setup

You can also run the automated setup script:

```bash
node setup.js
```

This script will:
- Create the `.env` file from template
- Install dependencies
- Test database connection
- Run migrations
- Provide next steps

## Database Schema Overview

### Users Table
- Stores user authentication and profile information
- Supports Google OAuth integration
- Tracks subscription status for Stripe payments

### Drawings Table
- Stores user-created drawings as JSONB data
- Supports public/private visibility
- Includes tags and engagement metrics

### Stories Table
- Stores AI-generated storybooks
- Contains story content, audio URLs, and generation status
- Links to original drawings

### Games Table
- Stores AI-generated interactive games
- Contains game configuration and playable URLs
- Tracks game type and difficulty levels

### Collaborations Table
- Manages real-time collaborative drawing sessions
- Supports multiple participants with permissions
- Integrates with Socket.IO for real-time features

## Troubleshooting

### Database Connection Issues

1. **Check PostgreSQL is running**:
   ```bash
   # Windows
   net start postgresql-x64-15
   
   # macOS/Linux
   sudo systemctl status postgresql
   ```

2. **Verify database exists**:
   ```sql
   psql -U postgres -l
   ```

3. **Test connection manually**:
   ```bash
   psql -U postgres -d Draw2PlayDB -c "SELECT version();"
   ```

### Migration Issues

If migrations fail:

1. Check database permissions
2. Ensure the database exists
3. Verify connection credentials in `.env`
4. Run migrations manually:
   ```bash
   node migrations/run-migrations.js
   ```

### Port Conflicts

If port 3000 is in use:
1. Change the port in `.env`:
   ```env
   PORT=3001
   ```
2. Or kill the process using port 3000

## Next Steps

After successful setup:

1. **Configure OAuth**: Set up Google OAuth credentials in `.env`
2. **Configure Stripe**: Add Stripe API keys for payment processing
3. **Set up Redis**: Install Redis for BullMQ task queues
4. **Configure AI Services**: Add API keys for story/game generation
5. **Start Development**: Begin building the frontend and additional features

## API Endpoints

Once running, the following endpoints will be available:

- `GET /api/health` - Database and server health check
- `GET /api` - API information and available endpoints
- `GET /api/users` - User management (to be implemented)
- `GET /api/drawings` - Drawing management (to be implemented)
- `GET /api/stories` - Story management (to be implemented)
- `GET /api/games` - Game management (to be implemented)

## Support

If you encounter issues:

1. Check the console output for error messages
2. Verify all prerequisites are installed
3. Ensure database credentials are correct
4. Check that PostgreSQL is running and accessible 