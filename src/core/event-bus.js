/**
 * Event Bus Service
 * Centralized event management following Observer Pattern
 * Enables loose coupling between components
 */
class EventBus {
  constructor() {
    this.events = new Map();
    this.onceEvents = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - Event name
   * @param {Function} callback - Event handler callback
   * @param {Object} context - Execution context (optional)
   * @returns {Function} Unsubscribe function
   */
  on(eventName, callback, context = null) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    const listener = { callback, context };
    this.events.get(eventName).push(listener);

    console.log(`📡 EventBus: Subscribed to "${eventName}"`);

    // Return unsubscribe function
    return () => this.off(eventName, listener);
  }

  /**
   * Subscribe to event once
   * @param {string} eventName - Event name
   * @param {Function} callback - Event handler callback
   * @param {Object} context - Execution context (optional)
   * @returns {Function} Unsubscribe function
   */
  once(eventName, callback, context = null) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    const onceCallback = (data) => {
      callback.call(context, data);
      this.off(eventName, onceCallback);
    };

    return this.on(eventName, onceCallback, context);
  }

  /**
   * Unsubscribe from event
   * @param {string} eventName - Event name
   * @param {Object|Function} listener - Listener object or callback function
   */
  off(eventName, listener) {
    if (!this.events.has(eventName)) {
      return;
    }

    const listeners = this.events.get(eventName);
    const index = listeners.findIndex(l => l === listener || l.callback === listener);

    if (index !== -1) {
      listeners.splice(index, 1);
      console.log(`📡 EventBus: Unsubscribed from "${eventName}"`);
    }

    if (listeners.length === 0) {
      this.events.delete(eventName);
    }
  }

  /**
   * Emit an event
   * @param {string} eventName - Event name
   * @param {*} data - Event data payload
   */
  emit(eventName, data = null) {
    if (!this.events.has(eventName)) {
      console.log(`📡 EventBus: No listeners for "${eventName}"`);
      return;
    }

    const listeners = this.events.get(eventName);
    console.log(`📡 EventBus: Emitting "${eventName}" to ${listeners.length} listeners`);

    listeners.forEach(listener => {
      try {
        if (listener.context) {
          listener.callback.call(listener.context, data);
        } else {
          listener.callback(data);
        }
      } catch (error) {
        console.error(`❌ EventBus: Error in listener for "${eventName}":`, error);
        // Continue emitting to other listeners
      }
    });
  }

  /**
   * Remove all listeners for an event or all events
   * @param {string} eventName - Event name (optional)
   */
  clear(eventName = null) {
    if (eventName) {
      this.events.delete(eventName);
      this.onceEvents.delete(eventName);
      console.log(`📡 EventBus: Cleared all listeners for "${eventName}"`);
    } else {
      this.events.clear();
      this.onceEvents.clear();
      console.log('📡 EventBus: Cleared all events');
    }
  }

  /**
   * Get list of active event names
   * @returns {Array<string>} Event names
   */
  getEventNames() {
    return Array.from(this.events.keys());
  }

  /**
   * Get number of listeners for an event
   * @param {string} eventName - Event name
   * @returns {number} Number of listeners
   */
  getListenerCount(eventName) {
    return this.events.has(eventName) ? this.events.get(eventName).length : 0;
  }
}

/**
 * Global event bus instance
 */
const eventBus = new EventBus();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EventBus, eventBus };
} else {
  window.EventBus = EventBus;
  window.eventBus = eventBus;
}