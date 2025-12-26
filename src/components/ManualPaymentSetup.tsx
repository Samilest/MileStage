import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ManualPaymentSetupProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSaved: () => void;
}

export default function ManualPaymentSetup({ 
  isOpen, 
  onClose, 
  userId,
  onSaved 
}: ManualPaymentSetupProps) {
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!paymentInstructions.trim()) {
      toast.error('Please enter payment instructions');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ manual_payment_instructions: paymentInstructions.trim() })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Payment instructions saved!');
      onSaved();
      onClose();
    } catch (error) {
      console.error('Error saving payment instructions:', error);
      toast.error('Failed to save payment instructions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-2">
          Add Payment Instructions
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          Tell your clients how to pay you manually (bank transfer, PayPal, Venmo, etc.)
        </p>

        {/* Form */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Payment Instructions
          </label>
          <textarea
            value={paymentInstructions}
            onChange={(e) => setPaymentInstructions(e.target.value)}
            placeholder="Example:&#10;&#10;Bank Transfer:&#10;Account Name: Your Business Name&#10;Account Number: 1234567890&#10;Routing Number: 987654321&#10;&#10;Or PayPal: yourname@paypal.com"
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          />
          <p className="text-sm text-gray-500 mt-2">
            This will be shown to your clients in the payment section
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !paymentInstructions.trim()}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Instructions
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
