# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/f5fcf2d5-3b72-468f-af5e-4e51ab02f09c

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/f5fcf2d5-3b72-468f-af5e-4e51ab02f09c) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f5fcf2d5-3b72-468f-af5e-4e51ab02f09c) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Database Setup (Supabase)

This project uses Supabase as the backend database. The database schema includes tables for users, tournaments, pairs, matches, and statistics with automated triggers for match validation and stats calculation.

### Running Migrations

**Option 1: Via Supabase Dashboard (Recommended)**
1. Go to the [SQL Editor](https://supabase.com/dashboard/project/court-champions/sql/new) in your Supabase project
2. Copy and paste the contents of the migration files from `supabase/migrations/`
3. Click "Run" to execute the migration

**Option 2: Via Supabase CLI**
```sh
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref court-champions

# Push migrations
supabase db push
```

### Running Seed Data

**Via Supabase Dashboard:**
1. Go to the [SQL Editor](https://supabase.com/dashboard/project/court-champions/sql/new)
2. Copy and paste the contents of `supabase/seed.sql`
3. Click "Run" to populate test data

**Via Supabase CLI:**
```sh
supabase db reset --linked
```

The seed data includes:
- 8 test players
- 1 sample tournament "Pozo Test Agosto 2025"
- 4 pairs of players
- Tournament enrollments
- 2 sample matches with scores
- Calculated match and tournament statistics

### Database Schema

- **users**: Player profiles with unique identity constraints
- **tournaments**: Tournament information with type and format
- **pairs**: Player pairs for each tournament
- **tournament_enrollments**: Player registrations
- **matches**: Match results with automated winner calculation
- **match_stats**: Individual player statistics per match
- **tournament_stats**: Overall tournament rankings and points

### Security

All tables have Row Level Security (RLS) enabled with permissive policies for development. Tighten these policies when implementing authentication.

## Rutas añadidas (PRD Pádel)

- `/events`: listado de pozos/torneos
- `/events/:id`: detalle del evento con pestañas de jugadores, partidos y resultados
