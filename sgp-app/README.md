# Sistema de Gestión Publicitaria (SGP) - Frontend

This is the Next.js application for the SGP project.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

This project requires a `.env.local` file in the root of this directory (`sgp-app/`) for connecting to Supabase and the rendering engine.

Create a file named `.env.local` and add the following variables:

```
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL

# Supabase Public Anon Key
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Base URL for the dedicated rendering server
RENDERER_BASE_URL=http://localhost:3001
```

Replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_ANON_KEY` with the actual credentials from your Supabase project.

### 3. Run the Development Server

To start the frontend application, run:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

**Note:** This application requires the dedicated rendering server (located in the `/renderer` directory) to be running for video generation features to work. Please see the `README.md` in that directory for setup instructions.
