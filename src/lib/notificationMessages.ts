interface Notification {
  priority: number;
  icon: string;
  text: string;
}

interface StageNotificationData {
  hasUnviewedPayment: boolean;
  hasUnviewedRevision: boolean;
  hasUnviewedApproval: boolean;
  unreadMessageCount: number;
}

export function getStageNotificationMessage(data: StageNotificationData, isMobile = false): string {
  const notifications: Notification[] = [];

  // 1. Revision requested (highest priority)
  if (data.hasUnviewedRevision) {
    notifications.push({
      priority: 1,
      icon: '⚠️',
      text: isMobile ? 'Revision' : 'Revision requested'
    });
  }

  // 2. Payment marked
  if (data.hasUnviewedPayment) {
    notifications.push({
      priority: 1,
      icon: '💰',
      text: isMobile ? 'Payment pending' : 'Payment marked - verify'
    });
  }

  // 3. Stage approved
  if (data.hasUnviewedApproval) {
    notifications.push({
      priority: 1,
      icon: '✅',
      text: isMobile ? 'Approved' : 'Stage approved - awaiting payment'
    });
  }

  // 4. New messages (lower priority)
  if (data.unreadMessageCount > 0) {
    const messageText = `${data.unreadMessageCount} ${isMobile ? 'message' : 'new message'}${data.unreadMessageCount > 1 ? 's' : ''}`;
    notifications.push({
      priority: 2,
      icon: '💬',
      text: messageText
    });
  }

  // Sort by priority (lower number = higher priority)
  notifications.sort((a, b) => a.priority - b.priority);

  // Format as "icon text • icon text"
  return notifications.map(n => `${n.icon} ${n.text}`).join(' • ');
}

export function getPrimaryNotification(data: StageNotificationData, stageName: string): string {
  // Return only the highest priority notification for dashboard cards
  if (data.hasUnviewedRevision) {
    return `⚠️ Revision on ${stageName}`;
  }
  if (data.hasUnviewedPayment) {
    return `💰 Payment marked on ${stageName}`;
  }
  if (data.hasUnviewedApproval) {
    return `✅ Approval on ${stageName}`;
  }
  if (data.unreadMessageCount > 0) {
    return `💬 ${data.unreadMessageCount} new message${data.unreadMessageCount > 1 ? 's' : ''} on ${stageName}`;
  }
  return '';
}
