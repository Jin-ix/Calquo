// Utility for protecting against message timeout errors
export class MessageTimeoutProtection {
  private static pendingMessages = new Map<string, NodeJS.Timeout>();
  private static messageCounter = 0;

  // Wrap message operations with timeout protection
  static withMessageTimeout<T>(
    messageOperation: () => Promise<T>,
    timeoutMs: number = 25000,
    messageType: string = 'unknown'
  ): Promise<T> {
    const messageId = `${messageType}_${++this.messageCounter}`;
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingMessages.delete(messageId);
        reject(new Error(`Message ${messageType} (id: ${messageId}) response timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingMessages.set(messageId, timeoutId);

      messageOperation()
        .then(result => {
          const timeout = this.pendingMessages.get(messageId);
          if (timeout) {
            clearTimeout(timeout);
            this.pendingMessages.delete(messageId);
          }
          resolve(result);
        })
        .catch(error => {
          const timeout = this.pendingMessages.get(messageId);
          if (timeout) {
            clearTimeout(timeout);
            this.pendingMessages.delete(messageId);
          }
          reject(error);
        });
    });
  }

  // Clear all pending messages
  static clearAllPendingMessages(): void {
    this.pendingMessages.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    this.pendingMessages.clear();
    console.log('[MessageTimeoutProtection] Cleared all pending messages');
  }

  // Get pending message count
  static getPendingMessageCount(): number {
    return this.pendingMessages.size;
  }

  // Service Worker communication with timeout protection
  static postMessageToServiceWorker(
    message: any,
    timeoutMs: number = 25000
  ): Promise<any> {
    return this.withMessageTimeout(
      () => new Promise((resolve, reject) => {
        if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
          reject(new Error('Service Worker not available'));
          return;
        }

        const channel = new MessageChannel();
        const messageId = `sw_${++this.messageCounter}`;

        channel.port1.onmessage = (event) => {
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data);
          }
        };

        navigator.serviceWorker.controller.postMessage(
          { ...message, messageId },
          [channel.port2]
        );
      }),
      timeoutMs,
      'serviceWorker'
    );
  }

  // Page message handling with timeout protection
  static handlePageMessage<T>(
    messageType: string,
    handler: () => Promise<T>,
    timeoutMs: number = 25000
  ): Promise<T> {
    return this.withMessageTimeout(
      handler,
      timeoutMs,
      `page_${messageType}`
    );
  }
}

// Global cleanup function for emergency situations
export function emergencyMessageCleanup(): void {
  try {
    MessageTimeoutProtection.clearAllPendingMessages();
    
    // Clear service worker messages if possible
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_PENDING_MESSAGES'
      });
    }
    
    console.log('[EmergencyCleanup] Cleared all message timeouts');
  } catch (error) {
    console.error('[EmergencyCleanup] Error during cleanup:', error);
  }
}

// Hook for React components to handle message timeouts
export function useMessageTimeoutProtection() {
  const clearMessages = () => {
    MessageTimeoutProtection.clearAllPendingMessages();
  };

  const getPendingCount = () => {
    return MessageTimeoutProtection.getPendingMessageCount();
  };

  const postToServiceWorker = (message: any, timeout?: number) => {
    return MessageTimeoutProtection.postMessageToServiceWorker(message, timeout);
  };

  return {
    clearMessages,
    getPendingCount,
    postToServiceWorker,
    handlePageMessage: MessageTimeoutProtection.handlePageMessage
  };
}