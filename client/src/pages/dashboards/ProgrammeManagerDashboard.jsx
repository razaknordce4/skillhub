import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MoreHorizontal, Edit2, ArrowRight, UserPlus, Shield, ShieldAlert, Users, Activity, TrendingUp, Building, Calendar, BookOpen } from 'lucide-react';
import usePolling from '../../hooks/usePolling';
import { useData } from '../../context/DataContext';
import { useCallback } from 'react';

export default function ProgrammeManagerDashboard() {
  const { cache, fetchData, loadingStates } = useData();
  
  const attendanceStats = cache['pm_stats'] || null;
  const loading = loadingStates['pm_stats'] && !attendanceStats;
  
  // Create User Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('INSTITUTION');
  const [msg, setMsg] = useState('');

  const fetchAttendanceStats = useCallback((opts) => {
    return fetchData('pm_stats', '/pm/attendance-stats', opts);
  }, [fetchData]);

  useEffect(() => {
    fetchAttendanceStats();
  }, []);

  usePolling(() => {
    fetchAttendanceStats({ forceRefresh: true, silent: true });
  }, 30000);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await axios.post('/api/users', { name, email, password, role });
      setMsg(`Successfully provisioned new ${role}!`);
      setName(''); setEmail(''); setPassword('');
      fetchAttendanceStats();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error creating user');
    }
  };

  return (
    <div className="bg-[#f5f6fa] min-h-[calc(100vh-4rem)] p-6 rounded-2xl text-gray-800 font-sans -mt-6 mx-[-1.5rem] mb-[-1.5rem] overflow-hidden">
      
      {/* Top Header */}
      <div className="flex justify-between items-end mb-6 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programme Manager Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Good morning, Here's whats going on today</p>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <button className="flex items-center bg-white border border-gray-200 px-3 py-1.5 rounded-md font-medium text-gray-700 hover:bg-gray-50">
            <Edit2 className="w-4 h-4 mr-2" /> Edit Widget
          </button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-50 p-3 rounded-full">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{attendanceStats?.total_institutions || 0}</div>
          <div className="text-sm text-gray-600">Total Institutions</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-50 p-3 rounded-full">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{attendanceStats?.total_students || 0}</div>
          <div className="text-sm text-gray-600">Total Students</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-50 p-3 rounded-full">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{attendanceStats?.total_sessions || 0}</div>
          <div className="text-sm text-gray-600">Total Sessions</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-50 p-3 rounded-full">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{attendanceStats?.overall_attendance_rate || 0}%</div>
          <div className="text-sm text-gray-600">Avg Attendance</div>
        </div>
      </div>

      {/* Institution Performance Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-gray-900 text-lg">Institution Performance</h2>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-600">
                {attendanceStats?.overall_attendance_rate || 0}% Avg Attendance
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold tracking-wider">
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3 text-center">Batches</th>
                  <th className="px-4 py-3 text-center">Students</th>
                  <th className="px-4 py-3 text-center">Sessions</th>
                  <th className="px-4 py-3 text-right">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendanceStats?.institution_stats?.map((institution, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{institution.institution_name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded">{institution.total_batches}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-green-50 text-green-600 text-xs font-bold rounded">{institution.total_students}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-purple-50 text-purple-600 text-xs font-bold rounded">{institution.total_sessions}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end">
                        <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${institution.attendance_rate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{institution.attendance_rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!attendanceStats?.institution_stats || attendanceStats.institution_stats.length === 0) && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No institution data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monitoring Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-gray-900 text-lg">Monitoring Alerts</h2>
            <div className="flex space-x-2 text-gray-400">
              <Edit2 className="w-4 h-4" />
              <MoreHorizontal className="w-4 h-4" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
              <div className="bg-amber-50 p-2 rounded-full text-amber-600">
                <ShieldAlert className="w-5 h-5"/>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-sm">Low Attendance Alert</h3>
                <p className="text-xs text-gray-500 mt-1">Institutions below 70% attendance rate</p>
                <div className="mt-2 space-y-1">
                  {attendanceStats?.institution_stats?.filter(inst => inst.attendance_rate < 70).map((inst, i) => (
                    <div key={i} className="text-xs text-amber-600">
                      {inst.institution_name}: {inst.attendance_rate}%
                    </div>
                  ))}
                  {attendanceStats?.institution_stats?.filter(inst => inst.attendance_rate < 70).length === 0 && (
                    <div className="text-xs text-green-600">All institutions performing well</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
              <div className="bg-blue-50 p-2 rounded-full text-blue-600">
                <Activity className="w-5 h-5"/>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-sm">Programme Summary</h3>
                <p className="text-xs text-gray-500 mt-1">Overall programme statistics</p>
                <div className="mt-2 space-y-1 text-xs text-gray-600">
                  <div>Total Institutions: {attendanceStats?.total_institutions || 0}</div>
                  <div>Total Batches: {attendanceStats?.total_batches || 0}</div>
                  <div>Total Students: {attendanceStats?.total_students || 0}</div>
                  <div>Avg Attendance: {attendanceStats?.overall_attendance_rate || 0}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
