import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../../../components/ui/DataTable';
import Toast from '../../../components/ui/Toast';
import DeleteConfirmationModal from '../../../components/ui/DeleteConfirmationModal';
import { AnimatePresence } from 'framer-motion';
import { User, Pencil, Trash2 } from 'lucide-react';

export default function PMTrainers({ isReadOnly = false }) {
  const [trainers, setTrainers] = useState([]);
  const [globalSummary, setGlobalSummary] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  // New Trainer Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [toast, setToast] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstId, setSelectedInstId] = useState('');
  const [customInstName, setCustomInstName] = useState('');
  const [isOtherInst, setIsOtherInst] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    fetchTrainers();
    fetchGlobalSummary();
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const res = await axios.get('/users?role=INSTITUTION');
      setInstitutions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGlobalSummary = async () => {
    try {
      const res = await axios.get('/programme/summary');
      setGlobalSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTrainers = async () => {
    try {
      const res = await axios.get('/users?role=TRAINER');
      setTrainers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (item) => {
    setEditMode(true);
    setSelectedItem(item);
    setNewName(item.name);
    setNewEmail(item.email);
    setNewSubject(item.subject || '');
    setNewPassword('');
    setSelectedInstId(item.institution_id || '');
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
      fetchTrainers();
      showToast('Trainer deleted successfully');
      setShowDeleteModal(false);
    } catch (err) {
      showToast('Error deleting trainer', 'error');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!newSubject) {
      alert('Subject is mandatory for trainers!');
      return;
    }
    try {
      if (editMode) {
        await axios.put(`/users/${selectedItem.id}`, {
          name: newName,
          email: newEmail,
          role: 'TRAINER',
          subject: newSubject,
          institution_id: isOtherInst ? null : selectedInstId
        });
        showToast('Trainer updated successfully');
      } else {
        await axios.post('/users', {
          name: newName,
          email: newEmail,
          password: newPassword,
          role: 'TRAINER',
          subject: newSubject,
          institution_id: isOtherInst ? null : selectedInstId // Simplified: if other, handle separately or as null
        });
        showToast('Trainer added successfully');
      }
      fetchTrainers();
      setShowModal(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving trainer', 'error');
    }
  };

  const filters = [
    { label: 'Trainer ID', type: 'text', value: searchId, onChange: setSearchId, placeholder: 'Search ID...' },
    { label: 'Name', type: 'text', value: searchName, onChange: setSearchName, placeholder: 'Search Name...' },
    { label: 'Email', type: 'text', value: searchEmail, onChange: setSearchEmail, placeholder: 'Search Email...' }
  ];

  const filteredData = trainers.filter(t => {
    const matchesId = t.displayId?.toLowerCase().includes(searchId.toLowerCase()) || !searchId;
    const matchesName = t.name?.toLowerCase().includes(searchName.toLowerCase()) || !searchName;
    const matchesEmail = t.email?.toLowerCase().includes(searchEmail.toLowerCase()) || !searchEmail;
    return matchesId && matchesName && matchesEmail;
  });

  const baseColumns = [
    {
      header: 'Trainer ID',
      accessor: 'displayId',
      render: (row) => <span className="font-medium text-blue-600">{row.displayId || `TRN-${row.id}`}</span>
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
      header: 'Subject',
      accessor: 'subject',
      render: (row) => <span className="text-emerald-600 font-medium">{row.subject || 'N/A'}</span>
    }
  ];

  const actionColumn = {
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
    };

  const analyticsColumn = {
    header: 'Analytics',
    accessor: 'view',
    render: (row) => (
      <button 
        onClick={() => alert(`Viewing analytics for Trainer ${row.name}`)}
        className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded text-xs font-bold transition-colors border border-blue-100"
      >
        VIEW
      </button>
    )
  };

  const columns = isReadOnly ? [...baseColumns, analyticsColumn] : [...baseColumns, actionColumn, analyticsColumn];

  return (
    <div className="h-full p-6">
      <DataTable 
        title={<span>Trainers Management <span className="text-sm text-gray-400 font-normal ml-2">Total: {filteredData.length}</span></span>}
        filters={filters}
        columns={columns}
        data={filteredData}
        onAnalyticsClick={() => setShowAnalyticsModal(true)}
        actionButton={!isReadOnly ? { label: 'New Trainer', onClick: () => {
          setEditMode(false);
          setSelectedItem(null);
          setNewName(''); setNewEmail(''); setNewPassword(''); setNewSubject('');
          setSelectedInstId(''); setIsOtherInst(false);
          setShowModal(true);
        } } : undefined}
      />

      {showAnalyticsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Trainers Performance Analytics</h3>
              <button onClick={() => setShowAnalyticsModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                  <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Total Trainers</span>
                  <div className="text-3xl font-black text-blue-900 mt-1">{globalSummary?.total_trainers || 0}</div>
                </div>
                <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                  <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Active Sessions</span>
                  <div className="text-3xl font-black text-emerald-900 mt-1">{globalSummary?.total_sessions || 0}</div>
                </div>
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                  <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">Avg Attendance Rate</span>
                  <div className="text-3xl font-black text-purple-900 mt-1">{globalSummary?.overall_attendance_rate?.toFixed(1) || 0}%</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h4 className="font-bold text-gray-800 mb-4">Trainer Productivity</h4>
                <div className="space-y-4">
                  {trainers.slice(0, 3).map((t, i) => (
                    <div key={i} className="flex items-center">
                      <span className="text-xs font-medium text-gray-600 w-32 truncate">{t.name}</span>
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden ml-4">
                        <div className="bg-blue-500 h-full rounded-full" style={{width: `${70 + (i * 10)}%`}}></div>
                      </div>
                      <span className="text-xs font-bold text-gray-800 ml-4">{70 + (i * 10)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => setShowAnalyticsModal(false)}
                  className="px-6 py-2 bg-gray-800 text-white rounded font-bold hover:bg-gray-900 transition-colors"
                >
                  Close Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">{editMode ? 'Edit Trainer' : 'Add New Trainer'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                <input 
                  type="text" required value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="John Doe"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                <input 
                  type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="john@example.com"
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
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject <span className="text-red-500">*</span></label>
                <input 
                  type="text" required value={newSubject} onChange={e => setNewSubject(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Mathematics"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assigned Institution</label>
                <select 
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
                  {institutions.map(inst => (
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
                  <p className="text-[10px] text-amber-600 font-medium mt-1 italic">* Note: Creating new institutions from here is restricted to tagging only.</p>
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
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 shadow-sm"
                >
                  {editMode ? 'Update Trainer' : 'Create Trainer'}
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
