/**
 * Configuration Service
 * Centralized application configuration management
 * Follows Single Responsibility Principle
 */

class ConfigService {
  constructor() {
    this.config = {};
    this.environment = 'development';
    this._loadConfiguration();
    console.log('🔧 ConfigService: Initialized');
  }

  /**
   * Get configuration value
   * @param {string} key - Configuration key (supports dot notation)
   * @param {*} defaultValue - Default value if key not found
   * @returns {*} Configuration value
   */
  get(key, defaultValue = null) {
    // Support dot notation for nested keys (e.g., 'api.baseUrl')
    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  /**
   * Set configuration value
   * @param {string} key - Configuration key (supports dot notation)
   * @param {*} value - Configuration value
   */
  set(key, value) {
    // Support dot notation for nested keys
    const keys = key.split('.');
    let current = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }

    current[keys[keys.length - 1]] = value;
    console.log(`🔧 ConfigService: Set ${key} =`, value);
  }

  /**
   * Check if configuration key exists
   * @param {string} key - Configuration key
   * @returns {boolean} True if key exists
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Get all configuration
   * @returns {Object} Complete configuration object
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * Update configuration with object merge
   * @param {Object} updates - Configuration updates
   */
  update(updates) {
    this.config = { ...this.config, ...updates };
    console.log('🔧 ConfigService: Updated configuration', updates);
  }

  /**
   * Get environment name
   * @returns {string} Environment name
   */
  getEnvironment() {
    return this.environment;
  }

  /**
   * Check if running in development mode
   * @returns {boolean} True if in development
   */
  isDevelopment() {
    return this.environment === 'development';
  }

  /**
   * Check if running in production mode
   * @returns {boolean} True if in production
   */
  isProduction() {
    return this.environment === 'production';
  }

  /**
   * Load configuration from various sources
   * @private
   */
  _loadConfiguration() {
    // Load from environment variables
    this._loadFromEnvironment();

    // Load from window.env if available
    this._loadFromWindowEnv();

    // Set default values
    this._setDefaults();

    // Detect environment
    this._detectEnvironment();
  }

  /**
   * Load configuration from environment variables
   * @private
   */
  _loadFromEnvironment() {
    // These would be actual environment variables in real deployment
    const envConfig = {
      api: {
        baseUrl: process?.env?.VITE_API_URL || process?.env?.API_URL,
        timeout: parseInt(process?.env?.API_TIMEOUT) || 10000
      },
      auth: {
        tokenKey: process?.env?.AUTH_TOKEN_KEY || 'auth_token',
        refreshTokenKey: process?.env?.REFRESH_TOKEN_KEY || 'refresh_token'
      },
      app: {
        name: process?.env?.APP_NAME || 'System Administration',
        version: process?.env?.APP_VERSION || '1.0.0',
        debug: process?.env?.DEBUG === 'true'
      }
    };

    this.update(envConfig);
  }

  /**
   * Load configuration from window.env (for Vite development)
   * @private
   */
  _loadFromWindowEnv() {
    if (window.env) {
      console.log('🔍 ConfigService: Loading from window.env', window.env);
      this.update({
        api: { baseUrl: window.env.VITE_API_URL },
        loginUrl: window.env.VITE_LOGIN_URL,
        app: { debug: window.env.VITE_DEBUG === 'true' }
      });
    }
  }

  /**
   * Set default configuration values
   * @private
   */
  _setDefaults() {
    const defaults = {
      api: {
        baseUrl: 'http://localhost:8000',
        timeout: 10000,
        retries: 3,
        retryDelay: 1000
      },
      auth: {
        tokenKey: 'auth_token',
        refreshTokenKey: 'refresh_token',
        sessionTimeout: 3600000 // 1 hour in milliseconds
      },
      app: {
        name: 'System Administration',
        version: '1.0.0',
        debug: true,
        autoSaveInterval: 30000 // 30 seconds
      },
      ui: {
        toastDuration: 5000,
        modalAnimation: true,
        loadingSpinner: true,
        confirmDialogs: true
      },
      cache: {
        enabled: true,
        ttl: 300000, // 5 minutes
        maxSize: 100 // Number of cached items
      }
    };

    // Merge defaults, keeping existing values
    this.config = this._mergeDeep(defaults, this.config);
  }

  /**
   * Detect current environment
   * @private
   */
  _detectEnvironment() {
    // Check hostname and other environment indicators
    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      this.environment = 'development';
    } else if (hostname.includes('staging') || hostname.includes('test')) {
      this.environment = 'staging';
    } else if (hostname.includes('prod') || !hostname.includes('dev')) {
      this.environment = 'production';
    }

    // Override with explicit environment variable if available
    const envOverride = process?.env?.NODE_ENV || window.env?.NODE_ENV;
    if (envOverride) {
      this.environment = envOverride;
    }

    console.log(`🔍 ConfigService: Environment detected: ${this.environment}`);
  }

  /**
   * Deep merge objects
   * @private
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  _mergeDeep(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          typeof source[key] === 'object' &&
          source[key] !== null &&
          !Array.isArray(source[key])
        ) {
          result[key] = this._mergeDeep(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  /**
   * Export configuration to JSON
   * @returns {string} JSON string of configuration
   */
  export() {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON
   * @param {string} jsonString - JSON string to import
   */
  import(jsonString) {
    try {
      const config = JSON.parse(jsonString);
      this.update(config);
      console.log('📥 ConfigService: Configuration imported successfully');
    } catch (error) {
      console.error('❌ ConfigService: Failed to import configuration', error);
      throw new Error('Invalid configuration JSON');
    }
  }

  /**
   * Validate configuration
   * @returns {Object} Validation result with errors and warnings
   */
  validate() {
    const errors = [];
    const warnings = [];

    // Validate required fields
    if (!this.get('api.baseUrl')) {
      errors.push('API base URL is required');
    }

    if (!this.get('app.name')) {
      errors.push('Application name is required');
    }

    // Validate API URL format
    const apiUrl = this.get('api.baseUrl');
    if (apiUrl && !this._isValidUrl(apiUrl)) {
      errors.push('Invalid API base URL format');
    }

    // Validate timeout values
    const timeout = this.get('api.timeout');
    if (timeout && (timeout < 1000 || timeout > 60000)) {
      warnings.push('API timeout should be between 1-60 seconds');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate URL format
   * @private
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid URL
   */
  _isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get API configuration
   * @returns {Object} API configuration
   */
  getApiConfig() {
    return this.get('api', {});
  }

  /**
   * Get authentication configuration
   * @returns {Object} Authentication configuration
   */
  getAuthConfig() {
    return this.get('auth', {});
  }

  /**
   * Get UI configuration
   * @returns {Object} UI configuration
   */
  getUiConfig() {
    return this.get('ui', {});
  }

  /**
   * Get cache configuration
   * @returns {Object} Cache configuration
   */
  getCacheConfig() {
    return this.get('cache', {});
  }
}

// Create global configuration service instance
const configService = new ConfigService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ConfigService, configService };
} else {
  window.ConfigService = ConfigService;
  window.configService = configService;
}