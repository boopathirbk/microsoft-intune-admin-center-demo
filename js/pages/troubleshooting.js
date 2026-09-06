/* ============================================================
   Troubleshooting & Support Page Module
   Search for a user, view their assigned devices, apps, policies
   ============================================================ */

import { Icons, createElement, clearElement, $, generateId, escapeHtml } from '../utils.js';
import { Store, Collections } from '../store.js';
import { router } from '../router.js';

function getContentEl() { return $('#page-content'); }
function getCommandBar() { return window.IntuneApp?.commandBar; }
function toast() { return window.IntuneApp?.toastManager; }

export function renderTroubleshooting() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([{ label: 'Refresh', icon: Icons.refresh, onClick: renderTroubleshooting, type: 'default' }]);

  el.innerHTML = `
    <h1 class="page-title">Troubleshooting + support</h1>
    <p class="page-subtitle">Help users resolve issues by viewing their assigned devices, policies, and applications.</p>
    
    <div class="content-card" style="max-width:600px;margin-bottom:24px;">
      <h3 style="font-size:16px;font-weight:600;margin-bottom:12px;">Select user</h3>
      <div style="display:flex;gap:8px;">
        <input type="text" id="ts-search-input" class="form-input" placeholder="Search for a user (e.g., Alex, Megan)..." style="flex:1;">
        <button class="btn btn-primary" id="ts-search-btn">Select</button>
      </div>
      <p style="font-size:13px;color:var(--color-text-secondary);margin-top:8px;">Tip: Try searching for "Alex Wilber" or "Megan Bowen".</p>
    </div>

    <div id="ts-results" style="display:none;flex-direction:column;gap:24px;"></div>
  `;

  document.getElementById('ts-search-btn')?.addEventListener('click', () => {
    const q = document.getElementById('ts-search-input')?.value.trim();
    if (!q) return;
    performSearch(q);
  });
  
  document.getElementById('ts-search-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = e.target.value.trim();
      if (q) performSearch(q);
    }
  });
}

function performSearch(query) {
  const resEl = document.getElementById('ts-results');
  if (!resEl) return;
  
  // Find devices belonging to this mock user
  const devices = Store.getAll(Collections.DEVICES);
  const userDevices = devices.filter(d => d.primaryUser && d.primaryUser.toLowerCase().includes(query.toLowerCase()));
  
  // Apps and policies mock assigned to all users
  const apps = Store.getAll(Collections.APPS);
  const cp = Store.getAll(Collections.COMPLIANCE_POLICIES);
  
  resEl.style.display = 'flex';
  resEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;padding:16px;background:var(--color-bg-surface);border:1px solid var(--color-border);border-radius:8px;">
      <div style="width:56px;height:56px;border-radius:50%;background:var(--color-primary-lighter);color:var(--color-primary);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:600;">
        ${escapeHtml(query.substring(0,2).toUpperCase())}
      </div>
      <div style="flex:1;">
        <h2 style="font-size:20px;font-weight:600;margin:0;">${escapeHtml(query)}</h2>
        <div style="font-size:13px;color:var(--color-text-secondary);margin-top:4px;">
          ${escapeHtml(query.toLowerCase().replace(/\s+/g, ''))}@contoso.onmicrosoft.com • Entra ID Object ID: <strong>9e8a7b6c-1234-5678-abcd-ef0123456789</strong>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
        <span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Account active</span>
        <span class="tag" style="font-size:11px;">Intune Plan 1 + Suite</span>
      </div>
    </div>

    <!-- User Summary Status Cards -->
    <div class="tile-grid" style="grid-template-columns:repeat(4, 1fr);margin:0;">
      <div class="tile"><div class="tile__header"><span class="tile__title">Managed devices</span></div><div class="tile__value" style="color:var(--color-primary)">${userDevices.length}</div><div class="tile__label">Enrolled in MDM</div></div>
      <div class="tile"><div class="tile__header"><span class="tile__title">Assigned apps</span></div><div class="tile__value" style="color:var(--color-primary)">${apps.length}</div><div class="tile__label">Required / Available</div></div>
      <div class="tile"><div class="tile__header"><span class="tile__title">Compliance</span></div><div class="tile__value" style="color:var(--color-success)">Compliant</div><div class="tile__label">Zero active violations</div></div>
      <div class="tile"><div class="tile__header"><span class="tile__title">Enrollment failures</span></div><div class="tile__value" style="color:var(--color-warning)">1</div><div class="tile__label">In past 30 days</div></div>
    </div>

    <div class="tabs" style="border-bottom:1px solid var(--color-border);margin-top:8px;">
      <button class="tabs__btn tabs__btn--active" data-target="ts-devices">Devices (${userDevices.length})</button>
      <button class="tabs__btn" data-target="ts-apps">App deployments (${apps.length})</button>
      <button class="tabs__btn" data-target="ts-policies">Policies (${cp.length})</button>
      <button class="tabs__btn" data-target="ts-groups">Group memberships (4)</button>
      <button class="tabs__btn" data-target="ts-failures">Enrollment failures (1)</button>
      <button class="tabs__btn" data-target="ts-diag">Diagnostics logs</button>
    </div>

    <div class="tab-content active" id="ts-devices">
      ${userDevices.length > 0 ? `
        <div class="content-card" style="padding:0;">
          <table class="data-grid"><thead><tr><th>Device name</th><th>OS</th><th>Compliance</th><th>Last check-in</th><th>Actions</th></tr></thead><tbody>
            ${userDevices.map(d => `
              <tr>
                <td><a href="#/devices/all/${d.id}" class="cell-link" style="font-weight:600;">${escapeHtml(d.name)}</a></td>
                <td>${escapeHtml(d.osVersion || d.os)}</td>
                <td><span class="status-pill status-pill--${d.complianceState==='Compliant'?'compliant':'noncompliant'}"><span class="status-pill__dot"></span>${escapeHtml(d.complianceState)}</span></td>
                <td>${new Date(d.lastCheckIn).toLocaleDateString()}</td>
                <td><a href="#/devices/all/${d.id}" class="btn btn-sm btn-default">Open device</a></td>
              </tr>
            `).join('')}
          </tbody></table>
        </div>
      ` : `<div style="padding:32px;text-align:center;color:var(--color-text-secondary);background:var(--color-bg-surface);border:1px solid var(--color-border);border-radius:8px;">No devices found for this user.</div>`}
    </div>

    <div class="tab-content" id="ts-apps" style="display:none;">
      <div class="content-card" style="padding:0;">
        <table class="data-grid"><thead><tr><th>App name</th><th>Platform</th><th>Intent</th><th>Install state</th></tr></thead><tbody>
          ${apps.map(a => `<tr><td><strong>${escapeHtml(a.name)}</strong></td><td>${escapeHtml(a.platform)}</td><td>Required</td><td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Installed</span></td></tr>`).join('')}
          ${apps.length === 0 ? '<tr><td colspan="4" style="text-align:center;padding:24px;">No apps assigned.</td></tr>' : ''}
        </tbody></table>
      </div>
    </div>

    <div class="tab-content" id="ts-policies" style="display:none;">
      <div class="content-card" style="padding:0;">
        <table class="data-grid"><thead><tr><th>Policy name</th><th>Policy category</th><th>Setting status</th></tr></thead><tbody>
          ${cp.map(p => `<tr><td><strong>${escapeHtml(p.name)}</strong></td><td>Compliance baseline</td><td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Succeeded</span></td></tr>`).join('')}
          ${cp.length === 0 ? '<tr><td colspan="3" style="text-align:center;padding:24px;">No policies applied.</td></tr>' : ''}
        </tbody></table>
      </div>
    </div>

    <div class="tab-content" id="ts-groups" style="display:none;">
      <div class="content-card" style="padding:0;">
        <table class="data-grid"><thead><tr><th>Group name</th><th>Type</th><th>Membership type</th><th>Object ID</th></tr></thead><tbody>
          <tr><td><strong>All Corporate Staff</strong></td><td>Security group</td><td>Assigned</td><td style="font-family:monospace;font-size:12px;">c7b2e1a4-9999-4d2a-8ef0-a1b2c3d4e5f6</td></tr>
          <tr><td><strong>Engineering Pilot Users</strong></td><td>Security group</td><td>Assigned</td><td style="font-family:monospace;font-size:12px;">18a4d9f2-8888-4e1b-90a1-b2c3d4e5f6a7</td></tr>
          <tr><td><strong>Remote Workers Global</strong></td><td>Microsoft 365 group</td><td>Dynamic user</td><td style="font-family:monospace;font-size:12px;">55c2f0a1-7777-4c3a-81b2-c3d4e5f6a7b8</td></tr>
          <tr><td><strong>Intune Licensed Staff</strong></td><td>Security group</td><td>Assigned</td><td style="font-family:monospace;font-size:12px;">88d3e2b5-6666-4b2c-92c3-d4e5f6a7b8c9</td></tr>
        </tbody></table>
      </div>
    </div>

    <div class="tab-content" id="ts-failures" style="display:none;">
      <div class="content-card" style="padding:0;">
        <table class="data-grid"><thead><tr><th>Failure date/time</th><th>Device model</th><th>OS</th><th>Failure reason</th><th>Recommended action</th></tr></thead><tbody>
          <tr>
            <td>3 days ago</td>
            <td>Google Pixel 8 Pro</td>
            <td>Android 14.0</td>
            <td><span class="status-pill status-pill--noncompliant"><span class="status-pill__dot"></span>Personal device blocked</span></td>
            <td>Device enrollment restriction blocks personal Android BYOD. Advise user to use corporate-issued device or Work Profile.</td>
          </tr>
        </tbody></table>
      </div>
    </div>

    <div class="tab-content" id="ts-diag" style="display:none;">
      <div class="content-card" style="margin-bottom:16px;">
        <h3 style="font-size:15px;font-weight:600;margin-bottom:12px;">Device diagnostic logs</h3>
        <p style="font-size:13px;color:var(--color-text-secondary);margin-bottom:14px;">Collect and download comprehensive Windows MDM, IME, and BitLocker event trace logs for offline analysis.</p>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary" id="ts-collect-diag-btn">${Icons.download} Collect live diagnostics</button>
        </div>
      </div>
      <div class="content-card" style="padding:0;">
        <table class="data-grid"><thead><tr><th>Archive name</th><th>Device</th><th>Timestamp</th><th>Size</th><th>Action</th></tr></thead><tbody>
          <tr>
            <td><strong>MDMDiagnosticsTool_Report_20240902.zip</strong></td>
            <td>AlexW-Laptop01</td>
            <td>Sep 02, 2024 10:14 AM</td>
            <td>4.8 MB</td>
            <td><button class="btn btn-sm btn-default ts-dl-log-btn">${Icons.download} Download</button></td>
          </tr>
        </tbody></table>
      </div>
    </div>
  `;

  // Wire tabs
  const tabBtns = resEl.querySelectorAll('.tabs__btn');
  const tabContents = resEl.querySelectorAll('.tab-content');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('tabs__btn--active'));
      tabContents.forEach(c => c.style.display = 'none');
      btn.classList.add('tabs__btn--active');
      const target = document.getElementById(btn.getAttribute('data-target'));
      if (target) target.style.display = 'block';
    });
  });

  resEl.querySelector('#ts-collect-diag-btn')?.addEventListener('click', () => {
    toast()?.info('Collecting diagnostics', 'Diagnostic log collection request dispatched to user devices.');
  });
  resEl.querySelector('.ts-dl-log-btn')?.addEventListener('click', () => {
    toast()?.success('Downloaded', 'Diagnostic log archive download completed.');
  });
}
