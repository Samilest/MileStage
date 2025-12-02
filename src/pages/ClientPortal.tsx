import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowUp, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import StageList from '../components/StageList';
import RealtimeStatus from '../components/RealtimeStatus';
import PaymentInfoBox from '../components/PaymentInfoBox';
import { formatCurrency, type CurrencyCode } from '../lib/currency';
import toast from 'react-hot-toast';
import logo from '../assets/milestage-logo.png';

interface ProjectData {
  id: string;
  project_name: string;
  client_name: string;
  client_email: string;
  total_amount: number;
  status: string;
  share_code: string;
  created_at: string;
  currency: CurrencyCode;
  payment_methods: {
    paypal?: string;
    venmo?: string;
    bank_transfer?: string;
    other?: string;
  };
  user_profiles: {
    name: string;
    email: string;
    subscription_tier: string;
  };
  stages: Array<{
    id: string;
    stage_number: number;
    name: string;
    amount: number;
    status: string;
    revisions_included: number;
    revisions_used: number;
    extension_enabled: boolean;
    extension_price: number;
    extension_purchased: boolean;
    payment_status: string;
    payment_received_at: string | null;
    deliverables: Array<{
      id: string;
      name: string;
      file_url: string;
      uploaded_at: string;
    }>;
    revisions: Array<{
      id: string;
      revision_number: number;
      feedback: string;
      status: string;
      created_at: string;
      completed_at: string | null;
    }>;
    extensions: Array<{
      id: string;
      purchased_at: string;
      additional_revisions: number;
    }>;
  }>;
}

export default function ClientPortal() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [searchParams] = useSearchParams();
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const paymentProcessedRef = useRef(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!shareCode) {
      console.error('[ClientPortal] No share code provided in URL');
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      console.log(`[ClientPortal] ${isRefresh ? 'Refreshing' : 'Loading'} project data...`);

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select(
          `
          *,
          user_profiles!projects_user_id_fkey (
            name,
            email,
            subscription_tier
          ),
          stages (
            *,
            deliverables (*),
            revisions (*),
            extensions (*)
          )
        `
        )
        .eq('share_code', shareCode)
        .maybeSingle();

      if (projectError) {
        console.error('[ClientPortal] Error fetching project:', projectError);
        setError('Could not load project. Please check the link.');
        return;
      }

      if (!project) {
        setError('Project not found. Please check the link.');
        return;
      }

      if (project.stages) {
        project.stages.sort((a: any, b: any) => a.stage_number - b.stage_number);
      }

      setProjectData(project as ProjectData);
      console.log('[ClientPortal] Project loaded successfully');

      if (isRefresh) {
        toast.success('Refreshed!');
      }
    } catch (err) {
      console.error('[ClientPortal] Unexpected error:', err);
      setError('An unexpected error occurred.');
      if (isRefresh) {
        toast.error('Failed to refresh. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [shareCode]);

  // Handle payment confirmation from Stripe redirect
  useEffect(() => {
    // Prevent double-processing
    if (paymentProcessedRef.current) return;

    const paymentIntent = searchParams.get('payment_intent');
    const redirectStatus = searchParams.get('redirect_status');
    const paymentConfirmed = searchParams.get('payment_confirmed');
    const paymentSuccess = searchParams.get('payment_success'); // Legacy param

    console.log('[ClientPortal] URL params:', {
      paymentIntent: paymentIntent?.slice(0, 20),
      redirectStatus,
      paymentConfirmed,
      paymentSuccess,
      stage: searchParams.get('stage'),
    });

    // Case 1: Payment was already confirmed by StripePaymentButton (no redirect scenario)
    if (paymentConfirmed === 'true') {
      paymentProcessedRef.current = true;
      console.log('[ClientPortal] Payment was confirmed inline (no redirect)');
      toast.success('Payment confirmed! Stage updated.');
      // Clean URL
      window.history.replaceState({}, '', `/client/${shareCode}`);
      // Clear any stored payment data
      sessionStorage.removeItem('pendingPayment');
      sessionStorage.removeItem('pendingPaymentStageId');
      sessionStorage.removeItem('pendingPaymentShareCode');
      // Refresh data to show updated stage
      setTimeout(() => loadData(true), 500);
      return;
    }

    // Case 2: Stripe redirected back after payment (3DS or always-redirect scenario)
    const isPaymentRedirect = 
      (paymentIntent && redirectStatus === 'succeeded') || 
      paymentSuccess === 'true';

    if (isPaymentRedirect) {
      paymentProcessedRef.current = true;
      console.log('[ClientPortal] Payment redirect detected, confirming...');

      // Try to get stageId from multiple sources (in order of reliability)
      let stageId = searchParams.get('stage');
      console.log('[ClientPortal] StageId from URL:', stageId);

      // Fallback 1: Check dedicated sessionStorage key
      if (!stageId) {
        stageId = sessionStorage.getItem('pendingPaymentStageId');
        console.log('[ClientPortal] StageId from pendingPaymentStageId:', stageId);
      }

      // Fallback 2: Check pendingPayment object
      if (!stageId) {
        const pendingPayment = sessionStorage.getItem('pendingPayment');
        if (pendingPayment) {
          try {
            const paymentData = JSON.parse(pendingPayment);
            stageId = paymentData.stageId;
            console.log('[ClientPortal] StageId from pendingPayment:', stageId);
          } catch (e) {
            console.error('[ClientPortal] Error parsing pending payment:', e);
          }
        }
      }

      if (stageId && paymentIntent) {
        console.log('[ClientPortal] Confirming payment with stageId:', stageId);

        fetch('/api/stripe/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: paymentIntent, stageId }),
        })
          .then(res => res.json())
          .then(data => {
            console.log('[ClientPortal] Payment confirmed:', data);
            if (data.success) {
              toast.success('Payment confirmed! Stage updated.');
            } else {
              // Payment might have already been processed
              console.log('[ClientPortal] Server response:', data);
              toast.success('Payment received!');
            }
          })
          .catch(err => {
            console.error('[ClientPortal] Confirmation error:', err);
            toast.error('Could not confirm payment status. Please refresh.');
          })
          .finally(() => {
            // Clean URL parameters
            window.history.replaceState({}, '', `/client/${shareCode}`);
            // Clear all session storage
            sessionStorage.removeItem('pendingPayment');
            sessionStorage.removeItem('pendingPaymentStageId');
            sessionStorage.removeItem('pendingPaymentShareCode');
            // Refresh project data
            setTimeout(() => loadData(true), 500);
          });
      } else if (stageId && !paymentIntent) {
        // Legacy: payment_success=true without payment_intent
        console.log('[ClientPortal] Legacy payment success detected');
        toast.success('Payment received! Updating...');
        window.history.replaceState({}, '', `/client/${shareCode}`);
        sessionStorage.removeItem('pendingPaymentStageId');
        sessionStorage.removeItem('pendingPaymentShareCode');
        setTimeout(() => loadData(true), 1000);
      } else {
        // No stageId found - payment succeeded but we can't confirm which stage
        console.error('[ClientPortal] No stageId found in URL or session storage');
        console.log('[ClientPortal] Available URL params:', Object.fromEntries(searchParams.entries()));

        // Show success anyway - the webhook should handle it
        toast.success('Payment received! Your stage will update shortly.');
        window.history.replaceState({}, '', `/client/${shareCode}`);
        sessionStorage.removeItem('pendingPayment');
        sessionStorage.removeItem('pendingPaymentStageId');
        sessionStorage.removeItem('pendingPaymentShareCode');
        // Refresh after a longer delay to give webhook time
        setTimeout(() => loadData(true), 2000);
      }
    }
  }, [searchParams, shareCode, loadData]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRefresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-bg flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !projectData) {
    return (
      <div className="min-h-screen bg-secondary-bg flex items-center justify-center px-4">
        <div className="text-center max-w-lg bg-white rounded-xl shadow-lg p-10">
          <div className="text-7xl mb-6">🔍</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Project Not Found</h1>
          <p className="text-base text-gray-600 mb-8">
            {error || 'The project you are looking for does not exist or the share link is invalid.'}
          </p>
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">Need help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              If you received this link from your freelancer, please contact them to get the correct project link.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium"
              >
                Try Again
              </button>
              <a
                href="mailto:support@example.com"
                className="px-6 py-2 bg-white border-2 border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-bg" ref={topRef}>
      {/* Navigation Header */}
      <nav className="bg-background border-b border-border mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img 
                  src={logo} 
                  alt="MileStage" 
                  className="h-12"
                />
              </Link>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm sm:text-base bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 hover:border-gray-400 focus:ring-gray-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh project data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Fixed bottom-right container for stacked elements */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 flex flex-col gap-3 items-end z-50">
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="bg-green-500 hover:bg-green-600 text-white w-12 h-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}
        <RealtimeStatus />
      </div>

      {/* Project Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
              {projectData.project_name}
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Client: {projectData.client_name}
            </p>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              Freelancer: {projectData.user_profiles.name}
            </p>
          </div>
          <div className="text-right flex-shrink-0 hidden sm:block">
            <div className="text-xs sm:text-sm text-gray-600">Total Project Value</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(projectData.total_amount, projectData.currency || 'USD')}</div>
          </div>
        </div>
        <div className="sm:hidden mt-3 text-center pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600">Total Project Value</div>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(projectData.total_amount, projectData.currency || 'USD')}</div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-4 sm:py-6">
        <PaymentInfoBox
          paymentMethods={projectData.payment_methods || {}}
          freelancerName={projectData.user_profiles.name}
        />
        <StageList
          stages={projectData.stages}
          readOnly={true}
          showNoteBox={true}
          authorType="client"
          authorName={projectData.client_name}
          projectId={projectData.id}
          shareCode={shareCode}
          paymentMethods={projectData.payment_methods || {}}
          currency={projectData.currency || 'USD'}
        />
      </main>
    </div>
  );
}
