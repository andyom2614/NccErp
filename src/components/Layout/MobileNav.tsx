import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  FileText,
  School,
  Activity,
  Upload,
  CheckSquare,
  FileCheck,
  Download,
  Menu,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

interface MobileNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const mobileMenuItems = {
  admin: [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'notifications', icon: FileText, label: 'Notifications' },
    { id: 'vacancies', icon: School, label: 'Vacancies' },
    { id: 'menu', icon: Menu, label: 'Menu' },
  ],
  ano: [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'vacancies', icon: School, label: 'Vacancies' },
    { id: 'submit', icon: Upload, label: 'Submit' },
    { id: 'status', icon: Activity, label: 'Status' },
    { id: 'menu', icon: Menu, label: 'Menu' },
  ],
  clerk: [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'notifications', icon: FileText, label: 'Notifications' },
    { id: 'review', icon: CheckSquare, label: 'Review' },
    { id: 'verify', icon: FileCheck, label: 'Verify' },
    { id: 'menu', icon: Menu, label: 'Menu' },
  ],
  co: [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'notifications', icon: FileText, label: 'Notifications' },
    { id: 'review', icon: CheckSquare, label: 'Review' },
    { id: 'verify', icon: FileCheck, label: 'Verify' },
    { id: 'menu', icon: Menu, label: 'Menu' },
  ],
};

const roleColors = {
  admin: 'bg-blue-600',
  ano: 'bg-green-600',
  clerk: 'bg-orange-600',
  co: 'bg-orange-600',
};

export const MobileNav = ({ currentPage, onNavigate }: MobileNavProps) => {
  const { userData, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const role = userData?.role || 'admin';
  const items = mobileMenuItems[role];
  const activeColor = roleColors[role];

  const handleLogout = async () => {
    try {
      await logout();
      setShowMenu(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavClick = (itemId: string) => {
    if (itemId === 'menu') {
      setShowMenu(!showMenu);
    } else {
      onNavigate(itemId);
      setShowMenu(false);
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg"
      >
        <div className="flex justify-around items-center h-20 px-2 py-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                whileTap={{ scale: 0.9 }}
                className={`flex flex-col items-center justify-center flex-1 h-16 rounded-lg transition-all ${
                  isActive ? `${activeColor} text-white` : 'text-gray-600'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.nav>

      {showMenu && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowMenu(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute bottom-16 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4">More Options</h3>
            
            {/* User Profile Section */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${activeColor} flex items-center justify-center`}>
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{userData?.name || 'User'}</p>
                  <p className="text-sm text-gray-600 capitalize">{role}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {role === 'ano' && (
                <button
                  onClick={() => {
                    onNavigate('documents');
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100"
                >
                  <FileCheck size={20} />
                  <span>Upload Documents</span>
                </button>
              )}
              {(role === 'clerk' || role === 'co') && (
                <button
                  onClick={() => {
                    onNavigate('finalize');
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100"
                >
                  <CheckSquare size={20} />
                  <span>Finalize Selection</span>
                </button>
              )}
              {role === 'admin' && (
                <>
                  <button
                    onClick={() => {
                      onNavigate('logs');
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100"
                  >
                    <Activity size={20} />
                    <span>System Logs</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('reports');
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100"
                  >
                    <Download size={20} />
                    <span>Reports</span>
                  </button>
                </>
              )}
              
              {/* Logout Button */}
              <div className="border-t pt-2 mt-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};
