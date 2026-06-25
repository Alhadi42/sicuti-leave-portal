/**
 * Production optimization utilities
 */

// Remove console logs in production
if (import.meta.env.PROD) {
  // Keep only error and warn for critical issues
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // Override console.log to be silent in production
  console.log = () => {};
  
  // Override console.info to be silent in production
  console.info = () => {};
  
  // Override console.debug to be silent in production
  console.debug = () => {};
  
  // Keep error and warn for critical issues
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
}

// Performance optimization
export const optimizeForProduction = () => {
  if (!import.meta.env.PROD) return;

  // Disable React DevTools in production
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = () => {};
  }

  // Optimize images
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (!img.loading) {
      img.loading = 'lazy';
    }
  });

  // Preload dihapus — manifest/favicon sudah di index.html;
  // preload dinamis tanpa crossorigin memicu warning di browser.
};

// Memory optimization
export const optimizeMemory = () => {
  if (!import.meta.env.PROD) return;

  // Clear unused event listeners periodically
  setInterval(() => {
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }, 300000); // Every 5 minutes
};

// Initialize production optimizations
if (import.meta.env.PROD) {
  optimizeForProduction();
  optimizeMemory();
} 