import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../../../components/ui/DataTable';

export default function StudentAttendance() {
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('All Records');

  useEffect(() => {
    // Mocking attendance history
    setHistory([
      { id: 1, session: 'Introduction to React', date: '2024-10-24', status: 'Present' },
      { id: 2, session: 'Advanced CSS', date: '2024-10-20', status: 'Absent' },
      { id: 3, session: 'State Management', date: '2024-10-18', status: 'Present' }
    ]);
  }, []);

  const columns = [
    { header: 'Session Title', accessor: 'session', render: (row) => <span className="font-bold text-gray-800">{row.session}</span> },
    { header: 'Date', accessor: 'date' },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium border ${row.status === 'Absent' ? 'border-red-200 text-red-600 bg-red-50' : 'border-teal-200 text-teal-600 bg-teal-50'}`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="h-full p-6">
      <DataTable 
        title="Attendance History"
        tabs={['All Records', 'Present', 'Absent']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filters={[{ label: 'Month', options: ['All', 'October', 'September'] }]}
        columns={columns}
        data={history}
        // Read-only page
      />
    </div>
  );
}
