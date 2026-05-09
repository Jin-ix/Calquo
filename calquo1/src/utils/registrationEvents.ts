// Registration Event System
// This system allows different parts of the app to communicate about user registration events

export type RegistrationEvent = {
  type: 'user_registered' | 'user_updated' | 'user_deleted';
  userId: string;
  gstNumber: string;
  companyName: string;
  timestamp: number;
};

class RegistrationEventManager {
  private listeners: ((event: RegistrationEvent) => void)[] = [];

  // Subscribe to registration events
  subscribe(callback: (event: RegistrationEvent) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Emit a registration event
  emit(event: RegistrationEvent): void {
    console.log('Registration event emitted:', event);
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in registration event listener:', error);
      }
    });
  }

  // Helper methods for common events
  userRegistered(userId: string, gstNumber: string, companyName: string): void {
    this.emit({
      type: 'user_registered',
      userId,
      gstNumber,
      companyName,
      timestamp: Date.now()
    });
  }

  userUpdated(userId: string, gstNumber: string, companyName: string): void {
    this.emit({
      type: 'user_updated',
      userId,
      gstNumber,
      companyName,
      timestamp: Date.now()
    });
  }

  userDeleted(userId: string, gstNumber: string, companyName: string): void {
    this.emit({
      type: 'user_deleted',
      userId,
      gstNumber,
      companyName,
      timestamp: Date.now()
    });
  }
}

// Global instance
export const registrationEvents = new RegistrationEventManager();

// React hook for listening to registration events
import { useEffect, useRef } from 'react';

export function useRegistrationEvents(
  onEvent: (event: RegistrationEvent) => void,
  dependencies: any[] = []
): void {
  const callbackRef = useRef(onEvent);
  
  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = onEvent;
  }, dependencies);

  useEffect(() => {
    const unsubscribe = registrationEvents.subscribe((event) => {
      callbackRef.current(event);
    });

    return unsubscribe;
  }, []);
}