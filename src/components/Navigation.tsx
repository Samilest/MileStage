import { memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import Button from './Button';
import logo from '../assets/milestage-logo.png';

function Navigation() {
  const navigate = useNavigate();
  const logout = useStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      // 1. Sign out from Supabase
      await supabase.auth.signOut();
      
      // 2. Clear store state
      logout();
      
      // 3. ONLY remove Supabase auth tokens from localStorage
      const authKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('sb-') && key.includes('auth-token')
      );
      authKeys.forEach(key => localStorage.removeItem(key));
      
      // 4. Force hard redirect
      window.location.href = '/login';
      
    } catch (error) {
      console.error('Logout error:', error);
      
      // Fallback: still remove auth tokens
      const authKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('sb-') && key.includes('auth-token')
      );
      authKeys.forEach(key => localStorage.removeItem(key));
      window.location.href = '/login';
    }
  };

  return (
    <nav className="bg-background border-b border-border mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <img 
                src={logo} 
                alt="MileStage" 
                className="h-12"
              />
            </Link>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button variant="secondary" onClick={handleLogout} className="text-sm sm:text-base px-4 sm:px-6">
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default memo(Navigation);