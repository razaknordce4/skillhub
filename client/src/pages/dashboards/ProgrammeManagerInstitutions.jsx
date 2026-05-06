import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, AlertTriangle, Mail, Lock, Check, X, Edit2, Plus, Trash2, Calendar, Download, Activity, BookOpen, Users, TrendingUp } from 'lucide-react';
import Toast from '../../components/ui/Toast.jsx';
import { useData } from '../../context/DataContext';
import { useCallback } from 'react';
import usePolling from '../../hooks/usePolling';

export default function ProgrammeManagerInstitutions() {
  const { cache, fetchData, loadingStates, updateCache } = useData();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const institutions = cache['pm_institutions_list'] || [];
  const aggregateStats = cache['pm_institutions_aggregate'] || null;
  
  const loading = loadingStates['pm_institutions_list'] && institutions.length === 0;
  const statsLoading = loadingStates['pm_institutions_aggregate'];

  const [toast, setToast] = useState(null);
  const [editingInstitution, setEditingInstitution] = useState(null);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedInstitutionAnalytics, setSelectedInstitutionAnalytics] = useState(null);
  
  const [credentialForm, setCredentialForm] = useState({
    email: '',
    password: ''
  });
  
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: ''
  });
  
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  const fetchInstitutions = useCallback((opts) => {
    return fetchData('pm_institutions_list', '/institutions', opts);
  }, [fetchData]);

  const fetchAggregateStats = useCallback((opts) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return fetchData('pm_institutions_aggregate', `/pm/institutions-analytics-aggregate?${params.toString()}`, opts);
  }, [fetchData, startDate, endDate]);

  useEffect(() => {
    fetchInstitutions();
    fetchAggregateStats();
  }, [startDate, endDate]);

  usePolling(() => {
    fetchInstitutions({ forceRefresh: true, silent: true });
    fetchAggregateStats({ forceRefresh: true, silent: true });
  }, 30000);

  const handleSetCredentials = async (institution) => {
    setEditingInstitution(institution);
    setCredentialForm({
      email: institution.email,
      password: ''
    });
    setShowCredentialModal(true);
  };

  const handleViewAnalytics = async (institution) => {
    setShowAnalyticsModal(true);
    setSelectedInstitutionAnalytics({ name: institution.name, loading: true });
    
    try {
      const params = new URLSearchParams({ institutionId: institution.id });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const res = await axios.get(`/institution/attendance-stats?${params.toString()}`);
      setSelectedInstitutionAnalytics({
        ...res.data,
        name: institution.name,
        loading: false
      });
    } catch (err) {
      console.error('Error fetching institution analytics:', err);
      setToast({ type: 'error', message: 'Failed to fetch analytics' });
      setShowAnalyticsModal(false);
    }
  };

  const saveCredentials = async () => {
    try {
      await axios.put(`/users/${editingInstitution.id}`, {
        email: credentialForm.email,
        password: credentialForm.password,
        hasCredentials: true,
        tempPassword: null
      });
      
      setToast({ type: 'success', message: 'Institution credentials updated successfully' });
      setShowCredentialModal(false);
      setEditingInstitution(null);
      setCredentialForm({ email: '', password: '' });
      fetchInstitutions({ forceRefresh: true });
      fetchAggregateStats({ forceRefresh: true });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Error updating credentials' });
    }
  };
  
  const handleCreateInstitution = async () => {
    try {
      await axios.post('/users', createForm);
      setToast({ type: 'success', message: 'Institution created successfully' });
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', password: '' });
      fetchInstitutions({ forceRefresh: true });
      fetchAggregateStats({ forceRefresh: true });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Error creating institution' });
    }
  };
  
  const handleEditInstitution = (institution) => {
    setEditingInstitution(institution);
    setEditForm({
      name: institution.name,
      email: institution.email,
      password: ''
    });
    setShowEditModal(true);
  };
  
  const saveEditInstitution = async () => {
    try {
      await axios.put(`/users/${editingInstitution.id}`, editForm);
      setToast({ type: 'success', message: 'Institution updated successfully' });
      setShowEditModal(false);
      setEditingInstitution(null);
      setEditForm({ name: '', email: '', password: '' });
      fetchInstitutions({ forceRefresh: true });
      fetchAggregateStats({ forceRefresh: true });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Error updating institution' });
    }
  };
  
  const handleDeleteInstitution = (institution) => {
    setEditingInstitution(institution);
    setShowDeleteModal(true);
  };
  
  const confirmDeleteInstitution = async () => {
    try {
      await axios.delete(`/users/${editingInstitution.id}`);
      setToast({ type: 'success', message: 'Institution deleted successfully' });
      setShowDeleteModal(false);
      setEditingInstitution(null);
      fetchInstitutions({ forceRefresh: true });
      fetchAggregateStats({ forceRefresh: true });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Error deleting institution' });
    }
  };

  const getInstitutionStatus = (institution) => {
    if (institution.createdByStudent && !institution.hasCredentials) {
      return {
        status: 'warning',
        icon: AlertTriangle,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        message: 'Created by student - needs credentials'
      };
    }
    return {
      status: 'active',
      icon: Check,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      message: 'Active institution'
    };
  };

  return (
    <div className="p-6">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      
      <div className="mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Institution Management</h1>
            <p className="text-sm text-gray-500 mt-1">Global oversight and performance analytics for all programme institutions</p>
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
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100 transform active:scale-95"
            >
              <Plus size={16} />
              <span>Create Institution</span>
            </button>
          </div>
        </div>

        {/* Global Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-50">
          {[
            { label: 'Avg Attendance', value: `${aggregateStats?.overall_attendance_rate || 0}%`, icon: Activity, color: 'blue', desc: 'Programme Average' },
            { label: 'Total Batches', value: aggregateStats?.total_batches || 0, icon: BookOpen, color: 'purple', desc: 'Across Institutions' },
            { label: 'Total Sessions', value: aggregateStats?.total_sessions || 0, icon: Calendar, color: 'emerald', desc: 'Conducted So Far' },
            { label: 'Global Students', value: aggregateStats?.total_students || 0, icon: Users, color: 'orange', desc: 'Enrolled Students' }
          ].map((card, i) => (
            <div key={i} className={`p-4 rounded-xl border border-gray-100 bg-white hover:border-${card.color}-200 transition-all group`}>
              <div className="flex items-center space-x-3 mb-2">
                <div className={`p-2 bg-${card.color}-50 text-${card.color}-600 rounded-lg group-hover:scale-110 transition-transform`}>
                  <card.icon size={18} />
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{card.label}</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-gray-900">{statsLoading ? '...' : card.value}</span>
                <span className="text-[10px] font-medium text-gray-400">{card.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading institutions...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {institutions.map((institution) => {
                  const status = getInstitutionStatus(institution);
                  const StatusIcon = status.icon;
                  
                  return (
                    <tr key={institution.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${status.bgColor}`}>
                              <StatusIcon className={`h-4 w-4 ${status.color}`} />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{institution.name}</div>
                            <div className="text-sm text-gray-500">ID: {institution.displayId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{institution.email}</div>
                        {institution.createdByStudent && (
                          <div className="text-xs text-amber-600 mt-1">Auto-generated</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color} ${status.borderColor} border`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.message}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewAnalytics(institution)}
                            className="inline-flex items-center px-3 py-2 border border-blue-200 shadow-sm text-sm leading-4 font-bold rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          >
                            <Activity className="h-4 w-4 mr-2" />
                            View Analytics
                          </button>
                          {institution.createdByStudent && !institution.hasCredentials && (
                            <button
                              onClick={() => handleSetCredentials(institution)}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <Lock className="h-4 w-4 mr-2" />
                              Set Credentials
                            </button>
                          )}
                          <button 
                            onClick={() => handleEditInstitution(institution)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteInstitution(institution)}
                            className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {institutions.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      No institutions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Credentials Modal */}
      {showCredentialModal && editingInstitution && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Set Institution Credentials
              </h3>
              <button
                onClick={() => setShowCredentialModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      This institution was created by a student during registration
                    </p>
                    <p className="text-sm text-amber-600 mt-1">
                      Please set proper email and password for institution login access
                    </p>
                    <p className="text-xs text-amber-500 mt-2">
                      Current temporary password: {editingInstitution.tempPassword}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institution Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={credentialForm.email}
                    onChange={(e) => setCredentialForm({...credentialForm, email: e.target.value})}
                    className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="institution@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    value={credentialForm.password}
                    onChange={(e) => setCredentialForm({...credentialForm, password: e.target.value})}
                    className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter new password"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCredentialModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={saveCredentials}
                disabled={!credentialForm.email || !credentialForm.password}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Credentials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Institution Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Create New Institution
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institution Name
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter institution name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                    className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="institution@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                    className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter password"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInstitution}
                disabled={!createForm.name || !createForm.email || !createForm.password}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Institution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Institution Modal */}
      {showEditModal && editingInstitution && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Edit Institution
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institution Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter institution name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="institution@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password (leave empty to keep current)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                    className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter new password (optional)"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={saveEditInstitution}
                disabled={!editForm.name || !editForm.email}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && editingInstitution && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Delete Institution
                </h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">
                Are you sure you want to delete <strong>{editingInstitution.name}</strong>?
              </p>
              <p className="text-sm text-red-600 mt-2">
                This will also delete all associated batches, trainers, students, and data.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteInstitution}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Institution
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Detailed Analytics Modal */}
      {showAnalyticsModal && selectedInstitutionAnalytics && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm print:p-0 print:bg-white print:relative print:inset-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col print:max-h-none print:shadow-none print:rounded-none print:w-full">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 print:bg-white print:border-none">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  {selectedInstitutionAnalytics.loading ? 'Loading...' : `Analytics: ${selectedInstitutionAnalytics.name}`}
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                  Performance data from {startDate || 'inception'} to {endDate || 'present'}
                </p>
              </div>
              <div className="flex items-center space-x-4 print:hidden">
                <button 
                  onClick={() => window.print()}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg shadow-gray-200"
                >
                  <Download size={16} />
                  <span>Download PDF</span>
                </button>
                <button onClick={() => setShowAnalyticsModal(false)} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full border border-gray-200 shadow-sm transition-all">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 print:overflow-visible">
              {selectedInstitutionAnalytics.loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
                  <p className="mt-4 text-gray-500 font-bold">Assembling Analytics...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Attendance', value: `${selectedInstitutionAnalytics.overall_attendance_rate}%`, icon: Activity, color: 'blue' },
                      { label: 'Total Batches', value: selectedInstitutionAnalytics.total_batches, icon: BookOpen, color: 'purple' },
                      { label: 'Total Sessions', value: selectedInstitutionAnalytics.total_sessions, icon: Calendar, color: 'emerald' },
                      { label: 'Total Students', value: selectedInstitutionAnalytics.total_students, icon: Users, color: 'orange' }
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

                  {/* Batch Performance Table */}
                  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                      <h4 className="font-bold text-gray-800">Batch-wise Performance</h4>
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
                          {selectedInstitutionAnalytics.batch_stats?.map((batch, i) => (
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
              <button 
                onClick={() => setShowAnalyticsModal(false)}
                className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Specific Styles */}
      <style dangerouslySetInnerHTML={{ __html: "@media print { body * { visibility: hidden; } .print-hidden { display: none !important; } .fixed.inset-0 { visibility: visible !important; position: absolute !important; left: 0; top: 0; width: 100%; height: auto; background: white !important; } .fixed.inset-0 * { visibility: visible !important; } .shadow-2xl, .shadow-lg { shadow: none !important; } .rounded-3xl { border-radius: 0 !important; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } @page { margin: 15mm; size: A4; } .bg-white { background-color: white !important; } .bg-gray-50 { background-color: #f9fafb !important; } .border { border: 1px solid #eee !important; } }" }} />
    </div>
  );
}
