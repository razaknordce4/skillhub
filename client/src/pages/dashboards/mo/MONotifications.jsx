import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Send, Building2, CheckCheck, Clock,
  AlertCircle, CheckCircle2, Inbox,
  Trash2, Trash, AlertTriangle
} from 'lucide-react';

const TABS = ['Send Notification', 'Inbox'];

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

export default function MONotifications() {
  const [tab, setTab] = useState(0);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  // Inbox state
  const [inbox, setInbox] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await axios.post('/notifications/mo/bulk', {
        title,
        message,
        target_type: 'MY_INSTITUTION'
      });
      showToast(`  Sent to your institution!`);
      setTitle(''); setMessage('');
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
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Monitoring Officer · Broadcast Centre</p>
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
          className="max-w-3xl bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 text-lg mb-5 flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-600" /> Notify Institution
          </h2>

          <form onSubmit={handleSend} className="space-y-5">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-800">Target: Assigned Institution</p>
                <p className="text-[10px] text-blue-600 font-medium">Your message will be sent directly to the institution management.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Title</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Audit Report Available"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Message</label>
              <textarea required value={message} onChange={e => setMessage(e.target.value)} rows={6}
                placeholder="Write your message here..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
              <p className="mt-1 text-xs text-gray-400 text-right">{message.length} chars</p>
            </div>

            <button type="submit" disabled={sending || !title || !message}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
              {sending ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</> : <><Send className="w-4 h-4" /> Send Notification</>}
            </button>
          </form>
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
