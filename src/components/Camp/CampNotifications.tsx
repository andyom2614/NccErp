import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  CreditCard as Edit2, 
  Trash2, 
  X, 
  Calendar, 
  MapPin, 
  Users, 
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  Building,
  UserCheck
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { sendCampNotificationToAnos, sendCampNotificationToCadets, validateTwilioConfig } from '../../services/whatsappService';
import { getAnoContactsByColleges, getCadetContactsByColleges } from '../../services/googleSheetsService';

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

export const CampNotifications = () => {
  const { userData, user } = useAuth();
  const [notifications, setNotifications] = useState<CampNotification[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState<CampNotification | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reportingDate: '',
    reportingTime: '',
    venue: '',
    vacancies: {} as { [collegeId: string]: number },
    officialLetter: null as File | null,
    sendTo: 'ano' as 'ano' | 'cadets',
    status: 'draft' as 'draft' | 'published' | 'closed',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<{
    sent: number;
    failed: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    fetchNotifications();
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      if (!user?.uid) return;

      // Find the unit where this user is either CO or Clerk
      const unitsQuery = query(
        collection(db, 'units'),
        where('coId', '==', user.uid)
      );
      const clerkQuery = query(
        collection(db, 'units'),
        where('clerkId', '==', user.uid)
      );

      let unitId: string | null = null;
      
      // Check if user is CO
      const coUnitsSnapshot = await getDocs(unitsQuery);
      if (!coUnitsSnapshot.empty) {
        coUnitsSnapshot.forEach((doc) => {
          unitId = doc.id;
        });
      } else {
        // Check if user is Clerk
        const clerkUnitsSnapshot = await getDocs(clerkQuery);
        if (!clerkUnitsSnapshot.empty) {
          clerkUnitsSnapshot.forEach((doc) => {
            unitId = doc.id;
          });
        }
      }

      if (unitId) {
        // Fetch colleges for this unit
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
      }
    } catch (err) {
      console.error('Error fetching colleges:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const q = query(collection(db, 'campNotifications'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const notificationsData: CampNotification[] = [];
      querySnapshot.forEach((doc) => {
        notificationsData.push({
          id: doc.id,
          ...doc.data(),
        } as CampNotification);
      });
      setNotifications(notificationsData);
    } catch (err) {
      console.error('Error fetching camp notifications:', err);
      setError('Failed to fetch camp notifications');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (!formData.title.trim()) {
      setError('Camp title is required');
      setLoading(false);
      return;
    }

    if (!formData.reportingDate) {
      setError('Reporting date is required');
      setLoading(false);
      return;
    }

    if (!formData.reportingTime) {
      setError('Reporting time is required');
      setLoading(false);
      return;
    }

    if (!formData.venue.trim()) {
      setError('Venue is required');
      setLoading(false);
      return;
    }

    // Check if at least one college has vacancies
    const hasVacancies = Object.values(formData.vacancies).some(count => count > 0);
    if (!hasVacancies) {
      setError('Please assign vacancies to at least one college');
      setLoading(false);
      return;
    }

    try {
      let officialLetterUrl = '';
      
      // Upload file if provided
      if (formData.officialLetter) {
        setUploadingFile(true);
        const storageRef = ref(storage, `camp-notifications/${Date.now()}-${formData.officialLetter.name}`);
        const snapshot = await uploadBytes(storageRef, formData.officialLetter);
        officialLetterUrl = await getDownloadURL(snapshot.ref);
        setUploadingFile(false);
      }

      const notificationData = {
        title: formData.title,
        description: formData.description || '',
        reportingDate: formData.reportingDate,
        reportingTime: formData.reportingTime,
        venue: formData.venue,
        vacancies: formData.vacancies,
        officialLetter: officialLetterUrl,
        sendTo: formData.sendTo,
        createdBy: userData?.email || 'Unknown',
        status: formData.status,
        createdAt: editingNotification ? editingNotification.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingNotification) {
        await updateDoc(doc(db, 'campNotifications', editingNotification.id), notificationData);
        setSuccess('Camp notification updated successfully!');
      } else {
        await addDoc(collection(db, 'campNotifications'), notificationData);
        
        // Send WhatsApp notifications if it's a new notification
        if (formData.sendTo === 'ano' || formData.sendTo === 'cadets') {
          await sendWhatsAppNotifications(notificationData);
        }
        
        setSuccess('Camp notification created successfully!');
      }

      await fetchNotifications();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || 'Failed to save camp notification');
    } finally {
      setLoading(false);
      setUploadingFile(false);
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!confirm('Are you sure you want to delete this camp notification?')) return;

    try {
      await deleteDoc(doc(db, 'campNotifications', notificationId));
      setSuccess('Camp notification deleted successfully!');
      await fetchNotifications();
    } catch (err: any) {
      setError(err.message || 'Failed to delete camp notification');
    }
  };

  const handleEdit = (notification: CampNotification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      description: notification.description || '',
      reportingDate: notification.reportingDate,
      reportingTime: notification.reportingTime,
      venue: notification.venue,
      vacancies: notification.vacancies,
      officialLetter: null,
      sendTo: notification.sendTo,
      status: notification.status,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingNotification(null);
    setFormData({
      title: '',
      description: '',
      reportingDate: '',
      reportingTime: '',
      venue: '',
      vacancies: {},
      officialLetter: null,
      sendTo: 'ano',
      status: 'draft',
    });
    setError('');
  };

  const handleVacancyChange = (collegeId: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      vacancies: {
        ...prev.vacancies,
        [collegeId]: value
      }
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload only PDF or image files (JPG, PNG)');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        officialLetter: file
      }));
      setError('');
    }
  };

  const getCollegeName = (collegeId: string) => {
    const college = colleges.find(c => c.id === collegeId);
    return college ? college.name : 'Unknown College';
  };

  const sendWhatsAppNotifications = async (notificationData: any) => {
    try {
      setSendingWhatsApp(true);
      setWhatsappStatus(null);
      
      // Validate Twilio configuration
      const twilioConfig = validateTwilioConfig();
      if (!twilioConfig.isValid) {
        setError(`WhatsApp configuration missing: ${twilioConfig.missingVars.join(', ')}. Please contact administrator.`);
        setSendingWhatsApp(false);
        return;
      }

      // Validate Google Sheets configuration
      const { validateGoogleSheetsConfig } = await import('../../services/googleSheetsService');
      const googleConfig = validateGoogleSheetsConfig();
      if (!googleConfig.isValid) {
        setError(`Google Sheets configuration missing: ${googleConfig.missingVars.join(', ')}. Please contact administrator.`);
        setSendingWhatsApp(false);
        return;
      }

      // Get colleges that have vacancies assigned
      const collegesWithVacancies = Object.keys(notificationData.vacancies).filter(
        collegeId => notificationData.vacancies[collegeId] > 0
      );

      if (collegesWithVacancies.length === 0) {
        setSendingWhatsApp(false);
        return;
      }

      // Get college names for these colleges
      const collegeNames: string[] = [];
      console.log('DEBUG - Colleges with vacancies (IDs):', collegesWithVacancies);
      
      for (const collegeId of collegesWithVacancies) {
        const college = colleges.find(c => c.id === collegeId);
        if (college) {
          collegeNames.push(college.name);
          console.log(`DEBUG - College ${collegeId} -> ${college.name}`);
        }
      }

      console.log('DEBUG - College names for Google Sheets lookup:', collegeNames);

      if (collegeNames.length === 0) {
        setError('No college names found for the selected colleges.');
        setSendingWhatsApp(false);
        return;
      }

      let totalSent = 0;
      let totalFailed = 0;
      let totalContacts = 0;
      const results: string[] = [];

      // Send to ANOs (always send to ANOs regardless of selection)
      const anoContacts = await getAnoContactsByColleges(collegeNames);
      console.log('DEBUG - Matched ANO contacts from Google Sheets:', anoContacts);

      if (anoContacts.length > 0) {
        const campDetailsForAnos = {
          title: notificationData.title,
          description: notificationData.description,
          reportingDate: notificationData.reportingDate,
          reportingTime: notificationData.reportingTime,
          venue: notificationData.venue,
          createdBy: notificationData.createdBy
        };

        const anoResult = await sendCampNotificationToAnos(campDetailsForAnos, collegeNames);
        totalSent += anoResult.sentCount;
        totalFailed += anoResult.failedCount;
        totalContacts += anoContacts.length;
        results.push(`${anoResult.sentCount} ANOs`);
      }

      // Send to Cadets only if 'cadets' is selected
      if (notificationData.sendTo === 'cadets') {
        const cadetContacts = await getCadetContactsByColleges(collegeNames);
        console.log('DEBUG - Matched Cadet contacts from Google Sheets:', cadetContacts);

        if (cadetContacts.length > 0) {
          const campDetailsForCadets = {
            title: notificationData.title,
            reportingDate: notificationData.reportingDate,
            reportingTime: notificationData.reportingTime
          };

          const cadetResult = await sendCampNotificationToCadets(campDetailsForCadets, collegeNames);
          totalSent += cadetResult.sentCount;
          totalFailed += cadetResult.failedCount;
          totalContacts += cadetContacts.length;
          results.push(`${cadetResult.sentCount} Cadets`);
        }
      }
      
      setWhatsappStatus({
        sent: totalSent,
        failed: totalFailed,
        total: totalContacts
      });

      if (totalSent > 0) {
        setSuccess(`Camp notification created and WhatsApp messages sent to ${results.join(' and ')}!`);
      } else {
        setError('Camp notification created but failed to send WhatsApp messages. Please check your configuration and ensure contacts exist in Google Sheets.');
      }

    } catch (err: any) {
      console.error('Error sending WhatsApp notifications:', err);
      setError('Camp notification created but WhatsApp sending failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const filteredNotifications = notifications.filter(
    (notification) =>
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.sendTo.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      case 'published': return <CheckCircle size={14} />;
      case 'closed': return <AlertCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const sendToLabels = {
    ano: 'ANOs Only',
    cadets: 'Cadets & ANOs',
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Camp Notifications</h1>
          <p className="text-gray-600 mt-1">Create and manage NCC camp notifications</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
        >
          <Plus size={20} />
          Create Camp Notification
        </motion.button>
      </motion.div>

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

      {sendingWhatsApp && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-3"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"
          />
          <span>Sending WhatsApp notifications to ANOs...</span>
        </motion.div>
      )}

      {whatsappStatus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <CheckCircle size={18} />
            <span>
              WhatsApp Status: {whatsappStatus.sent} sent, {whatsappStatus.failed} failed out of {whatsappStatus.total} total
            </span>
          </div>
          <button onClick={() => setWhatsappStatus(null)} className="text-green-700 hover:text-green-900">
            <X size={18} />
          </button>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
      >
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by title, venue, or send to..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText size={20} className="text-orange-600" />
            All Notifications ({filteredNotifications.length})
          </h2>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(notification.status)}`}>
                        {getStatusIcon(notification.status)}
                        {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                      </span>
                    </div>
                    
                    {notification.description && (
                      <p className="text-gray-600 mb-3">{notification.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} />
                        <span>{new Date(notification.reportingDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={16} />
                        <span>{notification.reportingTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={16} />
                        <span>{notification.venue}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <UserCheck size={16} />
                        <span>{sendToLabels[notification.sendTo]}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex items-center gap-2 text-gray-700 mb-2">
                        <Users size={16} className="text-purple-600" />
                        <span className="font-medium">Vacancies by College:</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
                        {Object.entries(notification.vacancies).map(([collegeId, count]) => 
                          count > 0 ? (
                            <div key={collegeId} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-700">{getCollegeName(collegeId)}</span>
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                {count} {count === 1 ? 'vacancy' : 'vacancies'}
                              </span>
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-500">
                      {notification.officialLetter && (
                        <p><strong>Official Letter:</strong> <a href={notification.officialLetter} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Document</a></p>
                      )}
                      <p><strong>Created by:</strong> {notification.createdBy}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(notification)}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Edit notification"
                    >
                      <Edit2 size={18} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredNotifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No camp notifications found</p>
            <p className="text-gray-500 text-sm mt-1">Create your first notification to get started</p>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    {editingNotification ? 'Edit Camp Notification' : 'Create Camp Notification'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form id="campNotificationForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Camp Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="Enter camp title"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="Enter camp description (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reporting Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.reportingDate}
                      onChange={(e) => setFormData({ ...formData, reportingDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reporting Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.reportingTime}
                      onChange={(e) => setFormData({ ...formData, reportingTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Venue <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="Enter camp venue"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vacancies <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
                      {colleges.length > 0 ? (
                        colleges.map((college) => (
                          <div key={college.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 flex-1">
                              <Building size={16} className="text-purple-600" />
                              <span className="text-sm font-medium text-gray-900">{college.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={formData.vacancies[college.id] || 0}
                                onChange={(e) => handleVacancyChange(college.id, parseInt(e.target.value) || 0)}
                                className="w-20 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                min="0"
                                max="50"
                                placeholder="0"
                              />
                              <span className="text-xs text-gray-500">cadets</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <Building className="mx-auto text-gray-400 mb-2" size={32} />
                          <p className="text-gray-600 text-sm">No colleges assigned to your unit</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Official Letter
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-400 transition-colors">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                        id="officialLetter"
                      />
                      <label htmlFor="officialLetter" className="cursor-pointer">
                        <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                        <p className="text-sm text-gray-600">
                          Click to upload official letter (PDF, JPG, PNG)
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Max file size: 5MB</p>
                      </label>
                      {formData.officialLetter && (
                        <p className="mt-2 text-sm text-green-600">
                          Selected: {formData.officialLetter.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Send To <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.sendTo}
                      onChange={(e) => setFormData({ ...formData, sendTo: e.target.value as 'ano' | 'cadets' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      required
                    >
                      <option value="ano">ANOs Only</option>
                      <option value="cadets">Cadets & ANOs</option>
                    </select>
                    {formData.sendTo === 'ano' && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-700">
                          <UserCheck size={16} />
                          <span className="text-sm font-medium">WhatsApp Notification</span>
                        </div>
                        <p className="text-sm text-blue-600 mt-1">
                          ANOs will automatically receive WhatsApp notifications with camp details when this notification is created.
                        </p>
                      </div>
                    )}
                    {formData.sendTo === 'cadets' && (
                      <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-2 text-purple-700">
                          <UserCheck size={16} />
                          <span className="text-sm font-medium">WhatsApp Notifications</span>
                        </div>
                        <p className="text-sm text-purple-600 mt-1">
                          Both ANOs and Cadets will receive WhatsApp notifications. ANOs get full camp details, Cadets get vacancy allocation notice.
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' | 'closed' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              </form>

              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex gap-3">
                  <motion.button
                    type="button"
                    onClick={handleCloseModal}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    form="campNotificationForm"
                    disabled={loading || uploadingFile || sendingWhatsApp}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading || uploadingFile || sendingWhatsApp ? (
                      <div className="flex items-center justify-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        {uploadingFile ? 'Uploading...' : sendingWhatsApp ? 'Sending WhatsApp...' : 'Saving...'}
                      </div>
                    ) : editingNotification ? (
                      'Update Notification'
                    ) : (
                      'Create Notification'
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