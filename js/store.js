/* ============================================================
   Store — localStorage CRUD Abstraction
   Manages all persistent data collections
   ============================================================ */

const STORE_PREFIX = 'intune_lab_';
const SEED_KEY = STORE_PREFIX + '_seeded';

export const Collections = {
  DEVICES: 'devices',
  COMPLIANCE_POLICIES: 'compliancePolicies',
  CONFIG_PROFILES: 'configProfiles',
  APPS: 'apps',
  USERS: 'users',
  ROLES: 'roles',
  SCOPE_TAGS: 'scopeTags',
  SCRIPTS: 'scripts',
  ENROLLMENT_PROFILES: 'enrollmentProfiles',
  AUTOPILOT_PROFILES: 'autopilotProfiles',
  SECURITY_BASELINES: 'securityBaselines',
  ANTIVIRUS_POLICIES: 'antivirusPolicies',
  FIREWALL_POLICIES: 'firewallPolicies',
  DISK_ENCRYPTION_POLICIES: 'diskEncryptionPolicies',
  ASR_POLICIES: 'asrPolicies',
  UPDATE_RINGS: 'updateRings',
  APP_PROTECTION_POLICIES: 'appProtectionPolicies',
  APP_CONFIG_POLICIES: 'appConfigPolicies',
  CONDITIONAL_ACCESS: 'conditionalAccess',
  ALERTS: 'alerts',
  NOTIFICATIONS: 'notifications',
  INCIDENTS: 'incidents',
  CONNECTORS: 'connectors',
  CLOUD_PCS: 'cloudPCs',
  PROVISIONING_POLICIES: 'provisioningPolicies',
  EPM_POLICIES: 'epmPolicies',
  ELEVATION_REQUESTS: 'elevationRequests',
  HELLO_POLICIES: 'helloPolicies',
  LAPS_POLICIES: 'lapsPolicies',
  QUIET_TIME_POLICIES: 'quietTimePolicies',
  ESP_CONFIGS: 'espConfigs',
  DYNAMIC_GROUPS: 'dynamicGroups',
  FEATURE_UPDATES: 'featureUpdates',
  QUALITY_UPDATES: 'qualityUpdates',
  NETWORK_CONNECTIONS: 'networkConnections',
  CLOUD_IMAGES: 'cloudImages',
  AUTOPILOT_DEVICES: 'autopilotDevices',
  AUDIT_LOGS: 'auditLogs',
  CUSTOMIZATION: 'customization',
};

function getKey(collection) {
  return STORE_PREFIX + collection;
}

export const Store = {
  /* ── Read ── */
  getAll(collection) {
    try {
      const raw = localStorage.getItem(getKey(collection));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error(`Store.getAll(${collection}) failed:`, e);
      return [];
    }
  },

  getById(collection, id) {
    const items = this.getAll(collection);
    return items.find(item => item.id === id) || null;
  },

  /* ── Write ── */
  setAll(collection, items) {
    try {
      localStorage.setItem(getKey(collection), JSON.stringify(items));
    } catch (e) {
      console.error(`Store.setAll(${collection}) failed:`, e);
    }
  },

  create(collection, item) {
    const items = this.getAll(collection);
    item.createdAt = item.createdAt || new Date().toISOString();
    item.updatedAt = item.updatedAt || item.createdAt;
    items.push(item);
    this.setAll(collection, items);
    return item;
  },

  update(collection, id, updates) {
    const items = this.getAll(collection);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    this.setAll(collection, items);
    return items[index];
  },

  delete(collection, id) {
    const items = this.getAll(collection);
    const filtered = items.filter(item => item.id !== id);
    if (filtered.length === items.length) return false;
    this.setAll(collection, filtered);
    return true;
  },

  deleteMultiple(collection, ids) {
    const idSet = new Set(ids);
    const items = this.getAll(collection);
    const filtered = items.filter(item => !idSet.has(item.id));
    this.setAll(collection, filtered);
    return items.length - filtered.length;
  },

  /* ── Query Helpers ── */
  filter(collection, predicate) {
    return this.getAll(collection).filter(predicate);
  },

  count(collection) {
    return this.getAll(collection).length;
  },

  countWhere(collection, predicate) {
    return this.getAll(collection).filter(predicate).length;
  },

  /* ── Aggregate ── */
  getStats(collection, groupByKey) {
    const items = this.getAll(collection);
    const stats = {};
    for (const item of items) {
      const val = item[groupByKey] || 'Unknown';
      stats[val] = (stats[val] || 0) + 1;
    }
    return stats;
  },

  /* ── Seeding ── */
  isSeeded() {
    return localStorage.getItem(SEED_KEY) === 'true';
  },

  markSeeded() {
    localStorage.setItem(SEED_KEY, 'true');
  },

  /* ── Reset ── */
  resetAll() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(STORE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  },

  /* ── Export / Import ── */
  exportAll() {
    const data = {};
    for (const col of Object.values(Collections)) {
      data[col] = this.getAll(col);
    }
    return data;
  },

  importAll(data) {
    for (const [col, items] of Object.entries(data)) {
      if (Array.isArray(items)) {
        this.setAll(col, items);
      }
    }
  },

  /* ── Add Notification ── */
  addNotification(notification) {
    notification.id = notification.id || crypto.randomUUID();
    notification.timestamp = notification.timestamp || new Date().toISOString();
    notification.read = false;
    const notifications = this.getAll(Collections.NOTIFICATIONS);
    notifications.unshift(notification);
    // Keep last 50
    if (notifications.length > 50) notifications.length = 50;
    this.setAll(Collections.NOTIFICATIONS, notifications);
    return notification;
  },

  getUnreadNotificationCount() {
    return this.getAll(Collections.NOTIFICATIONS).filter(n => !n.read).length;
  },

  markNotificationRead(id) {
    return this.update(Collections.NOTIFICATIONS, id, { read: true });
  },

  markAllNotificationsRead() {
    const notifications = this.getAll(Collections.NOTIFICATIONS);
    notifications.forEach(n => n.read = true);
    this.setAll(Collections.NOTIFICATIONS, notifications);
  },
};
