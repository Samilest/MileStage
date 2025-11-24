import { useState } from 'react';
import { X, Rocket, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface WelcomeModalProps {
  userId: string;
  onClose: () => void;
}

export default function WelcomeModal({ userId, onClose }: WelcomeModalProps) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const handleCreateRealProject = async () => {
    // Mark modal as seen
    await markWelcomeModalSeen();
    onClose();
    navigate('/new-project');
  };

  const handleTryDemo = async () => {
    setCreating(true);
    try {
      // Create a demo project
      const demoProject = {
        user_id: userId,
        project_name: 'Demo: Website Redesign Project',
        client_name: 'Demo Client',
        client_email: 'demo@example.com',
        total_amount: 5000,
        currency: 'USD',
        status: 'active',
        is_demo: true,
        payment_methods: {
          paypal: 'demo@paypal.com',
          bank_transfer: 'Demo Bank Account',
        },
      };

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert(demoProject)
        .select()
        .single();

      if (projectError) throw projectError;

      // Create demo stages
      const demoStages = [
        {
          project_id: project.id,
          stage_number: 0,
          name: 'Down Payment',
          amount: 1500,
          status: 'approved',
          payment_status: 'received',
          revisions_included: 0,
          revisions_used: 0,
          extension_enabled: false,
        },
        {
          project_id: project.id,
          stage_number: 1,
          name: 'Discovery & Planning',
          amount: 800,
          status: 'approved',
          payment_status: 'received',
          revisions_included: 2,
          revisions_used: 1,
          extension_enabled: true,
          extension_price: 200,
        },
        {
          project_id: project.id,
          stage_number: 2,
          name: 'Design Mockups',
          amount: 1500,
          status: 'delivered',
          payment_status: 'unpaid',
          revisions_included: 3,
          revisions_used: 0,
          extension_enabled: true,
          extension_price: 300,
        },
        {
          project_id: project.id,
          stage_number: 3,
          name: 'Development',
          amount: 1000,
          status: 'locked',
          payment_status: 'unpaid',
          revisions_included: 2,
          revisions_used: 0,
          extension_enabled: true,
          extension_price: 250,
        },
        {
          project_id: project.id,
          stage_number: 4,
          name: 'Launch & Training',
          amount: 200,
          status: 'locked',
          payment_status: 'unpaid',
          revisions_included: 1,
          revisions_used: 0,
          extension_enabled: false,
        },
      ];

      const { error: stagesError } = await supabase
        .from('stages')
        .insert(demoStages);

      if (stagesError) throw stagesError;

      // Add a demo deliverable to Stage 2
      await supabase.from('deliverables').insert({
        stage_id: demoStages[2].stage_number, // This needs the actual stage ID
        name: 'Homepage Mockup',
        file_url: 'https://example.com/demo-mockup.pdf',
      });

      // Mark modal as seen
      await markWelcomeModalSeen();
      
      onClose();
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating demo project:', error);
      alert('Failed to create demo project. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleSkip = async () => {
    await markWelcomeModalSeen();
    onClose();
  };

  const markWelcomeModalSeen = async () => {
    await supabase
      .from('user_profiles')
      .update({ welcome_modal_seen: true })
      .eq('id', userId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-2">Welcome to MileStage! 👋</h2>
        <p className="text-gray-600 mb-6">How would you like to start?</p>

        <div className="space-y-3 mb-6">
          <button
            onClick={handleCreateRealProject}
            className="w-full bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg transition-colors text-left"
          >
            <div className="flex items-start gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded">
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Create Real Project</h3>
                <p className="text-sm text-green-50">
                  Start with an actual client project
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={handleTryDemo}
            disabled={creating}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 p-4 rounded-lg transition-colors text-left disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="bg-gray-300 p-2 rounded">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">
                  {creating ? 'Creating Demo...' : 'Explore with Demo'}
                </h3>
                <p className="text-sm text-gray-600">
                  See how it works with sample data (2 min)
                </p>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={handleSkip}
          className="w-full text-sm text-gray-500 hover:text-gray-700"
        >
          Skip - I'll explore on my own
        </button>
      </div>
    </div>
  );
}
