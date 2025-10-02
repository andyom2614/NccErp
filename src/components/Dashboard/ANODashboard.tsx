import { motion } from 'framer-motion';
import { School, Upload, CheckCircle, Clock, FileText, Users } from 'lucide-react';

const stats = [
  { label: 'Assigned Camps', value: '3', icon: School, color: 'from-green-500 to-green-600' },
  { label: 'Total Vacancies', value: '45', icon: Users, color: 'from-blue-500 to-blue-600' },
  { label: 'Submitted Cadets', value: '38', icon: CheckCircle, color: 'from-purple-500 to-purple-600' },
  { label: 'Pending Uploads', value: '7', icon: Clock, color: 'from-orange-500 to-orange-600' },
];

const assignedCamps = [
  { name: 'Annual Training Camp 2025', location: 'Delhi', vacancies: 15, submitted: 12, status: 'In Progress' },
  { name: 'Republic Day Camp 2025', location: 'Mumbai', vacancies: 20, submitted: 18, status: 'In Progress' },
  { name: 'Adventure Training Camp', location: 'Bangalore', vacancies: 10, submitted: 8, status: 'In Progress' },
];

export const ANODashboard = () => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">ANO Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage camp submissions and cadet documentation</p>
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
              <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg inline-block mb-4`}>
                <Icon className="text-white" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
          <div className="flex items-center gap-3 text-white">
            <FileText size={24} />
            <h2 className="text-xl font-bold">Assigned Camps</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {assignedCamps.map((camp, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.01 }}
                className="border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{camp.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{camp.location}</p>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <p className="text-gray-600">Vacancies</p>
                      <p className="text-xl font-bold text-gray-900">{camp.vacancies}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Submitted</p>
                      <p className="text-xl font-bold text-green-600">{camp.submitted}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Submit Cadets
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 border border-green-600 text-green-600 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors"
                    >
                      Upload Docs
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200"
        >
          <Upload className="text-green-600 mb-4" size={32} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Quick Upload</h3>
          <p className="text-sm text-gray-700 mb-4">
            Upload cadet documentation and certificates for pending submissions
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Start Upload
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200"
        >
          <CheckCircle className="text-blue-600 mb-4" size={32} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Track Status</h3>
          <p className="text-sm text-gray-700 mb-4">
            Monitor submission status and view feedback from Clerk/CO
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            View Status
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};
