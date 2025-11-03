# ProtomForms - Separated Architecture

ProtomForms is now restructured as a modern, scalable application with separate frontend and backend services.

## Architecture Overview

The application has been split into two independent services:

```
ProtomForms/
├── protomforms-backend/     # Next.js API server (Port 3001)
├── protomforms-frontend/    # React application (Port 3000)
├── protomforms/            # Original monolithic application (legacy)
└── README.md              # This file
```

## Services

### Backend (protomforms-backend)
- **Technology**: Next.js 14 (API routes only)
- **Port**: 3001
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Azure AD, Google OAuth
- **Features**: RESTful API, file uploads, Teams integration

### Frontend (protomforms-frontend)
- **Technology**: React 18 with TypeScript
- **Port**: 3000
- **UI**: Tailwind CSS + Radix UI components
- **Routing**: React Router
- **Features**: Responsive design, role-based access, real-time updates

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Azure AD application (optional, for SSO)

### 1. Start the Backend

```bash
cd protomforms-backend
npm install
cp env.example .env
# Edit .env with your configuration
npx prisma migrate dev
npm run dev
```

Backend will be available at `http://localhost:3001`

### 2. Start the Frontend

```bash
cd protomforms-frontend
npm install
cp env.example .env
# Edit .env to point to backend
npm start
```

Frontend will be available at `http://localhost:3000`

## Key Benefits of Separation

### Scalability
- **Independent Scaling**: Frontend and backend can be scaled separately
- **Technology Flexibility**: Each service can use optimal technologies
- **Team Separation**: Frontend and backend teams can work independently

### Performance
- **Static Frontend**: Frontend can be deployed to CDN
- **API Optimization**: Backend optimized for API performance
- **Caching**: Better caching strategies for each service

### Deployment
- **Independent Deployments**: Deploy frontend and backend separately
- **Zero Downtime**: Update one service without affecting the other
- **Environment Flexibility**: Different hosting strategies for each service

### Development
- **Clear Separation**: Well-defined API contracts
- **Parallel Development**: Teams can work on both services simultaneously
- **Testing**: Easier to test each service independently

## API Communication

The frontend communicates with the backend through:

- **Base URL**: `http://localhost:3001` (configurable)
- **Authentication**: Cookie-based sessions with CORS
- **Error Handling**: Centralized error handling
- **Type Safety**: Shared TypeScript interfaces

## Environment Configuration

### Backend (.env)
```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
AZURE_AD_CLIENT_ID="..."
AZURE_AD_CLIENT_SECRET="..."
AZURE_AD_TENANT_ID="..."
```

### Frontend (.env)
```bash
REACT_APP_API_URL="http://localhost:3001"
```

## Deployment Strategies

### Development
- Backend: `npm run dev` on port 3001
- Frontend: `npm start` on port 3000

### Production

#### Option 1: Separate Hosting
- **Backend**: Deploy to Vercel, Railway, or similar Node.js hosting
- **Frontend**: Deploy to Vercel, Netlify, or static hosting

#### Option 2: Container Deployment
- Use Docker containers for each service
- Deploy with Docker Compose or Kubernetes

#### Option 3: Monorepo Deployment
- Deploy both services to the same infrastructure
- Use reverse proxy to route requests

## Migration from Monolithic

The original monolithic application (`protomforms/`) is preserved for reference. Key changes:

### What Was Moved
- **API Routes**: All `/api/*` routes moved to backend
- **Database Logic**: Prisma schema and migrations
- **Authentication**: NextAuth.js configuration
- **Business Logic**: Form processing, user management

### What Was Recreated
- **UI Components**: Rebuilt with modern React patterns
- **Pages**: Converted from Next.js pages to React components
- **Routing**: Migrated from Next.js router to React Router
- **State Management**: Implemented with React Context

## Development Workflow

1. **Start Backend**: Ensure API server is running
2. **Start Frontend**: Start React development server
3. **API Changes**: Update backend, frontend automatically reflects changes
4. **UI Changes**: Update frontend, no backend restart needed

## Testing

### Backend Testing
```bash
cd protomforms-backend
npm test
```

### Frontend Testing
```bash
cd protomforms-frontend
npm test
```

## Monitoring and Debugging

### Backend
- API documentation available at `http://localhost:3001`
- Database inspection with Prisma Studio: `npx prisma studio`
- Logs available in console

### Frontend
- React DevTools for component inspection
- Network tab for API call monitoring
- Console logs for debugging

## Contributing

1. **Backend Changes**: Work in `protomforms-backend/`
2. **Frontend Changes**: Work in `protomforms-frontend/`
3. **API Changes**: Update both backend implementation and frontend integration
4. **Database Changes**: Update Prisma schema and create migrations

## Support

For issues and questions:
- Backend issues: Check `protomforms-backend/README.md`
- Frontend issues: Check `protomforms-frontend/README.md`
- Architecture questions: Refer to this document

## License

© 2024 ProtomForms by Protom Group. All rights reserved.


