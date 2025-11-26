import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Card from './Card';
import Button from './Button';
import { Mail, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency, type CurrencyCode } from '../lib/currency';
import toast from 'react-hot-toast';

interface UnpaidStage {
  id: string;
  stage_number: number;
  name: string;
  amount: number;
  delivered_at: string | null;
  approved_at: string | null;
  project_id: string;
  project_name: string;
  client_name: string;
  client_email: string;
  currency: CurrencyCode;
  days_since_action: number;
  status_text: string;
  reminder_type: 'review' | 'payment';
  reminder_count: number;
  last_sent_at: string | null;
}

interface PaymentTrackerProps {
  userId: string;
}

export default function PaymentTracker({ userId }: PaymentTrackerProps) {
  const [unpaidStages, setUnpaidStages] = useState<UnpaidStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchUnpaidStages();
  }, [userId]);

  const fetchUnpaidStages = async () => {
    try {
      setLoading(true);

      // Query projects with stages that need attention
      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          id,
          project_name,
          client_name,
          client_email,
          currency,
          stages!stages_project_id_fkey (
            id,
            stage_number,
            name,
            amount,
            status,
            payment_status,
            approved_at,
            delivered_at,
            stage_reminders (
              reminder_count,
              last_sent_at,
              reminder_type
            )
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      // Filter and flatten stages that need attention
      const unpaid: UnpaidStage[] = [];

      projects?.forEach((project: any) => {
        const stages = project.stages || [];
        
        stages.forEach((stage: any) => {
          // Show stage if:
          // 1. Work has been delivered (status = delivered/payment_pending)
          // 2. Payment not received yet
          // 3. Not locked/completed
          
          const isDelivered = stage.status === 'delivered' || 
                            stage.status === 'payment_pending' ||
                            stage.status === 'awaiting_review';
          
          const isNotPaid = stage.payment_status !== 'received';
          
          const isNotComplete = stage.status !== 'locked' && 
                               stage.status !== 'complete' && 
                               stage.status !== 'completed';

          if (isDelivered && isNotPaid && isNotComplete) {
            // Determine what kind of reminder this needs
            const hasApproved = !!stage.approved_at;
            const reminderType = hasApproved ? 'payment' : 'review';
            
            // Calculate days since action (either approved or delivered)
            // Use delivered_at if available, otherwise skip this stage
            if (!stage.delivered_at && !hasApproved) {
              return; // Skip stages with no delivery date
            }
            
            const referenceDate = hasApproved 
              ? new Date(stage.approved_at) 
              : new Date(stage.delivered_at);
            
            const daysSince = Math.floor(
              (new Date().getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            // Create status text
            const statusText = hasApproved 
              ? `Approved ${daysSince} day${daysSince !== 1 ? 's' : ''} ago`
              : `Delivered ${daysSince} day${daysSince !== 1 ? 's' : ''} ago`;

            // Get reminder tracking data
            const reminderData = stage.stage_reminders?.[0] || null;
            const reminderCount = reminderData?.reminder_count || 0;
            const lastSentAt = reminderData?.last_sent_at || null;

            unpaid.push({
              id: stage.id,
              stage_number: stage.stage_number,
              name: stage.name,
              amount: stage.amount,
              delivered_at: stage.delivered_at,
              approved_at: stage.approved_at,
              project_id: project.id,
              project_name: project.project_name,
              client_name: project.client_name,
              client_email: project.client_email,
              currency: project.currency || 'USD',
              days_since_action: daysSince,
              status_text: statusText,
              reminder_type: reminderType,
              reminder_count: reminderCount,
              last_sent_at: lastSentAt,
            });
          }
        });
      });

      // Sort by days since action (oldest first)
      unpaid.sort((a, b) => b.days_since_action - a.days_since_action);

      setUnpaidStages(unpaid);
    } catch (error) {
      console.error('Error fetching unpaid stages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemindClient = async (stage: UnpaidStage) => {
    try {
      // Check if limit reached
      if (stage.reminder_count >= 3) {
        toast.error('Reminder limit reached (3/3). Please contact client directly.');
        return;
      }

      // Check 48 hour cooldown
      if (stage.last_sent_at) {
        const hoursSinceLastSend = (new Date().getTime() - new Date(stage.last_sent_at).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastSend < 48) {
          const hoursRemaining = Math.ceil(48 - hoursSinceLastSend);
          toast.error(`Please wait ${hoursRemaining} hours before sending another reminder.`);
          return;
        }
      }

      setSendingReminder(stage.id);

      // Call the appropriate function based on reminder type
      const functionName = stage.reminder_type === 'review' 
        ? 'send-review-reminder' 
        : 'send-payment-reminder';

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          to_email: stage.client_email,
          client_name: stage.client_name,
          project_name: stage.project_name,
          stage_name: stage.name,
          amount: stage.amount,
          currency: stage.currency,
          freelancer_name: 'Freelancer', // We'll enhance this later
          days_overdue: stage.days_since_action,
        },
      });

      if (error) throw error;

      // Update or insert reminder tracking
      const newCount = stage.reminder_count + 1;
      const { error: trackError } = await supabase
        .from('stage_reminders')
        .upsert({
          stage_id: stage.id,
          reminder_count: newCount,
          last_sent_at: new Date().toISOString(),
          reminder_type: stage.reminder_type,
        }, {
          onConflict: 'stage_id'
        });

      if (trackError) {
        console.error('Error tracking reminder:', trackError);
        // Don't fail the whole operation if tracking fails
      }

      toast.success(`Reminder sent to ${stage.client_name} (${newCount}/3 used)`);
      
      // Refresh the list
      fetchUnpaidStages();
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      toast.error(error.message || 'Failed to send reminder');
    } finally {
      setSendingReminder(null);
    }
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (unpaidStages.length === 0) {
    return null; // Don't show section if no unpaid stages
  }

  return (
    <Card className="border-2 border-orange-200 bg-orange-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between hover:bg-orange-100 transition-colors rounded-lg p-1 -m-1"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-bold text-gray-900">
              Payment Tracker
            </h2>
            <p className="text-sm text-gray-600">
              {unpaidStages.length} stage{unpaidStages.length !== 1 ? 's' : ''} need{unpaidStages.length === 1 ? 's' : ''} attention
            </p>
          </div>
        </div>
        <div className="text-gray-600">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-3 mt-4">
        {unpaidStages.map((stage) => {
          // Check if can send reminder
          const limitReached = stage.reminder_count >= 3;
          const hoursRemaining = stage.last_sent_at 
            ? Math.ceil(48 - (new Date().getTime() - new Date(stage.last_sent_at).getTime()) / (1000 * 60 * 60))
            : 0;
          const onCooldown = hoursRemaining > 0;
          const canSend = !limitReached && !onCooldown;
          
          return (
            <div
              key={stage.id}
              className="bg-white rounded-lg p-4 border-2 border-orange-300 hover:border-orange-400 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {stage.project_name} - {stage.client_name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Stage {stage.stage_number}: {stage.name} • {formatCurrency(stage.amount, stage.currency)}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-3 h-3" />
                      {stage.status_text}
                    </span>
                    <span className="text-orange-600 font-medium">
                      {stage.reminder_type === 'review' ? 'Waiting for review' : 'Payment pending'}
                    </span>
                  </div>
                  
                  {/* Reminder status */}
                  <div className="mt-2 text-xs">
                    {limitReached ? (
                      <span className="text-red-600 font-medium">
                        All reminders used (3/3) • Contact client directly
                      </span>
                    ) : onCooldown ? (
                      <span className="text-gray-500">
                        Reminder sent • Next available in {hoursRemaining}h
                      </span>
                    ) : stage.reminder_count > 0 ? (
                      <span className="text-gray-600">
                        {stage.reminder_count}/3 reminders used
                      </span>
                    ) : null}
                  </div>
                </div>

                {!limitReached && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleRemindClient(stage)}
                    disabled={sendingReminder === stage.id || !canSend}
                    className="whitespace-nowrap"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {sendingReminder === stage.id ? 'Sending...' : `Remind Client ${stage.reminder_count > 0 ? `(${stage.reminder_count}/3)` : ''}`}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </Card>
  );
}
