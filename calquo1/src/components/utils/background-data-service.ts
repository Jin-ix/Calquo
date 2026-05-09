// Background data service to refresh data silently without affecting UI
export class BackgroundDataService {
  private static instance: BackgroundDataService;
  private refreshInterval: NodeJS.Timeout | null = null;
  private isRefreshing = false;

  static getInstance(): BackgroundDataService {
    if (!BackgroundDataService.instance) {
      BackgroundDataService.instance = new BackgroundDataService();
    }
    return BackgroundDataService.instance;
  }

  // Start background refresh service
  startBackgroundRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Refresh data every 5 minutes silently
    this.refreshInterval = setInterval(() => {
      this.silentRefresh();
    }, 300000); // 5 minutes

    console.log('Background data refresh service started');
  }

  // Stop background refresh service
  stopBackgroundRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // Silent refresh that doesn't affect UI
  private async silentRefresh(): Promise<void> {
    if (this.isRefreshing) return;
    
    this.isRefreshing = true;
    
    try {
      console.log('Background: Starting silent data refresh...');
      
      // Silently refresh categories
      await this.refreshCategoriesInBackground();
      
      // Silently refresh stock data if user is logged in
      await this.refreshStockInBackground();
      
      console.log('Background: Silent refresh completed');
    } catch (error) {
      console.log('Background: Silent refresh had some timeouts (this is normal)');
    } finally {
      this.isRefreshing = false;
    }
  }

  // Refresh categories in background
  private async refreshCategoriesInBackground(): Promise<void> {
    // Wrap everything in a safe promise that absolutely cannot reject
    try {
      const { categoryAPI } = await import('../../utils/api');
      
      // Use a timeout promise that resolves instead of rejects
      const timeoutPromise = new Promise<any>((resolve) => {
        setTimeout(() => resolve({ success: false, timeout: true }), 2000);
      });

      const apiPromise = categoryAPI.getCategories().catch(() => ({ success: false, error: true }));
      
      const response = await Promise.race([apiPromise, timeoutPromise]);

      if (response.success && response.categories && !response.fromFallback) {
        // Update localStorage cache
        const defaultCategories = [
          'T-Shirts', 'Shirts', 'Pants', 'Jeans', 'Dresses', 'Skirts', 
          'Jackets', 'Sweaters', 'Shorts', 'Activewear', 'Underwear', 'Accessories',
          'Baby Clothes', 'Kids Wear', 'School Uniforms', 'Sports Wear', 'Ethnic Wear'
        ];
        const mergedCategories = Array.from(new Set([...defaultCategories, ...response.categories]));
        localStorage.setItem('calico-categories', JSON.stringify(mergedCategories));
        console.log('Background: Categories cache updated');
      }
    } catch (error) {
      // Completely silent failure
    }
  }

  // Refresh stock data in background
  private async refreshStockInBackground(): Promise<void> {
    try {
      // Check if user is logged in
      const userString = localStorage.getItem('calico-auth-user');
      if (!userString) return;

      const user = JSON.parse(userString);
      if (!user?.company) return;

      const { stockAPI } = await import('../../utils/api');
      
      // Create timeout promises that resolve instead of reject
      const createTimeoutPromise = (ms: number) => new Promise<any>((resolve) => {
        setTimeout(() => resolve({ success: false, timeout: true }), ms);
      });
      
      // Refresh user stock silently
      const userStockPromise = stockAPI.getUserStock(user.company).catch(() => ({ success: false, error: true }));
      const userStockResponse = await Promise.race([userStockPromise, createTimeoutPromise(3000)]);

      if (userStockResponse.success && userStockResponse.stocks) {
        // Update localStorage cache
        localStorage.setItem(`userStock_${user.company}`, JSON.stringify(userStockResponse.stocks));
        localStorage.setItem(`userStock_${user.company}_timestamp`, Date.now().toString());
        console.log('Background: User stock cache updated');
      }

      // Refresh all stock silently (less frequently)
      if (Math.random() < 0.2) { // Only 20% of the time to reduce load
        const allStockPromise = stockAPI.getAllStock().catch(() => ({ success: false, error: true }));
        const allStockResponse = await Promise.race([allStockPromise, createTimeoutPromise(5000)]);

        if (allStockResponse.success && allStockResponse.stocks) {
          // Update localStorage cache
          localStorage.setItem('allStock_cache', JSON.stringify(allStockResponse.stocks));
          localStorage.setItem('allStock_cache_timestamp', Date.now().toString());
          console.log('Background: All stock cache updated');
        }
      }
    } catch (error) {
      // Silent failure is expected and OK
    }
  }

  // Manual refresh for user-triggered actions
  async manualRefresh(): Promise<void> {
    if (this.isRefreshing) return;
    
    console.log('Manual refresh requested');
    await this.silentRefresh();
  }
}

// Export singleton instance
export const backgroundDataService = BackgroundDataService.getInstance();