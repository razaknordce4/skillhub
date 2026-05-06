import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import DataTable from '../../../components/ui/DataTable';
import Toast from '../../../components/ui/Toast';
import DeleteConfirmationModal from '../../../components/ui/DeleteConfirmationModal';
import { AnimatePresence } from 'framer-motion';
import { User, Pencil, Trash2, Calendar, Download, Activity, BookOpen, Users, TrendingUp, X, Check } from 'lucide-react';
import usePolling from '../../../hooks/usePolling';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';

export default function PMStudents({ isReadOnly = false }) {
  const { user } = useAuth();
  const { cache, loadingStates, fetchData } = useData();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const students = cache['pm_students'] || [];
  const institutions = cache['pm_institutions'] || [];
  const globalSummary = cache['pm_summary'] || null;

  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchBatch, setSearchBatch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedStudentAnalytics, setSelectedStudentAnalytics] = useState(null);

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

  const fetchGlobalSummary = useCallback((opts) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    // If institution or trainer role, use specific stats
    let endpoint = `/programme/summary?${params.toString()}`;
    if (user?.role === 'INSTITUTION') {
      endpoint = `/institution/attendance-stats?${params.toString()}`;
    } else if (user?.role === 'TRAINER') {
      endpoint = `/trainer/attendance-stats?${params.toString()}`;
    }
      
    return fetchData('pm_summary', endpoint, opts);
  }, [fetchData, user?.role, startDate, endDate]);

  const fetchInstitutions = useCallback((opts) => fetchData('pm_institutions', '/users?role=INSTITUTION', opts), [fetchData]);
  const fetchStudents = useCallback((opts) => fetchData('pm_students', '/users?role=STUDENT', opts), [fetchData]);

  useEffect(() => {
    fetchStudents();
    fetchInstitutions();
    fetchGlobalSummary();
  }, [user, fetchGlobalSummary]);

  const refreshData = useCallback(() => {
    fetchStudents({ forceRefresh: true, silent: true });
    fetchInstitutions({ forceRefresh: true, silent: true });
    fetchGlobalSummary({ forceRefresh: true, silent: true });
  }, [fetchStudents, fetchInstitutions, fetchGlobalSummary]);

  usePolling(refreshData, 60000);

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

  const handleViewAnalytics = async (student) => {
    setShowAnalyticsModal(true);
    setSelectedStudentAnalytics({ name: student.name, loading: true });
    
    try {
      const params = new URLSearchParams({ studentId: student.id });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const res = await axios.get(`/student/attendance-stats?${params.toString()}`);
      setSelectedStudentAnalytics({
        ...res.data,
        name: student.name,
        displayId: student.displayId,
        email: student.email,
        batch: student.batch,
        loading: false
      });
    } catch (err) {
      console.error('Error fetching student analytics:', err);
      showToast('Failed to fetch analytics', 'error');
      setShowAnalyticsModal(false);
    }
  };

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
    baseColumns[5] // Analytics
  ];

  const filteredInstitutions = (Array.isArray(institutions) ? institutions : []).filter(inst => 
    inst.name.toLowerCase().includes(instSearch.toLowerCase())
  );

  return (
    <div className="h-full p-6">
      <div className="mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              {user?.role === 'INSTITUTION' ? 'Institution Student Management' : user?.role === 'TRAINER' ? 'Assigned Students Management' : 'Students Management'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {user?.role === 'INSTITUTION' ? 'Monitor and manage students within your institution' : user?.role === 'TRAINER' ? 'Monitor and track performance for students in your assigned batches' : 'Oversee student enrollment and performance tracking'}
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
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Total Students</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{globalSummary?.total_students || 0}</div>
          <div className="text-xs text-gray-400 mt-1 font-medium">Currently enrolled</div>
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
          <div className="text-xs text-gray-400 mt-1 font-medium">Performance summary</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm opacity-60">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Activity size={20} />
            </div>
            <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Active Progress</span>
          </div>
          <div className="text-2xl font-black text-gray-900">84%</div>
          <div className="text-xs text-gray-400 mt-1 font-medium">Course completion</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm opacity-60">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Calendar size={20} />
            </div>
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Daily Active</span>
          </div>
          <div className="text-2xl font-black text-gray-900">{Math.round((globalSummary?.total_students || 0) * 0.72)}</div>
          <div className="text-xs text-gray-400 mt-1 font-medium">Avg per day</div>
        </div>
      </div>

      <DataTable 
        title={
          <span>
            Students Management 
            <span className="text-sm text-gray-400 font-normal ml-2">Total: {filteredData.length}</span>
          </span>
        }
        filters={filters}
        columns={columns}
        data={filteredData}
        loading={loadingStates['pm_students']}
        onAnalyticsClick={() => setShowAnalyticsModal(true)}
        actionButton={isReadOnly ? undefined : { 
          label: 'Provision Student', 
          onClick: () => {
            setEditMode(false);
            setSelectedItem(null);
            setNewName(''); 
            setNewEmail(''); 
            setNewPassword('');
            setSelectedInstId(''); 
            setIsOtherInst(false);
            setShowModal(true);
          } 
        }}
      />

      {/* Global Analytics Modal */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm print:p-0 print:bg-white print:relative print:inset-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col print:max-h-none print:shadow-none print:rounded-none print:w-full">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 print:bg-white print:border-none">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  {user?.role === 'INSTITUTION' ? 'Institutional Student Analytics' : user?.role === 'TRAINER' ? 'My Students Analytics' : 'Programme-wide Student Analytics'}
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                  {user?.role === 'INSTITUTION' ? 'Performance summary for your enrolled students' : user?.role === 'TRAINER' ? 'Performance summary for students in your assigned batches' : 'Performance summary across all enrolled students'}
                </p>
              </div>
              <div className="flex items-center space-x-4 print:hidden">
                <button 
                  onClick={() => window.print()}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg shadow-gray-200"
                >
                  <Download size={16} />
                  <span>Export PDF</span>
                </button>
                <button onClick={() => setShowAnalyticsModal(false)} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full border border-gray-200 shadow-sm transition-all">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-8 overflow-y-auto flex-1 print:overflow-visible">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 flex flex-col items-center text-center">
                  <div className="p-3 bg-white text-blue-600 rounded-2xl shadow-sm mb-4"><Users size={24} /></div>
                  <div className="text-4xl font-black text-blue-900">{globalSummary?.total_students || 0}</div>
                  <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1">Total Enrolled</div>
                </div>
                <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 flex flex-col items-center text-center">
                  <div className="p-3 bg-white text-emerald-600 rounded-2xl shadow-sm mb-4"><TrendingUp size={24} /></div>
                  <div className="text-4xl font-black text-emerald-900">{globalSummary?.overall_attendance_rate?.toFixed(1) || 0}%</div>
                  <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1">Avg Attendance</div>
                </div>
                <div className="bg-purple-50 p-8 rounded-3xl border border-purple-100 flex flex-col items-center text-center">
                  <div className="p-3 bg-white text-purple-600 rounded-2xl shadow-sm mb-4"><BookOpen size={24} /></div>
                  <div className="text-4xl font-black text-purple-900">{globalSummary?.total_batches || 0}</div>
                  <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest mt-1">Active Batches</div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                <h4 className="font-bold text-gray-800 mb-6 flex items-center">
                  <Activity size={18} className="mr-2 text-blue-600" />
                  Student Performance Distribution
                </h4>
                <div className="space-y-6">
                  {students.slice(0, 5).map((s, i) => (
                    <div key={i} className="flex items-center">
                      <div className="w-40">
                        <span className="text-xs font-bold text-gray-700 block truncate">{s.name}</span>
                        <span className="text-[10px] text-gray-400 font-medium uppercase">{s.displayId}</span>
                      </div>
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden mx-6">
                        <div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${85 - (i * 5)}%` }} />
                      </div>
                      <span className="text-xs font-black text-gray-900 w-12 text-right">{85 - (i * 5)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-8 py-6 border-t border-gray-100 flex justify-end bg-gray-50 print:hidden">
              <button onClick={() => setShowAnalyticsModal(false)} className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm">
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Student Analytics Modal */}
      {selectedStudentAnalytics && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm print:p-0 print:bg-white print:relative print:inset-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col print:shadow-none print:rounded-none">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 print:bg-white print:border-none">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200">
                  {selectedStudentAnalytics.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">{selectedStudentAnalytics.loading ? 'Loading...' : `Student Analytics: ${selectedStudentAnalytics.name}`}</h3>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{selectedStudentAnalytics.displayId} • {selectedStudentAnalytics.batch || 'General Batch'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 print:hidden">
                <button 
                  onClick={() => window.print()}
                  className="p-2 text-gray-600 hover:text-blue-600 bg-white border border-gray-200 rounded-xl shadow-sm transition-all"
                  title="Download Report"
                >
                  <Download size={20} />
                </button>
                <button onClick={() => setSelectedStudentAnalytics(null)} className="p-2 text-gray-400 hover:text-gray-600 bg-white border border-gray-200 rounded-xl shadow-sm transition-all">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-8 print:p-0 overflow-y-auto flex-1">
              {selectedStudentAnalytics.loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-500 font-bold">Synchronizing Data...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Performance Matrix */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Attendance Rate', value: `${selectedStudentAnalytics.attendance_rate || 0}%`, icon: Activity, color: 'blue' },
                      { label: 'Total Sessions', value: selectedStudentAnalytics.total_sessions || 0, icon: BookOpen, color: 'purple' },
                      { label: 'Attended', value: selectedStudentAnalytics.attended_sessions || 0, icon: Check, color: 'emerald' },
                      { label: 'Active Days', value: selectedStudentAnalytics.active_days || 0, icon: Calendar, color: 'orange' }
                    ].map((stat, i) => (
                      <div key={i} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-md hover:bg-white">
                        <div className={`p-3 bg-white text-${stat.color}-600 rounded-xl shadow-sm mb-3`}>
                          <stat.icon size={20} />
                        </div>
                        <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                      <h4 className="font-bold text-gray-800 text-sm">Recent Session Participation</h4>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last 5 Sessions</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {selectedStudentAnalytics.recent_sessions?.map((session, i) => (
                        <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{session.title}</p>
                            <p className="text-[10px] text-gray-500 font-medium">{new Date(session.date).toLocaleDateString()} • {session.start_time}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${session.attended ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                            {session.attended ? 'Present' : 'Absent'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-8 py-6 border-t border-gray-100 flex justify-end bg-gray-50 print:hidden">
              <button onClick={() => setSelectedStudentAnalytics(null)} className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-gray-200">
                Close Analytics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Specific Styles */}
      <style dangerouslySetInnerHTML={{ __html: "@media print { body * { visibility: hidden; } .print-hidden { display: none !important; } .fixed.inset-0 { visibility: visible !important; position: absolute !important; left: 0; top: 0; width: 100%; height: auto; background: white !important; } .fixed.inset-0 * { visibility: visible !important; } .shadow-2xl, .shadow-lg { shadow: none !important; } .rounded-3xl { border-radius: 0 !important; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } @page { margin: 15mm; size: A4; } .bg-white { background-color: white !important; } .bg-gray-50 { background-color: #f9fafb !important; } .border { border: 1px solid #eee !important; } }" }} />

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
                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 mt-2">Institution Name</label>
                  <input 
                    type="text" value={customInstName} onChange={e => setCustomInstName(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Enter Institution Name..."
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
