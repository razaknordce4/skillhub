import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../../../components/ui/DataTable';

export default function TrainerMarks({ isReadOnly = false }) {
  const [marks, setMarks] = useState([]);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    fetchMarks();
  }, []);

  const fetchMarks = async () => {
    try {
      const res = await axios.get('/marks');
      setMarks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = () => {
    alert('Open Assign Marks Form');
  };

  const columns = [
    { header: 'Student Name', accessor: 'student.name', render: (row) => <span className="font-bold text-gray-800">{row.student?.name}</span> },
    { header: 'Batch', accessor: 'batch.name', render: (row) => <span>{row.batch?.name}</span> },
    { header: 'Exam / Assignment', accessor: 'exam_title' },
    { 
      header: 'Score', 
      accessor: 'score', 
      render: (row) => (
        <span className={row.score ? "font-medium text-gray-800" : "text-gray-400 italic"}>
          {row.score !== null ? `${row.score}/100` : 'Not assigned'}
        </span>
      )
    },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium border ${row.status === 'PENDING' ? 'border-orange-200 text-orange-600' : 'border-teal-200 text-teal-600'}`}>
          {row.status || 'GRADED'}
        </span>
      )
    }
  ];

  return (
    <div className="h-full p-6">
      <DataTable 
        title="Student Marks"
        tabs={['All', 'Graded', 'Pending']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filters={[{ label: 'Batch', options: ['All', 'Batch A', 'Batch B'] }]}
        columns={columns}
        data={marks}
        actionButton={!isReadOnly ? { label: 'Assign Marks', onClick: handleCreate } : undefined}
      />
    </div>
  );
}
