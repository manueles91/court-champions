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

## Rutas añadidas (PRD Pádel)

- `/events`: listado de pozos/torneos
- `/events/:id`: detalle del evento con pestañas de jugadores, partidos y resultados

## Database Setup (Supabase)

This project uses Supabase (PostgreSQL) as the backend database. The database schema includes tables for tournaments, players, pairs, matches, and statistics with automated triggers for business logic.

### Database Schema

The database includes the following tables:
- **users**: Player information with unique identity constraints
- **tournaments**: Tournament/event information with type and format enums
- **pairs**: Player pairs for tournament participation
- **tournament_enrollments**: Links players to tournaments via pairs
- **matches**: Match results with automatic winner calculation
- **match_stats**: Individual player statistics per match (auto-generated)
- **tournament_stats**: Player standings and points per tournament

### Running Migrations

The database schema is managed through Supabase migrations. All migrations are automatically applied when you use the Lovable platform.

**Option 1: Via Lovable (Recommended)**
- Migrations are applied automatically when using the Lovable AI assistant
- No manual intervention required

**Option 2: Via Supabase Dashboard**
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/gowdzpmgukttnvzxilmw/sql/new)
2. Copy the contents of migration files from `supabase/migrations/`
3. Execute the SQL commands

**Option 3: Via Supabase CLI**
```sh
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref gowdzpmgukttnvzxilmw

# Apply migrations
supabase db push
```

### Running Seed Data

To populate the database with demo data (8 players, 1 tournament, pairs, and sample matches):

**Via Supabase Dashboard:**
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/gowdzpmgukttnvzxilmw/sql/new)
2. Copy the contents of `supabase/seed.sql`
3. Execute the SQL

**Via Supabase CLI:**
```sh
# Execute seed file
supabase db reset --db-url [your-database-url]
# Or manually execute
psql [your-database-url] < supabase/seed.sql
```

### Database Features

- **Automatic Stats**: Match results automatically generate player statistics
- **Winner Calculation**: Match winners are automatically determined from game scores
- **Data Validation**: Triggers ensure data consistency and business rules
- **UUID Primary Keys**: All tables use UUID primary keys for scalability
- **Row Level Security**: RLS policies are enabled (currently set to public access)
- **Timestamps**: Automatic `created_at` and `updated_at` tracking
