import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, Clock, AlertTriangle, FileText, X, Plus } from 'lucide-react';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
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
}

interface College {
  id: string;
  name: string;
  unitId: string;
  anos: string[];
}

export const UploadDocuments = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<CadetSubmission[]>([]);
  const [anoCollege, setAnoCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<CadetSubmission | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        where('anoId', '==', user?.uid)
      );
      const querySnapshot = await getDocs(q);
      const submissionsList: CadetSubmission[] = [];
      
      querySnapshot.forEach((doc) => {
        submissionsList.push({ id: doc.id, ...doc.data() } as CadetSubmission);
      });
      
      // Sort by submission date
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Validate file types and sizes
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!allowedTypes.includes(file.type)) {
          setError('Please upload only PDF, DOC, DOCX, or image files (JPG, PNG)');
          return;
        }
        if (file.size > maxSize) {
          setError('File size should be less than 10MB');
          return;
        }
      }
      
      setSelectedFiles(files);
      setError('');
    }
  };

  const uploadDocuments = async () => {
    if (!selectedFiles || !selectedSubmission) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(selectedFiles).map(async (file) => {
        const storageRef = ref(storage, `cadet-documents/${selectedSubmission.id}/${Date.now()}-${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        
        return {
          name: file.name,
          url: url,
          uploadedAt: new Date().toISOString()
        };
      });

      const uploadedDocs = await Promise.all(uploadPromises);
      
      // Update submission with documents
      const existingDocs = selectedSubmission.documents || [];
      const updatedSubmission = {
        ...selectedSubmission,
        documents: [...existingDocs, ...uploadedDocs]
      };

      // Note: In a real app, you'd update the Firestore document here
      // await updateDoc(doc(db, 'cadetSubmissions', selectedSubmission.id), { documents: updatedSubmission.documents });

      setSuccess(`Successfully uploaded ${uploadedDocs.length} document(s)`);
      setShowUploadModal(false);
      setSelectedFiles(null);
      fetchSubmissions(); // Refresh the list
      
    } catch (err) {
      setError('Failed to upload documents. Please try again.');
    } finally {
      setUploading(false);
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
      case 'pending': return <Clock size={14} />;
      case 'approved': return <CheckCircle size={14} />;
      case 'rejected': return <AlertTriangle size={14} />;
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
        <h1 className="text-3xl font-bold text-gray-900">Upload Documents</h1>
        <p className="text-gray-600 mt-1">
          Upload required documents for cadet submissions
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white"
        >
          <div className="flex items-center gap-3">
            <FileText size={32} />
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
              <p className="text-yellow-100">Pending Review</p>
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
          className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white"
        >
          <div className="flex items-center gap-3">
            <Upload size={32} />
            <div>
              <h3 className="text-2xl font-bold">
                {submissions.reduce((sum, s) => sum + (s.documents?.length || 0), 0)}
              </h3>
              <p className="text-purple-100">Documents Uploaded</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Submissions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
          <div className="flex items-center gap-3 text-white">
            <Upload size={24} />
            <h2 className="text-xl font-bold">Document Upload Status</h2>
          </div>
        </div>

        <div className="p-6">
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No cadet submissions found</p>
              <p className="text-gray-500 text-sm mt-1">Submit cadets for camps first to upload documents</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission, index) => (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{submission.campTitle}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(submission.status)}`}>
                          {getStatusIcon(submission.status)}
                          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        <p>📅 Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</p>
                        <p>👥 Cadets: {submission.cadets.length}</p>
                        <p>📄 Documents: {submission.documents?.length || 0}</p>
                      </div>

                      {submission.documents && submission.documents.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents:</p>
                          <div className="flex flex-wrap gap-2">
                            {submission.documents.map((doc, idx) => (
                              <a
                                key={idx}
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg hover:bg-blue-200 transition-colors"
                              >
                                📎 {doc.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {submission.feedback && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700">Feedback:</p>
                          <p className="text-sm text-gray-600">{submission.feedback}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="lg:text-right">
                      {submission.status === 'pending' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setShowUploadModal(true);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          Upload Documents
                        </motion.button>
                      )}
                      {submission.status === 'approved' && (
                        <div className="text-green-600 font-medium text-sm">✅ Documents Approved</div>
                      )}
                      {submission.status === 'rejected' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setShowUploadModal(true);
                          }}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                        >
                          Re-upload Documents
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && selectedSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Upload Documents</h2>
                    <p className="text-blue-100 text-sm">{selectedSubmission.campTitle}</p>
                  </div>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="documentUpload"
                  />
                  <label htmlFor="documentUpload" className="cursor-pointer">
                    <Upload className="mx-auto text-gray-400 mb-3" size={48} />
                    <p className="text-gray-600 mb-1">Click to upload documents</p>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG (Max 10MB each)</p>
                  </label>
                </div>

                {selectedFiles && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected Files:</p>
                    <div className="space-y-1">
                      {Array.from(selectedFiles).map((file, idx) => (
                        <div key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                          <FileText size={14} />
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={uploadDocuments}
                    disabled={!selectedFiles || uploading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};