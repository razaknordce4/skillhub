import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../../../components/ui/DataTable';

export default function InstitutionBatches() {
  const [batches, setBatches] = useState([]);
  const [activeTab, setActiveTab] = useState('All Batches');

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await axios.get('/batches');
      setBatches(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = () => {
    alert('Open Create Batch Form');
  };

  const columns = [
    { header: 'Batch Name', accessor: 'name', render: (row) => <span className="font-bold text-gray-800">{row.name}</span> },
    { header: 'Batch ID', accessor: 'id', render: (row) => <span className="text-blue-600">#{row.id || Math.floor(Math.random()*1000)}</span> },
    { header: 'Term', accessor: 'date', render: (row) => <span>{row.date || 'TBA'}</span> },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium border ${row.status === 'Completed' ? 'border-gray-200 text-gray-500' : 'border-teal-200 text-teal-600'}`}>
          {row.status || 'Active'}
        </span>
      )
    }
  ];

  return (
    <div className="h-full p-6">
      <DataTable 
        title="Institution Batches"
        tabs={['All Batches', 'Active', 'Completed']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filters={[{ label: 'Term', options: ['All', 'Fall 2024', 'Spring 2024'] }]}
        columns={columns}
        data={batches}
        actionButton={{ label: 'New Batch', onClick: handleCreate }}
      />
    </div>
  );
}
