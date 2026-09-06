/* ============================================================
   Apps Page Module
   Overview, All Apps, App Protection (MAM), App Config
   ============================================================ */

import { Icons, createElement, clearElement, $, generateId, formatDate, escapeHtml, exportCsv } from '../utils.js';
import { Store, Collections } from '../store.js';
import { router } from '../router.js';
import { Wizard, renderScopeTagsStep, collectScopeTags, renderAssignmentsStep, collectAssignments } from '../components/wizard.js';
import { DonutChart, BarChart } from '../components/charts.js';

function getContentEl() { return $('#page-content'); }
function getCommandBar() { return window.IntuneApp?.commandBar; }
function toast() { return window.IntuneApp?.toastManager; }

/* ── App Details Slide-over Blade ── */
export function showAppDetailsBlade(app, onRefresh) {
  document.getElementById('app-blade')?.remove();
  const overlay = createElement('div', { id: 'app-blade', className: 'blade-overlay visible', style: 'z-index:1500;' });
  const blade = createElement('div', { className: 'blade-panel visible', style: 'width:700px;max-width:95vw;' });

  const devices = Store.getAll(Collections.DEVICES);
  const installedCount = app.installStatus?.installed ?? 18;
  const failedCount = app.installStatus?.failed ?? 0;
  const pendingCount = 2;

  blade.innerHTML = `
    <div class="blade-panel__header">
      <div class="blade-panel__breadcrumb">Apps &gt; All apps &gt; ${escapeHtml(app.name)}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:36px;height:36px;background:var(--color-primary-lighter);color:var(--color-primary);display:flex;align-items:center;justify-content:center;border-radius:6px;">
            ${app.platform === 'Windows' ? Icons.windows : app.platform === 'iOS' ? Icons.apple : app.platform === 'Android' ? Icons.android : Icons.link}
          </div>
          <div>
            <h2 class="blade-panel__title" style="margin:0;font-size:18px;">${escapeHtml(app.name)}</h2>
            <span style="font-size:12px;color:var(--color-text-secondary);">${escapeHtml(app.publisher || 'Microsoft')} • ${escapeHtml(app.type || 'App')}</span>
          </div>
        </div>
        <button class="blade-panel__close" id="blade-close">${Icons.close}</button>
      </div>
    </div>
    <div class="blade-panel__body">
      <!-- Action strip -->
      <div style="display:flex;gap:8px;padding:8px 0 16px;border-bottom:1px solid var(--color-border);margin-bottom:16px;">
        <button class="btn btn-sm btn-default" id="app-edit-assign-btn">${Icons.edit} Edit assignments</button>
        <button class="btn btn-sm btn-default" id="app-export-btn">${Icons.download} Export status</button>
        <button class="btn btn-sm btn-delete" id="app-delete-btn" style="color:var(--color-danger);">${Icons.delete} Delete app</button>
      </div>

      <!-- Tab nav inside blade -->
      <div class="tabs" id="app-blade-tabs" style="margin-bottom:16px;">
        <button class="tabs__btn tabs__btn--active" data-tab="tab-overview">Overview</button>
        <button class="tabs__btn" data-tab="tab-devices">Device install status</button>
        <button class="tabs__btn" data-tab="tab-users">User install status</button>
        <button class="tabs__btn" data-tab="tab-assignments">Assignments</button>
      </div>

      <!-- Tab 1: Overview -->
      <div id="tab-overview" class="tab-pane active">
        <!-- Status summary tile -->
        <div class="tile-grid" style="grid-template-columns:repeat(3, 1fr);margin-bottom:16px;">
          <div class="tile">
            <div class="tile__header"><span class="tile__title">Installed</span></div>
            <div class="tile__value" style="color:var(--color-success)">${installedCount}</div>
            <div class="tile__label">Devices successfully installed</div>
          </div>
          <div class="tile">
            <div class="tile__header"><span class="tile__title">Pending</span></div>
            <div class="tile__value" style="color:var(--color-warning)">${pendingCount}</div>
            <div class="tile__label">Waiting for check-in</div>
          </div>
          <div class="tile">
            <div class="tile__header"><span class="tile__title">Failed</span></div>
            <div class="tile__value" style="color:var(--color-danger)">${failedCount}</div>
            <div class="tile__label">Installation errors</div>
          </div>
        </div>

        <div class="content-card" style="margin-bottom:16px;">
          <h3 style="font-size:14px;font-weight:600;margin-bottom:12px;">App information</h3>
          <dl class="kv-grid">
            <dt>Name</dt><dd><strong>${escapeHtml(app.name)}</strong></dd>
            <dt>Description</dt><dd>${escapeHtml(app.description || 'Enterprise productivity application.')}</dd>
            <dt>Publisher</dt><dd>${escapeHtml(app.publisher || 'Microsoft Corporation')}</dd>
            <dt>App version</dt><dd>${escapeHtml(app.version || 'Latest cloud build')}</dd>
            <dt>Platform</dt><dd>${escapeHtml(app.platform || 'Cross-platform')}</dd>
            <dt>App type</dt><dd><span class="tag">${escapeHtml(app.type || 'Managed app')}</span></dd>
            <dt>Featured in Company Portal</dt><dd>${app.featured ? 'Yes' : 'No'}</dd>
            <dt>Assignments count</dt><dd>${(app.assignedGroups || []).length} groups</dd>
          </dl>
        </div>
      </div>

      <!-- Tab 2: Device install status -->
      <div id="tab-devices" class="tab-pane" style="display:none;">
        <div class="content-card" style="padding:0;">
          <div class="data-grid-wrapper">
            <table class="data-grid">
              <thead>
                <tr><th>Device name</th><th>User</th><th>OS version</th><th>Install state</th><th>Details</th></tr>
              </thead>
              <tbody>
                ${devices.slice(0, 6).map((d, i) => `
                  <tr>
                    <td><strong>${escapeHtml(d.name)}</strong></td>
                    <td>${escapeHtml(d.primaryUser || 'alexw@contoso.com')}</td>
                    <td>${escapeHtml(d.osVersion || d.os)}</td>
                    <td><span class="status-pill status-pill--${i === 5 ? 'warning' : 'compliant'}"><span class="status-pill__dot"></span>${i === 5 ? 'In progress' : 'Installed'}</span></td>
                    <td style="font-size:12px;color:var(--color-text-secondary);">${i === 5 ? 'Downloading bits' : 'Success (0x0)'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tab 3: User install status -->
      <div id="tab-users" class="tab-pane" style="display:none;">
        <div class="content-card" style="padding:0;">
          <div class="data-grid-wrapper">
            <table class="data-grid">
              <thead>
                <tr><th>User principal name</th><th>User name</th><th>Devices</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>alexw@contoso.com</td>
                  <td>Alex Wilber</td>
                  <td>2</td>
                  <td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Installed</span></td>
                </tr>
                <tr>
                  <td>meganb@contoso.com</td>
                  <td>Megan Bowen</td>
                  <td>1</td>
                  <td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Installed</span></td>
                </tr>
                <tr>
                  <td>jovian@contoso.com</td>
                  <td>Jovian Tan</td>
                  <td>1</td>
                  <td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Installed</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tab 4: Assignments -->
      <div id="tab-assignments" class="tab-pane" style="display:none;">
        <div class="content-card" style="margin-bottom:16px;">
          <h3 style="font-size:14px;font-weight:600;margin-bottom:8px;">Required</h3>
          <p style="font-size:12px;color:var(--color-text-secondary);margin-bottom:12px;">The app will be automatically installed on managed devices.</p>
          <ul style="list-style:disc;padding-left:20px;font-size:13px;">
            ${(app.assignedGroups && app.assignedGroups.length > 0) ? app.assignedGroups.map(g => `<li><strong>${escapeHtml(g)}</strong></li>`).join('') : '<li>All corporate Windows devices</li>'}
          </ul>
        </div>
        <div class="content-card" style="margin-bottom:16px;">
          <h3 style="font-size:14px;font-weight:600;margin-bottom:8px;">Available for enrolled devices</h3>
          <p style="font-size:12px;color:var(--color-text-secondary);margin-bottom:12px;">Users can find and install this app optionally from Company Portal.</p>
          <ul style="list-style:disc;padding-left:20px;font-size:13px;">
            <li>All Users</li>
          </ul>
        </div>
        <div class="content-card">
          <h3 style="font-size:14px;font-weight:600;margin-bottom:8px;">Uninstall</h3>
          <p style="font-size:12px;color:var(--color-text-secondary);margin-bottom:12px;">The app is uninstalled from devices in assigned groups.</p>
          <div style="font-size:13px;color:var(--color-text-secondary);">No groups assigned for uninstall.</div>
        </div>
      </div>
    </div>
  `;

  overlay.appendChild(blade);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  blade.querySelector('#blade-close')?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // Blade Tab Navigation
  const tabBtns = blade.querySelectorAll('#app-blade-tabs .tabs__btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('tabs__btn--active'));
      btn.classList.add('tabs__btn--active');
      blade.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
      const target = blade.querySelector(`#${btn.dataset.tab}`);
      if (target) target.style.display = 'block';
    });
  });

  // Action buttons
  blade.querySelector('#app-edit-assign-btn')?.addEventListener('click', () => {
    const newGroup = prompt('Add target group to this app (e.g. "Finance Team", "Executive Staff"):');
    if (newGroup && newGroup.trim()) {
      const groups = app.assignedGroups || [];
      if (!groups.includes(newGroup.trim())) groups.push(newGroup.trim());
      Store.update(Collections.APPS, app.id, { assignedGroups: groups });
      toast()?.success('Assigned', `Added group "${newGroup.trim()}" to ${app.name}.`);
      close();
      if (onRefresh) onRefresh();
    }
  });

  blade.querySelector('#app-export-btn')?.addEventListener('click', () => {
    exportCsv(`${app.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_install_status.csv`, ['Device Name', 'User', 'OS Version', 'Install State'], devices.map(d => [d.name, d.primaryUser || 'user@contoso.com', d.osVersion || d.os, 'Installed']));
    toast()?.success('Export', 'App install status exported to CSV.');
  });

  blade.querySelector('#app-delete-btn')?.addEventListener('click', () => {
    if (confirm(`Delete app "${app.name}"?`)) {
      Store.delete(Collections.APPS, app.id);
      toast()?.success('Deleted', `App "${app.name}" removed.`);
      close();
      if (onRefresh) onRefresh();
    }
  });
}

/* ══════════════════════════════════════════════════
   APPS OVERVIEW
   ══════════════════════════════════════════════════ */
export function renderAppsOverview() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([{ label: 'Refresh', icon: Icons.refresh, onClick: renderAppsOverview, type: 'default' }]);

  const apps = Store.getAll(Collections.APPS);
  const protectionPolicies = Store.getAll(Collections.APP_PROTECTION_POLICIES);
  const configPolicies = Store.getAll(Collections.APP_CONFIG_POLICIES);
  const stats = Store.getStats(Collections.APPS, 'platform');

  el.innerHTML = `
    <h1 class="page-title">Apps</h1>
    <div class="tile-grid">
      <div class="tile" id="a-total"><div class="tile__header"><span class="tile__title">Total apps</span></div><div class="tile__value" style="color:var(--color-primary)">${apps.length}</div><div class="tile__label">Managed applications</div></div>
      <div class="tile" id="a-mam"><div class="tile__header"><span class="tile__title">App protection</span></div><div class="tile__value" style="color:var(--color-primary)">${protectionPolicies.length}</div><div class="tile__label">MAM policies</div></div>
      <div class="tile" id="a-config"><div class="tile__header"><span class="tile__title">App configuration</span></div><div class="tile__value" style="color:var(--color-primary)">${configPolicies.length}</div><div class="tile__label">Config policies</div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
      <div class="content-card">
        <div class="content-card__header"><h2 class="content-card__title">Apps by platform</h2></div>
        <div style="display:flex;gap:24px;align-items:flex-start;">
          <canvas id="apps-donut" style="max-width:180px;"></canvas>
          <div id="apps-donut-legend" class="chart-legend" style="min-width:160px;"></div>
        </div>
      </div>
      <div class="content-card">
        <div class="content-card__header"><h2 class="content-card__title">Installation status (7 days)</h2></div>
        <canvas id="apps-install-bar"></canvas>
      </div>
    </div>
  `;

  document.getElementById('a-total')?.addEventListener('click', () => router.navigate('/apps/all'));
  document.getElementById('a-mam')?.addEventListener('click', () => router.navigate('/apps/protection-policies'));
  document.getElementById('a-config')?.addEventListener('click', () => router.navigate('/apps/configuration-policies'));

  // Platform donut
  const segments = [
    { label: 'Windows', value: stats['Windows']||0, color: '#0078D4' },
    { label: 'iOS/iPadOS', value: stats['iOS']||0, color: '#A4262C' },
    { label: 'Android', value: stats['Android']||0, color: '#107C10' },
    { label: 'Web link', value: stats['Web link']||0, color: '#8A8886' },
  ];
  new DonutChart($('#apps-donut'), { width: 180, height: 180, outerRadius: 80, innerRadius: 50, segments, centerText: String(apps.length) }).draw();
  DonutChart.renderLegend($('#apps-donut-legend'), segments);

  // Mock installation bar chart
  const installData = [
    { label: 'Installed', value: apps.reduce((sum, a) => sum + (a.installStatus?.installed||0), 0), color: '#107C10' },
    { label: 'Failed', value: apps.reduce((sum, a) => sum + (a.installStatus?.failed||0), 0), color: '#D13438' },
    { label: 'Pending', value: Math.floor(Math.random()*5), color: '#FFB900' }
  ];
  new BarChart($('#apps-install-bar'), { width: 400, height: 180, data: installData, title: '' }).draw();
}

/* ══════════════════════════════════════════════════
   ALL APPS
   ══════════════════════════════════════════════════ */
export function renderAllApps() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Add app', icon: Icons.add, onClick: addApp, type: 'primary' },
    { label: 'Export', icon: Icons.download, onClick: () => {
        const apps = Store.getAll(Collections.APPS);
        exportCsv('all_apps.csv', ['Name', 'Platform', 'Type', 'Version', 'Assigned'], apps.map(a => [a.name, a.platform, a.type, a.version || '—', a.assignedGroups?.length > 0 ? 'Yes' : 'No']));
        toast()?.success('Export', 'Apps inventory exported to CSV.');
      }, type: 'default' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderAllApps, type: 'default' },
  ]);

  const apps = Store.getAll(Collections.APPS);
  el.innerHTML = `
    <h1 class="page-title">All apps</h1>
    <p class="page-subtitle">Manage, distribute, and monitor mobile, desktop, and web applications across devices.</p>
    <div class="content-card" style="padding:0;">
      <div class="grid-toolbar" style="padding:12px 16px;gap:12px;display:flex;align-items:center;">
        <div class="grid-toolbar__search" style="flex:1;max-width:320px;">
          <span style="display:flex">${Icons.search}</span>
          <input type="text" placeholder="Search apps by name..." id="apps-search">
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:12px;color:var(--color-text-secondary);">${Icons.filter} Platform:</span>
          <select class="form-input form-select" id="apps-plat-filter" style="width:160px;height:32px;padding:2px 8px;font-size:12px;">
            <option value="All">All platforms</option>
            <option value="Windows">Windows</option>
            <option value="iOS">iOS/iPadOS</option>
            <option value="Android">Android</option>
            <option value="Web link">Web link</option>
          </select>
        </div>
        <span style="font-size:12px;color:var(--color-text-secondary);margin-left:auto;" id="apps-count">${apps.length} apps</span>
      </div>
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Name</th><th>Platform</th><th>Type</th><th>Version</th><th>Assigned</th><th>Actions</th></tr>
          </thead>
          <tbody id="apps-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  const renderRows = (list) => {
    const tbody = document.getElementById('apps-tbody');
    const countEl = document.getElementById('apps-count');
    if (countEl) countEl.textContent = `${list.length} apps`;
    if (!tbody) return;
    if (list.length === 0) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--color-text-secondary);">No apps match filter</td></tr>'; return; }
    tbody.innerHTML = '';
    for (const a of list) {
      const tr = createElement('tr');
      tr.innerHTML = `
        <td><div style="display:flex;align-items:center;gap:8px;"><div style="width:24px;height:24px;background:var(--color-primary-lighter);color:var(--color-primary);display:flex;align-items:center;justify-content:center;border-radius:4px;font-size:12px;">${a.platform==='Windows'?Icons.windows:a.platform==='iOS'?Icons.apple:a.platform==='Android'?Icons.android:Icons.link}</div><span class="cell-link" style="font-weight:600;">${escapeHtml(a.name)}</span></div></td>
        <td>${escapeHtml(a.platform)}</td><td>${escapeHtml(a.type)}</td><td>${escapeHtml(a.version||'—')}</td><td>${a.assignedGroups?.length>0?'<span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Yes</span>':'<span style="color:var(--color-text-secondary)">No</span>'}</td>
        <td><button class="btn-icon btn-delete" data-id="${a.id}" title="Delete app">${Icons.delete}</button></td>
      `;
      tr.querySelector('.cell-link').addEventListener('click', () => showAppDetailsBlade(a, renderAllApps));
      tr.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete app "${a.name}"?`)) { Store.delete(Collections.APPS, a.id); toast()?.success('Deleted', `App deleted.`); renderAllApps(); }
      });
      tbody.appendChild(tr);
    }
  };

  const applyFilters = () => {
    const q = (document.getElementById('apps-search')?.value || '').toLowerCase();
    const plat = document.getElementById('apps-plat-filter')?.value || 'All';
    renderRows(apps.filter(a => {
      const matchQ = a.name.toLowerCase().includes(q) || (a.publisher || '').toLowerCase().includes(q);
      const matchPlat = plat === 'All' || a.platform === plat;
      return matchQ && matchPlat;
    }));
  };

  renderRows(apps);
  document.getElementById('apps-search')?.addEventListener('input', applyFilters);
  document.getElementById('apps-plat-filter')?.addEventListener('change', applyFilters);
}

function addApp() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.clearActions();
  const wizard = new Wizard(el, {
    steps: [
      { name: 'App type', render: (data, body) => {
        body.innerHTML = `
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Select app type</h3>
          <div class="form-group"><label class="form-label required">App type</label>
            <select class="form-input form-select" id="add-app-type" style="max-width:400px;">
              <optgroup label="Store app"><option>iOS store app</option><option>Android store app</option><option>Windows app (Win32)</option><option>Microsoft Store app (new)</option></optgroup>
              <optgroup label="Microsoft 365 Apps"><option>Windows 10 and later</option><option>macOS</option></optgroup>
              <optgroup label="Other"><option>Web link</option><option>Line-of-business app</option></optgroup>
            </select>
          </div>
        `;
      }, collect: (data) => data.type = document.getElementById('add-app-type')?.value },
      { name: 'App information', render: (data, body) => {
        body.innerHTML = `
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">App information</h3>
          <div class="form-group"><label class="form-label required">Name</label><input class="form-input" id="add-app-name" value="${data.name||''}"></div>
          <div class="form-group"><label class="form-label required">Description</label><textarea class="form-input form-textarea" id="add-app-desc">${data.description||''}</textarea></div>
          <div class="form-group"><label class="form-label required">Publisher</label><input class="form-input" id="add-app-pub" value="${data.publisher||''}"></div>
          ${data.type.includes('store')||data.type.includes('Web') ? `<div class="form-group"><label class="form-label required">Appstore URL / Link</label><input class="form-input" id="add-app-url" value="${data.url||''}"></div>` : ''}
          <div class="form-group"><div class="toggle" id="add-app-feat"><div class="toggle__track"><div class="toggle__thumb"></div></div><span class="toggle__label">Show this as a featured app in the Company Portal</span></div></div>
        `;
        document.getElementById('add-app-feat')?.addEventListener('click', function() { this.classList.toggle('on'); });
      }, collect: (data) => {
        data.name = document.getElementById('add-app-name')?.value||'';
        data.description = document.getElementById('add-app-desc')?.value||'';
        data.publisher = document.getElementById('add-app-pub')?.value||'';
        data.url = document.getElementById('add-app-url')?.value||'';
        data.featured = document.getElementById('add-app-feat')?.classList.contains('on');
        data.platform = data.type.includes('iOS') ? 'iOS' : data.type.includes('Android') ? 'Android' : data.type.includes('Web') ? 'Web link' : 'Windows';
      }},
      { name: 'Scope tags', render: renderScopeTagsStep, collect: collectScopeTags },
      { name: 'Assignments', render: renderAssignmentsStep, collect: collectAssignments },
      { name: 'Review + create', render: (data) => Wizard.renderReview(data, { name: 'Name', type: 'App type', publisher: 'Publisher', platform: 'Platform', assignedGroups: 'Assigned groups' }) }
    ],
    onComplete: (data) => {
      Store.create(Collections.APPS, { id: generateId(), installStatus: { installed: 0, failed: 0 }, ...data });
      toast()?.success('App added', `"${data.name}" added to Intune.`);
      router.navigate('/apps/all');
    },
    onCancel: () => router.navigate('/apps/all')
  });
  wizard.render();
}

/* ══════════════════════════════════════════════════
   APP PROTECTION POLICIES (MAM)
   ══════════════════════════════════════════════════ */
export function renderAppProtection() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Create policy', icon: Icons.add, onClick: createAppProtectionPolicy, type: 'primary' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderAppProtection, type: 'default' },
  ]);

  const policies = Store.getAll(Collections.APP_PROTECTION_POLICIES);
  el.innerHTML = `
    <h1 class="page-title">App protection policies</h1>
    <p class="page-subtitle">Protect corporate data within apps (Mobile Application Management) without requiring MDM enrollment.</p>
    <div class="data-grid-wrapper"><table class="data-grid"><thead><tr><th>Name</th><th>Platform</th><th>Targeted</th><th>Deployed</th><th></th></tr></thead><tbody id="mam-tbody"></tbody></table></div>
  `;

  const tbody = document.getElementById('mam-tbody');
  if (policies.length === 0 && tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;">No app protection policies</td></tr>';
  for (const p of policies) {
    const tr = createElement('tr');
    tr.innerHTML = `<td><span class="cell-link">${p.name}</span></td><td>${p.platform}</td><td>${(p.assignedGroups||[]).join(', ')}</td><td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Yes</span></td><td><button class="btn-icon btn-delete" data-id="${p.id}">${Icons.delete}</button></td>`;
    tr.querySelector('.btn-delete')?.addEventListener('click', (e) => { e.stopPropagation(); if (confirm('Delete policy?')) { Store.delete(Collections.APP_PROTECTION_POLICIES, p.id); renderAppProtection(); } });
    tbody?.appendChild(tr);
  }
}

function createAppProtectionPolicy() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.clearActions();
  const wizard = new Wizard(el, {
    steps: [
      { name: 'Basics', render: (data, body) => {
        body.innerHTML = `
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Basics</h3>
          <div class="form-group"><label class="form-label required">Name</label><input class="form-input" id="mam-name" value="${data.name||''}"></div>
          <div class="form-group"><label class="form-label required">Platform</label><select class="form-input form-select" id="mam-plat" style="max-width:300px;"><option>iOS/iPadOS</option><option>Android</option><option>Windows Information Protection (WIP)</option></select></div>
        `;
      }, collect: (data) => { data.name = document.getElementById('mam-name')?.value||''; data.platform = document.getElementById('mam-plat')?.value; }},
      { name: 'Apps', render: (data, body) => {
        body.innerHTML = `
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Target apps</h3>
          <p style="color:var(--color-text-secondary);margin-bottom:16px;">Select the apps that will be protected by this policy.</p>
          <div class="form-group"><label class="form-label">Target to all apps</label><select class="form-input form-select" style="max-width:200px;"><option>No</option><option>Yes</option></select></div>
          <div class="content-card"><h4 style="font-weight:600;margin-bottom:12px;">Selected core apps</h4>
            <ul style="list-style:disc;padding-left:20px;font-size:14px;"><li>Microsoft Outlook</li><li>Microsoft Teams</li><li>Microsoft Edge</li><li>Microsoft OneDrive</li></ul>
          </div>
        `;
      }, collect: () => {} },
      { name: 'Data protection', render: (data, body) => {
        body.innerHTML = `
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Data protection settings</h3>
          <div class="form-group"><label class="form-label">Send org data to other apps</label><select class="form-input form-select" id="mam-send" style="max-width:300px;"><option>All apps</option><option>Policy managed apps</option><option selected>Policy managed apps with OS sharing</option><option>None</option></select></div>
          <div class="form-group"><label class="form-label">Save copies of org data</label><select class="form-input form-select" id="mam-save" style="max-width:300px;"><option selected>Block</option><option>Allow</option></select></div>
          <div class="form-group"><label class="form-label">Restrict cut, copy and paste</label><select class="form-input form-select" id="mam-ccp" style="max-width:300px;"><option>Blocked</option><option selected>Policy managed apps</option><option>Policy managed apps with paste in</option><option>Any app</option></select></div>
          <div class="form-group"><label class="form-label">Screen capture and Google Assistant</label><select class="form-input form-select" id="mam-screen" style="max-width:300px;"><option selected>Block</option><option>Allow</option></select></div>
        `;
      }, collect: (data) => {
        data.settings = {
          sendOrgData: document.getElementById('mam-send')?.value,
          saveCopies: document.getElementById('mam-save')?.value,
          cutCopyPaste: document.getElementById('mam-ccp')?.value,
          screenCapture: document.getElementById('mam-screen')?.value,
        };
      }},
      { name: 'Access requirements', render: (data, body) => {
        body.innerHTML = `
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Access requirements</h3>
          <div class="form-group"><label class="form-label">PIN for access</label><select class="form-input form-select" id="mam-pin" style="max-width:200px;"><option selected>Require</option><option>Not required</option></select></div>
          <div class="form-group"><label class="form-label">Work or school account credentials</label><select class="form-input form-select" style="max-width:200px;"><option selected>Require</option><option>Not required</option></select></div>
          <div class="form-group"><label class="form-label">Recheck access requirements after (minutes)</label><input type="number" class="form-input" value="30" style="max-width:100px;"></div>
        `;
      }, collect: () => {} },
      { name: 'Assignments', render: renderAssignmentsStep, collect: collectAssignments },
      { name: 'Review + create', render: (data) => Wizard.renderReview(data, { name: 'Name', platform: 'Platform', assignedGroups: 'Assigned groups' }) }
    ],
    onComplete: (data) => { Store.create(Collections.APP_PROTECTION_POLICIES, { id: generateId(), ...data }); router.navigate('/apps/protection-policies'); },
    onCancel: () => router.navigate('/apps/protection-policies')
  });
  wizard.render();
}

/* ══════════════════════════════════════════════════
   APP CONFIGURATION POLICIES
   ══════════════════════════════════════════════════ */
export function renderAppConfiguration() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Create policy', icon: Icons.add, onClick: createAppConfigurationPolicy, type: 'primary' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderAppConfiguration, type: 'default' },
  ]);

  const policies = Store.getAll(Collections.APP_CONFIG_POLICIES);
  el.innerHTML = `
    <h1 class="page-title">App configuration policies</h1>
    <p class="page-subtitle">Supply settings to apps before they are run.</p>
    <div class="data-grid-wrapper"><table class="data-grid"><thead><tr><th>Name</th><th>Platform</th><th>Targeted</th><th></th></tr></thead><tbody id="appcfg-tbody"></tbody></table></div>
  `;

  const tbody = document.getElementById('appcfg-tbody');
  if (policies.length === 0 && tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:32px;">No app configuration policies</td></tr>';
  for (const p of policies) {
    const tr = createElement('tr');
    tr.innerHTML = `<td><span class="cell-link">${p.name}</span></td><td>${p.platform}</td><td>${(p.assignedGroups||[]).join(', ')}</td><td><button class="btn-icon btn-delete" data-id="${p.id}">${Icons.delete}</button></td>`;
    tr.querySelector('.btn-delete')?.addEventListener('click', (e) => { e.stopPropagation(); if (confirm('Delete policy?')) { Store.delete(Collections.APP_CONFIG_POLICIES, p.id); renderAppConfiguration(); } });
    tbody?.appendChild(tr);
  }
}

function createAppConfigurationPolicy() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.clearActions();
  const wizard = new Wizard(el, {
    steps: [
      { name: 'Basics', render: (data, body) => {
        body.innerHTML = `
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Basics</h3>
          <div class="form-group"><label class="form-label required">Name</label><input class="form-input" id="cfg-name" value="${data.name||''}"></div>
          <div class="form-group"><label class="form-label required">Device enrollment type</label><select class="form-input form-select" id="cfg-enr" style="max-width:300px;"><option>Managed devices</option><option>Managed apps</option></select></div>
          <div class="form-group"><label class="form-label required">Platform</label><select class="form-input form-select" id="cfg-plat" style="max-width:300px;"><option>iOS/iPadOS</option><option>Android Enterprise</option></select></div>
        `;
      }, collect: (data) => { data.name = document.getElementById('cfg-name')?.value||''; data.platform = document.getElementById('cfg-plat')?.value; }},
      { name: 'Settings', render: (data, body) => {
        body.innerHTML = `
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Configuration settings</h3>
          <div class="form-group"><label class="form-label">Configuration settings format</label><select class="form-input form-select" style="max-width:300px;"><option>Use configuration designer</option><option>Enter XML data</option></select></div>
          <div class="content-card"><p style="font-size:14px;color:var(--color-text-secondary);">This mock interface assumes basic key/value pairs.</p>
            <div style="display:flex;gap:8px;margin-top:12px;"><input class="form-input" placeholder="Configuration key" style="flex:1;"><select class="form-input form-select" style="width:120px;"><option>String</option><option>Integer</option><option>Boolean</option></select><input class="form-input" placeholder="Value" style="flex:1;"></div>
          </div>
        `;
      }, collect: () => {} },
      { name: 'Assignments', render: renderAssignmentsStep, collect: collectAssignments },
      { name: 'Review + create', render: (data) => Wizard.renderReview(data, { name: 'Name', platform: 'Platform', assignedGroups: 'Assigned groups' }) }
    ],
    onComplete: (data) => { Store.create(Collections.APP_CONFIG_POLICIES, { id: generateId(), ...data }); router.navigate('/apps/configuration-policies'); },
    onCancel: () => router.navigate('/apps/configuration-policies')
  });
  wizard.render();
}

/* ══════════════════════════════════════════════════
   QUIET TIME POLICIES
   ══════════════════════════════════════════════════ */
export function renderQuietTimePolicies() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Create policy', icon: Icons.add, onClick: createQuietTimePolicy, type: 'primary' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderQuietTimePolicies, type: 'default' },
  ]);

  let policies = Store.getAll(Collections.QUIET_TIME_POLICIES);
  if (policies.length === 0) {
    policies = [
      { id: 'qt-1', name: 'Standard Corporate Work-Life Balance', apps: 'Microsoft Teams, Microsoft Outlook', schedule: 'After 7:00 PM & Weekends', assigned: 'All Company Staff', status: 'Active' },
      { id: 'qt-2', name: 'Shift Workers Notification Window', apps: 'Microsoft Teams', schedule: 'Custom schedule by time-zone', assigned: 'Field Operations', status: 'Active' },
    ];
    policies.forEach(p => Store.create(Collections.QUIET_TIME_POLICIES, p));
  }

  el.innerHTML = `
    <h1 class="page-title">Quiet Time policies</h1>
    <p class="page-subtitle">Prevent worker burnout by muting work notifications from Microsoft Teams and Outlook outside of working hours.</p>

    <div class="content-card" style="padding:0;">
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Policy name</th><th>Target applications</th><th>Quiet time schedule</th><th>Assigned group</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            ${policies.map(p => `
              <tr>
                <td><strong>${escapeHtml(p.name)}</strong></td>
                <td>${escapeHtml(p.apps)}</td>
                <td><span class="tag">${escapeHtml(p.schedule)}</span></td>
                <td>${escapeHtml(p.assigned)}</td>
                <td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>${escapeHtml(p.status)}</span></td>
                <td><button class="btn-icon btn-delete" data-id="${p.id}">${Icons.delete}</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  el.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Delete Quiet Time policy?')) {
        Store.delete(Collections.QUIET_TIME_POLICIES, btn.dataset.id);
        toast()?.success('Deleted', 'Quiet Time policy removed.');
        renderQuietTimePolicies();
      }
    });
  });
}

function createQuietTimePolicy() {
  document.getElementById('app-modal')?.remove();
  const overlay = createElement('div', { id: 'app-modal', className: 'blade-overlay visible', style: 'z-index:1500;display:flex;align-items:center;justify-content:center;' });
  const modal = createElement('div', { className: 'content-card', style: 'width:480px;max-width:90vw;background:var(--color-bg-surface);box-shadow:var(--shadow-64);border-radius:8px;padding:20px;' });

  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:1px solid var(--color-border);padding-bottom:10px;">
      <h3 style="font-size:16px;font-weight:600;margin:0;">Create Quiet Time Policy</h3>
      <button class="blade-panel__close" id="app-modal-close" style="width:28px;height:28px;">${Icons.close}</button>
    </div>
    <div class="form-group"><label class="form-label required">Policy Name</label><input class="form-input" id="qt-name" placeholder="e.g. Executive Weekend Quiet Time"></div>
    <div class="form-group"><label class="form-label">Target Applications</label><select class="form-input form-select" id="qt-apps"><option selected>Microsoft Teams & Outlook</option><option>Microsoft Teams only</option><option>Microsoft Outlook only</option></select></div>
    <div class="form-group"><label class="form-label">Quiet Hours Schedule</label><select class="form-input form-select" id="qt-sched"><option selected>After 6:00 PM to 8:00 AM & All Weekend</option><option>Weekends only (Saturday & Sunday)</option><option>After 8:00 PM on weekdays</option></select></div>
    <div class="form-group"><label class="form-label">Target Group</label><select class="form-input form-select" id="qt-assign"><option>All Company Staff</option><option>Finance Team</option><option>Engineering Department</option></select></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
      <button class="btn btn-default" id="app-cancel">Cancel</button>
      <button class="btn btn-primary" id="app-submit">Create policy</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  modal.querySelector('#app-modal-close')?.addEventListener('click', close);
  modal.querySelector('#app-cancel')?.addEventListener('click', close);

  modal.querySelector('#app-submit')?.addEventListener('click', () => {
    const name = modal.querySelector('#qt-name')?.value?.trim();
    if (!name) { toast()?.error('Validation', 'Policy name is required.'); return; }
    Store.create(Collections.QUIET_TIME_POLICIES, {
      id: generateId(),
      name,
      apps: modal.querySelector('#qt-apps')?.value,
      schedule: modal.querySelector('#qt-sched')?.value,
      assigned: modal.querySelector('#qt-assign')?.value,
      status: 'Active',
    });
    toast()?.success('Created', `Quiet Time policy "${name}" created.`);
    close();
    renderQuietTimePolicies();
  });
}

/* ══════════════════════════════════════════════════
   MICROSOFT 365 APPS
   ══════════════════════════════════════════════════ */
export function renderM365Apps() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Add Microsoft 365 Apps', icon: Icons.add, onClick: createM365AppsPolicy, type: 'primary' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderM365Apps, type: 'default' },
  ]);

  let configs = Store.getAll('m365AppsConfigs');
  if (configs.length === 0) {
    configs = [
      { id: 'm365-1', name: 'Microsoft 365 Apps for Windows 10 and later', suite: 'Word, Excel, PowerPoint, Outlook, OneNote, Teams', arch: '64-bit', channel: 'Current Channel', sharedActivation: 'No', assigned: 'All Windows Devices', status: 'Active' },
      { id: 'm365-2', name: 'Microsoft 365 Apps for Shared Kiosks', suite: 'Word, Excel, PowerPoint', arch: '64-bit', channel: 'Monthly Enterprise Channel', sharedActivation: 'Yes (Shared computer licensing)', assigned: 'Shared Devices', status: 'Active' },
    ];
    configs.forEach(c => Store.create('m365AppsConfigs', c));
  }

  el.innerHTML = `
    <h1 class="page-title">Microsoft 365 Apps</h1>
    <p class="page-subtitle">Deploy and manage Microsoft 365 Apps (Word, Excel, PowerPoint, Teams, Outlook) across corporate devices.</p>

    <div class="content-card" style="padding:0;">
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Deployment name</th><th>Apps included</th><th>Architecture</th><th>Update channel</th><th>Shared computer</th><th>Assigned</th><th></th></tr>
          </thead>
          <tbody>
            ${configs.map(c => `
              <tr>
                <td><strong>${escapeHtml(c.name)}</strong></td>
                <td style="font-size:12px;color:var(--color-text-secondary);max-width:260px;">${escapeHtml(c.suite)}</td>
                <td><span class="tag">${escapeHtml(c.arch)}</span></td>
                <td><span class="tag" style="background:var(--color-primary-lighter);color:var(--color-primary);">${escapeHtml(c.channel)}</span></td>
                <td>${escapeHtml(c.sharedActivation)}</td>
                <td>${escapeHtml(c.assigned)}</td>
                <td><button class="btn-icon btn-delete" data-id="${c.id}">${Icons.delete}</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  el.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Delete deployment?')) {
        Store.delete('m365AppsConfigs', btn.dataset.id);
        toast()?.success('Deleted', 'Microsoft 365 Apps deployment removed.');
        renderM365Apps();
      }
    });
  });
}

function createM365AppsPolicy() {
  document.getElementById('app-modal')?.remove();
  const overlay = createElement('div', { id: 'app-modal', className: 'blade-overlay visible', style: 'z-index:1500;display:flex;align-items:center;justify-content:center;' });
  const modal = createElement('div', { className: 'content-card', style: 'width:480px;max-width:90vw;background:var(--color-bg-surface);box-shadow:var(--shadow-64);border-radius:8px;padding:20px;' });

  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:1px solid var(--color-border);padding-bottom:10px;">
      <h3 style="font-size:16px;font-weight:600;margin:0;">Configure Microsoft 365 Apps</h3>
      <button class="blade-panel__close" id="app-modal-close" style="width:28px;height:28px;">${Icons.close}</button>
    </div>
    <div class="form-group"><label class="form-label required">Suite Name</label><input class="form-input" id="m365-name" value="Microsoft 365 Apps for Enterprise"></div>
    <div class="form-group"><label class="form-label">Architecture</label><select class="form-input form-select" id="m365-arch"><option selected>64-bit</option><option>32-bit</option></select></div>
    <div class="form-group"><label class="form-label">Update Channel</label><select class="form-input form-select" id="m365-chan"><option selected>Current Channel</option><option>Monthly Enterprise Channel</option><option>Semi-Annual Enterprise Channel</option></select></div>
    <div class="form-group"><label class="form-label">Shared Computer Activation</label><select class="form-input form-select" id="m365-shared"><option selected>No</option><option>Yes (VDI / Shared Kiosks)</option></select></div>
    <div class="form-group"><label class="form-label">Target Group</label><select class="form-input form-select" id="m365-assign"><option>All Windows Devices</option><option>Corporate Staff</option><option>Shared Devices</option></select></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
      <button class="btn btn-default" id="app-cancel">Cancel</button>
      <button class="btn btn-primary" id="app-submit">Add deployment</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  modal.querySelector('#app-modal-close')?.addEventListener('click', close);
  modal.querySelector('#app-cancel')?.addEventListener('click', close);

  modal.querySelector('#app-submit')?.addEventListener('click', () => {
    const name = modal.querySelector('#m365-name')?.value?.trim();
    if (!name) { toast()?.error('Validation', 'Suite name is required.'); return; }
    Store.create('m365AppsConfigs', {
      id: generateId(),
      name,
      suite: 'Word, Excel, PowerPoint, Outlook, Teams, OneDrive',
      arch: modal.querySelector('#m365-arch')?.value,
      channel: modal.querySelector('#m365-chan')?.value,
      sharedActivation: modal.querySelector('#m365-shared')?.value,
      assigned: modal.querySelector('#m365-assign')?.value,
      status: 'Active',
    });
    toast()?.success('Added', `Microsoft 365 Apps deployment "${name}" added.`);
    close();
    renderM365Apps();
  });
}

/* ══════════════════════════════════════════════════
   PLATFORM STORES
   ══════════════════════════════════════════════════ */
export function renderPlatformStores() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Sync tokens', icon: Icons.refresh, onClick: () => toast()?.success('Sync', 'Public app store tokens refreshed.'), type: 'default' },
  ]);

  el.innerHTML = `
    <h1 class="page-title">Platform stores and tokens</h1>
    <p class="page-subtitle">Configure connections to Apple Volume Purchase Program, Managed Google Play, and Microsoft Store app repositories.</p>

    <div class="content-card" style="padding:0;">
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Platform store / Token</th><th>Account / Identifier</th><th>Status</th><th>Licenses managed</th><th>Token expiration</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Apple Business Manager (VPP Token)</strong></td>
              <td>apple-admin@contoso.com</td>
              <td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Active</span></td>
              <td>42 volume licenses</td>
              <td>Expires in 312 days</td>
            </tr>
            <tr>
              <td><strong>Managed Google Play</strong></td>
              <td>enterprise-admin@contoso.com</td>
              <td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Bound</span></td>
              <td>Public & private APKs</td>
              <td>Permanent Enterprise Bind</td>
            </tr>
            <tr>
              <td><strong>Microsoft Store App Repository</strong></td>
              <td>Contoso Microsoft Entra ID</td>
              <td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Connected</span></td>
              <td>WinGet Store integration</td>
              <td>Active token</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

