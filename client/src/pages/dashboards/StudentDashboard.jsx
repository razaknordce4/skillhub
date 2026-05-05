import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  BookOpen, Trophy, Award, Flame, 
  MoreHorizontal, ChevronDown, ChevronLeft, ChevronRight,
  Edit3, Plus, CheckCircle, Clock
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  
  // Mock data for UI
  const [todos, setTodos] = useState([
    { id: 1, text: "Newton's third law of motion", subtext: "Physics | 08:00 AM", done: false },
    { id: 2, text: "Finishes the math", subtext: "", done: false },
    { id: 3, text: "Submit The Test", subtext: "", done: false },
    { id: 4, text: "Relation Between Kp And Kc", subtext: "", done: false }
  ]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await axios.get('/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const markAttendance = async (sessionId) => {
    try {
      await axios.post('/attendance/mark', { session_id: sessionId, status: 'PRESENT' });
      alert('Attendance marked successfully!');
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.message || 'Error marking attendance');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Hello, {user?.name.split(' ')[0] || 'Student'}!</h1>
        <p className="text-gray-500 mt-1">You have today <span className="font-semibold text-gray-700">{sessions.length} class(es)</span> & <span className="font-semibold text-gray-700">{todos.filter(t => !t.done).length} to-dos</span></p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Row 1: 4 Cards */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-32">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-gray-100 p-2 rounded-full"><BookOpen className="w-5 h-5 text-gray-600" /></div>
              <span className="font-medium text-gray-700">Enrolled Batches</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex justify-between items-end mt-4">
            <span className="text-3xl font-bold text-gray-900">{sessions.length > 0 ? 1 : 0}</span>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Active</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-32">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-green-50 p-2 rounded-full"><Trophy className="w-5 h-5 text-green-600" /></div>
              <span className="font-medium text-gray-700">Attendance</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex justify-between items-end mt-4">
            <span className="text-3xl font-bold text-gray-900">85%</span>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Good Standing</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-32">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-pink-50 p-2 rounded-full"><Award className="w-5 h-5 text-pink-500" /></div>
              <span className="font-medium text-gray-700">Assignments</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex justify-between items-end mt-4">
            <span className="text-3xl font-bold text-gray-900">1</span>
            <span className="text-xs font-medium text-gray-400">Graded</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-32">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="bg-orange-50 p-2 rounded-full"><Flame className="w-5 h-5 text-orange-500" /></div>
              <span className="font-medium text-gray-700">Days Active</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex justify-between items-end mt-4">
            <span className="text-3xl font-bold text-gray-900">5 <span className="text-xl font-medium text-gray-600">days</span></span>
            <span className="text-xs font-medium text-gray-400">Regular</span>
          </div>
        </div>

        {/* Row 2 */}
        {/* Hours Spent Bar Chart (Mock) */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h3 className="font-bold text-gray-900 text-lg">Hours Spent</h3>
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-700 mr-1"></div> Study</span>
                <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-gray-200 mr-1"></div> Exam</span>
              </div>
            </div>
            <button className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              Weekday <ChevronDown className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="h-48 flex items-end justify-between relative pt-4">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-xs text-gray-400 h-full py-2">
              <span>15 Hr</span>
              <span>10 Hr</span>
              <span>5 Hr</span>
              <span>0 Hr</span>
            </div>
            
            {/* Background grid lines */}
            <div className="absolute left-10 right-0 top-0 bottom-8 flex flex-col justify-between">
              <div className="border-b border-dashed border-gray-200 w-full"></div>
              <div className="border-b border-dashed border-gray-200 w-full"></div>
              <div className="border-b border-dashed border-gray-200 w-full"></div>
              <div className="border-b border-dashed border-gray-200 w-full"></div>
            </div>

            {/* Bars */}
            <div className="flex w-full justify-between items-end pl-12 pr-4 h-full pb-8 z-10">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                const heights = [40, 50, 45, 60, 45, 30, 45]; // mock heights %
                const examHeights = [0, 0, 0, 20, 0, 0, 0]; // mock exam heights %
                return (
                  <div key={day} className="flex flex-col items-center group relative cursor-pointer">
                    {/* Tooltip on hover */}
                    {day === 'Thu' && (
                       <div className="absolute -top-12 bg-white shadow-lg rounded-lg p-2 flex flex-col border border-gray-100 z-20">
                         <span className="text-xs font-bold text-emerald-800 flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-700 mr-1"></div> 5H</span>
                         <span className="text-xs text-gray-400 flex items-center mt-1"><div className="w-2 h-2 rounded-full bg-gray-200 mr-1"></div> 4H</span>
                       </div>
                    )}
                    <div className="w-8 md:w-10 flex flex-col justify-end h-40">
                      {examHeights[i] > 0 && <div className="w-full bg-gray-200 rounded-t-sm" style={{ height: `${examHeights[i]}%` }}></div>}
                      <div className="w-full bg-emerald-700 rounded-sm" style={{ height: `${heights[i]}%`, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.1) 5px, rgba(255,255,255,0.1) 10px)' }}></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-3">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Avg Performance Score */}
        <div className="col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-4">Avg performance score</h3>
            <div className="flex items-baseline space-x-3 mb-6 border-b border-dashed border-gray-200 pb-6">
              <span className="text-4xl font-bold text-gray-900">82%</span>
              <span className="text-sm font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-md">-10% 📉</span>
            </div>
          </div>
          
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Highest Score</span>
                <span className="font-bold text-gray-900">80%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                <div className="bg-yellow-400 h-4 rounded-full" style={{ width: '80%', backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 10px)' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Lowest Score</span>
                <span className="font-bold text-gray-900">59.23%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                <div className="bg-blue-300 h-4 rounded-full" style={{ width: '59.23%', backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 10px)' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className="col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="w-full flex justify-between items-start mb-2">
            <h3 className="font-bold text-gray-900 text-lg">Profile</h3>
            <button className="text-gray-400 hover:text-gray-600"><Edit3 className="w-4 h-4" /></button>
          </div>
          
          <div className="relative w-20 h-20 mb-3 mt-2">
            <svg className="w-full h-full absolute top-0 left-0" viewBox="0 0 100 100">
               <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="8" />
               <circle cx="50" cy="50" r="45" fill="none" stroke="#059669" strokeWidth="8" strokeDasharray="280" strokeDashoffset="100" className="transform -rotate-90 origin-center" />
            </svg>
            <div className="w-16 h-16 rounded-full bg-blue-100 absolute top-2 left-2 flex items-center justify-center overflow-hidden border-2 border-white">
               <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=random`} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
          
          <h4 className="font-bold text-gray-900 text-lg">{user?.name || 'Student Name'}</h4>
          <p className="text-xs text-gray-500 mb-6">SkillBridge Student</p>
          
          {/* Mini Calendar */}
          <div className="w-full bg-gray-50 rounded-xl p-3 border border-gray-100 mb-4">
            <div className="flex justify-between items-center mb-3">
              <button><ChevronLeft className="w-4 h-4 text-gray-400" /></button>
              <span className="text-sm font-medium text-gray-700">October 2024</span>
              <button><ChevronRight className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              <div className="text-gray-400 font-medium">T</div>
              <div className="text-gray-400 font-medium">W</div>
              <div className="text-gray-400 font-medium">T</div>
              <div className="text-gray-400 font-medium">F</div>
              <div className="text-gray-400 font-medium">S</div>
              <div className="text-gray-400 font-medium">S</div>
              <div className="text-gray-400 font-medium">M</div>
              
              <div className="text-gray-700 py-1">15</div>
              <div className="text-gray-700 py-1">16</div>
              <div className="bg-gray-900 text-white rounded-full py-1">17</div>
              <div className="text-gray-700 py-1">18</div>
              <div className="text-gray-700 py-1">19</div>
              <div className="text-gray-700 py-1">20</div>
              <div className="text-gray-700 py-1">21</div>
            </div>
          </div>
        </div>

        {/* Row 3 */}
        {/* Live Class (Sessions) */}
        <div className="col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 text-lg">Live class</h3>
            <span className="flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
              <Clock className="w-3 h-3 mr-1" /> 01pm - 02pm
            </span>
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center py-4">
            {sessions.length > 0 ? (
               <div className="w-full space-y-4">
                 {sessions.slice(0,1).map(session => (
                    <div key={session.id} className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-blue-500 font-bold mb-1">{session.batch.name}</p>
                        <h4 className="font-medium text-gray-900">{session.title}</h4>
                      </div>
                      <button onClick={() => markAttendance(session.id)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm hover:bg-blue-700 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" /> Mark
                      </button>
                    </div>
                 ))}
               </div>
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 w-full">
                <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No live classes today</p>
              </div>
            )}
          </div>
          <div className="mt-auto">
             <p className="text-xs text-gray-500"><span className="font-semibold text-gray-700">Class:</span> Higher Math part -2 solution</p>
          </div>
        </div>

        {/* Exam Schedule */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 text-lg">Exam schedule</h3>
            <div className="flex items-center text-sm font-medium text-gray-600">
              <ChevronLeft className="w-4 h-4 mr-1 text-gray-400" /> March, 2025 <ChevronRight className="w-4 h-4 ml-1 text-gray-400" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-sm mt-4">
              <div className="text-gray-400 font-medium mb-2">Mon</div>
              <div className="text-gray-400 font-medium mb-2">Tue</div>
              <div className="text-gray-400 font-medium mb-2">Wed</div>
              <div className="text-gray-400 font-medium mb-2">Thu</div>
              <div className="text-gray-400 font-medium mb-2">Fri</div>
              <div className="text-gray-400 font-medium mb-2">Sat</div>
              <div className="text-gray-400 font-medium mb-2">Sun</div>
              
              <div className="text-gray-300 py-2">27</div>
              <div className="text-gray-300 py-2">28</div>
              <div className="py-2 relative">
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-48 bg-white border border-gray-100 shadow-xl rounded-xl p-3 z-20 text-left text-xs hidden lg:block">
                   <p className="font-bold text-gray-900">General English 2</p>
                   <p className="text-gray-400 flex items-center mt-1"><BookOpen className="w-3 h-3 mr-1" /> Mohmmodpur collage</p>
                   <p className="text-gray-400 flex items-center mt-1"><Clock className="w-3 h-3 mr-1" /> 11:00 - 2:00</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-blue-500 absolute top-0 right-2"></div>
                <span className="text-gray-700 font-medium">1</span>
              </div>
              <div className="text-gray-700 py-2">2</div>
              <div className="text-gray-700 py-2">3</div>
              <div className="text-gray-700 py-2">4</div>
              <div className="text-gray-700 py-2">5</div>
              
              <div className="text-gray-700 py-2">6</div>
              <div className="text-gray-700 py-2">7</div>
              <div className="text-gray-700 py-2 font-medium bg-blue-50 text-blue-600 rounded-lg">8</div>
              <div className="text-gray-700 py-2">9</div>
              <div className="text-gray-700 py-2">10</div>
              <div className="text-gray-700 py-2">11</div>
              <div className="text-gray-700 py-2">12</div>
              
              <div className="text-gray-700 py-2">13</div>
              <div className="text-gray-700 py-2">14</div>
              <div className="text-white py-2 font-bold bg-gray-900 rounded-lg shadow-sm">15</div>
              <div className="text-gray-700 py-2">16</div>
              <div className="text-gray-700 py-2">17</div>
              <div className="text-gray-700 py-2">18</div>
              <div className="text-gray-700 py-2">19</div>
          </div>
        </div>

        {/* Todo List & Mode */}
        <div className="col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-gray-900 text-lg">Todo list</h3>
             <button className="flex items-center text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 px-2 py-1.5 rounded-lg hover:bg-gray-100">
               <Plus className="w-3 h-3 mr-1" /> Add Todo
             </button>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {todos.map(todo => (
              <div key={todo.id} className="flex items-start cursor-pointer group" onClick={() => toggleTodo(todo.id)}>
                <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${todo.done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 group-hover:border-emerald-400'}`}>
                   {todo.done && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${todo.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{todo.text}</p>
                  {todo.subtext && <p className={`text-xs mt-0.5 ${todo.done ? 'text-gray-300' : 'text-gray-400'}`}>{todo.subtext}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
