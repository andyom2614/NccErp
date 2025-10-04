import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Background with NCC Cadets Photo */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(30, 58, 138, 0.7), rgba(21, 94, 117, 0.7)), url('/images/backgrounds/ncc-cadets-1.jpg')`
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      </div>

      {/* Top Left Logos */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute top-4 left-4 z-10 flex items-center gap-4"
      >
        {/* NCC Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center bg-blue-50 rounded-lg p-1">
              <img 
                src="/images/logos/ncc-logo.png" 
                alt="NCC Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="text-blue-600 font-bold text-sm">National Cadet Corps</div>
              <div className="text-gray-600 text-xs">राष्ट्रीय कैडेट कोर</div>
            </div>
          </div>
        </motion.div>

        {/* Digital India Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ delay: 0.1 }}
          className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center bg-orange-50 rounded-lg p-1">
              <img 
                src="/images/logos/digital-india-logo.png" 
                alt="Digital India Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="text-orange-600 font-bold text-sm">Digital</div>
              <div className="text-gray-600 text-xs">India</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-20"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white border-opacity-20"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="inline-block"
            >
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg border-4 border-blue-600 p-2">
                <img 
                  src="/images/logos/ncc-logo.png" 
                  alt="NCC Emblem" 
                  className="w-full h-full object-contain"
                />
              </div>
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900">NCC ERP System</h1>
            <p className="text-gray-600 mt-2">National Cadet Corps </p>
            <p className="text-gray-500 text-sm mt-1">Unity & Discipline </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <LogIn size={20} />
                  Sign In
                </>
              )}
            </motion.button>
          </form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-sm text-gray-600 mt-6"
          >
            Contact your administrator for account access
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Bottom Right Badge */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="absolute bottom-4 right-4 z-10"
      >
        <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
          <div className="text-center">
            <div className="text-blue-600 font-bold text-sm">राष्ट्रीय कैडेट कोर</div>
            <div className="text-gray-600 text-xs">National Cadet Corps</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
