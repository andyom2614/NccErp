import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  School, 
  Plus, 
  CreditCard as Edit2, 
  Trash2, 
  X, 
  Search,
  Users,
  Shield,
  Building,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface College {
  id: string;
  name: string;
  unitId: string;
  anos: string[];
  createdAt: string;
}

interface Unit {
  id: string;
  name: string;
  coId: string;
  clerkId: string;
  colleges: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ano' | 'clerk' | 'co';
  college?: string;
  unit?: string;
}

export const ManageColleges = () => {
  const { userData } = useAuth();
  const [colleges, setColleges] = useState<College[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    unitId: '',
    anos: [] as string[],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchColleges();
    fetchUnits();
    fetchUsers();
  }, []);

  const fetchColleges = async () => {
    try {
      const q = query(collection(db, 'colleges'), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const collegesData: College[] = [];
      querySnapshot.forEach((doc) => {
        collegesData.push({
          id: doc.id,
          ...doc.data(),
        } as College);
      });
      setColleges(collegesData);
    } catch (err) {
      console.error('Error fetching colleges:', err);
      setError('Failed to fetch colleges');
    }
  };

  const fetchUnits = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'units'));
      const unitsData: Unit[] = [];
      querySnapshot.forEach((doc) => {
        unitsData.push({
          id: doc.id,
          ...doc.data(),
        } as Unit);
      });
      setUnits(unitsData);
    } catch (err) {
      console.error('Error fetching units:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData: User[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.role === 'ano') {
          usersData.push({
            id: doc.id,
            ...data,
          } as User);
        }
      });
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (!formData.name.trim()) {
      setError('College name is required');
      setLoading(false);
      return;
    }

    if (!formData.unitId) {
      setError('Unit selection is required');
      setLoading(false);
      return;
    }

    if (formData.anos.length === 0) {
      setError('At least one ANO must be assigned');
      setLoading(false);
      return;
    }

    try {
      const collegeData = {
        name: formData.name,
        unitId: formData.unitId,
        anos: formData.anos,
        createdAt: editingCollege ? editingCollege.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingCollege) {
        await updateDoc(doc(db, 'colleges', editingCollege.id), collegeData);
        setSuccess('College updated successfully!');
      } else {
        await addDoc(collection(db, 'colleges'), collegeData);
        setSuccess('College created successfully!');
      }

      await fetchColleges();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || 'Failed to save college');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (collegeId: string) => {
    if (!confirm('Are you sure you want to delete this college? This action cannot be undone.')) return;

    try {
      await deleteDoc(doc(db, 'colleges', collegeId));
      setSuccess('College deleted successfully!');
      await fetchColleges();
    } catch (err: any) {
      setError(err.message || 'Failed to delete college');
    }
  };

  const handleEdit = (college: College) => {
    setEditingCollege(college);
    setFormData({
      name: college.name,
      unitId: college.unitId,
      anos: college.anos,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCollege(null);
    setFormData({
      name: '',
      unitId: '',
      anos: [],
    });
    setError('');
  };

  const handleAnoToggle = (anoId: string) => {
    setFormData(prev => ({
      ...prev,
      anos: prev.anos.includes(anoId)
        ? prev.anos.filter(id => id !== anoId)
        : [...prev.anos, anoId]
    }));
  };

  const filteredColleges = colleges.filter(
    (college) =>
      college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getUnitName(college.unitId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUnitName = (unitId: string) => {
    const unit = units.find(u => u.id === unitId);
    return unit ? unit.name : 'Unknown Unit';
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.email : 'Unknown';
  };

  const getAvailableAnos = () => {
    return users.filter(user => {
      // Check if ANO is already assigned to another college (except current one when editing)
      const isAssigned = colleges.some(college => {
        if (editingCollege && college.id === editingCollege.id) return false;
        return college.anos.includes(user.id);
      });
      
      return !isAssigned;
    });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Colleges</h1>
          <p className="text-gray-600 mt-1">Create and manage colleges with assigned ANOs and units</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
        >
          <Plus size={20} />
          Create New College
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
              placeholder="Search by college name or unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <School size={20} className="text-purple-600" />
            All Colleges ({filteredColleges.length})
          </h2>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {filteredColleges.map((college, index) => (
              <motion.div
                key={college.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{college.name}</h3>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                        College
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Shield size={16} className="text-blue-600" />
                          <span className="font-medium">Assigned Unit:</span>
                        </div>
                        <div className="ml-6">
                          <p className="font-medium text-gray-900">{getUnitName(college.unitId)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Users size={16} className="text-green-600" />
                          <span className="font-medium">Assigned ANOs ({college.anos.length}):</span>
                        </div>
                        <div className="ml-6 space-y-1">
                          {college.anos.map((anoId, anoIndex) => (
                            <div key={anoIndex} className="text-sm">
                              <p className="font-medium text-gray-900">{getUserName(anoId)}</p>
                              <p className="text-gray-600">{getUserEmail(anoId)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">
                        <strong>Created:</strong> {new Date(college.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(college)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Edit college"
                    >
                      <Edit2 size={18} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(college.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete college"
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredColleges.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <School className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No colleges found</p>
            <p className="text-gray-500 text-sm mt-1">Create your first college to get started</p>
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
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    {editingCollege ? 'Edit College' : 'Create New College'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form id="collegeForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    College Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter college name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned Unit <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <select
                      value={formData.unitId}
                      onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none bg-white"
                      required
                    >
                      <option value="">Select a unit</option>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign ANOs <span className="text-red-500">*</span>
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                    {getAvailableAnos().length === 0 ? (
                      <p className="text-gray-500 text-sm">No available ANOs to assign</p>
                    ) : (
                      <div className="space-y-2">
                        {getAvailableAnos().map((ano) => (
                          <motion.div
                            key={ano.id}
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => handleAnoToggle(ano.id)}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              formData.anos.includes(ano.id) 
                                ? 'bg-purple-600 border-purple-600' 
                                : 'border-gray-300 hover:border-purple-400'
                            }`}>
                              {formData.anos.includes(ano.id) && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-2 h-2 bg-white rounded-full"
                                />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{ano.name}</p>
                              <p className="text-sm text-gray-600">{ano.email}</p>
                            </div>
                            {formData.anos.includes(ano.id) ? (
                              <UserMinus size={16} className="text-red-500" />
                            ) : (
                              <UserPlus size={16} className="text-green-500" />
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Selected ANOs: {formData.anos.length}
                  </p>
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
                    form="collegeForm"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto"
                      />
                    ) : editingCollege ? (
                      'Update College'
                    ) : (
                      'Create College'
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