// First, declare the global dataLayer type
declare global {
    interface Window {
      dataLayer: any[];
      gtag?: (command: string, ...args: any[]) => void;
    }
  }
  
  export function trackPageView(url: string) {
    // Check if window and dataLayer exist
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'pageview',
        page: url,
      });
    }
  }