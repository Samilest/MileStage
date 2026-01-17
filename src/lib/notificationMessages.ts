// Types for notification data
export interface StageNotificationData {
  hasUnviewedPayment: boolean;
  hasUnviewedRevision: boolean;
  hasUnviewedApproval: boolean;
  unreadMessageCount: number;
  hasUnviewedExtension?: boolean;
}

// Priority order for notifications:
// 1. Revision Request (highest priority - client needs something)
// 2. Payment Pending (money matters - needs verification)
// 3. Extension Pending (client bought extra revision)
// 4. Messages (client communication)
// 5. Approval (stage completed - informational)
export function getPrimaryNotification(data: StageNotificationData, stageName: string): string {
  // ⚠️ REVISION REQUEST - Highest Priority
  if (data.hasUnviewedRevision) {
    return `⚠️ Revision Requested`;
  }
  
  // 💰 PAYMENT - Second Priority (manual payment needs verification)
  if (data.hasUnviewedPayment) {
    return `💰 Payment Pending`;
  }
  
  // 💎 EXTENSION - Third Priority
  if (data.hasUnviewedExtension) {
    return `💎 Extension Purchased`;
  }
  
  // 💬 MESSAGES - Fourth Priority
  if (data.unreadMessageCount > 0) {
    return `💬 ${data.unreadMessageCount} new message${data.unreadMessageCount > 1 ? 's' : ''}`;
  }
  
  // ✅ APPROVAL - Lowest Priority (informational)
  if (data.hasUnviewedApproval) {
    return `✅ Approved`;
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
  
  // 3. New messages
  const unreadMessageCount = stage.stage_notes?.filter((note: any) =>
    note.author_type === 'client' && !note.viewed_by_freelancer_at
  ).length || 0;
  
  if (unreadMessageCount > 0) {
    notifications.push(`💬 ${unreadMessageCount} new message${unreadMessageCount > 1 ? 's' : ''}`);
  }
  
  // 4. Stage approved
  if (stage.approved_at && !stage.viewed_by_freelancer_at) {
    notifications.push('✅ Approved');
  }
  
  // Return the highest priority notification, or combine if multiple
  return notifications.length > 0 ? notifications[0] : '';
}
