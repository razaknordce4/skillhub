import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Send, Users, BookOpen, CheckCheck, Clock,
  Search, AlertCircle, CheckCircle2, Inbox,
  Trash2, Trash, AlertTriangle, GraduationCap, UserCheck
} from 'lucide-react';

const TABS = ['Send Notification', 'Inbox'];

// Target options: type, label, icon, needsBatch, needsUsers
const TARGET_OPTIONS = [
  { value: 'ALL_STUDENTS', label: 'All Students', icon: GraduationCap, group: 'Students' },
  { value: 'BATCH_STUDENTS', label: 'Students in a Batch', icon: BookOpen, group: 'Students', needsBatch: true },
  { value: 'SPECIFIC_STUDENTS', label: 'Specific Students', icon: UserCheck, group: 'Students', needsUsers: true, userRole: 'STUDENT' },
  { value: 'ALL_TRAINERS', label: 'All Trainers', icon: Users, group: 'Trainers' },
  { value: 'BATCH_TRAINERS', label: 'Trainers in a Batch', icon: BookOpen, group: 'Trainers', needsBatch: true },
  { value: 'SPECIFIC_TRAINERS', label: 'Specific Trainers', icon: UserCheck, group: 'Trainers', needsUsers: true, userRole: 'TRAINER' },
  { value: 'ALL_MO', label: 'Monitoring Officers', icon: UserCheck, group: 'Staff' },
];

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-bold
        ${type === 'success' ? 'bg-emerald-600' : 'bg-red-500'}`}>
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      {msg}
    </motion.div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">{title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-100">Delete</button>
        </div>
      </motion.div>
    </div>
  );
}

// Reusable searchable checkbox list
function RecipientPicker({ items, selected, onToggle, onSelectAll, onClear, search, onSearch, label }) {
  const filtered = items.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase()) ||
    r.displayId?.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-800 text-sm">{label}</h3>
          <p className="text-xs text-gray-400">{selected.length} of {items.length} selected</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onSelectAll} className="text-xs text-blue-600 font-bold hover:underline">All</button>
          <button type="button" onClick={onClear} className="text-xs text-gray-400 hover:text-gray-600 font-bold">Clear</button>
        </div>
      </div>
      <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 mb-3">
        <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <input type="text" placeholder="Search…" value={search} onChange={e => onSearch(e.target.value)}
          className="flex-1 text-sm focus:outline-none bg-transparent" />
      </div>
      <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-6">No results found</p>
        ) : filtered.map(r => (
          <label key={r.id} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all
            ${selected.includes(r.id) ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50 border border-transparent'}`}>
            <input type="checkbox" checked={selected.includes(r.id)} onChange={() => onToggle(r.id)}
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
  );
}

export default function InstitutionNotifications() {
  const [tab, setTab] = useState(0);
  const [targetType, setTargetType] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  // Batch picker state
  const [batches, setBatches] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [batchSearch, setBatchSearch] = useState('');

  // User picker state
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  // Inbox state
  const [inbox, setInbox] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const selectedOption = TARGET_OPTIONS.find(o => o.value === targetType);
  const needsBatch = selectedOption?.needsBatch;
  const needsUsers = selectedOption?.needsUsers;

  // Load batches for institution
  useEffect(() => {
    axios.get('/batches').then(res => setBatches(Array.isArray(res.data) ? res.data : [])).catch(() => { });
  }, []);

  // Load users when a SPECIFIC_* option is selected
  useEffect(() => {
    if (!needsUsers || !selectedOption?.userRole) return;
    setUsers([]);
    setSelectedUsers([]);
    setUserSearch('');
    axios.get(`/users?role=${selectedOption.userRole}`)
      .then(res => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch(() => { });
  }, [targetType]);

  // Reset selection when target changes
  useEffect(() => {
    setSelectedBatches([]);
    setSelectedUsers([]);
  }, [targetType]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!targetType) return showToast('Please select a target audience', 'error');
    if (needsBatch && !selectedBatches.length) return showToast('Please select at least one batch', 'error');
    if (needsUsers && !selectedUsers.length) return showToast('Please select at least one recipient', 'error');

    setSending(true);
    try {
      const res = await axios.post('/notifications/institution/bulk', {
        title,
        message,
        target_type: targetType,
        target_ids: needsBatch ? selectedBatches : needsUsers ? selectedUsers : undefined
      });
      showToast(`  Sent to ${res.data.count} recipient(s)!`);
      setTitle(''); setMessage(''); setTargetType('');
      setSelectedBatches([]); setSelectedUsers([]);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send', 'error');
    }
    setSending(false);
  };

  // Inbox
  useEffect(() => {
    if (tab !== 1) return;
    setInboxLoading(true);
    axios.get('/notifications')
      .then(res => setInbox(Array.isArray(res.data) ? res.data : []))
      .catch(() => setInbox([]))
      .finally(() => setInboxLoading(false));
  }, [tab]);

  const markRead = async (id) => {
    await axios.put(`/notifications/${id}/read`).catch(() => { });
    setInbox(prev => prev.map(n => n.id === id ? { ...n, status: 'READ' } : n));
  };
  const markAllRead = async () => {
    await axios.put('/notifications/read-all').catch(() => { });
    setInbox(prev => prev.map(n => ({ ...n, status: 'READ' })));
  };
  const deleteOne = async (id) => {
    await axios.delete(`/notifications/${id}`).catch(() => { });
    setInbox(prev => prev.filter(n => n.id !== id));
    setConfirmDeleteId(null);
  };
  const deleteAll = async () => {
    await axios.delete('/notifications').catch(() => { });
    setInbox([]);
    setConfirmDeleteAll(false);
  };

  const unreadCount = inbox.filter(n => n.status === 'UNREAD').length;
  const groupedOptions = ['Students', 'Trainers', 'Staff'];

  return (
    <div className="min-h-full bg-gray-50 p-6 space-y-6">
      <AnimatePresence>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        {confirmDeleteAll && <ConfirmDialog title="Clear All?" message="Permanently delete all notifications." onConfirm={deleteAll} onCancel={() => setConfirmDeleteAll(false)} />}
        {confirmDeleteId && <ConfirmDialog title="Delete Notification?" message="This cannot be undone." onConfirm={() => deleteOne(confirmDeleteId)} onCancel={() => setConfirmDeleteId(null)} />}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Bell className="w-6 h-6 text-blue-600" /> Notifications
          {unreadCount > 0 && <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-black rounded-full">{unreadCount}</span>}
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Institution · Broadcast Centre</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm w-fit">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all
              ${tab === i ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
            {t} {i === 1 && unreadCount > 0 && `(${unreadCount})`}
          </button>
        ))}
      </div>

      {/* ── Tab 0: Compose ── */}
      {tab === 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Form */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 text-lg mb-5 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" /> Compose Notification
            </h2>

            <form onSubmit={handleSend} className="space-y-5">
              {/* Target audience by group */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Target Audience</label>
                {groupedOptions.map(group => (
                  <div key={group} className="mb-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{group}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {TARGET_OPTIONS.filter(o => o.group === group).map(opt => {
                        const Icon = opt.icon;
                        const active = targetType === opt.value;
                        return (
                          <button key={opt.value} type="button" onClick={() => setTargetType(opt.value)}
                            className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all
                              ${active ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                            <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                            <span className="text-xs font-bold">{opt.label}</span>
                            {active && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-blue-500 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Title</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Upcoming Exam Reminder"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Message</label>
                <textarea required value={message} onChange={e => setMessage(e.target.value)} rows={5}
                  placeholder="Write your message here..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
                <p className="mt-1 text-xs text-gray-400 text-right">{message.length} chars</p>
              </div>

              <button type="submit" disabled={sending || !targetType || !title || !message}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                {sending ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</> : <><Send className="w-4 h-4" /> Send Notification</>}
              </button>
            </form>
          </div>

          {/* Right panel — batch or user picker */}
          <div className="lg:col-span-2 space-y-4">
            {needsBatch && (
              <RecipientPicker
                items={batches.map(b => ({ id: b.id, name: b.name, email: '', displayId: b.displayId || `Batch #${b.id}` }))}
                selected={selectedBatches}
                onToggle={id => setSelectedBatches(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                onSelectAll={() => setSelectedBatches(batches.map(b => b.id))}
                onClear={() => setSelectedBatches([])}
                search={batchSearch}
                onSearch={setBatchSearch}
                label="Select Batches"
              />
            )}
            {needsUsers && (
              <RecipientPicker
                items={users}
                selected={selectedUsers}
                onToggle={id => setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                onSelectAll={() => setSelectedUsers(users.map(u => u.id))}
                onClear={() => setSelectedUsers([])}
                search={userSearch}
                onSearch={setUserSearch}
                label={`Select ${selectedOption?.userRole === 'TRAINER' ? 'Trainers' : 'Students'}`}
              />
            )}
            {!needsBatch && !needsUsers && (
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white flex flex-col justify-center items-center text-center gap-4 min-h-[240px]">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Bell className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-bold text-lg">Broadcast to members</p>
                  <p className="text-blue-200 text-sm mt-1">
                    {targetType ? 'This will send to all matching members.' : 'Select a target audience on the left to get started.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Tab 1: Inbox ── */}
      {tab === 1 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 flex-wrap gap-3">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Inbox className="w-4 h-4 text-blue-600" /> Inbox
              {unreadCount > 0 && <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded-full">{unreadCount}</span>}
            </h2>
            <div className="flex items-center gap-2">
              {inbox.some(n => n.status === 'UNREAD') && (
                <button onClick={markAllRead}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-xl hover:text-blue-700 transition-colors">
                  <CheckCheck className="w-4 h-4" /> Mark all read
                </button>
              )}
              {inbox.length > 0 && (
                <button onClick={() => setConfirmDeleteAll(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-500 border border-red-200 bg-red-50 px-3 py-1.5 rounded-xl hover:text-red-600 transition-colors">
                  <Trash className="w-4 h-4" /> Clear all
                </button>
              )}
            </div>
          </div>

          {inboxLoading ? (
            <div className="py-16 text-center text-gray-400 text-sm font-bold">Loading…</div>
          ) : inbox.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
              <Inbox className="w-12 h-12 opacity-20" />
              <p className="font-bold text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {inbox.map(n => (
                <div key={n.id}
                  className={`flex items-start gap-4 px-6 py-4 transition-colors group
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
                      <button onClick={() => markRead(n.id)} className="text-xs text-blue-500 font-bold hover:text-blue-700 transition-colors">Read</button>
                    )}
                    <button onClick={() => setConfirmDeleteId(n.id)} className="text-red-400 hover:text-red-600 transition-colors">
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
