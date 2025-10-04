import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  CheckCircle, 
  X, 
  Search, 
  Filter,
  ChevronDown,
  Calendar,
  Building,
  Award,
  Phone,
  Mail
} from 'lucide-react';
import { collection, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { sendWhatsAppMessage } from '../../services/whatsappService';

interface CadetSubmission {
  id: string;
  campId: string;
  campTitle: string;
  collegeId: string;
  collegeName: string;
  anoId: string;
  anoName: string;
  cadets: {
    name: string;
    rank: string;
    email: string;
    whatsappNumber: string;
  }[];
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
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
  cadetIndex: number;
  cadet: {
    name: string;
    rank: string;
    email: string;
    whatsappNumber: string;
  };
  collegeName: string;
  campTitle: string;
  status: 'selected' | 'reserve' | 'not-selected';
}

export const CadetSelectionReview = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<CadetSubmission[]>([]);
  const [camps, setCamps] = useState<CampNotification[]>([]);
  const [selectedCamp, setSelectedCamp] = useState<string>('');
  const [selectedCadets, setSelectedCadets] = useState<SelectedCadet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationLoading, setNotificationLoading] = useState<string>('');

  // Helper function to validate data
  const validateSubmissionData = (submission: any) => {
    console.log('Validating submission:', submission);
    
    const issues = [];
    if (!submission.campId) issues.push('Missing campId');
    if (!submission.campTitle) issues.push('Missing campTitle');
    if (!submission.collegeName) issues.push('Missing collegeName');
    if (!submission.cadets || !Array.isArray(submission.cadets)) issues.push('Missing or invalid cadets array');
    
    if (issues.length > 0) {
      console.warn(`Submission validation issues for ID ${submission.id}:`, issues);
    }
    
    return issues.length === 0;
  };

  useEffect(() => {
    if (user?.uid) {
      fetchSubmissions();
      fetchCamps();
    }
  }, [user]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'cadetSubmissions'));
      const submissionsList: CadetSubmission[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Only include submissions that are not finalized (pending or reviewed but not finalized)
        if (data.status !== 'finalized') {
          const submissionWithId = { id: doc.id, ...data };
          
          // Validate the submission data
          validateSubmissionData(submissionWithId);
          
          submissionsList.push(submissionWithId as CadetSubmission);
        }
      });
      
      // Sort by submission date (newest first)
      submissionsList.sort((a, b) => {
        const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return dateB - dateA;
      });
      
      console.log('Fetched submissions:', submissionsList);
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

  const sendSelectionNotification = async (
    cadet: any,
    status: 'selected' | 'reserve' | 'not-selected',
    campTitle: string,
    collegeName: string
  ) => {
    if (status === 'not-selected') return; // No notification for not selected

    try {
      // Ensure phone number has +91 prefix
      let phoneNumber = cadet.whatsappNumber;
      if (!phoneNumber.startsWith('+91')) {
        phoneNumber = `+91${phoneNumber}`;
      }
      
      // Clean the phone number (remove any spaces, dashes, etc.)
      phoneNumber = phoneNumber.replace(/[\s-()]/g, '');

      let message = '';
      
      if (status === 'selected') {
        message = `🎉 *CONGRATULATIONS!* 🎉

Dear ${cadet.rank} ${cadet.name},

*EXCELLENT NEWS!* You have been *SELECTED* for the next level of NCC Camp selection! 🏆

📋 *Selection Details:*
🏕️ Camp: ${campTitle}
🏫 College: ${collegeName}
🎖️ Status: *SELECTED FOR NEXT LEVEL*

🎯 *Next Steps:*
• Prepare for higher level selection
• Maintain your fitness and discipline
• Await further instructions from your unit

This is a significant achievement! You have successfully progressed to the next stage of selection.

Keep up the excellent work! 🇮🇳

*National Cadet Corps*
*Selection Committee*`;
      } else if (status === 'reserve') {
        message = `📋 *NCC Camp Selection Update* 📋

Dear ${cadet.rank} ${cadet.name},

You have been placed in the *RESERVE LIST* for the NCC Camp selection.

📋 *Selection Details:*
🏕️ Camp: ${campTitle}
🏫 College: ${collegeName}
🎖️ Status: *RESERVE CANDIDATE*

🎯 *What this means:*
• You are on the official reserve list
• You may be called if selected candidates are unavailable
• Keep yourself prepared and ready
• Continue your training and preparation

Being selected for the reserve list is also an achievement. Stay prepared for potential selection!

Best regards,

*National Cadet Corps*
*Selection Committee*`;
      }

      await sendWhatsAppMessage(phoneNumber, message);
      console.log(`Selection notification sent to ${cadet.name} at ${phoneNumber} (Status: ${status})`);
      
    } catch (error) {
      console.error(`Failed to send selection notification to ${cadet.name}:`, error);
      // Don't throw error - selection should still work even if WhatsApp fails
    }
  };

  const handleCadetSelection = async (
    submissionId: string,
    cadetIndex: number,
    cadet: any,
    collegeName: string,
    campTitle: string,
    status: 'selected' | 'reserve' | 'not-selected'
  ) => {
    const notificationKey = `${submissionId}-${cadetIndex}-${status}`;
    
    try {
      setNotificationLoading(notificationKey);

      const newSelection: SelectedCadet = {
        submissionId,
        cadetIndex,
        cadet,
        collegeName,
        campTitle,
        status
      };

      const existingIndex = selectedCadets.findIndex(
        sc => sc.submissionId === submissionId && sc.cadetIndex === cadetIndex
      );

      const previousStatus = existingIndex >= 0 ? selectedCadets[existingIndex].status : 'not-selected';

      if (existingIndex >= 0) {
        // Update existing selection
        const updated = [...selectedCadets];
        updated[existingIndex] = newSelection;
        setSelectedCadets(updated);
      } else {
        // Add new selection
        setSelectedCadets([...selectedCadets, newSelection]);
      }

      // Send WhatsApp notification if status changed to selected or reserve
      if (status !== previousStatus && (status === 'selected' || status === 'reserve')) {
        await sendSelectionNotification(cadet, status, campTitle, collegeName);
      }
    } catch (error) {
      console.error('Error in cadet selection:', error);
    } finally {
      setNotificationLoading('');
    }
  };

  const getCadetStatus = (submissionId: string, cadetIndex: number) => {
    const selection = selectedCadets.find(
      sc => sc.submissionId === submissionId && sc.cadetIndex === cadetIndex
    );
    return selection?.status || 'not-selected';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'selected': return 'bg-green-100 text-green-700 border-green-200';
      case 'reserve': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'not-selected': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'selected': return <CheckCircle size={16} className="text-green-600" />;
      case 'reserve': return <Award size={16} className="text-blue-600" />;
      case 'not-selected': return <X size={16} className="text-gray-600" />;
      default: return <X size={16} className="text-gray-600" />;
    }
  };

  const finalizeSelections = async () => {
    if (selectedCadets.length === 0) {
      alert('No cadets selected for finalization.');
      return;
    }

    console.log('Starting finalization with selectedCadets:', selectedCadets);
    console.log('Available submissions:', submissions);

    try {
      // Group selections by submission and camp
      const selectionsBySubmission = selectedCadets.reduce((acc, selection) => {
        if (!selection.submissionId) {
          console.error('Selection missing submissionId:', selection);
          return acc;
        }
        
        if (!acc[selection.submissionId]) {
          acc[selection.submissionId] = [];
        }
        acc[selection.submissionId].push(selection);
        return acc;
      }, {} as Record<string, SelectedCadet[]>);

      console.log('Grouped selections by submission:', selectionsBySubmission);
      
      const finalizedData = [];

      // Update each submission with selection results and prepare finalized data
      for (const [submissionId, selections] of Object.entries(selectionsBySubmission)) {
        const submission = submissions.find(s => s.id === submissionId);
        if (!submission) {
          console.warn(`Submission not found for ID: ${submissionId}`);
          continue;
        }

        // Validate submission data
        const campId = submission.campId || '';
        const campTitle = submission.campTitle || 'Unknown Camp';
        const collegeName = submission.collegeName || 'Unknown College';

        // Update the submission status
        await updateDoc(doc(db, 'cadetSubmissions', submissionId), {
          selections: selections.map(s => ({
            cadetIndex: s.cadetIndex || 0,
            status: s.status || 'not-selected',
            reviewedBy: user?.uid || '',
            reviewedAt: new Date().toISOString()
          })),
          status: 'finalized',
          finalizedAt: new Date().toISOString(),
          finalizedBy: user?.uid || ''
        });

        // Prepare finalized selection data
        const selectedCadetsForCamp = selections.filter(s => s.status === 'selected');
        const reserveCadetsForCamp = selections.filter(s => s.status === 'reserve');

        if (selectedCadetsForCamp.length > 0 || reserveCadetsForCamp.length > 0) {
          // Use the actual data from selections which already has the correct camp and college names
          const actualCampTitle = selectedCadetsForCamp[0]?.campTitle || reserveCadetsForCamp[0]?.campTitle || campTitle;
          const actualCollegeName = selectedCadetsForCamp[0]?.collegeName || reserveCadetsForCamp[0]?.collegeName || collegeName;
          
          // Validate and clean cadet data
          const cleanSelectedCadets = selectedCadetsForCamp.map(s => ({
            name: s.cadet?.name || 'Unknown Name',
            rank: s.cadet?.rank || 'Unknown Rank',
            email: s.cadet?.email || 'unknown@email.com',
            whatsappNumber: s.cadet?.whatsappNumber || 'Unknown Number',
            status: 'selected' as const,
            collegeName: s.collegeName || actualCollegeName
          }));

          const cleanReserveCadets = reserveCadetsForCamp.map(s => ({
            name: s.cadet?.name || 'Unknown Name',
            rank: s.cadet?.rank || 'Unknown Rank',
            email: s.cadet?.email || 'unknown@email.com',
            whatsappNumber: s.cadet?.whatsappNumber || 'Unknown Number',
            status: 'reserve' as const,
            collegeName: s.collegeName || actualCollegeName
          }));

          const finalizedSelection = {
            campId: campId,
            campTitle: actualCampTitle,
            collegeName: actualCollegeName,
            submissionId: submissionId,
            selectedCadets: cleanSelectedCadets,
            reserveCadets: cleanReserveCadets,
            finalizedAt: new Date().toISOString(),
            finalizedBy: user?.uid || '',
            reviewerName: user?.displayName || user?.email || 'Unknown Reviewer'
          };

          // Log the data being saved for debugging
          console.log('Finalized selection data:', finalizedSelection);
          
          finalizedData.push(finalizedSelection);
        }
      }

      // Save finalized selections to a separate collection
      for (const finalizedSelection of finalizedData) {
        try {
          // Validate the data before saving
          if (!finalizedSelection.campTitle || !finalizedSelection.campId) {
            console.error('Invalid finalized selection data:', finalizedSelection);
            continue;
          }

          const docRef = await addDoc(collection(db, 'finalizedSelections'), finalizedSelection);
          console.log('Successfully saved finalized selection:', docRef.id);
        } catch (docErr) {
          console.error('Error saving individual finalized selection:', docErr, finalizedSelection);
          throw docErr; // Re-throw to be caught by outer try-catch
        }
      }

      alert(`Selections finalized successfully! ${finalizedData.length} selection(s) moved to finalized list.`);
      fetchSubmissions(); // Refresh data to remove finalized submissions
      setSelectedCadets([]); // Clear current selections
    } catch (err) {
      console.error('Error finalizing selections:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      alert(`Error finalizing selections: ${errorMessage}. Please try again.`);
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (selectedCamp && submission.campId !== selectedCamp) return false;
    if (searchTerm && !submission.collegeName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !submission.cadets.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false;
    }
    return true;
  });

  const selectedCount = selectedCadets.filter(sc => sc.status === 'selected').length;
  const reserveCount = selectedCadets.filter(sc => sc.status === 'reserve').length;
  const totalCadets = filteredSubmissions.reduce((acc, submission) => acc + submission.cadets.length, 0);

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
        <h1 className="text-3xl font-bold text-gray-900">Review Cadets</h1>
        <p className="text-gray-600 mt-1">
          Select cadets for next level from ANO submissions
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white"
        >
          <div className="flex items-center gap-3">
            <Users size={32} />
            <div>
              <h3 className="text-2xl font-bold">{totalCadets}</h3>
              <p className="text-purple-100">Total Cadets</p>
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
            <CheckCircle size={32} />
            <div>
              <h3 className="text-2xl font-bold">{selectedCount}</h3>
              <p className="text-green-100">Selected</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white"
        >
          <div className="flex items-center gap-3">
            <Award size={32} />
            <div>
              <h3 className="text-2xl font-bold">{reserveCount}</h3>
              <p className="text-blue-100">Reserve</p>
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
            <Building size={32} />
            <div>
              <h3 className="text-2xl font-bold">{filteredSubmissions.length}</h3>
              <p className="text-orange-100">Submissions</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search cadets or colleges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedCamp}
              onChange={(e) => setSelectedCamp(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
            >
              <option value="">All Camps</option>
              {camps.map((camp) => (
                <option key={camp.id} value={camp.id}>{camp.title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={finalizeSelections}
            disabled={selectedCount === 0}
            className="flex items-center justify-center gap-2 bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle size={18} />
            Finalize Selections
          </motion.button>
        </div>
      </motion.div>

      {/* Submissions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-6"
      >
        {filteredSubmissions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <Users className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No cadet submissions found</p>
            <p className="text-gray-500 text-sm mt-1">Submissions from ANOs will appear here</p>
          </div>
        ) : (
          filteredSubmissions.map((submission, index) => (
            <motion.div
              key={submission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{submission.campTitle}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Building size={16} />
                        <span>{submission.collegeName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} />
                        <span>ANO: {submission.anoName || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                    {submission.cadets.length} Cadets
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {submission.cadets.map((cadet, cadetIndex) => {
                    const status = getCadetStatus(submission.id, cadetIndex);
                    return (
                      <div
                        key={cadetIndex}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="font-semibold text-gray-900">{cadet.rank} {cadet.name}</p>
                              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                <Mail size={14} />
                                <span>{cadet.email}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone size={14} />
                              <span>{cadet.whatsappNumber}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(status)}`}>
                                {getStatusIcon(status)}
                                {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleCadetSelection(
                                submission.id, 
                                cadetIndex, 
                                cadet, 
                                submission.collegeName, 
                                submission.campTitle, 
                                'selected'
                              )}
                              disabled={notificationLoading === `${submission.id}-${cadetIndex}-selected`}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                                status === 'selected' 
                                  ? 'bg-green-600 text-white' 
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {notificationLoading === `${submission.id}-${cadetIndex}-selected` ? (
                                <>
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-3 h-3 border border-current border-t-transparent rounded-full"
                                  />
                                  Notifying...
                                </>
                              ) : (
                                'Select'
                              )}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleCadetSelection(
                                submission.id, 
                                cadetIndex, 
                                cadet, 
                                submission.collegeName, 
                                submission.campTitle, 
                                'reserve'
                              )}
                              disabled={notificationLoading === `${submission.id}-${cadetIndex}-reserve`}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                                status === 'reserve' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {notificationLoading === `${submission.id}-${cadetIndex}-reserve` ? (
                                <>
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-3 h-3 border border-current border-t-transparent rounded-full"
                                  />
                                  Notifying...
                                </>
                              ) : (
                                'Reserve'
                              )}
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
};