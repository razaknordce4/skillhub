import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Menu, X, Bell, Search, User, LogOut, 
  Home, BookOpen, Users, Calendar, Activity, Settings 
} from 'lucide-react';
import skillBridgeImg from '../../assets/skill_bridge-removebg-preview.png';
import skillBridge1Img from '../../assets/skill_bridge1-removebg-preview.png';

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    const baseItems = [
      { name: 'Overview', path: `/dashboard/${user?.role.toLowerCase().replace('_', '-')}`, icon: Home }
    ];
    
    if (!user) return baseItems;

    switch (user.role) {
      case 'STUDENT':
        return [
          ...baseItems,
          { name: 'Sessions', path: '/dashboard/student/sessions', icon: BookOpen },
          { name: 'Trainers', path: '/dashboard/student/trainers', icon: Users },
          { name: 'Marks', path: '/dashboard/student/marks', icon: BookOpen },
          { name: 'Attendance', path: '/dashboard/student/attendance', icon: Calendar },
          { name: 'Notifications', path: '/dashboard/student/notifications', icon: Activity }
        ];
      case 'TRAINER':
        return [
          ...baseItems,
          { name: 'Batches', path: '/dashboard/trainer/batches', icon: Users },
          { name: 'Marks', path: '/dashboard/trainer/marks', icon: BookOpen },
          { name: 'Sessions', path: '/dashboard/trainer/sessions', icon: Calendar },
          { name: 'Notifications', path: '/dashboard/trainer/notifications', icon: Activity }
        ];
      case 'INSTITUTION':
        return [
          ...baseItems,
          { name: 'Batches Data', path: '/dashboard/institution/batches', icon: BookOpen },
          { name: 'Trainers', path: '/dashboard/institution/trainers', icon: Users },
          { name: 'Students Data', path: '/dashboard/institution/students', icon: Users },
          { name: 'Notifications', path: '/dashboard/institution/notifications', icon: Activity }
        ];
      case 'PROGRAMME_MANAGER':
        return [
          ...baseItems,
          { name: 'Institutions', path: '/dashboard/programme-manager/institutions', icon: BookOpen },
          { name: 'Trainers', path: '/dashboard/programme-manager/trainers', icon: Users },
          { name: 'Students', path: '/dashboard/programme-manager/students', icon: Users },
          { name: 'Monitoring Officers', path: '/dashboard/programme-manager/managers', icon: Users },
          { name: 'Notifications', path: '/dashboard/programme-manager/notifications', icon: Activity }
        ];
      case 'MONITORING_OFFICER':
        return [
          ...baseItems,
          { name: 'Institutions', path: '/dashboard/monitoring-officer/institutions', icon: BookOpen },
          { name: 'Trainers', path: '/dashboard/monitoring-officer/trainers', icon: Users },
          { name: 'Students', path: '/dashboard/monitoring-officer/students', icon: Users },
          { name: 'Notifications', path: '/dashboard/monitoring-officer/notifications', icon: Activity }
        ];
      case 'ADMIN':
        return [
          ...baseItems,
          { name: 'Institutions', path: '/dashboard/admin/institutions', icon: BookOpen },
          { name: 'Trainers', path: '/dashboard/admin/trainers', icon: Users },
          { name: 'Students', path: '/dashboard/admin/students', icon: Users },
          { name: 'Officers', path: '/dashboard/admin/managers', icon: Users },
          { name: 'Notifications', path: '/dashboard/admin/notifications', icon: Activity }
        ];
      default:
        return baseItems;
    }
  };

  const navItems = getNavItems();

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 ${sidebarCollapsed ? 'w-20' : 'w-64'} bg-white shadow-lg transform transition-all duration-300 lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <img src={sidebarCollapsed ? skillBridge1Img : skillBridgeImg} alt="Logo" className={`${sidebarCollapsed ? 'h-8' : 'h-10'} w-auto transition-all`} title="SkillBridge" />
        </div>
        
        <div className="overflow-y-auto overflow-x-hidden flex-grow">
          <ul className="flex flex-col py-4 space-y-1">
            {!sidebarCollapsed && (
              <li className="px-5">
                <div className="flex flex-row items-center h-8">
                  <div className="text-sm font-light tracking-wide text-gray-500 uppercase">Menu</div>
                </div>
              </li>
            )}
            
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path === '#' && idx === 0);
              return (
                <li key={idx}>
                  <Link 
                    to={item.path} 
                    title={item.name}
                    className={`relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 ${isActive ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-transparent'} ${sidebarCollapsed ? 'justify-center pr-4' : ''}`}
                    onClick={() => {
                      if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                  >
                    <span className="inline-flex justify-center items-center ml-4">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-blue-500' : ''}`} />
                    </span>
                    {!sidebarCollapsed && (
                      <span className="ml-2 text-sm tracking-wide truncate">{item.name}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        
        {/* User Info bottom of sidebar */}
        <div className="p-4 border-t border-gray-200 flex justify-center">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0" title={user?.name}>
              {user?.name.charAt(0)}
            </div>
            {!sidebarCollapsed && (
              <div className="ml-3 truncate">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.role.replace('_', ' ')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Navbar */}
        <header className="flex justify-between items-center py-4 px-6 bg-white border-b border-gray-200 z-10">
          <div className="flex items-center">
            <button 
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setSidebarOpen(true);
                } else {
                  setSidebarCollapsed(!sidebarCollapsed);
                }
              }}
              className="text-gray-500 focus:outline-none mr-4 hover:text-gray-700 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Search Bar */}
            <div className="relative w-64 hidden sm:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="w-4 h-4 text-gray-400" />
              </span>
              <input 
                type="text" 
                className="w-full py-2 pl-10 pr-4 text-sm text-gray-700 bg-gray-100 border-none rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Search..." 
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Link 
              to={`/dashboard/${user?.role.toLowerCase().replace('_', '-')}/notifications`}
              className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
            >
              <Bell className="h-6 w-6" />
              <span className="absolute top-0 right-0 h-2 w-2 mt-1 mr-1 bg-red-500 rounded-full"></span>
            </Link>

            {/* Profile dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md overflow-hidden shadow-xl z-10 border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm text-gray-900">Signed in as</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
        
      </div>
    </div>
  );
}
