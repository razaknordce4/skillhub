import React, { useState, useEffect } from 'react';
import DataTable from '../../../components/ui/DataTable';
import { useAuth } from '../../../context/AuthContext';

export default function DashboardNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('Unread');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get('/notifications');
        setNotifications(res.data);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const columns = [
    { header: 'Date', accessor: 'date', render: (row) => <span className="text-gray-500 text-xs">{row.date}</span> },
    { header: 'Title', accessor: 'title', render: (row) => <span className={`font-bold ${row.status === 'Unread' ? 'text-gray-900' : 'text-gray-500'}`}>{row.title}</span> },
    { header: 'Message', accessor: 'message', render: (row) => <span className="text-gray-600">{row.message}</span> },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${row.status === 'Unread' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="h-full p-6">
      <DataTable 
        title={`${user.role.replace('_', ' ')} Notifications`}
        tabs={['Unread', 'All']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filters={[]}
        columns={columns}
        data={activeTab === 'Unread' ? notifications.filter(n => n.status === 'Unread') : notifications}
      />
    </div>
  );
}
