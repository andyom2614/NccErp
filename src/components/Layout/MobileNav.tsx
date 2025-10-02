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
  Menu
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

interface MobileNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const mobileMenuItems = {
  admin: [
    { id: 'dashboard', icon: LayoutDashboard },
    { id: 'users', icon: Users },
    { id: 'notifications', icon: FileText },
    { id: 'vacancies', icon: School },
    { id: 'menu', icon: Menu },
  ],
  ano: [
    { id: 'dashboard', icon: LayoutDashboard },
    { id: 'vacancies', icon: School },
    { id: 'submit', icon: Upload },
    { id: 'documents', icon: FileCheck },
    { id: 'menu', icon: Menu },
  ],
  clerk: [
    { id: 'dashboard', icon: LayoutDashboard },
    { id: 'review', icon: CheckSquare },
    { id: 'verify', icon: FileCheck },
    { id: 'finalize', icon: CheckSquare },
    { id: 'menu', icon: Menu },
  ],
  co: [
    { id: 'dashboard', icon: LayoutDashboard },
    { id: 'review', icon: CheckSquare },
    { id: 'verify', icon: FileCheck },
    { id: 'finalize', icon: CheckSquare },
    { id: 'menu', icon: Menu },
  ],
};

const roleColors = {
  admin: 'bg-blue-600',
  ano: 'bg-green-600',
  clerk: 'bg-orange-600',
  co: 'bg-orange-600',
};

export const MobileNav = ({ currentPage, onNavigate }: MobileNavProps) => {
  const { userData } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const role = userData?.role || 'admin';
  const items = mobileMenuItems[role];
  const activeColor = roleColors[role];

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
        <div className="flex justify-around items-center h-16 px-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                whileTap={{ scale: 0.9 }}
                className={`flex flex-col items-center justify-center w-16 h-12 rounded-lg transition-all ${
                  isActive ? `${activeColor} text-white` : 'text-gray-600'
                }`}
              >
                <Icon size={24} />
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
            <div className="space-y-2">
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};
