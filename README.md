# Backend Wizards — Stage 1 Task: Data Persistence & API Design

This API integrates with several external services (Genderize, Agify, and Nationalize) to create enriched user profiles based on a single name. It handles data persistence using Postgres and provides endpoints for managing these profiles.

## Features
- **Data Persistence**: Stores user profiles in a Postgres database.
- **Idempotency**: Prevents duplicate profiles for the same name.
- **Multi-API Integration**: Fetches gender, age, and nationality data in parallel.
- **Filtering**: Advanced filtering for profile lists by gender, country, and age group.
- **Error Handling**: Robust error handling for external API failures.
- **CORS Support**: Enabled for all origins.

## Technology Stack
- Node.js
- Express.js
- Postgres (via `pg` driver)
- Axios (for API requests)
- UUID v10 (for UUID v7 support)

## API Endpoints

### 1. Create Profile
`POST /api/profiles`
- **Request Body**: `{ "name": "ella" }`
- **Success Response (201)**: Returns the newly created profile.
- **Duplicate Response (200)**: Returns the existing profile with a message.

### 2. Get Single Profile
`GET /api/profiles/{id}`
- **Success Response (200)**: Returns the profile details.
- **Error Response (404)**: Profile not found.

### 3. Get All Profiles
`GET /api/profiles`
- **Query Parameters**: `gender`, `country_id`, `age_group` (all optional and case-insensitive).
- **Success Response (200)**: Returns a list of simplified profiles and the total count.

### 4. Delete Profile
`DELETE /api/profiles/{id}`
- **Success Response (204)**: Profile deleted (No Content).

## Setup Instructions

### Prerequisites
- Node.js installed.
- A Postgres database (e.g., Supabase, Vercel Postgres, or local).

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database
   PORT=3000
   ```

### Running Locally
```bash
npm run dev
```

## Deployment on Vercel

1. **Push your code** to a GitHub repository.
2. **Import the project** in the [Vercel Dashboard](https://vercel.com/dashboard).
3. **Configure Environment Variables**:
   - Add `DATABASE_URL` (your Postgres connection string).
4. **Deploy**.

> [!NOTE]
> Make sure your Postgres database (e.g., Supabase) allows connections from Vercel's IP addresses (usually handled by allowing all IPs `0.0.0.0/0` in the database firewall).

## License
MIT
