import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from '../../../components/ui/DataTable';

export default function StudentSessions() {
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState('Today');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await axios.get('/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error(err);
      setSessions([
        { id: 1, title: 'Introduction to Algorithms', date: '2024-10-24', start_time: '10:00', end_time: '12:00', status: 'Pending' }
      ]);
    }
  };

  const markAttendance = async (session) => {
    try {
      await axios.post('/attendance/mark', { session_id: session.id, status: 'PRESENT' });
      alert('Attendance marked!');
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.message || 'Error marking attendance');
    }
  };

  const columns = [
    { header: 'Session Title', accessor: 'title', render: (row) => <span className="font-bold text-gray-800">{row.title}</span> },
    { header: 'Date', accessor: 'date' },
    { header: 'Time', accessor: 'time', render: (row) => <span>{row.start_time} - {row.end_time}</span> },
    { 
      header: 'Action', 
      accessor: 'action', 
      render: (row) => (
        <button onClick={() => markAttendance(row)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">
          Mark Present
        </button>
      )
    }
  ];

  return (
    <div className="h-full p-6">
      <DataTable 
        title="My Classes"
        tabs={['Today', 'Upcoming', 'Past']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filters={[{ label: 'Course', options: ['All', 'Computer Science', 'Mathematics'] }]}
        columns={columns}
        data={sessions}
      />
    </div>
  );
}
