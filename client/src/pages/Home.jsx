import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import axios from 'axios';
import { X } from 'lucide-react';

const Home = () => {
  const { userInfo } = useAppContext();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  const handleCreateSession = async () => {
    if (!userInfo) {
      navigate('/login');
      return;
    }
    setIsCreating(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/sessions/create`, {}, config);
      navigate(`/classroom/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create session.');
      setIsCreating(false);
    }
  };

  const handleJoinSession = async (e) => {
    e.preventDefault();
    if (!userInfo) {
      navigate('/login');
      return;
    }
    setError('');
    try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/sessions/join`, { inviteCode }, config);
        navigate(`/classroom/${data._id}`);
    } catch (err) {
        setError(err.response?.data?.message || 'Invalid Invite Code.');
    }
  };

  return (
    <>
      <div className="container mx-auto px-6 py-10 text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to CodeCast{userInfo ? `, ${userInfo.name}!` : '!'}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">The collaborative platform for live coding sessions.</p>
        {error && <p className="mb-4 text-center text-red-500">{error}</p>}
        <div className="flex justify-center space-x-4">
            {userInfo?.role === 'instructor' && (
              <button onClick={handleCreateSession} disabled={isCreating} className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400">
                  {isCreating ? 'Creating...' : 'Create a Session'}
              </button>
            )}
            <button onClick={() => setShowJoinModal(true)} className="px-8 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700">Join a Session</button>
        </div>
      </div>

      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md relative">
                <button onClick={() => setShowJoinModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-6 text-center">Join Session</h2>
                <form onSubmit={handleJoinSession}>
                    <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Enter Invite Code</label>
                    <input 
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-center font-mono text-lg tracking-widest"
                        placeholder="ABCXYZ"
                        maxLength="6"
                        required
                    />
                    <button type="submit" className="w-full mt-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                        Join
                    </button>
                </form>
            </div>
        </div>
      )}
    </>
  );
};

export default Home;
