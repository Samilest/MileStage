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
    await supabase.auth.signOut();
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-background border-b border-border">
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
            <Button variant="secondary" onClick={handleLogout} className="min-h-[44px] text-sm sm:text-base px-4 sm:px-6">
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default memo(Navigation);
