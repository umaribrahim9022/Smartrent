import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`theme-toggle ${className}`}
    >
      <span className="theme-toggle-track">
        <span className="theme-toggle-thumb">
          {isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
        </span>
      </span>
    </button>
  );
};

export default ThemeToggle;
