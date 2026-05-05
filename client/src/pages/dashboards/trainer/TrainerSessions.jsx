import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../../../components/ui/DataTable';

export default function TrainerSessions() {
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState('Upcoming');

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

  const handleCreate = () => {
    alert('Open Create Session Form');
  };

  const columns = [
    { header: 'Session Title', accessor: 'title', render: (row) => <span className="font-bold text-gray-800">{row.title}</span> },
    { header: 'Date', accessor: 'date' },
    { header: 'Time', accessor: 'time', render: (row) => <span>{row.start_time} - {row.end_time}</span> },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium border ${row.status === 'Completed' ? 'border-gray-200 text-gray-500' : 'border-blue-200 text-blue-600'}`}>
          {row.status || 'Upcoming'}
        </span>
      )
    }
  ];

  return (
    <div className="h-full p-6">
      <DataTable 
        title="My Sessions"
        tabs={['All Sessions', 'Upcoming', 'Completed']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filters={[{ label: 'Batch', options: ['All', 'Batch A', 'Batch B'] }]}
        columns={columns}
        data={sessions}
        actionButton={{ label: 'New Session', onClick: handleCreate }}
      />
    </div>
  );
}
