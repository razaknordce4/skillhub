import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MoreHorizontal, Edit2, ArrowRight, UserPlus, Shield, Users, Activity } from 'lucide-react';

export default function ProgrammeManagerDashboard() {
  const [summary, setSummary] = useState(null);
  
  // Create User Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('INSTITUTION');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await axios.get('/programme/summary');
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await axios.post('/users', { name, email, password, role });
      setMsg(`Successfully provisioned new ${role}!`);
      setName(''); setEmail(''); setPassword('');
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
          <span>Last edited, 20 Dec 2023</span>
          <button className="flex items-center bg-white border border-gray-200 px-3 py-1.5 rounded-md font-medium text-gray-700 hover:bg-gray-50">
            <Edit2 className="w-4 h-4 mr-2" /> Edit Widget
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ROW 1: 3 Cards */}
        
        {/* Card 1: Length of Service (Bar Chart Mock) */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-gray-900 text-lg">System Growth</h2>
            <div className="flex space-x-2 text-gray-400">
              <Edit2 className="w-4 h-4" />
              <MoreHorizontal className="w-4 h-4" />
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
          <div className="flex-1 flex items-end justify-between px-2 relative h-40">
             {/* Y-axis */}
             <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-xs text-gray-400">
               <span>15</span><span>10</span><span>5</span><span>0</span>
             </div>
             {/* Grid lines */}
             <div className="absolute left-6 right-0 top-2 bottom-6 flex flex-col justify-between z-0">
                <div className="border-b border-dashed border-gray-200 w-full h-0"></div>
                <div className="border-b border-dashed border-gray-200 w-full h-0"></div>
                <div className="border-b border-dashed border-gray-200 w-full h-0"></div>
                <div className="border-b border-gray-300 w-full h-0"></div>
             </div>
             {/* Bars */}
             <div className="z-10 flex flex-col items-center ml-8 w-8">
               <div className="w-full bg-[#2d6a5f] rounded-t-sm" style={{height: `${(summary?.total_institutions / 15) * 100}%`}}></div>
               <span className="text-xs text-gray-500 mt-2">Inst.</span>
             </div>
             <div className="z-10 flex flex-col items-center w-8">
               <div className="w-full bg-[#2d6a5f] rounded-t-sm" style={{height: '60%'}}></div>
               <span className="text-xs text-gray-500 mt-2">Batches</span>
             </div>
             <div className="z-10 flex flex-col items-center w-8">
               <div className="w-full bg-[#2d6a5f] rounded-t-sm" style={{height: `${(summary?.total_sessions / 15) * 100}%`}}></div>
               <span className="text-xs text-gray-500 mt-2">Sessions</span>
             </div>
             <div className="z-10 flex flex-col items-center w-8">
               <div className="w-full bg-[#2d6a5f] rounded-t-sm" style={{height: `${(summary?.total_trainers / 15) * 100}%`}}></div>
               <span className="text-xs text-gray-500 mt-2">Trainers</span>
             </div>
             <div className="z-10 flex flex-col items-center w-8">
               <div className="w-full bg-[#2d6a5f] rounded-t-sm" style={{height: '15%'}}></div>
               <span className="text-xs text-gray-500 mt-2">MOs</span>
             </div>
          </div>
        </div>

        {/* Card 2: Job Level (Stacked Segments Mock) */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-gray-900 text-lg">Platform Usage</h2>
            <div className="flex space-x-2 text-gray-400">
              <Edit2 className="w-4 h-4" />
              <MoreHorizontal className="w-4 h-4" />
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
             <div className="flex justify-between w-full px-2 mb-2">
                <div className="flex flex-col border-l border-dashed border-gray-300 pl-2">
                  <span className="text-xl font-bold text-gray-900">3</span>
                  <span className="text-xs text-gray-400">Admin</span>
                </div>
                <div className="flex flex-col border-l border-dashed border-gray-300 pl-2">
                  <span className="text-xl font-bold text-gray-900">{summary?.total_institutions || 0}</span>
                  <span className="text-xs text-gray-400">Inst.</span>
                </div>
                <div className="flex flex-col border-l border-dashed border-gray-300 pl-2 flex-1">
                  <span className="text-xl font-bold text-gray-900">{summary?.total_students || 0}</span>
                  <span className="text-xs text-gray-400">Students</span>
                </div>
                <div className="flex flex-col border-l border-dashed border-gray-300 pl-2">
                  <span className="text-xl font-bold text-gray-900">{summary?.total_trainers || 0}</span>
                  <span className="text-xs text-gray-400">Trainers</span>
                </div>
             </div>
             {/* Stacked bar */}
             <div className="w-full h-4 flex rounded-sm overflow-hidden mt-6">
                <div className="bg-[#2d6a5f] w-[10%]"></div>
                <div className="bg-[#fcd34d] w-[15%]"></div>
                <div className="bg-[#c084fc] w-[55%]"></div>
                <div className="bg-[#f97316] w-[20%]"></div>
             </div>
          </div>
        </div>

        {/* Card 3: Gender Diversity (Horizontal Bars Mock) */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-gray-900 text-lg">Active Rate</h2>
            <div className="flex space-x-2 text-gray-400">
              <Edit2 className="w-4 h-4" />
              <MoreHorizontal className="w-4 h-4" />
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center relative pb-6">
             <div className="mb-4 relative z-10">
               <span className="text-sm font-medium text-gray-700 mb-1 block">Expected</span>
               <div className="w-full bg-gray-100 h-6 rounded-sm relative">
                 <div className="bg-[#c084fc] h-full rounded-sm absolute left-0" style={{width: '75%'}}></div>
               </div>
             </div>
             <div className="relative z-10">
               <span className="text-sm font-medium text-gray-700 mb-1 block">Actual Attendance</span>
               <div className="w-full bg-gray-100 h-6 rounded-sm relative">
                 <div className="bg-[#3b82f6] h-full rounded-sm absolute left-0" style={{width: `${summary?.overall_attendance_rate || 85}%`}}></div>
               </div>
             </div>
             
             {/* X-axis ticks */}
             <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400">
               <span>0</span><span>20</span><span>40</span><span>60</span><span>80</span><span>100</span>
             </div>
             {/* Vertical grid lines */}
             <div className="absolute top-0 bottom-4 left-0 right-0 flex justify-between z-0 px-2">
               <div className="border-l border-gray-100 h-full"></div>
               <div className="border-l border-gray-100 h-full"></div>
               <div className="border-l border-gray-100 h-full"></div>
               <div className="border-l border-gray-100 h-full"></div>
               <div className="border-l border-gray-100 h-full"></div>
             </div>
          </div>
        </div>

      </div>

      {/* ROW 2: Things To-Do & Employee Type */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Things To-Do (Provision Form Mocked as List Items) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
            <h2 className="font-bold text-gray-900 text-lg flex items-center">System Actions <span className="bg-gray-800 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2">1</span></h2>
            <div className="flex space-x-2 text-gray-400">
              <Edit2 className="w-4 h-4" />
              <MoreHorizontal className="w-4 h-4" />
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start justify-between border-b border-gray-50 pb-6">
              <div className="flex items-start">
                <div className="bg-gray-100 p-2 rounded-full mr-4 text-gray-500"><UserPlus className="w-5 h-5"/></div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Provision New Role</h3>
                  <p className="text-xs text-gray-500 mt-1 mb-3">Add a new team member or institution to the platform.</p>
                  
                  {/* Form embedded */}
                  <form onSubmit={handleCreateUser} className="bg-gray-50 p-4 rounded-lg border border-gray-100 max-w-md">
                    {msg && <div className="mb-3 text-xs text-blue-600 font-medium bg-blue-50 p-2 rounded">{msg}</div>}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#fcd34d]" placeholder="Name" />
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#fcd34d]" placeholder="Email" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#fcd34d]" placeholder="Password" />
                      <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#fcd34d]">
                        <option value="INSTITUTION">Institution</option>
                        <option value="MONITORING_OFFICER">Monitoring Officer</option>
                        <option value="TRAINER">Trainer</option>
                        <option value="STUDENT">Student</option>
                      </select>
                    </div>
                    <button type="submit" className="bg-[#fcd34d] hover:bg-[#fbbf24] text-[#854d0e] font-bold text-xs px-4 py-2 rounded shadow-sm w-full transition-colors">
                      Run Provision
                    </button>
                  </form>

                </div>
              </div>
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </div>

            <div className="flex items-start justify-between border-b border-gray-50 pb-6">
              <div className="flex items-start">
                <div className="bg-[#e0f2fe] p-2 rounded-full mr-4 text-[#0284c7]"><Activity className="w-5 h-5"/></div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center">Generate Global Report <span className="bg-[#f97316] text-white text-[10px] px-1.5 py-0.5 rounded ml-2 uppercase font-bold">Urgent</span></h3>
                  <p className="text-xs text-gray-500 mt-1">Review monthly attendance cycle Nov 26th to Dec 26th</p>
                  <p className="text-xs text-gray-400 mt-1">Thu, 20 Dec 2023</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="bg-[#fcd34d] hover:bg-[#fbbf24] text-[#854d0e] font-bold text-xs px-3 py-1.5 rounded shadow-sm transition-colors">Generate</button>
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Employee Type (Donut Chart Mock) */}
        <div className="col-span-1 bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-gray-900 text-lg">User Type</h2>
            <div className="flex space-x-2 text-gray-400">
              <Edit2 className="w-4 h-4" />
              <MoreHorizontal className="w-4 h-4" />
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 mb-6">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                {/* Yellow Segment */}
                <path className="text-[#fcd34d]" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                {/* Green Segment over top */}
                <path className="text-[#2d6a5f]" strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-gray-500">Total Users</span>
                <span className="text-3xl font-bold text-gray-900">{summary?.total_students ? summary.total_students + 16 : 34}</span>
              </div>
            </div>
            
            <div className="w-full flex justify-between px-4">
               <div className="flex flex-col">
                 <span className="font-bold text-gray-900 flex items-center text-sm"><div className="w-3 h-3 bg-[#2d6a5f] rounded-sm mr-2"></div> {summary?.total_students || 0} Students</span>
               </div>
               <div className="flex flex-col">
                 <span className="font-bold text-gray-900 flex items-center text-sm"><div className="w-3 h-3 bg-[#fcd34d] rounded-sm mr-2"></div> {summary?.total_trainers || 0} Trainers</span>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
