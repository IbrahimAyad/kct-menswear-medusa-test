'use client';

import { useEffect } from 'react';

export const ServiceWorkerUnregister = () => {
  useEffect(() => {
    // Unregister all service workers
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister().then((success) => {
            if (success) {
              console.log('Service worker unregistered successfully');
            }
          });
        }
      });
      
      // Clear all caches
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name);
          });
        });
      }
    }
  }, []);

  return null;
};