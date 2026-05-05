import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../../../components/ui/DataTable';
import { Shield } from 'lucide-react';

export default function PMManagers({ isReadOnly = false }) {
  const [managers, setManagers] = useState([]);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      const res = await axios.get('/users?role=PROGRAMME_MANAGER');
      setManagers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = () => alert('Open Provision Manager Form');

  const columns = [
    {
      header: 'Manager',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded border border-gray-200 bg-blue-50 flex items-center justify-center text-blue-600">
             <Shield className="w-4 h-4"/>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-[#1f2937]">{row.name}</span>
            <span className="text-xs text-blue-600 font-medium">PM-{row.id || Math.floor(Math.random()*900)+100}</span>
          </div>
        </div>
      )
    },
    { header: 'Email', accessor: 'email', render: (row) => <span className="text-gray-600">{row.email}</span> },
    { header: 'Region', accessor: 'region', render: (row) => <span className="text-gray-600">{row.region || 'Global'}</span> },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <div className={`inline-flex items-center justify-center px-3 py-1 rounded border bg-transparent text-xs font-medium w-24 ${row.status === 'Active' ? 'border-teal-200 text-teal-600' : 'border-gray-200 text-gray-500'}`}>
          {row.status || 'Active'}
        </div>
      )
    }
  ];

  return (
    <div className="h-full p-6">
      <DataTable 
        title={<span>Programme Managers <span className="text-sm text-gray-400 font-normal ml-2">Total: {managers.length}</span></span>}
        tabs={['All']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filters={[{ label: 'Region', options: ['All', 'Global', 'Europe'] }]}
        columns={columns}
        data={managers}
        actionButton={!isReadOnly ? { label: 'Provision Manager', onClick: handleCreate } : undefined}
      />
    </div>
  );
}
