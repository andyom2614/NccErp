import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { School, CheckCircle, Clock, FileText, Users, X, Plus, Trash2 } from 'lucide-react';
import { collection, getDocs, addDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { getCadetContactsByColleges } from '../../services/googleSheetsService';

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

interface CadetContact {
  name: string;
  rank: string;
  email: string;
  whatsappNumber: string;
  college: string;
}

interface CadetSubmission {
  id: string;
  campId: string;
  collegeId: string;
  anoId: string;
  cadets: {
    name: string;
    rank: string;
    email: string;
    whatsappNumber: string;
  }[];
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const ANODashboard = () => {
  const { user } = useAuth();
  const [campNotifications, setCampNotifications] = useState<CampNotification[]>([]);
  const [anoCollege, setAnoCollege] = useState<College | null>(null);
  const [cadetContacts, setCadetContacts] = useState<CadetContact[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState<CampNotification | null>(null);
  const [selectedCadets, setSelectedCadets] = useState<CadetContact[]>([]);
  const [availableCadets, setAvailableCadets] = useState<CadetContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submissions, setSubmissions] = useState<CadetSubmission[]>([]);

  useEffect(() => {
    if (user?.uid) {
      fetchAnoCollege();
      fetchSubmissions();
    }
  }, [user]);

  useEffect(() => {
    if (anoCollege) {
      console.log('🔍 DEBUG - ANO college set, fetching notifications and cadets for:', anoCollege.name);
      fetchCampNotifications();
      fetchCadetContacts();
    }
  }, [anoCollege]);

  const fetchAnoCollege = async () => {
    try {
      console.log('🔍 DEBUG - Fetching ANO college for user:', user?.uid);
      const collegesSnapshot = await getDocs(collection(db, 'colleges'));
      console.log('🔍 DEBUG - Found colleges:', collegesSnapshot.size);
      
      collegesSnapshot.forEach((doc) => {
        const collegeData = { id: doc.id, ...doc.data() } as College;
        console.log('🔍 DEBUG - Checking college:', collegeData.name, 'ANOs:', collegeData.anos);
        
        if (collegeData.anos && collegeData.anos.includes(user?.uid || '')) {
          console.log('✅ DEBUG - Found matching college:', collegeData.name);
          setAnoCollege(collegeData);
        }
      });
      
      if (!anoCollege) {
        console.log('❌ DEBUG - No college found for ANO. User ID:', user?.uid);
      }
    } catch (err) {
      console.error('Error fetching ANO college:', err);
    }
  };

  const fetchCampNotifications = async () => {
    try {
      console.log('🔍 DEBUG - Fetching camp notifications for college:', anoCollege?.name, 'ID:', anoCollege?.id);
      
      // Simplified query without compound index requirement
      const querySnapshot = await getDocs(collection(db, 'campNotifications'));
      const notifications: CampNotification[] = [];
      
      console.log('🔍 DEBUG - Found camp notifications:', querySnapshot.size);
      
      querySnapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() } as CampNotification;
        console.log('🔍 DEBUG - Processing camp:', data.title, 'Status:', data.status, 'Vacancies:', data.vacancies);
        
        // Filter for published camps with vacancies for this ANO's college
        if (data.status === 'published') {
          console.log('🔍 DEBUG - Camp is published, checking vacancies for college ID:', anoCollege?.id);
          
          if (anoCollege && data.vacancies[anoCollege.id]) {
            const vacancyCount = data.vacancies[anoCollege.id];
            console.log('✅ DEBUG - Found vacancy:', vacancyCount, 'for college:', anoCollege.name);
            
            if (vacancyCount > 0) {
              notifications.push(data);
            }
          } else {
            console.log('❌ DEBUG - No vacancies found for this college');
          }
        } else {
          console.log('🔍 DEBUG - Camp not published, status:', data.status);
        }
      });
      
      console.log('🔍 DEBUG - Final filtered notifications:', notifications.length);
      
      // Sort by createdAt in JavaScript instead of Firestore
      notifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setCampNotifications(notifications);
    } catch (err) {
      console.error('Error fetching camp notifications:', err);
    }
  };

  const fetchCadetContacts = async () => {
    try {
      if (!anoCollege) return;
      
      const cadetContacts = await getCadetContactsByColleges([anoCollege.name]);
      setCadetContacts(cadetContacts);
    } catch (err) {
      console.error('Error fetching cadet contacts:', err);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const q = query(
        collection(db, 'cadetSubmissions'),
        where('anoId', '==', user?.uid)
      );
      const querySnapshot = await getDocs(q);
      const submissionsList: CadetSubmission[] = [];
      querySnapshot.forEach((doc) => {
        submissionsList.push({ id: doc.id, ...doc.data() } as CadetSubmission);
      });
      setSubmissions(submissionsList);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    }
  };

  const handleSubmitCadets = (camp: CampNotification) => {
    setSelectedCamp(camp);
    setAvailableCadets(cadetContacts);
    setSelectedCadets([]);
    setShowSubmitModal(true);
  };

  const addCadet = (cadet: CadetContact) => {
    if (selectedCadets.length >= (selectedCamp?.vacancies[anoCollege?.id || ''] || 0)) {
      setError(`Maximum ${selectedCamp?.vacancies[anoCollege?.id || ''] || 0} cadets allowed for this camp`);
      return;
    }
    
    setSelectedCadets([...selectedCadets, cadet]);
    setAvailableCadets(availableCadets.filter(c => c.email !== cadet.email));
    setError('');
  };

  const removeCadet = (cadet: CadetContact) => {
    setSelectedCadets(selectedCadets.filter(c => c.email !== cadet.email));
    setAvailableCadets([...availableCadets, cadet].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const submitCadets = async () => {
    if (selectedCadets.length === 0) {
      setError('Please select at least one cadet');
      return;
    }

    setLoading(true);
    try {
      const submissionData = {
        campId: selectedCamp?.id,
        collegeId: anoCollege?.id,
        anoId: user?.uid,
        cadets: selectedCadets.map(cadet => ({
          name: cadet.name,
          rank: cadet.rank,
          email: cadet.email,
          whatsappNumber: cadet.whatsappNumber
        })),
        submittedAt: new Date().toISOString(),
        status: 'pending'
      };

      await addDoc(collection(db, 'cadetSubmissions'), submissionData);
      
      setSuccess(`Successfully submitted ${selectedCadets.length} cadets for ${selectedCamp?.title}`);
      setShowSubmitModal(false);
      fetchSubmissions(); // Refresh submissions
      
    } catch (err) {
      setError('Failed to submit cadets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionForCamp = (campId: string) => {
    return submissions.find(s => s.campId === campId);
  };

  const calculateStats = () => {
    const totalVacancies = campNotifications.reduce((sum, camp) => 
      sum + (camp.vacancies[anoCollege?.id || ''] || 0), 0
    );
    const totalSubmitted = submissions.reduce((sum, sub) => sum + sub.cadets.length, 0);
    
    return {
      assignedCamps: campNotifications.length,
      totalVacancies,
      submittedCadets: totalSubmitted,
      pendingSubmissions: campNotifications.filter(camp => !getSubmissionForCamp(camp.id)).length
    };
  };

  const stats = calculateStats();
  const statsConfig = [
    { label: 'Assigned Camps', value: stats.assignedCamps.toString(), icon: School, color: 'from-green-500 to-green-600' },
    { label: 'Total Vacancies', value: stats.totalVacancies.toString(), icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: 'Submitted Cadets', value: stats.submittedCadets.toString(), icon: CheckCircle, color: 'from-purple-500 to-purple-600' },
    { label: 'Pending Submissions', value: stats.pendingSubmissions.toString(), icon: Clock, color: 'from-orange-500 to-orange-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">ANO Dashboard</h1>
        <p className="text-gray-600 mt-1">
          {anoCollege ? `Manage camp submissions for ${anoCollege.name}` : 'Manage camp submissions and cadet documentation'}
        </p>
      </motion.div>

      {/* Success/Error Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between"
        >
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-green-700 hover:text-green-900">
            <X size={18} />
          </button>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between"
        >
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">
            <X size={18} />
          </button>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat, index) => {
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

      {/* Assigned Camps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6">
          <div className="flex items-center gap-3 text-white">
            <FileText size={24} />
            <h2 className="text-xl font-bold">Assigned Camps ({campNotifications.length})</h2>
          </div>
        </div>
        <div className="p-6">
          {campNotifications.length === 0 ? (
            <div className="text-center py-8">
              <School className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No camps assigned to your college yet</p>
              <p className="text-gray-500 text-sm mt-1">Check back later for new camp notifications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campNotifications.map((camp, index) => {
                const submission = getSubmissionForCamp(camp.id);
                const vacanciesForCollege = camp.vacancies[anoCollege?.id || ''] || 0;
                
                return (
                  <motion.div
                    key={camp.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                    className="border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{camp.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{camp.venue}</p>
                        <p className="text-sm text-gray-500">
                          📅 {new Date(camp.reportingDate).toLocaleDateString()} at {camp.reportingTime}
                        </p>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <div>
                          <p className="text-gray-600">Vacancies</p>
                          <p className="text-xl font-bold text-gray-900">{vacanciesForCollege}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Submitted</p>
                          <p className="text-xl font-bold text-green-600">{submission ? submission.cadets.length : 0}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {submission ? (
                          <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                            ✅ Submitted ({submission.cadets.length} cadets)
                          </div>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSubmitCadets(camp)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            Submit Cadets
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Submit Cadets Modal */}
      <AnimatePresence>
        {showSubmitModal && selectedCamp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSubmitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Submit Cadets</h2>
                    <p className="text-green-100 mt-1">{selectedCamp.title}</p>
                    <p className="text-sm text-green-200">
                      Available slots: {(selectedCamp.vacancies[anoCollege?.id || ''] || 0) - selectedCadets.length} of {selectedCamp.vacancies[anoCollege?.id || ''] || 0}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Available Cadets */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Available Cadets ({availableCadets.length})</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {availableCadets.map((cadet) => (
                        <div
                          key={cadet.email}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-green-300 transition-colors"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{cadet.name}</p>
                            <p className="text-sm text-gray-600">{cadet.rank} • {cadet.email}</p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => addCadet(cadet)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Plus size={18} />
                          </motion.button>
                        </div>
                      ))}
                      {availableCadets.length === 0 && (
                        <p className="text-gray-500 text-center py-8">No more cadets available</p>
                      )}
                    </div>
                  </div>

                  {/* Selected Cadets */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Selected Cadets ({selectedCadets.length})</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {selectedCadets.map((cadet) => (
                        <div
                          key={cadet.email}
                          className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{cadet.name}</p>
                            <p className="text-sm text-gray-600">{cadet.rank} • {cadet.email}</p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeCadet(cadet)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </motion.button>
                        </div>
                      ))}
                      {selectedCadets.length === 0 && (
                        <p className="text-gray-500 text-center py-8">No cadets selected yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex gap-3">
                  <motion.button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={submitCadets}
                    disabled={loading || selectedCadets.length === 0}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        Submitting...
                      </div>
                    ) : (
                      `Submit ${selectedCadets.length} Cadets`
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
