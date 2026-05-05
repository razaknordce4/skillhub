import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../../../components/ui/DataTable';

export default function MOAnalytics() {
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState('All Branches');

  useEffect(() => {
    // In a real scenario we'd fetch branch specific detailed tables
    setData([
      { id: 1, name: 'Main Campus', type: 'Institution', metric: '95% Attendance', status: 'Healthy' },
      { id: 2, name: 'North Branch', type: 'Institution', metric: '60% Attendance', status: 'Warning' }
    ]);
  }, []);

  const columns = [
    { header: 'Branch Name', accessor: 'name', render: (row) => <span className="font-bold text-gray-800">{row.name}</span> },
    { header: 'Type', accessor: 'type' },
    { header: 'Key Metric', accessor: 'metric' },
    { 
      header: 'Health Status', 
      accessor: 'status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium border ${row.status === 'Warning' ? 'border-orange-200 text-orange-600 bg-orange-50' : 'border-teal-200 text-teal-600 bg-teal-50'}`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="h-full p-6">
      <DataTable 
        title="Branch Data Review"
        tabs={['All Branches', 'Flagged']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filters={[{ label: 'Region', options: ['All', 'North', 'South'] }]}
        columns={columns}
        data={data}
        // Notice: NO action button here, because MO is read-only
      />
    </div>
  );
}
