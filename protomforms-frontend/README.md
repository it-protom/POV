# ProtomForms Frontend

React frontend application for the ProtomForms platform.

## Features

- **Modern UI**: Built with React 18, TypeScript, and Tailwind CSS
- **Component Library**: Radix UI components with custom styling
- **Authentication**: Integrated with backend authentication system
- **Responsive Design**: Mobile-first responsive design
- **Form Management**: Create, edit, and manage forms and surveys
- **Analytics Dashboard**: Real-time statistics and data visualization
- **Role-based Access**: Admin and user role management

## Getting Started

### Prerequisites

- Node.js 18+
- ProtomForms Backend running on port 3001

### Installation

1. Navigate to the frontend directory:
```bash
cd protomforms-frontend
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
```
REACT_APP_API_URL=http://localhost:3001
```

### Development

Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

### Building for Production

Build the application:
```bash
npm run build
```

The build artifacts will be stored in the `build/` directory.

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── ui/           # Base UI components (Button, Card, etc.)
│   ├── Navbar.tsx    # Navigation component
│   └── ...
├── contexts/         # React contexts
│   └── AuthContext.tsx
├── hooks/            # Custom React hooks
├── lib/              # Utility libraries
│   ├── api.ts        # API client configuration
│   └── utils.ts      # Utility functions
├── pages/            # Page components
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   └── ...
├── types/            # TypeScript definitions
├── App.tsx           # Main application component
└── index.tsx         # Application entry point
```

## Key Components

### Authentication
- `AuthContext`: Manages user authentication state
- `ProtectedRoute`: Route protection based on user roles
- `LoginPage`: Authentication interface

### Pages
- `LandingPage`: Public homepage
- `DashboardPage`: Admin dashboard with statistics
- `FormsPage`: Form management interface
- `UserFormsPage`: User form completion interface

### UI Components
- Built on Radix UI primitives
- Custom styling with Tailwind CSS
- Consistent design system with ProtomForms branding

## API Integration

The frontend communicates with the backend through:

- **Axios HTTP client**: Configured with interceptors
- **Authentication**: Cookie-based session management
- **Error handling**: Centralized error handling and user feedback
- **Loading states**: UI feedback for async operations

## Routing

The application uses React Router for navigation:

- `/` - Landing page (public)
- `/login` - Authentication page (public)
- `/dashboard` - Admin dashboard (admin only)
- `/admin/forms` - Form management (admin only)
- `/admin/forms/:id` - Form details (admin only)
- `/user/forms` - User forms (authenticated users)

## Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Custom Design System**: ProtomForms branding colors and components
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Ready for dark mode implementation

## Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:3001` |
| `REACT_APP_NAME` | Application name | `ProtomForms` |
| `REACT_APP_VERSION` | Application version | `1.0.0` |

## Deployment

The frontend can be deployed to any static hosting service:

1. Build the application:
```bash
npm run build
```

2. Deploy the `build/` directory to your hosting service

Popular deployment options:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Azure Static Web Apps

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Implement proper error boundaries

### Component Development
- Keep components small and focused
- Use proper prop typing
- Implement loading and error states
- Follow accessibility guidelines

### State Management
- Use React Context for global state
- Local state for component-specific data
- Custom hooks for reusable logic