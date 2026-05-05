import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import {
  Plus, Calendar, Clock, BookOpen, X, Trash2,
  CheckCircle, AlertCircle, AlertTriangle, Search,
  ChevronDown, Users, Pencil, Video
} from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────
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

const getSessionStatus = (session) => {
  const now = new Date();
  const sessionDate = new Date(session.date);
  const today = new Date(now.toDateString());
  const sDate = new Date(sessionDate.toDateString());

  if (sDate > today) return 'upcoming';
  if (sDate < today) return 'completed';

  // Same day — check time
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const start = parseTimeToMinutes(session.start_time);
  const end = parseTimeToMinutes(session.end_time);
  if (nowMins < start) return 'upcoming';
  if (nowMins > end) return 'completed';
  return 'ongoing';
};

const STATUS_STYLES = {
  upcoming:  { badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500',   label: 'Upcoming' },
  ongoing:   { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500 animate-pulse', label: 'Live' },
  completed: { badge: 'bg-gray-100 text-gray-500',   dot: 'bg-gray-400',   label: 'Completed' },
};

const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// ── main component ────────────────────────────────────────────────────────────
export default function TrainerSessions() {
  const { user } = useAuth();

  const [sessions, setSessions]     = useState([]);
  const [batches, setBatches]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [deleting, setDeleting]     = useState(null);
  const [attSummaries, setAttSummaries] = useState({}); // { sessionId: {present,total,rate} }

  // edit modal
  const [editSession, setEditSession] = useState(null);
  const [editForm, setEditForm]     = useState({ title: '', date: '', start_time: '', end_time: '', meeting_link: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError]   = useState('');

  // filters
  const [search, setSearch]         = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // form
  const [form, setForm] = useState({ batch_id: '', title: '', date: '', start_time: '', end_time: '', meeting_link: '' });
  const [conflict, setConflict]     = useState(null);   // {message}
  const [batchSessions, setBatchSessions] = useState([]); // sessions already in selected batch+date
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');

  // toast
  const [toast, setToast]           = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/sessions');
      setSessions(res.data);
      // Fetch attendance summaries for completed sessions
      const completed = res.data.filter(s => getSessionStatus(s) === 'completed');
      const summaries = {};
      await Promise.all(completed.map(async s => {
        try {
          const r = await axios.get(`/sessions/${s.id}/attendance-summary`);
          const total = r.data.total || 0;
          const present = r.data.present || 0;
          summaries[s.id] = { present, total, rate: total > 0 ? Math.round((present / total) * 100) : 0 };
        } catch { /* silent */ }
      }));
      setAttSummaries(summaries);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  const fetchBatches = useCallback(async () => {
    try {
      const res = await axios.get('/batches');
      setBatches(res.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchSessions(); fetchBatches(); }, []);

  // ── edit session ──────────────────────────────────────────────────────────
  const openEdit = (session) => {
    setEditSession(session);
    setEditForm({
      title: session.title,
      date: new Date(session.date).toISOString().split('T')[0],
      start_time: session.start_time,
      end_time: session.end_time,
      meeting_link: session.meeting_link || ''
    });
    setEditError('');
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError('');
    try {
      await axios.put(`/sessions/${editSession.id}`, editForm);
      showToast('Session updated successfully');
      setEditSession(null);
      fetchSessions();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update session');
    }
    setEditSaving(false);
  };

  // ── real-time conflict check ───────────────────────────────────────────────
  useEffect(() => {
    const checkConflict = async () => {
      setConflict(null);
      if (!form.batch_id || !form.date || !form.start_time || !form.end_time) { setBatchSessions([]); return; }
      try {
        const res = await axios.get(`/batches/${form.batch_id}/sessions?date=${form.date}`);
        setBatchSessions(res.data);
        const ns = parseTimeToMinutes(form.start_time);
        const ne = parseTimeToMinutes(form.end_time);
        if (ns >= ne) { setConflict({ message: 'End time must be after start time.' }); return; }
        const hit = res.data.find(s => {
          const es = parseTimeToMinutes(s.start_time);
          const ee = parseTimeToMinutes(s.end_time);
          return (ns < ee) && (ne > es);
        });
        if (hit) setConflict({ message: `Slot occupied by "${hit.title}" (${hit.start_time} – ${hit.end_time})` });
      } catch { /* silent */ }
    };
    checkConflict();
  }, [form.batch_id, form.date, form.start_time, form.end_time]);

  // ── create session ─────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (conflict) return;
    setSubmitting(true);
    setFormError('');
    try {
      await axios.post('/sessions', form);
      showToast('Session created successfully');
      setShowModal(false);
      resetForm();
      fetchSessions();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create session';
      if (err.response?.status === 409) setConflict({ message: msg });
      else setFormError(msg);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await axios.delete(`/sessions/${id}`);
      showToast('Session deleted');
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      showToast(err.response?.data?.message || 'Error deleting session', 'error');
    }
    setDeleting(null);
  };

  const resetForm = () => {
    setForm({ batch_id: '', title: '', date: '', start_time: '', end_time: '', meeting_link: '' });
    setConflict(null);
    setBatchSessions([]);
    setFormError('');
  };

  // ── filtered sessions ──────────────────────────────────────────────────────
  const filtered = sessions.filter(s => {
    const status = getSessionStatus(s);
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.batch?.name?.toLowerCase().includes(search.toLowerCase());
    const matchBatch  = !filterBatch  || s.batch_id?.toString() === filterBatch;
    const matchStatus = !filterStatus || status === filterStatus;
    return matchSearch && matchBatch && matchStatus;
  });

  const counts = { all: sessions.length, upcoming: 0, ongoing: 0, completed: 0 };
  sessions.forEach(s => { counts[getSessionStatus(s)]++; });

  // ── timeline for selected batch+date ──────────────────────────────────────
  const hourSlots = Array.from({ length: 14 }, (_, i) => i + 7); // 7am–8pm

  return (
    <div className="min-h-full bg-gray-50 p-6 space-y-6">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-bold transition-all
          ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
          {toast.message}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Manage Sessions</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Your Training Schedule</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all"
        >
          <Plus size={16}/> Create Session
        </button>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: counts.all, color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Upcoming', value: counts.upcoming, color: 'bg-sky-50 text-sky-700 border-sky-100' },
          { label: 'Live Now', value: counts.ongoing, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          { label: 'Completed', value: counts.completed, color: 'bg-gray-50 text-gray-600 border-gray-100' },
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-2xl border ${s.color} flex flex-col`}>
            <span className="text-xs font-black uppercase tracking-widest opacity-60">{s.label}</span>
            <span className="text-3xl font-black mt-1">{s.value}</span>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] border border-gray-200 rounded-xl px-3 py-2">
          <Search size={14} className="text-gray-400"/>
          <input
            type="text"
            placeholder="Search sessions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm focus:outline-none bg-transparent"
          />
        </div>
        <div className="relative">
          <select
            value={filterBatch}
            onChange={e => setFilterBatch(e.target.value)}
            className="appearance-none border border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm focus:outline-none focus:border-blue-400 bg-white"
          >
            <option value="">All Batches</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-3 text-gray-400 pointer-events-none"/>
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="appearance-none border border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm focus:outline-none focus:border-blue-400 bg-white"
          >
            <option value="">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Live</option>
            <option value="completed">Completed</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-3 text-gray-400 pointer-events-none"/>
        </div>
      </div>

      {/* ── Session Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-400 text-xs font-black uppercase tracking-widest border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Title</th>
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
                      <button onClick={() => { resetForm(); setShowModal(true); }} className="text-blue-500 text-xs font-bold underline">Create your first session</button>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(session => {
                const status = getSessionStatus(session);
                const st = STATUS_STYLES[status];
                const att = attSummaries[session.id];
                return (
                  <tr key={session.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                          {session.meeting_link ? <Video size={16}/> : <BookOpen size={16}/>}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{session.title}</p>
                          {session.meeting_link && <p className="text-[10px] text-indigo-500 font-bold mt-0.5">Virtual Session</p>}
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
                    {/* Attendance column — only shows data after session ends */}
                    <td className="px-4 py-4">
                      {status === 'completed' ? (
                        att ? (
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${att.rate >= 75 ? 'bg-emerald-500' : att.rate >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                                style={{ width: `${att.rate}%` }}
                              />
                            </div>
                            <span className={`text-xs font-black ${att.rate >= 75 ? 'text-emerald-600' : att.rate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                              {att.rate}%
                            </span>
                            <span className="text-[10px] text-gray-400">{att.present}/{att.total}</span>
                          </div>
                        ) : <span className="text-xs text-gray-400 italic">No data</span>
                      ) : (
                        <span className="text-xs text-gray-300 italic">After session</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(session)}
                          className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit session"
                        >
                          <Pencil size={15}/>
                        </button>
                        <button
                          onClick={() => handleDelete(session.id)}
                          disabled={deleting === session.id}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                          title="Delete session"
                        >
                          <Trash2 size={15}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── EDIT SESSION MODAL ── */}
      {editSession && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-amber-500 to-orange-500">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Pencil size={16} className="text-white"/>
                </div>
                <h3 className="font-black text-white text-lg">Edit Session</h3>
              </div>
              <button onClick={() => setEditSession(null)} className="text-white/70 hover:text-white"><X size={20}/></button>
            </div>
            <form onSubmit={handleEditSave} className="p-6 space-y-4">
              {editError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2"><AlertCircle size={14}/>{editError}</div>}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Session Title</label>
                <input required type="text" value={editForm.title} onChange={e => setEditForm(p => ({...p, title: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"/>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Date</label>
                <input required type="date" value={editForm.date} onChange={e => setEditForm(p => ({...p, date: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Start Time</label>
                  <input required type="time" value={editForm.start_time} onChange={e => setEditForm(p => ({...p, start_time: e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">End Time</label>
                  <input required type="time" value={editForm.end_time} onChange={e => setEditForm(p => ({...p, end_time: e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"/>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Meeting Link</label>
                <input type="url" value={editForm.meeting_link} onChange={e => setEditForm(p => ({...p, meeting_link: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
                  placeholder="https://meet.google.com/..."/>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditSession(null)} className="flex-1 border border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-all text-sm">Cancel</button>
                <button type="submit" disabled={editSaving} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-amber-200 text-sm disabled:opacity-60">
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE SESSION MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 max-h-[95vh] overflow-y-auto">

            {/* Modal header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Plus size={16} className="text-white"/>
                </div>
                <h3 className="font-black text-white text-lg">Create Session</h3>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-white/70 hover:text-white transition-colors">
                <X size={20}/>
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">

              {/* Global error */}
              {formError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0"/>
                  {formError}
                </div>
              )}

              {/* Batch */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Batch <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={form.batch_id}
                    onChange={e => setForm(p => ({ ...p, batch_id: e.target.value }))}
                    className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="">Select a batch…</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none"/>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Session Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="e.g. Introduction to React Hooks"
                />
              </div>

              {/* Meeting Link */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Meeting Link <span className="text-gray-300">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400 text-xs font-bold">🔗</span>
                  <input
                    type="url"
                    value={form.meeting_link}
                    onChange={e => setForm(p => ({ ...p, meeting_link: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="https://meet.google.com/... or Zoom link"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 ml-1">Students will receive this link 10 minutes before the session starts.</p>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Date <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3 top-3.5 text-gray-400 pointer-events-none"/>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Time row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Start Time <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Clock size={15} className="absolute left-3 top-3.5 text-gray-400 pointer-events-none"/>
                    <input
                      type="time"
                      required
                      value={form.start_time}
                      onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
                      className={`w-full border rounded-xl px-4 py-3 pl-9 text-sm focus:outline-none focus:ring-2 transition-all ${conflict ? 'border-red-300 focus:ring-red-200 focus:border-red-400 bg-red-50' : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'}`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    End Time <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Clock size={15} className="absolute left-3 top-3.5 text-gray-400 pointer-events-none"/>
                    <input
                      type="time"
                      required
                      value={form.end_time}
                      onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}
                      className={`w-full border rounded-xl px-4 py-3 pl-9 text-sm focus:outline-none focus:ring-2 transition-all ${conflict ? 'border-red-300 focus:ring-red-200 focus:border-red-400 bg-red-50' : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'}`}
                    />
                  </div>
                </div>
              </div>

              {/* Conflict warning */}
              {conflict && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold animate-pulse">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-red-500"/>
                  <span>⛔ {conflict.message}</span>
                </div>
              )}

              {/* Scheduled sessions in batch+date */}
              {batchSessions.length > 0 && !conflict && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Already Scheduled This Day</p>
                  {batchSessions.map(s => (
                    <div key={s.id} className="flex items-center gap-2 text-xs text-blue-700 font-semibold py-0.5">
                      <Clock size={11}/> {s.start_time} – {s.end_time}: <span className="font-bold">{s.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 border border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !!conflict}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/><span>Creating…</span></>
                  ) : (
                    <><Plus size={15}/><span>Create Session</span></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
