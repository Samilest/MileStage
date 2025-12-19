// src/components/WelcomeModal.tsx
// Simplified welcome modal - removed demo option

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Rocket } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface WelcomeModalProps {
  userId: string;
  onClose: () => void;
}

export default function WelcomeModal({ userId, onClose }: WelcomeModalProps) {
  const navigate = useNavigate();
  const [closing, setClosing] = useState(false);

  const handleCreateProject = async () => {
    await markWelcomeSeen();
    navigate('/templates');
  };

  const handleSkip = async () => {
    await markWelcomeSeen();
    onClose();
  };

  const markWelcomeSeen = async () => {
    try {
      await supabase
        .from('user_profiles')
        .update({ welcome_modal_seen: true })
        .eq('id', userId);
    } catch (error) {
      console.error('Error marking welcome as seen:', error);
    }
  };

  const handleClose = async () => {
    setClosing(true);
    await markWelcomeSeen();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-fadeIn">
        
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={closing}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">👋</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to MileStage!
          </h2>
          <p className="text-gray-600">
            How would you like to start?
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          
          {/* Create Project */}
          <button
            onClick={handleCreateProject}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl p-6 text-left transition-all transform hover:scale-[1.02] active:scale-[0.98] group"
          >
            <div className="flex items-start gap-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <Rocket className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Create Your First Project</h3>
                <p className="text-green-100 text-sm">
                  Start with an actual client project
                </p>
              </div>
            </div>
          </button>

          {/* Skip */}
          <button
            onClick={handleSkip}
            className="w-full text-gray-600 hover:text-gray-900 text-sm font-medium py-4 transition-colors"
          >
            Skip - I'll explore on my own
          </button>
        </div>

      </div>
    </div>
  );
}
