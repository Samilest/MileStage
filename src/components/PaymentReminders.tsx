import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Card from './Card';
import Button from './Button';
import { Mail, Clock, DollarSign } from 'lucide-react';
import { formatCurrency, type CurrencyCode } from '../lib/currency';
import toast from 'react-hot-toast';

interface UnpaidStage {
  id: string;
  stage_number: number;
  name: string;
  amount: number;
  approved_at: string;
  project_id: string;
  project_name: string;
  client_name: string;
  client_email: string;
  currency: CurrencyCode;
  freelancer_name: string;
  days_since_approved: number;
}

interface PaymentRemindersProps {
  userId: string;
}

export default function PaymentReminders({ userId }: PaymentRemindersProps) {
  const [unpaidStages, setUnpaidStages] = useState<UnpaidStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  useEffect(() => {
    fetchUnpaidStages();
  }, [userId]);

  const fetchUnpaidStages = async () => {
    try {
      setLoading(true);

      // Query projects with stages that are approved but unpaid
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
            approved_at
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      // Filter and flatten stages that need payment reminders
      const unpaid: UnpaidStage[] = [];

      projects?.forEach((project: any) => {
        const stages = project.stages || [];
        
        stages.forEach((stage: any) => {
          // Only include stages that are:
          // 1. Approved (has approved_at)
          // 2. Payment pending (payment_status !== 'received')
          // 3. Not locked/completed
          if (
            stage.approved_at &&
            stage.payment_status !== 'received' &&
            stage.status !== 'locked' &&
            stage.status !== 'complete' &&
            stage.status !== 'completed'
          ) {
            const daysSince = Math.floor(
              (new Date().getTime() - new Date(stage.approved_at).getTime()) / (1000 * 60 * 60 * 24)
            );

            unpaid.push({
              id: stage.id,
              stage_number: stage.stage_number,
              name: stage.name,
              amount: stage.amount,
              approved_at: stage.approved_at,
              project_id: project.id,
              project_name: project.project_name,
              client_name: project.client_name,
              client_email: project.client_email,
              currency: project.currency || 'USD',
              freelancer_name: 'Freelancer', // We'll get this from user state instead
              days_since_approved: daysSince,
            });
          }
        });
      });

      // Sort by days since approved (oldest first)
      unpaid.sort((a, b) => b.days_since_approved - a.days_since_approved);

      setUnpaidStages(unpaid);
    } catch (error) {
      console.error('Error fetching unpaid stages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (stage: UnpaidStage) => {
    try {
      setSendingReminder(stage.id);

      // Call Supabase Edge Function to send email
      const { data, error } = await supabase.functions.invoke('send-payment-reminder', {
        body: {
          to_email: stage.client_email,
          client_name: stage.client_name,
          project_name: stage.project_name,
          stage_name: stage.name,
          amount: stage.amount,
          currency: stage.currency,
          freelancer_name: stage.freelancer_name,
          days_overdue: stage.days_since_approved,
        },
      });

      if (error) throw error;

      toast.success(`Payment reminder sent to ${stage.client_name}`);
      
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Payment Reminders
            </h2>
            <p className="text-sm text-gray-600">
              {unpaidStages.length} stage{unpaidStages.length !== 1 ? 's' : ''} awaiting payment
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {unpaidStages.map((stage) => (
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
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Approved {stage.days_since_approved} day{stage.days_since_approved !== 1 ? 's' : ''} ago
                  </span>
                  <span className={`font-semibold ${
                    stage.days_since_approved >= 14 ? 'text-red-600' :
                    stage.days_since_approved >= 7 ? 'text-orange-600' :
                    'text-yellow-600'
                  }`}>
                    {stage.days_since_approved >= 14 ? 'Urgent' :
                     stage.days_since_approved >= 7 ? 'Overdue' :
                     'Pending'}
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSendReminder(stage)}
                disabled={sendingReminder === stage.id}
                className="whitespace-nowrap"
              >
                <Mail className="w-4 h-4 mr-2" />
                {sendingReminder === stage.id ? 'Sending...' : 'Send Reminder'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
