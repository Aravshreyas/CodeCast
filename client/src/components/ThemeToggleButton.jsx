import React from 'react';
import { useAppContext } from '../context/AppContext'; // Import the unified hook
import { Sun, Moon } from 'lucide-react';

const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useAppContext(); // Use the unified hook

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
};

export default ThemeToggleButton;