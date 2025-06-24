import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggleButton from './ThemeToggleButton';
import { useAppContext } from '../context/AppContext'; // Import the unified hook

const Header = () => {
  const { userInfo, logout } = useAppContext(); // Use the unified context
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-gray-100 dark:bg-gray-800 shadow-md">
      <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
          CodeCast
        </Link>
        <div className="flex items-center space-x-4">
          <ThemeToggleButton />
          {userInfo ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">Welcome, {userInfo.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="space-x-2">
              <Link to="/login" className="px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700">
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;