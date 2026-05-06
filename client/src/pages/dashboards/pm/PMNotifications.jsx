import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Send, Users, Building2, CheckCheck, Clock,
  Search, AlertCircle, CheckCircle2, Inbox, Trash2, Trash, AlertTriangle
} from 'lucide-react';

const TABS = ['Send Notification', 'Sent History'];

const TARGET_OPTIONS = [
  { value: 'ALL_MO', label: 'All Monitoring Officers', icon: Users, color: 'indigo' },
  { value: 'SPECIFIC_MO', label: 'Specific Monitoring Officers', icon: Users, color: 'indigo' },
  { value: 'ALL_INST', label: 'All Institutions', icon: Building2, color: 'blue' },
  { value: 'SPECIFIC_INST', label: 'Specific Institutions', icon: Building2, color: 'blue' },
];

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-bold
        ${type === 'success' ? 'bg-emerald-600' : 'bg-red-500'}`}
    >
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      {msg}
    </motion.div>
  );
}

export default function PMNotifications() {
  const [tab, setTab] = useState(0);
  const [targetType, setTargetType] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  // Recipients list (for SPECIFIC_*)
  const [allRecipients, setAllRecipients] = useState([]);  // full list
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);  // selected IDs

  // History (own sent notifications - fetch from the PM's own sent records)
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const needsSelection = targetType === 'SPECIFIC_MO' || targetType === 'SPECIFIC_INST';
  const role = targetType === 'SPECIFIC_MO' || targetType === 'ALL_MO' ? 'MONITORING_OFFICER' : 'INSTITUTION';

  // Load recipient list when specific type is selected
  useEffect(() => {
    if (!needsSelection) { setAllRecipients([]); setSelected([]); return; }
    const r = targetType === 'SPECIFIC_MO' ? 'MONITORING_OFFICER' : 'INSTITUTION';
    axios.get(`/users?role=${r}`)
      .then(res => setAllRecipients(Array.isArray(res.data) ? res.data : []))
      .catch(() => setAllRecipients([]));
    setSelected([]);
    setSearch('');
  }, [targetType]);

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filteredRecipients = allRecipients.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase()) ||
    r.displayId?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = async (e) => {
    e.preventDefault();
    if (!targetType) return showToast('Please select a target audience', 'error');
    if (needsSelection && !selected.length) return showToast('Please select at least one recipient', 'error');

    setSending(true);
    try {
      const res = await axios.post('/notifications/bulk', {
        title,
        message,
        target_type: targetType,
        target_ids: needsSelection ? selected : undefined
      });
      showToast(`  Sent to ${res.data.count} recipient(s)!`);
      setTitle('');
      setMessage('');
      setTargetType('');
      setSelected([]);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send', 'error');
    }
    setSending(false);
  };

  // Load received notifications for the PM (to show history of auto-generated ones)
  useEffect(() => {
    if (tab !== 1) return;
    setHistLoading(true);
    axios.get('/notifications')
      .then(res => setHistory(Array.isArray(res.data) ? res.data : []))
      .catch(() => setHistory([]))
      .finally(() => setHistLoading(false));
  }, [tab]);

  const markAllRead = async () => {
    await axios.put('/notifications/read-all').catch(() => { });
    setHistory(prev => prev.map(n => ({ ...n, status: 'READ' })));
  };

  const markRead = async (id) => {
    await axios.put(`/notifications/${id}/read`).catch(() => { });
    setHistory(prev => prev.map(n => n.id === id ? { ...n, status: 'READ' } : n));
  };

  const deleteOne = async (id) => {
    await axios.delete(`/notifications/${id}`).catch(() => { });
    setHistory(prev => prev.filter(n => n.id !== id));
    setConfirmDeleteId(null);
  };

  const deleteAll = async () => {
    await axios.delete('/notifications').catch(() => { });
    setHistory([]);
    setConfirmDeleteAll(false);
  };

  return (
    <div className="min-h-full bg-gray-50 p-6 space-y-6">
      <AnimatePresence>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        {confirmDeleteAll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">Clear All Notifications?</p>
                  <p className="text-xs text-gray-500 mt-0.5">This will permanently delete all your notifications.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteAll(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={deleteAll} className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-100">Delete All</button>
              </div>
            </motion.div>
          </div>
        )}
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">Delete Notification?</p>
                  <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={() => deleteOne(confirmDeleteId)} className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-100">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" /> Notifications
          </h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Programme Manager · Broadcast Centre</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm w-fit">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all
              ${tab === i ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab 0: Compose ── */}
      {tab === 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Compose form */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 text-lg mb-5 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" /> Compose Notification
            </h2>

            <form onSubmit={handleSend} className="space-y-5">
              {/* Target audience */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Audience</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TARGET_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    const active = targetType === opt.value;
                    return (
                      <button key={opt.value} type="button" onClick={() => setTargetType(opt.value)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all
                          ${active
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                          ${active ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
                        </div>
                        <span className="text-xs font-bold">{opt.label}</span>
                        {active && <CheckCircle2 className="w-4 h-4 ml-auto text-blue-500 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notification Title</label>
                <input
                  type="text" required value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Important Announcement"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Message</label>
                <textarea
                  required value={message} onChange={e => setMessage(e.target.value)} rows={5}
                  placeholder="Write your notification message here..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="mt-1 text-xs text-gray-400 text-right">{message.length} chars</p>
              </div>

              {/* Send button */}
              <button type="submit" disabled={sending || !targetType || !title || !message}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all">
                {sending
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                  : <><Send className="w-4 h-4" /> Send Notification</>}
              </button>
            </form>
          </div>

          {/* Recipient picker (right panel) */}
          <div className="lg:col-span-2">
            {needsSelection ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-6">
                <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                  {targetType === 'SPECIFIC_MO' ? <Users className="w-4 h-4 text-indigo-500" /> : <Building2 className="w-4 h-4 text-blue-500" />}
                  Select Recipients
                </h3>
                <p className="text-xs text-gray-400 mb-3">{selected.length} of {allRecipients.length} selected</p>

                {/* Search */}
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 mb-3">
                  <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
                    className="flex-1 text-sm focus:outline-none bg-transparent" />
                </div>

                {/* Select all */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <button type="button" onClick={() => setSelected(allRecipients.map(r => r.id))}
                    className="text-xs text-blue-600 font-bold hover:underline">Select All</button>
                  <button type="button" onClick={() => setSelected([])}
                    className="text-xs text-gray-400 hover:text-gray-600 font-bold">Clear</button>
                </div>

                {/* List */}
                <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                  {filteredRecipients.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-6">No recipients found</p>
                  ) : filteredRecipients.map(r => (
                    <label key={r.id} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all
                      ${selected.includes(r.id) ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50 border border-transparent'}`}>
                      <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleSelect(r.id)}
                        className="accent-blue-600 w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{r.name}</p>
                        <p className="text-xs text-gray-400 truncate">{r.email}</p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">{r.displayId}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white h-full flex flex-col justify-center items-center text-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Bell className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-bold text-lg">Broadcast to your network</p>
                  <p className="text-blue-200 text-sm mt-1">Select a target audience on the left to see recipient options</p>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full mt-2">
                  {[['Monitoring Officers', 'SPECIFIC_MO'], ['All Institutions', 'ALL_INST']].map(([lbl, val]) => (
                    <button key={val} type="button" onClick={() => setTargetType(val)}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-3 text-xs font-bold transition-all">
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Tab 1: Received notifications ── */}
      {tab === 1 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header row */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Inbox className="w-4 h-4 text-blue-600" />
              Inbox
              {history.filter(n => n.status === 'UNREAD').length > 0 && (
                <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded-full">
                  {history.filter(n => n.status === 'UNREAD').length}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              {history.some(n => n.status === 'UNREAD') && (
                <button onClick={markAllRead}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-xl transition-colors">
                  <CheckCheck className="w-4 h-4" /> Mark all read
                </button>
              )}
              {history.length > 0 && (
                <button onClick={() => setConfirmDeleteAll(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 border border-red-200 bg-red-50 px-3 py-1.5 rounded-xl transition-colors">
                  <Trash className="w-4 h-4" /> Clear all
                </button>
              )}
            </div>
          </div>

          {histLoading ? (
            <div className="py-16 text-center text-gray-400 text-sm font-bold">Loading…</div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center gap-3 text-gray-400">
              <Inbox className="w-12 h-12 opacity-20" />
              <p className="font-bold text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {history.map(n => (
                <div key={n.id} className={`flex items-start gap-4 px-6 py-4 transition-colors group
                  ${n.status === 'UNREAD' ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`}>
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0
                    ${n.status === 'UNREAD' ? 'bg-blue-500' : 'bg-gray-200'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <p className={`text-sm font-bold ${n.status === 'UNREAD' ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                      <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium flex-shrink-0 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(n.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                    {n.status === 'UNREAD' && (
                      <button onClick={() => markRead(n.id)}
                        className="text-xs text-blue-500 font-bold hover:text-blue-700 transition-colors">Read</button>
                    )}
                    <button onClick={() => setConfirmDeleteId(n.id)}
                      className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
