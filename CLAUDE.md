# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ProtomForms is a form builder and survey management platform with separated frontend and backend architecture. The application supports multiple question types (MULTIPLE_CHOICE, TEXT, RATING, DATE, RANKING, LIKERT, FILE_UPLOAD, NPS, BRANCHING), authentication via Azure AD and credentials, Teams notifications, and comprehensive form analytics.

## Architecture

This is a **separated monorepo** with two independent services:

```
POV/
├── protomforms-backend/     # Next.js 14 API server (Port 3001)
├── protomforms-frontend/    # React 18 + Vite app (Port 3000)
└── protomforms/            # Legacy monolithic app (deprecated, keep for reference)
```

### Backend (protomforms-backend)
- **Stack**: Next.js 14 (API routes only), TypeScript, Prisma ORM, PostgreSQL
- **Auth**: NextAuth.js with Azure AD (single-tenant) and credentials providers
- **Key Features**: RESTful API, file uploads, Teams webhooks, caching layer
- **Port**: 3001

### Frontend (protomforms-frontend)
- **Stack**: React 18, TypeScript, Vite, React Router, Tailwind CSS, Radix UI
- **State**: React Context (AuthContext, LoadingProvider)
- **Key Features**: Drag-and-drop form builder (@dnd-kit), real-time previews, role-based access
- **Port**: 3000

## Development Commands

### Quick Start
```bash
# Automated setup and start both services
node start-dev.js

# Or fix common setup issues first
node fix-setup.js
```

### Backend Development
```bash
cd protomforms-backend
npm install
npm run dev                    # Start dev server on port 3001
npm run build                  # Build for production
npm start                      # Start production server
npm run lint                   # Run ESLint
npm run prisma:generate        # Generate Prisma client
npm run prisma:migrate         # Run database migrations
npm run prisma:studio          # Open Prisma Studio (database GUI)
npm run prisma:seed            # Seed database with sample data
```

### Frontend Development
```bash
cd protomforms-frontend
npm install
npm run dev                    # Start Vite dev server on port 3000
npm run build                  # Build for production
npm run preview                # Preview production build
```

### Database Operations
```bash
cd protomforms-backend

# Create a new migration
npx prisma migrate dev --name description_of_changes

# Reset database (⚠️ destructive)
npx prisma migrate reset

# Deploy migrations to production
npx prisma migrate deploy

# View/edit database
npx prisma studio
```

## Key Patterns and Conventions

### Authentication Flow
1. **Azure AD**: Single-tenant configuration hardcoded in `src/lib/auth.ts` (tenant ID: 94524ed0-9807-4351-bd2e-ba548fd5a31d)
   - Redirect URI must match exactly: `http://localhost:3001/api/auth/callback/azure-ad` (dev) or `https://pov.protom.com/api/auth/callback/azure-ad` (prod)
   - Uses NextAuth.js with PrismaAdapter
2. **Credentials**: Email/password with bcrypt hashing
3. **Session**: Cookie-based sessions with CORS configured for frontend URL

### API Structure
Backend API routes follow Next.js App Router conventions (`src/app/api/`):
- `/api/auth/*` - Authentication endpoints
- `/api/forms/*` - Form CRUD operations
- `/api/forms/[id]/*` - Specific form operations (questions, responses, share, publish, duplicate)
- `/api/responses/*` - Response management
- `/api/users/*` - User management (admin only)
- `/api/dashboard/*` - Dashboard statistics
- `/api/analytics/*` - Analytics data
- `/api/settings/*` - System settings

### Database Models (Prisma)
Core models in `protomforms-backend/prisma/schema.prisma`:
- **User**: email, name, password, role (ADMIN/USER)
- **Form**: title, slug, type (SURVEY/QUIZ), status (DRAFT/PUBLISHED/ARCHIVED), theme (JSON), questions, responses
- **Question**: text, type (enum), required, options (JSON), order
- **Response**: formId, userId, progressiveNumber, score, answers
- **Answer**: responseId, questionId, value (JSON)
- **SystemSettings**: Global settings stored as JSON

### Frontend Routing
Main routes in `src/App.tsx`:
- `/` - Landing page (public)
- `/login` - Login page
- `/dashboard` - Dashboard (protected)
- `/forms` - Forms list (protected)
- `/forms/:id` - Form builder (protected)
- `/forms/:id/responses` - Form responses (protected)
- `/form/:slug` - Public form submission

### State Management
- **AuthContext** (`src/contexts/AuthContext.tsx`): User authentication state, session management
- **LoadingProvider** (`src/components/LoadingProvider.tsx`): Global loading state
- No Redux/MobX - uses React Context and local state

### Styling
- **Tailwind CSS 3.x**: Utility-first CSS framework
- **Radix UI**: Headless UI components (`src/components/ui/*`)
- **Framer Motion**: Animation library for transitions
- **Theme**: Custom CSS variables, dark mode support via theme-provider

## Important Notes

### Azure AD Configuration
⚠️ **CRITICAL**: The Azure AD redirect URI must match **exactly** between:
1. Azure AD Portal app registration
2. `NEXTAUTH_URL` in backend `.env`
3. Hard-coded configuration in `src/lib/auth.ts`

Common redirect URI issues are documented in:
- `AZURE_AD_TENANT_FIX.md`
- `AZURE_AD_SETUP.md`
- `AZURE_AD_REDIRECT_URI_CHECK.md`

### CORS Configuration
Backend middleware (`src/middleware.ts`) allows requests from `FRONTEND_URL`. Ensure this environment variable matches the frontend's actual URL.

### Caching
Backend implements two caching layers:
- `src/lib/cache.ts`: Simple in-memory cache
- `src/lib/advanced-cache.ts`: Advanced caching with TTL and stats

### Question Types
The system supports 9 question types defined in the `QuestionType` enum:
- MULTIPLE_CHOICE: Single or multi-select options
- TEXT: Free-form text input
- RATING: Star or numeric rating
- DATE: Date picker
- RANKING: Drag-to-rank options
- LIKERT: Scale-based responses
- FILE_UPLOAD: File attachments
- NPS: Net Promoter Score (0-10)
- BRANCHING: Conditional logic

### Form Customization
Forms support extensive theme customization stored as JSON in the `theme` field:
- Colors: primary, secondary, background, text
- Typography: font families, sizes, weights
- Layout: spacing, borders, shadows
- Question-specific styling
- Button styling

Customization UI is in `src/components/form-builder/FormCustomization.tsx` with 8 tabs.

### Teams Integration
Forms can send notifications to Microsoft Teams via webhooks:
- Configure `TEAMS_WEBHOOK_URL` in backend `.env`
- API: POST `/api/forms/[id]/send-teams-notification`
- Status tracking: `teamsNotificationSent` and `teamsNotificationSentAt` fields

### Deployment
Production deployment uses:
- Docker Compose (`docker-compose.production.yml`)
- Nginx reverse proxy configuration (`nginx-pov-protom.conf`)
- Deployment scripts: `deploy-production.sh`, `deploy-complete.sh`
- Tarball creation for remote deployment: `create-tarballs.ps1`

See `DEPLOY-INSTRUZIONI.md` and `DEPLOY-SERVER.md` for complete deployment procedures.

## Testing

### Development Testing
```bash
# Test setup
node test-setup.js

# Test backend API
curl http://localhost:3001/api/health/database

# Test Azure AD config
curl http://localhost:3001/api/debug-azure-config
```

### Common Issues
Reference `SETUP-GUIDE.md` for troubleshooting:
- Tailwind CSS PostCSS plugin error
- Database connection failures
- CORS errors
- Authentication issues (especially Azure AD)
- Port conflicts

## File Structure Highlights

### Backend
- `src/app/api/` - All API route handlers
- `src/lib/` - Shared utilities (auth, db, cache, email, validation)
- `src/types/` - TypeScript type definitions
- `prisma/` - Database schema, migrations, seed data

### Frontend
- `src/pages/` - Page components (Dashboard, Forms, Login, Landing, etc.)
- `src/components/` - Reusable UI components
- `src/components/ui/` - Radix UI wrapper components
- `src/components/form-builder/` - Form builder specific components
- `src/contexts/` - React Context providers
- `src/lib/` - API client and utilities

## Environment Variables

### Backend Required
```
DATABASE_URL=postgresql://user:pass@localhost:5432/protomforms
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

### Backend Optional
```
AZURE_AD_CLIENT_ID=...
AZURE_AD_CLIENT_SECRET=...
AZURE_AD_TENANT_ID=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
TEAMS_WEBHOOK_URL=...
```

### Frontend
```
REACT_APP_API_URL=http://localhost:3001
```
