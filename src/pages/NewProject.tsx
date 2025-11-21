import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import Navigation from '../components/Navigation';
import Card from '../components/Card';
import Button from '../components/Button';
import { TEMPLATES, generateShareCode, Template } from '../lib/templates';
import { EditableStage, calculateTotal, getBudgetMatchStatus } from '../lib/stageCalculations';
import { CURRENCIES, formatCurrency, getCurrencySymbol, type CurrencyCode } from '../lib/currency';
import { ArrowLeft, Plus, Minus, Check, AlertTriangle, X, Loader2 } from 'lucide-react';

export default function NewProject() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useStore((state) => state.user);

  const templateId = searchParams.get('template');
  const customStagesCount = searchParams.get('custom');
  const isCustomProject = !!customStagesCount;

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [budgetReference, setBudgetReference] = useState(0);
  const [stagePercentages, setStagePercentages] = useState<number[]>([]);
  const [stages, setStages] = useState<EditableStage[]>([]);
  const [includeDownPayment, setIncludeDownPayment] = useState(false);
  const [downPaymentName, setDownPaymentName] = useState('Down Payment');
  const [downPaymentAmount, setDownPaymentAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({
    projectName: '',
    clientName: '',
    clientEmail: '',
    totalAmount: '',
    stages: [] as string[],
  });
  const [touched, setTouched] = useState({
    projectName: false,
    clientName: false,
    clientEmail: false,
    totalAmount: false,
  });

  useEffect(() => {
    console.log('[NewProject] Component mounted/updated');
    console.log('[NewProject] User State:', user ? { id: user.id, email: user.email } : 'No user');
    console.log('[NewProject] Template ID:', templateId);
    console.log('[NewProject] Custom Stages Count:', customStagesCount);

    if (!user) {
      console.warn('[NewProject] WARNING: No user found in state');
    }

    if (templateId) {
      const template = TEMPLATES.find((t) => t.id === templateId);
      if (template) {
        console.log('[NewProject] Template found:', template.name);
        setSelectedTemplate(template);
        setBudgetReference(template.typical);
        const percentages = template.config.map((s) => s.pct);
        setStagePercentages(percentages);
        initializeTemplateStages(template, template.typical);
        setIncludeDownPayment(true);
        const downPaymentPercent = template.id === 'graphic-brand' ? 25 : template.id === 'web-dev' ? 30 : 25;
        setDownPaymentAmount(Math.round((template.typical * downPaymentPercent) / 100));
      } else {
        console.error('[NewProject] Template not found for ID:', templateId);
      }
    } else if (customStagesCount) {
      const stageCount = parseInt(customStagesCount);
      console.log('[NewProject] Custom project with', stageCount, 'stages');
      setSelectedTemplate({
        id: 'custom',
        name: 'Custom Project',
        emoji: '⚙️',
        stages: stageCount,
        typical: 0,
        config: [],
      });
      initializeCustomStages(stageCount);
      setIncludeDownPayment(false);
    }
  }, [templateId, customStagesCount, user]);

  const initializeTemplateStages = (template: Template, budget: number) => {
    const initialStages: EditableStage[] = template.config.map((stage) => ({
      name: stage.name,
      amount: Math.round((budget * stage.pct) / 100),
      revisions: stage.revisions,
      extensionPrice: Math.round((budget * stage.pct * stage.extPct) / 10000),
    }));
    setStages(initialStages);
  };

  const initializeCustomStages = (count: number) => {
    const customStages: EditableStage[] = Array.from({ length: count }, (_, i) => ({
      name: `Stage ${i + 1}`,
      amount: 0,
      revisions: 2,
      extensionPrice: 0,
    }));
    setStages(customStages);
  };

  const validateProjectName = (value: string): string => {
    if (!value) return 'Project Name is required';
    if (value.length < 3) return 'Project Name must be at least 3 characters';
    return '';
  };

  const validateClientName = (value: string): string => {
    if (!value) return 'Client Name is required';
    if (value.length < 2) return 'Client Name must be at least 2 characters';
    return '';
  };

  const validateClientEmail = (value: string): string => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return '';
  };

  const validateTotalAmount = (total: number, reference: number): string => {
    if (total <= 0) return `Total amount must be greater than ${getCurrencySymbol(currency)}0`;
    if (!isCustomProject) {
      const diff = Math.abs(total - reference);
      if (diff > 100) {
        return `Total differs from budget by ${formatCurrency(diff, currency)} (must be within ${getCurrencySymbol(currency)}100)`;
      }
    }
    return '';
  };

  const validateStageAmount = (amount: number): string => {
    if (amount <= 0) return `Stage amount must be greater than ${getCurrencySymbol(currency)}0`;
    return '';
  };

  useEffect(() => {
    const newErrors = { ...errors };

    if (touched.projectName) {
      newErrors.projectName = validateProjectName(projectName);
    }
    if (touched.clientName) {
      newErrors.clientName = validateClientName(clientName);
    }
    if (touched.clientEmail) {
      newErrors.clientEmail = validateClientEmail(clientEmail);
    }

    const stagesTotal = calculateTotal(stages);
    const fullTotal = stagesTotal + (includeDownPayment ? downPaymentAmount : 0);
    newErrors.totalAmount = validateTotalAmount(fullTotal, budgetReference);
    newErrors.stages = stages.map(s => validateStageAmount(s.amount));

    setErrors(newErrors);
  }, [projectName, clientName, clientEmail, stages, budgetReference, touched, includeDownPayment, downPaymentAmount]);

  const handleBudgetReferenceChange = (newBudget: number) => {
    setBudgetReference(newBudget);
    if (!isCustomProject && newBudget > 0 && stagePercentages.length > 0) {
      const rescaled = stages.map((stage, index) => ({
        ...stage,
        amount: Math.round((newBudget * stagePercentages[index]) / 100),
      }));
      setStages(rescaled);

      if (includeDownPayment && selectedTemplate) {
        const downPaymentPercent = selectedTemplate.id === 'graphic-brand' ? 25 : selectedTemplate.id === 'web-dev' ? 30 : 25;
        setDownPaymentAmount(Math.round((newBudget * downPaymentPercent) / 100));
      }
    }
  };

  const handleAmountChange = (index: number, newAmount: number) => {
    const updated = [...stages];
    updated[index].amount = Math.max(0, newAmount);
    setStages(updated);
  };

  const handleStageNameChange = (index: number, newName: string) => {
    const updated = [...stages];
    updated[index].name = newName;
    setStages(updated);
  };

  const handleRevisionsChange = (index: number, newRevisions: number) => {
    const updated = [...stages];
    updated[index].revisions = Math.max(0, Math.min(10, newRevisions));
    setStages(updated);
  };

  const handleExtensionPriceChange = (index: number, newPrice: number) => {
    const updated = [...stages];
    updated[index].extensionPrice = Math.max(0, newPrice);
    setStages(updated);
  };

  const handleAddStage = () => {
    setStages([
      ...stages,
      {
        name: `Stage ${stages.length + 1}`,
        amount: 0,
        revisions: 2,
        extensionPrice: 0,
      },
    ]);
  };

  const handleRemoveStage = (index: number) => {
    if (stages.length <= 2) return;
    const updated = stages.filter((_, i) => i !== index);
    setStages(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    console.log('[NewProject] ===== Starting form submission =====');
    console.log('[NewProject] User ID:', user?.id);
    console.log('[NewProject] User Email:', user?.email);
    console.log('[NewProject] Project Name:', projectName);
    console.log('[NewProject] Client Name:', clientName);
    console.log('[NewProject] Client Email:', clientEmail);
    console.log('[NewProject] Stages Count:', stages.length);
    console.log('[NewProject] Include Down Payment:', includeDownPayment);
    console.log('[NewProject] Can Submit:', canSubmit);
    console.log('[NewProject] Has Validation Errors:', hasValidationErrors);

    if (!user?.id) {
      console.error('[NewProject] ERROR: No user ID found!');
      setError('You must be logged in to create a project');
      toast.error('Please log in to create a project');
      return;
    }

    if (!projectName || !clientName || !clientEmail) {
      console.error('[NewProject] ERROR: Missing required fields');
      console.error('[NewProject] Project Name:', projectName);
      console.error('[NewProject] Client Name:', clientName);
      console.error('[NewProject] Client Email:', clientEmail);
      setError('Please fill in all required fields (Project Name, Client Name, and Email)');
      toast.error('Please fill in all required fields');
      return;
    }

    const stagesTotal = calculateTotal(stages);
    const projectTotal = stagesTotal + (includeDownPayment ? downPaymentAmount : 0);
    console.log('[NewProject] Calculated Project Total:', projectTotal);
    console.log('[NewProject] Stages Total:', stagesTotal);
    console.log('[NewProject] Down Payment:', includeDownPayment ? downPaymentAmount : 0);

    if (projectTotal < 100) {
      console.error('[NewProject] ERROR: Project total too low:', projectTotal);
      setError(`Project total must be at least ${getCurrencySymbol(currency)}100`);
      toast.error(`Project total must be at least ${getCurrencySymbol(currency)}100`);
      return;
    }

    if (stages.some((s) => s.amount <= 0)) {
      console.error('[NewProject] ERROR: Some stages have invalid amounts');
      stages.forEach((s, i) => {
        if (s.amount <= 0) console.error(`[NewProject] Stage ${i + 1} amount:`, s.amount);
      });
      setError(`All stage amounts must be greater than ${getCurrencySymbol(currency)}0`);
      toast.error(`All stage amounts must be greater than ${getCurrencySymbol(currency)}0`);
      return;
    }

    if (!isCustomProject) {
      const matchStatus = getBudgetMatchStatus(projectTotal, budgetReference);
      console.log('[NewProject] Budget Match Status:', matchStatus);
      if (matchStatus === 'far') {
        console.error('[NewProject] ERROR: Budget mismatch - Total:', projectTotal, 'Reference:', budgetReference);
        setError('Total is too far from budget reference. Adjust stage amounts.');
        toast.error('Total is too far from budget reference');
        return;
      }
    }

    setLoading(true);
    const loadingToast = toast.loading('Creating your Project...');

    try {
      const shareCode = generateShareCode();

      console.log('[NewProject] Generated share code:', shareCode);
      console.log('[NewProject] Inserting project into database...');

      const projectInsertData = {
        user_id: user.id,
        name: projectName,
        project_name: projectName,
        client_name: clientName,
        client_email: clientEmail,
        share_code: shareCode,
        total_amount: projectTotal,
        status: 'active',
        template_used: selectedTemplate?.id || 'custom',
        currency: currency,
      };

      console.log('[NewProject] Project Insert Data:', JSON.stringify(projectInsertData, null, 2));

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert(projectInsertData)
        .select()
        .single();

      if (projectError) {
        console.error('[NewProject] ❌ Project creation error:', projectError);
        console.error('[NewProject] Error Details:', JSON.stringify(projectError, null, 2));
        throw projectError;
      }

      if (!projectData || !projectData.id) {
        console.error('[NewProject] ❌ No project data returned!');
        throw new Error('Project created but no data returned');
      }

      console.log('[NewProject] ✅ Project created successfully!');
      console.log('[NewProject] Project ID:', projectData.id);
      console.log('[NewProject] Project Data:', JSON.stringify(projectData, null, 2));

      const stagesData = [];

      if (includeDownPayment) {
        stagesData.push({
          project_id: projectData.id,
          stage_number: 0,
          name: downPaymentName,
          amount: downPaymentAmount,
          revisions_included: 0,
          extension_enabled: false,
          extension_price: 0,
          status: 'active',
          reference_code: `${shareCode}-S0`,
        });
      }

      stages.forEach((stage, index) => {
        stagesData.push({
          project_id: projectData.id,
          stage_number: index + 1,
          name: stage.name,
          amount: stage.amount,
          revisions_included: stage.revisions,
          extension_enabled: stage.extensionPrice > 0,
          extension_price: stage.extensionPrice,
          status: includeDownPayment ? 'locked' : (index === 0 ? 'active' : 'locked'),
          reference_code: `${shareCode}-S${index + 1}`,
        });
      });

      console.log('[NewProject] Preparing to insert', stagesData.length, 'stages');
      console.log('[NewProject] Stages Data:', JSON.stringify(stagesData, null, 2));

      const { data: insertedStages, error: stagesError } = await supabase
        .from('stages')
        .insert(stagesData)
        .select();

      if (stagesError) {
        console.error('[NewProject] ❌ Stages creation error:', stagesError);
        console.error('[NewProject] Error Details:', JSON.stringify(stagesError, null, 2));
        throw stagesError;
      }

      console.log('[NewProject] ✅ Stages inserted successfully!');
      console.log('[NewProject] Inserted Stages Count:', insertedStages?.length || 0);

      console.log('[NewProject] ===== ✅ SUCCESS: Project and stages created successfully! =====');
      toast.success('Project created successfully!', { id: loadingToast });
      console.log('[NewProject] Redirecting to dashboard...');
      setTimeout(() => {
        console.log('[NewProject] Navigating to /dashboard');
        navigate('/dashboard');
      }, 500);
    } catch (err: any) {
      console.error('[NewProject] ===== ❌ ERROR: Failed to create project =====');
      console.error('[NewProject] Error Type:', typeof err);
      console.error('[NewProject] Error Message:', err?.message);
      console.error('[NewProject] Error Details:', err?.details);
      console.error('[NewProject] Error Hint:', err?.hint);
      console.error('[NewProject] Error Code:', err?.code);
      console.error('[NewProject] Full Error:', JSON.stringify(err, null, 2));

      const errorMessage = err?.message || err?.details || 'Unknown error occurred';
      toast.error(`Failed to create project: ${errorMessage}`, { id: loadingToast });
      setError(`Failed to create project: ${errorMessage}`);
    } finally {
      console.log('[NewProject] Form submission completed. Loading state:', loading);
      setLoading(false);
    }
  };

  const stagesTotal = calculateTotal(stages);
  const projectTotal = stagesTotal + (includeDownPayment ? downPaymentAmount : 0);
  const matchStatus = !isCustomProject ? getBudgetMatchStatus(projectTotal, budgetReference) : null;
  const difference = !isCustomProject ? projectTotal - budgetReference : 0;

  const hasValidationErrors =
    errors.projectName !== '' ||
    errors.clientName !== '' ||
    errors.clientEmail !== '' ||
    errors.totalAmount !== '' ||
    errors.stages.some(e => e !== '');

  const canSubmit =
    !hasValidationErrors &&
    projectName.length >= 3 &&
    clientName.length >= 2 &&
    clientEmail.includes('@') &&
    projectTotal > 0 &&
    stages.every(s => s.amount > 0) &&
    (isCustomProject || matchStatus !== 'far');

  const getProjectNamePlaceholder = (): string => {
    if (!selectedTemplate) return 'My Project';
    switch (selectedTemplate.id) {
      case 'graphic-brand-design':
        return 'Brand Identity Project';
      case 'web-design-development':
        return 'Website Redesign Project';
      case 'content-creation':
        return 'Content Production Project';
      case 'custom':
        return 'My Project';
      default:
        return 'My Project';
    }
  };

  return (
    <div className="min-h-screen bg-secondary-bg">
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-4 sm:py-6 space-y-8">
        <button
          onClick={() => navigate('/templates')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Templates
        </button>

        <Card>
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">{selectedTemplate?.emoji}</span>
              <h1 className="text-3xl lg:text-5xl font-bold text-text-primary leading-tight">
                {selectedTemplate?.name}
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Project Info Section - Narrower for better UX */}
            <div className="max-w-2xl">
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                id="projectName"
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={() => setTouched({ ...touched, projectName: true })}
                className={`w-full h-12 px-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base ${
                  touched.projectName && errors.projectName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={getProjectNamePlaceholder()}
              />
              {touched.projectName && errors.projectName && (
                <p className="mt-1 text-sm text-red-600">{errors.projectName}</p>
              )}
            </div>

            <div>
              <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                id="clientName"
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                onBlur={() => setTouched({ ...touched, clientName: true })}
                className={`w-full h-12 px-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base ${
                  touched.clientName && errors.clientName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="John Smith"
              />
              {touched.clientName && errors.clientName && (
                <p className="mt-1 text-sm text-red-600">{errors.clientName}</p>
              )}
            </div>

            <div>
              <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Client Email <span className="text-red-500">*</span>
              </label>
              <input
                id="clientEmail"
                type="email"
                required
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                onBlur={() => setTouched({ ...touched, clientEmail: true })}
                className={`w-full h-12 px-4 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base ${
                  touched.clientEmail && errors.clientEmail ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="client@example.com"
              />
              {touched.clientEmail && errors.clientEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.clientEmail}</p>
              )}
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base bg-white"
              >
                {Object.entries(CURRENCIES).map(([code, info]) => (
                  <option key={code} value={code}>
                    {info.symbol} {code} - {info.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Select the currency you'll use for this project
              </p>
            </div>

            {!isCustomProject && (
              <div>
                <label htmlFor="budgetReference" className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Reference
                </label>
                <div className="stage-input-with-prefix">
                  <span>{getCurrencySymbol(currency)}</span>
                  <input
                    id="budgetReference"
                    type="number"
                    required
                    min="100"
                    step="1"
                    value={budgetReference}
                    onChange={(e) => handleBudgetReferenceChange(parseFloat(e.target.value) || 0)}
                    placeholder="2500"
                  />
                </div>
              </div>
            )}
            </div>
            {/* End Project Info Section */}

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDownPayment}
                    onChange={(e) => setIncludeDownPayment(e.target.checked)}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-base font-medium text-gray-900">Include Down Payment</span>
                </label>
              </div>

              {includeDownPayment && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="font-semibold text-gray-900 text-base">Stage 0: Down Payment</h4>
                    <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">Optional</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="downPaymentName" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Name
                      </label>
                      <input
                        id="downPaymentName"
                        type="text"
                        value={downPaymentName}
                        onChange={(e) => setDownPaymentName(e.target.value)}
                        className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base"
                        placeholder="Down Payment"
                      />
                    </div>

                    <div>
                      <label htmlFor="downPaymentAmount" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Amount
                      </label>
                      <div className="stage-input-with-prefix">
                        <span>{getCurrencySymbol(currency)}</span>
                        <input
                          id="downPaymentAmount"
                          type="number"
                          min="0"
                          step="1"
                          value={downPaymentAmount}
                          onChange={(e) => setDownPaymentAmount(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 bg-white p-3 rounded-lg">
                      <strong>Note:</strong> The down payment must be paid before Stage 1 unlocks. It does not include revisions.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6 space-y-4">
              {/* Pricing Guidance Box */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">Pricing Tip</p>
                    <p className="text-sm text-blue-800">
                      Keep extra revisions at 10-25% of each stage price. Fair pricing encourages client purchases.
                    </p>
                  </div>
                </div>
              </div>

              {stages.map((stage, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    {isCustomProject ? (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-medium text-gray-900 text-base whitespace-nowrap">
                          Stage {index + 1}:
                        </span>
                        <input
                          type="text"
                          value={stage.name}
                          onChange={(e) => handleStageNameChange(index, e.target.value)}
                          className="flex-1 min-w-0 h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base"
                          placeholder="Stage name"
                        />
                      </div>
                    ) : (
                      <h4 className="font-medium text-gray-900 text-base">
                        Stage {index + 1}: {stage.name}
                      </h4>
                    )}
                    {isCustomProject && stages.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStage(index)}
                        className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 flex-shrink-0"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="stage-input-grid">
                    <div className="stage-input-group">
                      <label
                        htmlFor={`amount-${index}`}
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                      >
                        Amount
                      </label>
                      <div className="stage-input-with-prefix">
                        <span>{getCurrencySymbol(currency)}</span>
                        <input
                          id={`amount-${index}`}
                          type="number"
                          min="0"
                          step="1"
                          value={stage.amount}
                          onChange={(e) => handleAmountChange(index, parseFloat(e.target.value) || 0)}
                          className={errors.stages[index] ? 'border-red-500' : ''}
                        />
                      </div>
                      {errors.stages[index] && (
                        <p className="mt-1 text-xs text-red-600">{errors.stages[index]}</p>
                      )}
                    </div>

                    <div className="stage-input-group">
                      <label
                        htmlFor={`revisions-${index}`}
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                      >
                        Revisions
                      </label>
                      <input
                        id={`revisions-${index}`}
                        type="number"
                        min="0"
                        max="10"
                        value={stage.revisions}
                        onChange={(e) => handleRevisionsChange(index, parseInt(e.target.value) || 0)}
                        className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base"
                      />
                    </div>

                    <div className="stage-input-group">
                      <label
                        htmlFor={`extension-${index}`}
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                      >
                        Extra Revision
                      </label>
                      <div className="stage-input-with-prefix">
                        <span>{getCurrencySymbol(currency)}</span>
                        <input
                          id={`extension-${index}`}
                          type="number"
                          min="0"
                          step="1"
                          value={stage.extensionPrice}
                          onChange={(e) =>
                            handleExtensionPriceChange(index, parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isCustomProject && (
                <button
                  type="button"
                  onClick={handleAddStage}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-text-secondary hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 text-base"
                >
                  <Plus className="w-5 h-5" />
                  Add Stage
                </button>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6">
              {!isCustomProject && matchStatus && (
                <div className="mb-4">
                  {matchStatus === 'exact' && (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                      <Check className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Budget: {formatCurrency(budgetReference, currency)}</div>
                        <div className="text-sm">Total: {formatCurrency(projectTotal, currency)}</div>
                      </div>
                    </div>
                  )}
                  {matchStatus === 'close' && (
                    <div className="flex items-center gap-2 text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Budget: {formatCurrency(budgetReference, currency)}</div>
                        <div className="text-sm">
                          Total: {formatCurrency(projectTotal, currency)} (
                          {difference > 0 ? `${formatCurrency(difference, currency)} over` : `${formatCurrency(Math.abs(difference), currency)} under`})
                        </div>
                        <div className="text-xs mt-1">Close enough</div>
                      </div>
                    </div>
                  )}
                  {matchStatus === 'far' && (
                    <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                      <X className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Budget: {formatCurrency(budgetReference, currency)}</div>
                        <div className="text-sm">
                          Total: {formatCurrency(projectTotal, currency)} (
                          {difference > 0 ? `${formatCurrency(difference, currency)} over` : `${formatCurrency(Math.abs(difference), currency)} under`})
                        </div>
                        <div className="text-xs mt-1">Adjust stages</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isCustomProject && (
                <div className="mb-6">
                  <div className={`flex justify-between items-center p-4 rounded-lg border-2 ${
                    errors.totalAmount ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <span className="text-lg font-semibold text-text-primary">Project Total</span>
                    <span className={`text-2xl font-bold ${
                      errors.totalAmount ? 'text-red-600' : 'text-primary'
                    }`}>
                      {formatCurrency(projectTotal, currency)}
                    </span>
                  </div>
                  {errors.totalAmount && (
                    <p className="mt-2 text-sm text-red-600">{errors.totalAmount}</p>
                  )}
                </div>
              )}

              {!canSubmit && !loading && (
                <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-900 mb-2">
                    Please complete the following:
                  </p>
                  <ul className="text-sm text-yellow-800 space-y-1.5">
                    {projectName.length < 3 && (
                      <li className="flex items-center gap-2">
                        <span className="text-yellow-600">•</span>
                        Project name must be at least 3 characters
                      </li>
                    )}
                    {clientName.length < 2 && (
                      <li className="flex items-center gap-2">
                        <span className="text-yellow-600">•</span>
                        Client name must be at least 2 characters
                      </li>
                    )}
                    {!clientEmail.includes('@') && (
                      <li className="flex items-center gap-2">
                        <span className="text-yellow-600">•</span>
                        Enter a valid client email
                      </li>
                    )}
                    {projectTotal <= 0 && (
                      <li className="flex items-center gap-2">
                        <span className="text-yellow-600">•</span>
                        Stage amounts must be greater than {getCurrencySymbol(currency)}0
                      </li>
                    )}
                    {stages.some(s => s.amount <= 0) && (
                      <li className="flex items-center gap-2">
                        <span className="text-yellow-600">•</span>
                        All stage amounts must be greater than {getCurrencySymbol(currency)}0
                      </li>
                    )}
                    {!isCustomProject && matchStatus === 'far' && (
                      <li className="flex items-center gap-2">
                        <span className="text-yellow-600">•</span>
                        Total must be within {getCurrencySymbol(currency)}100 of budget reference
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !canSubmit}
                className="w-full h-12 text-base flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? 'Creating project...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
