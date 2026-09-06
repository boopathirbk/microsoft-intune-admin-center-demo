/* ============================================================
   Tenant Administration Page Module
   Tenant status, Service health, Message center, Connectors,
   Alerts, and Security Copilot settings.
   ============================================================ */

import { Icons, createElement, clearElement, $, generateId, formatDate, escapeHtml, exportCsv } from '../utils.js';
import { Store, Collections } from '../store.js';
import { router } from '../router.js';
import { ensureAuditAndCustomizationSeeded } from '../data/seed.js';

function getContentEl() { return $('#page-content'); }
function getCommandBar() { return window.IntuneApp?.commandBar; }
function toast() { return window.IntuneApp?.toastManager; }

/* ══════════════════════════════════════════════════
   TENANT STATUS / OVERVIEW
   ══════════════════════════════════════════════════ */
export function renderTenantStatus() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Refresh', icon: Icons.refresh, onClick: renderTenantStatus, type: 'default' },
  ]);

  const devices = Store.getAll(Collections.DEVICES);
  const connectors = Store.getAll(Collections.CONNECTORS);
  const alerts = Store.getAll(Collections.ALERTS);

  el.innerHTML = `
    <h1 class="page-title">Tenant status</h1>
    <p class="page-subtitle">View your organization's Microsoft Intune subscription details, tenant health, and active connectors.</p>

    <!-- Tenant Details Summary Cards -->
    <div class="tile-grid" style="grid-template-columns:repeat(4, 1fr);margin-bottom:20px;">
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Service release</span></div>
        <div class="tile__value" style="font-size:22px;color:var(--color-primary)">2408 (Aug 2024)</div>
        <div class="tile__label">Current Intune build</div>
      </div>
      <div class="tile">
        <div class="tile__header"><span class="tile__title">MDM authority</span></div>
        <div class="tile__value" style="font-size:22px;color:var(--color-success)">Microsoft Intune</div>
        <div class="tile__label">Full cloud authority</div>
      </div>
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Total enrolled</span></div>
        <div class="tile__value" style="font-size:22px;color:var(--color-primary)">${devices.length}</div>
        <div class="tile__label">Active managed devices</div>
      </div>
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Service health</span></div>
        <div class="tile__value" style="font-size:22px;color:var(--color-success)">Healthy</div>
        <div class="tile__label">All services operational</div>
      </div>
    </div>

    <!-- Tenant Properties Card -->
    <div class="content-card" style="margin-bottom:16px;">
      <div class="content-card__header">
        <h2 class="content-card__title">Tenant details</h2>
      </div>
      <dl class="kv-grid" style="grid-template-columns:repeat(2, 1fr 2fr);gap:12px 24px;">
        <dt>Tenant name</dt><dd><strong>Contoso Enterprise Cloud Lab</strong></dd>
        <dt>Tenant ID</dt><dd style="font-family:monospace;font-size:12px;">3fa85f64-5717-4562-b3fc-2c963f66afa6</dd>
        <dt>Tenant location</dt><dd>North America (East US 2)</dd>
        <dt>License type</dt><dd><span class="tag">Microsoft 365 E5 Enterprise</span></dd>
        <dt>Total licensed users</dt><dd>250 seats (48 active assignments)</dd>
        <dt>Intune Account state</dt><dd><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Active</span></dd>
      </dl>
    </div>

    <!-- Connectors Status Grid -->
    <div class="content-card" style="margin-bottom:16px;">
      <div class="content-card__header" style="display:flex;justify-content:space-between;align-items:center;">
        <h2 class="content-card__title">Connector status</h2>
        <a href="#/tenant/connectors" style="font-size:12px;color:var(--color-primary);text-decoration:none;">View all connectors →</a>
      </div>
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Connector</th><th>Platform</th><th>Status</th><th>Last sync</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Apple Push Notification service (APNs)</strong></td>
              <td>iOS / iPadOS / macOS</td>
              <td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Active</span></td>
              <td>Expires in 284 days</td>
            </tr>
            <tr>
              <td><strong>Managed Google Play</strong></td>
              <td>Android Enterprise</td>
              <td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Bound</span></td>
              <td>Synced today</td>
            </tr>
            <tr>
              <td><strong>Microsoft Defender for Endpoint</strong></td>
              <td>Cross-platform</td>
              <td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Connected</span></td>
              <td>Real-time telemetry</td>
            </tr>
            <tr>
              <td><strong>Windows Autopilot Sync</strong></td>
              <td>Windows</td>
              <td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Ready</span></td>
              <td>Synced 12 mins ago</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════
   SERVICE HEALTH DASHBOARD
   ══════════════════════════════════════════════════ */
export function renderServiceHealth() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Refresh health status', icon: Icons.refresh, onClick: renderServiceHealth, type: 'default' },
  ]);

  const services = [
    { name: 'Device Configuration Service', category: 'Core MDM', status: 'Healthy', details: 'Policy sync and evaluation operational' },
    { name: 'Windows Autopilot Registration', category: 'Deployment', status: 'Healthy', details: 'Hardware hash registration and profile assignment active' },
    { name: 'App Management & MAM Service', category: 'Applications', status: 'Healthy', details: 'Intune MAM gateway responding within normal latency' },
    { name: 'Microsoft Defender for Endpoint Connector', category: 'Security', status: 'Healthy', details: 'Device risk scores synchronized' },
    { name: 'Cloud PKI SCEP Issuing CA', category: 'Intune Suite', status: 'Healthy', details: 'Certificate issuance online' },
    { name: 'Remote Help Relay Service', category: 'Intune Suite', status: 'Healthy', details: 'P2P sessions functioning normally' },
  ];

  el.innerHTML = `
    <h1 class="page-title">Service health</h1>
    <p class="page-subtitle">Current operational health and advisory alerts for Microsoft Intune and connected cloud services.</p>

    <div style="background:var(--color-bg-surface);border:1px solid var(--color-border);border-left:4px solid var(--color-success);padding:16px;border-radius:6px;margin-bottom:20px;display:flex;align-items:center;gap:12px;">
      <span style="color:var(--color-success);display:flex;">${Icons.checkmark}</span>
      <div>
        <strong>All Microsoft Intune services are healthy and operational</strong>
        <div style="font-size:12px;color:var(--color-text-secondary);margin-top:2px;">No active service incidents impacting tenant services.</div>
      </div>
    </div>

    <div class="content-card">
      <h2 class="content-card__title" style="margin-bottom:12px;">Service components</h2>
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Service component</th><th>Category</th><th>Status</th><th>Telemetry & details</th></tr>
          </thead>
          <tbody>
            ${services.map(s => `
              <tr>
                <td><strong>${escapeHtml(s.name)}</strong></td>
                <td><span class="tag">${escapeHtml(s.category)}</span></td>
                <td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>${escapeHtml(s.status)}</span></td>
                <td style="color:var(--color-text-secondary);font-size:12px;">${escapeHtml(s.details)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════
   MESSAGE CENTER
   ══════════════════════════════════════════════════ */
export function renderMessageCenter() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Mark all read', icon: Icons.checkmark, onClick: () => toast()?.success('Updated', 'All messages marked as read.'), type: 'default' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderMessageCenter, type: 'default' },
  ]);

  const messages = [
    {
      id: 'MC841290', title: 'New features in Windows Autopilot device preparation',
      category: 'Plan for change', date: 'Aug 28, 2024', tag: 'High priority',
      summary: 'Windows Autopilot device preparation (Autopilot v2) is now generally available. Supports faster deployment, user-driven Entra join, and streamlined device group assignments.',
    },
    {
      id: 'MC829104', title: 'Intune moving to support Android 10 and later for user-based management',
      category: 'Action required', date: 'Aug 14, 2024', tag: 'Deprecation',
      summary: 'Starting with the October 2024 release, Microsoft Intune will require Android 10 and above. Devices running Android 9 will no longer receive policy updates.',
    },
    {
      id: 'MC801293', title: 'Retirement of legacy device administrator management for Android devices',
      category: 'Major update', date: 'Jul 22, 2024', tag: 'Compliance',
      summary: 'Legacy Android Device Administrator management is deprecated. Migrate existing devices to Android Enterprise Work Profile or Fully Managed modes.',
    },
    {
      id: 'MC789201', title: 'Enhanced Windows LAPS reporting and manual password rotation',
      category: 'Feature update', date: 'Jul 05, 2024', tag: 'Security',
      summary: 'Administrators can now inspect historical LAPS rotation logs and trigger immediate password rotation directly from the device overview blade.',
    },
    {
      id: 'MC762100', title: 'Microsoft Cloud PKI general availability in Intune Suite',
      category: 'Announcement', date: 'Jun 18, 2024', tag: 'Intune Suite',
      summary: 'Simplify certificate-based authentication without deploying on-premises Active Directory Certificate Services (AD CS) or SCEP NDES servers.',
    },
  ];

  el.innerHTML = `
    <h1 class="page-title">Message center</h1>
    <p class="page-subtitle">Track planned changes, maintenance windows, and feature releases from Microsoft 365.</p>

    <div class="content-card" style="padding:0;">
      <div class="grid-toolbar" style="padding:12px 16px;">
        <div class="grid-toolbar__search">
          <span style="display:flex">${Icons.search}</span>
          <input type="text" placeholder="Search message center..." id="msg-search" aria-label="Search messages">
        </div>
        <span style="font-size:12px;color:var(--color-text-secondary);margin-left:auto;">${messages.length} communications</span>
      </div>
      <div class="data-grid-wrapper">
        <table class="data-grid" id="msg-grid">
          <thead>
            <tr><th>Message ID</th><th>Title</th><th>Category</th><th>Tag</th><th>Published</th></tr>
          </thead>
          <tbody id="msg-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  const renderRows = (list) => {
    const tbody = document.getElementById('msg-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    for (const m of list) {
      const tr = createElement('tr');
      tr.innerHTML = `
        <td style="font-family:monospace;font-size:12px;">${escapeHtml(m.id)}</td>
        <td>
          <span class="cell-link" style="font-weight:600;">${escapeHtml(m.title)}</span>
          <div style="font-size:12px;color:var(--color-text-secondary);margin-top:2px;max-width:500px;">${escapeHtml(m.summary)}</div>
        </td>
        <td><span class="tag">${escapeHtml(m.category)}</span></td>
        <td><span class="tag" style="background:var(--color-primary-lighter);color:var(--color-primary);">${escapeHtml(m.tag)}</span></td>
        <td style="font-size:12px;white-space:nowrap;">${escapeHtml(m.date)}</td>
      `;
      tr.querySelector('.cell-link')?.addEventListener('click', () => {
        toast()?.info(m.id, m.title);
      });
      tbody.appendChild(tr);
    }
  };

  renderRows(messages);

  document.getElementById('msg-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = messages.filter(m => m.title.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.summary.toLowerCase().includes(q));
    renderRows(filtered);
  });
}

/* ══════════════════════════════════════════════════
   CONNECTORS
   ══════════════════════════════════════════════════ */
export function renderConnectors() {
  const el = getContentEl(); clearElement(el);
  const connectors = Store.getAll(Collections.CONNECTORS);

  getCommandBar()?.setActions([
    { label: 'Add connector', icon: Icons.add, onClick: createConnectorModal, type: 'primary' },
    {
      label: 'Export',
      icon: Icons.download,
      onClick: () => {
        exportCsv(
          'connectors_and_tokens.csv',
          ['Connector name', 'Type', 'Status', 'Last sync'],
          connectors.map(c => [c.name, c.type, c.status, c.lastSync ? formatDate(c.lastSync) : 'Active'])
        );
        toast()?.success('Export', 'Connectors exported to CSV.');
      },
      type: 'default',
    },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderConnectors, type: 'default' },
  ]);

  el.innerHTML = `
    <h1 class="page-title">Connectors and tokens</h1>
    <p class="page-subtitle">Configure directory synchronizations, public app store connections, and security telemetry integrations.</p>

    <div class="content-card" style="padding:0;">
      <div class="grid-toolbar" style="padding:12px 16px;">
        <div class="grid-toolbar__search">
          <span style="display:flex">${Icons.search}</span>
          <input type="text" placeholder="Search connectors and tokens..." id="conn-search" aria-label="Search connectors">
        </div>
        <span style="font-size:12px;color:var(--color-text-secondary);margin-left:auto;" id="conn-count">${connectors.length} connectors</span>
      </div>
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Connector name</th><th>Type</th><th>Status</th><th>Last sync / expiration</th><th>Actions</th><th></th></tr>
          </thead>
          <tbody id="conn-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  const renderTableRows = (list) => {
    const tbody = document.getElementById('conn-tbody');
    if (!tbody) return;
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--color-text-secondary);">No connectors found</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    for (const c of list) {
      const tr = createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(c.name)}</strong></td>
        <td><span class="tag">${escapeHtml(c.type)}</span></td>
        <td><span class="status-pill status-pill--${c.status === 'Connected' || c.status === 'Active' ? 'compliant' : 'noncompliant'}"><span class="status-pill__dot"></span>${escapeHtml(c.status)}</span></td>
        <td>${c.lastSync ? formatDate(c.lastSync) : 'Active'}</td>
        <td>
          <button class="btn btn-sm btn-default conn-test-btn" data-id="${c.id}">Test connection</button>
        </td>
        <td><button class="btn-icon btn-delete" data-id="${c.id}">${Icons.delete}</button></td>
      `;

      tr.querySelector('.conn-test-btn')?.addEventListener('click', () => {
        toast()?.success('Connection test', `Connector "${c.name}" verified successfully. Latency 38ms.`);
      });

      tr.querySelector('.btn-delete')?.addEventListener('click', () => {
        if (confirm(`Delete connector "${c.name}"?`)) {
          Store.delete(Collections.CONNECTORS, c.id);
          toast()?.success('Deleted', 'Connector removed.');
          renderConnectors();
        }
      });

      tbody.appendChild(tr);
    }
  };

  renderTableRows(connectors);

  document.getElementById('conn-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = connectors.filter(c => c.name.toLowerCase().includes(q) || (c.type || '').toLowerCase().includes(q) || (c.status || '').toLowerCase().includes(q));
    renderTableRows(filtered);
    const countEl = document.getElementById('conn-count');
    if (countEl) countEl.textContent = `${filtered.length} connector${filtered.length !== 1 ? 's' : ''}`;
  });
}

function createConnectorModal() {
  document.getElementById('conn-modal')?.remove();
  const overlay = createElement('div', { id: 'conn-modal', className: 'blade-overlay visible', style: 'z-index:1500;display:flex;align-items:center;justify-content:center;' });
  const modal = createElement('div', { className: 'content-card', style: 'width:480px;max-width:90vw;background:var(--color-bg-surface);box-shadow:var(--shadow-64);border-radius:8px;padding:20px;' });

  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:1px solid var(--color-border);padding-bottom:10px;">
      <h3 style="font-size:16px;font-weight:600;margin:0;">Add Connector or Token</h3>
      <button class="blade-panel__close" id="conn-modal-close" style="width:28px;height:28px;">${Icons.close}</button>
    </div>
    <div class="form-group"><label class="form-label required">Connector Name</label><input class="form-input" id="new-conn-name" placeholder="e.g. Contoso Apple APNs Certificate"></div>
    <div class="form-group"><label class="form-label">Connector Type</label><select class="form-input form-select" id="new-conn-type">
      <option selected>Apple Push Notification certificate (APNs)</option>
      <option>Apple Volume Purchase Program (VPP)</option>
      <option>Managed Google Play enterprise binding</option>
      <option>Microsoft Defender for Endpoint integration</option>
      <option>Telecom Expense Management</option>
      <option>Windows Autopatch service</option>
    </select></div>
    <div class="form-group"><label class="form-label">Associated Administrator Account / UPN</label><input class="form-input" id="new-conn-acc" value="admin@contoso.onmicrosoft.com"></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
      <button class="btn btn-default" id="conn-cancel">Cancel</button>
      <button class="btn btn-primary" id="conn-submit">Add connector</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  modal.querySelector('#conn-modal-close')?.addEventListener('click', close);
  modal.querySelector('#conn-cancel')?.addEventListener('click', close);

  modal.querySelector('#conn-submit')?.addEventListener('click', () => {
    const name = modal.querySelector('#new-conn-name')?.value?.trim();
    if (!name) { toast()?.error('Validation', 'Connector name is required.'); return; }
    Store.create(Collections.CONNECTORS, {
      id: generateId(),
      name,
      type: modal.querySelector('#new-conn-type')?.value,
      status: 'Connected',
      lastSync: new Date().toISOString(),
    });
    toast()?.success('Added', `Connector "${name}" added successfully.`);
    close();
    renderConnectors();
  });
}

/* ══════════════════════════════════════════════════
   SECURITY COPILOT SETTINGS
   ══════════════════════════════════════════════════ */
export function renderSecurityCopilotSettings() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Launch Copilot panel', icon: Icons.copilot, onClick: () => window.IntuneCopilot?.open(), type: 'primary' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderSecurityCopilotSettings, type: 'default' },
  ]);

  el.innerHTML = `
    <h1 class="page-title">Microsoft Security Copilot in Intune</h1>
    <p class="page-subtitle">Configure generative AI compute units, Intune plugin permissions, and security promptbooks.</p>

    <div class="tile-grid" style="grid-template-columns:repeat(3, 1fr);margin-bottom:20px;">
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Security Compute Units (SCUs)</span></div>
        <div class="tile__value" style="color:var(--color-primary)">2 SCUs</div>
        <div class="tile__label">Provisioned capacity</div>
      </div>
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Intune Plugin</span></div>
        <div class="tile__value" style="color:var(--color-success)">Enabled</div>
        <div class="tile__label">Read & write device actions</div>
      </div>
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Active Promptbooks</span></div>
        <div class="tile__value" style="color:var(--color-primary)">6 Ready</div>
        <div class="tile__label">Automated investigation workflows</div>
      </div>
    </div>

    <!-- Features Card -->
    <div class="content-card" style="margin-bottom:16px;">
      <h2 class="content-card__title" style="margin-bottom:12px;">Capabilities enabled</h2>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;align-items:flex-start;gap:12px;padding:12px;border:1px solid var(--color-border);border-radius:6px;">
          <span style="color:var(--color-primary);font-size:20px;">📊</span>
          <div>
            <strong>Device & Policy Telemetry Synthesis</strong>
            <p style="margin:2px 0 0 0;font-size:13px;color:var(--color-text-secondary);">Natural language querying of device compliance status, non-compliant devices, and hardware inventories.</p>
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px;padding:12px;border:1px solid var(--color-border);border-radius:6px;">
          <span style="color:var(--color-warning);font-size:20px;">🔍</span>
          <div>
            <strong>Error & Conflict Root-Cause Analysis</strong>
            <p style="margin:2px 0 0 0;font-size:13px;color:var(--color-text-secondary);">Analyzes OMA-URI errors, BitLocker encryption failures, and conflicting configuration profile settings.</p>
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px;padding:12px;border:1px solid var(--color-border);border-radius:6px;">
          <span style="color:var(--color-success);font-size:20px;">⚡</span>
          <div>
            <strong>AI-Assisted Policy Authoring</strong>
            <p style="margin:2px 0 0 0;font-size:13px;color:var(--color-text-secondary);">Summarizes complex settings catalogs and generates recommended assignments based on group memberships.</p>
          </div>
        </div>
      </div>
    </div>

    <div style="display:flex;justify-content:flex-start;">
      <button class="btn btn-primary" id="open-copilot-btn" style="display:flex;align-items:center;gap:6px;">
        ${Icons.copilot} Open Copilot Assistant Panel
      </button>
    </div>
  `;

  document.getElementById('open-copilot-btn')?.addEventListener('click', () => {
    window.IntuneCopilot?.open();
  });
}

/* ══════════════════════════════════════════════════
   AUDIT LOGS
   ══════════════════════════════════════════════════ */
export function renderAuditLogs() {
  ensureAuditAndCustomizationSeeded();
  const el = getContentEl(); clearElement(el);
  const logs = Store.getAll(Collections.AUDIT_LOGS);

  getCommandBar()?.setActions([
    {
      label: 'Export',
      icon: Icons.download,
      onClick: () => {
        exportCsv(
          'tenant_audit_logs.csv',
          ['Date & Time (UTC)', 'Initiated by', 'Activity', 'Category', 'Target', 'Status', 'Client IP', 'Correlation ID'],
          logs.map(l => [l.activityDateTime, l.initiatedBy, l.activity, l.category, l.target, l.result, l.clientIp, l.correlationId])
        );
        toast()?.success('Export', 'Tenant audit logs exported to CSV.');
      },
      type: 'default',
    },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderAuditLogs, type: 'default' },
  ]);

  el.innerHTML = `
    <h1 class="page-title">Audit logs</h1>
    <p class="page-subtitle">Track administrative activities, policy modifications, device wipes, and connector events across Microsoft Intune.</p>

    <div class="content-card" style="padding:0;">
      <div class="grid-toolbar" style="padding:12px 16px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
        <div class="grid-toolbar__search" style="flex:1;min-width:240px;">
          <span style="display:flex">${Icons.search}</span>
          <input type="text" placeholder="Search by activity, user, target, or correlation ID..." id="audit-search" aria-label="Search audit logs">
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <label style="font-size:12px;color:var(--color-text-secondary);">Category:</label>
          <select class="form-input form-select" id="audit-cat-filter" style="width:auto;padding:4px 28px 4px 8px;font-size:12px;">
            <option value="all">All categories</option>
            <option value="Device">Device</option>
            <option value="Policy">Policy</option>
            <option value="Application">Application</option>
            <option value="Enrollment">Enrollment</option>
            <option value="Security">Security</option>
            <option value="Connector">Connector</option>
          </select>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <label style="font-size:12px;color:var(--color-text-secondary);">Status:</label>
          <select class="form-input form-select" id="audit-res-filter" style="width:auto;padding:4px 28px 4px 8px;font-size:12px;">
            <option value="all">All results</option>
            <option value="Success">Success</option>
            <option value="Failure">Failure</option>
          </select>
        </div>
        <span style="font-size:12px;color:var(--color-text-secondary);margin-left:auto;" id="audit-count">${logs.length} events</span>
      </div>

      <div class="data-grid-wrapper">
        <table class="data-grid" id="audit-grid">
          <thead>
            <tr>
              <th>Date & time (UTC)</th>
              <th>Initiated by (actor)</th>
              <th>Activity</th>
              <th>Category</th>
              <th>Target resource</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="audit-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  const renderTableRows = (list) => {
    const tbody = document.getElementById('audit-tbody');
    if (!tbody) return;
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--color-text-secondary);">No audit events matching current filters</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    for (const log of list) {
      const tr = createElement('tr');
      tr.style.cursor = 'pointer';
      const dt = new Date(log.activityDateTime).toLocaleString();
      const statusPill = log.result === 'Success'
        ? '<span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Success</span>'
        : '<span class="status-pill status-pill--noncompliant"><span class="status-pill__dot"></span>Failure</span>';

      tr.innerHTML = `
        <td style="font-size:12px;white-space:nowrap;font-family:monospace;">${escapeHtml(dt)}</td>
        <td><strong>${escapeHtml(log.initiatedBy)}</strong></td>
        <td><span class="cell-link" style="font-weight:600;">${escapeHtml(log.activity)}</span></td>
        <td><span class="tag">${escapeHtml(log.category)}</span></td>
        <td>${escapeHtml(log.target)}</td>
        <td>${statusPill}</td>
        <td style="text-align:right;"><button class="btn btn-sm btn-default view-audit-btn">Details</button></td>
      `;

      tr.addEventListener('click', () => showAuditDetailBlade(log));
      tbody.appendChild(tr);
    }
  };

  const applyFilters = () => {
    const q = (document.getElementById('audit-search')?.value || '').toLowerCase();
    const cat = document.getElementById('audit-cat-filter')?.value || 'all';
    const res = document.getElementById('audit-res-filter')?.value || 'all';

    const filtered = logs.filter(l => {
      const matchQ = !q ||
        l.activity.toLowerCase().includes(q) ||
        l.initiatedBy.toLowerCase().includes(q) ||
        l.target.toLowerCase().includes(q) ||
        (l.correlationId || '').toLowerCase().includes(q) ||
        (l.details || '').toLowerCase().includes(q);
      const matchCat = cat === 'all' || l.category === cat;
      const matchRes = res === 'all' || l.result === res;
      return matchQ && matchCat && matchRes;
    });

    renderTableRows(filtered);
    const countEl = document.getElementById('audit-count');
    if (countEl) countEl.textContent = `${filtered.length} event${filtered.length !== 1 ? 's' : ''}`;
  };

  renderTableRows(logs);

  document.getElementById('audit-search')?.addEventListener('input', applyFilters);
  document.getElementById('audit-cat-filter')?.addEventListener('change', applyFilters);
  document.getElementById('audit-res-filter')?.addEventListener('change', applyFilters);
}

export function showAuditDetailBlade(log) {
  document.getElementById('audit-detail-blade')?.remove();
  const overlay = createElement('div', { id: 'audit-detail-blade', className: 'blade-overlay visible', style: 'z-index:1500;' });
  const blade = createElement('div', { className: 'blade-panel visible', style: 'width:620px;max-width:94vw;' });

  const dt = new Date(log.activityDateTime).toLocaleString();
  const statusPill = log.result === 'Success'
    ? '<span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Success</span>'
    : '<span class="status-pill status-pill--noncompliant"><span class="status-pill__dot"></span>Failure</span>';

  blade.innerHTML = `
    <div class="blade-panel__header">
      <div class="blade-panel__breadcrumb">Tenant administration &gt; Audit logs &gt; Event details</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
        <h2 class="blade-panel__title" style="font-size:18px;">${escapeHtml(log.activity)}</h2>
        <button class="blade-panel__close" id="audit-blade-close" aria-label="Close">${Icons.close}</button>
      </div>
    </div>

    <div class="blade-panel__body" style="padding:20px;overflow-y:auto;display:flex;flex-direction:column;gap:16px;">
      <!-- Summary Card -->
      <div class="content-card" style="margin:0;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <h3 class="content-card__title" style="margin:0;">Event summary</h3>
          ${statusPill}
        </div>
        <dl class="kv-grid" style="grid-template-columns:1fr 2fr;gap:10px 16px;">
          <dt>Activity</dt><dd><strong>${escapeHtml(log.activity)}</strong></dd>
          <dt>Category</dt><dd><span class="tag">${escapeHtml(log.category)}</span></dd>
          <dt>Date & time</dt><dd style="font-family:monospace;font-size:12px;">${escapeHtml(dt)}</dd>
          <dt>Initiated by</dt><dd><strong>${escapeHtml(log.initiatedBy)}</strong></dd>
          <dt>Client IP address</dt><dd style="font-family:monospace;font-size:12px;">${escapeHtml(log.clientIp || '198.51.100.42')}</dd>
          <dt>Correlation ID</dt><dd style="font-family:monospace;font-size:11px;">${escapeHtml(log.correlationId || '—')}</dd>
        </dl>
      </div>

      <!-- Target Card -->
      <div class="content-card" style="margin:0;">
        <h3 class="content-card__title" style="margin-bottom:12px;">Target resource</h3>
        <dl class="kv-grid" style="grid-template-columns:1fr 2fr;gap:10px 16px;">
          <dt>Resource name</dt><dd><strong>${escapeHtml(log.target)}</strong></dd>
          <dt>Resource ID</dt><dd style="font-family:monospace;font-size:12px;">${escapeHtml(log.targetId || '—')}</dd>
          <dt>Type</dt><dd>${escapeHtml(log.category)} resource</dd>
        </dl>
      </div>

      <!-- Details Payload -->
      <div class="content-card" style="margin:0;">
        <h3 class="content-card__title" style="margin-bottom:12px;">Activity description & telemetry</h3>
        <div style="background:var(--color-bg-canvas);border:1px solid var(--color-border);border-radius:6px;padding:14px;font-size:13px;line-height:1.5;">
          ${escapeHtml(log.details || 'No additional telemetry reported.')}
        </div>
      </div>
    </div>

    <div class="blade-panel__footer" style="display:flex;justify-content:flex-end;gap:8px;">
      <button class="btn btn-default" id="audit-blade-done">Done</button>
    </div>
  `;

  overlay.appendChild(blade);
  document.body.appendChild(overlay);

  const closeBlade = () => overlay.remove();
  blade.querySelector('#audit-blade-close')?.addEventListener('click', closeBlade);
  blade.querySelector('#audit-blade-done')?.addEventListener('click', closeBlade);
}

/* ══════════════════════════════════════════════════
   COMPANY PORTAL CUSTOMIZATION
   ══════════════════════════════════════════════════ */
export function renderCustomization() {
  ensureAuditAndCustomizationSeeded();
  const el = getContentEl(); clearElement(el);
  const branding = Store.get(Collections.CUSTOMIZATION, 'tenant_branding') || {
    id: 'tenant_branding',
    orgName: 'Contoso Corporation',
    accentColor: '#0078D4',
    showLogo: true,
    contactName: 'Contoso IT Helpdesk',
    contactPhone: '+1 (800) 555-0199',
    contactEmail: 'ithelpdesk@contoso.com',
    supportWebUrl: 'https://helpdesk.contoso.com',
    additionalInfo: 'For urgent device lockouts, BitLocker PIN resets, or lost hardware, call the 24/7 hotline directly.',
    privacyUrl: 'https://contoso.com/privacy',
  };

  getCommandBar()?.setActions([
    {
      label: 'Save branding',
      icon: Icons.checkmark,
      onClick: () => saveBranding(),
      type: 'primary',
    },
    {
      label: 'Reset to default',
      icon: Icons.refresh,
      onClick: () => {
        if (confirm('Reset Company Portal customization to default Contoso branding?')) {
          Store.delete(Collections.CUSTOMIZATION, 'tenant_branding');
          ensureAuditAndCustomizationSeeded();
          toast()?.success('Reset', 'Company Portal branding restored to default.');
          renderCustomization();
        }
      },
      type: 'default',
    },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderCustomization, type: 'default' },
  ]);

  el.innerHTML = `
    <h1 class="page-title">Customization</h1>
    <p class="page-subtitle">Configure organization branding, IT support contact details, and privacy notices shown to users in the Company Portal app.</p>

    <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:24px;align-items:flex-start;">
      
      <!-- Left Column: Form Controls -->
      <div style="display:flex;flex-direction:column;gap:16px;">
        
        <!-- Organization & Theme Card -->
        <div class="content-card">
          <h2 class="content-card__title" style="margin-bottom:14px;">Organization branding</h2>
          
          <div class="form-group">
            <label class="form-label required">Organization name</label>
            <input class="form-input" id="cust-org-name" value="${escapeHtml(branding.orgName || 'Contoso Corporation')}">
            <span style="font-size:12px;color:var(--color-text-secondary);margin-top:4px;display:block;">Displayed on Company Portal banner, email notifications, and device enrollment screens.</span>
          </div>

          <div class="form-group">
            <label class="form-label">Theme / Accent color</label>
            <div style="display:flex;align-items:center;gap:10px;">
              <input type="color" id="cust-color-picker" value="${branding.accentColor || '#0078D4'}" style="width:40px;height:36px;padding:0;border:1px solid var(--color-border);border-radius:4px;cursor:pointer;background:none;">
              <input class="form-input" id="cust-color-hex" value="${branding.accentColor || '#0078D4'}" style="width:120px;font-family:monospace;">
              <div style="display:flex;gap:6px;">
                <button type="button" class="cust-swatch" data-color="#0078D4" style="width:24px;height:24px;border-radius:50%;background:#0078D4;border:2px solid var(--color-border);cursor:pointer;" title="Intune Blue"></button>
                <button type="button" class="cust-swatch" data-color="#5C2D91" style="width:24px;height:24px;border-radius:50%;background:#5C2D91;border:2px solid var(--color-border);cursor:pointer;" title="Purple"></button>
                <button type="button" class="cust-swatch" data-color="#008272" style="width:24px;height:24px;border-radius:50%;background:#008272;border:2px solid var(--color-border);cursor:pointer;" title="Teal"></button>
                <button type="button" class="cust-swatch" data-color="#D83B01" style="width:24px;height:24px;border-radius:50%;background:#D83B01;border:2px solid var(--color-border);cursor:pointer;" title="Orange"></button>
                <button type="button" class="cust-swatch" data-color="#107C10" style="width:24px;height:24px;border-radius:50%;background:#107C10;border:2px solid var(--color-border);cursor:pointer;" title="Green"></button>
              </div>
            </div>
          </div>

          <div class="form-group" style="margin-top:14px;">
            <label class="form-label">Show company logo & banner</label>
            <div class="toggle ${branding.showLogo !== false ? 'on' : ''}" id="cust-logo-toggle">
              <div class="toggle__track"><div class="toggle__thumb"></div></div>
              <span class="toggle__label">Display brand emblem in Company Portal app header</span>
            </div>
          </div>
        </div>

        <!-- Support Information Card -->
        <div class="content-card">
          <h2 class="content-card__title" style="margin-bottom:14px;">Support contact information</h2>
          <div class="form-group">
            <label class="form-label">Contact person or team</label>
            <input class="form-input" id="cust-contact-name" value="${escapeHtml(branding.contactName || 'Contoso IT Helpdesk')}">
          </div>
          <div class="form-group">
            <label class="form-label">Phone number</label>
            <input class="form-input" id="cust-contact-phone" value="${escapeHtml(branding.contactPhone || '+1 (800) 555-0199')}">
          </div>
          <div class="form-group">
            <label class="form-label">Email address</label>
            <input class="form-input" id="cust-contact-email" value="${escapeHtml(branding.contactEmail || 'ithelpdesk@contoso.com')}">
          </div>
          <div class="form-group">
            <label class="form-label">Support website URL</label>
            <input class="form-input" id="cust-contact-web" value="${escapeHtml(branding.supportWebUrl || 'https://helpdesk.contoso.com')}">
          </div>
          <div class="form-group">
            <label class="form-label">Additional support information</label>
            <textarea class="form-input" id="cust-contact-notes" rows="3">${escapeHtml(branding.additionalInfo || '')}</textarea>
          </div>
        </div>

        <!-- Privacy Card -->
        <div class="content-card">
          <h2 class="content-card__title" style="margin-bottom:14px;">Privacy & legal statement</h2>
          <div class="form-group">
            <label class="form-label">Privacy URL</label>
            <input class="form-input" id="cust-privacy-url" value="${escapeHtml(branding.privacyUrl || 'https://contoso.com/privacy')}">
          </div>
          <div style="display:flex;gap:8px;margin-top:16px;">
            <button class="btn btn-primary" id="cust-save-btn">Save changes</button>
            <button class="btn btn-default" id="cust-discard-btn">Discard</button>
          </div>
        </div>

      </div>

      <!-- Right Column: Interactive Company Portal Preview -->
      <div style="position:sticky;top:20px;">
        <div class="content-card" style="padding:0;overflow:hidden;border:2px solid var(--color-border);box-shadow:var(--shadow-16);">
          <div style="background:var(--color-bg-surface);padding:10px 14px;border-bottom:1px solid var(--color-border);display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="width:10px;height:10px;border-radius:50%;background:#F1707B;display:inline-block;"></span>
              <span style="width:10px;height:10px;border-radius:50%;background:#FFD335;display:inline-block;"></span>
              <span style="width:10px;height:10px;border-radius:50%;background:#54B054;display:inline-block;"></span>
              <span style="font-size:12px;font-weight:600;margin-left:8px;color:var(--color-text-secondary);">Company Portal Preview</span>
            </div>
            <span class="tag" style="font-size:10px;">Live Simulator</span>
          </div>

          <!-- Phone / Window Body -->
          <div style="background:var(--color-bg-canvas);min-height:500px;display:flex;flex-direction:column;">
            <!-- Brand Banner -->
            <div id="prev-banner" style="background:${branding.accentColor || '#0078D4'};padding:20px;color:#FFFFFF;display:flex;align-items:center;gap:12px;transition:background 0.2s;">
              <div id="prev-logo-icon" style="width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px;">
                C
              </div>
              <div>
                <h3 id="prev-org-name" style="margin:0;font-size:16px;font-weight:700;color:#FFFFFF;">${escapeHtml(branding.orgName || 'Contoso Corporation')}</h3>
                <span style="font-size:12px;opacity:0.9;">Company Portal</span>
              </div>
            </div>

            <!-- Preview Body Content -->
            <div style="padding:16px;display:flex;flex-direction:column;gap:12px;flex:1;">
              
              <!-- User Greeting -->
              <div style="background:var(--color-bg-surface);padding:12px;border-radius:6px;border:1px solid var(--color-border);">
                <div style="font-size:11px;color:var(--color-text-secondary);">Signed in as</div>
                <div style="font-weight:600;font-size:13px;margin-top:2px;">alex.johnson@contoso.onmicrosoft.com</div>
              </div>

              <!-- Enrolled Devices Card -->
              <div style="background:var(--color-bg-surface);padding:12px;border-radius:6px;border:1px solid var(--color-border);">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                  <strong style="font-size:12px;">Your devices</strong>
                  <span class="status-pill status-pill--compliant" style="font-size:10px;"><span class="status-pill__dot"></span>In sync</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;font-size:12px;padding:6px 0;border-bottom:1px solid var(--color-border-subtle);">
                  <span style="color:var(--color-primary);">${Icons.devices}</span>
                  <div>
                    <strong>DESKTOP-WIN01</strong>
                    <div style="font-size:10px;color:var(--color-text-secondary);">This device • Compliant</div>
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;font-size:12px;padding:6px 0;">
                  <span style="color:var(--color-primary);">${Icons.apple}</span>
                  <div>
                    <strong>Sarah-iPhone-14</strong>
                    <div style="font-size:10px;color:var(--color-text-secondary);">iOS 17.5 • Compliant</div>
                  </div>
                </div>
              </div>

              <!-- IT Support Contact Card -->
              <div style="background:var(--color-bg-surface);padding:12px;border-radius:6px;border:1px solid var(--color-border);">
                <strong style="font-size:12px;display:block;margin-bottom:8px;">Help & Support</strong>
                <div style="display:flex;flex-direction:column;gap:6px;font-size:12px;">
                  <div><span style="color:var(--color-text-secondary);">Contact:</span> <strong id="prev-contact-name">${escapeHtml(branding.contactName || 'Contoso IT Helpdesk')}</strong></div>
                  <div><span style="color:var(--color-text-secondary);">Phone:</span> <span id="prev-contact-phone" style="font-family:monospace;">${escapeHtml(branding.contactPhone || '+1 (800) 555-0199')}</span></div>
                  <div><span style="color:var(--color-text-secondary);">Email:</span> <span id="prev-contact-email" style="color:var(--color-link);">${escapeHtml(branding.contactEmail || 'ithelpdesk@contoso.com')}</span></div>
                  <div><span style="color:var(--color-text-secondary);">Web:</span> <span id="prev-contact-web" style="color:var(--color-link);">${escapeHtml(branding.supportWebUrl || 'https://helpdesk.contoso.com')}</span></div>
                </div>
                <div id="prev-contact-notes" style="margin-top:8px;padding:8px;background:var(--color-bg-canvas);border-radius:4px;font-size:11px;color:var(--color-text-secondary);line-height:1.4;">
                  ${escapeHtml(branding.additionalInfo || '')}
                </div>
              </div>

              <!-- Footer Privacy Link -->
              <div style="text-align:center;margin-top:auto;padding-top:10px;">
                <span id="prev-privacy-link" style="font-size:11px;color:var(--color-link);text-decoration:underline;cursor:pointer;">Contoso Privacy Statement</span>
              </div>

            </div>
          </div>
        </div>
      </div>

    </div>
  `;

  // Live preview bindings
  const orgInput = document.getElementById('cust-org-name');
  const colorPicker = document.getElementById('cust-color-picker');
  const colorHex = document.getElementById('cust-color-hex');
  const logoToggle = document.getElementById('cust-logo-toggle');
  const contactNameInput = document.getElementById('cust-contact-name');
  const contactPhoneInput = document.getElementById('cust-contact-phone');
  const contactEmailInput = document.getElementById('cust-contact-email');
  const contactWebInput = document.getElementById('cust-contact-web');
  const contactNotesInput = document.getElementById('cust-contact-notes');
  const privacyUrlInput = document.getElementById('cust-privacy-url');

  const updatePreview = () => {
    const orgVal = orgInput?.value || 'Contoso Corporation';
    const colVal = colorHex?.value || '#0078D4';
    const nameVal = contactNameInput?.value || 'Contoso IT Helpdesk';
    const phoneVal = contactPhoneInput?.value || '—';
    const emailVal = contactEmailInput?.value || '—';
    const webVal = contactWebInput?.value || '—';
    const notesVal = contactNotesInput?.value || '';

    const banner = document.getElementById('prev-banner');
    if (banner) banner.style.background = colVal;

    const prevOrg = document.getElementById('prev-org-name');
    if (prevOrg) prevOrg.textContent = orgVal;

    const prevLogo = document.getElementById('prev-logo-icon');
    if (prevLogo) {
      prevLogo.textContent = (orgVal[0] || 'C').toUpperCase();
      prevLogo.style.display = logoToggle?.classList.contains('on') ? 'flex' : 'none';
    }

    const prevCName = document.getElementById('prev-contact-name');
    if (prevCName) prevCName.textContent = nameVal;

    const prevCPhone = document.getElementById('prev-contact-phone');
    if (prevCPhone) prevCPhone.textContent = phoneVal;

    const prevCEmail = document.getElementById('prev-contact-email');
    if (prevCEmail) prevCEmail.textContent = emailVal;

    const prevCWeb = document.getElementById('prev-contact-web');
    if (prevCWeb) prevCWeb.textContent = webVal;

    const prevNotes = document.getElementById('prev-contact-notes');
    if (prevNotes) {
      prevNotes.textContent = notesVal;
      prevNotes.style.display = notesVal ? 'block' : 'none';
    }
  };

  orgInput?.addEventListener('input', updatePreview);
  contactNameInput?.addEventListener('input', updatePreview);
  contactPhoneInput?.addEventListener('input', updatePreview);
  contactEmailInput?.addEventListener('input', updatePreview);
  contactWebInput?.addEventListener('input', updatePreview);
  contactNotesInput?.addEventListener('input', updatePreview);

  colorPicker?.addEventListener('input', (e) => {
    if (colorHex) colorHex.value = e.target.value;
    updatePreview();
  });

  colorHex?.addEventListener('input', (e) => {
    if (colorPicker && /^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
      colorPicker.value = e.target.value;
    }
    updatePreview();
  });

  document.querySelectorAll('.cust-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      const col = btn.dataset.color;
      if (colorHex) colorHex.value = col;
      if (colorPicker) colorPicker.value = col;
      updatePreview();
    });
  });

  logoToggle?.addEventListener('click', () => {
    logoToggle.classList.toggle('on');
    updatePreview();
  });

  const saveBranding = () => {
    const orgName = orgInput?.value.trim();
    if (!orgName) {
      toast()?.error('Validation', 'Organization name is required.');
      return;
    }

    const newBranding = {
      id: 'tenant_branding',
      orgName,
      accentColor: colorHex?.value || '#0078D4',
      showLogo: logoToggle?.classList.contains('on') ?? true,
      contactName: contactNameInput?.value || '',
      contactPhone: contactPhoneInput?.value || '',
      contactEmail: contactEmailInput?.value || '',
      supportWebUrl: contactWebInput?.value || '',
      additionalInfo: contactNotesInput?.value || '',
      privacyUrl: privacyUrlInput?.value || '',
      updatedAt: new Date().toISOString(),
    };

    Store.create(Collections.CUSTOMIZATION, newBranding);
    toast()?.success('Saved', 'Company Portal branding and support details updated.');
  };

  document.getElementById('cust-save-btn')?.addEventListener('click', saveBranding);
  document.getElementById('cust-discard-btn')?.addEventListener('click', renderCustomization);
}
