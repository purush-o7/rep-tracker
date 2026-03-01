# GymTracker

A mobile-first gym tracker to log workouts, build streaks, track progress, and reach your fitness goals.

Built with **Next.js 16**, **Supabase**, **shadcn/ui**, and **Tailwind CSS**.

## Features

- **Exercise Library** -- Browse 120+ exercises with muscle group tags and YouTube demos
- **Workout Logging** -- Log sets, reps, and weight with quick-entry forms
- **Routines** -- Group exercises into reusable routines (e.g. Push Day, Pull Day)
- **Today Page** -- Plan your daily session from routines or individual picks, track completion
- **Progress Charts** -- Weekly activity, muscle group distribution, and volume trends
- **Streak Tracking** -- Current and longest streak with public leaderboard
- **Partner System** -- Add workout partners, view/log workouts on their behalf
- **Admin Panel** -- Manage users, exercises, and tags (super_admin role)
- **Dark Mode** -- Default dark theme with light mode toggle
- **Responsive** -- Mobile-first with drawer/sheet UI on small screens

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Actions) |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| UI | shadcn/ui, Radix UI, Tailwind CSS |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Fonts | Outfit (headings), DM Sans (body) |

## Prerequisites

- **Node.js** 18+
- **npm** (or pnpm/yarn/bun)
- A **Supabase** account (free tier works)

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/gym-tracker.git
cd gym-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

#### Create a project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Pick a region close to your users and set a database password
3. Wait for the project to finish provisioning

#### Run the migrations

The database schema is managed through migrations. You have two options:

**Option A: Using the Supabase Dashboard (SQL Editor)**

Run each migration file in order from the `supabase/migrations/` directory in the Supabase SQL Editor. The migrations set up:

1. `001_enums` -- Custom enum types (`user_role`, `gender`, `partner_status`)
2. `002_tables` -- Core tables (`profiles`, `workouts`, `tags`, `workout_tags`, `workout_images`, `workout_logs`, `workout_sets`)
3. `003_triggers_functions` -- Auto-create profile on signup, update timestamps
4. `004_indexes` -- Performance indexes
5. `005_rls_policies` -- Row Level Security policies for all tables
6. `006_storage` -- Storage bucket for workout images
7. `007_views` -- `weekly_activity` and `muscle_group_activity` views
8. `008_seed_tags` -- Seed 11 muscle group tags (biceps, triceps, back, legs, chest, shoulders, core, cardio, glutes, forearms, full_body)
9. `009_workout_partners` -- Partner system table and policies
10. `010_user_handles_privacy` -- Handle column and privacy settings
11. `011_public_profile_rls` -- Public profile visibility
12. `012_security_fixes` -- Security hardening
13. `fix_rls_infinite_recursion` -- Fix recursive RLS policies
14. `optimize_rls_policies` -- Performance-optimized RLS using `(select auth.uid())`
15. `add_youtube_url_to_workouts` -- YouTube URL column on workouts
16. `workout_groups` -- Routines (workout groups + items)
17. `simplify_workout_groups_remove_days` -- Remove day-of-week from routines
18. `create_daily_plan_items` -- Today page daily planning table
19. `add_streak_columns_to_profiles` -- Streak tracking columns

**Option B: Using the Supabase CLI**

```bash
npx supabase db push
```

#### Enable Auth

1. In the Supabase Dashboard, go to **Authentication > Providers**
2. Make sure **Email** provider is enabled (it's on by default)
3. Optionally configure email templates under **Authentication > Email Templates**

#### Get your API keys

1. Go to **Settings > API** in your Supabase Dashboard
2. Copy the **Project URL** and **anon/public key** (publishable key)
3. Copy the **service_role key** (secret key -- keep this private)

### 4. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
SUPABASE_SECRET_KEY=your-service-role-key
```

> **Important:** Never commit `.env.local` to version control. It's already in `.gitignore`.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Create your first account

1. Click **Get Started** on the landing page
2. Sign up with email and password
3. Check your email for the confirmation link (or disable email confirmation in Supabase Auth settings for local dev)

### 7. (Optional) Make yourself an admin

To access the admin panel at `/admin`, update your role in the Supabase SQL Editor:

```sql
UPDATE profiles SET role = 'super_admin' WHERE id = 'your-user-id';
```

You can find your user ID in **Authentication > Users** in the Supabase Dashboard.

## Database Schema

```
profiles          -- User profiles (auto-created on signup)
workouts          -- Exercise catalog (admin-managed)
tags              -- Muscle group tags
workout_tags      -- Many-to-many: workouts <-> tags
workout_images    -- Exercise images (Supabase Storage)
workout_logs      -- Individual workout log entries
workout_sets      -- Sets within a log (reps, weight)
workout_partners  -- Partner relationships
workout_groups    -- Routines (named groups of exercises)
workout_group_items -- Exercises within a routine
daily_plan_items  -- Today's planned workouts
```

All tables have Row Level Security (RLS) enabled. Users can only access their own data.

## Project Structure

```
src/
  app/
    (auth)/             -- Login, signup, forgot/reset password
    (admin)/admin/      -- Admin panel (users, workouts, tags)
    (dashboard)/        -- Main app (behind auth)
      dashboard/        -- Dashboard with stats and charts
      today/            -- Daily workout planning
      workouts/         -- Exercise catalog and logging
      routines/         -- Routine management
      my-logs/          -- Workout history
      reports/          -- Progress reports and charts
      partners/         -- Partner management
      settings/         -- Profile settings
    page.tsx            -- Landing page
  components/
    ui/                 -- shadcn/ui primitives
    responsive-sheet-drawer.tsx
    search-input.tsx
    data-pagination.tsx
  lib/
    supabase/           -- Supabase client (server, middleware, admin, auth)
    types/              -- TypeScript types (database schema + composites)
    data/               -- Data fetching utilities
    validators/         -- Zod schemas
    constants.ts        -- Nav items, muscle groups
    pagination.ts       -- Pagination helpers
  hooks/                -- Custom React hooks
```

## Scripts

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Deployment

The app is configured for **Vercel** deployment. See `vercel.json` for configuration.

1. Push your code to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add the three environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`)
4. Deploy

## Contributing

### Getting set up

1. Fork the repo
2. Clone your fork and install dependencies
3. Set up Supabase (see [Getting Started](#getting-started) above)
4. Create a branch for your feature: `git checkout -b feat/my-feature`

### Development workflow

- The app uses **Next.js App Router** with Server Components and Server Actions
- Data mutations go through Server Actions (`actions.ts` files) -- not API routes
- UI components come from **shadcn/ui** -- run `npx shadcn@latest add <component>` to add new ones
- All database queries use the **Supabase JS client** -- no raw SQL in app code
- Every table has **RLS policies** -- new tables must have RLS enabled with appropriate policies

### Code style

- TypeScript strict mode
- Tailwind CSS for styling (no CSS modules)
- `lucide-react` for icons
- `sonner` for toast notifications
- Responsive: mobile-first with `sm:`, `md:`, `lg:` breakpoints

### Submitting a PR

1. Make sure `npm run build` passes with zero errors
2. Test on both desktop and mobile viewports
3. If you added a new database table, include the migration SQL and RLS policies
4. Open a PR with a clear description of what changed and why

## License

MIT
