import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../../../components/ui/DataTable';
import { Plus, BookOpen, Users, Calendar, X, Activity } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import Toast from '../../../components/ui/Toast';
import { motion } from 'framer-motion';

export default function InstitutionBatches() {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [toast, setToast] = useState(null);
  
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [availableTrainers, setAvailableTrainers] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedTrainers, setSelectedTrainers] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
    fetchBatches();
    fetchUsers();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/batches');
      setBatches(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const [tRes, sRes] = await Promise.all([
        axios.get('/users?role=TRAINER'),
        axios.get('/users?role=STUDENT')
      ]);
      setAvailableTrainers(tRes.data);
      setAvailableStudents(sRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/batches', { 
        name: batchName, 
        institution_id: user.id 
      });
      setToast({ type: 'success', message: 'Batch created successfully' });
      setShowAddModal(false);
      setBatchName('');
      fetchBatches();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Error creating batch' });
    }
  };

  const handleBulkTrainers = async () => {
    try {
      await axios.post(`/batches/${selectedBatch.id}/trainers/bulk`, { trainer_ids: selectedTrainers });
      setToast({ type: 'success', message: 'Trainers assigned successfully' });
      setShowTrainerModal(false);
      setSelectedTrainers([]);
      fetchBatches();
    } catch (err) {
      setToast({ type: 'error', message: 'Error assigning trainers' });
    }
  };

  const handleBulkStudents = async () => {
    try {
      await axios.post(`/batches/${selectedBatch.id}/students/bulk`, { student_ids: selectedStudents });
      setToast({ type: 'success', message: 'Students assigned successfully' });
      setShowStudentModal(false);
      setSelectedStudents([]);
      fetchBatches();
    } catch (err) {
      setToast({ type: 'error', message: 'Error assigning students' });
    }
  };

  const toggleSelection = (id, type) => {
    if (type === 'trainer') {
      setSelectedTrainers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else {
      setSelectedStudents(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }
  };

  const columns = [
    { 
      header: 'Batch Name', 
      accessor: 'name', 
      render: (row) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
            <BookOpen size={16} />
          </div>
          <span className="font-bold text-gray-800">{row.name}</span>
        </div>
      ) 
    },
    { 
      header: 'Batch ID', 
      accessor: 'displayId', 
      render: (row) => <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{row.displayId}</span> 
    },
    { 
      header: 'Trainers', 
      accessor: 'trainers', 
      render: (row) => (
        <div className="flex items-center space-x-2">
          <div className="flex -space-x-2">
            {row.trainers?.slice(0, 3).map((t, i) => (
              <div 
                key={i} 
                className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white shadow-sm`}
                style={{ backgroundColor: `hsl(${(t.trainer?.id * 137) % 360}, 60%, 50%)` }}
                title={t.trainer?.name || 'Unknown Trainer'}
              >
                {t.trainer?.name?.charAt(0) || '?'}
              </div>
            ))}
            {row.trainers?.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-500">
                +{row.trainers.length - 3}
              </div>
            )}
            {(!row.trainers || row.trainers.length === 0) && <span className="text-xs text-gray-400 italic">None</span>}
          </div>
          <button 
            onClick={() => { setSelectedBatch(row); setShowTrainerModal(true); }}
            className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors"
            title="Add Multiple Trainers"
          >
            <Plus size={14} className="border border-blue-200 rounded-sm" />
          </button>
        </div>
      )
    },
    { 
      header: 'Students', 
      accessor: 'students', 
      render: (row) => (
        <div className="flex items-center space-x-2">
          <div className="flex items-center text-xs font-bold text-gray-600">
            <Users size={14} className="mr-1 text-gray-400" />
            {row._count?.students || 0} Students
          </div>
          <button 
            onClick={() => { setSelectedBatch(row); setShowStudentModal(true); }}
            className="p-1 hover:bg-emerald-50 text-emerald-600 rounded transition-colors"
            title="Add Multiple Students"
          >
            <Plus size={14} className="border border-emerald-200 rounded-sm" />
          </button>
        </div>
      )
    },
    { 
      header: 'Created Date', 
      accessor: 'created_at', 
      render: (row) => (
        <div className="flex items-center text-xs text-gray-500">
          <Calendar size={14} className="mr-1 opacity-50" />
          {new Date(row.created_at).toLocaleDateString()}
        </div>
      )
    }
  ];

  return (
    <div className="h-full p-6 space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-gray-900">Batch Management</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Institutional Tracks</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-shadow shadow-md shadow-blue-100"
        >
          <Plus size={16} />
          <span>New Batch</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <DataTable 
          columns={columns}
          data={batches}
          loading={loading}
          filters={[{ label: 'Search', type: 'text' }]}
        />
      </div>

      {/* Add Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-gray-800 text-lg">Create New Batch</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateBatch} className="p-6 space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center mb-2">
                <Activity size={20} className="text-emerald-600 mr-3" />
                <p className="text-xs font-bold text-emerald-800 tracking-tight">Create a new student cohort for your institution.</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Batch Name</label>
                <input 
                  type="text" 
                  required 
                  value={batchName} 
                  onChange={e => setBatchName(e.target.value)} 
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                  placeholder="e.g. React Development - 2024 Fall"
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 mt-2">Create Batch</button>
            </form>
          </div>
        </div>
      )}

      {/* Multi-Trainer Modal */}
      {showTrainerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-gray-800">Assign Multiple Trainers</h3>
              <button onClick={() => setShowTrainerModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
               <div className="max-h-60 overflow-y-auto space-y-2">
                 {availableTrainers.map(t => (
                   <div 
                    key={t.id} 
                    onClick={() => toggleSelection(t.id, 'trainer')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${selectedTrainers.includes(t.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                   >
                     <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3">{t.name.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{t.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{t.displayId}</p>
                        </div>
                     </div>
                     {selectedTrainers.includes(t.id) && <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white"><Plus size={12} className="rotate-45" /></div>}
                   </div>
                 ))}
               </div>
               <button 
                onClick={handleBulkTrainers}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50"
                disabled={selectedTrainers.length === 0}
               >
                 Assign {selectedTrainers.length} Trainers
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-gray-800">Assign Multiple Students</h3>
              <button onClick={() => setShowStudentModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
               <div className="max-h-60 overflow-y-auto space-y-2">
                 {availableStudents.map(s => (
                   <div 
                    key={s.id} 
                    onClick={() => toggleSelection(s.id, 'student')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${selectedStudents.includes(s.id) ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-gray-200'}`}
                   >
                     <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mr-3">{s.name.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{s.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{s.displayId}</p>
                        </div>
                     </div>
                     {selectedStudents.includes(s.id) && <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white"><Plus size={12} className="rotate-45" /></div>}
                   </div>
                 ))}
               </div>
               <button 
                onClick={handleBulkStudents}
                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-50"
                disabled={selectedStudents.length === 0}
               >
                 Assign {selectedStudents.length} Students
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
