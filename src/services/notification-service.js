/**
 * Notification Service
 * Centralized notification management for alerts, toasts, and messages
 * Follows Single Responsibility Principle
 */

class NotificationService {
  constructor(eventBus, configService) {
    this.eventBus = eventBus;
    this.configService = configService;
    this.container = null;
    this.defaultDuration = 5000;
    this.maxNotifications = 5;
    this.notifications = [];

    this._initializeContainer();
    console.log('🔧 NotificationService: Initialized');
  }

  /**
   * Show success notification
   * @param {string} message - Notification message
   * @param {Object} options - Additional options
   * @returns {HTMLElement} Notification element
   */
  success(message, options = {}) {
    return this.show('success', message, options);
  }

  /**
   * Show error notification
   * @param {string} message - Error message
   * @param {Object} options - Additional options
   * @returns {HTMLElement} Notification element
   */
  error(message, options = {}) {
    return this.show('error', message, options);
  }

  /**
   * Show warning notification
   * @param {string} message - Warning message
   * @param {Object} options - Additional options
   * @returns {HTMLElement} Notification element
   */
  warning(message, options = {}) {
    return this.show('warning', message, options);
  }

  /**
   * Show info notification
   * @param {string} message - Info message
   * @param {Object} options - Additional options
   * @returns {HTMLElement} Notification element
   */
  info(message, options = {}) {
    return this.show('info', message, options);
  }

  /**
   * Show notification with custom type
   * @param {string} type - Notification type (success, error, warning, info)
   * @param {string} message - Notification message
   * @param {Object} options - Additional options
   * @returns {HTMLElement} Notification element
   */
  show(type, message, options = {}) {
    const config = this._mergeConfig(type, options);

    console.log(`📢 NotificationService: ${type} - ${message}`);

    // Emit event for tracking
    this.eventBus.emit(EventTypes[`NOTIFICATION_${type.toUpperCase()}`], {
      message,
      config
    });

    // Check if notifications are enabled
    if (!this.configService.get('ui.notifications', true)) {
      return null;
    }

    return this._createNotification(type, message, config);
  }

  /**
   * Show confirmation dialog
   * @param {string} title - Dialog title
   * @param {string} message - Confirmation message
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>} User's choice
   */
  async confirm(title, message, options = {}) {
    console.log(`❓ NotificationService: Confirmation dialog - ${title}`);

    const config = {
      title,
      message,
      confirmText: options.confirmText || 'Ya',
      cancelText: options.cancelText || 'Batal',
      confirmClass: options.confirmClass || 'btn-primary',
      cancelClass: options.cancelClass || 'btn-secondary',
      ...options
    };

    // Emit event for tracking
    this.eventBus.emit(EventTypes.FORM_SUBMIT, {
      type: 'confirm',
      title,
      message
    });

    return this._showConfirmationDialog(config);
  }

  /**
   * Show alert dialog
   * @param {string} title - Alert title
   * @param {string} message - Alert message
   * @param {Object} options - Additional options
   * @returns {Promise} Dialog close result
   */
  async alert(title, message, options = {}) {
    console.log(`⚠️ NotificationService: Alert dialog - ${title}`);

    const config = {
      title,
      message,
      buttonText: options.buttonText || 'OK',
      buttonClass: options.buttonClass || 'btn-primary',
      ...options
    };

    // Emit event for tracking
    this.eventBus.emit(EventTypes.FORM_VALIDATION_FAILED, {
      title,
      message
    });

    return this._showAlertDialog(config);
  }

  /**
   * Clear all notifications
   */
  clear() {
    console.log('🧹 NotificationService: Clearing all notifications');

    this.notifications.forEach(notification => {
      this._removeNotification(notification);
    });

    this.notifications = [];
  }

  /**
   * Get current notifications count
   * @returns {number} Number of active notifications
   */
  getCount() {
    return this.notifications.length;
  }

  /**
   * Check if notifications are visible
   * @returns {boolean} True if any notifications are visible
   */
  hasVisible() {
    return this.notifications.length > 0;
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Initialize notification container
   * @private
   */
  _initializeContainer() {
    // Create container if it doesn't exist
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notification-container';
      this.container.className = 'notification-container';
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        pointer-events: none;
      `;
      document.body.appendChild(this.container);
    }
  }

  /**
   * Merge configuration with defaults
   * @private
   * @param {string} type - Notification type
   * @param {Object} options - User options
   * @returns {Object} Merged configuration
   */
  _mergeConfig(type, options) {
    const defaults = {
      duration: this.configService.get('ui.toastDuration', this.defaultDuration),
      dismissible: true,
      icon: this._getIconForType(type),
      progressBar: this.configService.get('ui.toastProgressBar', true),
      position: this.configService.get('ui.toastPosition', 'top-right')
    };

    return { ...defaults, ...options };
  }

  /**
   * Get icon for notification type
   * @private
   * @param {string} type - Notification type
   * @returns {string} Icon class
   */
  _getIconForType(type) {
    const icons = {
      success: 'bi-check-circle-fill',
      error: 'bi-x-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      info: 'bi-info-circle-fill'
    };

    return icons[type] || icons.info;
  }

  /**
   * Create notification element
   * @private
   * @param {string} type - Notification type
   * @param {string} message - Message content
   * @param {Object} config - Configuration
   * @returns {HTMLElement} Notification element
   */
  _createNotification(type, message, config) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      background: ${this._getBackgroundColor(type)};
      color: ${this._getTextColor(type)};
      border: 1px solid ${this._getBorderColor(type)};
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: flex-start;
      gap: 12px;
      min-width: 300px;
      max-width: 400px;
      pointer-events: auto;
      position: relative;
      transform: translateX(100%);
      transition: all 0.3s ease-out;
      opacity: 0;
    `;

    // Create icon
    const icon = document.createElement('i');
    icon.className = `bi ${config.icon}`;
    icon.style.cssText = `
      font-size: 20px;
      flex-shrink: 0;
      margin-top: 2px;
    `;

    // Create content container
    const content = document.createElement('div');
    content.style.cssText = `
      flex: 1;
      min-width: 0;
    `;

    // Create message
    const messageElement = document.createElement('div');
    messageElement.className = 'notification-message';
    messageElement.textContent = message;
    messageElement.style.cssText = `
      font-size: 14px;
      line-height: 1.4;
      word-wrap: break-word;
    `;

    // Create close button if dismissible
    let closeButton = null;
    if (config.dismissible) {
      closeButton = document.createElement('button');
      closeButton.innerHTML = '&times;';
      closeButton.className = 'notification-close';
      closeButton.style.cssText = `
        background: none;
        border: none;
        color: inherit;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        opacity: 0.7;
        flex-shrink: 0;
        transition: opacity 0.2s;
      `;
      closeButton.addEventListener('mouseenter', () => {
        closeButton.style.opacity = '1';
      });
      closeButton.addEventListener('mouseleave', () => {
        closeButton.style.opacity = '0.7';
      });
    }

    // Create progress bar if enabled
    let progressBar = null;
    if (config.progressBar) {
      progressBar = document.createElement('div');
      progressBar.className = 'notification-progress';
      progressBar.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 3px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 0 0 7px 7px;
        overflow: hidden;
      `;

      const progressFill = document.createElement('div');
      progressFill.className = 'notification-progress-fill';
      progressFill.style.cssText = `
        height: 100%;
        background: rgba(255, 255, 255, 0.8);
        width: 100%;
        transform: scaleX(1);
        transform-origin: left;
        transition: transform ${config.duration}ms linear;
      `;

      progressBar.appendChild(progressFill);
    }

    // Assemble notification
    content.appendChild(messageElement);
    notification.appendChild(icon);
    notification.appendChild(content);

    if (closeButton) {
      content.appendChild(closeButton);
    }

    if (progressBar) {
      notification.appendChild(progressBar);
    }

    // Add to container
    this.container.appendChild(notification);

    // Add to notifications list
    this.notifications.push({
      element: notification,
      type,
      message,
      config
    });

    // Limit number of notifications
    this._enforceMaxNotifications();

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
      notification.style.opacity = '1';
    }, 10);

    // Bind events
    this._bindNotificationEvents(notification, type, message, config);

    return notification;
  }

  /**
   * Bind events to notification
   * @private
   * @param {HTMLElement} notification - Notification element
   * @param {string} type - Notification type
   * @param {string} message - Message content
   * @param {Object} config - Configuration
   */
  _bindNotificationEvents(notification, type, message, config) {
    let timeoutId;
    let progressBar = notification.querySelector('.notification-progress-fill');

    // Auto-hide after duration
    if (config.duration > 0) {
      timeoutId = setTimeout(() => {
        this._removeNotificationByElement(notification);
      }, config.duration);

      // Animate progress bar
      if (progressBar) {
        setTimeout(() => {
          progressBar.style.transform = 'scaleX(0)';
        }, 10);
      }
    }

    // Close button handler
    const closeButton = notification.querySelector('.notification-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        this._removeNotificationByElement(notification);
      });
    }

    // Hover to pause auto-hide
    notification.addEventListener('mouseenter', () => {
      if (timeoutId && config.duration > 0) {
        clearTimeout(timeoutId);
        if (progressBar) {
          const currentScale = parseFloat(progressBar.style.transform.match(/scaleX\(([^)]+)\)/)?.[1] || 1);
          progressBar.style.transform = `scaleX(${currentScale})`;
          progressBar.style.transition = 'none';
        }
      }
    });

    notification.addEventListener('mouseleave', () => {
      if (timeoutId && config.duration > 0) {
        const remainingTime = config.duration * (1 - this._getNotificationProgress(notification));
        timeoutId = setTimeout(() => {
          this._removeNotificationByElement(notification);
        }, remainingTime);

        if (progressBar) {
          progressBar.style.transition = `transform ${remainingTime}ms linear`;
          progressBar.style.transform = 'scaleX(0)';
        }
      }
    });
  }

  /**
   * Remove notification by element
   * @private
   * @param {HTMLElement} notification - Notification element
   */
  _removeNotificationByElement(notification) {
    this._removeNotification(notification);
  }

  /**
   * Remove notification
   * @private
   * @param {Object} notification - Notification object
   */
  _removeNotification(notification) {
    const index = this.notifications.indexOf(notification);
    if (index !== -1) {
      this.notifications.splice(index, 1);
    }

    // Animate out
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';

    // Remove from DOM
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  /**
   * Enforce maximum number of notifications
   * @private
   */
  _enforceMaxNotifications() {
    while (this.notifications.length > this.maxNotifications) {
      const oldestNotification = this.notifications[0];
      this._removeNotification(oldestNotification);
    }
  }

  /**
   * Get notification progress
   * @private
   * @param {HTMLElement} notification - Notification element
   * @returns {number} Progress percentage (0-1)
   */
  _getNotificationProgress(notification) {
    const progressBar = notification.querySelector('.notification-progress-fill');
    if (!progressBar) return 0;

    const transform = progressBar.style.transform;
    const match = transform.match(/scaleX\(([^)]+)\)/);
    if (match) {
      return 1 - parseFloat(match[1]);
    }
    return 1;
  }

  /**
   * Get background color for type
   * @private
   * @param {string} type - Notification type
   * @returns {string} Background color
   */
  _getBackgroundColor(type) {
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };

    return colors[type] || colors.info;
  }

  /**
   * Get text color for type
   * @private
   * @param {string} type - Notification type
   * @returns {string} Text color
   */
  _getTextColor(type) {
    return '#ffffff';
  }

  /**
   * Get border color for type
   * @private
   * @param {string} type - Notification type
   * @returns {string} Border color
   */
  _getBorderColor(type) {
    return this._getBackgroundColor(type);
  }

  /**
   * Show confirmation dialog
   * @private
   * @param {Object} config - Dialog configuration
   * @returns {Promise<boolean>} User's choice
   */
  _showConfirmationDialog(config) {
    // For now, use native confirm as fallback
    const result = confirm(`${config.title}\n\n${config.message}`);
    return Promise.resolve(result);
  }

  /**
   * Show alert dialog
   * @private
   * @param {Object} config - Alert configuration
   * @returns {Promise} Promise that resolves when dialog is closed
   */
  _showAlertDialog(config) {
    // For now, use native alert as fallback
    alert(`${config.title}\n\n${config.message}`);
    return Promise.resolve();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationService;
} else {
  window.NotificationService = NotificationService;
}