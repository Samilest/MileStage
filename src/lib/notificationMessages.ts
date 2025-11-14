// Types for notification data
export interface StageNotificationData {
  hasUnviewedPayment: boolean;
  hasUnviewedRevision: boolean;
  hasUnviewedApproval: boolean;
  unreadMessageCount: number;
}

// Priority order for notifications:
// 1. Revision Request (highest priority - client needs something)
// 2. Payment Pending (money matters)
// 3. Approval (stage completed)
// 4. Messages (lowest priority)
export function getPrimaryNotification(data: StageNotificationData, stageName: string): string {
  // ⚠️ REVISION REQUEST - Highest Priority
  if (data.hasUnviewedRevision) {
    return `⚠️ Revision Requested`;
  }
  
  // 💰 PAYMENT - Second Priority
  if (data.hasUnviewedPayment) {
    return `💰 Payment Pending`;
  }
  
  // ✅ APPROVAL - Third Priority
  if (data.hasUnviewedApproval) {
    return `✅ Approved`;
  }
  
  // 💬 MESSAGES - Lowest Priority
  if (data.unreadMessageCount > 0) {
    return `💬 ${data.unreadMessageCount} new message${data.unreadMessageCount > 1 ? 's' : ''}`;
  }
  
  return '';
}

// Function for detailed stage notification messages (used in ProjectOverview)
export function getStageNotificationMessage(stage: any): string {
  const notifications: string[] = [];
  
  // 1. Revision requested (highest priority)
  if (stage.revisions?.some((rev: any) => rev.requested_at && !rev.viewed_by_freelancer_at)) {
    notifications.push('⚠️ Revision requested');
  }
  
  // 2. Payment marked
  if (stage.stage_payments?.some((payment: any) => 
    payment.status === 'marked_paid' && 
    payment.marked_paid_at && 
    !payment.viewed_by_freelancer_at
  )) {
    notifications.push('💰 Payment marked');
  }
  
  // 3. Stage approved
  if (stage.approved_at && !stage.viewed_by_freelancer_at) {
    notifications.push('✅ Approved');
  }
  
  // 4. New messages (lower priority)
  const unreadMessageCount = stage.stage_notes?.filter((note: any) =>
    note.author_type === 'client' && !note.viewed_by_freelancer_at
  ).length || 0;
  
  if (unreadMessageCount > 0) {
    notifications.push(`💬 ${unreadMessageCount} new message${unreadMessageCount > 1 ? 's' : ''}`);
  }
  
  // Return the highest priority notification, or combine if multiple
  return notifications.length > 0 ? notifications[0] : '';
}
