import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronRight, Filter, Download, Plus, Users, BookOpen, Activity, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

export default function InstitutionDashboard() {
  const { user } = useAuth();
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAttendanceStats();
    }
  }, [user]);

  const fetchAttendanceStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/institution/attendance-stats');
      setAttendanceStats(res.data);
    } catch (err) {
      console.error('Error fetching attendance stats:', err);
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
          { label: 'Total Batches', value: attendanceStats?.total_batches || 0, icon: BookOpen, color: 'blue' },
          { label: 'Total Sessions', value: attendanceStats?.total_sessions || 0, icon: Calendar, color: 'purple' },
          { label: 'Avg Attendance', value: `${attendanceStats?.overall_attendance_rate || 0}%`, icon: Activity, color: 'orange' },
          { label: 'Total Students', value: attendanceStats?.total_students || 0, icon: Users, color: 'emerald' }
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
        
        {/* Batch Performance Overview */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-gray-800 flex items-center text-lg">
              Batch Performance
              <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-50 px-2 py-0.5 rounded">All Batches</span>
            </h3>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-600">
                {attendanceStats?.overall_attendance_rate || 0}% Avg
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            {attendanceStats?.batch_stats?.map((batch, index) => (
              <div key={batch.batch_id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{batch.batch_name}</h4>
                    <p className="text-sm text-gray-500">
                      {batch.student_count} students • {batch.trainer_count} trainers
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-600">{batch.attendance_rate}%</span>
                    <p className="text-xs text-gray-500">attendance</p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${batch.attendance_rate}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{batch.total_sessions} sessions conducted</span>
                  <span>{Math.round(batch.attendance_rate * batch.student_count * batch.total_sessions / 100)} attendances</span>
                </div>
              </div>
            ))}
            
            {(!attendanceStats?.batch_stats || attendanceStats.batch_stats.length === 0) && (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No batches found</p>
                <p className="text-sm text-gray-400 mt-1">Create your first batch to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Institution Stats */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-800 mb-8 text-lg">Institution Overview</h3>
          <div className="flex-1 space-y-6">
            <div className="text-center">
              <div className="text-4xl font-black text-gray-900">{attendanceStats?.total_batches || 0}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Total Batches</div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Students</span>
                <span className="text-lg font-bold text-gray-900">
                  {attendanceStats?.total_students || 0}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Trainers</span>
                <span className="text-lg font-bold text-gray-900">
                  {attendanceStats?.total_trainers || 0}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Sessions</span>
                <span className="text-lg font-bold text-gray-900">{attendanceStats?.total_sessions || 0}</span>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Overall Attendance</span>
                  <span className="text-lg font-bold text-blue-600">{attendanceStats?.overall_attendance_rate || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${attendanceStats?.overall_attendance_rate || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Batch Performance Table */}
        <div className="lg:col-span-3 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-gray-800 text-lg">Batch Performance Overview</h3>
            <button className="text-blue-600 text-xs font-bold hover:underline flex items-center">
              View Detailed Analytics <ChevronRight size={14} className="ml-1" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-gray-400 uppercase text-[10px] font-black tracking-widest">
                  <th className="px-6 py-4">Batch Name</th>
                  <th className="px-6 py-4 text-center">Students</th>
                  <th className="px-6 py-4 text-center">Trainers</th>
                  <th className="px-6 py-4 text-center">Sessions</th>
                  <th className="px-6 py-4 text-right">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attendanceStats?.batch_stats?.map((batch, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-gray-800">{batch.batch_name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded">{batch.student_count}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-purple-50 text-purple-600 text-xs font-bold rounded">{batch.trainer_count}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded">{batch.total_sessions}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end">
                         <div className="w-24 h-1.5 bg-gray-100 rounded-full mr-3 overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${batch.attendance_rate}%` }} />
                         </div>
                         <span className="font-bold text-gray-900 text-sm">{batch.attendance_rate}%</span>
                       </div>
                    </td>
                  </tr>
                ))}
                {(!attendanceStats?.batch_stats || attendanceStats.batch_stats.length === 0) && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-medium">No batch data available for your institution yet.</td>
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
