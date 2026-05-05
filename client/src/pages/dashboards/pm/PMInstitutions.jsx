import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Pencil, Trash2 } from 'lucide-react';
import axios from 'axios';
import DataTable from '../../../components/ui/DataTable';
import Toast from '../../../components/ui/Toast';
import DeleteConfirmationModal from '../../../components/ui/DeleteConfirmationModal';
import { AnimatePresence } from 'framer-motion';

export default function PMInstitutions({ isReadOnly = false }) {
  const [institutions, setInstitutions] = useState([]);
  const [globalSummary, setGlobalSummary] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');

  useEffect(() => {
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

  const handleCreateClick = () => {
    setEditMode(false);
    setSelectedItem(null);
    setNewName(''); setNewEmail(''); setNewPassword('');
    setShowModal(true);
  };

  const filters = [
    { label: 'Institution ID', type: 'text', value: searchId, onChange: setSearchId, placeholder: 'Search ID...' },
    { label: 'Name', type: 'text', value: searchName, onChange: setSearchName, placeholder: 'Search Name...' },
    { label: 'Email', type: 'text', value: searchEmail, onChange: setSearchEmail, placeholder: 'Search Email...' }
  ];

  const filteredData = institutions.filter(inst => {
    const matchesId = inst.displayId?.toLowerCase().includes(searchId.toLowerCase()) || !searchId;
    const matchesName = inst.name?.toLowerCase().includes(searchName.toLowerCase()) || !searchName;
    const matchesEmail = inst.email?.toLowerCase().includes(searchEmail.toLowerCase()) || !searchEmail;
    return matchesId && matchesName && matchesEmail;
  });

  const baseColumns = [
    {
      header: 'Institution ID',
      accessor: 'displayId',
      render: (row) => <span className="font-medium text-blue-600">{row.displayId || `INST-${row.id}`}</span>
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
      header: 'Analytics',
      accessor: 'analytics',
      render: (row) => (
        <button 
          onClick={() => alert(`Viewing analytics for ${row.name}`)}
          className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded text-xs font-bold transition-colors border border-blue-100"
        >
          VIEW
        </button>
      )
    }
  ];

  const columns = isReadOnly ? baseColumns : [
    ...baseColumns.slice(0, 3),
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
    baseColumns[3] // Analytics
  ];

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [toast, setToast] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleEditClick = (item) => {
    setEditMode(true);
    setSelectedItem(item);
    setNewName(item.name);
    setNewEmail(item.email);
    setNewPassword(''); // Don't show old password
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
      fetchInstitutions();
      showToast('Institution deleted successfully');
      setShowDeleteModal(false);
    } catch (err) {
      showToast('Error deleting institution', 'error');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.put(`/users/${selectedItem.id}`, {
          name: newName,
          email: newEmail,
          role: 'INSTITUTION'
        });
        showToast('Institution updated successfully');
      } else {
        await axios.post('/users', {
          name: newName,
          email: newEmail,
          password: newPassword,
          role: 'INSTITUTION'
        });
        showToast('Institution added successfully');
      }
      fetchInstitutions();
      setShowModal(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving institution', 'error');
    }
  };

  return (
    <div className="h-full p-6">
      <DataTable 
        title={<span>Institutions <span className="text-sm text-gray-400 font-normal ml-2">Total: {filteredData.length}</span></span>}
        filters={filters}
        columns={columns}
        data={filteredData}
        onAnalyticsClick={() => setShowAnalyticsModal(true)}
        actionButton={!isReadOnly ? { label: 'New Institution', onClick: handleCreateClick } : undefined}
      />

      {showAnalyticsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Global Institutions Analytics</h3>
              <button onClick={() => setShowAnalyticsModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                  <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Total Institutions</span>
                  <div className="text-3xl font-black text-blue-900 mt-1">{globalSummary?.total_institutions || 0}</div>
                </div>
                <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                  <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Total Students</span>
                  <div className="text-3xl font-black text-emerald-900 mt-1">{globalSummary?.total_students || 0}</div>
                </div>
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                  <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">Total Trainers</span>
                  <div className="text-3xl font-black text-purple-900 mt-1">{globalSummary?.total_trainers || 0}</div>
                </div>
                <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                  <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Overall Attendance</span>
                  <div className="text-3xl font-black text-orange-900 mt-1">{globalSummary?.overall_attendance_rate?.toFixed(1) || 0}%</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h4 className="font-bold text-gray-800 mb-4">Performance Overview</h4>
                <div className="h-48 flex items-end justify-between px-4">
                  {/* Mock chart for the popup */}
                  {[65, 80, 45, 90, 70, 85].map((h, i) => (
                    <div key={i} className="w-12 bg-blue-400 rounded-t-lg transition-all hover:bg-blue-500 cursor-pointer relative group" style={{height: `${h}%`}}>
                       <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                         Inst {i+1}: {h}%
                       </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest px-2">
                  <span>Batch A</span><span>Batch B</span><span>Batch C</span><span>Batch D</span><span>Batch E</span><span>Batch F</span>
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
              <h3 className="font-bold text-gray-800">{editMode ? 'Edit Institution' : 'Add New Institution'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Institution Name</label>
                <input 
                  type="text" required value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="ABC University"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                <input 
                  type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="contact@abc.edu"
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
                  {editMode ? 'Update Institution' : 'Create Institution'}
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
