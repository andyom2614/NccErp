import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Award, 
  Download, 
  Calendar,
  Users,
  Building,
  Trophy,
  Eye,
  Mail,
  Phone,
  Search,
  Filter,
  ChevronDown
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface FinalizedSelection {
  id: string;
  campId: string;
  campTitle: string;
  collegeName: string;
  submissionId: string;
  selectedCadets: {
    name: string;
    rank: string;
    email: string;
    whatsappNumber: string;
    status: 'selected';
    collegeName: string;
  }[];
  reserveCadets: {
    name: string;
    rank: string;
    email: string;
    whatsappNumber: string;
    status: 'reserve';
    collegeName: string;
  }[];
  finalizedAt: string;
  finalizedBy: string;
  reviewerName: string;
}

interface CampNotification {
  id: string;
  title: string;
  dates: string;
  location: string;
}

export const FinalizedSelections = () => {
  const { user } = useAuth();
  const [finalizedSelections, setFinalizedSelections] = useState<FinalizedSelection[]>([]);
  const [camps, setCamps] = useState<CampNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCamp, setSelectedCamp] = useState<string>('');
  const [expandedCard, setExpandedCard] = useState<string>('');

  useEffect(() => {
    if (user?.uid) {
      fetchFinalizedSelections();
      fetchCamps();
    }
  }, [user]);

  const fetchFinalizedSelections = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'finalizedSelections'));
      const selectionsList: FinalizedSelection[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        selectionsList.push({ id: doc.id, ...data } as FinalizedSelection);
      });
      
      // Sort by finalized date (newest first)
      selectionsList.sort((a, b) => 
        new Date(b.finalizedAt).getTime() - new Date(a.finalizedAt).getTime()
      );
      
      setFinalizedSelections(selectionsList);
    } catch (err) {
      console.error('Error fetching finalized selections:', err);
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

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? '' : cardId);
  };

  const exportToCSV = (selection: FinalizedSelection) => {
    const csvData = [
      ['Camp Title', 'College', 'Cadet Name', 'Rank', 'Email', 'WhatsApp', 'Status', 'Finalized Date'],
      ...selection.selectedCadets.map(cadet => [
        selection.campTitle,
        cadet.collegeName,
        cadet.name,
        cadet.rank,
        cadet.email,
        cadet.whatsappNumber,
        'Selected',
        new Date(selection.finalizedAt).toLocaleDateString()
      ]),
      ...selection.reserveCadets.map(cadet => [
        selection.campTitle,
        cadet.collegeName,
        cadet.name,
        cadet.rank,
        cadet.email,
        cadet.whatsappNumber,
        'Reserve',
        new Date(selection.finalizedAt).toLocaleDateString()
      ])
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selection.campTitle}_Finalized_Selections.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSelections = finalizedSelections.filter(selection => {
    if (selectedCamp && selection.campId !== selectedCamp) return false;
    if (searchTerm && 
        !selection.campTitle.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selection.collegeName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selection.selectedCadets.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
        !selection.reserveCadets.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false;
    }
    return true;
  });

  const totalSelected = finalizedSelections.reduce((acc, sel) => acc + sel.selectedCadets.length, 0);
  const totalReserve = finalizedSelections.reduce((acc, sel) => acc + sel.reserveCadets.length, 0);
  const totalCamps = new Set(finalizedSelections.map(sel => sel.campId)).size;

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
        <h1 className="text-3xl font-bold text-gray-900">Finalized Selections</h1>
        <p className="text-gray-600 mt-1">
          View and manage finalized cadet selections for camps
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-md p-6 text-white"
        >
          <div className="flex items-center gap-3">
            <CheckCircle size={32} />
            <div>
              <h3 className="text-2xl font-bold">{totalSelected}</h3>
              <p className="text-green-100">Selected Cadets</p>
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
            <Award size={32} />
            <div>
              <h3 className="text-2xl font-bold">{totalReserve}</h3>
              <p className="text-blue-100">Reserve Cadets</p>
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
            <Trophy size={32} />
            <div>
              <h3 className="text-2xl font-bold">{totalCamps}</h3>
              <p className="text-purple-100">Camps Finalized</p>
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
              <h3 className="text-2xl font-bold">{filteredSelections.length}</h3>
              <p className="text-orange-100">Total Selections</p>
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
              placeholder="Search camps, colleges, or cadets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedCamp}
              onChange={(e) => setSelectedCamp(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
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
            onClick={() => {
              const allData = filteredSelections.flatMap(selection => [
                ...selection.selectedCadets.map(cadet => ({
                  ...cadet,
                  campTitle: selection.campTitle,
                  finalizedAt: selection.finalizedAt
                })),
                ...selection.reserveCadets.map(cadet => ({
                  ...cadet,
                  campTitle: selection.campTitle,
                  finalizedAt: selection.finalizedAt
                }))
              ]);
              
              const csvData = [
                ['Camp Title', 'College', 'Cadet Name', 'Rank', 'Email', 'WhatsApp', 'Status', 'Finalized Date'],
                ...allData.map(cadet => [
                  cadet.campTitle,
                  cadet.collegeName,
                  cadet.name,
                  cadet.rank,
                  cadet.email,
                  cadet.whatsappNumber,
                  cadet.status === 'selected' ? 'Selected' : 'Reserve',
                  new Date(cadet.finalizedAt).toLocaleDateString()
                ])
              ];

              const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement('a');
              const url = URL.createObjectURL(blob);
              link.setAttribute('href', url);
              link.setAttribute('download', 'All_Finalized_Selections.csv');
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <Download size={18} />
            Export All
          </motion.button>
        </div>
      </motion.div>

      {/* Finalized Selections List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-6"
      >
        {filteredSelections.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <Trophy className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No finalized selections found</p>
            <p className="text-gray-500 text-sm mt-1">Finalized selections will appear here</p>
          </div>
        ) : (
          filteredSelections.map((selection, index) => (
            <motion.div
              key={selection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 border-b border-green-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{selection.campTitle}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Building size={16} />
                        <span>{selection.collegeName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>Finalized: {new Date(selection.finalizedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} />
                        <span>By: {selection.reviewerName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                      {selection.selectedCadets.length} Selected
                    </span>
                    <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                      {selection.reserveCadets.length} Reserve
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => exportToCSV(selection)}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Export to CSV"
                    >
                      <Download size={16} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleCardExpansion(selection.id)}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <Eye size={16} />
                    </motion.button>
                  </div>
                </div>
              </div>

              {expandedCard === selection.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Selected Cadets */}
                    <div>
                      <h4 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
                        <CheckCircle size={20} />
                        Selected Cadets ({selection.selectedCadets.length})
                      </h4>
                      <div className="space-y-3">
                        {selection.selectedCadets.map((cadet, idx) => (
                          <div key={idx} className="border border-green-200 rounded-lg p-4 bg-green-50">
                            <p className="font-semibold text-gray-900">{cadet.rank} {cadet.name}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                              <div className="flex items-center gap-1">
                                <Mail size={14} />
                                <span>{cadet.email}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone size={14} />
                                <span>{cadet.whatsappNumber}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {selection.selectedCadets.length === 0 && (
                          <p className="text-gray-500 text-sm">No cadets selected</p>
                        )}
                      </div>
                    </div>

                    {/* Reserve Cadets */}
                    <div>
                      <h4 className="text-lg font-bold text-blue-700 mb-4 flex items-center gap-2">
                        <Award size={20} />
                        Reserve Cadets ({selection.reserveCadets.length})
                      </h4>
                      <div className="space-y-3">
                        {selection.reserveCadets.map((cadet, idx) => (
                          <div key={idx} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                            <p className="font-semibold text-gray-900">{cadet.rank} {cadet.name}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                              <div className="flex items-center gap-1">
                                <Mail size={14} />
                                <span>{cadet.email}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone size={14} />
                                <span>{cadet.whatsappNumber}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {selection.reserveCadets.length === 0 && (
                          <p className="text-gray-500 text-sm">No reserve cadets</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
};