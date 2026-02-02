import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import logo from '../assets/milestage-logo.png';

export default function VerifyEmail() {
  const location = useLocation();
  const email = location.state?.email || '';
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('No email address found. Please sign up again.');
      return;
    }

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      setResent(true);
      toast.success('Verification email sent!');
    } catch (err: any) {
      console.error('Resend error:', err);
      toast.error('Failed to resend email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logo} alt="MileStage" className="h-12" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Email Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Check your inbox
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-2">
            We sent a verification link to
          </p>
          {email && (
            <p className="font-medium text-gray-900 mb-6">
              {email}
            </p>
          )}

          <p className="text-gray-500 text-sm mb-8">
            Click the link in the email to activate your account.
            <br />
            It may take a minute to arrive.
          </p>

          {/* Divider */}
          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500 mb-4">
              Didn't receive the email?
            </p>

            <button
              onClick={handleResendEmail}
              disabled={resending || resent}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                resent
                  ? 'bg-green-100 text-green-700 cursor-default'
                  : resending
                  ? 'bg-gray-100 text-gray-400 cursor-wait'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {resent ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Email sent!
                </span>
              ) : resending ? (
                'Sending...'
              ) : (
                'Resend verification email'
              )}
            </button>
          </div>

          {/* Help text */}
          <p className="text-xs text-gray-400 mt-6">
            Check your spam folder if you don't see it.
          </p>
        </div>

        {/* Back to login */}
        <div className="text-center mt-6">
          <Link
            to="/login"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
