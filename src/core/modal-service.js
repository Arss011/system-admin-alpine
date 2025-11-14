/**
 * Modal Service
 * Centralized modal management following Service Pattern
 * Provides abstraction over Bootstrap modal functionality
 */

class ModalService {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.activeModals = new Map();
    this.modalConfigs = new Map();

    // Initialize default modal configurations
    this._initializeDefaultConfigs();

    console.log('🔧 ModalService: Initialized');
  }

  /**
   * Show a modal by element ID
   * @param {string} modalId - Modal element ID
   * @param {Object} options - Modal options
   * @returns {Promise} Modal instance
   */
  async show(modalId, options = {}) {
    console.log(`🔧 ModalService: Showing modal "${modalId}"`);

    try {
      const modalElement = this._getModalElement(modalId);
      const config = { ...this.modalConfigs.get(modalId), ...options };

      // Check if Bootstrap is available
      if (typeof bootstrap === 'undefined') {
        throw new Error('Bootstrap is not loaded');
      }

      // Create or get modal instance
      let modalInstance = this.activeModals.get(modalId);
      if (!modalInstance) {
        modalInstance = new bootstrap.Modal(modalElement, config);
        this.activeModals.set(modalId, modalInstance);
      }

      // Apply custom configuration
      if (options.title) {
        this._updateModalTitle(modalElement, options.title);
      }

      if (options.content) {
        this._updateModalContent(modalElement, options.content);
      }

      // Bind event listeners
      this._bindModalEvents(modalId, modalElement, modalInstance);

      // Show the modal
      modalInstance.show();

      // Emit events
      this.eventBus.emit(EventTypes.MODAL_OPEN, { modalId, config });

      // Return promise that resolves when modal is shown
      return new Promise((resolve) => {
        modalElement.addEventListener('shown.bs.modal', function handler() {
          modalElement.removeEventListener('shown.bs.modal', handler);
          this.eventBus.emit(EventTypes.MODAL_SHOWN, { modalId, config });
          resolve(modalInstance);
        }.bind(this), { once: true });
      }.bind(this));

    } catch (error) {
      console.error(`❌ ModalService: Error showing modal "${modalId}":`, error);
      throw error;
    }
  }

  /**
   * Hide a modal by element ID
   * @param {string} modalId - Modal element ID
   * @returns {Promise} Promise that resolves when modal is hidden
   */
  async hide(modalId) {
    console.log(`🔧 ModalService: Hiding modal "${modalId}"`);

    try {
      const modalInstance = this.activeModals.get(modalId);
      const modalElement = this._getModalElement(modalId);

      if (!modalInstance) {
        console.warn(`⚠️ ModalService: Modal "${modalId}" not found`);
        return Promise.resolve();
      }

      // Emit event before hiding
      this.eventBus.emit(EventTypes.MODAL_CLOSE, { modalId });

      // Hide the modal
      modalInstance.hide();

      // Return promise that resolves when modal is hidden
      return new Promise((resolve) => {
        modalElement.addEventListener('hidden.bs.modal', function handler() {
          modalElement.removeEventListener('hidden.bs.modal', handler);
          this.eventBus.emit(EventTypes.MODAL_HIDDEN, { modalId });
          resolve();
        }.bind(this), { once: true });
      }.bind(this));

    } catch (error) {
      console.error(`❌ ModalService: Error hiding modal "${modalId}":`, error);
      throw error;
    }
  }

  /**
   * Check if modal is currently visible
   * @param {string} modalId - Modal element ID
   * @returns {boolean} True if modal is visible
   */
  isVisible(modalId) {
    const modalElement = this._getModalElement(modalId);
    return modalElement && modalElement.classList.contains('show');
  }

  /**
   * Toggle modal visibility
   * @param {string} modalId - Modal element ID
   * @param {Object} options - Modal options
   * @returns {Promise} Modal state change result
   */
  async toggle(modalId, options = {}) {
    if (this.isVisible(modalId)) {
      return await this.hide(modalId);
    } else {
      return await this.show(modalId, options);
    }
  }

  /**
   * Register modal configuration
   * @param {string} modalId - Modal element ID
   * @param {Object} config - Modal configuration
   */
  register(modalId, config = {}) {
    this.modalConfigs.set(modalId, config);
    console.log(`📋 ModalService: Registered modal "${modalId}"`, config);
  }

  /**
   * Unregister modal
   * @param {string} modalId - Modal element ID
   */
  unregister(modalId) {
    this.modalConfigs.delete(modalId);
    this.activeModals.delete(modalId);
    console.log(`🗑️ ModalService: Unregistered modal "${modalId}"`);
  }

  /**
   * Get modal instance
   * @param {string} modalId - Modal element ID
   * @returns {Object|null} Bootstrap modal instance
   */
  getModalInstance(modalId) {
    return this.activeModals.get(modalId) || null;
  }

  /**
   * Show confirmation modal
   * @param {string} title - Modal title
   * @param {string} message - Confirmation message
   * @param {Object} options - Modal options
   * @returns {Promise<boolean} User's confirmation choice
   */
  async confirm(title, message, options = {}) {
    const config = {
      title,
      message,
      confirmButtonText: options.confirmButtonText || 'Ya',
      cancelButtonText: options.cancelButtonText || 'Batal',
      confirmClass: options.confirmClass || 'btn-primary',
      cancelClass: options.cancelClass || 'btn-secondary',
      ...options
    };

    return this.showConfirmationModal(config);
  }

  /**
   * Show alert modal
   * @param {string} title - Modal title
   * @param {string} message - Alert message
   * @param {Object} options - Modal options
   * @returns {Promise} Modal close result
   */
  async alert(title, message, options = {}) {
    const config = {
      title,
      message,
      buttonText: options.buttonText || 'OK',
      buttonClass: options.buttonClass || 'btn-primary',
      ...options
    };

    return this.showAlertModal(config);
  }

  /**
   * Private: Initialize default modal configurations
   * @private
   */
  _initializeDefaultConfigs() {
    // Type form modal
    this.register('typeModal', {
      backdrop: true,
      keyboard: true,
      focus: true
    });

    // Delete confirmation modal
    this.register('deleteModal', {
      backdrop: 'static',
      keyboard: false,
      focus: true
    });
  }

  /**
   * Private: Get modal element
   * @private
   * @param {string} modalId - Modal element ID
   * @returns {HTMLElement} Modal DOM element
   */
  _getModalElement(modalId) {
    const element = document.getElementById(modalId);
    if (!element) {
      throw new Error(`Modal element with ID "${modalId}" not found`);
    }
    return element;
  }

  /**
   * Private: Update modal title
   * @private
   * @param {HTMLElement} modalElement - Modal element
   * @param {string} title - New title
   */
  _updateModalTitle(modalElement, title) {
    const titleElement = modalElement.querySelector('.modal-title');
    if (titleElement) {
      titleElement.textContent = title;
    }
  }

  /**
   * Private: Update modal content
   * @private
   * @param {HTMLElement} modalElement - Modal element
   * @param {string} content - New content HTML
   */
  _updateModalContent(modalElement, content) {
    const bodyElement = modalElement.querySelector('.modal-body');
    if (bodyElement) {
      bodyElement.innerHTML = content;
    }
  }

  /**
   * Private: Bind modal events
   * @private
   * @param {string} modalId - Modal ID
   * @param {HTMLElement} modalElement - Modal element
   * @param {Object} modalInstance - Bootstrap modal instance
   */
  _bindModalEvents(modalId, modalElement, modalInstance) {
    // Auto-cleanup on hidden if configured
    if (this.modalConfigs.get(modalId)?.autoCleanup) {
      modalElement.addEventListener('hidden.bs.modal', () => {
        this._cleanupModal(modalId);
      }, { once: true });
    }
  }

  /**
   * Private: Cleanup modal instance
   * @private
   * @param {string} modalId - Modal ID
   */
  _cleanupModal(modalId) {
    this.activeModals.delete(modalId);
    console.log(`🧹 ModalService: Cleaned up modal "${modalId}"`);
  }

  /**
   * Private: Show confirmation modal
   * @private
   * @param {Object} config - Modal configuration
   * @returns {Promise<boolean>} User's choice
   */
  async showConfirmationModal(config) {
    // This would be implemented when we have dynamic modal creation
    // For now, use native confirm as fallback
    const result = confirm(`${config.title}\n\n${config.message}`);
    return Promise.resolve(result);
  }

  /**
   * Private: Show alert modal
   * @private
   * @param {Object} config - Modal configuration
   * @returns {Promise<void>}
   */
  async showAlertModal(config) {
    // This would be implemented when we have dynamic modal creation
    // For now, use native alert as fallback
    alert(`${config.title}\n\n${config.message}`);
    return Promise.resolve();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModalService;
} else {
  window.ModalService = ModalService;
}