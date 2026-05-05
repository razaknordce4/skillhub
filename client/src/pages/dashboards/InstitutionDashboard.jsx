import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronRight, Filter, Download, Plus, Users, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function InstitutionDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [trainerName, setTrainerName] = useState('');
  const [trainerEmail, setTrainerEmail] = useState('');
  const [trainerPassword, setTrainerPassword] = useState('');
  
  const [batchName, setBatchName] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const instId = user.role === 'INSTITUTION' ? user.id : user.institution_id;
      if (!instId) return;

      const [tRes, bRes, sRes, stdRes] = await Promise.all([
        axios.get('/users?role=TRAINER'),
        axios.get('/batches'),
        axios.get(`/institutions/${instId}/summary`),
        axios.get('/users?role=STUDENT')
      ]);
      setTrainers(tRes.data);
      setBatches(bRes.data);
      setSummary(sRes.data);
      setStudents(stdRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTrainer = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/users', { name: trainerName, email: trainerEmail, password: trainerPassword, role: 'TRAINER' });
      fetchData();
      setTrainerName(''); setTrainerEmail(''); setTrainerPassword('');
      alert('Trainer registered successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Error registering trainer');
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    const instId = user.role === 'INSTITUTION' ? user.id : user.institution_id;
    try {
      await axios.post('/batches', { name: batchName, institution_id: instId });
      fetchData();
      setBatchName('');
      alert('Batch created successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating batch');
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      
      {/* Analytics Dashboard (Based on Image) */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-6 text-gray-800 font-sans">
        
        {/* Breadcrumbs & Header */}
        <div className="flex items-center text-sm text-blue-600 font-medium mb-4">
          <span>Analytics</span>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          <span className="text-gray-800">Student Performance</span>
        </div>
        
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <h1 className="text-xl font-bold flex items-center">Student Performance Dashboard <span className="ml-2 text-gray-400 cursor-pointer">ⓘ</span></h1>
          <div className="flex space-x-2">
            <button className="text-gray-500 hover:text-gray-700 p-1 border border-transparent hover:border-gray-200 rounded"><Filter className="w-4 h-4"/></button>
            <button className="text-gray-500 hover:text-gray-700 p-1 border border-transparent hover:border-gray-200 rounded"><Download className="w-4 h-4"/></button>
          </div>
        </div>

        {/* Top Filters & Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="col-span-1 border border-gray-200 rounded p-3">
             <label className="block text-xs text-gray-500 mb-1">Select Year</label>
             <select className="w-full bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 text-sm pb-1">
               <option>All</option>
               <option>2023</option>
               <option>2024</option>
             </select>
          </div>
          <div className="col-span-1 border border-gray-200 rounded p-3">
             <label className="block text-xs text-gray-500 mb-1">Select Grade</label>
             <select className="w-full bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 text-sm pb-1">
               <option>All</option>
               <option>Grade 10</option>
               <option>Grade 11</option>
             </select>
          </div>
          <div className="col-span-1 border border-gray-200 rounded p-4 flex flex-col justify-center">
             <div className="text-2xl font-bold text-gray-800">{summary?.total_batches || 0}</div>
             <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider flex items-center">Total Batches <span className="ml-1 text-gray-400">ⓘ</span></div>
          </div>
          <div className="col-span-1 border border-gray-200 rounded p-4 flex flex-col justify-center">
             <div className="text-2xl font-bold text-gray-800">{summary?.total_sessions || 0}</div>
             <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider flex items-center">Total Sessions <span className="ml-1 text-gray-400">ⓘ</span></div>
          </div>
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Pie Chart */}
          <div className="col-span-1 border border-gray-200 rounded p-4 relative">
             <h3 className="text-sm font-bold text-gray-800 mb-6 flex items-center">Students count by Grade and Gender <span className="ml-1 text-gray-400">ⓘ</span></h3>
             <div className="flex justify-center items-center h-48 relative">
                {/* Mock Pie SVG */}
                <svg viewBox="0 0 100 100" className="w-40 h-40">
                  {/* Purple */}
                  <path d="M50 50 L50 0 A50 50 0 0 1 100 50 Z" fill="#8b5cf6" />
                  {/* Blue */}
                  <path d="M50 50 L100 50 A50 50 0 0 1 75 93 Z" fill="#3b82f6" />
                  {/* Green */}
                  <path d="M50 50 L75 93 A50 50 0 0 1 25 93 Z" fill="#10b981" />
                  {/* Orange */}
                  <path d="M50 50 L25 93 A50 50 0 0 1 0 50 Z" fill="#f97316" />
                  {/* Yellow */}
                  <path d="M50 50 L0 50 A50 50 0 0 1 50 0 Z" fill="#eab308" />
                  {/* Inner White Circle for donut effect, though image looks like pie with a small hole */}
                  <circle cx="50" cy="50" r="15" fill="white" />
                </svg>
                {/* Labels floating */}
                <span className="absolute top-10 right-4 text-[10px] text-gray-500">227 students</span>
                <span className="absolute bottom-10 right-4 text-[10px] text-gray-500">456 students</span>
                <span className="absolute bottom-4 left-10 text-[10px] text-gray-500">284 students</span>
                <span className="absolute top-1/2 left-4 text-[10px] text-gray-500">187 students</span>
             </div>
             
             {/* Legend */}
             <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2">
                <div className="flex items-center text-[10px] text-gray-600"><div className="w-2 h-2 rounded-full bg-[#8b5cf6] mr-2"></div>Grade 1</div>
                <div className="flex items-center text-[10px] text-gray-600"><div className="w-2 h-2 rounded-full bg-[#3b82f6] mr-2"></div>Grade 2</div>
                <div className="flex items-center text-[10px] text-gray-600"><div className="w-2 h-2 rounded-full bg-[#10b981] mr-2"></div>Grade 3</div>
                <div className="flex items-center text-[10px] text-gray-600"><div className="w-2 h-2 rounded-full bg-[#f97316] mr-2"></div>Grade 4</div>
                <div className="flex items-center text-[10px] text-gray-600"><div className="w-2 h-2 rounded-full bg-[#eab308] mr-2"></div>Grade 5</div>
             </div>
          </div>

          {/* Bar Chart */}
          <div className="col-span-1 border border-gray-200 rounded p-4">
             <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center">Examination Results by Branch <span className="ml-1 text-gray-400">ⓘ</span></h3>
             
             {/* Legend top center */}
             <div className="flex justify-center space-x-4 mb-4 text-[10px] text-gray-500">
               <span className="flex items-center"><div className="w-2 h-2 bg-[#8b5cf6] mr-1"></div> Pass</span>
               <span className="flex items-center"><div className="w-2 h-2 bg-[#3b82f6] mr-1"></div> Fail</span>
               <span className="flex items-center"><div className="w-2 h-2 bg-[#2dd4bf] mr-1"></div> Not Attended</span>
             </div>

             <div className="h-40 flex items-end justify-between px-4 relative">
                {/* Y Axis Mock */}
                <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-gray-400">
                  <span>2K</span><span>1.5K</span><span>1K</span><span>500</span><span>0</span>
                </div>
                {/* Background lines */}
                <div className="absolute left-6 right-2 top-2 bottom-6 flex flex-col justify-between z-0">
                  <div className="border-b border-gray-100 w-full h-0"></div>
                  <div className="border-b border-gray-100 w-full h-0"></div>
                  <div className="border-b border-gray-100 w-full h-0"></div>
                  <div className="border-b border-gray-100 w-full h-0"></div>
                  <div className="border-b border-gray-200 w-full h-0"></div>
                </div>

                {/* Bars */}
                {['Arts', 'English', 'Maths', 'Phys. Ed', 'Science'].map(subject => (
                  <div key={subject} className="flex flex-col items-center z-10 w-full relative group">
                    <div className="flex items-end space-x-0.5 h-32 w-full justify-center">
                      <div className="w-2.5 bg-[#8b5cf6]" style={{height: `${Math.random() * 60 + 30}%`}}></div>
                      <div className="w-2.5 bg-[#3b82f6]" style={{height: `${Math.random() * 40 + 10}%`}}></div>
                      <div className="w-2.5 bg-[#2dd4bf]" style={{height: `${Math.random() * 20 + 5}%`}}></div>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-2">{subject}</span>
                  </div>
                ))}
             </div>
          </div>

          {/* Average Subject Score (Donuts) - Spans 2 rows down */}
          <div className="col-span-1 lg:row-span-2 border border-gray-200 rounded p-4 flex flex-col items-center">
            <h3 className="text-sm font-bold text-gray-800 w-full text-left flex items-center mb-6">Average Subject Score <span className="ml-1 text-gray-400">ⓘ</span></h3>
            
            <div className="space-y-8 flex-1 flex flex-col justify-center">
              {/* Arts */}
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-600 mb-2 font-medium">Arts</span>
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-135">
                    <path className="text-gray-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                    <path className="text-[#8b5cf6]" strokeDasharray="54.07, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-sm font-bold text-gray-800">54.07</span>
                  </div>
                  <span className="absolute -bottom-4 left-0 text-[10px] text-gray-400">0</span>
                  <span className="absolute -bottom-4 right-0 text-[10px] text-gray-400">100</span>
                </div>
              </div>

              {/* Maths */}
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-600 mb-2 font-medium">Maths</span>
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-135">
                    <path className="text-gray-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                    <path className="text-[#3b82f6]" strokeDasharray="60.80, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-sm font-bold text-gray-800">60.80</span>
                  </div>
                  <span className="absolute -bottom-4 left-0 text-[10px] text-gray-400">0</span>
                  <span className="absolute -bottom-4 right-0 text-[10px] text-gray-400">100</span>
                </div>
              </div>

              {/* Science */}
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-600 mb-2 font-medium">Science</span>
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-135">
                    <path className="text-gray-200" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                    <path className="text-[#10b981]" strokeDasharray="68.07, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-sm font-bold text-gray-800">68.07</span>
                  </div>
                  <span className="absolute -bottom-4 left-0 text-[10px] text-gray-400">0</span>
                  <span className="absolute -bottom-4 right-0 text-[10px] text-gray-400">100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Students Details Table - Spans 2 cols */}
          <div className="col-span-1 lg:col-span-2 border border-gray-200 rounded p-4 flex flex-col">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center">Students Details <span className="ml-1 text-gray-400">ⓘ</span></h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-[#6366f1] text-white">
                  <tr>
                    <th className="px-4 py-3 font-medium">Student Name</th>
                    <th className="px-4 py-3 font-medium">Gender</th>
                    <th className="px-4 py-3 font-medium">Grade Name</th>
                    <th className="px-4 py-3 font-medium text-right">Average Marks</th>
                    <th className="px-4 py-3 font-medium text-right">GPA</th>
                    <th className="px-4 py-3 font-medium text-right">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {students.map(student => (
                    <tr key={student.id}>
                      <td className="px-4 py-3 text-blue-500 cursor-pointer hover:underline">{student.name} {student.displayId && `(${student.displayId})`}</td>
                      <td className="px-4 py-3 flex items-center"><span className="text-gray-400 mr-2">👤</span> {student.email}</td>
                      <td className="px-4 py-3">Grade 11</td>
                      <td className="px-4 py-3 text-right">85.00</td>
                      <td className="px-4 py-3 text-right">3.5</td>
                      <td className="px-4 py-3 text-right">92%</td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">No students found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Institutional Management (Functional Tools) */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-6 text-gray-800 font-sans mt-6">
         <h2 className="text-xl font-bold mb-6 border-b border-gray-100 pb-2">Institutional Management</h2>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           
           {/* Create Trainer Form */}
           <div>
              <h3 className="text-md font-bold mb-4 flex items-center"><Users className="w-4 h-4 mr-2 text-blue-500"/> Register New Trainer</h3>
              <form onSubmit={handleCreateTrainer} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 uppercase mb-1">Name</label>
                  <input type="text" required value={trainerName} onChange={e => setTrainerName(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="Trainer Name"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 uppercase mb-1">Email</label>
                  <input type="email" required value={trainerEmail} onChange={e => setTrainerEmail(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="trainer@institute.com"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 uppercase mb-1">Password</label>
                  <input type="password" required value={trainerPassword} onChange={e => setTrainerPassword(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="••••••••"/>
                </div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center w-full">
                  <Plus className="w-4 h-4 mr-2" /> Register Trainer
                </button>
              </form>
           </div>

           {/* Create Batch Form */}
           <div>
              <h3 className="text-md font-bold mb-4 flex items-center"><BookOpen className="w-4 h-4 mr-2 text-blue-500"/> Create New Batch</h3>
              <form onSubmit={handleCreateBatch} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 uppercase mb-1">Batch Name</label>
                  <input type="text" required value={batchName} onChange={e => setBatchName(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="e.g. Fall Semester 2024 - IT"/>
                </div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center w-full mt-4">
                  <Plus className="w-4 h-4 mr-2" /> Create Batch
                </button>
              </form>

              <div className="mt-8">
                 <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">Active Batches ({batches.length})</h3>
                 <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
                   {batches.length === 0 ? (
                     <p className="text-xs text-gray-500 text-center py-2">No batches created yet.</p>
                   ) : (
                     <ul className="space-y-1">
                       {batches.map(b => (
                         <li key={b.id} className="text-sm px-2 py-1 bg-white border border-gray-100 rounded text-gray-700">{b.name} <span className="text-xs text-gray-400">({b.displayId})</span></li>
                       ))}
                     </ul>
                   )}
                 </div>
              </div>
           </div>

         </div>
      </div>
    </div>
  );
}
