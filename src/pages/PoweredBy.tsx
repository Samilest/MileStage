import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PoweredBy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-secondary-bg flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to your project</span>
        </button>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <img 
              src="/assets/milestage-logo.png" 
              alt="MileStage" 
              className="h-12"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden text-3xl font-bold text-gray-900">MileStage</div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            You're viewing a project<br />powered by MileStage
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
            MileStage helps your freelancers deliver great work with clear milestones and on-time payments.
          </p>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
          </div>

          {/* CTA for Freelancers */}
          <div className="space-y-4">
            <p className="text-gray-700 font-medium">
              Are you a freelancer?
            </p>
            <Link
              to="/signup"
              className="inline-block bg-primary hover:bg-primary-hover text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Sign Up Free
            </Link>
            <p className="text-sm text-gray-500">
              Track your projects and get paid faster
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500">
          Questions about this project? Contact your freelancer directly.
        </p>
      </div>
    </div>
  );
}
