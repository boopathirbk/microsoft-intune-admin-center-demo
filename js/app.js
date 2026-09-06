/* ============================================================
   App — Main entry point & orchestrator
   Initializes store, seeds data, sets up router & components
   ============================================================ */

import { $, Icons, createElement, clearElement } from './utils.js';
import { Store, Collections } from './store.js';
import { router } from './router.js';
import { seedAll, resetAndReseed } from './data/seed.js';
import { Nav } from './components/nav.js';
import { CommandBar } from './components/commandbar.js';
import { ToastManager, NotificationCenter } from './components/notifications.js';
import { renderDevicesOverview, renderAllDevices, renderMonitor, renderCompliancePolicies, renderConfigProfiles, renderScripts, openDeviceBlade } from './pages/devices.js';
import { renderEnrollmentOverview, renderAutopilot, renderESP, renderRestrictions, renderAndroidEnrollment, renderEnrollmentSettings } from './pages/enrollment.js';
import { renderIdentityOverview, renderWHfB, renderLAPS } from './pages/identity.js';
import { renderEndpointSecurityOverview, renderAntivirus, renderFirewall, renderDiskEncryption, renderASR, renderDefender, renderSecurityAllDevices, renderAccountProtection, renderAppControl, renderFeatureUpdates, renderQualityUpdates, renderUpdateRings, renderAutopatch, renderDeliveryOptimization } from './pages/security.js';
import { renderAppsOverview, renderAllApps, renderAppProtection, renderAppConfiguration, renderQuietTimePolicies, renderM365Apps, renderPlatformStores } from './pages/apps.js';
import { renderWin365Overview, renderProvisioningPolicies, renderIntuneAddons, renderRemoteHelp, renderAllCloudPCs, renderCustomImages, renderNetworkConnections, renderEPM, renderEnterpriseAppCatalog, renderCloudPKI, renderMicrosoftTunnel, renderAdvancedAnalytics } from './pages/win365.js';
import { renderReportsOverview, renderDeviceComplianceReport, renderEndpointAnalytics, renderDeviceEnrollmentReport, renderAppReports } from './pages/reports.js';
import { renderTenantStatus, renderServiceHealth, renderMessageCenter, renderConnectors, renderSecurityCopilotSettings, renderAuditLogs, renderCustomization } from './pages/tenant.js';
import { renderTroubleshooting } from './pages/troubleshooting.js';
import { CopilotAssistant } from './components/copilot.js';
import { initStudyDisclaimer, showStudyDisclaimerModal, DISCLAIMER_STORAGE_KEY } from './components/disclaimer.js';

/* ── Global references ── */
let nav, commandBar, toastManager, notificationCenter, copilotAssistant;

/* ══════════════════════════════════════════════════
   INITIALIZATION
   ══════════════════════════════════════════════════ */

function init() {
  // Seed data on first load
  const didSeed = seedAll();

  // Initialize components
  nav = new Nav($('#nav-rail'));
  nav.render();

  commandBar = new CommandBar($('#command-bar'), $('#breadcrumb-bar'));
  toastManager = new ToastManager($('#toast-container'));
  notificationCenter = new NotificationCenter($('#notification-center'), $('#notification-toggle'));
  copilotAssistant = new CopilotAssistant();
  window.IntuneCopilot = copilotAssistant;

  // Update notification badge
  notificationCenter.updateBadge();

  // Setup theme and header controls
  setupTheme();
  setupHeaderActions();

  // Initialize Study Purpose disclaimer & first-time cookie notice
  initStudyDisclaimer();

  // Set up nav toggle
  $('#nav-toggle').addEventListener('click', () => {
    const app = $('#app');
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      nav.toggleMobileNav();
    } else {
      app.classList.toggle('nav-collapsed');
    }
  });

  // Mobile backdrop click
  $('#nav-backdrop').addEventListener('click', () => nav.closeMobileNav());

  // Register routes
  registerRoutes();

  // Router hooks
  router.afterNavigate((path) => {
    nav.setActive(path);
    commandBar.updateBreadcrumbs(path);
  });

  // Start router
  router.start();

  // Show welcome toast on first load
  if (didSeed) {
    setTimeout(() => {
      toastManager.success('Welcome to Microsoft Intune', 'Authentic Microsoft Intune admin center environment loaded for MD-102 exam practice!');
    }, 500);
  }

  // Expose globally for convenience
  window.IntuneApp = { Store, Collections, router, toastManager, commandBar, resetAndReseed: handleReset, nav, showDisclaimer: showStudyDisclaimerModal };
}

/* ══════════════════════════════════════════════════
   THEME & PORTAL HEADER CONTROLS
   ══════════════════════════════════════════════════ */

function setupTheme() {
  const savedTheme = localStorage.getItem('intune_theme') || 'dark';
  applyTheme(savedTheme);

  const themeToggle = $('#theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      localStorage.setItem('intune_theme', nextTheme);
      toastManager.info('Theme switched', `Switched to Microsoft Intune ${nextTheme === 'dark' ? 'Dark' : 'Light'} theme.`);
      if (router.getPath() === '/' || router.getPath().startsWith('/reports')) {
        router.refresh();
      }
    });
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const themeToggle = $('#theme-toggle');
  if (themeToggle) {
    if (theme === 'dark') {
      themeToggle.title = 'Switch to Light theme';
      themeToggle.setAttribute('aria-label', 'Switch to Light theme');
      // Sun icon
      themeToggle.innerHTML = Icons.sun;
    } else {
      themeToggle.title = 'Switch to Dark theme';
      themeToggle.setAttribute('aria-label', 'Switch to Dark theme');
      // Moon icon
      themeToggle.innerHTML = Icons.moon;
    }
  }
}

function setupHeaderActions() {
  // Brand click -> Home
  $('#header-brand')?.addEventListener('click', () => router.navigate('/'));

  // Global search input (Ctrl + /)
  const searchInput = $('#header-search-input');
  if (searchInput) {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          router.navigate(`/devices/all?q=${encodeURIComponent(query)}`);
        }
      }
    });
  }

  // Cloud shell
  $('#cloud-shell-toggle')?.addEventListener('click', () => {
    toastManager.info('Azure Cloud Shell', 'PowerShell & Bash CLI connected to Microsoft Graph PowerShell SDK for Intune.');
  });

  // Settings
  $('#settings-toggle')?.addEventListener('click', () => {
    toastManager.info('Portal Settings', 'Tenant: Contoso Corp (M365 E5) | MD-102 Endpoint Administrator Exam Study Sandbox.');
  });

  // Help
  $('#help-toggle')?.addEventListener('click', () => {
    router.navigate('/troubleshooting');
  });

  // User Profile
  $('#user-profile-btn')?.addEventListener('click', () => {
    router.navigate('/tenant/status');
  });
}

/* ══════════════════════════════════════════════════
   ROUTE REGISTRATION
   ══════════════════════════════════════════════════ */

function registerRoutes() {
  // Home
  router.register('/', renderHome, { label: 'Home' });

  // Devices — delegated to pages/devices.js
  router.register('/devices', () => renderDevicesOverview(), { label: 'Devices' });
  router.register('/devices/overview', () => renderDevicesOverview(), { label: 'Overview' });
  router.register('/devices/all', () => renderAllDevices(), { label: 'All devices' });
  router.register('/devices/monitor', () => renderMonitor(), { label: 'Monitor' });

  // Enrollment — delegated to pages/enrollment.js
  router.register('/devices/enrollment', () => renderEnrollmentOverview(), { label: 'Enrollment' });
  router.register('/devices/enrollment/settings', () => renderEnrollmentSettings(), { label: 'Enrollment settings' });
  router.register('/devices/enrollment/android', () => renderAndroidEnrollment(), { label: 'Android enrollment' });
  router.register('/devices/enrollment/restrictions', () => renderRestrictions(), { label: 'Enrollment restrictions' });
  router.register('/devices/enrollment/autopilot', () => renderAutopilot(), { label: 'Windows Autopilot' });
  router.register('/devices/enrollment/esp', () => renderESP(), { label: 'Enrollment Status Page' });

  // Compliance, Config, Scripts — delegated to pages/devices.js
  router.register('/devices/compliance-policies', () => renderCompliancePolicies(), { label: 'Compliance policies' });
  router.register('/devices/configuration-profiles', () => renderConfigProfiles(), { label: 'Configuration profiles' });
  router.register('/devices/scripts', () => renderScripts(), { label: 'Scripts and remediations' });

  // Identity — delegated to pages/identity.js & renderPolicyList
  router.register('/devices/identity', () => renderIdentityOverview(), { label: 'Identity and compliance' });
  router.register('/devices/identity/roles', (p) => renderPolicyList('roles', 'Roles', p), { label: 'Roles' });
  router.register('/devices/identity/scope-tags', (p) => renderPolicyList('scopeTags', 'Scope tags', p), { label: 'Scope tags' });
  router.register('/devices/identity/hello', () => renderWHfB(), { label: 'Windows Hello for Business' });
  router.register('/devices/identity/laps', () => renderLAPS(), { label: 'Windows LAPS' });
  router.register('/devices/identity/conditional-access', (p) => renderPolicyList('conditionalAccess', 'Conditional Access', p), { label: 'Conditional Access' });
  router.register('/devices/identity/dynamic-groups', (p) => renderPolicyList('dynamicGroups', 'Dynamic groups', p), { label: 'Dynamic groups' });

  // Apps
  router.register('/apps', () => renderAppsOverview(), { label: 'Apps' });
  router.register('/apps/all', () => renderAllApps(), { label: 'All apps' });
  router.register('/apps/quiet-time', () => renderQuietTimePolicies(), { label: 'Quiet Time policies' });
  router.register('/apps/microsoft-365', () => renderM365Apps(), { label: 'Microsoft 365 Apps' });
  router.register('/apps/protection-policies', () => renderAppProtection(), { label: 'App protection policies' });
  router.register('/apps/configuration-policies', () => renderAppConfiguration(), { label: 'App configuration policies' });
  router.register('/apps/platform-stores', () => renderPlatformStores(), { label: 'Platform stores' });

  // Endpoint Security
  router.register('/endpoint-security', () => renderEndpointSecurityOverview(), { label: 'Endpoint security' });
  router.register('/endpoint-security/overview', () => renderEndpointSecurityOverview(), { label: 'Overview' });
  router.register('/endpoint-security/all-devices', () => renderSecurityAllDevices(), { label: 'All devices' });
  router.register('/endpoint-security/antivirus', () => renderAntivirus(), { label: 'Antivirus' });
  router.register('/endpoint-security/firewall', () => renderFirewall(), { label: 'Firewall' });
  router.register('/endpoint-security/disk-encryption', () => renderDiskEncryption(), { label: 'Disk encryption' });
  router.register('/endpoint-security/asr', () => renderASR(), { label: 'Attack surface reduction' });
  router.register('/endpoint-security/account-protection', () => renderAccountProtection(), { label: 'Account protection' });
  router.register('/endpoint-security/baselines', (p) => renderPolicyList('securityBaselines', 'Security baselines', p), { label: 'Security baselines' });
  router.register('/endpoint-security/app-control', () => renderAppControl(), { label: 'App Control for Business' });
  router.register('/endpoint-security/defender', () => renderDefender(), { label: 'Defender for Endpoint' });
  router.register('/endpoint-security/update-rings', () => renderUpdateRings(), { label: 'Update rings' });
  router.register('/endpoint-security/feature-updates', () => renderFeatureUpdates(), { label: 'Feature updates' });
  router.register('/endpoint-security/quality-updates', () => renderQualityUpdates(), { label: 'Quality updates' });
  router.register('/endpoint-security/autopatch', () => renderAutopatch(), { label: 'Windows Autopatch' });
  router.register('/endpoint-security/delivery-optimization', () => renderDeliveryOptimization(), { label: 'Delivery Optimization' });

  // Windows 365
  router.register('/windows-365', () => renderWin365Overview(), { label: 'Windows 365' });
  router.register('/windows-365/overview', () => renderWin365Overview(), { label: 'Overview' });
  router.register('/windows-365/all-cloud-pcs', () => renderAllCloudPCs(), { label: 'All Cloud PCs' });
  router.register('/windows-365/provisioning-policies', () => renderProvisioningPolicies(), { label: 'Provisioning policies' });
  router.register('/windows-365/custom-images', () => renderCustomImages(), { label: 'Custom images' });
  router.register('/windows-365/azure-network-connections', () => renderNetworkConnections(), { label: 'Azure network connections' });

  // Tenant Admin & Intune Suite
  router.register('/tenant-admin', () => renderTenantStatus(), { label: 'Tenant administration' });
  router.register('/tenant-admin/tenant-status', () => renderTenantStatus(), { label: 'Tenant status' });
  router.register('/tenant-admin/intune-addons', () => renderIntuneAddons(), { label: 'Intune add-ons' });
  router.register('/tenant-admin/remote-help', () => renderRemoteHelp(), { label: 'Remote Help' });
  router.register('/tenant-admin/customization', () => renderCustomization(), { label: 'Customization' });
  router.register('/tenant-admin/audit-logs', () => renderAuditLogs(), { label: 'Audit logs' });

  // Intune Suite
  router.register('/intune-suite', () => renderIntuneAddons(), { label: 'Intune Suite' });
  router.register('/intune-suite/epm', () => renderEPM(), { label: 'Endpoint Privilege Management' });
  router.register('/intune-suite/app-catalog', () => renderEnterpriseAppCatalog(), { label: 'Enterprise App Catalog' });
  router.register('/intune-suite/remote-help', () => renderRemoteHelp(), { label: 'Remote Help' });
  router.register('/intune-suite/cloud-pki', () => renderCloudPKI(), { label: 'Cloud PKI' });
  router.register('/intune-suite/tunnel', () => renderMicrosoftTunnel(), { label: 'Microsoft Tunnel for MAM' });
  router.register('/intune-suite/advanced-analytics', () => renderAdvancedAnalytics(), { label: 'Advanced Analytics' });

  // Reports
  router.register('/reports', () => renderReportsOverview(), { label: 'Reports' });
  router.register('/reports/device-compliance', () => renderDeviceComplianceReport(), { label: 'Device compliance' });
  router.register('/reports/device-enrollment', () => renderDeviceEnrollmentReport(), { label: 'Device enrollment' });
  router.register('/reports/app-reports', () => renderAppReports(), { label: 'App reports' });
  router.register('/reports/endpoint-analytics', () => renderEndpointAnalytics(), { label: 'Endpoint Analytics' });

  // Tenant
  router.register('/tenant', () => renderTenantStatus(), { label: 'Tenant administration' });
  router.register('/tenant/service-health', () => renderServiceHealth(), { label: 'Service health' });
  router.register('/tenant/message-center', () => renderMessageCenter(), { label: 'Message center' });
  router.register('/tenant/connectors', () => renderConnectors(), { label: 'Connectors' });
  router.register('/tenant/customization', () => renderCustomization(), { label: 'Customization' });
  router.register('/tenant/audit-logs', () => renderAuditLogs(), { label: 'Audit logs' });
  router.register('/tenant/alerts', (p) => renderPolicyList('alerts', 'Alerts', p), { label: 'Alerts' });
  router.register('/tenant/security-copilot', () => renderSecurityCopilotSettings(), { label: 'Security Copilot' });

  // Troubleshooting
  router.register('/troubleshooting', () => renderTroubleshooting(), { label: 'Troubleshooting + support' });
}

/* ══════════════════════════════════════════════════
   PAGE RENDERERS (Phase 1 — Placeholder + Home)
   ══════════════════════════════════════════════════ */

function getContentEl() {
  return $('#page-content');
}

/* ── Home / Dashboard ── */
function renderHome() {
  const el = getContentEl();
  clearElement(el);

  commandBar.setActions([
    { label: 'Reset to seeded data', icon: Icons.refresh, onClick: handleReset, type: 'default', id: 'btn-reset' },
  ]);

  el.innerHTML = `
    <h1 class="page-title">Intune Study Lab</h1>
    <p class="page-subtitle">MD-102 Endpoint Administrator — Exam study & interview practice environment</p>

    <div class="tile-grid" id="dashboard-tiles"></div>

    <div class="content-card">
      <div class="content-card__header">
        <h2 class="content-card__title">Device compliance</h2>
      </div>
      <div style="display:flex;gap:32px;align-items:flex-start;flex-wrap:wrap;">
        <div id="compliance-chart" style="width:200px;height:200px;position:relative;"></div>
        <div id="compliance-legend" class="chart-legend" style="min-width:180px;"></div>
      </div>
    </div>

    <div class="content-card">
      <div class="content-card__header">
        <h2 class="content-card__title">Recent alerts</h2>
      </div>
      <div id="recent-alerts"></div>
    </div>

    <div class="info-banner info-banner--info" style="margin-top:16px;">
      <span class="info-banner__icon" style="color:var(--color-info)">${Icons.info}</span>
      <span>This is a study environment — all data is stored locally in your browser's localStorage. Use the <strong>Reset to seeded data</strong> button to restore default mock data.</span>
    </div>
  `;

  renderDashboardTiles();
  renderComplianceChart();
  renderRecentAlerts();
}

function renderDashboardTiles() {
  const container = $('#dashboard-tiles');
  if (!container) return;

  const deviceCount = Store.count(Collections.DEVICES);
  const complianceStats = Store.getStats(Collections.DEVICES, 'complianceState');
  const appCount = Store.count(Collections.APPS);
  const policyCount = Store.count(Collections.COMPLIANCE_POLICIES) + Store.count(Collections.CONFIG_PROFILES);
  const alertCount = Store.filter(Collections.ALERTS, a => a.status === 'Active').length;
  const incidentCount = Store.filter(Collections.INCIDENTS, i => i.status !== 'Resolved').length;

  const tiles = [
    { title: 'Total devices', value: deviceCount, label: 'Enrolled devices', color: 'var(--color-primary)', route: '/devices/all' },
    { title: 'Compliant', value: complianceStats['Compliant'] || 0, label: 'Devices compliant', color: 'var(--color-success)', route: '/devices/all' },
    { title: 'Noncompliant', value: complianceStats['Noncompliant'] || 0, label: 'Devices noncompliant', color: 'var(--color-error)', route: '/devices/all' },
    { title: 'Apps deployed', value: appCount, label: 'Applications managed', color: 'var(--color-primary)', route: '/apps/all' },
    { title: 'Policies', value: policyCount, label: 'Compliance + configuration', color: '#8764B8', route: '/devices/compliance-policies' },
    { title: 'Active alerts', value: alertCount, label: `${incidentCount} security incident${incidentCount !== 1 ? 's' : ''}`, color: alertCount > 0 ? 'var(--color-warning)' : 'var(--color-success)', route: '/tenant/alerts' },
  ];

  container.innerHTML = '';
  for (const t of tiles) {
    const tile = createElement('div', { className: 'tile' });
    tile.addEventListener('click', () => router.navigate(t.route));
    tile.innerHTML = `
      <div class="tile__header">
        <span class="tile__title">${t.title}</span>
      </div>
      <div class="tile__value" style="color:${t.color}">${t.value}</div>
      <div class="tile__label">${t.label}</div>
    `;
    container.appendChild(tile);
  }
}

function renderComplianceChart() {
  const chartEl = $('#compliance-chart');
  const legendEl = $('#compliance-legend');
  if (!chartEl || !legendEl) return;

  const stats = Store.getStats(Collections.DEVICES, 'complianceState');
  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  const segments = [
    { label: 'Compliant', value: stats['Compliant'] || 0, color: '#107C10' },
    { label: 'Noncompliant', value: stats['Noncompliant'] || 0, color: '#D13438' },
    { label: 'In grace period', value: stats['In grace period'] || 0, color: '#FFB900' },
    { label: 'Not evaluated', value: stats['Not evaluated'] || 0, color: '#8A8886' },
  ];

  // Draw donut chart using canvas
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Device compliance donut chart');
  chartEl.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const cx = 100, cy = 100, outerR = 90, innerR = 55;
  let startAngle = -Math.PI / 2;

  for (const seg of segments) {
    if (seg.value === 0) continue;
    const sliceAngle = (seg.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
    ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    startAngle += sliceAngle;
  }

  // Center text (Theme aware)
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  ctx.fillStyle = isDark ? '#FFFFFF' : '#323130';
  ctx.font = 'bold 28px Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total, cx, cy - 8);
  ctx.font = '12px Segoe UI, sans-serif';
  ctx.fillStyle = isDark ? '#ADADAD' : '#605E5C';
  ctx.fillText('devices', cx, cy + 14);

  // Legend
  legendEl.innerHTML = '';
  for (const seg of segments) {
    legendEl.innerHTML += `
      <div class="chart-legend__item">
        <span class="chart-legend__color" style="background:${seg.color}"></span>
        <span class="chart-legend__label">${seg.label}</span>
        <span class="chart-legend__value">${seg.value}</span>
      </div>
    `;
  }
}

function renderRecentAlerts() {
  const el = $('#recent-alerts');
  if (!el) return;

  const alerts = Store.filter(Collections.ALERTS, a => a.status === 'Active').slice(0, 5);

  if (alerts.length === 0) {
    el.innerHTML = '<div class="empty-state"><p>No active alerts</p></div>';
    return;
  }

  let html = '<div style="display:flex;flex-direction:column;gap:8px;">';
  for (const alert of alerts) {
    const severityColor = {
      'High': 'var(--color-error)',
      'Medium': 'var(--color-warning)',
      'Low': 'var(--color-info)',
    }[alert.severity] || 'var(--color-info)';

    html += `
      <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--color-border-subtle);">
        <span class="status-pill" style="background:${severityColor}20;color:${severityColor};min-width:60px;justify-content:center;">
          ${alert.severity}
        </span>
        <div style="flex:1;">
          <div style="font-weight:600;font-size:14px;">${alert.title}</div>
          <div style="font-size:12px;color:var(--color-text-secondary);margin-top:2px;">${alert.description.substring(0, 100)}${alert.description.length > 100 ? '…' : ''}</div>
        </div>
        <span style="font-size:12px;color:var(--color-text-tertiary);white-space:nowrap;">${new Date(alert.createdAt).toLocaleDateString()}</span>
      </div>
    `;
  }
  html += '</div>';
  el.innerHTML = html;
}


function getCompliancePill(state) {
  const map = {
    'Compliant': 'compliant',
    'Noncompliant': 'noncompliant',
    'Not evaluated': 'not-evaluated',
    'In grace period': 'grace-period',
  };
  const cls = map[state] || 'not-evaluated';
  return `<span class="status-pill status-pill--${cls}"><span class="status-pill__dot"></span>${state}</span>`;
}

function showDeviceDetail(deviceId) {
  openDeviceBlade(deviceId);
}

/* ── Policy List Renderer (generic) ── */
function renderPolicyList(collectionKey, title, params) {
  const el = getContentEl();
  clearElement(el);

  const collectionMap = {
    compliancePolicies: Collections.COMPLIANCE_POLICIES,
    configProfiles: Collections.CONFIG_PROFILES,
    apps: Collections.APPS,
    roles: Collections.ROLES,
    scopeTags: Collections.SCOPE_TAGS,
    scripts: Collections.SCRIPTS,
    conditionalAccess: Collections.CONDITIONAL_ACCESS,
    dynamicGroups: Collections.DYNAMIC_GROUPS,
    antivirusPolicies: Collections.ANTIVIRUS_POLICIES,
    firewallPolicies: Collections.FIREWALL_POLICIES,
    diskEncryptionPolicies: Collections.DISK_ENCRYPTION_POLICIES,
    securityBaselines: Collections.SECURITY_BASELINES,
    updateRings: Collections.UPDATE_RINGS,
    appProtectionPolicies: Collections.APP_PROTECTION_POLICIES,
    appConfigPolicies: Collections.APP_CONFIG_POLICIES,
    cloudPCs: Collections.CLOUD_PCS,
    provisioningPolicies: Collections.PROVISIONING_POLICIES,
    connectors: Collections.CONNECTORS,
    alerts: Collections.ALERTS,
  };

  const collection = collectionMap[collectionKey];
  const items = collection ? Store.getAll(collection) : [];

  commandBar.setActions([
    { label: 'Create', icon: Icons.add, onClick: () => showCreatePolicyModal(collectionKey, title), type: 'primary' },
    { label: 'Refresh', icon: Icons.refresh, onClick: () => { router.navigate(router.getPath(), true); }, type: 'default' },
  ]);

  // Conditional Access note
  const caNote = collectionKey === 'conditionalAccess'
    ? `<div class="info-banner info-banner--info" style="margin-bottom:16px;">
        <span class="info-banner__icon" style="color:var(--color-info)">${Icons.info}</span>
        <span>Conditional Access policies are managed in the <strong>Microsoft Entra admin center</strong>. This is a read-only view for reference.</span>
      </div>`
    : '';

  el.innerHTML = `
    <h1 class="page-title">${title}</h1>
    ${caNote}
    <div class="content-card" style="padding:0;">
      <div class="grid-toolbar" style="padding:12px 16px;">
        <div class="grid-toolbar__search">
          <span style="display:flex">${Icons.search}</span>
          <input type="text" placeholder="Search ${title.toLowerCase()}..." id="policy-search" aria-label="Search">
        </div>
        <span style="font-size:12px;color:var(--color-text-secondary);margin-left:auto;">${items.length} item${items.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="data-grid-wrapper">
        <table class="data-grid" id="policy-grid" role="grid" aria-label="${title}">
          <thead>
            <tr>
              <th>Name</th>
              <th>Platform / Type</th>
              <th>Status</th>
              <th>Assigned to</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="policy-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  renderPolicyTable(items, title, collectionKey);

  // Search
  const searchInput = $('#policy-search');
  searchInput?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = items.filter(i =>
      (i.name || '').toLowerCase().includes(q) ||
      (i.title || '').toLowerCase().includes(q) ||
      (i.platform || '').toLowerCase().includes(q) ||
      (i.type || '').toLowerCase().includes(q)
    );
    renderPolicyTable(filtered, title, collectionKey);
  });
}

function renderPolicyTable(items, title, collectionKey) {
  const tbody = $('#policy-tbody');
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--color-text-secondary);">No ${title.toLowerCase()} found</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  for (const item of items) {
    const name = item.name || item.title || '—';
    const platform = item.platform || item.type || item.category || 'Windows 10/11';
    const status = item.status || 'Active';
    const assigned = (item.assignedGroups || []).join(', ') || item.members?.join(', ') || item.target || 'All devices';

    const statusPill = status === 'Active' || status === 'On' || status === 'Connected' || status === 'Enabled'
      ? `<span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>${status}</span>`
      : status === 'Disconnected' || status === 'Error'
        ? `<span class="status-pill status-pill--noncompliant"><span class="status-pill__dot"></span>${status}</span>`
        : `<span class="status-pill status-pill--not-evaluated"><span class="status-pill__dot"></span>${status}</span>`;

    const tr = createElement('tr');
    tr.innerHTML = `
      <td><span class="cell-link" style="font-weight:600;">${escapeHtml(name)}</span></td>
      <td>${escapeHtml(platform)}</td>
      <td>${statusPill}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(assigned)}</td>
      <td>
        <button class="btn btn-sm btn-default view-policy-btn" style="display:flex;align-items:center;gap:4px;">View details</button>
      </td>
    `;
    tr.querySelector('.cell-link')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openPolicyDetailBlade(item, collectionKey, title);
    });
    tr.querySelector('.view-policy-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openPolicyDetailBlade(item, collectionKey, title);
    });
    tbody.appendChild(tr);
  }
}

function openPolicyDetailBlade(item, collectionKey, title) {
  document.querySelectorAll('.blade-overlay.policy-blade, .blade-panel.policy-blade').forEach(e => e.remove());

  const overlay = createElement('div', { className: 'blade-overlay policy-blade visible' });
  document.body.appendChild(overlay);

  const panel = createElement('div', { className: 'blade-panel policy-blade', style: 'width:460px;max-width:92vw;' });
  const name = item.name || item.title || title;
  const platform = item.platform || item.type || item.category || 'Windows 10/11';
  const assigned = (item.assignedGroups || []).join(', ') || item.members?.join(', ') || 'All devices';

  panel.innerHTML = `
    <div class="blade-panel__header">
      <h2 class="blade-panel__title" style="font-size:16px;">${escapeHtml(name)}</h2>
      <button class="blade-panel__close" id="policy-blade-close" aria-label="Close">${Icons.close}</button>
    </div>
    <div class="blade-panel__tabs">
      <button class="blade-tab active" data-tab="overview">Overview</button>
      <button class="blade-tab" data-tab="properties">Properties</button>
      <button class="blade-tab" data-tab="assignments">Assignments</button>
      <button class="blade-tab" data-tab="status">Device status</button>
    </div>
    <div class="blade-panel__body" id="policy-blade-body" style="padding:20px;">
      <div style="margin-bottom:14px;">
        <span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Active</span>
      </div>
      <dl class="kv-grid">
        <dt>Policy name</dt><dd>${escapeHtml(name)}</dd>
        <dt>Platform / Category</dt><dd>${escapeHtml(platform)}</dd>
        <dt>Assigned groups</dt><dd>${escapeHtml(assigned)}</dd>
        <dt>Created date</dt><dd>${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Active baseline'}</dd>
        <dt>Last modified</dt><dd>Aug 24, 2024</dd>
      </dl>
    </div>
    <div class="blade-panel__footer" style="display:flex;justify-content:space-between;">
      <button class="btn btn-danger btn-sm" id="policy-delete-btn">Delete policy</button>
      <button class="btn btn-default btn-sm" id="policy-close-btn">Close</button>
    </div>
  `;
  document.body.appendChild(panel);
  requestAnimationFrame(() => panel.classList.add('open'));

  const closeBlade = () => {
    panel.classList.remove('open'); overlay.classList.remove('visible');
    setTimeout(() => { panel.remove(); overlay.remove(); }, 250);
  };
  panel.querySelector('#policy-blade-close')?.addEventListener('click', closeBlade);
  panel.querySelector('#policy-close-btn')?.addEventListener('click', closeBlade);
  overlay.addEventListener('click', closeBlade);

  // Tab switching
  panel.querySelectorAll('.blade-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      panel.querySelectorAll('.blade-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const body = panel.querySelector('#policy-blade-body');
      const tName = tab.dataset.tab;
      if (tName === 'overview') {
        body.innerHTML = `
          <div style="margin-bottom:14px;"><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Active</span></div>
          <dl class="kv-grid">
            <dt>Policy name</dt><dd>${escapeHtml(name)}</dd>
            <dt>Platform / Category</dt><dd>${escapeHtml(platform)}</dd>
            <dt>Assigned groups</dt><dd>${escapeHtml(assigned)}</dd>
            <dt>Scope tags</dt><dd>Default</dd>
          </dl>
        `;
      } else if (tName === 'properties') {
        body.innerHTML = `
          <h4 style="font-size:14px;font-weight:600;margin-bottom:12px;">Configured settings</h4>
          <div style="background:var(--color-bg-canvas);padding:12px;border-radius:6px;border:1px solid var(--color-border);font-size:12px;line-height:1.6;">
            <div>✔ <strong>Configuration state:</strong> Enforced</div>
            <div>✔ <strong>OMA-URI / CSP definition:</strong> Intune native MDM provider</div>
            <div>✔ <strong>Conflict resolution:</strong> Highest security precedence</div>
          </div>
        `;
      } else if (tName === 'assignments') {
        body.innerHTML = `
          <h4 style="font-size:14px;font-weight:600;margin-bottom:12px;">Targeted groups</h4>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="padding:10px;border:1px solid var(--color-border);border-radius:6px;display:flex;align-items:center;gap:8px;">
              <span style="color:var(--color-primary)">${Icons.users}</span>
              <div><strong>${escapeHtml(assigned)}</strong><div style="font-size:11px;color:var(--color-text-secondary);">Included group</div></div>
            </div>
          </div>
        `;
      } else if (tName === 'status') {
        body.innerHTML = `
          <h4 style="font-size:14px;font-weight:600;margin-bottom:12px;">Per-device deployment status</h4>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center;margin-bottom:12px;">
            <div style="padding:8px;background:var(--color-bg-canvas);border-radius:6px;"><div style="font-weight:700;color:var(--color-success);">8</div><div style="font-size:11px;">Succeeded</div></div>
            <div style="padding:8px;background:var(--color-bg-canvas);border-radius:6px;"><div style="font-weight:700;color:var(--color-warning);">0</div><div style="font-size:11px;">Pending</div></div>
            <div style="padding:8px;background:var(--color-bg-canvas);border-radius:6px;"><div style="font-weight:700;color:var(--color-error);">0</div><div style="font-size:11px;">Conflict</div></div>
          </div>
        `;
      }
    });
  });

  // Delete button
  panel.querySelector('#policy-delete-btn')?.addEventListener('click', () => {
    if (confirm(`Delete policy "${name}"?`)) {
      const collectionMap = {
        roles: Collections.ROLES,
        scopeTags: Collections.SCOPE_TAGS,
        conditionalAccess: Collections.CONDITIONAL_ACCESS,
        dynamicGroups: Collections.DYNAMIC_GROUPS,
        antivirusPolicies: Collections.ANTIVIRUS_POLICIES,
        firewallPolicies: Collections.FIREWALL_POLICIES,
        diskEncryptionPolicies: Collections.DISK_ENCRYPTION_POLICIES,
        securityBaselines: Collections.SECURITY_BASELINES,
        updateRings: Collections.UPDATE_RINGS,
        connectors: Collections.CONNECTORS,
        alerts: Collections.ALERTS,
      };
      const col = collectionMap[collectionKey];
      if (col && item.id) {
        Store.delete(col, item.id);
      }
      toastManager.success('Policy deleted', `${name} removed.`);
      closeBlade();
      router.navigate(router.getPath(), true);
    }
  });
}

function showCreatePolicyModal(collectionKey, title) {
  const existing = document.getElementById('create-policy-modal');
  if (existing) existing.remove();

  const overlay = createElement('div', { id: 'create-policy-modal', className: 'blade-overlay visible', style: 'z-index:1500;display:flex;align-items:center;justify-content:center;' });
  const modal = createElement('div', { className: 'content-card', style: 'width:440px;max-width:90vw;background:var(--color-bg-surface);box-shadow:var(--shadow-64);border-radius:8px;padding:20px;' });
  
  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:1px solid var(--color-border);padding-bottom:10px;">
      <h3 style="font-size:16px;font-weight:600;margin:0;">Create ${escapeHtml(title)}</h3>
      <button class="blade-panel__close" id="create-modal-close" style="width:28px;height:28px;">${Icons.close}</button>
    </div>
    <div class="form-group">
      <label class="form-label required">Name</label>
      <input class="form-input" id="new-pol-name" placeholder="e.g. Baseline ${title} Policy">
    </div>
    <div class="form-group">
      <label class="form-label">Platform</label>
      <select class="form-input form-select" id="new-pol-plat">
        <option>Windows 10 and later</option>
        <option>macOS</option>
        <option>iOS/iPadOS</option>
        <option>Android Enterprise</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Assignment</label>
      <select class="form-input form-select" id="new-pol-assign">
        <option>All Devices</option>
        <option>All Corporate Users</option>
        <option>Finance Department</option>
        <option>Engineering Team</option>
      </select>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
      <button class="btn btn-default btn-sm" id="create-modal-cancel">Cancel</button>
      <button class="btn btn-primary btn-sm" id="create-modal-submit">Create</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const closeModal = () => overlay.remove();
  modal.querySelector('#create-modal-close')?.addEventListener('click', closeModal);
  modal.querySelector('#create-modal-cancel')?.addEventListener('click', closeModal);

  modal.querySelector('#create-modal-submit')?.addEventListener('click', () => {
    const nameVal = modal.querySelector('#new-pol-name')?.value.trim();
    if (!nameVal) {
      toastManager.error('Validation error', 'Please enter a policy name.');
      return;
    }
    const platVal = modal.querySelector('#new-pol-plat')?.value;
    const assignVal = modal.querySelector('#new-pol-assign')?.value;

    const collectionMap = {
      roles: Collections.ROLES,
      scopeTags: Collections.SCOPE_TAGS,
      conditionalAccess: Collections.CONDITIONAL_ACCESS,
      dynamicGroups: Collections.DYNAMIC_GROUPS,
      antivirusPolicies: Collections.ANTIVIRUS_POLICIES,
      firewallPolicies: Collections.FIREWALL_POLICIES,
      diskEncryptionPolicies: Collections.DISK_ENCRYPTION_POLICIES,
      securityBaselines: Collections.SECURITY_BASELINES,
      updateRings: Collections.UPDATE_RINGS,
      connectors: Collections.CONNECTORS,
      alerts: Collections.ALERTS,
    };
    const col = collectionMap[collectionKey];
    if (col) {
      Store.create(col, {
        id: generateId(),
        name: nameVal,
        platform: platVal,
        status: 'Active',
        assignedGroups: [assignVal],
        createdAt: new Date().toISOString(),
      });
    }

    toastManager.success('Created', `${nameVal} policy created successfully.`);
    closeModal();
    router.navigate(router.getPath(), true);
  });
}

/* ── Export Devices ── */
function exportDevices() {
  const devices = Store.getAll(Collections.DEVICES);
  const blob = new Blob([JSON.stringify(devices, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'intune-devices-export.json';
  a.click();
  URL.revokeObjectURL(url);
  toastManager.success('Export complete', `${devices.length} devices exported to JSON.`);
}

/* ── Reset Handler ── */
function handleReset() {
  if (confirm('Reset all data to default seeded state? This will delete all changes.')) {
    resetAndReseed();
    localStorage.removeItem(DISCLAIMER_STORAGE_KEY);
    toastManager.success('Data reset', 'All data has been restored to the default seeded state.');
    router.navigate('/', true);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    notificationCenter.updateBadge();
  }
}

/* ══════════════════════════════════════════════════
   BOOT
   ══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', init);
