/**
 * Event Types Constants
 * Centralized event type definitions for the event bus
 * Follows Single Responsibility Principle
 */

const EventTypes = {
  // Data loading events
  DATA_LOADING: 'data:loading',
  DATA_LOADED: 'data:loaded',
  DATA_ERROR: 'data:error',
  DATA_REFRESH: 'data:refresh',

  // Form events
  FORM_SUBMIT: 'form:submit',
  FORM_VALIDATION_FAILED: 'form:validation_failed',
  FORM_RESET: 'form:reset',

  // Modal events
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  MODAL_SHOW: 'modal:show',
  MODAL_HIDE: 'modal:hide',

  // Notification events
  NOTIFICATION_SUCCESS: 'notification:success',
  NOTIFICATION_ERROR: 'notification:error',
  NOTIFICATION_WARNING: 'notification:warning',
  NOTIFICATION_INFO: 'notification:info',
  NOTIFICATION_CONFIRM: 'notification:confirm',
  NOTIFICATION_ALERT: 'notification:alert',
  NOTIFICATION_CLEAR: 'notification:clear',

  // Navigation events
  NAVIGATION_CHANGED: 'navigation:changed',
  VIEW_CHANGED: 'view:changed',
  PAGE_LOADED: 'page:loaded',

  // Incentive type events
  INCENTIVE_TYPE_CREATED: 'incentive:type:created',
  INCENTIVE_TYPE_UPDATED: 'incentive:type:updated',
  INCENTIVE_TYPE_DELETED: 'incentive:type:deleted',
  INCENTIVE_TYPE_LOADED: 'incentive:type:loaded',

  // Incentive config events
  INCENTIVE_CONFIG_CREATED: 'incentive:config:created',
  INCENTIVE_CONFIG_UPDATED: 'incentive:config:updated',
  INCENTIVE_CONFIG_DELETED: 'incentive:config:deleted',
  INCENTIVE_CONFIG_LOADED: 'incentive:config:loaded',

  // Incentive employee events
  INCENTIVE_EMPLOYEE_CREATED: 'incentive:employee:created',
  INCENTIVE_EMPLOYEE_UPDATED: 'incentive:employee:updated',
  INCENTIVE_EMPLOYEE_DELETED: 'incentive:employee:deleted',
  INCENTIVE_EMPLOYEE_LOADED: 'incentive:employee:loaded',
  EMPLOYEE_INCENTIVE_CREATED: 'employee:incentive:created',
  EMPLOYEE_INCENTIVE_UPDATED: 'employee:incentive:updated',
  EMPLOYEE_INCENTIVE_DELETED: 'employee:incentive:deleted',

  // User management events
  USER_CREATED: 'user:created',
  USER_UPDATED: 'user:updated',
  USER_DELETED: 'user:deleted',
  USER_LOADED: 'user:loaded',

  // Role management events
  ROLE_CREATED: 'role:created',
  ROLE_UPDATED: 'role:updated',
  ROLE_DELETED: 'role:deleted',
  ROLE_ASSIGNED: 'role:assigned',
  ROLE_REVOKED: 'role:revoked',

  // Authentication events
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_SESSION_EXPIRED: 'auth:session_expired',
  AUTH_TOKEN_REFRESHED: 'auth:token_refreshed',

  // API events
  API_REQUEST_STARTED: 'api:request:started',
  API_REQUEST_COMPLETED: 'api:request:completed',
  API_REQUEST_FAILED: 'api:request:failed',
  API_RESPONSE_RECEIVED: 'api:response:received',

  // Component lifecycle events
  COMPONENT_CREATED: 'component:created',
  COMPONENT_INITIALIZED: 'component:initialized',
  COMPONENT_DESTROYED: 'component:destroyed',
  COMPONENT_UPDATED: 'component:updated',

  // Error events
  ERROR_OCCURRED: 'error:occurred',
  ERROR_NETWORK: 'error:network',
  ERROR_VALIDATION: 'error:validation',
  ERROR_PERMISSION: 'error:permission',

  // System events
  SYSTEM_INITIALIZED: 'system:initialized',
  SYSTEM_READY: 'system:ready',
  SYSTEM_ERROR: 'system:error',

  // Storage events
  STORAGE_SAVED: 'storage:saved',
  STORAGE_LOADED: 'storage:loaded',
  STORAGE_CLEARED: 'storage:cleared',
  STORAGE_ERROR: 'storage:error',

  // Configuration events
  CONFIG_CHANGED: 'config:changed',
  CONFIG_LOADED: 'config:loaded',
  CONFIG_VALIDATION_FAILED: 'config:validation_failed',

  // Utility events
  DEBUG: 'debug',
  LOG: 'log',
  PERFORMANCE_MEASURE: 'performance:measure'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EventTypes };
} else {
  window.EventTypes = EventTypes;
}