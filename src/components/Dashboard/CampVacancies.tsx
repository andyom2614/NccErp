import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { School, Calendar, MapPin, Users, Clock, AlertCircle } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface CampNotification {
  id: string;
  title: string;
  description?: string;
  reportingDate: string;
  reportingTime: string;
  venue: string;
  vacancies: { [collegeId: string]: number };
  officialLetter?: string;
  sendTo: 'ano' | 'cadets';
  createdBy: string;
  createdAt: string;
  status: 'draft' | 'published' | 'closed';
}

interface College {
  id: string;
  name: string;
  unitId: string;
  anos: string[];
}

export const CampVacancies = () => {
  const { user } = useAuth();
  const [campNotifications, setCampNotifications] = useState<CampNotification[]>([]);
  const [anoCollege, setAnoCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      fetchAnoCollege();
    }
  }, [user]);

  useEffect(() => {
    if (anoCollege) {
      fetchCampNotifications();
    }
  }, [anoCollege]);

  const fetchAnoCollege = async () => {
    try {
      const collegesSnapshot = await getDocs(collection(db, 'colleges'));
      collegesSnapshot.forEach((doc) => {
        const collegeData = { id: doc.id, ...doc.data() } as College;
        if (collegeData.anos && collegeData.anos.includes(user?.uid || '')) {
          setAnoCollege(collegeData);
        }
      });
    } catch (err) {
      console.error('Error fetching ANO college:', err);
    }
  };

  const fetchCampNotifications = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'campNotifications'));
      const notifications: CampNotification[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() } as CampNotification;
        
        // Include all camps where this ANO's college has vacancies (any status)
        if (anoCollege && data.vacancies[anoCollege.id] !== undefined) {
          notifications.push(data);
        }
      });
      
      // Sort by createdAt
      notifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setCampNotifications(notifications);
    } catch (err) {
      console.error('Error fetching camp notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'published': return 'bg-green-100 text-green-700 border-green-200';
      case 'closed': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock size={14} />;
      case 'published': return <School size={14} />;
      case 'closed': return <AlertCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Camp Vacancies</h1>
        <p className="text-gray-600 mt-1">
          {anoCollege ? `View all camp vacancies for ${anoCollege.name}` : 'View camp vacancies and requirements'}
        </p>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white"
        >
          <div className="flex items-center gap-3">
            <School size={32} />
            <div>
              <h3 className="text-2xl font-bold">{campNotifications.length}</h3>
              <p className="text-green-100">Total Camps</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white"
        >
          <div className="flex items-center gap-3">
            <Users size={32} />
            <div>
              <h3 className="text-2xl font-bold">
                {campNotifications.reduce((sum, camp) => sum + (camp.vacancies[anoCollege?.id || ''] || 0), 0)}
              </h3>
              <p className="text-blue-100">Total Vacancies</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white"
        >
          <div className="flex items-center gap-3">
            <AlertCircle size={32} />
            <div>
              <h3 className="text-2xl font-bold">
                {campNotifications.filter(camp => camp.status === 'published').length}
              </h3>
              <p className="text-purple-100">Active Camps</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Camps List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
          <div className="flex items-center gap-3 text-white">
            <School size={24} />
            <h2 className="text-xl font-bold">All Camp Vacancies</h2>
          </div>
        </div>

        <div className="p-6">
          {campNotifications.length === 0 ? (
            <div className="text-center py-12">
              <School className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No camps found</p>
              <p className="text-gray-500 text-sm mt-1">Check back later for new camp notifications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campNotifications.map((camp, index) => {
                const vacanciesForCollege = camp.vacancies[anoCollege?.id || ''] || 0;
                
                return (
                  <motion.div
                    key={camp.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-6 hover:border-green-300 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{camp.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(camp.status)}`}>
                            {getStatusIcon(camp.status)}
                            {camp.status.charAt(0).toUpperCase() + camp.status.slice(1)}
                          </span>
                        </div>
                        
                        {camp.description && (
                          <p className="text-gray-600 mb-3">{camp.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar size={16} />
                            <span className="text-sm">{new Date(camp.reportingDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock size={16} />
                            <span className="text-sm">{camp.reportingTime}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin size={16} />
                            <span className="text-sm">{camp.venue}</span>
                          </div>
                        </div>
                        
                        {camp.officialLetter && (
                          <div className="mt-3">
                            <a 
                              href={camp.officialLetter} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 hover:underline text-sm"
                            >
                              📄 View Official Letter
                            </a>
                          </div>
                        )}
                      </div>
                      
                      <div className="lg:text-right">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="text-green-600" size={20} />
                            <span className="font-medium text-green-900">Allocated Vacancies</span>
                          </div>
                          <div className="text-3xl font-bold text-green-600">{vacanciesForCollege}</div>
                          <div className="text-sm text-green-700">For {anoCollege?.name}</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};