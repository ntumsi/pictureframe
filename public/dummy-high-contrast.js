/**
 * Suppress high-contrast mode deprecation warnings in browsers
 * This script runs early and attempts to neutralize the deprecated APIs
 */
(function() {
  // Create dummy implementations of the deprecated APIs
  if (window.CSS && window.CSS.supports) {
    // Override CSS.supports for ms-high-contrast
    const originalSupports = window.CSS.supports;
    window.CSS.supports = function(property, value) {
      if (property && 
          (property.includes('-ms-high-contrast') || 
           (typeof value === 'string' && value.includes('-ms-high-contrast')))) {
        return false; // Pretend browser doesn't support this feature
      }
      return originalSupports.apply(this, arguments);
    };
  }
  
  // Add a forced-colors media query listener to replace high-contrast
  const mediaQueryList = window.matchMedia && window.matchMedia('(forced-colors: active)');
  if (mediaQueryList) {
    mediaQueryList.addEventListener('change', function(e) {
      document.documentElement.style.setProperty('--forced-colors-active', e.matches ? 'true' : 'false');
    });
    
    // Set initial value
    document.documentElement.style.setProperty('--forced-colors-active', 
      mediaQueryList.matches ? 'true' : 'false');
  }
  
  // Disable console deprecation warnings for high-contrast
  if (window.console && window.console.warn) {
    const originalWarn = window.console.warn;
    window.console.warn = function() {
      if (arguments.length > 0 && 
          typeof arguments[0] === 'string' && 
          arguments[0].includes('-ms-high-contrast')) {
        return; // Suppress the warning
      }
      return originalWarn.apply(this, arguments);
    };
  }
})();