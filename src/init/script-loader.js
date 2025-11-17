/**
 * Script Loader
 * Dynamically loads JavaScript modules in correct order
 * Prevents script loading issues in HTMX applications
 */

class ScriptLoader {
  constructor() {
    this.loadedScripts = new Set();
    this.loadingPromises = new Map();
    this.baseUrl = this._getBaseUrl();

    console.log('🔧 ScriptLoader: Initialized');
  }

  /**
   * Get base URL for script loading
   * @private
   * @returns {string} Base URL
   */
  _getBaseUrl() {
    // If we're in a partial, calculate relative path to src/
    const currentPath = window.location.pathname;
    if (currentPath.includes('/partials/')) {
      return '../src/';
    }
    return './src/';
  }

  /**
   * Load a single script
   * @param {string} path - Script path relative to base
   * @returns {Promise<void>} Load promise
   */
  async loadScript(path) {
    // Check if already loaded
    if (this.loadedScripts.has(path)) {
      return Promise.resolve();
    }

    // Check if currently loading
    if (this.loadingPromises.has(path)) {
      return this.loadingPromises.get(path);
    }

    console.log(`📦 ScriptLoader: Loading ${path}`);

    const loadPromise = this._loadScriptElement(path);
    this.loadingPromises.set(path, loadPromise);

    try {
      await loadPromise;
      this.loadedScripts.add(path);
      this.loadingPromises.delete(path);
      console.log(`✅ ScriptLoader: Loaded ${path}`);
    } catch (error) {
      this.loadingPromises.delete(path);
      console.error(`❌ ScriptLoader: Failed to load ${path}:`, error);
      throw error;
    }
  }

  /**
   * Load multiple scripts in order
   * @param {string[]} paths - Array of script paths
   * @returns {Promise<void>} Load promise
   */
  async loadScripts(paths) {
    console.log('📦 ScriptLoader: Loading scripts:', paths);

    for (const path of paths) {
      await this.loadScript(path);
    }

    console.log('✅ ScriptLoader: All scripts loaded');
  }

  /**
   * Load scripts using script element
   * @private
   * @param {string} path - Script path
   * @returns {Promise<void>} Load promise
   */
  _loadScriptElement(path) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = this.baseUrl + path;
      script.async = false; // Important for order

      script.onload = () => {
        document.head.removeChild(script);
        resolve();
      };

      script.onerror = () => {
        document.head.removeChild(script);
        reject(new Error(`Failed to load script: ${path}`));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Check if a script is loaded
   * @param {string} path - Script path
   * @returns {boolean} True if loaded
   */
  isLoaded(path) {
    return this.loadedScripts.has(path);
  }

  /**
   * Reset loader (for testing)
   */
  reset() {
    this.loadedScripts.clear();
    this.loadingPromises.clear();
    console.log('🔄 ScriptLoader: Reset');
  }
}

/**
 * Initialize sembako page with proper dependency loading
 */
async function initializeSembakoPage() {
  try {
    // Prevent duplicate initialization
    if (window.sembakoPage && window.incentiveConfigPage && window.employeeIncentivePage) {
      console.log('🔄 Sembako pages already initialized, skipping...');
      return { sembakoPage: window.sembakoPage, incentiveConfigPage: window.incentiveConfigPage, employeeIncentivePage: window.employeeIncentivePage };
    }

    console.log('🚀 Initializing Sembako Page...');

    const loader = new ScriptLoader();

    // Load scripts in correct dependency order
    await loader.loadScripts([
      'core/event-bus.js',
      'core/api-client.js',
      'services/incentive-service.js',
      'core/modal-service.js',
      'components/base/pagination-component.js',
      'pages/sembako-page.js',
      'pages/incentive-config-page.js',
      'pages/employee-incentive-page.js'
    ]);

    // Wait for global objects to be available
    const requiredGlobals = ['EventBus', 'ApiClient', 'IncentiveService', 'ModalService', 'PaginationComponent', 'SembakoPage', 'IncentiveConfigPage', 'EmployeeIncentivePage'];
    await waitForGlobals(requiredGlobals);

    console.log('📦 All dependencies loaded, initializing page...');

    // Initialize the page
    const sembakoPage = new SembakoPage();
    await sembakoPage.initialize();

    // Make globally available
    window.sembakoPage = sembakoPage;

    // Initialize incentive config page
    const incentiveConfigPage = new IncentiveConfigPage();
    await incentiveConfigPage.initialize();
    window.incentiveConfigPage = incentiveConfigPage;

    // Initialize employee incentive page
    const employeeIncentivePage = new EmployeeIncentivePage();
    await employeeIncentivePage.initialize();
    window.employeeIncentivePage = employeeIncentivePage;

    // Setup refresh handlers for CRUD operations
    setupRefreshHandlers();

    console.log('✅ Sembako Page initialized successfully');
    console.log('✅ Incentive Config Page initialized successfully');
    console.log('✅ Employee Incentive Page initialized successfully');

    return { sembakoPage, incentiveConfigPage, employeeIncentivePage };

  } catch (error) {
    console.error('❌ Failed to initialize Sembako Page:', error);

    // Show user-friendly error
    const errorHtml = `
      <div class=\"alert alert-danger alert-dismissible fade show\" role=\"alert\">
        <strong>Error!</strong> Failed to initialize page: ${error.message}
        <button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"alert\"></button>
      </div>
    `;

    const container = document.querySelector('.container');
    if (container) {
      container.insertAdjacentHTML('afterbegin', errorHtml);
    } else {
      document.body.insertAdjacentHTML('afterbegin', errorHtml);
    }

    throw error;
  }
}

/**
 * Wait for global variables to be available
 * @param {string[]} varNames - Global variable names
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<void>} Promise that resolves when all variables are available
 */
function waitForGlobals(varNames, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkGlobals = () => {
      const allAvailable = varNames.every(name => typeof window[name] !== 'undefined');

      if (allAvailable) {
        console.log('✅ All global variables available:', varNames);
        resolve();
        return;
      }

      if (Date.now() - startTime > timeout) {
        const missing = varNames.filter(name => typeof window[name] === 'undefined');
        reject(new Error(`Timeout waiting for global variables: ${missing.join(', ')}`));
        return;
      }

      setTimeout(checkGlobals, 100);
    };

    checkGlobals();
  });
}

/**
 * Handle page refresh after CRUD operations
 */
function setupRefreshHandlers() {
  // Listen for successful CRUD operations
  if (window.eventBus) {
    window.eventBus.on(EventTypes.INCENTIVE_TYPE_CREATED, () => {
      if (window.navigationHeaderInstance) {
        console.log('🔄 Refreshing page after type creation...');
        window.navigationHeaderInstance.refreshCurrentPage();
      }
    });

    window.eventBus.on(EventTypes.INCENTIVE_TYPE_UPDATED, () => {
      if (window.navigationHeaderInstance) {
        console.log('🔄 Refreshing page after type update...');
        window.navigationHeaderInstance.refreshCurrentPage();
      }
    });

    window.eventBus.on(EventTypes.INCENTIVE_TYPE_DELETED, () => {
      if (window.navigationHeaderInstance) {
        console.log('🔄 Refreshing page after type deletion...');
        window.navigationHeaderInstance.refreshCurrentPage();
      }
    });

    // Employee incentive events
    window.eventBus.on(EventTypes.EMPLOYEE_INCENTIVE_CREATED, () => {
      if (window.navigationHeaderInstance) {
        console.log('🔄 Refreshing page after employee incentive creation...');
        window.navigationHeaderInstance.refreshCurrentPage();
      }
    });

    window.eventBus.on(EventTypes.EMPLOYEE_INCENTIVE_UPDATED, () => {
      if (window.navigationHeaderInstance) {
        console.log('🔄 Refreshing page after employee incentive update...');
        window.navigationHeaderInstance.refreshCurrentPage();
      }
    });

    window.eventBus.on(EventTypes.EMPLOYEE_INCENTIVE_DELETED, () => {
      if (window.navigationHeaderInstance) {
        console.log('🔄 Refreshing page after employee incentive deletion...');
        window.navigationHeaderInstance.refreshCurrentPage();
      }
    });
  }
}

/**
 * Handle HTMX content loading
 */
function handleHtmxLoading() {
  if (typeof htmx !== 'undefined') {
    htmx.on('htmx:afterSwap', function(evt) {
      if (evt.target.id === 'main-content') {
        console.log('🔄 HTMX content swapped, reinitializing...');

        // Give DOM time to settle
        setTimeout(() => {
          initializeSembakoPage().catch(console.error);
        }, 100);
      }
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ScriptLoader, initializeSembakoPage, waitForGlobals };
} else {
  window.ScriptLoader = ScriptLoader;
  window.initializeSembakoPage = initializeSembakoPage;
  window.waitForGlobals = waitForGlobals;
}

// Auto-initialize when DOM is ready - but only if not already initialized
if (!window.sembakoPageInitialized) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeSembakoPage().catch(console.error);
      handleHtmxLoading();
      window.sembakoPageInitialized = true;
    });
  } else {
    // Already loaded
    initializeSembakoPage().catch(console.error);
    handleHtmxLoading();
    window.sembakoPageInitialized = true;
  }
}