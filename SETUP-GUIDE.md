# ProtomForms Setup Guide

## Quick Start

### Automated Setup
```bash
# Fix common setup issues
node fix-setup.js

# Start both services
node start-dev.js
```

### Manual Setup

#### 1. Backend Setup
```bash
cd protomforms-backend
npm install
cp env.example .env
# Edit .env with your database configuration
npx prisma migrate dev
npm run dev
```

#### 2. Frontend Setup
```bash
cd protomforms-frontend
npm install
cp env.example .env
# Edit .env if needed (default API URL is correct)
npm start
```

## Environment Configuration

### Backend (.env)
```bash
# Required
DATABASE_URL="postgresql://username:password@localhost:5432/protomforms"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"

# Optional (for SSO)
AZURE_AD_CLIENT_ID="your-azure-client-id"
AZURE_AD_CLIENT_SECRET="your-azure-client-secret"
AZURE_AD_TENANT_ID="your-azure-tenant-id"
AZURE_AD_REDIRECT_URI="http://localhost:3001/api/auth/callback/azure-ad"

# Optional
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
TEAMS_WEBHOOK_URL="your-teams-webhook-url"
```

### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:3001
```

## Troubleshooting

### Common Issues

#### 1. Tailwind CSS Error
**Error**: `It looks like you're trying to use tailwindcss directly as a PostCSS plugin`

**Solution**: Already fixed in the setup. If you encounter this:
```bash
cd protomforms-frontend
npm uninstall tailwindcss @tailwindcss/postcss
npm install -D tailwindcss@^3.4.0 postcss autoprefixer
```

#### 2. Database Connection Error
**Error**: `Can't reach database server`

**Solution**: 
1. Ensure PostgreSQL is running
2. Check DATABASE_URL in backend/.env
3. Create database if it doesn't exist
4. Run migrations: `cd protomforms-backend && npx prisma migrate dev`

#### 3. CORS Error
**Error**: `Access to fetch at 'http://localhost:3001' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Solution**: Already configured. If issues persist:
1. Check FRONTEND_URL in backend/.env
2. Restart backend server
3. Clear browser cache

#### 4. Authentication Issues
**Error**: Authentication not working

**Solution**:
1. Check NEXTAUTH_SECRET is set in backend/.env
2. Ensure NEXTAUTH_URL matches your backend URL
3. For Azure AD, verify all Azure credentials are correct

#### 5. Port Already in Use
**Error**: `Port 3000/3001 is already in use`

**Solution**:
```bash
# Kill processes on ports
npx kill-port 3000
npx kill-port 3001

# Or use different ports
# Backend: change -p 3001 in package.json
# Frontend: set PORT=3002 in .env
```

### Development Workflow

#### Starting Development
```bash
# Option 1: Automated (recommended)
node start-dev.js

# Option 2: Manual
# Terminal 1:
cd protomforms-backend && npm run dev

# Terminal 2:
cd protomforms-frontend && npm start
```

#### Making Changes
- **Backend changes**: Server auto-restarts
- **Frontend changes**: Browser auto-refreshes
- **Database changes**: Run `npx prisma migrate dev` in backend

#### Testing API
- Backend health: http://localhost:3001/api/health/database
- API documentation: http://localhost:3001
- Frontend app: http://localhost:3000

### Database Management

#### Reset Database
```bash
cd protomforms-backend
npx prisma migrate reset
npx prisma migrate dev
npm run prisma:seed  # Optional: add sample data
```

#### View Database
```bash
cd protomforms-backend
npx prisma studio
```

### Production Deployment

#### Backend Deployment
1. Build: `npm run build`
2. Set production environment variables
3. Run migrations: `npx prisma migrate deploy`
4. Start: `npm start`

#### Frontend Deployment
1. Build: `npm run build`
2. Deploy `build/` folder to static hosting
3. Set REACT_APP_API_URL to production backend URL

### Performance Tips

#### Development
- Use `npm run dev` for backend (faster rebuilds)
- Keep browser dev tools open for debugging
- Use React DevTools extension

#### Production
- Enable gzip compression
- Use CDN for frontend assets
- Configure database connection pooling
- Set up monitoring and logging

## Architecture Overview

```
┌─────────────────┐    HTTP/CORS    ┌─────────────────┐
│                 │◄───────────────►│                 │
│  React Frontend │                 │  Next.js API    │
│  (Port 3000)    │                 │  (Port 3001)    │
│                 │                 │                 │
└─────────────────┘                 └─────────────────┘
                                            │
                                            ▼
                                    ┌─────────────────┐
                                    │                 │
                                    │   PostgreSQL    │
                                    │    Database     │
                                    │                 │
                                    └─────────────────┘
```

## Support

### Getting Help
1. Check this troubleshooting guide
2. Review README files in each service directory
3. Check browser console and terminal logs
4. Verify environment configuration

### Useful Commands
```bash
# Check setup
node test-setup.js

# Fix common issues
node fix-setup.js

# Start development
node start-dev.js

# Backend only
cd protomforms-backend && npm run dev

# Frontend only
cd protomforms-frontend && npm start

# Database management
cd protomforms-backend && npx prisma studio
```

## Success Indicators

✅ Backend starts on http://localhost:3001
✅ Frontend starts on http://localhost:3000
✅ No CORS errors in browser console
✅ Database connection successful
✅ Authentication flow works
✅ API calls from frontend to backend work

When all indicators are green, your separated ProtomForms application is ready! 🎉


