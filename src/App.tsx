import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Auth/Login';
import { Sidebar } from './components/Layout/Sidebar';
import { MobileNav } from './components/Layout/MobileNav';
import { AdminDashboard } from './components/Dashboard/AdminDashboard';
import { ANODashboard } from './components/Dashboard/ANODashboard';
import { ClerkCODashboard } from './components/Dashboard/ClerkCODashboard';
import { ManageUsers } from './components/Admin/ManageUsers';
import { ManageUnits } from './components/Admin/ManageUnits';
import { ManageColleges } from './components/Admin/ManageColleges';
import { ManageAnoContacts } from './components/Admin/ManageAnoContacts';
import { TestGoogleSheetsConnection } from './components/Admin/TestGoogleSheetsConnection';
import { DebugEmailMatching } from './components/Admin/DebugEmailMatching';
import { CampNotifications } from './components/Camp/CampNotifications';
import { CampVacancies } from './components/Dashboard/CampVacancies';
import { SubmitCadets } from './components/Dashboard/SubmitCadets';
import { UploadDocuments } from './components/Dashboard/UploadDocuments';
import { TrackStatus } from './components/Dashboard/TrackStatus';
import { motion, AnimatePresence } from 'framer-motion';

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"
    />
  </div>
);

const DashboardContent = () => {
  const { userData } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderDashboard = () => {
    switch (userData?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'ano':
        return <ANODashboard />;
      case 'clerk':
      case 'co':
        return <ClerkCODashboard />;
      default:
        return <AdminDashboard />;
    }
  };

  const renderPage = () => {
    if (currentPage === 'dashboard') {
      return renderDashboard();
    }

    if (currentPage === 'users' && userData?.role === 'admin') {
      return <ManageUsers />;
    }

    if (currentPage === 'units' && userData?.role === 'admin') {
      return <ManageUnits />;
    }

    if (currentPage === 'colleges' && userData?.role === 'admin') {
      return <ManageColleges />;
    }

    if (currentPage === 'ano-contacts' && userData?.role === 'admin') {
      return <ManageAnoContacts />;
    }

    if (currentPage === 'test-api' && userData?.role === 'admin') {
      return <TestGoogleSheetsConnection />;
    }

    if (currentPage === 'debug-emails' && userData?.role === 'admin') {
      return <DebugEmailMatching />;
    }

    if (currentPage === 'notifications' && (userData?.role === 'clerk' || userData?.role === 'co')) {
      return <CampNotifications />;
    }

    // ANO specific pages
    if (currentPage === 'vacancies' && userData?.role === 'ano') {
      return <CampVacancies />;
    }

    if (currentPage === 'submit' && userData?.role === 'ano') {
      return <SubmitCadets />;
    }

    if (currentPage === 'documents' && userData?.role === 'ano') {
      return <UploadDocuments />;
    }

    if (currentPage === 'status' && userData?.role === 'ano') {
      return <TrackStatus />;
    }

    return (
      <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)} Page
        </h2>
        <p className="text-gray-600">This page is under development</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <MobileNav currentPage={currentPage} onNavigate={setCurrentPage} />

      <main className="lg:ml-64 min-h-screen p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
        <AnimatePresence mode="wait">
          <PageWrapper key={currentPage}>
            {renderPage()}
          </PageWrapper>
        </AnimatePresence>
      </main>
    </div>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return user ? <DashboardContent /> : <Login />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
