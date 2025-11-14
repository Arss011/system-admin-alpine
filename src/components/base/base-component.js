/**
 * Base Component Class
 * Abstract base class for all UI components
 * Implements common component functionality and follows Template Method Pattern
 */

class BaseComponent {
  constructor(container, options = {}) {
    this.container = this._resolveContainer(container);
    this.options = { ...this._getDefaultOptions(), ...options };
    this.eventBus = options.eventBus || window.eventBus;
    this.modalService = options.modalService || window.modalService;
    this.notificationService = options.notificationService || window.notificationService;
    this.isDestroyed = false;
    this.eventListeners = new Map();

    console.log(`🔧 BaseComponent: Initializing ${this.constructor.name}`, {
      container: this.container,
      options: this.options
    });

    this._initialize();
  }

  /**
   * Initialize component - Template Method
   * Override in subclasses
   */
  _initialize() {
    this._bindEvents();
    this._render();
    this._onInitialized();
  }

  /**
   * Render component - Template Method
   * Must be implemented by subclasses
   */
  _render() {
    throw new Error(`_render() must be implemented by ${this.constructor.name}`);
  }

  /**
   * Bind events - Template Method
   * Override in subclasses as needed
   */
  _bindEvents() {
    // Default implementation - empty
  }

  /**
   * Called when component is initialized - Hook Method
   * Override in subclasses as needed
   */
  _onInitialized() {
    // Default implementation - empty
  }

  /**
   * Destroy component and cleanup resources
   */
  destroy() {
    if (this.isDestroyed) {
      return;
    }

    console.log(`🗑️ BaseComponent: Destroying ${this.constructor.name}`);

    this._removeEventListeners();
    this._cleanup();
    this.isDestroyed = true;

    this.container = null;
    this.eventBus = null;
    this.modalService = null;
    this.notificationService = null;
    this.eventListeners.clear();
  }

  /**
   * Emit event through event bus
   * @param {string} eventName - Event name
   * @param {*} data - Event data
   */
  emit(eventName, data) {
    if (this.eventBus) {
      this.eventBus.emit(eventName, data);
    }
  }

  /**
   * Listen to event through event bus
   * @param {string} eventName - Event name
   * @param {Function} handler - Event handler
   * @returns {Function} Unsubscribe function
   */
  on(eventName, handler) {
    if (this.eventBus) {
      return this.eventBus.on(eventName, handler, this);
    }
    return () => {}; // No-op if no event bus
  }

  /**
   * Show notification
   * @param {string} type - Notification type (success, error, warning, info)
   * @param {string} message - Notification message
   * @param {Object} options - Additional options
   * @returns {HTMLElement} Notification element
   */
  showNotification(type, message, options = {}) {
    if (this.notificationService) {
      return this.notificationService[type](message, options);
    }
    return null;
  }

  /**
   * Show modal
   * @param {string} modalId - Modal element ID
   * @param {Object} options - Modal options
   * @returns {Promise} Modal instance
   */
  showModal(modalId, options = {}) {
    if (this.modalService) {
      return this.modalService.show(modalId, options);
    }
    return Promise.reject(new Error('Modal service not available'));
  }

  /**
   * Hide modal
   * @param {string} modalId - Modal element ID
   * @returns {Promise} Modal close result
   */
  hideModal(modalId) {
    if (this.modalService) {
      return this.modalService.hide(modalId);
    }
    return Promise.resolve();
  }

  /**
   * Add event listener with automatic cleanup
   * @param {Element|Window|Document} element - Target element
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @param {Object} options - Event options
   */
  addEventListener(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);

    // Store for cleanup
    const key = `${element.constructor.name}_${event}_${Date.now()}`;
    this.eventListeners.set(key, { element, event, handler, options });

    return () => {
      this.removeEventListener(key);
    };
  }

  /**
   * Remove event listener
   * @param {string} key - Event listener key
   */
  removeEventListener(key) {
    const listener = this.eventListeners.get(key);
    if (listener) {
      listener.element.removeEventListener(listener.event, listener.handler, listener.options);
      this.eventListeners.delete(key);
    }
  }

  /**
   * Remove all event listeners
   * @private
   */
  _removeEventListeners() {
    this.eventListeners.forEach((listener, key) => {
      listener.element.removeEventListener(listener.event, listener.handler, listener.options);
    });
    this.eventListeners.clear();
  }

  /**
   * Cleanup resources - Hook Method
   * Override in subclasses as needed
   */
  _cleanup() {
    // Default implementation - clear container content
    if (this.container && this.container.innerHTML) {
      this.container.innerHTML = '';
    }
  }

  /**
   * Resolve container (element or selector)
   * @private
   * @param {string|Element} container - Container reference
   * @returns {Element} Resolved element
   */
  _resolveContainer(container) {
    if (typeof container === 'string') {
      const element = document.querySelector(container);
      if (!element) {
        throw new Error(`Container not found: ${container}`);
      }
      return element;
    }
    return container;
  }

  /**
   * Get default options
   * @private
   * @returns {Object} Default options
   */
  _getDefaultOptions() {
    return {
      autoCleanup: true,
      destroyOnHide: false
    };
  }

  /**
   * Find element within component container
   * @param {string} selector - CSS selector
   * @returns {Element|null} Found element or null
   */
  find(selector) {
    return this.container.querySelector(selector);
  }

  /**
   * Find all elements within component container
   * @param {string} selector - CSS selector
   * @returns {NodeList} Found elements
   */
  findAll(selector) {
    return this.container.querySelectorAll(selector);
  }

  /**
   * Create element with optional attributes and content
   * @param {string} tagName - HTML tag name
   * @param {Object} attributes - Element attributes
   * @param {string|HTMLElement} content - Element content
   * @returns {HTMLElement} Created element
   */
  createElement(tagName, attributes = {}, content = '') {
    const element = document.createElement(tagName);

    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'textContent') {
        element.textContent = value;
      } else if (key === 'innerHTML') {
        element.innerHTML = value;
      } else if (key.startsWith('data-')) {
        element.setAttribute(key, value);
      } else {
        element.setAttribute(key, value);
      }
    });

    // Set content if provided
    if (content && typeof content === 'string') {
      element.textContent = content;
    } else if (content instanceof HTMLElement) {
      element.appendChild(content);
    }

    return element;
  }

  /**
   * Check if component is destroyed
   * @returns {boolean} True if destroyed
   */
  get isDestroyed() {
    return this.isDestroyed;
  }

  /**
   * Get component container
   * @returns {Element} Component container
   */
  get element() {
    return this.container;
  }

  /**
   * Get component options
   * @returns {Object} Component options
   */
  get options() {
    return { ...this.options };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseComponent;
} else {
  window.BaseComponent = BaseComponent;
}