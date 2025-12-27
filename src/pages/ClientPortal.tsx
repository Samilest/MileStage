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
    offline_instructions?: string;
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

      // Record that client viewed the portal (only if not logged in as freelancer)
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[ClientPortal] Session check:', session ? 'Logged in' : 'Not logged in');
      
      if (!session) {
        // No logged-in user = this is a client viewing
        console.log('[ClientPortal] Attempting to update client_last_viewed_at...');
        const { data: updateData, error: updateError } = await supabase
          .from('projects')
          .update({ client_last_viewed_at: new Date().toISOString() })
          .eq('share_code', shareCode)
          .select();
        
        if (updateError) {
          console.error('[ClientPortal] Failed to record view:', updateError);
        } else {
          console.log('[ClientPortal] Recorded client view:', updateData);
        }
      } else {
        console.log('[ClientPortal] Freelancer viewing - not updating client_last_viewed_at');
      }

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
              <Link to="/powered-by" className="flex items-center hover:opacity-80 transition-opacity">
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
          manualPaymentInstructions={projectData.payment_methods?.offline_instructions}
        />
      </main>

      {/* Stripe Security Badge Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-8 py-6 mt-8 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Payments secured by</span>
            <svg className="h-5" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 01-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 013.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 01-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 01-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 00-4.1-1.06c-.86 0-1.44.25-1.44.9 0 1.85 6.29.97 6.29 5.88z" fill="#635BFF"/>
            </svg>
          </div>
          <div className="text-xs text-gray-500">
            All payments are encrypted and secure
          </div>
        </div>
      </footer>
    </div>
  );
}
