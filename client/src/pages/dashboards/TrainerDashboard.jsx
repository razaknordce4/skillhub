import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  MoreVertical, BookOpen, Users, DollarSign, Calendar, 
  Clock, Plus, Link as LinkIcon, ChevronDown
} from 'lucide-react';

export default function TrainerDashboard() {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    fetchBatches();
    fetchSessions();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await axios.get('/batches');
      setBatches(res.data);
      if (res.data.length > 0) setSelectedBatch(res.data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await axios.get('/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/sessions', {
        batch_id: selectedBatch,
        title,
        date,
        start_time: startTime,
        end_time: endTime
      });
      fetchSessions();
      setTitle(''); setDate(''); setStartTime(''); setEndTime('');
      alert('Session created successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating session');
    }
  };

  const generateInvite = async () => {
    if (!selectedBatch) return;
    try {
      const res = await axios.post(`/batches/${selectedBatch}/invite`);
      setInviteLink(res.data.inviteLink);
    } catch (err) {
      alert('Error generating invite');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl font-bold text-[#1e293b]">Good morning, {user?.name.split(' ')[0] || 'Trainer'}</h1>
        <p className="text-gray-500 mt-1">Glad to see you again</p>
      </div>

      {/* Row 1: Overview & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: 3 Cards */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-[#1e293b] mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Total Students */}
            <div className="bg-[#eaf5ef] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-36">
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-[#d1ebd9] rounded-full opacity-50"></div>
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <div className="bg-white/50 p-1.5 rounded-lg w-8 h-8 flex items-center justify-center mb-2">
                    <Users className="w-4 h-4 text-[#059669]" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Total Batches</span>
                </div>
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-[#1e293b]">{batches.length}</div>
                <div className="text-xs text-gray-500 mt-1">Assigned</div>
              </div>
            </div>

            {/* Total Course / Sessions */}
            <div className="bg-[#fef3dd] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-36">
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-[#fde6b8] rounded-full opacity-50"></div>
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <div className="bg-white/50 p-1.5 rounded-lg w-8 h-8 flex items-center justify-center mb-2">
                    <BookOpen className="w-4 h-4 text-[#d97706]" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Total Sessions</span>
                </div>
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-[#1e293b]">{sessions.length}</div>
                <div className="text-xs text-gray-500 mt-1">Conducted</div>
              </div>
            </div>

            {/* Total Earning / Sessions (placeholder for real logic) */}
            <div className="bg-[#eef2ff] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-36">
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-[#dbeafe] rounded-full opacity-50"></div>
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <div className="bg-white/50 p-1.5 rounded-lg w-8 h-8 flex items-center justify-center mb-2">
                    <DollarSign className="w-4 h-4 text-[#4f46e5]" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Active Students</span>
                </div>
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <div className="text-3xl font-bold text-[#1e293b]">12</div>
                <div className="text-xs text-gray-500 mt-1">Active Today</div>
              </div>
            </div>

          </div>
        </div>

        {/* Right: Performance Donut */}
        <div className="col-span-1">
          <h2 className="text-xl font-bold text-[#1e293b] mb-4">Performance</h2>
          <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center h-36">
            <div className="w-24 h-24 relative flex-shrink-0">
               {/* Mock SVG Donut Chart */}
               <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <path
                    className="text-gray-100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                  />
                  <path
                    className="text-[#d97706]"
                    strokeDasharray="58, 100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                  />
                </svg>
            </div>
            <div className="ml-6 flex flex-col justify-center">
              <span className="text-4xl font-extrabold text-[#1e293b]">58%</span>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex items-center justify-between space-x-2">
                  <span className="flex items-center"><div className="w-2 h-2 bg-[#d97706] mr-1"></div> Actual</span>
                  <span className="text-green-500">▲ 4%</span>
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <span className="flex items-center"><div className="w-2 h-2 bg-gray-200 mr-1"></div> Expected</span>
                  <span className="text-green-500">▲ 8%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Working Activity & Top Course */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
        {/* Working Activity Area Chart */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold text-[#1e293b]">Working Activity</h2>
             <button className="text-sm text-gray-500 flex items-center">Last week <ChevronDown className="w-4 h-4 ml-1" /></button>
          </div>
          <div className="bg-[#fffdf7] rounded-2xl p-6 h-64 border border-[#fef3dd] relative overflow-hidden flex items-end">
             {/* Mock Y Axis */}
             <div className="absolute left-4 top-6 bottom-8 flex flex-col justify-between text-xs text-gray-400">
               <span>$500</span><span>$400</span><span>$300</span><span>$200</span><span>$100</span>
             </div>
             
             {/* Mock Chart Area */}
             <div className="absolute left-16 right-4 top-8 bottom-8">
               <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
                 <defs>
                   <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                     <stop offset="0%" stopColor="#fde6b8" stopOpacity="0.8" />
                     <stop offset="100%" stopColor="#fde6b8" stopOpacity="0" />
                   </linearGradient>
                 </defs>
                 <path d="M0,80 Q50,60 100,50 T200,20 T300,70 T400,20 L400,100 L0,100 Z" fill="url(#gradient)" />
                 <path d="M0,80 Q50,60 100,50 T200,20 T300,70 T400,20" fill="none" stroke="#d97706" strokeWidth="2" />
                 <circle cx="200" cy="20" r="4" fill="white" stroke="#d97706" strokeWidth="2" />
               </svg>
               {/* Tooltip on chart point */}
               <div className="absolute left-[45%] -top-4 bg-white shadow rounded px-2 py-1 text-xs text-gray-600 font-bold border border-gray-100">78%</div>
             </div>
             
             {/* Mock X Axis */}
             <div className="w-full pl-12 flex justify-between text-xs text-gray-400 mt-auto pt-4 relative z-10">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thus</span><span>Fri</span><span>Sat</span><span>Sun</span>
             </div>
          </div>
        </div>

        {/* Top Course */}
        <div className="col-span-1">
          <h2 className="text-xl font-bold text-[#1e293b] mb-4">Top Batches</h2>
          <div className="bg-[#fffdf7] rounded-2xl p-6 border border-[#fef3dd] space-y-5 h-64 overflow-y-auto">
             
             {batches.map(batch => (
               <div key={batch.id} className="flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                     <BookOpen className="w-5 h-5 text-blue-600" />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-[#1e293b]">{batch.name}</p>
                     <p className="text-xs text-gray-400">ID: #{batch.id}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-sm font-bold text-[#d97706]">Active</p>
                   <p className="text-xs text-gray-400">Batch</p>
                 </div>
               </div>
             ))}

             {batches.length === 0 && (
               <div className="text-center py-8 text-gray-400 text-sm italic">
                 No batches assigned yet.
               </div>
             )}

          </div>
        </div>

      </div>

      {/* Row 3: Trainer Functional Tools (Sessions & Invites) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        
        {/* Create Session Form */}
        <div>
          <h2 className="text-xl font-bold text-[#1e293b] mb-4">Schedule Live Class</h2>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Batch</label>
                <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-[#d97706] focus:border-[#d97706] sm:text-sm rounded-lg border bg-gray-50">
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Session Title</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-[#d97706] sm:text-sm bg-gray-50" placeholder="e.g. Graphic Design Intro" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-[#d97706] sm:text-sm bg-gray-50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-[#d97706] sm:text-sm bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-[#d97706] sm:text-sm bg-gray-50" />
                </div>
              </div>
              <button type="submit" className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-bold rounded-lg text-[#3f2004] bg-[#fde6b8] hover:bg-[#fcd385]">
                <Plus className="w-4 h-4 mr-2" /> Add to Schedule
              </button>
            </form>
          </div>
        </div>

        {/* Generate Invite & Upcoming Events */}
        <div className="space-y-6">
          
          <div>
            <h2 className="text-xl font-bold text-[#1e293b] mb-4">Student Onboarding</h2>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-start justify-center">
               <p className="text-sm text-gray-500 mb-4">Generate an exclusive invite link for students to enroll in your selected batch.</p>
               <button onClick={generateInvite} className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-[#1e293b] hover:bg-gray-800">
                  <LinkIcon className="w-4 h-4 mr-2" /> Generate Invite Link
               </button>
               {inviteLink && (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg break-all relative w-full">
                    <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Invite URL</span>
                    <span className="text-sm text-[#d97706] font-mono">{inviteLink}</span>
                  </div>
               )}
            </div>
          </div>

          <div>
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold text-[#1e293b]">Upcoming Events</h2>
               <button className="text-sm text-gray-500">View All</button>
             </div>
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-h-60 overflow-y-auto">
               <ul className="divide-y divide-gray-100">
                  {sessions.map(s => (
                    <li key={s.id} className="p-4 hover:bg-gray-50 flex items-start space-x-4">
                      <div className="bg-[#fef3dd] text-[#d97706] rounded-xl px-3 py-2 flex flex-col items-center justify-center min-w-[3.5rem]">
                         <span className="text-xs font-bold uppercase">{new Date(s.date).toLocaleString('default', { month: 'short' })}</span>
                         <span className="text-xl font-black">{new Date(s.date).getDate()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1e293b]">{s.title}</p>
                        <p className="text-xs text-gray-500 flex items-center mt-1"><Clock className="w-3 h-3 mr-1"/> {s.start_time} - {s.end_time}</p>
                      </div>
                    </li>
                  ))}
                  {sessions.length === 0 && <li className="p-6 text-sm text-gray-500 text-center">No upcoming events scheduled.</li>}
               </ul>
             </div>
          </div>

        </div>

      </div>

    </div>
  );
}
