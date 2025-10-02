import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertTriangle, XCircle, Eye, Calendar, Users } from 'lucide-react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface CadetSubmission {
  id: string;
  campId: string;
  campTitle: string;
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
  documents?: {
    name: string;
    url: string;
    uploadedAt: string;
  }[];
  feedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

interface College {
  id: string;
  name: string;
  unitId: string;
  anos: string[];
}

export const TrackStatus = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<CadetSubmission[]>([]);
  const [anoCollege, setAnoCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<CadetSubmission | null>(null);

  useEffect(() => {
    if (user?.uid) {
      fetchAnoCollege();
      fetchSubmissions();
    }
  }, [user]);

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

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'cadetSubmissions'),
        where('anoId', '==', user?.uid),
        orderBy('submittedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const submissionsList: CadetSubmission[] = [];
      
      querySnapshot.forEach((doc) => {
        submissionsList.push({ id: doc.id, ...doc.data() } as CadetSubmission);
      });
      
      setSubmissions(submissionsList);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      // Fallback without orderBy if index doesn't exist
      try {
        const fallbackQuery = query(
          collection(db, 'cadetSubmissions'),
          where('anoId', '==', user?.uid)
        );
        const fallbackSnapshot = await getDocs(fallbackQuery);
        const submissionsList: CadetSubmission[] = [];
        
        fallbackSnapshot.forEach((doc) => {
          submissionsList.push({ id: doc.id, ...doc.data() } as CadetSubmission);
        });
        
        // Sort in JavaScript
        submissionsList.sort((a, b) => 
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
        
        setSubmissions(submissionsList);
      } catch (fallbackErr) {
        console.error('Error with fallback query:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={20} className="text-yellow-600" />;
      case 'approved': return <CheckCircle size={20} className="text-green-600" />;
      case 'rejected': return <XCircle size={20} className="text-red-600" />;
      default: return <Clock size={20} className="text-gray-600" />;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending': return 'Your submission is under review by the Clerk/CO';
      case 'approved': return 'Your submission has been approved and cadets are confirmed';
      case 'rejected': return 'Your submission needs corrections. Please check feedback and resubmit';
      default: return 'Status unknown';
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
        <h1 className="text-3xl font-bold text-gray-900">Track Status</h1>
        <p className="text-gray-600 mt-1">
          Monitor the status of your cadet submissions and view feedback
        </p>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white"
        >
          <div className="flex items-center gap-3">
            <Users size={32} />
            <div>
              <h3 className="text-2xl font-bold">{submissions.length}</h3>
              <p className="text-blue-100">Total Submissions</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl shadow-md p-6 text-white"
        >
          <div className="flex items-center gap-3">
            <Clock size={32} />
            <div>
              <h3 className="text-2xl font-bold">
                {submissions.filter(s => s.status === 'pending').length}
              </h3>
              <p className="text-yellow-100">Under Review</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white"
        >
          <div className="flex items-center gap-3">
            <CheckCircle size={32} />
            <div>
              <h3 className="text-2xl font-bold">
                {submissions.filter(s => s.status === 'approved').length}
              </h3>
              <p className="text-green-100">Approved</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-md p-6 text-white"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={32} />
            <div>
              <h3 className="text-2xl font-bold">
                {submissions.filter(s => s.status === 'rejected').length}
              </h3>
              <p className="text-red-100">Need Attention</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Status Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
          <div className="flex items-center gap-3 text-white">
            <Eye size={24} />
            <h2 className="text-xl font-bold">Submission Status Timeline</h2>
          </div>
        </div>

        <div className="p-6">
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No submissions found</p>
              <p className="text-gray-500 text-sm mt-1">Submit cadets for camps to track their status here</p>
            </div>
          ) : (
            <div className="space-y-6">
              {submissions.map((submission, index) => (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="relative"
                >
                  {/* Timeline Line */}
                  {index < submissions.length - 1 && (
                    <div className="absolute left-6 top-16 w-0.5 h-16 bg-gray-200"></div>
                  )}
                  
                  <div className="flex gap-4">
                    {/* Status Icon */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                      {getStatusIcon(submission.status)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-900">{submission.campTitle}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(submission.status)}`}>
                                {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                              </span>
                            </div>
                            
                            <p className="text-gray-600 text-sm mb-3">{getStatusDescription(submission.status)}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                <span>Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users size={16} />
                                <span>Cadets: {submission.cadets.length}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Eye size={16} />
                                <span>Documents: {submission.documents?.length || 0}</span>
                              </div>
                            </div>

                            {/* Cadets List */}
                            <div className="mt-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">Submitted Cadets:</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {submission.cadets.map((cadet, idx) => (
                                  <div key={idx} className="text-sm text-gray-600 bg-white rounded px-3 py-2">
                                    {cadet.rank} {cadet.name}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Documents */}
                            {submission.documents && submission.documents.length > 0 && (
                              <div className="mt-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Documents:</p>
                                <div className="flex flex-wrap gap-2">
                                  {submission.documents.map((doc, idx) => (
                                    <a
                                      key={idx}
                                      href={doc.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg hover:bg-blue-200 transition-colors"
                                    >
                                      📎 {doc.name}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Feedback */}
                            {submission.feedback && (
                              <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertTriangle size={16} className="text-orange-600" />
                                  <span className="text-sm font-medium text-gray-700">Feedback from Review:</span>
                                </div>
                                <p className="text-sm text-gray-600">{submission.feedback}</p>
                                {submission.reviewedBy && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    Reviewed by: {submission.reviewedBy} 
                                    {submission.reviewedAt && ` on ${new Date(submission.reviewedAt).toLocaleDateString()}`}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Action Button */}
                          <div className="flex-shrink-0">
                            {submission.status === 'rejected' && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                              >
                                Resubmit
                              </motion.button>
                            )}
                            {submission.status === 'approved' && (
                              <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium text-center">
                                ✅ Confirmed
                              </div>
                            )}
                            {submission.status === 'pending' && (
                              <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium text-center">
                                ⏳ In Review
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
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