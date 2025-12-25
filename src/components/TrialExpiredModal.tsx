import React from 'react';
import { X, CreditCard } from 'lucide-react';

interface TrialExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TrialExpiredModal({ isOpen, onClose }: TrialExpiredModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-green-600" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-2">
          Trial Expired
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-center mb-6">
          Your 14-day free trial has ended. Upgrade to continue creating new projects.
        </p>

        {/* What you keep */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-gray-900 mb-2">
            Don't worry, your existing projects are safe:
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ View all existing projects</li>
            <li>✓ Manage client payments</li>
            <li>✓ Track project progress</li>
          </ul>
        </div>

        {/* Pricing */}
        <div className="border-2 border-green-600 rounded-lg p-6 mb-6">
          <div className="text-center">
            <h3 className="font-bold text-lg text-gray-900">MileStage Pro</h3>
            <div className="mt-2 mb-4">
              <span className="text-4xl font-bold text-gray-900">$19</span>
              <span className="text-gray-600">/month</span>
            </div>
            <ul className="text-sm text-left space-y-2 mb-4">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Unlimited projects</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Automated payment tracking</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Stage locking & reminders</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Zero transaction fees</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button 
            onClick={() => {
              // TODO: Add Stripe checkout here later
              alert('Stripe checkout coming soon! For now, contact hey@milestage.com');
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Upgrade Now
          </button>
          
          <button
            onClick={onClose}
            className="w-full text-gray-600 hover:text-gray-900 font-medium py-2"
          >
            Maybe Later
          </button>
        </div>

        {/* Fine print */}
        <p className="text-xs text-gray-500 text-center mt-4">
          No automatic charges. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
