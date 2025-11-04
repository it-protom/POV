import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoadingProvider } from './components/LoadingProvider';
import { Toaster } from 'sonner';

// Pages
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import FormsPage from './pages/FormsPage';
import FormDetailPage from './pages/FormDetailPage';
import UserFormsPage from './pages/UserFormsPage';

// Admin Pages
import AdminDashboard from './pages/admin/dashboard/page';
import AdminForms from './pages/admin/forms/page';
import AdminFormsNew from './pages/admin/forms/new/page';
import AdminFormDetail from './pages/admin/forms/[id]/page';
import AdminFormEdit from './pages/admin/forms/[id]/edit/page';
import AdminFormPreview from './pages/admin/forms/[id]/preview/page';
import AdminFormResponses from './pages/admin/forms/[id]/responses/page';
import AdminFormResults from './pages/admin/forms/[id]/results/page';
import AdminFormShare from './pages/admin/forms/[id]/share/page';
import AdminResponses from './pages/admin/responses/page';
import AdminResponseDetail from './pages/admin/responses/[slug]/page';
import AdminResponseProgressive from './pages/admin/responses/[slug]/[progressive]/page';
import AdminSettings from './pages/admin/settings/page';
import AdminUsers from './pages/admin/users/page';
import AdminAnalytics from './pages/admin/analytics/page';
import AdminMigrateResponses from './pages/admin/migrate-responses/page';

// User Pages
import UserForms from './pages/user/forms/page';
import UserResponses from './pages/user/responses/page';
import UserResponseDetails from './pages/user/responses/[slug]/[progressive]/page';

// Auth Pages
import AuthSignIn from './pages/auth/signin/page';
import AuthSignInClient from './pages/auth/signin/SignInClient';
import AuthRegister from './pages/auth/register/page';
import AuthError from './pages/auth/error/page';
import AzureCallback from './pages/auth/callback/AzureCallback';

// Forms Pages
import FormsList from './pages/forms/page';
import FormPublic from './pages/forms/[id]/page';

// Setup Page
import SetupPage from './pages/setup/page';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

function App() {
  return (
    <AuthProvider>
      <LoadingProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Auth routes - Redirect /login to /auth/signin */}
            <Route path="/login" element={<Navigate to="/auth/signin" replace />} />
            <Route path="/auth/signin" element={<AuthSignIn />} />
            <Route path="/auth/register" element={<AuthRegister />} />
            <Route path="/auth/error" element={<AuthError />} />
            <Route path="/auth/callback/azure-ad" element={<AzureCallback />} />
            
            {/* Setup route */}
            <Route path="/setup" element={<SetupPage />} />
            
            {/* Public forms */}
            <Route path="/forms" element={<FormsList />} />
            <Route path="/forms/:id" element={<FormPublic />} />
            
            {/* Admin routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className="min-h-screen">
                    <Navbar />
                    <div className="pt-16">
                      <AdminDashboard />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/forms"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className="min-h-screen">
                    <Navbar />
                    <div className="pt-16">
                      <AdminForms />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/forms/new"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className="min-h-screen">
                    <Navbar />
                    <div className="pt-16">
                      <AdminFormsNew />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/forms/:id"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className="min-h-screen">
                    <Navbar />
                    <div className="pt-16">
                      <AdminFormDetail />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/forms/:id/edit"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className="min-h-screen">
                    <Navbar />
                    <div className="pt-16">
                      <AdminFormEdit />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/forms/:id/preview"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className="min-h-screen">
                    <Navbar />
                    <div className="pt-16">
                      <AdminFormPreview />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/forms/:id/responses"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className="min-h-screen">
                    <Navbar />
                    <div className="pt-16">
                      <AdminFormResponses />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/forms/:id/results"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className="min-h-screen">
                    <Navbar />
                    <div className="pt-16">
                      <AdminFormResults />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/forms/:id/share"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className="min-h-screen">
                    <Navbar />
                    <div className="pt-16">
                      <AdminFormShare />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/responses"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className="min-h-screen">
                    <Navbar />
                    <div className="pt-16">
                      <AdminResponses />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/responses/:slug"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className="min-h-screen">
                    <Navbar />
                    <div className="pt-16">
                      <AdminResponseDetail />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/responses/:slug/:progressive"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className="min-h-screen">
                    <Navbar />
                    <div className="pt-16">
                      <AdminResponseProgressive />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className="min-h-screen">
                    <Navbar />
                    <div className="pt-16">
                      <AdminSettings />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className="min-h-screen">
                    <Navbar />
                    <div className="pt-16">
                      <AdminUsers />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className="min-h-screen">
                    <Navbar />
                    <div className="pt-16">
                      <AdminAnalytics />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/migrate-responses"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className="min-h-screen">
                    <Navbar />
                    <div className="pt-16">
                      <AdminMigrateResponses />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            
            {/* User routes */}
            <Route
              path="/user/forms"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen">
                    <Navbar />
                    <div className="pt-16">
                      <UserForms />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/responses"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen">
                    <Navbar />
                    <div className="pt-16">
                      <UserResponses />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/responses/:slug/:progressive"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen">
                    <Navbar />
                    <div className="pt-16">
                      <UserResponseDetails />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            
            {/* Legacy routes for backward compatibility */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className="min-h-screen">
                    <Navbar />
                    <div className="pt-16">
                      <AdminDashboard />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/forms"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className="min-h-screen">
                    <Navbar />
                    <div className="pt-16">
                      <AdminForms />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/forms/:id"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className="min-h-screen">
                    <Navbar />
                    <div className="pt-16">
                      <AdminFormDetail />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/forms"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen">
                    <Navbar />
                    <div className="pt-16">
                      <UserForms />
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* Global toast notifications */}
          <Toaster position="top-right" />
    </div>
        </Router>
      </LoadingProvider>
    </AuthProvider>
  );
}

export default App;