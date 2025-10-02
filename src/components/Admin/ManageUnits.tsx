import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Plus, 
  CreditCard as Edit2, 
  Trash2, 
  X, 
  Search,
  Users,
  School,
  Building,
  UserCheck,
  MapPin
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface Unit {
  id: string;
  name: string;
  coId: string;
  clerkId: string;
  colleges: string[];
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ano' | 'clerk' | 'co';
  unit?: string;
}

export const ManageUnits = () => {
  const { userData } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    coId: '',
    clerkId: '',
    colleges: [''],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUnits();
    fetchUsers();
  }, []);

  const fetchUnits = async () => {
    try {
      const q = query(collection(db, 'units'), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
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
      setError('Failed to fetch units');
    }
  };

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData: User[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.role === 'clerk' || data.role === 'co') {
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
      setError('Unit name is required');
      setLoading(false);
      return;
    }

    if (!formData.coId) {
      setError('CO selection is required');
      setLoading(false);
      return;
    }

    if (!formData.clerkId) {
      setError('Clerk selection is required');
      setLoading(false);
      return;
    }

    if (formData.coId === formData.clerkId) {
      setError('CO and Clerk cannot be the same person');
      setLoading(false);
      return;
    }

    // Filter out empty college entries
    const colleges = formData.colleges.filter(college => college.trim() !== '');
    if (colleges.length === 0) {
      setError('At least one college is required');
      setLoading(false);
      return;
    }

    try {
      const unitData = {
        name: formData.name,
        coId: formData.coId,
        clerkId: formData.clerkId,
        colleges: colleges,
        createdAt: editingUnit ? editingUnit.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingUnit) {
        await updateDoc(doc(db, 'units', editingUnit.id), unitData);
        setSuccess('Unit updated successfully!');
      } else {
        await addDoc(collection(db, 'units'), unitData);
        setSuccess('Unit created successfully!');
      }

      await fetchUnits();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || 'Failed to save unit');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (unitId: string) => {
    if (!confirm('Are you sure you want to delete this unit? This action cannot be undone.')) return;

    try {
      await deleteDoc(doc(db, 'units', unitId));
      setSuccess('Unit deleted successfully!');
      await fetchUnits();
    } catch (err: any) {
      setError(err.message || 'Failed to delete unit');
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      coId: unit.coId,
      clerkId: unit.clerkId,
      colleges: unit.colleges.length > 0 ? unit.colleges : [''],
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUnit(null);
    setFormData({
      name: '',
      coId: '',
      clerkId: '',
      colleges: [''],
    });
    setError('');
  };

  const addCollegeField = () => {
    setFormData({
      ...formData,
      colleges: [...formData.colleges, ''],
    });
  };

  const removeCollegeField = (index: number) => {
    if (formData.colleges.length > 1) {
      const newColleges = formData.colleges.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        colleges: newColleges,
      });
    }
  };

  const updateCollege = (index: number, value: string) => {
    const newColleges = [...formData.colleges];
    newColleges[index] = value;
    setFormData({
      ...formData,
      colleges: newColleges,
    });
  };

  const filteredUnits = units.filter(
    (unit) =>
      unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.colleges.some(college => college.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.email : 'Unknown';
  };

  const getAvailableUsers = (role: 'co' | 'clerk') => {
    return users.filter(user => {
      if (user.role !== role) return false;
      
      // Check if user is already assigned to another unit
      const isAssigned = units.some(unit => {
        if (editingUnit && unit.id === editingUnit.id) return false; // Exclude current unit when editing
        return unit.coId === user.id || unit.clerkId === user.id;
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
          <h1 className="text-3xl font-bold text-gray-900">Manage Units</h1>
          <p className="text-gray-600 mt-1">Create and manage NCC units with assigned CO, Clerk, and colleges</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
        >
          <Plus size={20} />
          Create New Unit
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
              placeholder="Search by unit name or college..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Shield size={20} className="text-blue-600" />
            All Units ({filteredUnits.length})
          </h2>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {filteredUnits.map((unit, index) => (
              <motion.div
                key={unit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{unit.name}</h3>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                        Unit
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-700">
                          <UserCheck size={16} className="text-blue-600" />
                          <span className="font-medium">CO (Commanding Officer):</span>
                        </div>
                        <div className="ml-6 text-sm">
                          <p className="font-medium text-gray-900">{getUserName(unit.coId)}</p>
                          <p className="text-gray-600">{getUserEmail(unit.coId)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Users size={16} className="text-green-600" />
                          <span className="font-medium">Clerk:</span>
                        </div>
                        <div className="ml-6 text-sm">
                          <p className="font-medium text-gray-900">{getUserName(unit.clerkId)}</p>
                          <p className="text-gray-600">{getUserEmail(unit.clerkId)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-700">
                        <School size={16} className="text-purple-600" />
                        <span className="font-medium">Assigned Colleges ({unit.colleges.length}):</span>
                      </div>
                      <div className="ml-6">
                        <div className="flex flex-wrap gap-2">
                          {unit.colleges.map((college, collegeIndex) => (
                            <span
                              key={collegeIndex}
                              className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700 border border-purple-200"
                            >
                              {college}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">
                        <strong>Created:</strong> {new Date(unit.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(unit)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit unit"
                    >
                      <Edit2 size={18} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(unit.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete unit"
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredUnits.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Shield className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No units found</p>
            <p className="text-gray-500 text-sm mt-1">Create your first unit to get started</p>
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
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    {editingUnit ? 'Edit Unit' : 'Create New Unit'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form id="unitForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter unit name (e.g., 1 NCC Unit, 2 NCC Battalion)"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commanding Officer (CO) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <select
                        value={formData.coId}
                        onChange={(e) => setFormData({ ...formData, coId: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                        required
                      >
                        <option value="">Select a CO</option>
                        {getAvailableUsers('co').map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Clerk <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <select
                        value={formData.clerkId}
                        onChange={(e) => setFormData({ ...formData, clerkId: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                        required
                      >
                        <option value="">Select a Clerk</option>
                        {getAvailableUsers('clerk').map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Assigned Colleges <span className="text-red-500">*</span>
                    </label>
                    <motion.button
                      type="button"
                      onClick={addCollegeField}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                    >
                      <Plus size={16} />
                      Add College
                    </motion.button>
                  </div>
                  
                  <div className="space-y-2">
                    {formData.colleges.map((college, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            type="text"
                            value={college}
                            onChange={(e) => updateCollege(index, e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter college name"
                            required
                          />
                        </div>
                        {formData.colleges.length > 1 && (
                          <motion.button
                            type="button"
                            onClick={() => removeCollegeField(index)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove college"
                          >
                            <X size={18} />
                          </motion.button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Add all colleges that will be managed by this unit</p>
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
                    form="unitForm"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mx-auto"
                      />
                    ) : editingUnit ? (
                      'Update Unit'
                    ) : (
                      'Create Unit'
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