import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../../../components/ui/DataTable';

export default function PMInstitutions({ isReadOnly = false }) {
  const [institutions, setInstitutions] = useState([]);
  const [activeTab, setActiveTab] = useState('Large Business');

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const res = await axios.get('/users?role=INSTITUTION');
      setInstitutions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = () => {
    // This would typically open a modal or navigate to a create form
    alert('Open Create Institution Form');
  };

  const tabs = ['Individuals', 'Small Business', 'Large Business', 'Financial Institutions'];
  const filters = [
    { label: 'Status', options: ['All', 'Active', 'Pending'] },
    { label: 'Type', options: ['All', 'Local', 'Global'] },
    { label: 'Sort', options: ['By Date', 'By Name'] }
  ];

  const columns = [
    {
      header: 'Institution',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded border border-gray-200 bg-white flex items-center justify-center text-xs font-bold text-blue-800">
             {/* Mock logo shape */}
             <div className="w-4 h-4 border-2 border-blue-600 transform rotate-45"></div>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-[#1f2937]">{row.name}</span>
            <span className="text-xs text-blue-600 font-medium">INST-{row.id || Math.floor(Math.random()*9000)+1000}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Term',
      accessor: 'dateRange',
      render: (row) => <span className="text-gray-700">{row.dateRange || '01.01.2024 - 01.01.2025'}</span>
    },
    {
      header: 'Rate (%)',
      accessor: 'rate',
      render: (row) => <span className="text-gray-700">{row.rate || '10'}</span>
    },
    {
      header: 'Amount (rub.)',
      accessor: 'amount',
      render: (row) => <span className="text-gray-700">{row.amount || '10 000 000.00'}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        let colors = 'border-teal-200 text-teal-600';
        let text = 'Одобрено';
        if (row.status === 'Review') {
          colors = 'border-blue-200 text-blue-600';
          text = 'Рассмотрение';
        } else if (row.status === 'Pending') {
          colors = 'border-yellow-200 text-yellow-600';
          text = 'Доп. рассмотрение';
        } else if (row.status === 'Declined') {
           colors = 'border-red-200 text-red-600';
           text = 'Отклонено';
        }

        return (
          <div className={`inline-flex items-center justify-center px-3 py-1 rounded border bg-transparent text-xs font-medium w-32 ${colors}`}>
            {text}
          </div>
        );
      }
    }
  ];

  return (
    <div className="h-full p-6">
      <DataTable 
        title={<span>Institutions <span className="text-sm text-gray-400 font-normal ml-2">Total: {institutions.length}</span></span>}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filters={filters}
        columns={columns}
        data={institutions}
        actionButton={!isReadOnly ? { label: 'New Institution', onClick: handleCreate } : undefined}
        onRowAction={!isReadOnly ? (row) => alert('Action on ' + row.name) : undefined}
      />
    </div>
  );
}
