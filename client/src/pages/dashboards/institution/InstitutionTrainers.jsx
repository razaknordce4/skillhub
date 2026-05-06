import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../../../components/ui/DataTable';
import { useAuth } from '../../../context/AuthContext';
import { Plus, UserPlus, Search, X, Pencil } from 'lucide-react';
import Toast from '../../../components/ui/Toast';

export default function InstitutionTrainers() {
  const { user } = useAuth();
  const [trainers, setTrainers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [toast, setToast] = useState(null);

  const [trainerName, setTrainerName] = useState('');
  const [trainerEmail, setTrainerEmail] = useState('');
  const [trainerPassword, setTrainerPassword] = useState('');
  const [trainerSubject, setTrainerSubject] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, bRes] = await Promise.all([
        axios.get('/users?role=TRAINER&include=subjects'),
        axios.get('/batches')
      ]);
      setTrainers(tRes.data);
      setBatches(bRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterTrainer = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/users', { 
        name: trainerName, 
        email: trainerEmail, 
        password: trainerPassword, 
        role: 'TRAINER',
        subject: trainerSubject,
        institution_id: user.id
      });
      setToast({ type: 'success', message: 'Trainer registered successfully' });
      setShowAddModal(false);
      setTrainerName(''); setTrainerEmail(''); setTrainerPassword(''); setTrainerSubject('');
      fetchData();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Error registering trainer' });
    }
  };

  const handleAssignTrainer = async (e) => {
    e.preventDefault();
    if (!selectedBatchId) return;
    try {
      await axios.post(`/batches/${selectedBatchId}/assign-trainer`, { trainer_id: selectedTrainer.id });
      setToast({ type: 'success', message: `Trainer assigned to batch successfully` });
      setShowAssignModal(false);
      setSelectedBatchId('');
      fetchData();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Error assigning trainer' });
    }
  };

  const columns = [
    { 
      header: 'Trainer Name', 
      accessor: 'name', 
      render: (row) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3">
            {row.name.charAt(0)}
          </div>
          <span className="font-bold text-gray-800">{row.name}</span>
        </div>
      ) 
    },
    { header: 'Trainer ID', accessor: 'displayId', render: (row) => <span className="font-mono text-xs font-bold text-blue-600">{row.displayId}</span> },
    { header: 'Email Address', accessor: 'email', render: (row) => <span className="text-gray-500">{row.email}</span> },
    { header: 'Subject', accessor: 'subject', render: (row) => <span className="text-emerald-600 font-medium">{row.subject || 'N/A'}</span> },
    { 
      header: 'Assigned Batches', 
      accessor: 'trainerBatches', 
      render: (row) => (
        <div className="flex flex-wrap gap-1 items-center max-w-[250px]">
          {row.trainerBatches && row.trainerBatches.length > 0 ? (
            row.trainerBatches.map((tb, i) => (
              <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] font-bold">
                {tb.batch.name}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-gray-400 italic">No batches assigned</span>
          )}
          <button 
            onClick={() => { setSelectedTrainer(row); setShowAssignModal(true); }}
            className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors ml-1"
            title="Assign to another batch"
          >
            <Plus size={14} className="border border-blue-200 rounded-sm" />
          </button>
        </div>
      )
    },
    { 
      header: 'Actions', 
      accessor: 'actions', 
      render: (row) => (
        <div className="flex items-center space-x-2">
           <button 
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit Trainer"
            onClick={() => alert('Edit feature coming soon')}
          >
            <Pencil size={14} />
          </button>
        </div>
      ) 
    }
  ];

  return (
    <div className="h-full p-6 space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-gray-900">Trainer Management</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Total Trainers: {trainers.length}</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-shadow shadow-md shadow-blue-100"
        >
          <UserPlus size={16} />
          <span>Register Trainer</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <DataTable 
          columns={columns}
          data={trainers}
          loading={loading}
        />
      </div>

      {/* Add Trainer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-gray-800 text-lg">Register New Trainer</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleRegisterTrainer} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                <input type="text" required value={trainerName} onChange={e => setTrainerName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="John Doe"/>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                <input type="email" required value={trainerEmail} onChange={e => setTrainerEmail(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="trainer@institute.com"/>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Password</label>
                <input type="password" required value={trainerPassword} onChange={e => setTrainerPassword(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="••••••••"/>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Subject</label>
                <input type="text" required value={trainerSubject} onChange={e => setTrainerSubject(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="e.g. Mathematics, Computer Science"/>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 mt-2">Register Trainer</button>
            </form>
          </div>
        </div>
      )}

      {/* Assign to Batch Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-gray-800 text-lg">Assign to Batch</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleAssignTrainer} className="p-6 space-y-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mr-3 shadow-lg shadow-blue-200">
                  {selectedTrainer?.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-black text-blue-600 uppercase tracking-tighter">Trainer Selected</div>
                  <div className="font-bold text-gray-800">{selectedTrainer?.name}</div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Select Batch</label>
                <select 
                  required 
                  value={selectedBatchId} 
                  onChange={e => setSelectedBatchId(e.target.value)} 
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                >
                  <option value="">Choose a batch...</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.displayId})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 mt-2">Confirm Assignment</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
