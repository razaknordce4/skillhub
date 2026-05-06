import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import DataTable from '../../../components/ui/DataTable';
import Toast from '../../../components/ui/Toast';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import usePolling from '../../../hooks/usePolling';
import { 
  UserPlus, Plus, Activity, Calendar, TrendingUp, 
  Users, BookOpen, Download, X, Pencil, Check 
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export default function InstitutionTrainers() {
  const { user } = useAuth();
  const { cache, fetchData, loadingStates } = useData();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const trainers = cache['inst_trainers_list'] || [];
  const batches = cache['inst_batches_list'] || [];
  const globalSummary = cache['inst_global_summary'] || null;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedTrainerAnalytics, setSelectedTrainerAnalytics] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [toast, setToast] = useState(null);

  // New Trainer Form State
  const [trainerName, setTrainerName] = useState('');
  const [trainerEmail, setTrainerEmail] = useState('');
  const [trainerPassword, setTrainerPassword] = useState('');
  const [trainerSubject, setTrainerSubject] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchTrainers = useCallback((opts) => {
    return fetchData('inst_trainers_list', '/users?role=TRAINER', opts);
  }, [fetchData]);

  const fetchBatches = useCallback((opts) => {
    return fetchData('inst_batches_list', '/batches', opts);
  }, [fetchData]);

  const fetchGlobalSummary = useCallback((opts) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    return fetchData('inst_global_summary', `/institution/attendance-stats?${params.toString()}`, opts);
  }, [fetchData, startDate, endDate]);

  useEffect(() => {
    fetchTrainers();
    fetchBatches();
    fetchGlobalSummary();
  }, [fetchTrainers, fetchBatches, fetchGlobalSummary]);

  const refreshData = useCallback(() => {
    fetchTrainers({ forceRefresh: true, silent: true });
    fetchBatches({ forceRefresh: true, silent: true });
    fetchGlobalSummary({ forceRefresh: true, silent: true });
  }, [fetchTrainers, fetchBatches, fetchGlobalSummary]);

  usePolling(refreshData, 30000);

  const handleRegisterTrainer = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/users', { 
        name: trainerName, 
        email: trainerEmail, 
        password: trainerPassword, 
        role: 'TRAINER',
        subject: trainerSubject,
        institution_id: user.id
      });
      showToast('Trainer registered successfully');
      setShowAddModal(false);
      setTrainerName(''); setTrainerEmail(''); setTrainerPassword(''); setTrainerSubject('');
      fetchTrainers({ forceRefresh: true });
    } catch (err) {
      showToast(err.response?.data?.message || 'Error registering trainer', 'error');
    }
  };

  const handleAssignTrainer = async (e) => {
    e.preventDefault();
    if (!selectedBatchId) return;
    try {
      await axios.post(`/batches/${selectedBatchId}/assign-trainer`, { trainer_id: selectedTrainer.id });
      showToast('Trainer assigned to batch successfully');
      setShowAssignModal(false);
      setSelectedBatchId('');
      fetchTrainers({ forceRefresh: true });
    } catch (err) {
      showToast(err.response?.data?.message || 'Error assigning trainer', 'error');
    }
  };

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

  const columns = [
    { 
      header: 'Trainer Name', 
      accessor: 'name', 
      render: (row) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3 shadow-sm">
            {row.name.charAt(0)}
          </div>
          <span className="font-bold text-gray-800">{row.name}</span>
        </div>
      ) 
    },
    { 
      header: 'Trainer ID', 
      accessor: 'displayId', 
      render: (row) => <span className="font-mono text-xs font-bold text-blue-600">{row.displayId}</span> 
    },
    { 
      header: 'Subject', 
      accessor: 'subject', 
      render: (row) => <span className="text-emerald-600 font-medium">{row.subject || 'N/A'}</span> 
    },
    { 
      header: 'Assigned Batches', 
      accessor: 'trainerBatches', 
      render: (row) => (
        <div className="flex flex-wrap gap-1 items-center max-w-[250px]">
          {row.trainerBatches && row.trainerBatches.length > 0 ? (
            row.trainerBatches.map((tb, i) => (
              <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] font-bold">
                {tb.batch.name}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-gray-400 italic">No batches assigned</span>
          )}
          <button 
            onClick={() => { setSelectedTrainer(row); setShowAssignModal(true); }}
            className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors ml-1"
            title="Assign to another batch"
          >
            <Plus size={14} className="border border-blue-200 rounded-sm" />
          </button>
        </div>
      )
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

  return (
    <div className="h-full p-6">
      <div className="mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Institution Trainer Management</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">Oversee performance and session delivery for all trainers in your institution</p>
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
            
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              <UserPlus size={16} />
              <span>Register Trainer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => setShowAnalyticsModal(true)}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Total Trainers</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{globalSummary?.total_trainers || 0}</div>
          <div className="text-xs text-gray-400 mt-1 font-medium">Active in organization</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => setShowAnalyticsModal(true)}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Avg Attendance</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{globalSummary?.overall_attendance_rate?.toFixed(1) || 0}%</div>
          <div className="text-xs text-gray-400 mt-1 font-medium">Collective performance</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <BookOpen size={20} />
            </div>
            <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Batches</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{globalSummary?.total_batches || 0}</div>
          <div className="text-xs text-gray-400 mt-1 font-medium">Currently assigned</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Calendar size={20} />
            </div>
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Total Sessions</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{globalSummary?.total_sessions || 0}</div>
          <div className="text-xs text-gray-400 mt-1 font-medium">Conducted sessions</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <DataTable 
          title="Trainer Performance Matrix"
          columns={columns}
          data={trainers}
          loading={loadingStates['inst_trainers_list']}
        />
      </div>

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

      {/* Add Trainer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-gray-800 text-lg">Register New Trainer</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleRegisterTrainer} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                <input type="text" required value={trainerName} onChange={e => setTrainerName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="John Doe"/>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                <input type="email" required value={trainerEmail} onChange={e => setTrainerEmail(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="trainer@institute.com"/>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Password</label>
                <input type="password" required value={trainerPassword} onChange={e => setTrainerPassword(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="••••••••"/>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Subject</label>
                <input type="text" required value={trainerSubject} onChange={e => setTrainerSubject(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="e.g. Mathematics, Computer Science"/>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 mt-2">Register Trainer</button>
            </form>
          </div>
        </div>
      )}

      {/* Assign to Batch Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-gray-800 text-lg">Assign to Batch</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleAssignTrainer} className="p-6 space-y-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mr-3 shadow-lg shadow-blue-200">
                  {selectedTrainer?.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-black text-blue-600 uppercase tracking-tighter">Trainer Selected</div>
                  <div className="font-bold text-gray-800">{selectedTrainer?.name}</div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Select Batch</label>
                <select 
                  required 
                  value={selectedBatchId} 
                  onChange={e => setSelectedBatchId(e.target.value)} 
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                >
                  <option value="">Choose a batch...</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.displayId})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 mt-2">Confirm Assignment</button>
            </form>
          </div>
        </div>
      )}

      {/* Toast & Styles */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
      <style dangerouslySetInnerHTML={{ __html: "@media print { body * { visibility: hidden; } .print-hidden { display: none !important; } .fixed.inset-0 { visibility: visible !important; position: absolute !important; left: 0; top: 0; width: 100%; height: auto; background: white !important; } .fixed.inset-0 * { visibility: visible !important; } .shadow-2xl, .shadow-lg { shadow: none !important; } .rounded-3xl { border-radius: 0 !important; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } @page { margin: 15mm; size: A4; } .bg-white { background-color: white !important; } .bg-gray-50 { background-color: #f9fafb !important; } .border { border: 1px solid #eee !important; } }" }} />
    </div>
  );
}
