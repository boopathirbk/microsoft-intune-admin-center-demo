/* ============================================================
   Devices Page Module — All device sub-pages
   Overview, All devices, Monitor, Compliance policies,
   Configuration profiles, Scripts & remediations
   ============================================================ */

import { Icons, createElement, clearElement, $, generateId, formatDate, relativeTime, escapeHtml } from '../utils.js';
import { Store, Collections } from '../store.js';
import { router } from '../router.js';
import { Wizard, renderScopeTagsStep, collectScopeTags, renderAssignmentsStep, collectAssignments } from '../components/wizard.js';
import { DonutChart, BarChart, LineChart } from '../components/charts.js';

/* ── Shared helpers ── */
function getContentEl() { return $('#page-content'); }
function getCommandBar() { return window.IntuneApp?.commandBar; }
function toast() { return window.IntuneApp?.toastManager; }

function compliancePill(state) {
  const map = { 'Compliant': 'compliant', 'Noncompliant': 'noncompliant', 'Not evaluated': 'not-evaluated', 'In grace period': 'grace-period' };
  const cls = map[state] || 'not-evaluated';
  return `<span class="status-pill status-pill--${cls}"><span class="status-pill__dot"></span>${state}</span>`;
}

/* ══════════════════════════════════════════════════
   DEVICES OVERVIEW
   ══════════════════════════════════════════════════ */
export function renderDevicesOverview() {
  const el = getContentEl(); clearElement(el);
  const cb = getCommandBar();
  cb?.setActions([{ label: 'Refresh', icon: Icons.refresh, onClick: () => renderDevicesOverview(), type: 'default' }]);

  const devices = Store.getAll(Collections.DEVICES);
  const stats = Store.getStats(Collections.DEVICES, 'complianceState');
  const osStats = Store.getStats(Collections.DEVICES, 'os');
  const ownerStats = Store.getStats(Collections.DEVICES, 'ownership');

  el.innerHTML = `
    <h1 class="page-title">Devices overview</h1>
    <div class="tile-grid">
      <div class="tile" id="t-total"><div class="tile__header"><span class="tile__title">Total enrolled</span></div><div class="tile__value" style="color:var(--color-primary)">${devices.length}</div><div class="tile__label">Managed devices</div></div>
      <div class="tile" id="t-compliant"><div class="tile__header"><span class="tile__title">Compliant</span></div><div class="tile__value" style="color:var(--color-success)">${stats['Compliant']||0}</div><div class="tile__label">Meeting policy requirements</div></div>
      <div class="tile" id="t-noncomp"><div class="tile__header"><span class="tile__title">Noncompliant</span></div><div class="tile__value" style="color:var(--color-error)">${stats['Noncompliant']||0}</div><div class="tile__label">Action required</div></div>
      <div class="tile" id="t-grace"><div class="tile__header"><span class="tile__title">In grace period</span></div><div class="tile__value" style="color:var(--color-warning)">${stats['In grace period']||0}</div><div class="tile__label">Pending compliance</div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
      <div class="content-card">
        <div class="content-card__header"><h2 class="content-card__title">Compliance status</h2></div>
        <div style="display:flex;gap:24px;align-items:flex-start;">
          <canvas id="overview-donut" style="max-width:180px;"></canvas>
          <div id="overview-donut-legend" class="chart-legend" style="min-width:160px;"></div>
        </div>
      </div>
      <div class="content-card">
        <div class="content-card__header"><h2 class="content-card__title">Devices by OS</h2></div>
        <canvas id="overview-os-chart"></canvas>
      </div>
    </div>

    <div class="content-card">
      <div class="content-card__header">
        <h2 class="content-card__title">Devices by ownership</h2>
      </div>
      <canvas id="overview-owner-chart"></canvas>
    </div>
  `;

  // Tile click routing
  ['t-total','t-compliant','t-noncomp','t-grace'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => router.navigate('/devices/all'));
  });

  // Compliance donut
  const segments = [
    { label: 'Compliant', value: stats['Compliant']||0, color: '#107C10' },
    { label: 'Noncompliant', value: stats['Noncompliant']||0, color: '#D13438' },
    { label: 'In grace period', value: stats['In grace period']||0, color: '#FFB900' },
    { label: 'Not evaluated', value: stats['Not evaluated']||0, color: '#8A8886' },
  ];
  const donut = new DonutChart(document.getElementById('overview-donut'), { width: 180, height: 180, outerRadius: 80, innerRadius: 50, segments, centerText: String(devices.length), centerSubtext: 'devices' });
  donut.draw();
  DonutChart.renderLegend(document.getElementById('overview-donut-legend'), segments);

  // OS bar chart
  const osData = Object.entries(osStats).map(([label, value]) => ({ label, value, color: {'Windows':'#0078D4','iOS':'#A4262C','iPadOS':'#CA5010','Android':'#107C10','macOS':'#5C2D91'}[label] || '#0078D4' }));
  new BarChart(document.getElementById('overview-os-chart'), { width: 400, height: 200, data: osData, title: '' }).draw();

  // Ownership bar chart
  const ownerData = Object.entries(ownerStats).map(([label, value]) => ({ label, value, color: label === 'Corporate' ? '#0078D4' : '#8764B8' }));
  new BarChart(document.getElementById('overview-owner-chart'), { width: 500, height: 180, data: ownerData, title: '' }).draw();
}

export function openEnrollDeviceModal() {
  document.getElementById('enroll-device-modal')?.remove();

  const overlay = createElement('div', { id: 'enroll-device-modal', className: 'blade-overlay visible', style: 'z-index:1500;display:flex;align-items:center;justify-content:center;' });
  const modal = createElement('div', { className: 'content-card', style: 'width:520px;max-width:92vw;background:var(--color-bg-surface);box-shadow:var(--shadow-64);border-radius:8px;padding:24px;max-height:90vh;overflow-y:auto;' });

  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;border-bottom:1px solid var(--color-border);padding-bottom:12px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="color:var(--color-primary);display:flex;">${Icons.enrollment}</span>
        <h3 style="font-size:16px;font-weight:600;margin:0;">Enroll new device</h3>
      </div>
      <button class="blade-panel__close" id="enroll-modal-close" style="width:28px;height:28px;">${Icons.close}</button>
    </div>

    <div class="blade-panel__tabs" style="margin-bottom:16px;">
      <button class="blade-tab active" id="tab-btn-quick">Quick Lab Device</button>
      <button class="blade-tab" id="tab-btn-autopilot">Autopilot</button>
      <button class="blade-tab" id="tab-btn-byod">BYOD / Company Portal</button>
    </div>

    <div id="enroll-tab-content">
      <div class="form-group">
        <label class="form-label required">Device Name</label>
        <input class="form-input" id="new-dev-name" value="DESKTOP-WIN11-0${Store.count(Collections.DEVICES) + 1}" placeholder="e.g. DESKTOP-LAB-01">
      </div>
      <div class="form-group">
        <label class="form-label">Operating System</label>
        <select class="form-input form-select" id="new-dev-os">
          <option value="Windows|Windows 11 Enterprise 24H2">Windows 11 Enterprise (24H2)</option>
          <option value="Windows|Windows 10 Pro 22H2">Windows 10 Pro (22H2)</option>
          <option value="macOS|macOS Sequoia 15.1">macOS Sequoia (15.1)</option>
          <option value="iOS|iOS 18.1">iOS 18.1 (Corporate iPhone)</option>
          <option value="Android|Android 14 (OneUI 6.1)">Android 14 (Corporate Fully Managed)</option>
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group">
          <label class="form-label">Join Type</label>
          <select class="form-input form-select" id="new-dev-join">
            <option>Microsoft Entra joined</option>
            <option>Microsoft Entra hybrid joined</option>
            <option>Microsoft Entra registered</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Ownership</label>
          <select class="form-input form-select" id="new-dev-ownership">
            <option>Corporate</option>
            <option>Personal</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Primary User</label>
        <input class="form-input" id="new-dev-user" value="adele.vance@contoso.com" placeholder="user@domain.com">
      </div>
      <div class="form-group">
        <label class="form-label">Initial Compliance Status</label>
        <select class="form-input form-select" id="new-dev-compliance">
          <option value="Compliant">Compliant</option>
          <option value="Noncompliant">Noncompliant</option>
          <option value="In grace period">In grace period</option>
        </select>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px;border-top:1px solid var(--color-border);padding-top:14px;">
        <button class="btn btn-default" id="enroll-cancel-btn">Cancel</button>
        <button class="btn btn-primary" id="enroll-submit-btn">Enroll device</button>
      </div>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const closeModal = () => overlay.remove();
  modal.querySelector('#enroll-modal-close')?.addEventListener('click', closeModal);
  modal.querySelector('#enroll-cancel-btn')?.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

  modal.querySelector('#tab-btn-quick')?.addEventListener('click', () => {
    openEnrollDeviceModal();
  });
  modal.querySelector('#tab-btn-autopilot')?.addEventListener('click', () => {
    closeModal();
    router.navigate('/devices/enrollment/autopilot');
  });
  modal.querySelector('#tab-btn-byod')?.addEventListener('click', () => {
    const body = modal.querySelector('#enroll-tab-content');
    modal.querySelectorAll('.blade-tab').forEach(t => t.classList.remove('active'));
    modal.querySelector('#tab-btn-byod').classList.add('active');
    body.innerHTML = `
      <div class="info-banner info-banner--info" style="margin-bottom:14px;">
        <span class="info-banner__icon" style="color:var(--color-primary)">${Icons.info}</span>
        <span>Users can enroll personal devices (BYOD) via the <strong>Intune Company Portal</strong>.</span>
      </div>
      <div style="background:var(--color-bg-canvas);padding:14px;border-radius:6px;border:1px solid var(--color-border);margin-bottom:16px;">
        <div style="font-weight:600;font-size:13px;margin-bottom:4px;">Direct Enrollment Protocol URI:</div>
        <code style="display:block;padding:6px 10px;background:var(--color-bg-surface);border:1px solid var(--color-border);border-radius:4px;font-size:12px;">ms-device-enrollment:?mode=mdm</code>
      </div>
      <div style="display:flex;justify-content:flex-end;">
        <button class="btn btn-default" id="byod-close-btn">Close</button>
      </div>
    `;
    body.querySelector('#byod-close-btn')?.addEventListener('click', closeModal);
  });

  modal.querySelector('#enroll-submit-btn')?.addEventListener('click', () => {
    const name = modal.querySelector('#new-dev-name')?.value?.trim();
    if (!name) { toast()?.error('Required', 'Device name is required.'); return; }
    const osRaw = modal.querySelector('#new-dev-os')?.value?.split('|') || ['Windows', 'Windows 11 Enterprise'];
    const join = modal.querySelector('#new-dev-join')?.value;
    const ownership = modal.querySelector('#new-dev-ownership')?.value;
    const user = modal.querySelector('#new-dev-user')?.value?.trim();
    const compliance = modal.querySelector('#new-dev-compliance')?.value;

    const newDev = {
      id: generateId(),
      name,
      os: osRaw[0],
      osVersion: osRaw[1],
      complianceState: compliance,
      lastCheckIn: new Date().toISOString(),
      enrolledDate: new Date().toISOString(),
      ownership,
      primaryUser: user,
      joinType: join,
      managementState: 'MDM',
      serialNumber: 'SN-' + Math.floor(100000 + Math.random() * 900000),
      manufacturer: osRaw[0] === 'Windows' ? 'Microsoft Corporation' : osRaw[0] === 'macOS' || osRaw[0] === 'iOS' ? 'Apple Inc.' : 'Samsung',
      model: osRaw[0] === 'Windows' ? 'Surface Pro 10' : osRaw[0] === 'macOS' ? 'MacBook Pro M3' : osRaw[0] === 'iOS' ? 'iPhone 16 Pro' : 'Galaxy S24 Enterprise',
      storageTotal: '512 GB',
      storageFree: '380 GB',
      isEncrypted: true,
      antivirusStatus: 'Active',
      defenderStatus: 'Onboarded',
      enrolledBy: user,
    };

    Store.create(Collections.DEVICES, newDev);
    toast()?.success('Device enrolled', `${name} successfully enrolled.`);
    Store.addNotification({ type: 'success', title: 'Device enrolled', message: `Device ${name} enrolled via Intune MDM.` });
    closeModal();
    renderAllDevices();
  });
}

/* ══════════════════════════════════════════════════
   ALL DEVICES LIST
   ══════════════════════════════════════════════════ */
let activeFilters = { os: 'All', compliance: 'All', ownership: 'All' };
let visibleColumns = {
  name: true,
  complianceState: true,
  os: true,
  osVersion: true,
  lastCheckIn: true,
  ownership: true,
  primaryUser: true,
  joinType: true,
  serialNumber: false,
  model: false,
  manufacturer: false,
};

export function renderAllDevices() {
  const el = getContentEl(); clearElement(el);
  const cb = getCommandBar();
  cb?.setActions([
    { label: 'Enroll device', icon: Icons.add, onClick: () => openEnrollDeviceModal(), type: 'primary' },
    { label: 'Bulk actions', icon: null, onClick: handleBulkActions, type: 'default' },
    { label: 'Filter', icon: Icons.filter, onClick: toggleFilterBar, type: 'default' },
    { label: 'Columns', icon: null, onClick: openColumnsModal, type: 'default' },
    { label: 'Export', icon: Icons.download, onClick: exportDevices, type: 'default' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderAllDevices, type: 'default' },
  ]);

  const devices = Store.getAll(Collections.DEVICES);
  el.innerHTML = `
    <h1 class="page-title">All devices</h1>

    <!-- Filter Bar (Collapsible) -->
    <div id="filter-bar" style="display:none;background:var(--color-bg-surface);border:1px solid var(--color-border);border-radius:6px;padding:12px 16px;margin-bottom:14px;gap:16px;flex-wrap:wrap;align-items:center;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:12px;font-weight:600;color:var(--color-text-secondary);">OS:</span>
        <select id="filter-os" class="form-input form-select" style="height:28px;padding:2px 24px 2px 8px;font-size:12px;width:auto;">
          <option value="All">All platforms</option>
          <option value="Windows">Windows</option>
          <option value="iOS">iOS</option>
          <option value="Android">Android</option>
          <option value="macOS">macOS</option>
        </select>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:12px;font-weight:600;color:var(--color-text-secondary);">Compliance:</span>
        <select id="filter-compliance" class="form-input form-select" style="height:28px;padding:2px 24px 2px 8px;font-size:12px;width:auto;">
          <option value="All">All states</option>
          <option value="Compliant">Compliant</option>
          <option value="Noncompliant">Noncompliant</option>
          <option value="In grace period">In grace period</option>
          <option value="Not evaluated">Not evaluated</option>
        </select>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:12px;font-weight:600;color:var(--color-text-secondary);">Ownership:</span>
        <select id="filter-ownership" class="form-input form-select" style="height:28px;padding:2px 24px 2px 8px;font-size:12px;width:auto;">
          <option value="All">All types</option>
          <option value="Corporate">Corporate</option>
          <option value="Personal">Personal</option>
        </select>
      </div>
      <button class="btn btn-subtle btn-sm" id="clear-filters-btn" style="margin-left:auto;font-size:12px;">Reset filters</button>
    </div>

    <div class="grid-toolbar">
      <div class="grid-toolbar__search">
        <span style="display:flex">${Icons.search}</span>
        <input type="text" placeholder="Search by device name, user, OS, or join type..." id="device-search" aria-label="Search devices">
      </div>
      <span id="device-count-badge" style="font-size:12px;color:var(--color-text-secondary);margin-left:auto;">${devices.length} device${devices.length!==1?'s':''}</span>
    </div>
    <div id="bulk-bar-container"></div>
    <div class="data-grid-wrapper">
      <table class="data-grid" id="devices-grid" role="grid" aria-label="All devices">
        <thead><tr id="devices-thead-tr"></tr></thead>
        <tbody id="devices-tbody"></tbody>
      </table>
    </div>
  `;

  let sortCol = null, sortDir = 'asc';
  const selectedIds = new Set();

  function renderTableHeaders() {
    const tr = document.getElementById('devices-thead-tr');
    if (!tr) return;
    tr.innerHTML = `
      <th class="col-checkbox"><div class="checkbox" id="select-all-cb" role="checkbox" aria-checked="false" tabindex="0"><div class="checkbox__box"><svg viewBox="0 0 12 12"><path d="M9.78 3.22a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0L2.22 6.28a.75.75 0 011.06-1.06L5 6.94l3.72-3.72a.75.75 0 011.06 0z"/></svg></div></div></th>
      <th data-sort="name">Device name <span class="sort-icon">↕</span></th>
      <th data-sort="complianceState">Compliance <span class="sort-icon">↕</span></th>
      <th data-sort="os">OS <span class="sort-icon">↕</span></th>
      <th data-sort="osVersion">OS version <span class="sort-icon">↕</span></th>
      <th data-sort="lastCheckIn">Last check-in <span class="sort-icon">↕</span></th>
      <th data-sort="ownership">Ownership <span class="sort-icon">↕</span></th>
      <th data-sort="primaryUser">Primary user <span class="sort-icon">↕</span></th>
      <th data-sort="joinType">Join type <span class="sort-icon">↕</span></th>
      ${visibleColumns.serialNumber ? '<th data-sort="serialNumber">Serial number <span class="sort-icon">↕</span></th>' : ''}
      ${visibleColumns.model ? '<th data-sort="model">Model <span class="sort-icon">↕</span></th>' : ''}
      ${visibleColumns.manufacturer ? '<th data-sort="manufacturer">Manufacturer <span class="sort-icon">↕</span></th>' : ''}
    `;

    tr.querySelectorAll('[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.sort;
        if (sortCol === col) sortDir = sortDir === 'asc' ? 'desc' : 'asc'; else { sortCol = col; sortDir = 'asc'; }
        tr.querySelectorAll('.sort-icon').forEach(s => { s.classList.remove('active'); s.textContent = '↕'; });
        th.querySelector('.sort-icon').classList.add('active');
        th.querySelector('.sort-icon').textContent = sortDir === 'asc' ? '↑' : '↓';
        renderRows();
      });
    });

    tr.querySelector('#select-all-cb')?.addEventListener('click', () => {
      const all = getFiltered();
      if (selectedIds.size === all.length) { selectedIds.clear(); } else { all.forEach(d => selectedIds.add(d.id)); }
      renderRows(); updateBulkBar();
    });
  }

  function getFiltered() {
    const q = (document.getElementById('device-search')?.value || '').toLowerCase();
    let list = Store.getAll(Collections.DEVICES);

    if (activeFilters.os !== 'All') list = list.filter(d => d.os === activeFilters.os);
    if (activeFilters.compliance !== 'All') list = list.filter(d => d.complianceState === activeFilters.compliance);
    if (activeFilters.ownership !== 'All') list = list.filter(d => d.ownership === activeFilters.ownership);

    if (q) list = list.filter(d => d.name.toLowerCase().includes(q) || (d.primaryUser||'').toLowerCase().includes(q) || d.os.toLowerCase().includes(q) || d.joinType.toLowerCase().includes(q) || (d.serialNumber||'').toLowerCase().includes(q));
    if (sortCol) {
      list = [...list].sort((a,b) => {
        const va = (a[sortCol]||'').toString().toLowerCase();
        const vb = (b[sortCol]||'').toString().toLowerCase();
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    return list;
  }

  function renderRows() {
    const tbody = document.getElementById('devices-tbody');
    if (!tbody) return;
    const list = getFiltered();
    const countBadge = document.getElementById('device-count-badge');
    if (countBadge) countBadge.textContent = `${list.length} device${list.length!==1?'s':''}`;

    if (list.length === 0) {
      const totalCols = 9 + (visibleColumns.serialNumber?1:0) + (visibleColumns.model?1:0) + (visibleColumns.manufacturer?1:0);
      tbody.innerHTML = `<tr><td colspan="${totalCols}" style="text-align:center;padding:32px;color:var(--color-text-secondary);">No devices match current search or filters.</td></tr>`;
      return;
    }
    tbody.innerHTML = '';
    for (const d of list) {
      const sel = selectedIds.has(d.id);
      const tr = createElement('tr', { className: sel ? 'selected' : '', dataset: { id: d.id } });
      tr.innerHTML = `
        <td class="col-checkbox"><div class="checkbox ${sel?'checked':''}" data-id="${d.id}" role="checkbox" aria-checked="${sel}" tabindex="0"><div class="checkbox__box"><svg viewBox="0 0 12 12"><path d="M9.78 3.22a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0L2.22 6.28a.75.75 0 011.06-1.06L5 6.94l3.72-3.72a.75.75 0 011.06 0z"/></svg></div></div></td>
        <td><span class="cell-link" data-id="${d.id}">${escapeHtml(d.name)}</span></td>
        <td>${compliancePill(d.complianceState)}</td>
        <td>${d.os}</td><td>${d.osVersion}</td>
        <td>${formatDate(d.lastCheckIn)}</td><td>${d.ownership}</td>
        <td>${d.primaryUser||'—'}</td><td><span class="tag">${d.joinType}</span></td>
        ${visibleColumns.serialNumber ? `<td>${d.serialNumber||'—'}</td>` : ''}
        ${visibleColumns.model ? `<td>${d.model||'—'}</td>` : ''}
        ${visibleColumns.manufacturer ? `<td>${d.manufacturer||'—'}</td>` : ''}
      `;
      tr.querySelector('.cell-link').addEventListener('click', (e) => { e.stopPropagation(); openDeviceBlade(d.id); });
      tr.querySelector('.checkbox').addEventListener('click', (e) => { e.stopPropagation(); toggleSelect(d.id); });
      tbody.appendChild(tr);
    }
  }

  function toggleSelect(id) {
    if (selectedIds.has(id)) selectedIds.delete(id); else selectedIds.add(id);
    renderRows(); updateBulkBar();
  }

  function updateBulkBar() {
    const container = document.getElementById('bulk-bar-container');
    if (!container) return;
    if (selectedIds.size === 0) { container.innerHTML = ''; return; }
    container.innerHTML = `
      <div class="bulk-action-bar" style="flex-wrap:wrap;gap:8px;">
        <span class="bulk-action-bar__count">${selectedIds.size} selected</span>
        <button class="btn btn-sm btn-default" id="bulk-sync">${Icons.sync} Sync</button>
        <button class="btn btn-sm btn-default" id="bulk-restart">${Icons.restart} Restart</button>
        <button class="btn btn-sm btn-default" id="bulk-lock">${Icons.lock} Remote lock</button>
        <button class="btn btn-sm btn-default" id="bulk-scan">${Icons.security} Quick scan</button>
        <button class="btn btn-sm btn-default" id="bulk-diag">${Icons.refresh} Collect diagnostics</button>
        <button class="btn btn-sm btn-danger" id="bulk-retire">Retire</button>
        <button class="btn btn-sm btn-default" id="bulk-clear" style="margin-left:auto;">Clear selection</button>
      </div>
    `;
    document.getElementById('bulk-sync')?.addEventListener('click', () => {
      const now = new Date().toISOString();
      for (const id of selectedIds) Store.update(Collections.DEVICES, id, { lastCheckIn: now });
      toast()?.success('Bulk sync', `Sync dispatched to ${selectedIds.size} devices.`);
      renderRows();
    });
    document.getElementById('bulk-restart')?.addEventListener('click', () => {
      if (confirm(`Restart ${selectedIds.size} selected device(s)?`)) {
        toast()?.info('Bulk restart', `Restart command sent to ${selectedIds.size} devices.`);
      }
    });
    document.getElementById('bulk-lock')?.addEventListener('click', () => {
      if (confirm(`Remotely lock ${selectedIds.size} selected device(s)?`)) {
        toast()?.success('Bulk lock', `Remote lock dispatched to ${selectedIds.size} devices.`);
      }
    });
    document.getElementById('bulk-scan')?.addEventListener('click', () => {
      toast()?.info('Bulk scan', `Windows Defender scan scheduled on ${selectedIds.size} devices.`);
    });
    document.getElementById('bulk-diag')?.addEventListener('click', () => {
      toast()?.info('Bulk diagnostics', `Diagnostic bundle collection started on ${selectedIds.size} devices.`);
    });
    document.getElementById('bulk-retire')?.addEventListener('click', () => {
      if (confirm(`Retire ${selectedIds.size} device(s)? This removes corporate data and unenrolls them.`)) {
        for (const id of selectedIds) {
          Store.update(Collections.DEVICES, id, { managementState: 'Retired', complianceState: 'Not evaluated' });
        }
        selectedIds.clear();
        toast()?.success('Devices retired', 'Selected devices have been retired.');
        renderAllDevices();
      }
    });
    document.getElementById('bulk-clear')?.addEventListener('click', () => { selectedIds.clear(); renderRows(); updateBulkBar(); });
  }

  // Filter bar controls
  const filterBar = document.getElementById('filter-bar');
  const osSelect = document.getElementById('filter-os');
  const compSelect = document.getElementById('filter-compliance');
  const ownerSelect = document.getElementById('filter-ownership');

  if (osSelect) { osSelect.value = activeFilters.os; osSelect.addEventListener('change', (e) => { activeFilters.os = e.target.value; renderRows(); }); }
  if (compSelect) { compSelect.value = activeFilters.compliance; compSelect.addEventListener('change', (e) => { activeFilters.compliance = e.target.value; renderRows(); }); }
  if (ownerSelect) { ownerSelect.value = activeFilters.ownership; ownerSelect.addEventListener('change', (e) => { activeFilters.ownership = e.target.value; renderRows(); }); }
  document.getElementById('clear-filters-btn')?.addEventListener('click', () => {
    activeFilters = { os: 'All', compliance: 'All', ownership: 'All' };
    if (osSelect) osSelect.value = 'All';
    if (compSelect) compSelect.value = 'All';
    if (ownerSelect) ownerSelect.value = 'All';
    renderRows();
  });

  // Search
  document.getElementById('device-search')?.addEventListener('input', () => renderRows());

  renderTableHeaders();
  renderRows();
}

function toggleFilterBar() {
  const fb = document.getElementById('filter-bar');
  if (fb) {
    fb.style.display = fb.style.display === 'none' ? 'flex' : 'none';
  }
}

function openColumnsModal() {
  showKeyModal('Customize columns', `
    <div style="font-size:13px;line-height:1.6;">
      <p style="margin-bottom:12px;">Select which columns are visible in the All Devices grid:</p>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" id="col-sn" ${visibleColumns.serialNumber?'checked':''}> Serial number</label>
        <label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" id="col-mod" ${visibleColumns.model?'checked':''}> Hardware model</label>
        <label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" id="col-mfg" ${visibleColumns.manufacturer?'checked':''}> Manufacturer</label>
      </div>
      <button class="btn btn-primary btn-sm" id="save-cols-btn" style="width:100%;margin-top:14px;">Apply columns</button>
    </div>
  `, () => {});

  document.getElementById('save-cols-btn')?.addEventListener('click', () => {
    visibleColumns.serialNumber = !!document.getElementById('col-sn')?.checked;
    visibleColumns.model = !!document.getElementById('col-mod')?.checked;
    visibleColumns.manufacturer = !!document.getElementById('col-mfg')?.checked;
    document.getElementById('key-modal-overlay')?.remove();
    renderAllDevices();
  });
}

function handleBulkActions() {
  const el = document.getElementById('select-all-cb');
  if (el) el.click();
}

function exportDevices() {
  const devices = Store.getAll(Collections.DEVICES);
  const blob = new Blob([JSON.stringify(devices, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'intune-devices-export.json'; a.click();
  toast()?.success('Export complete', `${devices.length} devices exported to JSON.`);
}

/* ══════════════════════════════════════════════════
   DEVICE DETAIL BLADE
   ══════════════════════════════════════════════════ */
export function openDeviceBlade(deviceId) {
  const device = Store.getById(Collections.DEVICES, deviceId);
  if (!device) return;

  // Remove existing blade
  document.querySelectorAll('.blade-overlay.device-blade, .blade-panel.device-blade').forEach(e => e.remove());

  const overlay = createElement('div', { className: 'blade-overlay device-blade visible' });
  document.body.appendChild(overlay);

  const panel = createElement('div', { className: 'blade-panel device-blade' });
  panel.innerHTML = `
    <div class="blade-panel__header">
      <h2 class="blade-panel__title" style="display:flex;align-items:center;gap:10px;">
        <span style="color:var(--color-primary);display:flex;">${device.os === 'Windows' ? Icons.windows : device.os === 'iOS' || device.os === 'iPadOS' ? Icons.apple : device.os === 'Android' ? Icons.android : Icons.devices}</span>
        ${escapeHtml(device.name)}
      </h2>
      <button class="blade-panel__close" aria-label="Close">${Icons.close}</button>
    </div>
    
    <!-- Top Remote Actions Toolbar (Official Microsoft Intune set) -->
    <div class="blade-actions-bar" style="display:flex;align-items:center;gap:6px;padding:8px 16px;background:var(--color-bg-surface);border-bottom:1px solid var(--color-border);overflow-x:auto;flex-shrink:0;">
      <button class="btn btn-sm btn-default device-action-btn" data-action="Sync" title="Check-in with Intune" style="display:flex;align-items:center;gap:4px;white-space:nowrap;">${Icons.sync} Sync</button>
      <button class="btn btn-sm btn-default device-action-btn" data-action="Restart" title="Reboot remote device" style="display:flex;align-items:center;gap:4px;white-space:nowrap;">${Icons.restart} Restart</button>
      <button class="btn btn-sm btn-default device-action-btn" data-action="Remote lock" title="Lock screen immediately" style="display:flex;align-items:center;gap:4px;white-space:nowrap;">${Icons.lock} Remote lock</button>
      <button class="btn btn-sm btn-default device-action-btn" data-action="Quick scan" title="Run Defender quick scan" style="display:flex;align-items:center;gap:4px;white-space:nowrap;">${Icons.security} Quick scan</button>
      <button class="btn btn-sm btn-default device-action-btn" data-action="Collect diagnostics" title="Collect diagnostic logs archive" style="display:flex;align-items:center;gap:4px;white-space:nowrap;">${Icons.refresh} Collect diagnostics</button>
      <button class="btn btn-sm btn-default device-action-btn" data-action="Rotate BitLocker key" title="Rotate BitLocker recovery key" style="display:flex;align-items:center;gap:4px;white-space:nowrap;">${Icons.key} Rotate BitLocker</button>
      <button class="btn btn-sm btn-default device-action-btn" data-action="Rotate LAPS password" title="Rotate local admin password" style="display:flex;align-items:center;gap:4px;white-space:nowrap;">${Icons.lock} Rotate LAPS</button>
      <button class="btn btn-sm btn-default device-action-btn" data-action="Fresh Start" title="Reinstall clean Windows" style="display:flex;align-items:center;gap:4px;white-space:nowrap;">${Icons.refresh} Fresh Start</button>
      <button class="btn btn-sm btn-default device-action-btn" data-action="Autopilot Reset" title="Reset to business-ready state" style="display:flex;align-items:center;gap:4px;white-space:nowrap;">${Icons.refresh} Autopilot reset</button>
      <div style="height:18px;width:1px;background:var(--color-border);margin:0 4px;"></div>
      <button class="btn btn-sm btn-default device-action-btn" data-action="Retire" title="Remove corporate data" style="color:var(--color-warning);display:flex;align-items:center;gap:4px;white-space:nowrap;">${Icons.wipe} Retire</button>
      <button class="btn btn-sm btn-default device-action-btn" data-action="Wipe" title="Factory reset device" style="color:var(--color-error);display:flex;align-items:center;gap:4px;white-space:nowrap;">${Icons.delete} Wipe</button>
    </div>

    <div class="blade-panel__tabs">
      <button class="blade-tab active" data-tab="overview">Overview</button>
      <button class="blade-tab" data-tab="properties">Properties</button>
      <button class="blade-tab" data-tab="hardware">Hardware</button>
      <button class="blade-tab" data-tab="compliance">Compliance</button>
      <button class="blade-tab" data-tab="policies">Device configuration</button>
      <button class="blade-tab" data-tab="apps">Discovered apps</button>
      <button class="blade-tab" data-tab="recovery">Recovery keys</button>
      <button class="blade-tab" data-tab="diagnostics">Diagnostics</button>
    </div>
    <div class="blade-panel__body" id="device-blade-body"></div>
    <div class="blade-panel__footer" style="position:relative;z-index:20;">
      <div style="position:relative;display:inline-block;">
        <button class="btn btn-primary" id="device-actions-btn" style="display:flex;align-items:center;gap:6px;">
          Remote actions ▾
        </button>
        <div class="dropdown-menu dropup dropdown-menu--up" id="device-actions-menu" style="bottom:calc(100% + 6px);top:auto;left:0;min-width:240px;box-shadow:var(--shadow-16);">
          <button class="dropdown-item" data-action="Sync">${Icons.sync} Sync</button>
          <button class="dropdown-item" data-action="Restart">${Icons.restart} Restart</button>
          <button class="dropdown-item" data-action="Remote lock">${Icons.lock} Remote lock</button>
          <button class="dropdown-item" data-action="Quick scan">${Icons.security} Quick scan</button>
          <button class="dropdown-item" data-action="Full scan">${Icons.security} Full scan</button>
          <button class="dropdown-item" data-action="Update signatures">${Icons.refresh} Update Defender intelligence</button>
          <div class="dropdown-separator"></div>
          <button class="dropdown-item" data-action="Rotate BitLocker key">${Icons.key} Rotate BitLocker key</button>
          <button class="dropdown-item" data-action="Rotate LAPS password">${Icons.lock} Rotate LAPS password</button>
          <button class="dropdown-item" data-action="Rename device">${Icons.edit} Rename device</button>
          <button class="dropdown-item" data-action="Send custom notification">${Icons.bell} Send custom notification</button>
          <button class="dropdown-item" data-action="Remote Help">${Icons.remoteHelp} New Remote Help session</button>
          <div class="dropdown-separator"></div>
          <button class="dropdown-item" data-action="Fresh Start">${Icons.refresh} Fresh Start</button>
          <button class="dropdown-item" data-action="Autopilot Reset">${Icons.refresh} Autopilot reset</button>
          <button class="dropdown-item" data-action="Collect diagnostics">${Icons.download} Collect diagnostics</button>
          <div class="dropdown-separator"></div>
          <button class="dropdown-item dropdown-item--danger" data-action="Retire">${Icons.wipe} Retire</button>
          <button class="dropdown-item dropdown-item--danger" data-action="Wipe">${Icons.delete} Wipe</button>
        </div>
      </div>
      <button class="btn btn-danger" id="device-delete-btn">Delete</button>
      <button class="btn btn-default blade-close-action">Close</button>
    </div>
  `;
  document.body.appendChild(panel);
  requestAnimationFrame(() => panel.classList.add('open'));

  const closeBlade = () => {
    panel.classList.remove('open'); overlay.classList.remove('visible');
    setTimeout(() => { panel.remove(); overlay.remove(); }, 300);
  };
  panel.querySelector('.blade-panel__close').addEventListener('click', closeBlade);
  panel.querySelector('.blade-close-action').addEventListener('click', closeBlade);
  overlay.addEventListener('click', closeBlade);

  // Tabs
  const renderTab = (tab) => {
    panel.querySelectorAll('.blade-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    const body = document.getElementById('device-blade-body');
    if (!body) return;
    switch (tab) {
      case 'overview': renderDeviceOverviewTab(body, device); break;
      case 'properties': renderDevicePropertiesTab(body, device); break;
      case 'hardware': renderDeviceHardwareTab(body, device); break;
      case 'compliance': renderDeviceComplianceTab(body, device); break;
      case 'policies': renderDevicePoliciesTab(body, device); break;
      case 'apps': renderDeviceDiscoveredAppsTab(body, device); break;
      case 'recovery': renderDeviceRecoveryTab(body, device); break;
      case 'diagnostics': renderDeviceDiagnosticsTab(body, device); break;
    }
  };
  panel.querySelectorAll('.blade-tab').forEach(t => t.addEventListener('click', () => renderTab(t.dataset.tab)));
  renderTab('overview');

  // Master Remote Action Dispatcher
  const executeRemoteAction = (action) => {
    switch (action) {
      case 'Sync': {
        const now = new Date().toISOString();
        Store.update(Collections.DEVICES, device.id, { lastCheckIn: now, lastSyncStatus: 'Success' });
        device.lastCheckIn = now;
        device.lastSyncStatus = 'Success';
        toast()?.success('Sync initiated', `Device ${device.name} check-in initiated successfully.`);
        Store.addNotification({ type: 'success', title: 'Device sync initiated', message: `Check-in requested for ${device.name}` });
        renderTab('overview');
        break;
      }
      case 'Restart': {
        if (!confirm(`Are you sure you want to restart ${device.name}? The user will be notified and the device will restart in 5 minutes.`)) return;
        toast()?.info('Restart command sent', `Restart signal sent to ${device.name}.`);
        Store.addNotification({ type: 'warning', title: 'Remote restart scheduled', message: `Restart command sent to ${device.name}` });
        break;
      }
      case 'Remote lock': {
        if (!confirm(`Remotely lock ${device.name}? The device will be locked immediately and will require the device passcode/PIN to unlock.`)) return;
        toast()?.success('Device locked', `Remote lock command successfully sent to ${device.name}.`);
        Store.addNotification({ type: 'warning', title: 'Remote lock dispatched', message: `Device ${device.name} locked remotely.` });
        break;
      }
      case 'Quick scan': {
        toast()?.info('Defender scan', `Windows Defender Antivirus Quick Scan started on ${device.name}.`);
        Store.addNotification({ type: 'info', title: 'Antivirus scan running', message: `Quick scan running on ${device.name}` });
        break;
      }
      case 'Full scan': {
        toast()?.info('Defender full scan', `Windows Defender full system offline scan scheduled on ${device.name}.`);
        Store.addNotification({ type: 'info', title: 'Full scan started', message: `Full Antivirus scan running on ${device.name}` });
        break;
      }
      case 'Update signatures': {
        toast()?.success('Signatures updated', `Microsoft Defender Security Intelligence definitions updated on ${device.name}.`);
        Store.addNotification({ type: 'success', title: 'Defender updated', message: `Security definitions updated on ${device.name}` });
        break;
      }
      case 'Fresh Start': {
        showKeyModal('Fresh Start — Windows Reinstallation', `
          <div style="font-size:13px;line-height:1.5;">
            <p>Fresh Start will remove all pre-installed OEM software and reinstall the most recent version of Windows on <strong>${escapeHtml(device.name)}</strong>.</p>
            <div style="margin:14px 0;padding:12px;background:var(--color-bg-canvas);border:1px solid var(--color-border);border-radius:6px;">
              <label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;">
                <input type="checkbox" id="freshstart-retain-input" checked style="margin-top:2px;">
                <span><strong>Retain user data on this device</strong><br><span style="font-size:12px;color:var(--color-text-secondary);">Keep work/personal accounts, user files, and personal settings.</span></span>
              </label>
            </div>
            <button class="btn btn-primary btn-sm" id="confirm-fresh-start" style="width:100%;">Initiate Fresh Start</button>
          </div>
        `, () => {});
        document.getElementById('confirm-fresh-start')?.addEventListener('click', () => {
          const retain = document.getElementById('freshstart-retain-input')?.checked;
          document.getElementById('key-modal-overlay')?.remove();
          toast()?.success('Fresh Start initiated', `Fresh Start (${retain ? 'Retaining user data' : 'Clean install'}) sent to ${device.name}.`);
          Store.addNotification({ type: 'warning', title: 'Fresh Start initiated', message: `Reinstallation dispatched to ${device.name}` });
        });
        break;
      }
      case 'Autopilot Reset': {
        if (!confirm(`Autopilot Reset will remove personal files, apps, and settings on ${device.name}, while maintaining Microsoft Entra join and Intune enrollment. Continue?`)) return;
        toast()?.success('Autopilot Reset scheduled', `Reset command dispatched to ${device.name}.`);
        Store.addNotification({ type: 'warning', title: 'Autopilot Reset scheduled', message: `Repurposing command dispatched for ${device.name}` });
        break;
      }
      case 'Collect diagnostics': {
        toast()?.info('Collecting diagnostics', `Intune management extension is gathering device diagnostics from ${device.name}...`);
        setTimeout(() => {
          if (!device.diagnosticLogs) device.diagnosticLogs = [];
          const logId = 'DIAG-' + Math.floor(10000 + Math.random() * 90000);
          device.diagnosticLogs.unshift({
            id: logId,
            timestamp: new Date().toISOString(),
            status: 'Completed',
            size: '14.2 MB',
            components: ['MDMDiagReport.html', 'IntuneManagementExtension.log', 'WindowsEventLogs.evtx', 'BitLockerStatus.txt'],
          });
          Store.update(Collections.DEVICES, device.id, { diagnosticLogs: device.diagnosticLogs });
          toast()?.success('Diagnostics ready', `Diagnostic bundle ${logId} ready for download from ${device.name}.`);
          Store.addNotification({ type: 'success', title: 'Diagnostics gathered', message: `Log bundle ${logId} completed for ${device.name}` });
          renderTab('diagnostics');
        }, 1000);
        break;
      }
      case 'Rotate BitLocker key': {
        const parts = [];
        for (let i = 0; i < 8; i++) parts.push(Math.floor(100000 + Math.random() * 900000).toString());
        const newKey = parts.join('-');
        const keyId = generateId();
        Store.update(Collections.DEVICES, device.id, { isEncrypted: true, bitlockerRecoveryKey: newKey });
        device.bitlockerRecoveryKey = newKey;
        
        showKeyModal('BitLocker Recovery Key', `
          <div style="font-size:13px;line-height:1.5;">
            <p>A new BitLocker recovery key has been generated and escrowed to Microsoft Entra ID for <strong>${escapeHtml(device.name)}</strong>:</p>
            <div style="background:var(--color-bg-canvas);padding:12px;border-radius:6px;margin:12px 0;border:1px solid var(--color-border);font-family:monospace;font-size:14px;font-weight:700;letter-spacing:1px;color:var(--color-primary);text-align:center;" id="bitlocker-key-text">
              ${newKey}
            </div>
            <div style="font-size:12px;color:var(--color-text-secondary);margin-bottom:14px;">Key ID: {${keyId.toUpperCase()}}</div>
            <button class="btn btn-primary btn-sm" id="copy-bitlocker-key" style="width:100%;margin-bottom:8px;">Copy key to clipboard</button>
          </div>
        `, () => {
          navigator.clipboard?.writeText(newKey);
          toast()?.success('Copied', 'BitLocker recovery key copied to clipboard.');
        });

        toast()?.success('Key rotated', `New BitLocker recovery key generated for ${device.name}.`);
        Store.addNotification({ type: 'success', title: 'BitLocker key rotated', message: `New recovery key generated for ${device.name}` });
        break;
      }
      case 'Rotate LAPS password': {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
        let newPass = '';
        for (let i = 0; i < 16; i++) newPass += chars.charAt(Math.floor(Math.random() * chars.length));
        Store.update(Collections.DEVICES, device.id, { lapsPassword: newPass });
        device.lapsPassword = newPass;

        showKeyModal('Windows LAPS Password Rotated', `
          <div style="font-size:13px;line-height:1.5;">
            <p>Windows Local Administrator Password Solution (LAPS) has rotated the local administrator credentials for <strong>${escapeHtml(device.name)}</strong>:</p>
            <div style="background:var(--color-bg-canvas);padding:12px;border-radius:6px;margin:12px 0;border:1px solid var(--color-border);">
              <div style="font-size:12px;color:var(--color-text-secondary);">Account Name:</div>
              <div style="font-weight:600;margin-bottom:8px;">.\Administrator</div>
              <div style="font-size:12px;color:var(--color-text-secondary);">New Password:</div>
              <div style="font-family:monospace;font-size:15px;font-weight:700;color:var(--color-success);" id="laps-pass-text">${newPass}</div>
            </div>
            <button class="btn btn-primary btn-sm" id="copy-laps-pass" style="width:100%;margin-bottom:8px;">Copy password to clipboard</button>
          </div>
        `, () => {
          navigator.clipboard?.writeText(newPass);
          toast()?.success('Copied', 'Local administrator password copied to clipboard.');
        });

        toast()?.success('LAPS password rotated', `New local admin password generated for ${device.name}.`);
        Store.addNotification({ type: 'success', title: 'LAPS password rotated', message: `Credentials rotated for ${device.name}` });
        break;
      }
      case 'Rename device': {
        showKeyModal('Rename device', `
          <div style="font-size:13px;line-height:1.5;">
            <p>Enter the new computer name for <strong>${escapeHtml(device.name)}</strong>. The device will be renamed in Intune immediately and upon next check-in/restart:</p>
            <div class="form-group" style="margin:14px 0;">
              <label class="form-label required">New device name</label>
              <input type="text" class="form-input" id="rename-input" value="${escapeHtml(device.name)}" maxlength="63">
              <div class="form-hint">Standard naming: 1-63 alphanumeric characters and hyphens.</div>
            </div>
            <button class="btn btn-primary btn-sm" id="confirm-rename-btn" style="width:100%;">Save and rename</button>
          </div>
        `, () => {});
        document.getElementById('confirm-rename-btn')?.addEventListener('click', () => {
          const newName = document.getElementById('rename-input')?.value?.trim();
          if (!newName) return;
          document.getElementById('key-modal-overlay')?.remove();
          Store.update(Collections.DEVICES, device.id, { name: newName });
          device.name = newName;
          toast()?.success('Device renamed', `Device renamed to ${newName}.`);
          Store.addNotification({ type: 'info', title: 'Device renamed', message: `${device.name} renamed to ${newName}` });
          panel.querySelector('.blade-panel__title').innerHTML = `
            <span style="color:var(--color-primary);display:flex;">${device.os === 'Windows' ? Icons.windows : device.os === 'iOS' || device.os === 'iPadOS' ? Icons.apple : device.os === 'Android' ? Icons.android : Icons.devices}</span>
            ${escapeHtml(newName)}
          `;
          renderTab('overview');
        });
        break;
      }
      case 'Send custom notification': {
        showKeyModal('Send custom notification', `
          <div style="font-size:13px;line-height:1.5;">
            <p>Send a push notification directly to the Company Portal app on <strong>${escapeHtml(device.name)}</strong>.</p>
            <div class="form-group" style="margin:10px 0;">
              <label class="form-label required">Notification title</label>
              <input type="text" class="form-input" id="notif-title-input" placeholder="e.g., Mandatory Security Update Required">
            </div>
            <div class="form-group" style="margin:10px 0;">
              <label class="form-label required">Notification message</label>
              <textarea class="form-input form-textarea" id="notif-body-input" rows="3" placeholder="Please restart your PC before 5:00 PM to finish installing mandatory security updates."></textarea>
            </div>
            <button class="btn btn-primary btn-sm" id="confirm-send-notif" style="width:100%;">Send notification</button>
          </div>
        `, () => {});
        document.getElementById('confirm-send-notif')?.addEventListener('click', () => {
          const title = document.getElementById('notif-title-input')?.value?.trim() || 'Notice from IT Admin';
          const msg = document.getElementById('notif-body-input')?.value?.trim() || 'Please check Company Portal for updates.';
          document.getElementById('key-modal-overlay')?.remove();
          toast()?.success('Notification sent', `Push notification "${title}" dispatched to ${device.name}.`);
          Store.addNotification({ type: 'info', title: `Company Portal: ${title}`, message: `Sent to ${device.name}: ${msg}` });
        });
        break;
      }
      case 'Remote Help': {
        const sessionCode = Math.floor(100000 + Math.random() * 900000).toString();
        const formattedCode = sessionCode.substring(0, 3) + '-' + sessionCode.substring(3);
        showKeyModal('Microsoft Remote Help', `
          <div style="font-size:13px;line-height:1.5;">
            <p>A secure Remote Help session has been generated for <strong>${escapeHtml(device.name)}</strong>.</p>
            <div style="background:var(--color-bg-canvas);padding:14px;border-radius:8px;border:1px solid var(--color-border);text-align:center;margin:14px 0;">
              <div style="font-size:12px;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:0.5px;">6-digit Security Code</div>
              <div style="font-size:26px;font-weight:700;color:var(--color-primary);letter-spacing:3px;margin:8px 0;" id="remote-help-code">${formattedCode}</div>
              <div style="font-size:11px;color:var(--color-text-tertiary);">Code expires in 10 minutes. Provide this code to the user on the device.</div>
            </div>
            <button class="btn btn-primary btn-sm" id="copy-remote-code" style="width:100%;">Copy code to clipboard</button>
          </div>
        `, () => {
          navigator.clipboard?.writeText(formattedCode);
          toast()?.success('Copied', 'Remote Help security code copied to clipboard.');
        });
        toast()?.info('Remote Help session ready', `Security code ${formattedCode} generated.`);
        Store.addNotification({ type: 'info', title: 'Remote Help requested', message: `Session code ${formattedCode} ready for ${device.name}` });
        break;
      }
      case 'Retire': {
        if (!confirm(`Retire ${device.name}? This removes all corporate data, email, and managed apps. Personal data is kept. The device will be unenrolled.`)) return;
        Store.update(Collections.DEVICES, device.id, { managementState: 'Retired', complianceState: 'Not evaluated' });
        device.managementState = 'Retired';
        device.complianceState = 'Not evaluated';
        toast()?.success('Device retired', `${device.name} has been retired. Corporate data removed.`);
        Store.addNotification({ type: 'info', title: 'Device retired', message: `${device.name} retired from Intune management` });
        renderTab('overview');
        break;
      }
      case 'Wipe': {
        if (!confirm(`⚠️ DANGER: Wipe ${device.name}? This will perform a COMPLETE FACTORY RESET, erasing ALL personal and corporate files, apps, and operating system configurations. This action CANNOT be undone.`)) return;
        Store.delete(Collections.DEVICES, device.id);
        toast()?.success('Device wiped', `${device.name} has been wiped and removed from management.`);
        Store.addNotification({ type: 'error', title: 'Device wiped', message: `${device.name} factory wiped and removed` });
        closeBlade();
        renderAllDevices();
        break;
      }
      case 'Delete': {
        if (!confirm(`Permanently delete ${device.name} from Microsoft Intune?`)) return;
        Store.delete(Collections.DEVICES, device.id);
        toast()?.success('Device deleted', `${device.name} removed from Intune.`);
        closeBlade();
        renderAllDevices();
        break;
      }
      default: {
        toast()?.info('Remote action', `Action "${action}" sent to ${device.name}.`);
        Store.addNotification({ type: 'info', title: 'Remote action sent', message: `${action} → ${device.name}` });
        break;
      }
    }
  };

  // Bind top action bar buttons
  panel.querySelectorAll('.device-action-btn').forEach(btn => {
    btn.addEventListener('click', () => executeRemoteAction(btn.dataset.action));
  });

  // Bind footer Remote actions dropdown
  const actBtn = panel.querySelector('#device-actions-btn');
  const actMenu = panel.querySelector('#device-actions-menu');
  actBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    actMenu.classList.toggle('open');
  });

  actMenu.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      actMenu.classList.remove('open');
      executeRemoteAction(item.dataset.action);
    });
  });

  document.addEventListener('click', () => actMenu.classList.remove('open'));

  // Delete button
  panel.querySelector('#device-delete-btn').addEventListener('click', () => executeRemoteAction('Delete'));
}

// Helper for security key/credential popups
function showKeyModal(title, bodyHtml, onCopy) {
  const existing = document.getElementById('key-modal-overlay');
  if (existing) existing.remove();

  const overlay = createElement('div', { id: 'key-modal-overlay', className: 'blade-overlay visible', style: 'z-index:1500;display:flex;align-items:center;justify-content:center;' });
  const modal = createElement('div', { className: 'content-card', style: 'width:440px;max-width:92vw;background:var(--color-bg-surface);box-shadow:var(--shadow-64);border-radius:8px;padding:20px;position:relative;' });
  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:1px solid var(--color-border);padding-bottom:10px;">
      <h3 style="font-size:16px;font-weight:600;margin:0;">${escapeHtml(title)}</h3>
      <button class="blade-panel__close" id="key-modal-close" style="width:28px;height:28px;">${Icons.close}</button>
    </div>
    ${bodyHtml}
    <div style="display:flex;justify-content:flex-end;margin-top:14px;">
      <button class="btn btn-default btn-sm" id="key-modal-dismiss">Done</button>
    </div>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const closeModal = () => overlay.remove();
  modal.querySelector('#key-modal-close')?.addEventListener('click', closeModal);
  modal.querySelector('#key-modal-dismiss')?.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

  modal.querySelector('#copy-bitlocker-key')?.addEventListener('click', onCopy);
  modal.querySelector('#copy-laps-pass')?.addEventListener('click', onCopy);
  modal.querySelector('#copy-remote-code')?.addEventListener('click', onCopy);
}

function renderDeviceOverviewTab(body, d) {
  body.innerHTML = `
    <div style="margin-bottom:16px;">${compliancePill(d.complianceState)}</div>
    <dl class="kv-grid">
      <dt>Device name</dt><dd>${d.name}</dd>
      <dt>OS version</dt><dd>${d.osVersion}</dd>
      <dt>Join type</dt><dd><span class="tag">${d.joinType}</span></dd>
      <dt>Primary user</dt><dd>${d.primaryUser||'—'}</dd>
      <dt>Ownership</dt><dd>${d.ownership}</dd>
      <dt>Last check-in</dt><dd>${new Date(d.lastCheckIn).toLocaleString()}</dd>
      <dt>Enrolled date</dt><dd>${formatDate(d.enrolledDate)}</dd>
      <dt>Management state</dt><dd>${d.managementState}</dd>
      <dt>Defender status</dt><dd>${d.defenderStatus}</dd>
      <dt>Encryption</dt><dd>${d.isEncrypted?'BitLocker Encrypted':'Not encrypted'}</dd>
      <dt>Serial number</dt><dd style="font-family:monospace;">${d.serialNumber||'—'}</dd>
      <dt>Intune Device ID</dt><dd style="font-family:monospace;font-size:12px;">${d.id}</dd>
    </dl>
    ${d.noncompliantReasons?`<div class="info-banner info-banner--warning" style="margin-top:16px;"><span class="info-banner__icon" style="color:var(--color-warning)">${Icons.warning}</span><div><strong>Noncompliant reasons:</strong><ul style="margin-top:4px;padding-left:16px;list-style:disc;">${d.noncompliantReasons.map(r=>`<li>${r}</li>`).join('')}</ul></div></div>`:''}
  `;
}

function renderDevicePropertiesTab(body, d) {
  body.innerHTML = `
    <dl class="kv-grid">
      <dt>Device name</dt><dd><input class="form-input" value="${escapeHtml(d.name)}" id="edit-name" style="max-width:280px;"></dd>
      <dt>Management name</dt><dd>${d.name} - ${d.primaryUser||'Unassigned'}</dd>
      <dt>Category</dt><dd>${d.category||'Corporate standard'}</dd>
      <dt>Serial number</dt><dd style="font-family:monospace;">${d.serialNumber}</dd>
      <dt>Manufacturer</dt><dd>${d.manufacturer}</dd>
      <dt>Model</dt><dd>${d.model}</dd>
      <dt>OS edition</dt><dd>${d.osVersion}</dd>
      <dt>Enrolled by</dt><dd>${d.enrolledBy}</dd>
      <dt>Enrolled date</dt><dd>${formatDate(d.enrolledDate)}</dd>
    </dl>
    <button class="btn btn-primary" id="save-device-props" style="margin-top:16px;">Save properties</button>
  `;
  document.getElementById('save-device-props')?.addEventListener('click', () => {
    const newName = document.getElementById('edit-name')?.value?.trim();
    if (newName) {
      Store.update(Collections.DEVICES, d.id, { name: newName });
      d.name = newName;
      toast()?.success('Saved', 'Device properties updated.');
    }
  });
}

function renderDeviceHardwareTab(body, d) {
  body.innerHTML = `
    <dl class="kv-grid">
      <dt>Manufacturer</dt><dd>${d.manufacturer}</dd>
      <dt>Model</dt><dd>${d.model}</dd>
      <dt>Serial number</dt><dd style="font-family:monospace;">${d.serialNumber}</dd>
      <dt>Storage capacity</dt><dd>${d.storageTotal} total / ${d.storageFree} free</dd>
      <dt>BitLocker status</dt><dd>${d.isEncrypted?'Hardware TPM 2.0 Encrypted':'Unencrypted'}</dd>
      <dt>Antivirus status</dt><dd>${d.antivirusStatus}</dd>
      <dt>Processor architecture</dt><dd>x64 (64-bit)</dd>
      <dt>Secure Boot state</dt><dd><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Enabled</span></dd>
      <dt>TPM specification</dt><dd>2.0 (Manufacturer: INTC)</dd>
      <dt>Wi-Fi MAC address</dt><dd style="font-family:monospace;">00:1A:2B:3C:4D:5E</dd>
    </dl>
  `;
}

function renderDeviceComplianceTab(body, d) {
  body.innerHTML = `
    <div style="margin-bottom:16px;">${compliancePill(d.complianceState)}</div>
    ${d.noncompliantReasons ? `
      <h3 style="font-size:14px;font-weight:600;margin-bottom:8px;">Compliance check failures:</h3>
      <ul style="padding-left:16px;list-style:disc;margin-bottom:14px;">
        ${d.noncompliantReasons.map(r=>`<li style="margin-bottom:4px;color:var(--color-error);">${r}</li>`).join('')}
      </ul>
    ` : `
      <div class="info-banner info-banner--success" style="margin-bottom:14px;">
        <span class="info-banner__icon" style="color:var(--color-success)">${Icons.check}</span>
        <span>Device meets all assigned compliance policy requirements.</span>
      </div>
    `}
    ${d.graceDeadline?`<div class="info-banner info-banner--warning"><span class="info-banner__icon" style="color:var(--color-warning)">${Icons.warning}</span><span>In grace period until: <strong>${formatDate(d.graceDeadline)}</strong></span></div>`:''}
  `;
}

function renderDevicePoliciesTab(body, d) {
  const policies = Store.getAll(Collections.COMPLIANCE_POLICIES);
  const profiles = Store.getAll(Collections.CONFIG_PROFILES);
  const relevant = [...policies, ...profiles].filter(p => {
    if (d.os === 'Windows' && p.platform?.includes('Windows')) return true;
    if ((d.os === 'iOS' || d.os === 'iPadOS') && p.platform?.includes('iOS')) return true;
    if (d.os === 'Android' && p.platform?.includes('Android')) return true;
    if (d.os === 'macOS' && p.platform?.includes('macOS')) return true;
    return false;
  });
  if (relevant.length === 0) {
    body.innerHTML = '<p style="color:var(--color-text-secondary);padding:16px;text-align:center;">No configuration profiles assigned to this device platform.</p>';
    return;
  }
  let html = '<div style="display:flex;flex-direction:column;gap:8px;">';
  for (const p of relevant) {
    html += `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;border:1px solid var(--color-border);border-radius:8px;">
        <div>
          <div style="font-weight:600;">${escapeHtml(p.name)}</div>
          <div style="font-size:12px;color:var(--color-text-secondary);margin-top:2px;">${escapeHtml(p.platform)} · ${escapeHtml(p.profileType||'Compliance Policy')}</div>
        </div>
        <span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Succeeded</span>
      </div>
    `;
  }
  html += '</div>';
  body.innerHTML = html;
}

function renderDeviceDiscoveredAppsTab(body, d) {
  const discovered = [
    { name: 'Microsoft Edge', version: '128.0.2739.42', publisher: 'Microsoft Corporation', size: '342 MB' },
    { name: 'Microsoft 365 Apps for enterprise', version: '16.0.17928.20114', publisher: 'Microsoft Corporation', size: '2.4 GB' },
    { name: 'Microsoft Teams', version: '24215.1007.3108.5727', publisher: 'Microsoft Corporation', size: '215 MB' },
    { name: 'Microsoft Defender for Endpoint', version: '10.8750.22408.1003', publisher: 'Microsoft Corporation', size: '180 MB' },
    { name: 'Microsoft OneDrive', version: '24.161.0811.0001', publisher: 'Microsoft Corporation', size: '98 MB' },
    { name: 'Google Chrome', version: '128.0.6613.85', publisher: 'Google LLC', size: '310 MB' },
    { name: 'Zoom Workplace', version: '6.1.10 (43515)', publisher: 'Zoom Video Communications, Inc.', size: '190 MB' },
    { name: '7-Zip 24.07 (x64)', version: '24.07.00.0', publisher: 'Igor Pavlov', size: '5.2 MB' },
  ];

  body.innerHTML = `
    <div style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;">
      <span style="font-size:13px;color:var(--color-text-secondary);">${discovered.length} discovered applications on endpoint</span>
      <span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Inventory synced</span>
    </div>
    <div class="data-grid-wrapper">
      <table class="data-grid">
        <thead>
          <tr>
            <th>Application name</th>
            <th>Version</th>
            <th>Publisher</th>
            <th>Size</th>
          </tr>
        </thead>
        <tbody>
          ${discovered.map(app => `
            <tr>
              <td><strong>${escapeHtml(app.name)}</strong></td>
              <td>${escapeHtml(app.version)}</td>
              <td>${escapeHtml(app.publisher)}</td>
              <td>${escapeHtml(app.size)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderDeviceRecoveryTab(body, d) {
  if (!d.bitlockerRecoveryKey) {
    const parts = [];
    for (let i = 0; i < 8; i++) parts.push(Math.floor(100000 + Math.random() * 900000).toString());
    d.bitlockerRecoveryKey = parts.join('-');
  }
  if (!d.lapsPassword) {
    d.lapsPassword = 'Laps!' + Math.random().toString(36).substring(2, 10).toUpperCase() + '@24';
  }
  const keyId = '{' + (d.bitlockerKeyId || (d.bitlockerKeyId = generateId().toUpperCase())) + '}';
  const escrowDate = d.enrolledDate ? new Date(d.enrolledDate).toLocaleDateString() : 'Aug 15, 2024';

  body.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:18px;">
      <div class="content-card" style="padding:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <h3 style="font-size:15px;font-weight:600;display:flex;align-items:center;gap:8px;margin:0;">
            <span style="color:var(--color-primary);display:flex;">${Icons.key}</span>
            BitLocker Recovery Keys
          </h3>
          <span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Escrowed to Entra ID</span>
        </div>
        <dl class="kv-grid" style="margin-bottom:12px;">
          <dt>Drive type</dt><dd>Operating System Drive (C:)</dd>
          <dt>Key ID</dt><dd style="font-family:monospace;font-size:12px;">${keyId}</dd>
          <dt>Escrow date</dt><dd>${escrowDate}</dd>
          <dt>Recovery key</dt>
          <dd>
            <div style="display:flex;align-items:center;gap:8px;background:var(--color-bg-canvas);padding:8px 12px;border-radius:4px;border:1px solid var(--color-border);font-family:monospace;font-weight:600;color:var(--color-primary);letter-spacing:0.5px;">
              <span id="bl-key-display">${d.bitlockerRecoveryKey}</span>
              <button class="btn btn-default btn-sm" id="btn-copy-bl-key" style="margin-left:auto;padding:2px 8px;font-size:11px;">Copy</button>
            </div>
          </dd>
        </dl>
        <button class="btn btn-default btn-sm" id="btn-rotate-bl-from-tab" style="display:flex;align-items:center;gap:6px;">
          ${Icons.refresh} Rotate BitLocker key now
        </button>
      </div>

      <div class="content-card" style="padding:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <h3 style="font-size:15px;font-weight:600;display:flex;align-items:center;gap:8px;margin:0;">
            <span style="color:var(--color-primary);display:flex;">${Icons.lock}</span>
            Windows LAPS Local Admin Password
          </h3>
          <span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Backup: Entra ID</span>
        </div>
        <dl class="kv-grid" style="margin-bottom:12px;">
          <dt>Account name</dt><dd style="font-weight:600;">.\Administrator</dd>
          <dt>Next rotation</dt><dd>In 28 days (Automated cycle)</dd>
          <dt>Password</dt>
          <dd>
            <div style="display:flex;align-items:center;gap:8px;background:var(--color-bg-canvas);padding:8px 12px;border-radius:4px;border:1px solid var(--color-border);">
              <span id="laps-pass-display" style="font-family:monospace;font-weight:700;color:var(--color-success);">${d.lapsPassword}</span>
              <button class="btn btn-default btn-sm" id="btn-copy-laps-key" style="margin-left:auto;padding:2px 8px;font-size:11px;">Copy</button>
            </div>
          </dd>
        </dl>
        <button class="btn btn-default btn-sm" id="btn-rotate-laps-from-tab" style="display:flex;align-items:center;gap:6px;">
          ${Icons.refresh} Rotate LAPS password now
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-copy-bl-key')?.addEventListener('click', () => {
    navigator.clipboard?.writeText(d.bitlockerRecoveryKey);
    toast()?.success('Copied', 'BitLocker recovery key copied to clipboard.');
  });
  document.getElementById('btn-copy-laps-key')?.addEventListener('click', () => {
    navigator.clipboard?.writeText(d.lapsPassword);
    toast()?.success('Copied', 'Local admin password copied to clipboard.');
  });
  document.getElementById('btn-rotate-bl-from-tab')?.addEventListener('click', () => {
    executeRemoteAction('Rotate BitLocker key');
  });
  document.getElementById('btn-rotate-laps-from-tab')?.addEventListener('click', () => {
    executeRemoteAction('Rotate LAPS password');
  });
}

function renderDeviceDiagnosticsTab(body, d) {
  if (!d.diagnosticLogs) {
    d.diagnosticLogs = [
      {
        id: 'DIAG-88219',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        status: 'Completed',
        size: '15.4 MB',
        components: ['MDMDiagReport.html', 'IntuneManagementExtension.log', 'WindowsEventLogs.evtx'],
      }
    ];
  }

  body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
      <div>
        <h3 style="font-size:15px;font-weight:600;margin:0;">Device Diagnostics Log Bundles</h3>
        <div style="font-size:12px;color:var(--color-text-secondary);margin-top:2px;">Captured Intune MDM logs, Windows event logs, and enrollment trace files.</div>
      </div>
      <button class="btn btn-primary btn-sm" id="btn-trigger-diagnostics" style="display:flex;align-items:center;gap:6px;">
        ${Icons.refresh} Collect diagnostics
      </button>
    </div>
    <div class="data-grid-wrapper">
      <table class="data-grid">
        <thead>
          <tr>
            <th>Bundle ID</th>
            <th>Date collected</th>
            <th>Size</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${d.diagnosticLogs.map(log => `
            <tr>
              <td><strong>${escapeHtml(log.id)}</strong></td>
              <td>${new Date(log.timestamp).toLocaleString()}</td>
              <td>${log.size}</td>
              <td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>${log.status}</span></td>
              <td>
                <button class="btn btn-default btn-sm download-diag-btn" data-id="${log.id}" style="display:flex;align-items:center;gap:4px;">
                  ${Icons.download} Download .zip
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('btn-trigger-diagnostics')?.addEventListener('click', () => {
    executeRemoteAction('Collect diagnostics');
  });

  body.querySelectorAll('.download-diag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const logId = btn.dataset.id;
      const fileContent = `Microsoft Intune Device Diagnostic Log Bundle\nDevice: ${d.name}\nBundle ID: ${logId}\nDate: ${new Date().toISOString()}\nFiles Included:\n- MDMDiagReport.html\n- IntuneManagementExtension.log\n- ApplicationEventLog.evtx\n- SystemEventLog.evtx\n- BitLockerStatus.txt`;
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${d.name}-${logId}-diagnostics.zip`;
      a.click();
      toast()?.success('Downloaded', `Diagnostic bundle ${logId} downloaded.`);
    });
  });
}

/* ══════════════════════════════════════════════════
   MONITOR — Compliance charts
   ══════════════════════════════════════════════════ */
export function renderMonitor() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([{ label: 'Refresh', icon: Icons.refresh, onClick: renderMonitor, type: 'default' }]);

  const devices = Store.getAll(Collections.DEVICES);
  const stats = Store.getStats(Collections.DEVICES, 'complianceState');

  // Generate mock trend data (last 7 days)
  const trendData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const base = stats['Compliant'] || 0;
    trendData.push({ label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: Math.max(1, base + Math.floor(Math.random() * 3) - 1) });
  }

  el.innerHTML = `
    <h1 class="page-title">Monitor</h1>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
      <div class="content-card">
        <div class="content-card__header"><h2 class="content-card__title">Device compliance status</h2></div>
        <div style="display:flex;gap:24px;align-items:flex-start;">
          <canvas id="monitor-donut"></canvas>
          <div id="monitor-legend" class="chart-legend" style="min-width:160px;"></div>
        </div>
      </div>
      <div class="content-card">
        <div class="content-card__header"><h2 class="content-card__title">Compliant devices trend (7 days)</h2></div>
        <canvas id="monitor-trend"></canvas>
      </div>
    </div>
    <div class="content-card">
      <div class="content-card__header"><h2 class="content-card__title">Noncompliant devices</h2></div>
      <div id="noncompliant-list"></div>
    </div>
  `;

  const segments = [
    { label: 'Compliant', value: stats['Compliant']||0, color: '#107C10' },
    { label: 'Noncompliant', value: stats['Noncompliant']||0, color: '#D13438' },
    { label: 'In grace period', value: stats['In grace period']||0, color: '#FFB900' },
    { label: 'Not evaluated', value: stats['Not evaluated']||0, color: '#8A8886' },
  ];
  new DonutChart($('#monitor-donut'), { width: 180, height: 180, outerRadius: 80, innerRadius: 50, segments, centerText: String(devices.length), centerSubtext: 'total' }).draw();
  DonutChart.renderLegend($('#monitor-legend'), segments);
  new LineChart($('#monitor-trend'), { width: 400, height: 180, data: trendData, title: '', color: '#107C10' }).draw();

  // Noncompliant list
  const noncompliant = devices.filter(d => d.complianceState === 'Noncompliant' || d.complianceState === 'In grace period');
  const listEl = $('#noncompliant-list');
  if (noncompliant.length === 0) { listEl.innerHTML = '<p style="color:var(--color-text-secondary);padding:16px;">All devices compliant! 🎉</p>'; }
  else {
    let html = '';
    for (const d of noncompliant) {
      html += `<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--color-border-subtle);cursor:pointer;" class="nc-row" data-id="${d.id}">
        ${compliancePill(d.complianceState)}
        <div style="flex:1;"><strong>${d.name}</strong><div style="font-size:12px;color:var(--color-text-secondary);">${(d.noncompliantReasons||[]).join('; ')}</div></div>
        <span style="font-size:12px;color:var(--color-text-tertiary);">${d.primaryUser||''}</span></div>`;
    }
    listEl.innerHTML = html;
    listEl.querySelectorAll('.nc-row').forEach(row => row.addEventListener('click', () => openDeviceBlade(row.dataset.id)));
  }
}

/* ══════════════════════════════════════════════════
   COMPLIANCE POLICIES — List + Create Wizard
   ══════════════════════════════════════════════════ */
export function renderCompliancePolicies() {
  const el = getContentEl(); clearElement(el);
  const cb = getCommandBar();
  cb?.setActions([
    { label: 'Create policy', icon: Icons.add, onClick: () => createCompliancePolicy(), type: 'primary' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderCompliancePolicies, type: 'default' },
  ]);

  const policies = Store.getAll(Collections.COMPLIANCE_POLICIES);
  el.innerHTML = `
    <h1 class="page-title">Compliance policies</h1>
    <div class="grid-toolbar"><div class="grid-toolbar__search"><span style="display:flex">${Icons.search}</span><input type="text" placeholder="Search compliance policies..." id="cp-search" aria-label="Search"></div><span style="font-size:12px;color:var(--color-text-secondary);margin-left:auto;">${policies.length} polic${policies.length!==1?'ies':'y'}</span></div>
    <div class="data-grid-wrapper"><table class="data-grid" role="grid"><thead><tr><th>Name</th><th>Platform</th><th>Status</th><th>Assigned to</th><th>Created</th><th></th></tr></thead><tbody id="cp-tbody"></tbody></table></div>
  `;
  renderCompliancePolicyRows(policies);
  document.getElementById('cp-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderCompliancePolicyRows(policies.filter(p => p.name.toLowerCase().includes(q) || p.platform.toLowerCase().includes(q)));
  });
}

function renderCompliancePolicyRows(policies) {
  const tbody = document.getElementById('cp-tbody');
  if (!tbody) return;
  if (policies.length === 0) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--color-text-secondary);">No compliance policies</td></tr>'; return; }
  tbody.innerHTML = '';
  for (const p of policies) {
    const tr = createElement('tr');
    tr.innerHTML = `<td><span class="cell-link">${escapeHtml(p.name)}</span></td><td>${p.platform}</td><td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>${p.status}</span></td><td>${(p.assignedGroups||[]).join(', ')}</td><td>${formatDate(p.createdAt)}</td>
      <td><button class="btn-icon btn-delete" data-id="${p.id}" title="Delete">${Icons.delete}</button></td>`;
    tr.querySelector('.cell-link').addEventListener('click', () => toast()?.info(p.name, `Platform: ${p.platform}\nSettings: ${JSON.stringify(p.settings, null, 2).substring(0, 200)}…`));
    tr.querySelector('.btn-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Delete compliance policy "${p.name}"?`)) {
        Store.delete(Collections.COMPLIANCE_POLICIES, p.id);
        toast()?.success('Deleted', `"${p.name}" deleted.`);
        renderCompliancePolicies();
      }
    });
    tbody.appendChild(tr);
  }
}

function createCompliancePolicy() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.clearActions();

  const wizard = new Wizard(el, {
    steps: [
      { name: 'Basics', render: (data, body) => renderComplianceBasics(data, body), collect: collectComplianceBasics },
      { name: 'Settings', render: (data, body) => renderComplianceSettings(data, body), collect: collectComplianceSettings },
      { name: 'Actions', render: (data, body) => renderComplianceActions(data, body), collect: collectComplianceActions },
      { name: 'Scope tags', render: renderScopeTagsStep, collect: collectScopeTags },
      { name: 'Assignments', render: renderAssignmentsStep, collect: collectAssignments },
      { name: 'Review + create', render: (data) => Wizard.renderReview(data, { name: 'Name', description: 'Description', platform: 'Platform', osMinVersion: 'Minimum OS version', requireEncryption: 'Require encryption', requireDefender: 'Require Defender', passwordRequired: 'Password required', scopeTags: 'Scope tags', assignedGroups: 'Assigned groups' }) },
    ],
    onComplete: (data) => {
      Store.create(Collections.COMPLIANCE_POLICIES, {
        id: generateId(), name: data.name, description: data.description, platform: data.platform,
        status: 'Active', settings: { osMinVersion: data.osMinVersion, requireEncryption: data.requireEncryption, requireDefender: data.requireDefender, passwordRequired: data.passwordRequired, passwordMinLength: data.passwordMinLength },
        actionsForNoncompliance: data.actionsForNoncompliance || [], assignedGroups: data.assignedGroups || [], scopeTags: data.scopeTags || ['Default'],
      });
      toast()?.success('Policy created', `"${data.name}" has been created.`);
      Store.addNotification({ type: 'success', title: 'Policy created', message: `Compliance policy "${data.name}" created and assigned.` });
      router.navigate('/devices/compliance-policies');
    },
    onCancel: () => router.navigate('/devices/compliance-policies'),
    completeLabel: 'Create',
  });
  wizard.render();
}

function renderComplianceBasics(data, body) {
  body.innerHTML = `
    <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Basics</h3>
    <div class="form-group"><label class="form-label required">Name</label><input class="form-input" id="cp-name" value="${data.name||''}" placeholder="e.g., Windows Corporate Compliance" maxlength="200"></div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-input form-textarea" id="cp-desc" placeholder="Optional description...">${data.description||''}</textarea></div>
    <div class="form-group"><label class="form-label required">Platform</label>
      <div class="platform-selector">
        ${['Windows 10 and later','iOS/iPadOS','Android Enterprise','Android (AOSP)','macOS','Linux'].map(p => `<div class="platform-card ${data.platform===p?'selected':''}" data-platform="${p}"><div class="platform-card__icon">${p.includes('Windows')?Icons.windows:p.includes('iOS')?Icons.apple:p.includes('Android')?Icons.android:p.includes('mac')?Icons.apple:Icons.devices}</div><div class="platform-card__name">${p}</div></div>`).join('')}
      </div>
    </div>
  `;
  body.querySelectorAll('.platform-card').forEach(card => {
    card.addEventListener('click', () => {
      body.querySelectorAll('.platform-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });
}
function collectComplianceBasics(data) {
  data.name = document.getElementById('cp-name')?.value?.trim() || '';
  data.description = document.getElementById('cp-desc')?.value?.trim() || '';
  const sel = document.querySelector('.platform-card.selected');
  data.platform = sel?.dataset?.platform || '';
}

function renderComplianceSettings(data, body) {
  body.innerHTML = `
    <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Compliance settings</h3>
    <p style="color:var(--color-text-secondary);margin-bottom:16px;">Configure the compliance requirements for <strong>${data.platform || 'this platform'}</strong>.</p>
    <div class="content-card">
      <h4 style="font-weight:600;margin-bottom:12px;">Device health</h4>
      <div class="form-group"><label class="form-label">Minimum OS version</label><input class="form-input" id="cs-osmin" value="${data.osMinVersion||''}" placeholder="e.g., 10.0.22621" style="max-width:240px;"></div>
    </div>
    <div class="content-card">
      <h4 style="font-weight:600;margin-bottom:12px;">Device security</h4>
      <div class="form-group"><div class="toggle ${data.requireEncryption!==false?'on':''}" id="cs-encrypt"><div class="toggle__track"><div class="toggle__thumb"></div></div><span class="toggle__label">Require device encryption</span></div></div>
      <div class="form-group"><div class="toggle ${data.requireDefender!==false?'on':''}" id="cs-defender"><div class="toggle__track"><div class="toggle__thumb"></div></div><span class="toggle__label">Require Microsoft Defender Antimalware</span></div></div>
      <div class="form-group"><div class="toggle ${data.requireFirewall!==false?'on':''}" id="cs-firewall"><div class="toggle__track"><div class="toggle__thumb"></div></div><span class="toggle__label">Require firewall</span></div></div>
    </div>
    <div class="content-card">
      <h4 style="font-weight:600;margin-bottom:12px;">System security</h4>
      <div class="form-group"><div class="toggle ${data.passwordRequired?'on':''}" id="cs-password"><div class="toggle__track"><div class="toggle__thumb"></div></div><span class="toggle__label">Require a password</span></div></div>
      <div class="form-group"><label class="form-label">Minimum password length</label><input class="form-input" type="number" id="cs-pwlen" value="${data.passwordMinLength||6}" min="4" max="16" style="max-width:100px;"></div>
    </div>
  `;
  body.querySelectorAll('.toggle').forEach(t => t.addEventListener('click', () => t.classList.toggle('on')));
}
function collectComplianceSettings(data) {
  data.osMinVersion = document.getElementById('cs-osmin')?.value || '';
  data.requireEncryption = document.getElementById('cs-encrypt')?.classList.contains('on') || false;
  data.requireDefender = document.getElementById('cs-defender')?.classList.contains('on') || false;
  data.requireFirewall = document.getElementById('cs-firewall')?.classList.contains('on') || false;
  data.passwordRequired = document.getElementById('cs-password')?.classList.contains('on') || false;
  data.passwordMinLength = parseInt(document.getElementById('cs-pwlen')?.value) || 6;
}

function renderComplianceActions(data, body) {
  if (!data.actionsForNoncompliance) data.actionsForNoncompliance = [{ action: 'Mark device noncompliant', schedule: 'Immediately' }];
  body.innerHTML = `
    <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Actions for noncompliance</h3>
    <p style="color:var(--color-text-secondary);margin-bottom:16px;">Specify what happens when devices don't meet compliance requirements.</p>
    <div id="actions-list" style="display:flex;flex-direction:column;gap:12px;"></div>
    <button class="btn btn-default" id="add-action" style="margin-top:12px;">${Icons.add} Add action</button>
  `;
  const listEl = document.getElementById('actions-list');
  const renderActions = () => {
    listEl.innerHTML = '';
    data.actionsForNoncompliance.forEach((a, i) => {
      const row = createElement('div', { style: 'display:flex;gap:8px;align-items:center;padding:12px;border:1px solid var(--color-border);border-radius:8px;' });
      row.innerHTML = `
        <select class="form-input form-select" style="flex:1;" data-idx="${i}" data-field="action">
          <option ${a.action==='Mark device noncompliant'?'selected':''}>Mark device noncompliant</option>
          <option ${a.action==='Send email to end user'?'selected':''}>Send email to end user</option>
          <option ${a.action==='Send push notification'?'selected':''}>Send push notification</option>
          <option ${a.action==='Retire device'?'selected':''}>Retire device</option>
        </select>
        <select class="form-input form-select" style="width:180px;" data-idx="${i}" data-field="schedule">
          <option ${a.schedule==='Immediately'?'selected':''}>Immediately</option>
          <option ${a.schedule==='1 day after'?'selected':''}>1 day after</option>
          <option ${a.schedule==='3 days after'||a.schedule==='3 days after (grace period)'?'selected':''}>3 days after (grace period)</option>
          <option ${a.schedule==='7 days after'?'selected':''}>7 days after</option>
          <option ${a.schedule==='30 days after'?'selected':''}>30 days after</option>
          <option ${a.schedule==='90 days after'?'selected':''}>90 days after</option>
        </select>
        <button class="btn-icon" data-remove="${i}" title="Remove">${Icons.delete}</button>
      `;
      row.querySelector(`[data-remove="${i}"]`).addEventListener('click', () => { data.actionsForNoncompliance.splice(i, 1); renderActions(); });
      listEl.appendChild(row);
    });
  };
  renderActions();
  document.getElementById('add-action')?.addEventListener('click', () => { data.actionsForNoncompliance.push({ action: 'Send email to end user', schedule: '1 day after' }); renderActions(); });
}
function collectComplianceActions(data) {
  const rows = document.querySelectorAll('#actions-list > div');
  data.actionsForNoncompliance = Array.from(rows).map((row) => ({
    action: row.querySelector('[data-field="action"]')?.value || '',
    schedule: row.querySelector('[data-field="schedule"]')?.value || '',
  }));
}

/* ══════════════════════════════════════════════════
   CONFIGURATION PROFILES — List + Settings Catalog Wizard
   ══════════════════════════════════════════════════ */
export function renderConfigProfiles() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Create profile', icon: Icons.add, onClick: createConfigProfile, type: 'primary' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderConfigProfiles, type: 'default' },
  ]);

  const profiles = Store.getAll(Collections.CONFIG_PROFILES);
  el.innerHTML = `
    <h1 class="page-title">Configuration profiles</h1>
    <div class="info-banner info-banner--info" style="margin-bottom:16px;">
      <span class="info-banner__icon" style="color:var(--color-info)">${Icons.info}</span>
      <span>Use <strong>Settings catalog</strong> profiles for the latest, recommended experience. Legacy templates are deprecated.</span>
    </div>
    <div class="grid-toolbar"><div class="grid-toolbar__search"><span style="display:flex">${Icons.search}</span><input type="text" placeholder="Search profiles..." id="cfg-search"></div><span style="font-size:12px;color:var(--color-text-secondary);margin-left:auto;">${profiles.length} profile${profiles.length!==1?'s':''}</span></div>
    <div class="data-grid-wrapper"><table class="data-grid"><thead><tr><th>Name</th><th>Platform</th><th>Profile type</th><th>Status</th><th>Assigned to</th><th></th></tr></thead><tbody id="cfg-tbody"></tbody></table></div>
  `;
  renderConfigProfileRows(profiles);
  document.getElementById('cfg-search')?.addEventListener('input', (e) => {
    renderConfigProfileRows(profiles.filter(p => p.name.toLowerCase().includes(e.target.value.toLowerCase())));
  });
}

function renderConfigProfileRows(profiles) {
  const tbody = document.getElementById('cfg-tbody');
  if (!tbody) return;
  if (profiles.length === 0) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--color-text-secondary);">No configuration profiles</td></tr>'; return; }
  tbody.innerHTML = '';
  for (const p of profiles) {
    const tr = createElement('tr');
    tr.innerHTML = `<td><span class="cell-link">${escapeHtml(p.name)}</span></td><td>${p.platform}</td><td>${p.profileType||'—'}</td><td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>${p.status}</span></td><td>${(p.assignedGroups||[]).join(', ')}</td>
      <td><button class="btn-icon btn-delete" data-id="${p.id}" title="Delete">${Icons.delete}</button></td>`;
    tr.querySelector('.btn-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Delete profile "${p.name}"?`)) { Store.delete(Collections.CONFIG_PROFILES, p.id); toast()?.success('Deleted', `"${p.name}" deleted.`); renderConfigProfiles(); }
    });
    tbody.appendChild(tr);
  }
}

// Settings catalog data
const SETTINGS_CATALOG = [
  { category: 'Microsoft Defender Antivirus', settings: [
    { name: 'Real-time protection', type: 'toggle', default: true },
    { name: 'Cloud-delivered protection', type: 'toggle', default: true },
    { name: 'Sample submission consent', type: 'select', options: ['Send safe samples automatically', 'Always prompt', 'Never send', 'Send all samples automatically'], default: 'Send safe samples automatically' },
    { name: 'Scan schedule day', type: 'select', options: ['Every day', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], default: 'Sunday' },
  ]},
  { category: 'BitLocker', settings: [
    { name: 'Require device encryption', type: 'toggle', default: true },
    { name: 'Encryption method for OS drives', type: 'select', options: ['XTS-AES 128-bit', 'XTS-AES 256-bit', 'AES-CBC 128-bit', 'AES-CBC 256-bit'], default: 'XTS-AES 256-bit' },
    { name: 'Startup authentication', type: 'select', options: ['TPM only', 'TPM + PIN', 'TPM + startup key', 'TPM + PIN + startup key'], default: 'TPM only' },
  ]},
  { category: 'Firewall', settings: [
    { name: 'Domain profile firewall', type: 'toggle', default: true },
    { name: 'Private profile firewall', type: 'toggle', default: true },
    { name: 'Public profile firewall', type: 'toggle', default: true },
    { name: 'Block inbound connections', type: 'toggle', default: true },
  ]},
  { category: 'Password', settings: [
    { name: 'Require password', type: 'toggle', default: true },
    { name: 'Minimum password length', type: 'number', min: 4, max: 16, default: 8 },
    { name: 'Maximum minutes of inactivity', type: 'number', min: 1, max: 60, default: 15 },
    { name: 'Password complexity', type: 'select', options: ['Digits only', 'Digits and lowercase', 'Digits, lowercase, uppercase', 'Digits, lowercase, uppercase, special'], default: 'Digits, lowercase, uppercase' },
  ]},
  { category: 'Device restrictions', settings: [
    { name: 'Block camera', type: 'toggle', default: false },
    { name: 'Block screenshots', type: 'toggle', default: false },
    { name: 'Block USB storage', type: 'toggle', default: false },
    { name: 'Block Bluetooth', type: 'toggle', default: false },
  ]},
  { category: 'Wi-Fi', settings: [
    { name: 'Wi-Fi type', type: 'select', options: ['Basic', 'Enterprise'], default: 'Basic' },
    { name: 'Network name (SSID)', type: 'text', default: '' },
    { name: 'Connect automatically', type: 'toggle', default: true },
  ]},
  { category: 'User Rights', settings: [
    { name: 'Deny log on locally', type: 'text', default: 'Guests' },
    { name: 'Allow log on through Remote Desktop', type: 'text', default: 'Administrators, Remote Desktop Users' },
  ]},
];

function createConfigProfile() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.clearActions();

  const wizard = new Wizard(el, {
    steps: [
      { name: 'Basics', render: renderConfigBasics, collect: collectConfigBasics },
      { name: 'Settings', render: renderSettingsCatalog, collect: collectSettingsCatalog },
      { name: 'Scope tags', render: renderScopeTagsStep, collect: collectScopeTags },
      { name: 'Assignments', render: renderAssignmentsStep, collect: collectAssignments },
      { name: 'Review + create', render: (data) => Wizard.renderReview(data, { name: 'Name', platform: 'Platform', profileType: 'Profile type', selectedSettingsCount: 'Settings configured', scopeTags: 'Scope tags', assignedGroups: 'Assigned groups' }) },
    ],
    onComplete: (data) => {
      Store.create(Collections.CONFIG_PROFILES, {
        id: generateId(), name: data.name, description: data.description, platform: data.platform,
        profileType: data.profileType || 'Settings catalog', status: 'Active',
        settings: data.selectedSettings || [], assignedGroups: data.assignedGroups || [], scopeTags: data.scopeTags || ['Default'],
      });
      toast()?.success('Profile created', `"${data.name}" has been created.`);
      Store.addNotification({ type: 'success', title: 'Profile created', message: `Configuration profile "${data.name}" created.` });
      router.navigate('/devices/configuration-profiles');
    },
    onCancel: () => router.navigate('/devices/configuration-profiles'),
  });
  wizard.render();
}

function renderConfigBasics(data, body) {
  body.innerHTML = `
    <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Basics</h3>
    <div class="form-group"><label class="form-label required">Name</label><input class="form-input" id="cfg-name" value="${data.name||''}" placeholder="e.g., Windows Security Baseline"></div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-input form-textarea" id="cfg-desc">${data.description||''}</textarea></div>
    <div class="form-group"><label class="form-label required">Platform</label>
      <div class="platform-selector">${['Windows 10 and later','iOS/iPadOS','Android Enterprise','macOS','Linux'].map(p=>`<div class="platform-card ${data.platform===p?'selected':''}" data-platform="${p}"><div class="platform-card__icon">${p.includes('Windows')?Icons.windows:p.includes('mac')||p.includes('iOS')?Icons.apple:p.includes('Android')?Icons.android:Icons.devices}</div><div class="platform-card__name">${p}</div></div>`).join('')}</div></div>
    <div class="form-group"><label class="form-label required">Profile type</label>
      <select class="form-input form-select" id="cfg-type" style="max-width:300px;"><option selected>Settings catalog</option><option>Templates</option><option>ADMX import</option></select></div>
    <div class="form-group"><label class="form-label">Device type (optional)</label>
      <select class="form-input form-select" id="cfg-device-type" style="max-width:300px;"><option value="">Standard</option><option>Teams Rooms</option><option>HoloLens 2</option><option>Zebra devices</option></select></div>
  `;
  body.querySelectorAll('.platform-card').forEach(card => card.addEventListener('click', () => { body.querySelectorAll('.platform-card').forEach(c=>c.classList.remove('selected')); card.classList.add('selected'); }));
}
function collectConfigBasics(data) {
  data.name = document.getElementById('cfg-name')?.value?.trim() || '';
  data.description = document.getElementById('cfg-desc')?.value?.trim() || '';
  data.platform = document.querySelector('.platform-card.selected')?.dataset?.platform || '';
  data.profileType = document.getElementById('cfg-type')?.value || 'Settings catalog';
  data.deviceType = document.getElementById('cfg-device-type')?.value || '';
}

function renderSettingsCatalog(data, body) {
  if (!data.selectedSettings) data.selectedSettings = [];

  body.innerHTML = `
    <h3 style="font-size:16px;font-weight:600;margin-bottom:8px;">Settings catalog</h3>
    <p style="color:var(--color-text-secondary);margin-bottom:16px;">Search and configure settings for this profile. This mirrors the Settings catalog experience in Intune.</p>
    <div class="grid-toolbar__search" style="margin-bottom:16px;">
      <span style="display:flex">${Icons.search}</span>
      <input type="text" placeholder="Search settings..." id="settings-search" aria-label="Search settings">
    </div>
    <div id="settings-catalog-list" style="display:flex;flex-direction:column;gap:12px;"></div>
    <div style="margin-top:16px;padding:12px;background:var(--color-primary-lighter);border-radius:8px;font-size:13px;">
      <strong>${data.selectedSettings.length}</strong> setting(s) configured
    </div>
  `;

  const listEl = document.getElementById('settings-catalog-list');
  const renderCatalog = (filter = '') => {
    listEl.innerHTML = '';
    for (const cat of SETTINGS_CATALOG) {
      const filteredSettings = cat.settings.filter(s => !filter || s.name.toLowerCase().includes(filter) || cat.category.toLowerCase().includes(filter));
      if (filteredSettings.length === 0) continue;

      const catEl = createElement('div', { className: 'content-card', style: 'padding:16px;' });
      catEl.innerHTML = `<h4 style="font-weight:600;margin-bottom:12px;color:var(--color-primary);">${cat.category}</h4>`;
      for (const s of filteredSettings) {
        const existing = data.selectedSettings.find(ss => ss.name === s.name && ss.category === cat.category);
        const enabled = !!existing;
        const settingDiv = createElement('div', { style: 'display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--color-border-subtle);' });
        let controlHtml = '';
        if (s.type === 'toggle') {
          const isOn = existing ? existing.value === 'Enabled' || existing.value === true : s.default;
          controlHtml = `<div class="toggle ${isOn?'on':''} setting-toggle" data-name="${s.name}" data-cat="${cat.category}" style="flex-shrink:0;"><div class="toggle__track"><div class="toggle__thumb"></div></div></div>`;
        } else if (s.type === 'select') {
          controlHtml = `<select class="form-input form-select setting-select" data-name="${s.name}" data-cat="${cat.category}" style="width:200px;flex-shrink:0;">${s.options.map(o=>`<option ${(existing?.value||s.default)===o?'selected':''}>${o}</option>`).join('')}</select>`;
        } else if (s.type === 'number') {
          controlHtml = `<input type="number" class="form-input setting-number" data-name="${s.name}" data-cat="${cat.category}" value="${existing?.value||s.default}" min="${s.min||0}" max="${s.max||999}" style="width:80px;flex-shrink:0;">`;
        } else {
          controlHtml = `<input type="text" class="form-input setting-text" data-name="${s.name}" data-cat="${cat.category}" value="${existing?.value||s.default||''}" style="width:200px;flex-shrink:0;">`;
        }

        settingDiv.innerHTML = `
          <div class="checkbox ${enabled?'checked':''}" data-name="${s.name}" data-cat="${cat.category}" style="flex-shrink:0;"><div class="checkbox__box"><svg viewBox="0 0 12 12"><path d="M9.78 3.22a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0L2.22 6.28a.75.75 0 011.06-1.06L5 6.94l3.72-3.72a.75.75 0 011.06 0z"/></svg></div></div>
          <span style="flex:1;font-size:14px;">${s.name}</span>
          ${controlHtml}
        `;
        catEl.appendChild(settingDiv);
      }
      listEl.appendChild(catEl);
    }

    // Event handlers
    listEl.querySelectorAll('.checkbox').forEach(cb => cb.addEventListener('click', () => cb.classList.toggle('checked')));
    listEl.querySelectorAll('.toggle').forEach(t => t.addEventListener('click', () => t.classList.toggle('on')));
  };

  renderCatalog();
  document.getElementById('settings-search')?.addEventListener('input', (e) => renderCatalog(e.target.value.toLowerCase()));
}

function collectSettingsCatalog(data) {
  const catalog = document.getElementById('settings-catalog-list');
  if (!catalog) return;
  data.selectedSettings = [];
  catalog.querySelectorAll('.checkbox.checked').forEach(cb => {
    const name = cb.dataset.name;
    const cat = cb.dataset.cat;
    const row = cb.parentElement;
    let value = '';
    const toggle = row.querySelector('.setting-toggle');
    const select = row.querySelector('.setting-select');
    const number = row.querySelector('.setting-number');
    const text = row.querySelector('.setting-text');
    if (toggle) value = toggle.classList.contains('on') ? 'Enabled' : 'Disabled';
    else if (select) value = select.value;
    else if (number) value = number.value;
    else if (text) value = text.value;
    data.selectedSettings.push({ category: cat, name, value });
  });
  data.selectedSettingsCount = data.selectedSettings.length;
}

/* ══════════════════════════════════════════════════
   SCRIPTS AND REMEDIATIONS
   ══════════════════════════════════════════════════ */
export function renderScripts() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Add script', icon: Icons.add, onClick: createScript, type: 'primary' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderScripts, type: 'default' },
  ]);

  const scripts = Store.getAll(Collections.SCRIPTS);
  el.innerHTML = `
    <h1 class="page-title">Scripts and remediations</h1>
    <div class="tab-bar"><button class="tab-item active" data-tab="scripts">Platform scripts</button><button class="tab-item" data-tab="remediations">Remediations</button></div>
    <div id="scripts-content"></div>
  `;
  const renderTab = (tab) => {
    el.querySelectorAll('.tab-item').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    const filtered = scripts.filter(s => tab === 'remediations' ? s.type === 'Remediation' : s.type !== 'Remediation');
    const content = document.getElementById('scripts-content');
    if (filtered.length === 0) { content.innerHTML = `<div class="empty-state"><div class="empty-state__icon">${Icons.script}</div><div class="empty-state__title">No ${tab}</div><div class="empty-state__description">Click "+ Add script" to create one.</div></div>`; return; }
    let html = '';
    for (const s of filtered) {
      html += `<div class="content-card" style="cursor:pointer;" data-script-id="${s.id}">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div><h3 style="font-size:14px;font-weight:600;">${escapeHtml(s.name)}</h3><p style="font-size:12px;color:var(--color-text-secondary);margin-top:4px;">${s.platform} · ${s.type} · Assigned to: ${(s.assignedGroups||[]).join(', ')}</p></div>
          <div style="display:flex;gap:8px;align-items:center;">
            <span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>${s.status}</span>
            <button class="btn-icon btn-delete" data-id="${s.id}">${Icons.delete}</button>
          </div>
        </div>
        ${s.runHistory ? `<div style="margin-top:12px;"><h4 style="font-size:12px;font-weight:600;margin-bottom:8px;">Run history</h4><table class="data-grid" style="font-size:12px;"><thead><tr><th>Device</th><th>Status</th><th>Last run</th>${s.type==='Remediation'?'':''}</tr></thead><tbody>${s.runHistory.map(r=>`<tr><td>${r.device}</td><td><span class="status-pill status-pill--${r.status.includes('Success')||r.status.includes('Remediated')?'compliant':r.status.includes('Failed')?'noncompliant':'not-evaluated'}"><span class="status-pill__dot"></span>${r.status}</span></td><td>${formatDate(r.lastRun)}</td></tr>`).join('')}</tbody></table></div>` : ''}
      </div>`;
    }
    content.innerHTML = html;
    content.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Delete this script?')) { Store.delete(Collections.SCRIPTS, btn.dataset.id); toast()?.success('Deleted', 'Script deleted.'); renderScripts(); }
      });
    });
  };
  el.querySelectorAll('.tab-item').forEach(t => t.addEventListener('click', () => renderTab(t.dataset.tab)));
  renderTab('scripts');
}

function createScript() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.clearActions();

  const wizard = new Wizard(el, {
    steps: [
      { name: 'Basics', render: (data, body) => {
        body.innerHTML = `<h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Script details</h3>
          <div class="form-group"><label class="form-label required">Script name</label><input class="form-input" id="scr-name" value="${data.name||''}" placeholder="e.g., Set Timezone Script"></div>
          <div class="form-group"><label class="form-label">Description</label><textarea class="form-input form-textarea" id="scr-desc">${data.description||''}</textarea></div>
          <div class="form-group"><label class="form-label">Type</label><select class="form-input form-select" id="scr-type" style="max-width:200px;"><option>PowerShell</option><option>Remediation</option></select></div>
          <div class="form-group"><label class="form-label">Run as</label><select class="form-input form-select" id="scr-runas" style="max-width:200px;"><option>System</option><option>User</option></select></div>
          <div class="form-group"><div class="toggle" id="scr-64bit"><div class="toggle__track"><div class="toggle__thumb"></div></div><span class="toggle__label">Run in 64-bit host</span></div></div>`;
        document.getElementById('scr-64bit')?.addEventListener('click', function() { this.classList.toggle('on'); });
      }, collect: (data) => {
        data.name = document.getElementById('scr-name')?.value?.trim() || '';
        data.description = document.getElementById('scr-desc')?.value?.trim() || '';
        data.scriptType = document.getElementById('scr-type')?.value || 'PowerShell';
        data.runAsAccount = document.getElementById('scr-runas')?.value || 'System';
        data.runIn64BitHost = document.getElementById('scr-64bit')?.classList.contains('on') || false;
      }},
      { name: 'Script', render: (data, body) => {
        body.innerHTML = `<h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Script content</h3>
          <div class="form-group"><label class="form-label required">${data.scriptType==='Remediation'?'Detection script':'Script content'}</label>
          <textarea class="form-input form-textarea" id="scr-content" style="font-family:var(--font-family-mono);min-height:200px;" placeholder="# Enter your PowerShell script here...">${data.scriptContent||''}</textarea></div>
          ${data.scriptType==='Remediation'?`<div class="form-group"><label class="form-label">Remediation script</label><textarea class="form-input form-textarea" id="scr-remediation" style="font-family:var(--font-family-mono);min-height:150px;" placeholder="# Enter remediation script...">${data.remediationScript||''}</textarea></div>`:''}`;
      }, collect: (data) => {
        data.scriptContent = document.getElementById('scr-content')?.value || '';
        data.remediationScript = document.getElementById('scr-remediation')?.value || '';
      }},
      { name: 'Scope tags', render: renderScopeTagsStep, collect: collectScopeTags },
      { name: 'Assignments', render: renderAssignmentsStep, collect: collectAssignments },
      { name: 'Review', render: (data) => Wizard.renderReview(data, { name: 'Name', scriptType: 'Type', runAsAccount: 'Run as', assignedGroups: 'Assigned groups' }) },
    ],
    onComplete: (data) => {
      Store.create(Collections.SCRIPTS, {
        id: generateId(), name: data.name, platform: 'Windows', type: data.scriptType,
        status: 'Active', scriptContent: data.scriptContent, remediationScript: data.remediationScript,
        runAsAccount: data.runAsAccount, runIn64BitHost: data.runIn64BitHost,
        assignedGroups: data.assignedGroups || [], runHistory: [],
      });
      toast()?.success('Script created', `"${data.name}" has been created.`);
      router.navigate('/devices/scripts');
    },
    onCancel: () => router.navigate('/devices/scripts'),
  });
  wizard.render();
}
