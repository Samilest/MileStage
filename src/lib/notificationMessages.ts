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
