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
  LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const menuItems = {
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Manage Users', icon: Users },
    { id: 'notifications', label: 'Camp Notifications', icon: FileText },
    { id: 'vacancies', label: 'Allocate Vacancies', icon: School },
    { id: 'logs', label: 'System Logs', icon: Activity },
  ],
  ano: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vacancies', label: 'Camp Vacancies', icon: School },
    { id: 'submit', label: 'Submit Cadets', icon: Upload },
    { id: 'documents', label: 'Upload Documents', icon: FileCheck },
    { id: 'status', label: 'Track Status', icon: Activity },
  ],
  clerk: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'review', label: 'Review Cadets', icon: CheckSquare },
    { id: 'verify', label: 'Verify Documents', icon: FileCheck },
    { id: 'finalize', label: 'Finalize Selection', icon: CheckSquare },
    { id: 'reports', label: 'Generate Reports', icon: Download },
  ],
  co: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'review', label: 'Review Cadets', icon: CheckSquare },
    { id: 'verify', label: 'Verify Documents', icon: FileCheck },
    { id: 'finalize', label: 'Finalize Selection', icon: CheckSquare },
    { id: 'reports', label: 'Generate Reports', icon: Download },
  ],
};

const roleColors = {
  admin: 'from-blue-600 to-blue-700',
  ano: 'from-green-600 to-green-700',
  clerk: 'from-orange-600 to-orange-700',
  co: 'from-orange-600 to-orange-700',
};

export const Sidebar = ({ currentPage, onNavigate }: SidebarProps) => {
  const { userData, logout } = useAuth();
  const role = userData?.role || 'admin';
  const items = menuItems[role];
  const colorGradient = roleColors[role];

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0"
    >
      <div className={`bg-gradient-to-r ${colorGradient} text-white p-6`}>
        <h1 className="text-2xl font-bold">NCC ERP</h1>
        <p className="text-sm opacity-90 mt-1">{userData?.name}</p>
        <p className="text-xs opacity-75 capitalize">{role} Portal</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? `bg-gradient-to-r ${colorGradient} text-white shadow-md`
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <motion.button
          onClick={logout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </motion.button>
      </div>
    </motion.aside>
  );
};
