import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import JoinBatch from './pages/public/JoinBatch';

// Dashboards
import StudentDashboard from './pages/dashboards/StudentDashboard';
import TrainerDashboard from './pages/dashboards/TrainerDashboard';
import InstitutionDashboard from './pages/dashboards/InstitutionDashboard';
import ProgrammeManagerDashboard from './pages/dashboards/ProgrammeManagerDashboard';
import ProgrammeManagerInstitutions from './pages/dashboards/ProgrammeManagerInstitutions';
import MonitoringOfficerDashboard from './pages/dashboards/MonitoringOfficerDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';

// Sub-pages
import PMInstitutions from './pages/dashboards/pm/PMInstitutions';
import PMTrainers from './pages/dashboards/pm/PMTrainers';
import PMStudents from './pages/dashboards/pm/PMStudents';
import PMManagers from './pages/dashboards/pm/PMManagers';
import PMNotifications from './pages/dashboards/pm/PMNotifications';
import InstitutionBatches from './pages/dashboards/institution/InstitutionBatches';
import InstitutionTrainers from './pages/dashboards/institution/InstitutionTrainers';
import InstitutionAttendance from './pages/dashboards/institution/InstitutionAttendance';
import InstitutionNotifications from './pages/dashboards/institution/InstitutionNotifications';
import TrainerSessions from './pages/dashboards/trainer/TrainerSessions';
import TrainerInvites from './pages/dashboards/trainer/TrainerInvites';
import TrainerNotifications from './pages/dashboards/trainer/TrainerNotifications';
import StudentSessions from './pages/dashboards/student/StudentSessions';
import StudentAttendance from './pages/dashboards/student/StudentAttendance';
import DashboardNotifications from './pages/dashboards/shared/DashboardNotifications';
import MOAnalytics from './pages/dashboards/mo/MOAnalytics';
import MONotifications from './pages/dashboards/mo/MONotifications';
import Profile from './pages/dashboards/Profile';

import skillBridge1Img from './assets/skill_bridge1-removebg-preview.png';

const Preloader = ({ finishLoading }) => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white"
    >
      <motion.img 
        src={skillBridge1Img} 
        alt="SkillBridge Logo"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 1, 
          repeat: Infinity, 
          repeatType: 'reverse' 
        }}
        className="w-48 h-auto"
        onError={(e) => { e.target.style.display='none'; }}
      />
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute mt-32 text-2xl font-bold text-blue-600"
      >
        SkillBridge
      </motion.h1>
    </motion.div>
  );
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading Auth...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;

  return children;
};

import DashboardLayout from './components/layout/DashboardLayout';

const PublicLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-grow bg-gray-50">
      {children}
    </main>
    <Footer />
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes with Navbar/Footer */}
      <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
      <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
      <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
      <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
      <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
      <Route path="/join/:id" element={
        <ProtectedRoute allowedRoles={['STUDENT']}><JoinBatch /></ProtectedRoute>
      } />
      
      {/* Dashboard Routes with DashboardLayout */}
      {/* Student */}
      <Route path="/dashboard/student" element={
        <ProtectedRoute allowedRoles={['STUDENT']}><DashboardLayout><StudentDashboard /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/student/sessions" element={
        <ProtectedRoute allowedRoles={['STUDENT']}><DashboardLayout><StudentSessions /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/student/trainers" element={
        <ProtectedRoute allowedRoles={['STUDENT']}><DashboardLayout><PMTrainers isReadOnly={true} /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/student/attendance" element={
        <ProtectedRoute allowedRoles={['STUDENT']}><DashboardLayout><StudentAttendance /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/student/notifications" element={
        <ProtectedRoute allowedRoles={['STUDENT']}><DashboardLayout><DashboardNotifications /></DashboardLayout></ProtectedRoute>
      } />

      {/* Trainer */}
      <Route path="/dashboard/trainer" element={
        <ProtectedRoute allowedRoles={['TRAINER']}><DashboardLayout><TrainerDashboard /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/trainer/sessions" element={
        <ProtectedRoute allowedRoles={['TRAINER']}><DashboardLayout><TrainerSessions /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/trainer/batches" element={
        <ProtectedRoute allowedRoles={['TRAINER']}><DashboardLayout><TrainerInvites /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/trainer/notifications" element={
        <ProtectedRoute allowedRoles={['TRAINER']}><DashboardLayout><TrainerNotifications /></DashboardLayout></ProtectedRoute>
      } />

      {/* Institution */}
      <Route path="/dashboard/institution" element={
        <ProtectedRoute allowedRoles={['INSTITUTION']}><DashboardLayout><InstitutionDashboard /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/institution/batches" element={
        <ProtectedRoute allowedRoles={['INSTITUTION']}><DashboardLayout><InstitutionBatches /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/institution/students" element={
        <ProtectedRoute allowedRoles={['INSTITUTION']}><DashboardLayout><PMStudents isReadOnly={true} /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/institution/trainers" element={
        <ProtectedRoute allowedRoles={['INSTITUTION']}><DashboardLayout><InstitutionTrainers /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/institution/attendance" element={
        <ProtectedRoute allowedRoles={['INSTITUTION']}><DashboardLayout><InstitutionAttendance /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/institution/notifications" element={
        <ProtectedRoute allowedRoles={['INSTITUTION']}><DashboardLayout><InstitutionNotifications /></DashboardLayout></ProtectedRoute>
      } />

      {/* Programme Manager */}
      <Route path="/dashboard/programme-manager" element={
        <ProtectedRoute allowedRoles={['PROGRAMME_MANAGER']}><DashboardLayout><ProgrammeManagerDashboard /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/programme-manager/institutions" element={
        <ProtectedRoute allowedRoles={['PROGRAMME_MANAGER']}><DashboardLayout><ProgrammeManagerInstitutions /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/programme-manager/trainers" element={
        <ProtectedRoute allowedRoles={['PROGRAMME_MANAGER']}><DashboardLayout><PMTrainers /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/programme-manager/students" element={
        <ProtectedRoute allowedRoles={['PROGRAMME_MANAGER']}><DashboardLayout><PMStudents /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/programme-manager/managers" element={
        <ProtectedRoute allowedRoles={['PROGRAMME_MANAGER']}><DashboardLayout><PMManagers /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/programme-manager/notifications" element={
        <ProtectedRoute allowedRoles={['PROGRAMME_MANAGER']}><DashboardLayout><PMNotifications /></DashboardLayout></ProtectedRoute>
      } />

      {/* Monitoring Officer */}
      <Route path="/dashboard/monitoring-officer" element={
        <ProtectedRoute allowedRoles={['MONITORING_OFFICER']}><DashboardLayout><MonitoringOfficerDashboard /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/monitoring-officer/notifications" element={
        <ProtectedRoute allowedRoles={['MONITORING_OFFICER']}><DashboardLayout><MONotifications /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/monitoring-officer/institutions" element={
        <ProtectedRoute allowedRoles={['MONITORING_OFFICER']}><DashboardLayout><PMInstitutions isReadOnly={true} /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/monitoring-officer/trainers" element={
        <ProtectedRoute allowedRoles={['MONITORING_OFFICER']}><DashboardLayout><PMTrainers isReadOnly={true} /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/monitoring-officer/students" element={
        <ProtectedRoute allowedRoles={['MONITORING_OFFICER']}><DashboardLayout><PMStudents isReadOnly={true} /></DashboardLayout></ProtectedRoute>
      } />

      {/* Admin */}
      <Route path="/dashboard/admin" element={
        <ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminDashboard /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/admin/institutions" element={
        <ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><PMInstitutions /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/admin/trainers" element={
        <ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><PMTrainers /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/admin/students" element={
        <ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><PMStudents /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/admin/managers" element={
        <ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><PMManagers /></DashboardLayout></ProtectedRoute>
      } />
      <Route path="/dashboard/admin/notifications" element={
        <ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><DashboardNotifications /></DashboardLayout></ProtectedRoute>
      } />

      {/* Shared Profile Route */}
      <Route path="/dashboard/profile" element={
        <ProtectedRoute><DashboardLayout><Profile /></DashboardLayout></ProtectedRoute>
      } />
    </Routes>
  );
};

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dynamically loading based on website traffic/network requests
    // Using window.onload to ensure all assets are loaded, plus a minimum display time
    const handleLoad = () => {
      setTimeout(() => setLoading(false), 800); // Small delay to ensure smooth transition
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <AnimatePresence>
          {loading && <Preloader finishLoading={() => setLoading(false)} />}
        </AnimatePresence>
        {!loading && <AppRoutes />}
      </Router>
    </AuthProvider>
  );
}

export default App;