# NexCareer Web — Claude Code Context

## Project Overview
NexCareer Web is the Next.js migration of the Flutter NexCareer app - an AI-powered career companion for job seekers.
- **Creator:** Hoonana (solo developer)
- **Target Users:** Fresh graduates, career switchers, anyone job hunting
- **Goal:** Help job seekers track applications, prep for interviews, and find their career path

## Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Hosting | Vercel |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| LLM | Groq API (free tier) |
| PDF Parsing | unpdf (server-side) |
| Markdown | react-markdown |

## Project Structure
```
src/
├── app/
│   ├── layout.tsx                 # Root layout with Toaster
│   ├── page.tsx                   # Landing page
│   ├── globals.css                # Tailwind + theme variables
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx     # Main dashboard with stats
│   │   ├── tracker/
│   │   │   ├── page.tsx           # Applications list
│   │   │   ├── add/page.tsx       # Add new application
│   │   │   └── [id]/page.tsx      # Application detail/edit
│   │   ├── profile/
│   │   │   ├── page.tsx           # View profile
│   │   │   └── edit/page.tsx      # Edit profile
│   │   ├── assistant/page.tsx     # AI chat assistant
│   │   ├── coach/page.tsx         # Interview coach
│   │   ├── search/page.tsx        # Search applications
│   │   └── settings/page.tsx      # Account settings
│   └── api/
│       ├── chat/route.ts          # AI assistant API
│       ├── resume/route.ts        # Resume upload & parsing
│       └── interview/
│           ├── route.ts           # Generate interview questions
│           └── feedback/route.ts  # Get answer feedback
│
├── components/
│   ├── layout/
│   │   └── app-shell.tsx          # Main layout with sidebar, topbar, mobile nav
│   ├── ui/                        # shadcn/ui components
│   └── resume-upload.tsx          # Resume upload component
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser Supabase client
│   │   └── server.ts              # Server Supabase client
│   └── utils.ts                   # Utility functions (cn)
│
└── types/
    └── database.ts                # TypeScript types for DB
```

## Environment Variables
```env
# .env.local (NEVER COMMIT)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```

## Database Schema

### Table: profiles
```sql
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  summary TEXT,
  skills TEXT[] DEFAULT '{}',
  education JSONB DEFAULT '[]',
  experience JSONB DEFAULT '[]',
  resume_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### Table: applications
```sql
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  status TEXT DEFAULT 'Applied' CHECK (status IN ('Saved', 'Applied', 'Interview', 'Offer', 'Rejected')),
  applied_date DATE,
  job_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: practice_sessions
```sql
CREATE TABLE practice_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  questions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Theme Colors (NexCareer Brand)
```css
--bright-green: #9FE870;    /* Primary accent, buttons */
--forest-green: #163300;    /* Primary dark, text on bright-green */
--content-primary: #0E0F0C;
--content-secondary: #454745;
--content-tertiary: #6A6C6A;
```

## Key Features

### 1. Authentication
- Email/password signup & login
- Supabase Auth with middleware protection
- Auto-redirect based on auth state

### 2. Resume Upload & Parsing
- PDF upload to Supabase Storage
- Server-side text extraction using `unpdf`
- AI parsing with Groq to extract: name, email, phone, skills, education, experience
- Smart merge: new resume data merges with existing profile (doesn't overwrite manual edits)

### 3. Profile Management
- View profile with skills tags, education, experience cards
- Edit all profile fields
- Profile linked to resume parsing

### 4. Application Tracker
- Add/edit/delete job applications
- 5 status types: Saved, Applied, Interview, Offer, Rejected
- Filter by status
- Search across company, position, notes

### 5. AI Assistant
- Chat interface with markdown rendering
- Context-aware (has access to user profile & applications)
- Suggested prompts for new users
- Cooldown to prevent spam

### 6. Interview Coach
- Select an application to practice for
- AI generates relevant interview questions
- Answer questions and get AI feedback
- Practice sessions saved to database

### 7. Search
- Global search from topbar (desktop)
- Search applications + quick actions
- Dedicated search page (mobile)

### 8. Settings
- Account management
- Data privacy options
- Danger zone (delete account)

## Groq API Configuration
- **Model:** `llama-3.1-8b-instant`
- **Endpoint:** `https://api.groq.com/openai/v1/chat/completions`
- **Rate Limit:** 30 requests/minute (free tier)

## Common Commands
```bash
# Development
npm run dev

# Build
npm run build

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

## Component Patterns

### App Shell
All dashboard pages use `<AppShell>` which provides:
- Collapsible desktop sidebar (state persisted in localStorage)
- Desktop topbar with search, notifications, user menu
- Mobile header with hamburger menu
- Mobile bottom navigation
- Mobile search sheet

### Status Badge Colors
```typescript
const statusColors: Record<ApplicationStatus, string> = {
  Saved: 'bg-gray-100 text-gray-700',
  Applied: 'bg-[rgba(22,51,0,0.08)] text-forest-green border border-forest-green',
  Interview: 'bg-amber-100 text-amber-700',
  Offer: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
}
```

## Migration Notes (Flutter → Next.js)
- Flutter used `syncfusion_flutter_pdf` client-side; Next.js uses `unpdf` server-side
- Flutter used Provider for state; Next.js uses React hooks + server components
- Both share the same Supabase backend and database schema
- UI components recreated using shadcn/ui + Tailwind to match Flutter NexUI design

## Current Status
- [x] Project setup & configuration
- [x] Authentication (login/signup)
- [x] Dashboard with stats
- [x] Application tracker (CRUD)
- [x] Profile view & edit
- [x] Resume upload & AI parsing
- [x] AI Assistant with markdown
- [x] Interview Coach
- [x] Search functionality
- [x] Settings page
- [x] Responsive design (mobile + desktop)
- [x] App shell with sidebar, topbar, mobile nav
