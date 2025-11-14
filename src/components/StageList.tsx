import StageCard from './StageCard';

interface Stage {
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
    purchased_at?: string;
    additional_revisions?: number;
    amount?: number;
    reference_code?: string;
    status?: string;
    marked_paid_at?: string;
    rejected_at?: string;
    rejection_reason?: string;
  }>;
}

interface StageListProps {
  stages: Stage[];
  readOnly?: boolean;
  showNoteBox?: boolean;
  authorType?: 'freelancer' | 'client';
  authorName?: string;
  projectId?: string;
  shareCode?: string;
  paymentMethods?: {
    paypal?: string;
    venmo?: string;
    bank_transfer?: string;
    other?: string;
  };
}

export default function StageList({ stages, readOnly = false, showNoteBox = false, authorType = 'client', authorName, projectId, shareCode, paymentMethods }: StageListProps) {
  if (!stages || stages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-base text-gray-600">No stages available for this project.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-gray-900">Project Stages</h2>
      <div className="space-y-8 sm:space-y-12">
        {stages.map((stage, index) => (
          <div
            key={stage.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <StageCard
              stage={stage}
              readOnly={readOnly}
              showNoteBox={showNoteBox}
              authorType={authorType}
              authorName={authorName}
              projectId={projectId}
              shareCode={shareCode}
              paymentMethods={paymentMethods}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
