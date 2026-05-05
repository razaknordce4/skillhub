import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronRight, Filter, Download, Users, Calendar, Activity, ArrowLeft, BarChart3, TrendingUp, PieChart } from 'lucide-react';
import DataTable from '../../../components/ui/DataTable';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstitutionAttendance() {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchSummary, setBatchSummary] = useState(null);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('batches'); // 'batches' | 'details'

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/batches');
      setBatches(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (batch) => {
    setSelectedBatch(batch);
    setLoading(true);
    try {
      const [summaryRes, studentsRes] = await Promise.all([
        axios.get(`/batches/${batch.id}/summary`),
        axios.get(`/batches/${batch.id}/students`)
      ]);
      setBatchSummary(summaryRes.data);
      setStudents(studentsRes.data);
      setSessions(batch.sessions || []);
      setView('details');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const batchColumns = [
    { 
      header: 'Batch Name', 
      accessor: 'name', 
      render: (row) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center mr-3 font-bold text-gray-400">
            {row.name.charAt(0)}
          </div>
          <span className="font-bold text-gray-800">{row.name}</span>
        </div>
      ) 
    },
    { header: 'Batch ID', accessor: 'displayId', render: (row) => <span className="font-mono text-xs font-bold text-blue-600">{row.displayId}</span> },
    { 
      header: 'Student Count', 
      accessor: 'studentCount', 
      render: (row) => (
        <div className="flex items-center text-xs font-bold text-gray-500">
          <Users size={14} className="mr-1 opacity-50" />
          {row._count?.students || 0}
        </div>
      ) 
    },
    { 
      header: 'Performance', 
      accessor: 'performance', 
      render: (row) => (
        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500" style={{ width: '75%' }} />
        </div>
      ) 
    },
    { 
      header: 'Action', 
      accessor: 'id', 
      render: (row) => (
        <button 
          onClick={() => handleViewDetails(row)}
          className="text-blue-600 text-xs font-black uppercase tracking-widest hover:underline flex items-center"
        >
          View Summary <ChevronRight size={14} className="ml-1" />
        </button>
      ) 
    }
  ];

  const studentColumns = [
    { 
      header: 'Student Name', 
      accessor: 'name', 
      render: (row) => (
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold mr-2">
            {row.name.charAt(0)}
          </div>
          <span className="font-bold text-gray-800">{row.name}</span>
        </div>
      ) 
    },
    { header: 'Email', accessor: 'email', render: (row) => <span className="text-gray-500 text-xs">{row.email}</span> },
    { 
      header: 'Sessions', 
      accessor: 'sessions', 
      render: (row) => (
        <span className="text-xs font-bold text-gray-600">
          {row.attended_sessions} / {row.total_sessions}
        </span>
      ) 
    },
    { 
      header: 'Attendance %', 
      accessor: 'attendance_rate', 
      render: (row) => (
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${row.attendance_rate > 75 ? 'bg-emerald-500' : 'bg-orange-500'}`} />
          <span className="font-black text-gray-900">{row.attendance_rate.toFixed(1)}%</span>
        </div>
      ) 
    }
  ];

  return (
    <div className="h-full p-6 space-y-6 max-w-[1400px] mx-auto">
      
      <AnimatePresence mode="wait">
        {view === 'batches' ? (
          <motion.div 
            key="batches"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div>
                <h1 className="text-2xl font-black text-gray-900">Attendance Summary</h1>
                <p className="text-sm text-gray-500 mt-1">Select a batch to view detailed performance metrics.</p>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 border border-gray-100 rounded-lg hover:bg-gray-50"><Download size={18} className="text-gray-400"/></button>
                <button className="p-2 border border-gray-100 rounded-lg hover:bg-gray-50"><Filter size={18} className="text-gray-400"/></button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <DataTable 
                columns={batchColumns}
                data={batches}
                loading={loading}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Header with Back Button */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setView('batches')}
                className="flex items-center text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors group"
              >
                <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Batches
              </button>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Currently Viewing:</span>
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">{selectedBatch?.name}</span>
              </div>
            </div>

            {/* Batch Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Total Students', value: batchSummary?.total_students || 0, icon: Users, color: 'blue' },
                { label: 'Sessions Held', value: batchSummary?.total_sessions || 0, icon: Calendar, color: 'purple' },
                { label: 'Avg Attendance', value: `${batchSummary?.attendance_rate?.toFixed(1) || 0}%`, icon: TrendingUp, color: 'emerald' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center">
                  <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center text-${stat.color}-600 mr-4`}>
                    <stat.icon size={24} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</div>
                    <div className="text-2xl font-black text-gray-900 mt-1">{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Views Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Student Performance List */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 flex items-center">
                    <BarChart3 size={18} className="mr-2 text-blue-500" />
                    Student Attendance Rankings
                  </h3>
                  <button className="text-gray-400 hover:text-gray-600"><Download size={16}/></button>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <DataTable 
                    columns={studentColumns}
                    data={students}
                    loading={loading}
                  />
                </div>
              </div>

              {/* Session Insights */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
                <h3 className="font-bold text-gray-800 flex items-center mb-6">
                  <PieChart size={18} className="mr-2 text-purple-500" />
                  Session Distribution
                </h3>
                
                <div className="flex-1 space-y-4">
                  {sessions.slice(0, 5).map((session, i) => (
                    <div key={i} className="p-4 border border-gray-50 rounded-xl hover:border-blue-100 transition-colors cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{session.title}</div>
                        <span className="text-[10px] font-black text-gray-400 uppercase">{new Date(session.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                         <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500" style={{ width: '85%' }} />
                         </div>
                         <span className="text-[10px] font-bold text-emerald-600">85% Present</span>
                      </div>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <Calendar size={32} className="mb-2 opacity-20" />
                      <p className="text-xs font-medium">No sessions held yet.</p>
                    </div>
                  )}
                </div>
                
                <button className="mt-6 w-full py-2 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest rounded-lg transition-colors border border-gray-100">
                  View All Sessions
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
