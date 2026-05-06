import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Trophy, Award, Flame, Calendar, Users, Clock,
  MoreHorizontal, ChevronDown, ChevronLeft, ChevronRight,
  Edit3, Plus, CheckCircle, User, TrendingUp, Activity,
  ExternalLink, Lock, Video
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [todos, setTodos] = useState([]);
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [newTodo, setNewTodo] = useState({ title: '', description: '', due_date: '', auto_delete: false });
  const [goal, setGoal] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [joiningId, setJoiningId] = useState(null);

  // --- Session status helpers ---
  const parseTimeMins = (t) => {
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

  const getStatus = (session) => {
    const now = new Date();
    const sDate = new Date(session.date);
    const sameDay = sDate.toDateString() === now.toDateString();
    if (!sameDay) return sDate > now ? 'upcoming' : 'completed';
    const nowM = now.getHours() * 60 + now.getMinutes();
    const start = parseTimeMins(session.start_time);
    const end = parseTimeMins(session.end_time);
    if (nowM < start) return 'upcoming';
    if (nowM > end) return 'completed';
    return 'ongoing';
  };

  const isLinkActive = (session) => {
    const now = new Date();
    const sDate = new Date(session.date);
    if (sDate.toDateString() !== now.toDateString()) return false;
    const nowM = now.getHours() * 60 + now.getMinutes();
    const start = parseTimeMins(session.start_time);
    const end = parseTimeMins(session.end_time);
    return nowM >= start - 10 && nowM <= end;
  };
  // --- End helpers ---

  useEffect(() => {
    fetchAttendanceStats();
    fetchSessions();
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await axios.get('/api/todos');
      setTodos(res.data);
    } catch (err) {
      console.error('Error fetching todos:', err);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const res = await axios.get('/api/student/attendance-stats');
      setAttendanceStats(res.data);
    } catch (err) {
      console.error('Error fetching attendance stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await axios.get('/api/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  };

  // Join session — records join, opens meeting link, attendance auto-marked when session ends
  const handleJoin = async (session) => {
    setJoiningId(session.id);
    try {
      const res = await axios.post(`/sessions/${session.id}/join`);
      window.open(res.data.meeting_link, '_blank', 'noopener');
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not join session');
    }
    setJoiningId(null);
  };

  const toggleTodo = async (id) => {
    try {
      const todo = todos.find(t => t.id === id);
      const res = await axios.put(`/api/todos/${id}`, {
        ...todo,
        completed: !todo.completed
      });

      setTodos(todos.map(t =>
        t.id === id ? res.data : t
      ));
    } catch (err) {
      console.error('Error toggling todo:', err);
    }
  };

  const addTodo = async () => {
    try {
      const res = await axios.post('/api/todos', newTodo);
      setTodos([res.data, ...todos]);
      setNewTodo({ title: '', description: '', due_date: '', auto_delete: false });
      setShowAddTodo(false);
    } catch (err) {
      console.error('Error adding todo:', err);
    }
  };

  const saveGoal = async () => {
    if (!goal) return;
    try {
      const res = await axios.post('/api/todos', {
        title: `  Goal: ${goal}`,
        description: 'Personal learning goal set from dashboard',
        due_date: goalDate,
        auto_delete: false
      });
      setTodos([res.data, ...todos]);
      setGoal('');
      setGoalDate('');
    } catch (err) {
      console.error('Error saving goal:', err);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`/api/todos/${id}`);
      setTodos(todos.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error deleting todo:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Hello, {user?.name.split(' ')[0] || 'Student'}!</h1>
        <p className="text-gray-500 mt-1">You have today <span className="font-semibold text-gray-700">{sessions.length} class(es)</span> & <span className="font-semibold text-gray-700">{todos.filter(t => !t.completed).length} pending to-do(s)</span></p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-50 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
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
              <div className="bg-green-50 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Attended Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{attendanceStats?.attended_sessions || 0}</p>
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
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-gray-900">{attendanceStats?.attendance_rate || 0}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-50 p-3 rounded-full">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Days</p>
                <p className="text-2xl font-bold text-gray-900">{attendanceStats?.attended_sessions || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900 text-lg">Recent Sessions</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All
            </button>
          </div>

          <div className="space-y-4">
            {attendanceStats?.recent_sessions?.length > 0 ? (
              attendanceStats.recent_sessions.map((session) => {
                const status = getStatus(session);
                return (
                  <div key={session.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-50 p-2 rounded-full">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-500 font-bold mb-1">{session.batch_name}</p>
                        <h4 className="font-medium text-gray-900">{session.title}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(session.date).toLocaleDateString()} at {session.start_time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {session.attended ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Attended
                        </span>
                      ) : status === 'upcoming' ? (
                        <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">
                          Upcoming
                        </span>
                      ) : status === 'completed' ? (
                        <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Ended
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No sessions available</p>
              </div>
            )}
          </div>
        </div>

        {/* Set a Goal */}
        <div className="col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-4">Set a Goal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Goal</label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g., Complete Python course"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Date</label>
                <input
                  type="date"
                  value={goalDate}
                  onChange={(e) => setGoalDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <button
                onClick={saveGoal}
                disabled={!goal}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Goal
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Current Progress</span>
              <span className="font-bold text-blue-600">0%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: '0%' }}></div>
            </div>
          </div>
        </div>

        {/* Row 3 */}
        {/* Attendance Overview */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg mb-6">Attendance Overview</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Attendance Rate</span>
              <span className="text-sm font-bold text-gray-900">{attendanceStats?.attendance_rate || 0}%</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${attendanceStats?.attendance_rate || 0}%` }}
              ></div>
            </div>

            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Present</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{attendanceStats?.attended_sessions || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Absent</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {(attendanceStats?.total_sessions || 0) - (attendanceStats?.attended_sessions || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 text-lg">Today's Classes</h3>
          </div>

          <div className="flex-1 flex flex-col gap-3">
            {sessions.filter(s => {
              const d = new Date(s.date);
              return d.toDateString() === new Date().toDateString();
            }).length > 0 ? (
              sessions
                .filter(s => new Date(s.date).toDateString() === new Date().toDateString())
                .map(session => {
                  const status = getStatus(session);
                  const canJoin = session.meeting_link && isLinkActive(session) && !session.myJoin;
                  return (
                    <div key={session.id} className={`p-4 rounded-xl border flex justify-between items-center
                      ${status === 'ongoing' ? 'bg-emerald-50 border-emerald-100' : status === 'completed' ? 'bg-gray-50 border-gray-100' : 'bg-blue-50 border-blue-100'}`}>
                      <div>
                        <p className="text-xs font-bold mb-1
                          ${status === 'ongoing' ? 'text-emerald-500' : status === 'completed' ? 'text-gray-400' : 'text-blue-500'}">
                          {session.batch?.name}
                        </p>
                        <h4 className="font-medium text-gray-900 text-sm">{session.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{session.start_time} – {session.end_time}</p>
                      </div>
                      <div>
                        {status === 'completed' ? (
                          <span className="flex items-center gap-1 text-xs text-gray-400 font-semibold bg-white px-2 py-1 rounded-lg border border-gray-200">
                            <Lock className="w-3 h-3" /> Ended
                          </span>
                        ) : status === 'upcoming' ? (
                          <span className="flex items-center gap-1 text-xs text-sky-600 font-semibold bg-white px-2 py-1 rounded-lg border border-sky-100">
                            <Clock className="w-3 h-3" /> Upcoming
                          </span>
                        ) : canJoin ? (
                          <button
                            onClick={() => handleJoin(session)}
                            disabled={joiningId === session.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-200 disabled:opacity-60"
                          >
                            {joiningId === session.id
                              ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              : <ExternalLink className="w-3 h-3" />}
                            Click to Join
                          </button>
                        ) : session.myJoin ? (
                          <span className="flex items-center gap-1 text-xs text-blue-600 font-semibold bg-white px-2 py-1 rounded-lg border border-blue-100">
                            <CheckCircle className="w-3 h-3" /> Joined
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-white px-2 py-1 rounded-lg border border-emerald-100 animate-pulse">
                            <Video className="w-3 h-3" /> Live
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 w-full">
                <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No classes today</p>
              </div>
            )}
          </div>
        </div>

        {/* Todo List */}
        <div className="col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900 text-lg">Todo list</h3>
            <button
              onClick={() => setShowAddTodo(true)}
              className="flex items-center text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 px-2 py-1.5 rounded-lg hover:bg-gray-100"
            >
              <Plus className="w-3 h-3 mr-1" /> Add Todo
            </button>
          </div>

          {showAddTodo && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Todo title"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newTodo.description}
                  onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="2"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="datetime-local"
                    value={newTodo.due_date}
                    onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="flex items-center text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={newTodo.auto_delete}
                      onChange={(e) => setNewTodo({ ...newTodo, auto_delete: e.target.checked })}
                      className="mr-2"
                    />
                    Auto-delete
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addTodo}
                    disabled={!newTodo.title}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddTodo(false);
                      setNewTodo({ title: '', description: '', due_date: '', auto_delete: false });
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 flex-1 overflow-y-auto pr-2">
            {todos.map(todo => (
              <div key={todo.id} className="flex items-start group p-2 rounded-lg hover:bg-gray-50">
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${todo.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 group-hover:border-emerald-400'}`}
                >
                  {todo.completed && <CheckCircle className="w-3 h-3 text-white" />}
                </button>
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-medium ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{todo.title}</p>
                  {todo.description && <p className={`text-xs mt-1 ${todo.completed ? 'text-gray-300' : 'text-gray-400'}`}>{todo.description}</p>}
                  {todo.due_date && (
                    <p className="text-xs text-amber-600 mt-1">
                      Due: {new Date(todo.due_date).toLocaleString()}
                    </p>
                  )}
                  {todo.auto_delete && (
                    <p className="text-xs text-red-600 mt-1">Auto-delete enabled</p>
                  )}
                </div>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {todos.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No todos yet. Add your first todo!</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
