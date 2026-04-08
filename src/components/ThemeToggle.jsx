import { useTheme } from '../context/themeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative w-12 h-5 rounded-full transition-all duration-500 ease-in-out transform
        ${isDark 
          ? 'bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 shadow-inner border border-slate-600/50' 
          : 'bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 shadow-lg shadow-amber-400/40 border border-amber-300/50'
        }
        hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-amber-400/30
        backdrop-blur-sm
      `}
      aria-label="Toggle theme"
    >
      {/* Toggle Circle */}
      <div
        className={`
          absolute top-0.5 w-5 h-4 rounded-full transition-all duration-500 ease-in-out
          ${isDark 
            ? 'left-0.5 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 shadow-lg border border-slate-200/50' 
            : 'left-8 bg-gradient-to-br from-white via-gray-50 to-gray-100 shadow-xl border border-white/80'
          }
          flex items-center justify-center backdrop-blur-sm
        `}
      > 
        {/* Icon */}
        <div className="text-sm transition-all duration-300">
          {isDark ? (
            <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-amber-700" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </div>
      </div>
       

        {/* <p className='text-red-600 mx-5'>Dark mode </p> */}
      
      {/* Background Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-2.5 pointer-events-none">
        <div className={`transition-all duration-500 ${isDark ? 'opacity-50 scale-90' : 'opacity-0 scale-75'}`}>
          <svg className="w-3.5 h-3.5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </div>
        <div className={`transition-all duration-500 ${isDark ? 'opacity-0 scale-75' : 'opacity-50 scale-90'}`}>
          <svg className="w-3.5 h-3.5 text-white/80" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      
      {/* Glow Effect */}
      <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
        isDark 
          ? 'shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]' 
          : 'shadow-[0_0_20px_rgba(251,191,36,0.3)]'
      }`} />
    </button>
  );
};

export default ThemeToggle;