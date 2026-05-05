import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';
import skillBridgeImg from '../../assets/skill_bridge-removebg-preview.png';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'STUDENT': return '/dashboard/student';
      case 'TRAINER': return '/dashboard/trainer';
      case 'INSTITUTION': return '/dashboard/institution';
      case 'PROGRAMME_MANAGER': return '/dashboard/programme-manager';
      case 'MONITORING_OFFICER': return '/dashboard/monitoring-officer';
      case 'ADMIN': return '/dashboard/admin';
      default: return '/';
    }
  };

  return (
    <nav className="bg-white shadow border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img src={skillBridgeImg} alt="SkillBridge" className="h-10 w-auto" />
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link to="/" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium">Home</Link>
              <Link to="/about" className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium">About</Link>
              <Link to="/contact" className="text-gray-500 hover:text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300 text-sm font-medium">Contact</Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to={getDashboardLink()} className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Dashboard
                </Link>
                <div className="flex items-center text-sm font-medium text-gray-700 bg-gray-100 py-1 px-3 rounded-full">
                  <UserIcon className="w-4 h-4 mr-2" />
                  {user.name} ({user.role})
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  <LogOut className="w-4 h-4 mr-1" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Login</Link>
                <Link to="/register" className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
