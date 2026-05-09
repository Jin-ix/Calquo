/**
 * CALICO Cache Clearing Script
 * Version: 1.0.5
 * 
 * This script forcefully clears all caches and service workers
 * Run this when updates aren't showing after deployment
 */

(async function clearAllCache() {
  console.log('🧹 CALICO Cache Cleaner v1.0.5');
  console.log('================================');
  
  try {
    // 1. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`📋 Found ${registrations.length} service worker(s)`);
      
      for (const registration of registrations) {
        await registration.unregister();
        console.log('✅ Service worker unregistered');
      }
    }
    
    // 2. Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`📦 Found ${cacheNames.length} cache(s):`, cacheNames);
      
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log(`✅ Deleted cache: ${cacheName}`);
      }
    }
    
    // 3. Clear localStorage (preserve user session)
    const preserveKeys = ['auth_token', 'user_id', 'session'];
    const localStorageBackup = {};
    
    preserveKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) localStorageBackup[key] = value;
    });
    
    localStorage.clear();
    
    Object.entries(localStorageBackup).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    console.log('✅ LocalStorage cleared (session preserved)');
    
    // 4. Clear sessionStorage
    sessionStorage.clear();
    console.log('✅ SessionStorage cleared');
    
    // 5. Success message
    console.log('================================');
    console.log('✨ Cache cleared successfully!');
    console.log('🔄 Reloading page in 2 seconds...');
    
    setTimeout(() => {
      window.location.reload(true);
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    console.log('🔄 Attempting force reload anyway...');
    setTimeout(() => {
      window.location.reload(true);
    }, 1000);
  }
})();

// Export for manual use
window.clearCalicoCache = async function() {
  console.log('🧹 Manual cache clear initiated...');
  await clearAllCache();
};