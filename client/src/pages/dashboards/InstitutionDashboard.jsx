import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronRight, Filter, Download, Plus, Users, BookOpen, Activity, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

export default function InstitutionDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const instId = user.id;
      const [bRes, sRes, stdRes] = await Promise.all([
        axios.get('/batches'),
        axios.get(`/institutions/${instId}/summary`),
        axios.get('/users?role=STUDENT')
      ]);
      setBatches(bRes.data);
      setSummary(sRes.data);
      setStudents(stdRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-4 sm:p-6">
      
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Institutional Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time performance tracking for {user?.name}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            <Download size={16} />
            <span>Export Report</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-shadow shadow-md shadow-blue-100">
            <Plus size={16} />
            <span>Quick Action</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Batches', value: summary?.total_batches || 0, icon: BookOpen, color: 'blue' },
          { label: 'Total Students', value: students.length, icon: Users, color: 'emerald' },
          { label: 'Total Sessions', value: summary?.total_sessions || 0, icon: Calendar, color: 'purple' },
          { label: 'Avg Attendance', value: `${summary?.overall_attendance_rate?.toFixed(1) || 0}%`, icon: Activity, color: 'orange' }
        ].map((card, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-${card.color}-50 rounded-full opacity-50 group-hover:scale-110 transition-transform`} />
            <div className="relative z-10">
              <div className={`w-12 h-12 bg-${card.color}-100 rounded-xl flex items-center justify-center text-${card.color}-600 mb-4`}>
                <card.icon size={24} />
              </div>
              <div className="text-3xl font-black text-gray-900">{card.value}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{card.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts & Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Performance Overview (Chart Mockup) */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-gray-800 flex items-center text-lg">
              Attendance Trends
              <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-50 px-2 py-0.5 rounded">Last 6 Months</span>
            </h3>
            <div className="flex space-x-2">
              {['Pass', 'Fail', 'In-Progress'].map(label => (
                <div key={label} className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  <div className={`w-2 h-2 rounded-full mr-1 ${label === 'Pass' ? 'bg-blue-400' : label === 'Fail' ? 'bg-red-400' : 'bg-gray-300'}`} />
                  {label}
                </div>
              ))}
            </div>
          </div>
          
          <div className="h-64 flex items-end justify-between px-2 pb-2 relative border-b border-gray-100">
            {/* Background Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-50">
              {[1, 2, 3, 4].map(l => <div key={l} className="border-t border-gray-50 w-full" />)}
            </div>
            
            {/* Mock Bars */}
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => (
              <div key={month} className="flex flex-col items-center group w-12 cursor-pointer">
                <div className="w-8 flex flex-col-reverse items-center gap-1 h-48">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${20 + Math.random() * 60}%` }}
                    className="w-full bg-blue-500 rounded-t-sm group-hover:bg-blue-600 transition-colors shadow-lg shadow-blue-100"
                  />
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${10 + Math.random() * 20}%` }}
                    className="w-full bg-gray-100 rounded-t-sm group-hover:bg-gray-200 transition-colors"
                  />
                </div>
                <span className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-800 mb-8 text-lg">Batch Distribution</h3>
          <div className="flex-1 flex items-center justify-center relative">
            <svg viewBox="0 0 100 100" className="w-48 h-48 transform -rotate-90">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f3f4f6" strokeWidth="12" />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="12" strokeDasharray="180 251.2" strokeLinecap="round" />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="12" strokeDasharray="50 251.2" strokeDashoffset="-180" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-gray-900">{batches.length}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active</span>
            </div>
          </div>
          <div className="mt-8 space-y-3">
             <div className="flex justify-between items-center text-sm">
                <div className="flex items-center text-gray-600 font-medium"><div className="w-3 h-3 bg-blue-500 rounded-full mr-2" /> IT Batches</div>
                <span className="font-bold text-gray-900">72%</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <div className="flex items-center text-gray-600 font-medium"><div className="w-3 h-3 bg-emerald-500 rounded-full mr-2" /> Soft Skills</div>
                <span className="font-bold text-gray-900">28%</span>
             </div>
          </div>
        </div>

        {/* Recent Students Table */}
        <div className="lg:col-span-3 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-gray-800 text-lg">Student Performance Overview</h3>
            <button className="text-blue-600 text-xs font-bold hover:underline flex items-center">
              View Detailed Analytics <ChevronRight size={14} className="ml-1" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-gray-400 uppercase text-[10px] font-black tracking-widest">
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Display ID</th>
                  <th className="px-6 py-4">Email Address</th>
                  <th className="px-6 py-4 text-center">Batch Status</th>
                  <th className="px-6 py-4 text-right">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.slice(0, 8).map((student, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-gray-800">{student.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-blue-600 font-bold">{student.displayId || 'ST-NA'}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{student.email}</td>
                    <td className="px-6 py-4 text-center">
                       <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded tracking-wide border border-emerald-100">Enrolled</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end">
                         <div className="w-24 h-1.5 bg-gray-100 rounded-full mr-3 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${student.attendance_rate || 0}%` }} />
                         </div>
                         <span className="font-bold text-gray-900 text-sm">{student.attendance_rate?.toFixed(1) || 0}%</span>
                       </div>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-medium">No student data available for your institution yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
