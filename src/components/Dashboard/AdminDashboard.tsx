import { motion } from 'framer-motion';
import { Users, FileText, School, Activity, TrendingUp, AlertCircle } from 'lucide-react';

const stats = [
  { label: 'Total Users', value: '24', icon: Users, color: 'from-blue-500 to-blue-600', change: '+3' },
  { label: 'Active Camps', value: '5', icon: FileText, color: 'from-green-500 to-green-600', change: '+2' },
  { label: 'Colleges', value: '12', icon: School, color: 'from-purple-500 to-purple-600', change: '0' },
  { label: 'Pending Reviews', value: '8', icon: Activity, color: 'from-orange-500 to-orange-600', change: '-2' },
];

const recentActivity = [
  { action: 'New ANO account created', user: 'admin@ncc.gov', time: '5 mins ago', type: 'success' },
  { action: 'Camp notification uploaded', user: 'admin@ncc.gov', time: '1 hour ago', type: 'info' },
  { action: 'Vacancy allocated to College A', user: 'admin@ncc.gov', time: '3 hours ago', type: 'success' },
  { action: 'System backup completed', user: 'System', time: '6 hours ago', type: 'info' },
];

export const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your NCC ERP system</p>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg shadow-lg"
        >
          <div className="text-sm opacity-90">System Status</div>
          <div className="text-xl font-bold flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Online
          </div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
                <span className={`text-sm font-semibold ${stat.change.startsWith('+') ? 'text-green-600' : stat.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'}`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <Activity className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={`w-2 h-2 mt-2 rounded-full ${activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-600 mt-1">by {activity.user}</p>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-green-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Create New User', color: 'from-blue-500 to-blue-600' },
              { label: 'Upload Camp Notification', color: 'from-green-500 to-green-600' },
              { label: 'Allocate Vacancies', color: 'from-purple-500 to-purple-600' },
              { label: 'View System Logs', color: 'from-orange-500 to-orange-600' },
            ].map((action, index) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full bg-gradient-to-r ${action.color} text-white py-3 px-4 rounded-lg font-medium shadow-md hover:shadow-lg transition-all`}
              >
                {action.label}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6"
      >
        <div className="flex items-start gap-4">
          <AlertCircle className="text-amber-600 flex-shrink-0" size={24} />
          <div>
            <h3 className="text-lg font-bold text-amber-900">System Announcement</h3>
            <p className="text-sm text-amber-800 mt-2">
              Scheduled maintenance on Friday, 10 PM - 2 AM. System will be temporarily unavailable.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
