import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import DataTable from '../../../components/ui/DataTable';
import Toast from '../../../components/ui/Toast';
import DeleteConfirmationModal from '../../../components/ui/DeleteConfirmationModal';
import { AnimatePresence } from 'framer-motion';
import { User, Pencil, Trash2, Calendar, Download, Activity, BookOpen, Users, TrendingUp, X, Check } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import usePolling from '../../../hooks/usePolling';

export default function PMTrainers({ isReadOnly = false }) {
  const { user } = useAuth();
  const { cache, fetchData, loadingStates } = useData();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const trainers = cache['pm_trainers_list'] || [];
  const globalSummary = cache['pm_global_summary'] || null;
  const institutions = cache['pm_institutions_list_brief'] || [];

  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedTrainerAnalytics, setSelectedTrainerAnalytics] = useState(null);

  // New Trainer Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [toast, setToast] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [selectedInstId, setSelectedInstId] = useState('');
  const [customInstName, setCustomInstName] = useState('');
  const [isOtherInst, setIsOtherInst] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchTrainers = useCallback((opts) => {
    return fetchData('pm_trainers_list', '/users?role=TRAINER', opts);
  }, [fetchData]);

  const fetchGlobalSummary = useCallback((opts) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    // If institution role, use institution-specific stats
    const endpoint = user?.role === 'INSTITUTION' 
      ? `/institution/attendance-stats?${params.toString()}`
      : `/programme/summary?${params.toString()}`;
      
    return fetchData('pm_global_summary', endpoint, opts);
  }, [fetchData, user?.role, startDate, endDate]);

  const fetchInstitutions = useCallback((opts) => {
    return fetchData('pm_institutions_list_brief', '/users?role=INSTITUTION', opts);
  }, [fetchData]);

  useEffect(() => {
    fetchTrainers();
    fetchGlobalSummary();
    fetchInstitutions();
  }, [user, fetchTrainers, fetchGlobalSummary, fetchInstitutions]);

  const refreshData = useCallback(() => {
    fetchTrainers({ forceRefresh: true, silent: true });
    fetchGlobalSummary({ forceRefresh: true, silent: true });
    fetchInstitutions({ forceRefresh: true, silent: true });
  }, [fetchTrainers, fetchGlobalSummary, fetchInstitutions]);

  usePolling(refreshData, 30000);

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
      fetchTrainers({ forceRefresh: true });
      showToast('Trainer deleted successfully');
      setShowDeleteModal(false);
    } catch (err) {
      showToast('Error deleting trainer', 'error');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!newSubject) {
      showToast('Subject is mandatory for trainers!', 'error');
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
          institution_id: isOtherInst ? null : selectedInstId
        });
        showToast('Trainer added successfully');
      }
      fetchTrainers({ forceRefresh: true });
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

  const filteredData = (Array.isArray(trainers) ? trainers : []).filter(t => {
    const matchesId = t.displayId?.toLowerCase().includes(searchId.toLowerCase()) || !searchId;
    const matchesName = t.name?.toLowerCase().includes(searchName.toLowerCase()) || !searchName;
    const matchesEmail = t.email?.toLowerCase().includes(searchEmail.toLowerCase()) || !searchEmail;
    return matchesId && matchesName && matchesEmail;
  });

  const handleViewAnalytics = async (trainer) => {
    setShowAnalyticsModal(true);
    setSelectedTrainerAnalytics({ name: trainer.name, loading: true });
    
    try {
      const params = new URLSearchParams({ trainerId: trainer.id });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const res = await axios.get(`/trainer/attendance-stats?${params.toString()}`);
      setSelectedTrainerAnalytics({
        ...res.data,
        name: trainer.name,
        loading: false
      });
    } catch (err) {
      console.error('Error fetching trainer analytics:', err);
      showToast('Failed to fetch analytics', 'error');
      setShowAnalyticsModal(false);
    }
  };

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
    },
    {
      header: 'Analytics',
      accessor: 'view',
      render: (row) => (
        <button 
          onClick={() => handleViewAnalytics(row)}
          className="flex items-center space-x-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-blue-100 active:scale-95"
        >
          <Activity size={14} />
          <span>VIEW REPORT</span>
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
    baseColumns[5]
  ];

  return (
    <div className="h-full p-6">
      <div className="mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              {user?.role === 'INSTITUTION' ? 'Institution Trainer Management' : 'Trainers Management'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {user?.role === 'INSTITUTION' ? 'Monitor and manage trainers within your institution' : 'Monitor trainer performance and manage assignments across institutions'}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
              <Calendar size={16} className="text-gray-400 mr-2" />
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-gray-700 outline-none focus:ring-0 border-none p-0"
              />
              <span className="mx-2 text-gray-300">to</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-gray-700 outline-none focus:ring-0 border-none p-0"
              />
              {(startDate || endDate) && (
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="ml-2 text-gray-400 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors bg-white shadow-sm"
            >
              <Download size={16} />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div 
          onClick={() => setShowAnalyticsModal(true)}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Total Trainers</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{globalSummary?.total_trainers || 0}</div>
          <div className="text-xs text-gray-400 mt-1 font-medium">Currently active</div>
        </div>

        <div 
          onClick={() => setShowAnalyticsModal(true)}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Avg Attendance</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{globalSummary?.overall_attendance_rate?.toFixed(1) || 0}%</div>
          <div className="text-xs text-gray-400 mt-1 font-medium">Trainer delivery score</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <BookOpen size={20} />
            </div>
            <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Active Batches</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{globalSummary?.total_batches || 0}</div>
          <div className="text-xs text-gray-400 mt-1 font-medium">Assigned batches</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Calendar size={20} />
            </div>
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Sessions</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{globalSummary?.total_sessions || 0}</div>
          <div className="text-xs text-gray-400 mt-1 font-medium">Total conducted</div>
        </div>
      </div>

      <DataTable 
        title={
          <span>
            {user?.role === 'STUDENT' ? 'Our Trainers' : 'Trainers Management'} 
            <span className="text-sm text-gray-400 font-normal ml-2">Total: {filteredData.length}</span>
          </span>
        }
        filters={filters}
        columns={columns}
        data={filteredData}
        loading={loadingStates['pm_trainers_list']}
        onAnalyticsClick={() => setShowAnalyticsModal(true)}
        actionButton={isReadOnly ? undefined : { 
          label: 'New Trainer', 
          onClick: () => {
            setEditMode(false);
            setSelectedItem(null);
            setNewName(''); setNewEmail(''); setNewPassword(''); setNewSubject('');
            setSelectedInstId(''); setIsOtherInst(false);
            setShowModal(true);
          } 
        }}
      />

      {/* Analytics Modal */}
      {showAnalyticsModal && selectedTrainerAnalytics && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm print:p-0 print:bg-white print:relative print:inset-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col print:max-h-none print:shadow-none print:rounded-none print:w-full">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 print:bg-white print:border-none">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  {selectedTrainerAnalytics.loading ? 'Loading...' : `Trainer Analytics: ${selectedTrainerAnalytics.name}`}
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                  Performance data summary
                </p>
              </div>
              <div className="flex items-center space-x-4 print:hidden">
                <button onClick={() => window.print()} className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg shadow-gray-200">
                  <Download size={16} />
                  <span>Download PDF</span>
                </button>
                <button onClick={() => setShowAnalyticsModal(false)} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full border border-gray-200 shadow-sm transition-all">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 print:overflow-visible">
              {selectedTrainerAnalytics.loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
                  <p className="mt-4 text-gray-500 font-bold">Assembling Analytics...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Avg Attendance', value: `${selectedTrainerAnalytics.overall_attendance_rate || 0}%`, icon: Activity, color: 'blue' },
                      { label: 'Total Sessions', value: selectedTrainerAnalytics.total_sessions || 0, icon: Calendar, color: 'purple' },
                      { label: 'Upcoming', value: selectedTrainerAnalytics.upcoming_sessions || 0, icon: TrendingUp, color: 'emerald' },
                      { label: 'Completed', value: selectedTrainerAnalytics.completed_sessions || 0, icon: Check, color: 'orange' }
                    ].map((stat, i) => (
                      <div key={i} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col items-center text-center">
                        <div className={`p-3 bg-white text-${stat.color}-600 rounded-2xl shadow-sm mb-4`}>
                          <stat.icon size={24} />
                        </div>
                        <div className="text-3xl font-black text-gray-900">{stat.value}</div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                      <h4 className="font-bold text-gray-800">Assigned Batches & Performance</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white border-b border-gray-100">
                            <th className="px-6 py-4">Batch Name</th>
                            <th className="px-6 py-4 text-center">Sessions</th>
                            <th className="px-6 py-4 text-center">Students</th>
                            <th className="px-6 py-4 text-right">Attendance Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {selectedTrainerAnalytics.batch_stats?.map((batch, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 font-bold text-gray-900">{batch.batch_name}</td>
                              <td className="px-6 py-4 text-center">
                                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">{batch.total_sessions}</span>
                              </td>
                              <td className="px-6 py-4 text-center text-sm font-medium text-gray-500">{batch.student_count}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end space-x-3">
                                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${batch.attendance_rate}%` }} />
                                  </div>
                                  <span className="font-black text-gray-900 text-sm">{batch.attendance_rate}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-8 py-6 border-t border-gray-100 flex justify-end bg-gray-50 print:hidden">
              <button onClick={() => setShowAnalyticsModal(false)} className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm">
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Specific Styles */}
      <style dangerouslySetInnerHTML={{ __html: "@media print { body * { visibility: hidden; } .print-hidden { display: none !important; } .fixed.inset-0 { visibility: visible !important; position: absolute !important; left: 0; top: 0; width: 100%; height: auto; background: white !important; } .fixed.inset-0 * { visibility: visible !important; } .shadow-2xl, .shadow-lg { shadow: none !important; } .rounded-3xl { border-radius: 0 !important; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } @page { margin: 15mm; size: A4; } .bg-white { background-color: white !important; } .bg-gray-50 { background-color: #f9fafb !important; } .border { border: 1px solid #eee !important; } }" }} />

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
                <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="John Doe" autoComplete="off" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="john@example.com" autoComplete="off" />
              </div>
              {!editMode && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Initial Password</label>
                  <input type="password" required={!editMode} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="••••••••" autoComplete="new-password" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject <span className="text-red-500">*</span></label>
                <input type="text" required value={newSubject} onChange={e => setNewSubject(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="e.g. Mathematics" autoComplete="off" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assigned Institution</label>
                <select value={isOtherInst ? 'others' : selectedInstId} onChange={e => { if (e.target.value === 'others') { setIsOtherInst(true); setSelectedInstId(''); } else { setIsOtherInst(false); setSelectedInstId(e.target.value); } }} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white">
                  <option value="">Select Institution...</option>
                  {institutions.map(inst => (<option key={inst.id} value={inst.id}>{inst.name}</option>))}
                  <option value="others">Others (Manual Entry)</option>
                </select>
              </div>
              {isOtherInst && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 mt-2">Institution Name</label>
                  <input type="text" value={customInstName} onChange={e => setCustomInstName(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="Enter Institution Name..." />
                </div>
              )}
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-600 rounded text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 shadow-sm">{editMode ? 'Update Trainer' : 'Create Trainer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        <DeleteConfirmationModal isOpen={showDeleteModal} itemName={itemToDelete?.name} onConfirm={confirmDelete} onCancel={() => setShowDeleteModal(false)} />
      </AnimatePresence>
    </div>
  );
}
