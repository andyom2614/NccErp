import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Send, Calendar, MapPin, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface CampNotification {
  id: string;
  title: string;
  dates: string;
  location: string;
  requirements: string;
  vacancies: {
    boys: number;
    girls: number;
  };
  lastDateToApply: string;
  description: string;
  createdBy: string;
  createdAt: string;
  status: string;
}

interface Cadet {
  name: string;
  rank: string;
  email: string;
  whatsappNumber: string;
  college?: string;
}

interface College {
  id: string;
  name: string;
  unitId: string;
  anos: string[];
}

export const SubmitCadets = () => {
  const { user } = useAuth();
  const [campNotifications, setCampNotifications] = useState<CampNotification[]>([]);
  const [anoCollege, setAnoCollege] = useState<College | null>(null);
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCamp, setSelectedCamp] = useState<CampNotification | null>(null);
  const [selectedCadets, setSelectedCadets] = useState<Cadet[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user?.uid) {
      fetchAnoCollege();
      fetchCampNotifications();
    }
  }, [user]);

  const fetchAnoCollege = async () => {
    try {
      const collegesSnapshot = await getDocs(collection(db, 'colleges'));
      collegesSnapshot.forEach((doc) => {
        const collegeData = { id: doc.id, ...doc.data() } as College;
        if (collegeData.anos && collegeData.anos.includes(user?.uid || '')) {
          setAnoCollege(collegeData);
          fetchCadetsForCollege(collegeData.name);
        }
      });
    } catch (err) {
      console.error('Error fetching ANO college:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampNotifications = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'campNotifications'));
      const notifications: CampNotification[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'published') {
          notifications.push({ id: doc.id, ...data } as CampNotification);
        }
      });
      
      // Sort by creation date (newest first)
      notifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setCampNotifications(notifications);
    } catch (err) {
      console.error('Error fetching camp notifications:', err);
    }
  };

  const fetchCadetsForCollege = async (collegeName: string) => {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/1QrpGTKIpq0BCgddt-mkPVrBMzANdZhY-epI2aPP2JL0/values/Sheet2!A:E?key=${import.meta.env.VITE_GOOGLE_SHEETS_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.values || data.values.length <= 1) {
        setCadets([]);
        return;
      }
      
      const cadetsList: Cadet[] = [];
      
      // Skip header row (index 0)
      for (let i = 1; i < data.values.length; i++) {
        const row = data.values[i];
        if (row && row.length >= 5) {
          const [name, rank, email, whatsappNumber, college] = row;
          
          // Match by college name (case-insensitive, trimmed)
          const rowCollege = (college || '').toString().trim().toLowerCase();
          const targetCollege = collegeName.toLowerCase().trim();
          
          if (rowCollege.includes(targetCollege) || targetCollege.includes(rowCollege)) {
            cadetsList.push({
              name: name.toString().trim(),
              rank: rank.toString().trim(),
              email: email.toString().trim(),
              whatsappNumber: whatsappNumber.toString().trim(),
              college: college.toString().trim()
            });
          }
        }
      }
      
      setCadets(cadetsList);
    } catch (err) {
      console.error('Error fetching cadets:', err);
      setCadets([]);
    }
  };

  const handleCadetSelection = (cadet: Cadet, isSelected: boolean) => {
    if (isSelected) {
      setSelectedCadets([...selectedCadets, cadet]);
    } else {
      setSelectedCadets(selectedCadets.filter(c => c.email !== cadet.email));
    }
  };

  const submitCadets = async () => {
    if (!selectedCamp || selectedCadets.length === 0) {
      setMessage({ type: 'error', text: 'Please select cadets to submit' });
      return;
    }

    setSubmitLoading(true);
    setMessage(null);

    try {
      const submission = {
        campId: selectedCamp.id,
        campTitle: selectedCamp.title,
        collegeId: anoCollege?.id || '',
        anoId: user?.uid || '',
        cadets: selectedCadets.map(cadet => ({
          name: cadet.name,
          rank: cadet.rank,
          email: cadet.email,
          whatsappNumber: cadet.whatsappNumber
        })),
        submittedAt: new Date().toISOString(),
        status: 'pending'
      };

      await addDoc(collection(db, 'cadetSubmissions'), submission);
      
      setMessage({ 
        type: 'success', 
        text: `Successfully submitted ${selectedCadets.length} cadets for ${selectedCamp.title}` 
      });
      setSelectedCadets([]);
      setSelectedCamp(null);
      setShowModal(false);
    } catch (err) {
      console.error('Error submitting cadets:', err);
      setMessage({ type: 'error', text: 'Failed to submit cadets. Please try again.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSelectCamp = (camp: CampNotification) => {
    setSelectedCamp(camp);
    setSelectedCadets([]);
    setShowModal(true);
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
        <h1 className="text-3xl font-bold text-gray-900">Submit Cadets</h1>
        <p className="text-gray-600 mt-1">
          Select a camp and submit your cadets for participation
        </p>
      </motion.div>

      {/* Status Messages */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-100 border border-green-200' 
              : 'bg-red-100 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="text-green-600" size={20} />
          ) : (
            <AlertTriangle className="text-red-600" size={20} />
          )}
          <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </span>
        </motion.div>
      )}

      {/* College Info */}
      {anoCollege && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white"
        >
          <div className="flex items-center gap-3">
            <Users size={32} />
            <div>
              <h2 className="text-xl font-bold">{anoCollege.name}</h2>
              <p className="text-blue-100">Available Cadets: {cadets.length}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Available Camps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-md border border-gray-100"
      >
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-t-xl">
          <div className="flex items-center gap-3 text-white">
            <Send size={24} />
            <h2 className="text-xl font-bold">Available Camps</h2>
          </div>
        </div>

        <div className="p-6">
          {campNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No active camps available</p>
              <p className="text-gray-500 text-sm mt-1">New camp notifications will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {campNotifications.map((camp, index) => (
                <motion.div
                  key={camp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-6 hover:border-green-300 hover:shadow-md transition-all duration-300 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                      {camp.title}
                    </h3>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      Active
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} />
                      <span className="text-sm">{camp.dates}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={16} />
                      <span className="text-sm">{camp.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users size={16} />
                      <span className="text-sm">
                        Vacancies: {camp.vacancies.boys} Boys, {camp.vacancies.girls} Girls
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{camp.description}</p>
                  </div>

                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Last Date to Apply:</strong> {camp.lastDateToApply}
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelectCamp(camp)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-300 group-hover:shadow-lg"
                  >
                    <Plus size={18} />
                    Submit Cadets
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Cadet Selection Modal */}
      {showModal && selectedCamp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{selectedCamp.title}</h3>
                <p className="text-green-100">Select cadets to submit for this camp</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {cadets.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No cadets available for selection</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-700">
                      Available Cadets: <strong>{cadets.length}</strong>
                    </p>
                    <p className="text-gray-700">
                      Selected: <strong>{selectedCadets.length}</strong>
                    </p>
                  </div>

                  {cadets.map((cadet, index) => {
                    const isSelected = selectedCadets.some(c => c.email === cadet.email);
                    return (
                      <motion.div
                        key={cadet.email}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 border rounded-lg transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-green-300 bg-green-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleCadetSelection(cadet, !isSelected)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected ? 'bg-green-600 border-green-600' : 'border-gray-300'
                          }`}>
                            {isSelected && <CheckCircle className="text-white" size={14} />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {cadet.rank} {cadet.name}
                            </p>
                            <p className="text-sm text-gray-600">{cadet.email}</p>
                            <p className="text-sm text-gray-500">📱 {cadet.whatsappNumber}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={submitCadets}
                disabled={selectedCadets.length === 0 || submitLoading}
                className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Submit {selectedCadets.length} Cadets
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};