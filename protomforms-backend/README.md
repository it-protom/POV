# ProtomForms Backend

Backend API server for the ProtomForms application built with Next.js.

## Features

- **Authentication**: NextAuth.js with Azure AD, Google OAuth, and credentials
- **Database**: PostgreSQL with Prisma ORM
- **API Routes**: RESTful API for forms, users, responses, and analytics
- **Security**: CORS configuration, authentication middleware
- **File Upload**: Support for file uploads and document parsing
- **Teams Integration**: Microsoft Teams webhook notifications

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Azure AD application (for SSO)

### Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd protomforms-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

Edit `.env` with your configuration:
- Database connection string
- NextAuth.js secret and URL
- Azure AD credentials
- Frontend URL for CORS

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Seed the database (optional):
```bash
npm run prisma:seed
```

### Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

### API Endpoints

- `GET /api/health/database` - Database health check
- `POST /api/auth/signin` - Authentication
- `GET /api/forms` - List forms
- `POST /api/forms` - Create form
- `GET /api/forms/:id` - Get form details
- `GET /api/users` - List users
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/analytics` - Analytics data

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:studio` - Open Prisma Studio

## Architecture

The backend is structured as a Next.js API-only application:

```
src/
├── app/
│   ├── api/           # API routes
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # API documentation page
├── lib/               # Utility libraries
├── types/             # TypeScript definitions
└── ...
```

## Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: Authentication and user management
- **Forms**: Survey/quiz definitions
- **Questions**: Form questions with various types
- **Responses**: User submissions
- **Answers**: Individual question responses

## Authentication

The backend supports multiple authentication methods:

1. **Azure AD**: Enterprise SSO integration
2. **Google OAuth**: Google account authentication  
3. **Credentials**: Email/password authentication

## Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

The backend runs on port 3001 by default.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | Yes |
| `NEXTAUTH_URL` | Backend URL | Yes |
| `AZURE_AD_CLIENT_ID` | Azure AD application ID | For SSO |
| `AZURE_AD_CLIENT_SECRET` | Azure AD client secret | For SSO |
| `AZURE_AD_TENANT_ID` | Azure AD tenant ID | For SSO |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |
| `TEAMS_WEBHOOK_URL` | Teams webhook URL | Optional |


