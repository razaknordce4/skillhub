import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../../../components/ui/DataTable';

export default function TrainerInvites() {
  const [batches, setBatches] = useState([]);
  const [activeTab, setActiveTab] = useState('Active Links');

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await axios.get('/api/batches');
      setBatches(res.data);
    } catch (err) {
      console.error(err);
      // Fallback
      setBatches([
        { id: '1', name: 'Batch A', inviteCode: 'INV-A123', status: 'Active' },
        { id: '2', name: 'Batch B', inviteCode: 'INV-B456', status: 'Expired' }
      ]);
    }
  };

  const handleCreate = () => {
    alert('Generate New Invite Link');
  };

  const columns = [
    { header: 'Batch Name', accessor: 'name', render: (row) => <span className="font-bold text-gray-800">{row.name}</span> },
    { header: 'Invite Code / Link', accessor: 'inviteCode', render: (row) => <span className="text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded">{row.inviteCode || `LINK-${row.id}`}</span> },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium border ${row.status === 'Expired' ? 'border-red-200 text-red-600' : 'border-teal-200 text-teal-600'}`}>
          {row.status || 'Active'}
        </span>
      )
    }
  ];

  return (
    <div className="h-full p-6">
      <DataTable 
        title="Batch Invites"
        tabs={['Active Links', 'Expired Links']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filters={[]}
        columns={columns}
        data={batches}
        actionButton={{ label: 'Generate Link', onClick: handleCreate }}
      />
    </div>
  );
}
