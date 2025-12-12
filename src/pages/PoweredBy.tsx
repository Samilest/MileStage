import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import logo from '../assets/milestage-logo.png';

export default function PoweredBy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl w-full">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-12 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-base">Back to your project</span>
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 sm:p-16 text-center space-y-12">
            
            {/* Logo */}
            <div className="flex justify-center">
              <img 
                src={logo}
                alt="MileStage" 
                className="h-16 sm:h-20"
              />
            </div>

            {/* Headline */}
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                You're viewing a project
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                MileStage helps your freelancers deliver great work with clear milestones and on-time payments.
              </p>
            </div>

            {/* Divider */}
            <div className="relative py-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="space-y-6">
              <p className="text-xl text-gray-700 font-medium">
                Are you a freelancer?
              </p>
              
              <Link
                to="/signup"
                className="inline-flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white font-semibold text-lg px-10 py-4 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl group"
              >
                Sign Up Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <p className="text-base text-gray-500">
                Track your projects and get paid faster
              </p>
            </div>

          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Questions about this project? Contact your freelancer directly.
        </p>
      </div>
    </div>
  );
}
