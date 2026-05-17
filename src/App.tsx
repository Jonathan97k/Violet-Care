import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Planner from './pages/Planner';
import Notes from './pages/Notes';
import Tools from './pages/Tools';
import Wellness from './pages/Wellness';
import Messages from './pages/Messages';
import Moments from './pages/Moments';
import Profile from './pages/Profile';
import Decompression from './pages/Decompression';
import LetterBox from './pages/LetterBox';
import BottomNav from './components/layout/BottomNav';
import OfflineIndicator from './components/shared/OfflineIndicator';
import AIChat from './components/shared/AIChat';
import { isAdminSession } from './utils/adminAuth';
import { initTheme } from './utils/theme';

const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const Admin = lazy(() => import('./pages/Admin'));

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // TEMP: Bypass auth for development
  return <PageWrapper>{children}</PageWrapper>;
}

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  return isAdminSession() ? <PageWrapper>{children}</PageWrapper> : <Navigate to="/admin-login" replace />;
}

function App() {
  const location = useLocation();
  const hideNavRoutes = ['/splash', '/auth', '/onboarding', '/admin-login', '/admin'];
  const showBottomNav = !hideNavRoutes.includes(location.pathname);

  useEffect(() => {
    initTheme();
  }, []);

  return (
    <div className="app-shell">
      <OfflineIndicator />
      <div className="mesh-circle-1" />
      <div className="mesh-circle-2" />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/splash" element={<Splash />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/auth" element={<Auth />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/planner"
            element={
              <ProtectedRoute>
                <Planner />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/tools"
            element={
              <ProtectedRoute>
                <Tools />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/wellness"
            element={
              <ProtectedRoute>
                <Wellness />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/moments"
            element={
              <ProtectedRoute>
                <Moments />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/notes"
            element={
              <ProtectedRoute>
                <Notes />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/decompression"
            element={
              <ProtectedRoute>
                <Decompression />
              </ProtectedRoute>
            }
          />

          <Route
            path="/letterbox"
            element={
              <ProtectedRoute>
                <LetterBox />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin-login"
            element={
              <Suspense fallback={
                <div className="min-h-screen bg-violet-950 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                </div>
              }>
                <AdminLogin />
              </Suspense>
            }
          />
          <Route
            path="/admin"
            element={
              <Suspense fallback={
                <div className="min-h-screen bg-violet-950 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                </div>
              }>
                <AdminProtectedRoute>
                  <Admin />
                </AdminProtectedRoute>
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      
      {showBottomNav && <BottomNav />}
      <AIChat />
    </div>
  );
}

export default App;
