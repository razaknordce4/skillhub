import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Clock, Inbox, Trash2, Trash, AlertTriangle } from 'lucide-react';

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">Confirm Delete</p>
            <p className="text-xs text-gray-500 mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-red-100">
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function DashboardNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('unread');
  const [loading, setLoading] = useState(true);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/notifications');
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const markRead = async (id) => {
    await axios.put(`/notifications/${id}/read`).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'READ' } : n));
  };

  const markAllRead = async () => {
    await axios.put('/notifications/read-all').catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' })));
  };

  const deleteOne = async (id) => {
    await axios.delete(`/notifications/${id}`).catch(() => {});
    setNotifications(prev => prev.filter(n => n.id !== id));
    setConfirmDeleteId(null);
  };

  const deleteAll = async () => {
    await axios.delete('/notifications').catch(() => {});
    setNotifications([]);
    setConfirmDeleteAll(false);
  };

  const displayed = activeTab === 'unread'
    ? notifications.filter(n => n.status === 'UNREAD')
    : notifications;

  const unreadCount = notifications.filter(n => n.status === 'UNREAD').length;

  return (
    <div className="min-h-full bg-gray-50 p-6 space-y-6">
      <AnimatePresence>
        {confirmDeleteAll && (
          <ConfirmDialog
            message="This will permanently delete ALL your notifications."
            onConfirm={deleteAll}
            onCancel={() => setConfirmDeleteAll(false)}
          />
        )}
        {confirmDeleteId && (
          <ConfirmDialog
            message="Delete this notification permanently?"
            onConfirm={() => deleteOne(confirmDeleteId)}
            onCancel={() => setConfirmDeleteId(null)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" /> Notifications
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-black rounded-full">{unreadCount}</span>
            )}
          </h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
            {user?.role?.replace(/_/g, ' ')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 border border-blue-200 bg-blue-50 px-3 py-2 rounded-xl transition-colors">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={() => setConfirmDeleteAll(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded-xl transition-colors">
              <Trash className="w-4 h-4" /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm w-fit">
        {[['unread', 'Unread'], ['all', 'All']].map(([val, lbl]) => (
          <button key={val} onClick={() => setActiveTab(val)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all
              ${activeTab === val ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
            {lbl} {val === 'unread' && unreadCount > 0 && `(${unreadCount})`}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm font-bold">Loading…</div>
        ) : displayed.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <Inbox className="w-12 h-12 opacity-20" />
            <p className="font-bold text-sm">
              {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {displayed.map(n => (
              <div key={n.id}
                className={`flex items-start gap-4 px-6 py-4 transition-colors group
                  ${n.status === 'UNREAD' ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`}>
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0
                  ${n.status === 'UNREAD' ? 'bg-blue-500' : 'bg-gray-200'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <p className={`text-sm font-bold ${n.status === 'UNREAD' ? 'text-gray-900' : 'text-gray-600'}`}>
                      {n.title}
                    </p>
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
                      className="text-xs text-blue-500 font-bold hover:text-blue-700 transition-colors">
                      Read
                    </button>
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
      </div>
    </div>
  );
}
