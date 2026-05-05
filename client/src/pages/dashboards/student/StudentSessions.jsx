import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import {
  Calendar, Clock, BookOpen, ExternalLink, CheckCircle,
  AlertCircle, XCircle, Lock, Search, ChevronDown, BarChart2, Video
} from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────────────
const parseTimeToMinutes = (t) => {
  if (!t) return 0;
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return 0;
  let h = parseInt(m[1]), min = parseInt(m[2]);
  if (m[3]) {
    if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
    if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
  }
  return h * 60 + min;
};

const isSameDay = (d1, d2) =>
  new Date(d1).toDateString() === new Date(d2).toDateString();

const getSessionStatus = (session) => {
  const now = new Date();
  const sDate = new Date(session.date);
  if (!isSameDay(now, sDate)) return sDate > now ? 'upcoming' : 'completed';
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const start = parseTimeToMinutes(session.start_time);
  const end = parseTimeToMinutes(session.end_time);
  if (nowMins < start) return 'upcoming';
  if (nowMins > end) return 'completed';
  return 'ongoing';
};

const isLinkActive = (session) => {
  const now = new Date();
  if (!isSameDay(now, new Date(session.date))) return false;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const start = parseTimeToMinutes(session.start_time);
  const end = parseTimeToMinutes(session.end_time);
  return nowMins >= start - 10 && nowMins <= end;
};

const minutesUntilActive = (session) => {
  const now = new Date();
  if (!isSameDay(now, new Date(session.date))) return null;
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const start = parseTimeToMinutes(session.start_time);
  const diff = (start - 10) - nowMins;
  return diff > 0 ? diff : 0;
};

const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_STYLES = {
  upcoming:  { badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500',           label: 'Upcoming' },
  ongoing:   { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500 animate-pulse', label: 'Live Now' },
  completed: { badge: 'bg-gray-100 text-gray-500',   dot: 'bg-gray-400',           label: 'Completed' },
};

const ATT_STYLES = {
  PRESENT: { label: 'Present', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
  ABSENT:  { label: 'Absent',  icon: XCircle,     color: 'text-red-500 bg-red-50' },
  LATE:    { label: 'Late',    icon: AlertCircle,  color: 'text-amber-600 bg-amber-50' },
};

export default function StudentSessions() {
  const { user } = useAuth();
  const [sessions, setSessions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [joining, setJoining]     = useState(null);
  const [toast, setToast]         = useState(null);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [tick, setTick]           = useState(0); // refresh every minute for link availability

  // Tick every 30s to re-evaluate link availability
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/sessions');
      setSessions(res.data);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSessions(); }, []);

  // Join session — marks attendance + redirects
  const handleJoinSession = async (session) => {
    setJoining(session.id);
    try {
      const res = await axios.post(`/sessions/${session.id}/join`);
      showToast('✅ Attendance marked! Opening session…');
      // Refresh sessions to update attendance status
      fetchSessions();
      // Open link in new tab
      setTimeout(() => { window.open(res.data.meeting_link, '_blank', 'noopener'); }, 600);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not join session', 'error');
    }
    setJoining(null);
  };

  // Attendance stats
  const totalSessions = sessions.length;
  const presentCount  = sessions.filter(s => s.myAttendance?.status === 'PRESENT').length;
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;
  const counts = { upcoming: 0, ongoing: 0, completed: 0 };
  sessions.forEach(s => { counts[getSessionStatus(s)]++; });

  // Filter
  const filtered = sessions.filter(s => {
    const status = getSessionStatus(s);
    const matchSearch = !search ||
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.batch?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || status === filterStatus;
    const matchTab = activeTab === 'all' || status === activeTab;
    return matchSearch && matchStatus && matchTab;
  });

  return (
    <div className="min-h-full bg-gray-50 p-6 space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-bold transition-all
          ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">My Sessions</h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Your Learning Schedule</p>
      </div>

      {/* Attendance Progress Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-200">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">Overall Attendance</p>
            <p className="text-5xl font-black mt-2">{attendanceRate}%</p>
            <p className="text-blue-200 text-xs mt-2 font-semibold">{presentCount} of {totalSessions} sessions attended</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
            <BarChart2 size={32} className="text-white" />
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-5">
          <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-blue-200 font-bold">
            <span>0%</span>
            <span className={attendanceRate >= 75 ? 'text-emerald-300' : 'text-amber-300'}>
              {attendanceRate >= 75 ? '✅ Good standing' : '⚠️ Below 75% — improve attendance'}
            </span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Upcoming', value: counts.upcoming, color: 'bg-sky-50 text-sky-700 border-sky-100', tab: 'upcoming' },
          { label: 'Live Now', value: counts.ongoing,  color: 'bg-emerald-50 text-emerald-700 border-emerald-100', tab: 'ongoing' },
          { label: 'Completed', value: counts.completed, color: 'bg-gray-50 text-gray-600 border-gray-100', tab: 'completed' },
        ].map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(activeTab === s.tab ? 'all' : s.tab)}
            className={`p-4 rounded-2xl border ${s.color} flex flex-col text-left transition-all hover:shadow-md ${activeTab === s.tab ? 'ring-2 ring-offset-1 ring-current' : ''}`}
          >
            <span className="text-xs font-black uppercase tracking-widest opacity-60">{s.label}</span>
            <span className="text-3xl font-black mt-1">{s.value}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] border border-gray-200 rounded-xl px-3 py-2">
          <Search size={14} className="text-gray-400"/>
          <input
            type="text"
            placeholder="Search sessions or batches…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm focus:outline-none bg-transparent"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="appearance-none border border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm focus:outline-none focus:border-blue-400 bg-white"
          >
            <option value="">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Live Now</option>
            <option value="completed">Completed</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-3 text-gray-400 pointer-events-none"/>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-400 text-xs font-black uppercase tracking-widest border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Session</th>
                <th className="px-4 py-4">Batch</th>
                <th className="px-4 py-4">Date</th>
                <th className="px-4 py-4">Time</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Attendance</th>
                <th className="px-4 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="py-16 text-center text-gray-400 font-bold">Loading sessions…</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Calendar size={40} className="opacity-20"/>
                      <p className="font-bold text-sm">No sessions found</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(session => {
                const status   = getSessionStatus(session);
                const st       = STATUS_STYLES[status];
                const att      = session.myAttendance;
                const attStyle = att ? ATT_STYLES[att.status] : null;
                const linkActive = session.meeting_link && isLinkActive(session);
                const minsLeft   = session.meeting_link ? minutesUntilActive(session) : null;
                const AttIcon    = attStyle?.icon;

                return (
                  <tr key={session.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                          ${status === 'ongoing' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                          {session.meeting_link ? <Video size={16}/> : <BookOpen size={16}/>}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{session.title}</p>
                          {session.meeting_link && (
                            <p className="text-[10px] text-indigo-500 font-bold flex items-center gap-1 mt-0.5">
                              <Video size={9}/> Virtual Session
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100">
                        {session.batch?.name || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600 text-xs font-semibold">
                        <Calendar size={13} className="text-gray-400"/>
                        {fmt(session.date)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600 text-xs font-semibold">
                        <Clock size={13} className="text-gray-400"/>
                        {session.start_time} – {session.end_time}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${st.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}/>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {att ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${attStyle.color}`}>
                          <AttIcon size={12}/>
                          {attStyle.label}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Not marked</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {/* Meeting link button */}
                        {session.meeting_link && (
                          linkActive ? (
                            <button
                              onClick={() => handleJoinSession(session)}
                              disabled={joining === session.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-200 disabled:opacity-60"
                              title="Join session — attendance will be marked"
                            >
                              {joining === session.id ? (
                                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                              ) : (
                                <ExternalLink size={12}/>
                              )}
                              Join Now
                            </button>
                          ) : status === 'completed' ? (
                            <span className="flex items-center gap-1 text-xs text-gray-400 font-semibold">
                              <Lock size={11}/> Ended
                            </span>
                          ) : isSameDay(new Date(), new Date(session.date)) && minsLeft !== null ? (
                            <span className="flex items-center gap-1 text-xs text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                              <Clock size={11}/> Opens in {minsLeft}m
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-gray-400 font-semibold">
                              <Lock size={11}/> Link available on session day
                            </span>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
