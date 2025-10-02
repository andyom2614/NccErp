import { motion } from 'framer-motion';
import { CheckSquare, FileCheck, Download, Users, Clock, CheckCircle, XCircle } from 'lucide-react';

const stats = [
  { label: 'Pending Review', value: '18', icon: Clock, color: 'from-orange-500 to-orange-600' },
  { label: 'Verified Cadets', value: '25', icon: CheckCircle, color: 'from-green-500 to-green-600' },
  { label: 'Finalized Camps', value: '2', icon: CheckSquare, color: 'from-blue-500 to-blue-600' },
  { label: 'Total Cadets', value: '43', icon: Users, color: 'from-purple-500 to-purple-600' },
];

const pendingReviews = [
  { college: 'St. Xavier College', camp: 'Annual Training Camp', cadets: 12, status: 'Pending', priority: 'high' },
  { college: 'Miranda House', camp: 'Republic Day Camp', cadets: 18, status: 'Under Review', priority: 'medium' },
  { college: 'Hindu College', camp: 'Adventure Training', cadets: 8, status: 'Pending', priority: 'low' },
];

export const ClerkCODashboard = () => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Clerk/CO Dashboard</h1>
        <p className="text-gray-600 mt-1">Review and finalize cadet selections</p>
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
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6">
          <div className="flex items-center gap-3 text-white">
            <CheckSquare size={24} />
            <h2 className="text-xl font-bold">Pending Reviews</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {pendingReviews.map((review, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.01 }}
                className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{review.college}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        review.priority === 'high' ? 'bg-red-100 text-red-700' :
                        review.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {review.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{review.camp}</p>
                    <p className="text-sm text-gray-600 mt-1">{review.cadets} cadets submitted</p>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                    >
                      Review Now
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 border border-orange-600 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors"
                    >
                      View Docs
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200"
        >
          <CheckSquare className="text-orange-600 mb-4" size={32} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Review Cadets</h3>
          <p className="text-sm text-gray-700 mb-4">
            Review submitted cadets from colleges
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors"
          >
            Start Review
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200"
        >
          <FileCheck className="text-green-600 mb-4" size={32} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Verify Documents</h3>
          <p className="text-sm text-gray-700 mb-4">
            Check uploaded cadet documentation
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Verify Docs
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200"
        >
          <Download className="text-blue-600 mb-4" size={32} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Generate Reports</h3>
          <p className="text-sm text-gray-700 mb-4">
            Download selection reports as PDF
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Download PDF
          </motion.button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4">Selection Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="font-semibold text-gray-900">Selected Cadets</p>
              <p className="text-sm text-gray-700 mt-1">Select 5 cadets per camp based on merit and documentation</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Users className="text-blue-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="font-semibold text-gray-900">Reserve Cadets</p>
              <p className="text-sm text-gray-700 mt-1">Maintain 2 reserve cadets as backup selections</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
