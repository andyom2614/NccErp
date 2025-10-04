import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Filter, 
  Download,
  Calendar,
  MapPin,
  School,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { collection, getDocs, query, where, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface CadetSubmission {
  id: string;
  campId: string;
  campTitle: string;
  collegeId: string;
  collegeName: string;
  anoId: string;
  cadets: {
    name: string;
    rank: string;
    email: string;
    whatsappNumber: string;
  }[];
  submittedAt: string;
  status: 'pending' | 'reviewed' | 'selected' | 'rejected';
}

interface CampNotification {
  id: string;
  title: string;
  dates: string;
  location: string;
  vacancies: {
    boys: number;
    girls: number;
  };
}

interface SelectedCadet {
  submissionId: string;
  cadet: {
    name: string;
    rank: string;
    email: string;
    whatsappNumber: string;
  };
  collegeName: string;
  campId: string;
  campTitle: string;
}

export const ReviewCadets = () => {
  const [submissions, setSubmissions] = useState<CadetSubmission[]>([]);
  const [camps, setCamps] = useState<CampNotification[]>([]);
  const [selectedCamp, setSelectedCamp] = useState<string>('');
  const [selectedCadets, setSelectedCadets] = useState<SelectedCadet[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSubmissions();
    fetchCamps();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'cadetSubmissions'),
        where('status', '==', 'pending')
      );
      const querySnapshot = await getDocs(q);
      const submissionsList: CadetSubmission[] = [];
      
      querySnapshot.forEach((doc) => {
        submissionsList.push({ id: doc.id, ...doc.data() } as CadetSubmission);
      });
      
      // Sort by submission date (newest first)
      submissionsList.sort((a, b) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      
      setSubmissions(submissionsList);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCamps = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'campNotifications'));
      const campsList: CampNotification[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'published') {
          campsList.push({ id: doc.id, ...data } as CampNotification);
        }
      });
      
      setCamps(campsList);
    } catch (err) {
      console.error('Error fetching camps:', err);
    }
  };

  const handleCadetSelection = (
    submissionId: string, 
    cadet: any, 
    collegeName: string, 
    campId: string,
    campTitle: string,
    isSelected: boolean
  ) => {
    if (isSelected) {
      const selectedCadet: SelectedCadet = {
        submissionId,
        cadet,
        collegeName,
        campId,
        campTitle
      };
      setSelectedCadets([...selectedCadets, selectedCadet]);
    } else {
      setSelectedCadets(selectedCadets.filter(
        sc => !(sc.submissionId === submissionId && sc.cadet.email === cadet.email)
      ));
    }
  };

  const isCadetSelected = (submissionId: string, cadetEmail: string) => {
    return selectedCadets.some(
      sc => sc.submissionId === submissionId && sc.cadet.email === cadetEmail
    );
  };

  const finalizeSelection = async () => {
    if (selectedCadets.length === 0) {
      setMessage({ type: 'error', text: 'Please select cadets for the next level' });
      return;
    }

    setProcessing(true);
    setMessage(null);

    try {
      // Group selected cadets by submission
      const submissionUpdates = new Map<string, any[]>();
      
      selectedCadets.forEach(selected => {
        if (!submissionUpdates.has(selected.submissionId)) {
          submissionUpdates.set(selected.submissionId, []);
        }
        submissionUpdates.get(selected.submissionId)?.push(selected.cadet);
      });

      // Update submission statuses
      const updatePromises: Promise<void>[] = [];
      
      for (const [submissionId, selectedCadetsForSubmission] of submissionUpdates) {
        updatePromises.push(
          updateDoc(doc(db, 'cadetSubmissions', submissionId), {
            status: 'reviewed',
            reviewedAt: new Date().toISOString(),
            selectedCadets: selectedCadetsForSubmission
          })
        );
      }

      // Create institute level selections document
      const instituteSelection = {
        selectedCadets: selectedCadets.map(sc => ({
          ...sc.cadet,
          collegeName: sc.collegeName,
          submissionId: sc.submissionId,
          campId: sc.campId,
          campTitle: sc.campTitle
        })),
        selectionDate: new Date().toISOString(),
        status: 'institute-level',
        totalSelected: selectedCadets.length,
        campBreakdown: selectedCadets.reduce((acc: any, sc) => {
          acc[sc.campTitle] = (acc[sc.campTitle] || 0) + 1;
          return acc;
        }, {}),
        collegeBreakdown: selectedCadets.reduce((acc: any, sc) => {
          acc[sc.collegeName] = (acc[sc.collegeName] || 0) + 1;
          return acc;
        }, {})
      };

      updatePromises.push(
        addDoc(collection(db, 'instituteLevelSelections'), instituteSelection)
      );

      await Promise.all(updatePromises);

      // Send WhatsApp notifications to selected cadets
      await sendSelectionNotifications();

      setMessage({ 
        type: 'success', 
        text: `Successfully selected ${selectedCadets.length} cadets for institute level. Notifications sent!` 
      });
      
      // Reset state
      setSelectedCadets([]);
      fetchSubmissions(); // Refresh submissions
      
    } catch (err) {
      console.error('Error finalizing selection:', err);
      setMessage({ type: 'error', text: 'Failed to finalize selection. Please try again.' });
    } finally {
      setProcessing(false);
    }
  };

  const sendSelectionNotifications = async () => {
    try {
      const whatsappService = await import('../../services/whatsappService');
      
      for (const selected of selectedCadets) {
        let phoneNumber = selected.cadet.whatsappNumber;
        
        // Ensure phone number has +91 prefix
        if (!phoneNumber.startsWith('+91')) {
          phoneNumber = `+91${phoneNumber}`;
        }
        
        // Clean the phone number
        phoneNumber = phoneNumber.replace(/[\s-()]/g, '');
        
        const message = `🎉 *CONGRATULATIONS!*

Dear ${selected.cadet.rank} ${selected.cadet.name},

You have been *SELECTED for INSTITUTE LEVEL* participation! 🏆

📋 *Selection Details:*
🏕️ Camp: ${selected.campTitle}
🏫 From: ${selected.collegeName}
🎯 Level: *INSTITUTE LEVEL*
📅 Selection Date: ${new Date().toLocaleDateString()}

🎖️ You have successfully progressed from college level to institute level. This is a significant achievement and recognition of your dedication to NCC.

📞 *Next Steps:*
- Await further instructions from your commanding officer
- Prepare for institute level training and activities
- Maintain your fitness and discipline standards

Once again, congratulations on this achievement! 🇮🇳

*National Cadet Corps*
*Institute Level Selection*`;

        await whatsappService.sendWhatsAppMessage(phoneNumber, message);
        console.log(`Selection notification sent to ${selected.cadet.name} at ${phoneNumber}`);
      }
    } catch (error) {
      console.error('Error sending selection notifications:', error);
    }
  };

  const filteredSubmissions = selectedCamp 
    ? submissions.filter(s => s.campId === selectedCamp)
    : submissions;

  const totalCadets = filteredSubmissions.reduce((sum, submission) => sum + submission.cadets.length, 0);
  const totalColleges = new Set(filteredSubmissions.map(s => s.collegeName)).size;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full"
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
        <h1 className="text-3xl font-bold text-gray-900">Review & Select Cadets</h1>
        <p className="text-gray-600 mt-1">
          Review submissions from ANOs and select cadets for institute level participation
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
            <XCircle className="text-red-600" size={20} />
          )}
          <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </span>
        </motion.div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white"
        >
          <div className="flex items-center gap-3">
            <Users size={32} />
            <div>
              <h3 className="text-2xl font-bold">{totalCadets}</h3>
              <p className="text-blue-100">Total Cadets</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white"
        >
          <div className="flex items-center gap-3">
            <School size={32} />
            <div>
              <h3 className="text-2xl font-bold">{totalColleges}</h3>
              <p className="text-green-100">Colleges</p>
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
            <UserCheck size={32} />
            <div>
              <h3 className="text-2xl font-bold">{selectedCadets.length}</h3>
              <p className="text-purple-100">Selected</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-md p-6 text-white"
        >
          <div className="flex items-center gap-3">
            <Filter size={32} />
            <div>
              <h3 className="text-2xl font-bold">{filteredSubmissions.length}</h3>
              <p className="text-orange-100">Submissions</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters and Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-md border border-gray-100 p-6"
      >
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-600" />
              <select
                value={selectedCamp}
                onChange={(e) => setSelectedCamp(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Camps</option>
                {camps.map(camp => (
                  <option key={camp.id} value={camp.id}>{camp.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            {selectedCadets.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={finalizeSelection}
                disabled={processing}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-2 rounded-lg font-medium hover:from-orange-700 hover:to-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {processing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowRight size={18} />
                    Finalize Selection ({selectedCadets.length})
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Submissions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-md border border-gray-100"
      >
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6 rounded-t-xl">
          <div className="flex items-center gap-3 text-white">
            <Eye size={24} />
            <h2 className="text-xl font-bold">Cadet Submissions for Review</h2>
          </div>
        </div>

        <div className="p-6">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No pending submissions found</p>
              <p className="text-gray-500 text-sm mt-1">
                {selectedCamp ? 'No submissions for selected camp' : 'Submissions will appear here once ANOs submit cadets'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredSubmissions.map((submission, index) => (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 hover:shadow-md transition-all"
                >
                  <div className="mb-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{submission.campTitle}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <School size={16} />
                            <span>{submission.collegeName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users size={16} />
                            <span>{submission.cadets.length} Cadets</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full border border-yellow-200">
                          Pending Review
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cadets List */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Submitted Cadets:</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {submission.cadets.map((cadet, idx) => {
                        const isSelected = isCadetSelected(submission.id, cadet.email);
                        return (
                          <motion.div
                            key={idx}
                            whileHover={{ scale: 1.02 }}
                            className={`p-4 border rounded-lg transition-all cursor-pointer ${
                              isSelected 
                                ? 'border-orange-300 bg-orange-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleCadetSelection(
                              submission.id, 
                              cadet, 
                              submission.collegeName,
                              submission.campId,
                              submission.campTitle,
                              !isSelected
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected ? 'bg-orange-600 border-orange-600' : 'border-gray-300'
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
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};