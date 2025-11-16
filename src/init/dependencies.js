/**
 * Dependencies Loader
 * Ensures all required services and dependencies are loaded before initialization
 * Follows Dependency Injection pattern
 */

class DependencyLoader {
  constructor() {
    this.dependencies = new Map();
    this.isInitialized = false;
    this.initPromises = new Map();

    console.log('🔧 DependencyLoader: Initialized');
  }

  /**
   * Register a dependency
   * @param {string} name - Dependency name
   * @param {Function|Object} dependency - Dependency constructor or instance
   * @param {Array} deps - Array of dependency names
   */
  register(name, dependency, deps = []) {
    this.dependencies.set(name, {
      constructor: dependency,
      deps,
      instance: null
    });

    console.log(`📋 DependencyLoader: Registered "${name}" with dependencies:`, deps);
  }

  /**
   * Get dependency instance
   * @param {string} name - Dependency name
   * @returns {Promise<Object>} Dependency instance
   */
  async get(name) {
    if (!this.dependencies.has(name)) {
      throw new Error(`Dependency "${name}" not registered`);
    }

    const dep = this.dependencies.get(name);
    if (dep.instance) {
      return dep.instance;
    }

    return this._initializeDependency(name);
  }

  /**
   * Initialize all dependencies
   * @returns {Promise<Object>} Object with all dependency instances
   */
  async initializeAll() {
    if (this.isInitialized) {
      return this._getAllInstances();
    }

    console.log('🚀 DependencyLoader: Initializing all dependencies...');

    const names = Array.from(this.dependencies.keys());
    const instances = {};

    // Initialize dependencies in dependency order
    for (const name of names) {
      instances[name] = await this.get(name);
    }

    this.isInitialized = true;
    console.log('✅ DependencyLoader: All dependencies initialized');

    return instances;
  }

  /**
   * Initialize a specific dependency
   * @private
   * @param {string} name - Dependency name
   * @returns {Promise<Object>} Dependency instance
   */
  async _initializeDependency(name) {
    // Check if already being initialized
    if (this.initPromises.has(name)) {
      return this.initPromises.get(name);
    }

    const dep = this.dependencies.get(name);
    if (dep.instance) {
      return dep.instance;
    }

    // Create initialization promise
    const initPromise = this._createDependency(name, dep);
    this.initPromises.set(name, initPromise);

    try {
      const instance = await initPromise;
      dep.instance = instance;
      this.initPromises.delete(name);
      return instance;
    } catch (error) {
      this.initPromises.delete(name);
      throw error;
    }
  }

  /**
   * Create dependency instance
   * @private
   * @param {string} name - Dependency name
   * @param {Object} dep - Dependency configuration
   * @returns {Promise<Object>} Dependency instance
   */
  async _createDependency(name, dep) {
    try {
      console.log(`🔧 DependencyLoader: Creating "${name}"...`);

      // Initialize dependencies first
      const depsInstances = {};
      for (const depName of dep.deps) {
        depsInstances[depName] = await this.get(depName);
      }

      // Create instance
      let instance;
      if (typeof dep.constructor === 'function') {
        // If it's a constructor function
        instance = new dep.constructor(...Object.values(depsInstances));
      } else if (typeof dep.constructor === 'object') {
        // If it's already an instance
        instance = dep.constructor;
      } else {
        throw new Error(`Invalid dependency constructor for "${name}"`);
      }

      console.log(`✅ DependencyLoader: Created "${name}"`);
      return instance;

    } catch (error) {
      console.error(`❌ DependencyLoader: Failed to create "${name}":`, error);
      throw error;
    }
  }

  /**
   * Get all instances
   * @private
   * @returns {Object} All dependency instances
   */
  _getAllInstances() {
    const instances = {};
    this.dependencies.forEach((dep, name) => {
      if (dep.instance) {
        instances[name] = dep.instance;
      }
    });
    return instances;
  }

  /**
   * Check if all dependencies are initialized
   * @returns {boolean} True if all initialized
   */
  allInitialized() {
    return this.isInitialized && Array.from(this.dependencies.values())
      .every(dep => dep.instance !== null);
  }

  /**
   * Reset all dependencies (for testing)
   */
  reset() {
    this.dependencies.forEach(dep => {
      dep.instance = null;
    });
    this.isInitialized = false;
    this.initPromises.clear();
    console.log('🔄 DependencyLoader: Reset all dependencies');
  }
}

/**
 * Initialize application dependencies
 * @returns {Promise<Object>} Application services
 */
async function initializeAppDependencies() {
  const loader = new DependencyLoader();

  // Register core dependencies
  loader.register('eventBus', () => {
    if (typeof eventBus !== 'undefined') {
      return eventBus;
    }
    throw new Error('EventBus not available');
  });

  loader.register('apiClient', ApiClient, ['eventBus']);

  loader.register('modalService', ModalService, ['eventBus']);

  loader.register('incentiveService', IncentiveService, ['apiClient', 'eventBus']);

  loader.register('sembakoPage', SembakoPage, []);

  // Initialize all
  const services = await loader.initializeAll();

  // Make services globally available
  window.appServices = services;

  console.log('🎉 Application dependencies initialized successfully');
  return services;
}

/**
 * Wait for dependencies to be available
 * @param {string[]} dependencyNames - Names of dependencies to wait for
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Object>} Dependencies object
 */
function waitForDependencies(dependencyNames, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkDependencies = () => {
      const deps = {};
      let allAvailable = true;

      for (const name of dependencyNames) {
        if (typeof window[name] !== 'undefined') {
          deps[name] = window[name];
        } else {
          allAvailable = false;
          break;
        }
      }

      if (allAvailable) {
        resolve(deps);
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error(`Dependencies not available within timeout: ${dependencyNames.join(', ')}`));
        return;
      }

      setTimeout(checkDependencies, 100);
    };

    checkDependencies();
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DependencyLoader, initializeAppDependencies, waitForDependencies };
} else {
  window.DependencyLoader = DependencyLoader;
  window.initializeAppDependencies = initializeAppDependencies;
  window.waitForDependencies = waitForDependencies;
}