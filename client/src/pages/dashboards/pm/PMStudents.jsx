import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../../../components/ui/DataTable';
import { User } from 'lucide-react';

export default function PMStudents({ isReadOnly = false }) {
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/users?role=STUDENT');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = () => alert('Open Provision Student Form');

  const columns = [
    {
      header: 'Student',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500">
             <User className="w-4 h-4"/>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-[#1f2937]">{row.name}</span>
            <span className="text-xs text-blue-600 font-medium">STD-{row.id || Math.floor(Math.random()*9000)+1000}</span>
          </div>
        </div>
      )
    },
    { header: 'Email', accessor: 'email', render: (row) => <span className="text-gray-600">{row.email}</span> },
    { header: 'Batch', accessor: 'batch', render: (row) => <span className="text-gray-600">{row.batch || 'Unassigned'}</span> },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <div className={`inline-flex items-center justify-center px-3 py-1 rounded border bg-transparent text-xs font-medium w-24 ${row.status === 'Enrolled' ? 'border-teal-200 text-teal-600' : 'border-red-200 text-red-600'}`}>
          {row.status || 'Enrolled'}
        </div>
      )
    }
  ];

  return (
    <div className="h-full p-6">
      <DataTable 
        title={<span>Students <span className="text-sm text-gray-400 font-normal ml-2">Total: {students.length}</span></span>}
        tabs={['All', 'Batch A', 'Batch B']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filters={[{ label: 'Status', options: ['All', 'Enrolled', 'Suspended'] }]}
        columns={columns}
        data={students}
        actionButton={!isReadOnly ? { label: 'Provision Student', onClick: handleCreate } : undefined}
      />
    </div>
  );
}
