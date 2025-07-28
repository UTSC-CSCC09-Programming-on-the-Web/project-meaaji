# Draw2Play Setup
Below is a step by step guide to clone, build, and run the Draw2Play application on a remote setup:
>


## Prerequisites

- Node.js (version 18 or higher)
- PostgreSQL (version 12 or higher)
- npm or yarn package manager
- Python (version 3.11.x)

## 1. Clone the Repo

To get started, you can either:

- Visit the [project repository](https://github.com/UTSC-CSCC09-Programming-on-the-Web/project-meaaji) and download the ZIP file manually

**OR**

- Clone the repository using Git:

```bash
git clone https://github.com/UTSC-CSCC09-Programming-on-the-Web/project-meaaji.git
```

## 2. Install Dependencies

Navigate into the respective directories and install the required dependencies:

**Frontend**  
  ```bash
  cd frontend
  npm install
  ```

**Backend**
  ```bash
  cd backend
  npm install
  ```

**metaAPI**
  ```bash
  cd metaAPI/AnimatedDrawings
  pip install -r requirements.txt
  ```

## 2.5 Change Filepaths

In the `metaAPI/animation_api.py` file, update the Python path:

- **Line 26**: Change `PYTHON_PATH` to the location of your Python executable (preferably Python 3.11.x).
- **Line 95**: Update the path similarly to reflect your local Python installation.

> 💡 Example:
> ```python
> PYTHON_PATH = "C:/Users/YourUsername/AppData/Local/Programs/Python/Python311/python.exe"
> ```

## 3. Setting Up Environment Variables

There are two `.env` files in this project that need configuration:

### Frontend `.env`
- Go to the `frontend` folder.
- Obtain your **Google OAuth Client ID** and **Stripe Publishable Key**.
- Add these values to the frontend `.env` file:

```env
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

### Root `.env`

- Update the **PostgreSQL password** with your database password.
- Obtain and add your:
  - **Google OAuth Client ID** and **Client Secret**
  - **JWT Secret** (a long, random string)
  - **Stripe Secret Key**
- Procure API keys for AI services from the following platforms and add them:
  - [Stability AI Platform](https://platform.stability.ai/)
  - [Cohere Dashboard](https://dashboard.cohere.com/welcome/login)
- Add all of these values to the `.env` file:
```env
# PostgreSQL database password
DB_PASSWORD=your_postgresql_password_here

# JWT secret key (make this a long, random string)
JWT_SECRET=your_jwt_secret_here

# Google OAuth credentials
GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret_here
GOOGLE_CALLBACK_URL=your_google_callback_url_here

# Stripe API secret key
STRIPE_SECRET_KEY=your_stripe_secret_key_here
MONTHLY_PRICE_ID=

# AI service API keys
CO_API_KEY=your_cohere_api_key_here
STABILITY_API_KEY=your_stability_api_key_here
```

## 4. Create the Databases
create the postgreSQL databases:
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

next run the Database Migrations to create the tables

```bash
npm run migrate
```

## 5. Starting the Application
**IMPORTANT:** This application requires 5 terminals running concurrently to start.

1. **Start the Redis Server**

```bash
docker run -d -p 6379:6379 --name redis redis
```

2. **Start the backend**
```bash
cd backend
node server.js
```

3. **Start the PromptWorker**
```bash
cd backend
node server.js
```

4. **Start the Flask Server**
```bash
cd metaAPI/AnimatedDrawings
python animation_api.py
```

5. **Start Stripe**
```bash 
stripe login
stripe listen --forward-to localhost:3000/webhook
``` 
**Note: Copy the webhook secret from the output and add it to the root .env.**
>

# 6. FAQ/Helpful Information

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - `http://localhost:5173/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)

## Stripe Setup (Test Mode)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Switch to **Test mode**
3. Get API keys from **Developers** → **API keys**
4. Create subscription product:
   - Go to **Products** → **Add product**
   - Set name: "Monthly Subscription"
   - Set pricing: Recurring, Monthly, $9.99
   - Copy the **Price ID**