import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../../../components/ui/DataTable';
import Toast from '../../../components/ui/Toast';
import DeleteConfirmationModal from '../../../components/ui/DeleteConfirmationModal';
import { AnimatePresence } from 'framer-motion';
import { Shield, Pencil, Trash2 } from 'lucide-react';

export default function PMManagers({ isReadOnly = false }) {
  const [officers, setOfficers] = useState([]);
  const [globalSummary, setGlobalSummary] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState(null);

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
  const [institutions, setInstitutions] = useState([]);
  const [instSearch, setInstSearch] = useState('');

  useEffect(() => {
    fetchOfficers();
    fetchInstitutions();
    fetchGlobalSummary();
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

  const fetchOfficers = async () => {
    try {
      const res = await axios.get('/users?role=MONITORING_OFFICER');
      setOfficers(res.data);
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
      fetchOfficers();
      showToast('Officer deleted successfully');
      setShowDeleteModal(false);
    } catch (err) {
      showToast('Error deleting officer', 'error');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.put(`/users/${selectedItem.id}`, {
          name: newName,
          email: newEmail,
          role: 'MONITORING_OFFICER',
          institution_id: isOtherInst ? null : selectedInstId
        });
        showToast('Officer updated successfully');
      } else {
        await axios.post('/users', {
          name: newName,
          email: newEmail,
          password: newPassword,
          role: 'MONITORING_OFFICER',
          institution_id: isOtherInst ? null : selectedInstId
        });
        showToast('Officer added successfully');
      }
      fetchOfficers();
      setShowModal(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving officer', 'error');
    }
  };

  const filteredInstitutions = (Array.isArray(institutions) ? institutions : []).filter(inst => 
    inst.name.toLowerCase().includes(instSearch.toLowerCase())
  );

  const filters = [
    { label: 'Officer ID', type: 'text', value: searchId, onChange: setSearchId, placeholder: 'Search ID...' },
    { label: 'Name', type: 'text', value: searchName, onChange: setSearchName, placeholder: 'Search Name...' },
    { label: 'Email', type: 'text', value: searchEmail, onChange: setSearchEmail, placeholder: 'Search Email...' }
  ];

  const filteredData = (Array.isArray(officers) ? officers : []).filter(o => {
    const matchesId = o.displayId?.toLowerCase().includes(searchId.toLowerCase()) || !searchId;
    const matchesName = o.name?.toLowerCase().includes(searchName.toLowerCase()) || !searchName;
    const matchesEmail = o.email?.toLowerCase().includes(searchEmail.toLowerCase()) || !searchEmail;
    return matchesId && matchesName && matchesEmail;
  });

  const columns = [
    {
      header: 'Officer ID',
      accessor: 'displayId',
      render: (row) => <span className="font-medium text-blue-600">{row.displayId || `MO-${row.id}`}</span>
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
      header: 'Monitoring Institute',
      accessor: 'institution_name',
      render: (row) => <span className="text-gray-600 font-medium">{row.institution_name || 'Not Assigned'}</span>
    },
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
    {
      header: 'Analytics',
      accessor: 'view',
      render: (row) => (
        <button 
          onClick={() => setSelectedOfficer(row)}
          className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded text-xs font-bold transition-colors border border-blue-100"
        >
          VIEW
        </button>
      )
    }
  ];

  return (
    <div className="h-full p-6">
      <DataTable 
        title={<span>Monitoring Officers <span className="text-sm text-gray-400 font-normal ml-2">Total: {filteredData.length}</span></span>}
        filters={filters}
        columns={columns}
        data={filteredData}
        onAnalyticsClick={() => setShowAnalyticsModal(true)}
        actionButton={!isReadOnly ? { label: 'Provision Officer', onClick: () => {
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
              <h3 className="font-bold text-gray-800">Monitoring Officers Network Overview</h3>
              <button onClick={() => setShowAnalyticsModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                  <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Total Officers</span>
                  <div className="text-3xl font-black text-blue-900 mt-1">{officers.length}</div>
                </div>
                <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                  <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Institutions Monitored</span>
                  <div className="text-3xl font-black text-emerald-900 mt-1">{globalSummary?.total_institutions || 0}</div>
                </div>
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                  <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">Avg Compliance Rate</span>
                  <div className="text-3xl font-black text-purple-900 mt-1">98.5%</div>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button onClick={() => setShowAnalyticsModal(false)} className="px-6 py-2 bg-gray-800 text-white rounded font-bold hover:bg-gray-900">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Officer Analytics Modal */}
      {selectedOfficer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-blue-600 text-white">
              <h3 className="font-bold">Officer Profile: {selectedOfficer.name}</h3>
              <button onClick={() => setSelectedOfficer(null)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
            </div>
            <div className="p-8">
              <div className="flex items-center space-x-6 mb-8">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold border-4 border-blue-50">
                  {selectedOfficer.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-gray-800">{selectedOfficer.name}</h4>
                  <p className="text-sm text-gray-500">{selectedOfficer.displayId} • {selectedOfficer.email}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                 <h5 className="font-bold text-gray-800 text-sm mb-4">Assigned Monitoring Scope</h5>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white border border-gray-100 rounded-lg">
                       <span className="text-[10px] text-gray-400 font-bold uppercase">Institutions</span>
                       <div className="text-xl font-bold text-gray-800">4 Active</div>
                    </div>
                    <div className="p-3 bg-white border border-gray-100 rounded-lg">
                       <span className="text-[10px] text-gray-400 font-bold uppercase">Reports Filed</span>
                       <div className="text-xl font-bold text-gray-800">24 Total</div>
                    </div>
                 </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button onClick={() => setSelectedOfficer(null)} className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Done</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provision Officer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">{editMode ? 'Edit Officer' : 'Provision Monitoring Officer'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                <input 
                  type="text" required value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="Officer Name"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                <input 
                  type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="officer@example.com"
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
                  {editMode ? 'Update Officer' : 'Provision Officer'}
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
