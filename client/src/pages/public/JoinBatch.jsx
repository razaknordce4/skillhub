import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function JoinBatch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMsg, setErrorMsg] = useState('');

  const handleJoin = async () => {
    setStatus('loading');
    try {
      await axios.post(`/batches/${id}/join`);
      setStatus('success');
      setTimeout(() => {
        navigate('/dashboard/student');
      }, 2000);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.message || 'Failed to join batch');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
      <div className="bg-white shadow p-8 rounded-lg max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Join Batch</h2>
        <p className="text-gray-600 mb-6">You have been invited to join a training batch.</p>
        
        {status === 'idle' && (
          <button 
            onClick={handleJoin}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Accept Invitation
          </button>
        )}

        {status === 'loading' && (
          <p className="text-blue-600 font-medium">Joining batch...</p>
        )}

        {status === 'success' && (
          <div className="text-green-600 font-medium">
            <p>Successfully joined the batch!</p>
            <p className="text-sm mt-2">Redirecting to your dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <p className="text-red-600 font-medium mb-4">{errorMsg}</p>
            <button 
              onClick={() => navigate('/dashboard/student')}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
