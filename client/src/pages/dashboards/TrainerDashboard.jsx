import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  MoreVertical, BookOpen, Users, DollarSign, Calendar, 
  Clock, Plus, Link as LinkIcon, ChevronDown, TrendingUp,
  CheckCircle, Activity, User
} from 'lucide-react';
import usePolling from '../../hooks/usePolling';

export default function TrainerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  const fetchAttendanceStats = async () => {
    if (!attendanceStats) setLoading(true);
    try {
      const res = await axios.get('/trainer/attendance-stats');
      setAttendanceStats(res.data);
    } catch (err) {
      console.error('Error fetching attendance stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await axios.get('/api/batches');
      setBatches(res.data);
      if (res.data.length > 0) setSelectedBatch(res.data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await axios.get('/api/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchAttendanceStats();
      fetchBatches();
      fetchSessions();
    }
  }, [authLoading, user]);

  // Poll for trainer updates every 30 seconds
  usePolling(() => {
    if (user) {
      fetchAttendanceStats();
      fetchBatches();
      fetchSessions();
    }
  }, 30000, !!user);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/sessions', {
        batch_id: selectedBatch,
        title,
        date,
        start_time: startTime,
        end_time: endTime,
        meeting_link: meetingLink
      });
      fetchSessions();
      fetchAttendanceStats();
      setTitle(''); setDate(''); setStartTime(''); setEndTime(''); setMeetingLink('');
      alert('Session created successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating session');
    }
  };

  const generateInvite = async () => {
    if (!selectedBatch) return;
    try {
      const res = await axios.post(`/api/batches/${selectedBatch}/invite`);
      setInviteLink(res.data.inviteLink);
    } catch (err) {
      alert('Error generating invite');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl font-bold text-[#1e293b]">Good morning, {user?.name.split(' ')[0] || 'Trainer'}</h1>
        <p className="text-gray-500 mt-1">Glad to see you again</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-50 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Batches</p>
                <p className="text-2xl font-bold text-gray-900">{attendanceStats?.batch_count || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-50 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{attendanceStats?.total_sessions || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-50 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceStats?.batch_stats?.reduce((sum, batch) => sum + batch.attendance_rate, 0) / 
                   (attendanceStats?.batch_stats?.length || 1) || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-50 p-3 rounded-full">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{attendanceStats?.upcoming_sessions || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg mb-6">Batch Performance</h3>
          
          <div className="space-y-4">
            {attendanceStats?.batch_stats?.map((batch) => (
              <div key={batch.batch_id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{batch.batch_name}</h4>
                  <span className="text-sm font-bold text-blue-600">{batch.attendance_rate}%</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${batch.attendance_rate}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{batch.student_count} students</span>
                  <span>{batch.total_sessions} sessions</span>
                </div>
              </div>
            ))}
            
            {(!attendanceStats?.batch_stats || attendanceStats.batch_stats.length === 0) && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No batches assigned yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div>
          <h2 className="text-xl font-bold text-[#1e293b] mb-4">Upcoming Sessions</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-h-60 overflow-y-auto">
            <ul className="divide-y divide-gray-100">
              {sessions.filter(s => new Date(s.date) >= new Date()).map(s => (
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
              {sessions.filter(s => new Date(s.date) >= new Date()).length === 0 && 
                <li className="p-6 text-sm text-gray-500 text-center">No upcoming sessions scheduled.</li>
              }
            </ul>
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
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-[#d97706] sm:text-sm bg-gray-50" placeholder="dd-mm-yyyy" />
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Google Meet Link</label>
                <input type="url" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-[#d97706] sm:text-sm bg-gray-50" placeholder="https://meet.google.com/..." />
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
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
               {(() => {
                 const nextSession = sessions
                   .filter(s => new Date(s.date) >= new Date())
                   .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
                 
                 if (nextSession && nextSession.meeting_link) {
                   return (
                     <div>
                       <p className="text-sm text-gray-500 mb-4">Next session meeting link for your students:</p>
                       <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                         <div className="flex items-center justify-between mb-2">
                           <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Next Session Link</span>
                           <span className="text-xs text-blue-600">{new Date(nextSession.date).toLocaleDateString()} • {nextSession.start_time}</span>
                         </div>
                         <a href={nextSession.meeting_link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-700 font-mono hover:underline break-all">
                           {nextSession.meeting_link}
                         </a>
                         <p className="text-xs text-gray-600 mt-2">{nextSession.title}</p>
                       </div>
                     </div>
                   );
                 } else if (nextSession) {
                   return (
                     <div>
                       <p className="text-sm text-gray-500 mb-4">Next session found but no meeting link added:</p>
                       <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                         <p className="text-sm text-amber-800 font-medium">{nextSession.title}</p>
                         <p className="text-xs text-amber-600 mt-1">{new Date(nextSession.date).toLocaleDateString()} • {nextSession.start_time}</p>
                         <p className="text-xs text-amber-600 mt-2">Add a meeting link to the session to share with students.</p>
                       </div>
                     </div>
                   );
                 } else {
                   return (
                     <div>
                       <p className="text-sm text-gray-500 mb-4">No upcoming sessions found. Create a session to generate a meeting link for your students.</p>
                       <button 
                         onClick={() => document.querySelector('form').scrollIntoView({ behavior: 'smooth' })}
                         className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-[#1e293b] hover:bg-gray-800"
                       >
                         <Plus className="w-4 h-4 mr-2" /> Create Session
                       </button>
                     </div>
                   );
                 }
               })()}
               
               <div className="mt-4 pt-4 border-t border-gray-200">
                 <p className="text-sm text-gray-500 mb-2">Or generate batch invite link:</p>
                 <button onClick={generateInvite} className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 shadow-sm text-sm font-bold rounded-lg text-gray-700 bg-white hover:bg-gray-50">
                    <LinkIcon className="w-4 h-4 mr-2" /> Generate Batch Invite
                 </button>
                 {inviteLink && (
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg break-all">
                      <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Batch Invite URL</span>
                      <span className="text-sm text-gray-700 font-mono">{inviteLink}</span>
                    </div>
                 )}
               </div>
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
