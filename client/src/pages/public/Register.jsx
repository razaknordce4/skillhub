import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [otherInstitution, setOtherInstitution] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const res = await axios.get('/institutions');
      setInstitutions(res.data);
    } catch (err) {
      console.error('Error fetching institutions:', err);
    }
  };

  const handleInstitutionChange = (e) => {
    const value = e.target.value;
    setSelectedInstitution(value);
    if (value === 'other') {
      setShowOtherInput(true);
    } else {
      setShowOtherInput(false);
      setOtherInstitution('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      let institutionId = null;
      let institutionName = null;
      
      if (showOtherInput && otherInstitution) {
        // Pass new institution details directly to signup
        institutionName = otherInstitution;
      } else if (selectedInstitution) {
        institutionId = parseInt(selectedInstitution);
        const selected = institutions.find(inst => inst.id === parseInt(selectedInstitution));
        institutionName = selected?.name;
      }
      
      const user = await register(name, email, password, 'STUDENT', institutionId, institutionName);
      switch (user.role) {
        case 'STUDENT': navigate('/dashboard/student'); break;
        case 'TRAINER': navigate('/dashboard/trainer'); break;
        case 'INSTITUTION': navigate('/dashboard/institution'); break;
        case 'PROGRAMME_MANAGER': navigate('/dashboard/programme-manager'); break;
        case 'MONITORING_OFFICER': navigate('/dashboard/monitoring-officer'); break;
        case 'ADMIN': navigate('/dashboard/admin'); break;
        default: navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 shadow rounded-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Register an Account</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="Full Name" />
            </div>
            <div>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="Email address" />
            </div>
            <div>
              <select 
                required 
                value={selectedInstitution} 
                onChange={handleInstitutionChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              >
                <option value="">Select Institution</option>
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.displayId})
                  </option>
                ))}
                <option value="other">Other (Create New Institution)</option>
              </select>
            </div>
            {showOtherInput && (
              <div>
                <input 
                  type="text" 
                  required 
                  value={otherInstitution} 
                  onChange={(e) => setOtherInstitution(e.target.value)} 
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" 
                  placeholder="Enter new institution name" 
                />
              </div>
            )}
            <div>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="Password" />
            </div>
          </div>
          <div>
            <button 
              type="submit" 
              disabled={loading || (!selectedInstitution && !showOtherInput) || (showOtherInput && !otherInstitution)}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
        <div className="text-center">
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">Already have an account? Sign in</Link>
        </div>
      </div>
    </div>
  );
}
