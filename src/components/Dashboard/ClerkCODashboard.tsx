import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, FileCheck, Download, Users, CheckCircle, Building, Shield } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface College {
  id: string;
  name: string;
  unitId: string;
  anos: string[];
}

interface Unit {
  id: string;
  name: string;
  coId: string;
  clerkId: string;
  colleges: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ano' | 'clerk' | 'co';
}

interface ClerkCODashboardProps {
  onNavigate?: (page: string) => void;
}

export const ClerkCODashboard = ({ onNavigate }: ClerkCODashboardProps = {}) => {
  const { user } = useAuth();
  const [colleges, setColleges] = useState<College[]>([]);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [anos, setAnos] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const stats = [
    { label: 'Associate Colleges', value: colleges.length.toString(), icon: Building, color: 'from-purple-500 to-purple-600' },
    { label: 'Verified Cadets', value: '25', icon: CheckCircle, color: 'from-green-500 to-green-600' },
    { label: 'Finalized Camps', value: '2', icon: CheckSquare, color: 'from-blue-500 to-blue-600' },
    { label: 'Total Cadets', value: '43', icon: Users, color: 'from-orange-500 to-orange-600' },
  ];

  useEffect(() => {
    if (user) {
      fetchUserUnit();
    }
  }, [user]);

  const fetchUserUnit = async () => {
    try {
      setLoading(true);
      
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      
      // Find the unit where this user is either CO or Clerk
      const unitsQuery = query(
        collection(db, 'units'),
        where('coId', '==', user.uid)
      );
      const clerkQuery = query(
        collection(db, 'units'),
        where('clerkId', '==', user.uid)
      );

      let unitDoc: Unit | null = null;
      
      // Check if user is CO
      const coUnitsSnapshot = await getDocs(unitsQuery);
      if (!coUnitsSnapshot.empty) {
        coUnitsSnapshot.forEach((doc) => {
          unitDoc = { id: doc.id, ...doc.data() } as Unit;
        });
      } else {
        // Check if user is Clerk
        const clerkUnitsSnapshot = await getDocs(clerkQuery);
        if (!clerkUnitsSnapshot.empty) {
          clerkUnitsSnapshot.forEach((doc) => {
            unitDoc = { id: doc.id, ...doc.data() } as Unit;
          });
        }
      }

      if (unitDoc) {
        setUnit(unitDoc);
        await fetchCollegesForUnit(unitDoc.id);
      }
    } catch (err) {
      console.error('Error fetching user unit:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollegesForUnit = async (unitId: string) => {
    try {
      const collegesQuery = query(
        collection(db, 'colleges'),
        where('unitId', '==', unitId)
      );
      const collegesSnapshot = await getDocs(collegesQuery);
      const collegesData: College[] = [];
      
      collegesSnapshot.forEach((doc) => {
        collegesData.push({
          id: doc.id,
          ...doc.data(),
        } as College);
      });
      
      setColleges(collegesData);
      
      // Fetch ANO details for these colleges
      if (collegesData.length > 0) {
        await fetchAnos(collegesData);
      }
    } catch (err) {
      console.error('Error fetching colleges:', err);
    }
  };

  const fetchAnos = async (collegesData: College[]) => {
    try {
      const allAnoIds = collegesData.flatMap(college => college.anos);
      const uniqueAnoIds = [...new Set(allAnoIds)];
      
      if (uniqueAnoIds.length > 0) {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const anosData: User[] = [];
        
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          if (uniqueAnoIds.includes(doc.id) && userData.role === 'ano') {
            anosData.push({
              id: doc.id,
              ...userData,
            } as User);
          }
        });
        
        setAnos(anosData);
      }
    } catch (err) {
      console.error('Error fetching ANOs:', err);
    }
  };

  const getAnoName = (anoId: string) => {
    const ano = anos.find(a => a.id === anoId);
    return ano ? ano.name : 'Unknown ANO';
  };

  const getAnoEmail = (anoId: string) => {
    const ano = anos.find(a => a.id === anoId);
    return ano ? ano.email : 'Unknown';
  };
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Clerk/CO Dashboard</h1>
        <p className="text-gray-600 mt-1">Review and finalize cadet selections</p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100"
            >
              <div className={`bg-gradient-to-br ${stat.color} p-2 sm:p-3 rounded-lg inline-block mb-3 sm:mb-4`}>
                <Icon className="text-white" size={20} />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">{stat.label}</p>
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
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <Building size={24} />
              <h2 className="text-xl font-bold">Associate Colleges</h2>
            </div>
            {unit && (
              <div className="flex items-center gap-2 text-orange-100">
                <Shield size={16} />
                <span className="text-sm font-medium">{unit.name}</span>
              </div>
            )}
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full"
              />
            </div>
          ) : colleges.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {colleges.map((college, index) => (
                <motion.div
                  key={college.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <Building className="text-purple-600" size={20} />
                      <h3 className="text-lg font-bold text-gray-900">{college.name}</h3>
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-700">
                        {college.anos.length} ANO{college.anos.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    {college.anos.length > 0 && (
                      <div className="ml-8">
                        <p className="text-sm font-medium text-gray-700 mb-2">Assigned ANOs:</p>
                        <div className="space-y-2">
                          {college.anos.map((anoId, anoIndex) => (
                            <div key={anoIndex} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                              <Users className="text-green-600" size={16} />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{getAnoName(anoId)}</p>
                                <p className="text-xs text-gray-600">{getAnoEmail(anoId)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No colleges assigned to your unit</p>
              <p className="text-gray-500 text-sm mt-1">Contact admin to assign colleges to your unit</p>
            </div>
          )}
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
            onClick={() => onNavigate && onNavigate('review')}
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
          <h3 className="text-xl font-bold text-gray-900 mb-2">Finalized Selections</h3>
          <p className="text-sm text-gray-700 mb-4">
            View and manage finalized selections
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate && onNavigate('finalize')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            View Finalized List
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
