import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Button from '../components/Button';
import { TEMPLATES } from '../lib/templates';
import { Plus, Minus, ArrowLeft, Settings } from 'lucide-react';

export default function TemplateSelection() {
  const navigate = useNavigate();
  const [showCustomSetup, setShowCustomSetup] = useState(false);
  const [customStages, setCustomStages] = useState(3);

  const handleTemplateSelect = (templateId: string) => {
    navigate(`/new-project?template=${templateId}`);
  };

  const handleCustomProjectClick = () => {
    setShowCustomSetup(true);
  };

  const handleCustomProjectContinue = () => {
    navigate(`/new-project?custom=${customStages}`);
  };

  const incrementStages = () => {
    setCustomStages(prev => Math.min(6, prev + 1));
  };

  const decrementStages = () => {
    setCustomStages(prev => Math.max(2, prev - 1));
  };

  return (
    <div className="min-h-screen bg-secondary-bg">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-4 sm:py-6 space-y-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {!showCustomSetup ? (
          <>
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-3">
                Choose a Project Template
              </h1>
              <p className="text-base text-text-secondary">
                Select a template to get started quickly
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 max-w-3xl mx-auto">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-primary hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl flex-shrink-0">{template.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-sm text-text-secondary mb-1">
                        {template.stages} stages + optional down payment
                      </p>
                      <p className="text-sm font-medium text-gray-700">
                        Total: ${template.typical.toLocaleString()} example
                      </p>
                    </div>
                  </div>
                </button>
              ))}

              <button
                onClick={handleCustomProjectClick}
                className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-primary hover:shadow-lg transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl flex-shrink-0">
                    <Settings className="w-10 h-10 text-gray-600 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
                      Custom Project
                    </h3>
                    <p className="text-sm text-text-secondary mb-1">
                      User defines 2-6 stages
                    </p>
                    <p className="text-sm font-medium text-gray-700">
                      All fields customizable
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </>
        ) : (
          <div className="max-w-md mx-auto">
            <button
              onClick={() => setShowCustomSetup(false)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group mb-8"
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              <span className="font-medium">Back to Templates</span>
            </button>

            <div className="bg-white rounded-xl p-8 border-2 border-primary shadow-lg">
              <h3 className="text-xl font-semibold text-text-primary mb-6 text-center">
                Custom Project Setup
              </h3>
              <div className="flex items-center justify-center gap-4 mb-6">
                <button
                  onClick={decrementStages}
                  disabled={customStages <= 2}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-gray-300 hover:border-primary hover:bg-primary hover:text-white transition-all disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:bg-transparent disabled:hover:text-current"
                  aria-label="Decrease Stages"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    min="2"
                    max="6"
                    value={customStages}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 2;
                      setCustomStages(Math.min(6, Math.max(2, value)));
                    }}
                    className="w-20 text-3xl font-bold text-center text-text-primary border-none outline-none focus:ring-2 focus:ring-primary rounded-lg py-1"
                  />
                  <span className="text-sm text-text-secondary mt-1">stages</span>
                </div>
                <button
                  onClick={incrementStages}
                  disabled={customStages >= 6}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-gray-300 hover:border-primary hover:bg-primary hover:text-white transition-all disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:bg-transparent disabled:hover:text-current"
                  aria-label="Increase Stages"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <Button onClick={handleCustomProjectContinue} className="w-full">
                Continue with {customStages} Stages
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
