import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../../../components/ui/DataTable';
import Toast from '../../../components/ui/Toast';
import DeleteConfirmationModal from '../../../components/ui/DeleteConfirmationModal';
import { AnimatePresence } from 'framer-motion';
import { User, Pencil, Trash2 } from 'lucide-react';

export default function PMStudents({ isReadOnly = false }) {
  const [students, setStudents] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [globalSummary, setGlobalSummary] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchBatch, setSearchBatch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // New Student Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedInstId, setSelectedInstId] = useState('');
  const [toast, setToast] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isOtherInst, setIsOtherInst] = useState(false);
  const [customInstName, setCustomInstName] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };
  const [instSearch, setInstSearch] = useState('');

  useEffect(() => {
    fetchStudents();
    fetchInstitutions();
    fetchGlobalSummary();
  }, []);

  const fetchGlobalSummary = async () => {
    try {
      const res = await axios.get('/programme/summary');
      setGlobalSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const res = await axios.get('/users?role=INSTITUTION');
      setInstitutions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/users?role=STUDENT');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (item) => {
    setEditMode(true);
    setSelectedItem(item);
    setNewName(item.name);
    setNewEmail(item.email);
    setSelectedInstId(item.institution_id || '');
    setNewPassword('');
    setIsOtherInst(false);
    setShowModal(true);
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`/users/${itemToDelete.id}`);
      fetchStudents();
      showToast('Student deleted successfully');
      setShowDeleteModal(false);
    } catch (err) {
      showToast('Error deleting student', 'error');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.put(`/users/${selectedItem.id}`, {
          name: newName,
          email: newEmail,
          role: 'STUDENT',
          institution_id: isOtherInst ? null : selectedInstId
        });
        showToast('Student updated successfully');
      } else {
        await axios.post('/users', {
          name: newName,
          email: newEmail,
          password: newPassword,
          role: 'STUDENT',
          institution_id: isOtherInst ? null : selectedInstId
        });
        showToast('Student added successfully');
      }
      fetchStudents();
      setShowModal(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving student', 'error');
    }
  };

  const filters = [
    { label: 'Student ID', type: 'text', value: searchId, onChange: setSearchId, placeholder: 'Search ID...' },
    { label: 'Name', type: 'text', value: searchName, onChange: setSearchName, placeholder: 'Search Name...' },
    { label: 'Email', type: 'text', value: searchEmail, onChange: setSearchEmail, placeholder: 'Search Email...' },
    { label: 'Batch', type: 'text', value: searchBatch, onChange: setSearchBatch, placeholder: 'Search Batch...' }
  ];

  const filteredData = (Array.isArray(students) ? students : []).filter(s => {
    const matchesId = s.displayId?.toLowerCase().includes(searchId.toLowerCase()) || !searchId;
    const matchesName = s.name?.toLowerCase().includes(searchName.toLowerCase()) || !searchName;
    const matchesEmail = s.email?.toLowerCase().includes(searchEmail.toLowerCase()) || !searchEmail;
    const matchesBatch = s.batch?.toLowerCase().includes(searchBatch.toLowerCase()) || !searchBatch;
    return matchesId && matchesName && matchesEmail && matchesBatch;
  });

  const baseColumns = [
    {
      header: 'Student ID',
      accessor: 'displayId',
      render: (row) => <span className="font-medium text-blue-600">{row.displayId || `STD-${row.id}`}</span>
    },
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => <span className="font-medium text-[#1f2937]">{row.name}</span>
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (row) => <span className="text-gray-600">{row.email}</span>
    },
    {
      header: 'Institute',
      accessor: 'institution_name',
      render: (row) => <span className="text-gray-600 font-medium">{row.institution_name || 'Not Assigned'}</span>
    },
    {
      header: 'Batch',
      accessor: 'batch',
      render: (row) => <span className="text-gray-600">{row.batch || 'Batch Oct 2024'}</span>
    },
    {
      header: 'Analytics',
      accessor: 'view',
      render: (row) => (
        <button 
          onClick={() => setSelectedStudent(row)}
          className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded text-xs font-bold transition-colors border border-blue-100"
        >
          VIEW
        </button>
      )
    }
  ];

  const columns = isReadOnly ? baseColumns : [
    ...baseColumns.slice(0, 5),
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => handleEditClick(row)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDeleteClick(row)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    },
    baseColumns[5] // Analytics
  ];

  const filteredInstitutions = (Array.isArray(institutions) ? institutions : []).filter(inst => 
    inst.name.toLowerCase().includes(instSearch.toLowerCase())
  );

  return (
    <div className="h-full p-6">
      <DataTable 
        title={<span>Students Management <span className="text-sm text-gray-400 font-normal ml-2">Total: {filteredData.length}</span></span>}
        filters={filters}
        columns={columns}
        data={filteredData}
        onAnalyticsClick={() => setShowAnalyticsModal(true)}
        actionButton={!isReadOnly ? { label: 'Provision Student', onClick: () => {
          setEditMode(false);
          setSelectedItem(null);
          setNewName(''); setNewEmail(''); setNewPassword('');
          setSelectedInstId(''); setIsOtherInst(false);
          setShowModal(true);
        } } : undefined}
      />

      {/* Global Analytics Modal */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Global Students Analytics</h3>
              <button onClick={() => setShowAnalyticsModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                  <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Total Enrolled</span>
                  <div className="text-3xl font-black text-blue-900 mt-1">{globalSummary?.total_students || 0}</div>
                </div>
                <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                  <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Completion Rate</span>
                  <div className="text-3xl font-black text-emerald-900 mt-1">94.2%</div>
                </div>
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                  <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">Avg Grade</span>
                  <div className="text-3xl font-black text-purple-900 mt-1">A-</div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h4 className="font-bold text-gray-800 mb-4">Grade Distribution</h4>
                <div className="flex items-end justify-between h-40 px-10">
                   {[8, 15, 45, 25, 7].map((v, i) => (
                     <div key={i} className="w-16 bg-blue-500 rounded-t-lg relative group" style={{height: `${v * 2}%`}}>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {['F','D','C','B','A'][i]}: {v}%
                        </span>
                     </div>
                   ))}
                </div>
                <div className="flex justify-between mt-4 text-[10px] text-gray-400 font-bold px-10">
                  <span>F</span><span>D</span><span>C</span><span>B</span><span>A</span>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button onClick={() => setShowAnalyticsModal(false)} className="px-6 py-2 bg-gray-800 text-white rounded font-bold hover:bg-gray-900">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Student Analytics Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-blue-600 text-white">
              <h3 className="font-bold">Student Analytics: {selectedStudent.name}</h3>
              <button onClick={() => setSelectedStudent(null)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
            </div>
            <div className="p-8">
              <div className="flex items-center space-x-6 mb-8">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold border-4 border-blue-50">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-gray-800">{selectedStudent.name}</h4>
                  <p className="text-sm text-gray-500">{selectedStudent.displayId} • {selectedStudent.email}</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider border border-blue-100">
                    {selectedStudent.batch || 'Batch Oct 2024'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                   <span className="text-[10px] font-bold text-gray-400 uppercase">Attendance</span>
                   <div className="text-2xl font-black text-emerald-600">92%</div>
                </div>
                <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                   <span className="text-[10px] font-bold text-gray-400 uppercase">Current Grade</span>
                   <div className="text-2xl font-black text-blue-600">88/100</div>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="font-bold text-gray-800 text-sm">Learning Progress</h5>
                <div className="space-y-2">
                   <div className="flex justify-between text-xs font-medium"><span>React Basics</span><span>100%</span></div>
                   <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full w-full"></div></div>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-xs font-medium"><span>Node.js API</span><span>75%</span></div>
                   <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className="bg-blue-500 h-full w-[75%]"></div></div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button onClick={() => setSelectedStudent(null)} className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Done</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provision Student Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">{editMode ? 'Edit Student' : 'Provision New Student'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                <input 
                  type="text" required value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Student Name"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                <input 
                  type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="student@example.com"
                  autoComplete="off"
                />
              </div>
              {!editMode && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Initial Password</label>
                  <input 
                    type="password" required={!editMode} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Institution</label>
                <input 
                    type="text" value={instSearch} onChange={e => setInstSearch(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 mb-2"
                    placeholder="Search institution..."
                    autoComplete="off"
                  />
                <select 
                  required 
                  value={isOtherInst ? 'others' : selectedInstId} 
                  onChange={e => {
                    if (e.target.value === 'others') {
                      setIsOtherInst(true);
                      setSelectedInstId('');
                    } else {
                      setIsOtherInst(false);
                      setSelectedInstId(e.target.value);
                    }
                  }} 
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="">Select Institution...</option>
                  {filteredInstitutions.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                  <option value="others">Others (Manual Entry)</option>
                </select>
              </div>
              {isOtherInst && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 mt-2">Institution Name</label>
                  <input 
                    type="text" value={customInstName} onChange={e => setCustomInstName(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Enter Institution Name..."
                  />
                </motion.div>
              )}
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-600 rounded text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 shadow-sm"
                >
                  {editMode ? 'Update Student' : 'Provision Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        <DeleteConfirmationModal 
          isOpen={showDeleteModal}
          itemName={itemToDelete?.name}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      </AnimatePresence>
    </div>
  );
}
