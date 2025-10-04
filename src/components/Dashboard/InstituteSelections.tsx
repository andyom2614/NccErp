import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Trophy, 
  Calendar, 
  School,
  Download,
  Eye,
  Filter,
  Award,
  X
} from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface InstituteSelection {
  id: string;
  selectedCadets: {
    name: string;
    rank: string;
    email: string;
    whatsappNumber: string;
    collegeName: string;
    campTitle: string;
    submissionId: string;
  }[];
  selectionDate: string;
  status: string;
  totalSelected: number;
  campBreakdown: { [key: string]: number };
  collegeBreakdown: { [key: string]: number };
}

export const InstituteSelections = () => {
  const [selections, setSelections] = useState<InstituteSelection[]>([]);
  const [selectedView, setSelectedView] = useState<InstituteSelection | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchInstituteSelections();
  }, []);

  const fetchInstituteSelections = async () => {
    try {
      setLoading(true);
      let q;
      try {
        q = query(
          collection(db, 'instituteLevelSelections'),
          orderBy('selectionDate', 'desc')
        );
      } catch (indexError) {
        // Fallback without orderBy if index doesn't exist
        q = collection(db, 'instituteLevelSelections');
      }
      
      const querySnapshot = await getDocs(q);
      const selectionsList: InstituteSelection[] = [];
      
      querySnapshot.forEach((doc) => {
        selectionsList.push({ id: doc.id, ...doc.data() } as InstituteSelection);
      });
      
      // Sort in JavaScript if index wasn't available
      selectionsList.sort((a, b) => 
        new Date(b.selectionDate).getTime() - new Date(a.selectionDate).getTime()
      );
      
      setSelections(selectionsList);
    } catch (err) {
      console.error('Error fetching institute selections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSelection = (selection: InstituteSelection) => {
    setSelectedView(selection);
    setShowModal(true);
  };

  const exportToCSV = (selection: InstituteSelection) => {
    const headers = ['Rank', 'Name', 'Email', 'WhatsApp', 'College', 'Camp'];
    const csvContent = [
      headers.join(','),
      ...selection.selectedCadets.map(cadet => 
        [
          cadet.rank,
          cadet.name,
          cadet.email,
          cadet.whatsappNumber,
          cadet.collegeName,
          cadet.campTitle
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `institute-selection-${new Date(selection.selectionDate).toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Institute Level Selections</h1>
        <p className="text-gray-600 mt-1">
          View and manage cadets selected for institute level participation
        </p>
      </motion.div>

      {/* Statistics */}
      {selections.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white"
          >
            <div className="flex items-center gap-3">
              <Trophy size={32} />
              <div>
                <h3 className="text-2xl font-bold">{selections.length}</h3>
                <p className="text-purple-100">Selection Batches</p>
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
              <Award size={32} />
              <div>
                <h3 className="text-2xl font-bold">
                  {selections.reduce((sum, s) => sum + s.totalSelected, 0)}
                </h3>
                <p className="text-green-100">Total Selected</p>
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
              <School size={32} />
              <div>
                <h3 className="text-2xl font-bold">
                  {selections.length > 0 ? Object.keys(selections[0].collegeBreakdown || {}).length : 0}
                </h3>
                <p className="text-blue-100">Participating Colleges</p>
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
              <Calendar size={32} />
              <div>
                <h3 className="text-2xl font-bold">
                  {selections.length > 0 ? new Date(selections[0].selectionDate).toLocaleDateString() : '-'}
                </h3>
                <p className="text-orange-100">Latest Selection</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Selections List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-md border border-gray-100"
      >
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6 rounded-t-xl">
          <div className="flex items-center gap-3 text-white">
            <Trophy size={24} />
            <h2 className="text-xl font-bold">Institute Level Selection History</h2>
          </div>
        </div>

        <div className="p-6">
          {selections.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No institute level selections yet</p>
              <p className="text-gray-500 text-sm mt-1">
                Selections will appear here once clerks finalize cadet selections
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {selections.map((selection, index) => (
                <motion.div
                  key={selection.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
                          <Award className="text-orange-600" size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            Institute Selection #{index + 1}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(selection.selectionDate).toLocaleDateString()} - {selection.totalSelected} cadets selected
                          </p>
                        </div>
                      </div>

                      {/* Breakdowns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Camp Distribution:</p>
                          <div className="space-y-1">
                            {Object.entries(selection.campBreakdown || {}).map(([camp, count]) => (
                              <div key={camp} className="flex justify-between text-sm">
                                <span className="text-gray-600 truncate">{camp}</span>
                                <span className="font-medium text-gray-900 ml-2">{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">College Distribution:</p>
                          <div className="space-y-1">
                            {Object.entries(selection.collegeBreakdown || {}).slice(0, 3).map(([college, count]) => (
                              <div key={college} className="flex justify-between text-sm">
                                <span className="text-gray-600 truncate">{college}</span>
                                <span className="font-medium text-gray-900 ml-2">{count}</span>
                              </div>
                            ))}
                            {Object.keys(selection.collegeBreakdown || {}).length > 3 && (
                              <div className="text-sm text-gray-500">
                                +{Object.keys(selection.collegeBreakdown || {}).length - 3} more colleges
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewSelection(selection)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        <Eye size={18} />
                        View Details
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => exportToCSV(selection)}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        <Download size={18} />
                        Export CSV
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Selection Details Modal */}
      {showModal && selectedView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Selected Cadets Details</h3>
                <p className="text-orange-100">
                  Selection Date: {new Date(selectedView.selectionDate).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  Total Selected: {selectedView.totalSelected} Cadets
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {selectedView.selectedCadets.map((cadet, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
                          <Award className="text-orange-600" size={20} />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">
                            {cadet.rank} {cadet.name}
                          </h5>
                          <p className="text-sm text-gray-600">{cadet.email}</p>
                          <p className="text-sm text-gray-500">📱 {cadet.whatsappNumber}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {cadet.collegeName}
                            </span>
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                              {cadet.campTitle}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => exportToCSV(selectedView)}
                className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Export CSV
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};