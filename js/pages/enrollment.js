/* ============================================================
   Enrollment Page Module
   Overview, Windows Autopilot, ESP, Restrictions, Android
   ============================================================ */

import { Icons, createElement, clearElement, $, generateId, formatDate, escapeHtml } from '../utils.js';
import { Store, Collections } from '../store.js';
import { router } from '../router.js';
import { Wizard, renderScopeTagsStep, collectScopeTags, renderAssignmentsStep, collectAssignments } from '../components/wizard.js';
import { DonutChart } from '../components/charts.js';

function getContentEl() { return $('#page-content'); }
function getCommandBar() { return window.IntuneApp?.commandBar; }
function toast() { return window.IntuneApp?.toastManager; }

/* ══════════════════════════════════════════════════
   ENROLLMENT OVERVIEW
   ══════════════════════════════════════════════════ */
export function renderEnrollmentOverview() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([{ label: 'Refresh', icon: Icons.refresh, onClick: renderEnrollmentOverview, type: 'default' }]);

  const devices = Store.getAll(Collections.DEVICES);
  const espConfigs = Store.getAll(Collections.ESP_CONFIGS);
  const autopilot = Store.getAll(Collections.AUTOPILOT_PROFILES);

  // Group devices by join type
  const joinStats = Store.getStats(Collections.DEVICES, 'joinType');

  el.innerHTML = `
    <h1 class="page-title">Device enrollment</h1>
    <div class="tile-grid">
      <div class="tile" id="t-autopilot"><div class="tile__header"><span class="tile__title">Autopilot profiles</span></div><div class="tile__value" style="color:var(--color-primary)">${autopilot.length}</div><div class="tile__label">Deployment profiles configured</div></div>
      <div class="tile" id="t-esp"><div class="tile__header"><span class="tile__title">ESP profiles</span></div><div class="tile__value" style="color:var(--color-primary)">${espConfigs.length}</div><div class="tile__label">Enrollment Status Pages</div></div>
      <div class="tile"><div class="tile__header"><span class="tile__title">Apple push cert</span></div><div class="tile__value" style="color:var(--color-success)">Valid</div><div class="tile__label">Expires in 180 days</div></div>
      <div class="tile"><div class="tile__header"><span class="tile__title">Android Enterprise</span></div><div class="tile__value" style="color:var(--color-success)">Linked</div><div class="tile__label">Managed Google Play</div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
      <div class="content-card">
        <div class="content-card__header"><h2 class="content-card__title">Enrollment by join type</h2></div>
        <div style="display:flex;gap:24px;align-items:flex-start;">
          <canvas id="enroll-donut" style="max-width:180px;"></canvas>
          <div id="enroll-donut-legend" class="chart-legend" style="min-width:160px;"></div>
        </div>
      </div>
      <div class="content-card">
        <div class="content-card__header"><h2 class="content-card__title">Quick tasks</h2></div>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:12px;">
          <li><a href="#/devices/enrollment/autopilot" style="color:var(--color-primary);text-decoration:none;display:flex;align-items:center;gap:8px;"><span style="color:var(--color-primary)">${Icons.windows}</span> Configure Windows Autopilot</a></li>
          <li><a href="#/devices/enrollment/android" style="color:var(--color-primary);text-decoration:none;display:flex;align-items:center;gap:8px;"><span style="color:var(--color-primary)">${Icons.android}</span> Manage Android enrollment</a></li>
          <li><a href="#/devices/enrollment/restrictions" style="color:var(--color-primary);text-decoration:none;display:flex;align-items:center;gap:8px;"><span style="color:var(--color-primary)">${Icons.settings}</span> Set enrollment restrictions</a></li>
        </ul>
      </div>
    </div>
  `;

  document.getElementById('t-autopilot')?.addEventListener('click', () => router.navigate('/devices/enrollment/autopilot'));
  document.getElementById('t-esp')?.addEventListener('click', () => router.navigate('/devices/enrollment/esp'));

  // Donut chart
  const segments = [
    { label: 'Entra-joined', value: joinStats['Entra-joined']||0, color: '#0078D4' },
    { label: 'Hybrid Entra-joined', value: joinStats['Hybrid Entra-joined']||0, color: '#004578' },
    { label: 'Entra-registered', value: joinStats['Entra-registered']||0, color: '#2899F5' },
  ];
  new DonutChart(document.getElementById('enroll-donut'), { width: 180, height: 180, outerRadius: 80, innerRadius: 50, segments, centerText: String(devices.length) }).draw();
  DonutChart.renderLegend(document.getElementById('enroll-donut-legend'), segments);
}

/* ══════════════════════════════════════════════════
   WINDOWS AUTOPILOT
   ══════════════════════════════════════════════════ */
let currentAutopilotTab = 'profiles';
let selectedAutopilotDeviceIds = new Set();

export function renderAutopilot(activeTab = currentAutopilotTab) {
  currentAutopilotTab = activeTab;
  const el = getContentEl(); clearElement(el);
  const cb = getCommandBar();

  if (currentAutopilotTab === 'devices') {
    cb?.setActions([
      { label: 'Import', icon: Icons.add, onClick: openAutopilotImportModal, type: 'primary' },
      { label: 'Sync', icon: Icons.sync, onClick: syncAutopilotDevices, type: 'default' },
      { label: 'Assign profile', icon: null, onClick: openAssignProfileModal, type: 'default' },
      { label: 'Export', icon: Icons.download, onClick: exportAutopilotDevices, type: 'default' },
      { label: 'Refresh', icon: Icons.refresh, onClick: () => renderAutopilot('devices'), type: 'default' },
    ]);
  } else {
    cb?.setActions([
      { label: 'Create profile', icon: Icons.add, onClick: createAutopilotProfile, type: 'primary' },
      { label: 'Export', icon: Icons.download, onClick: exportAutopilotProfiles, type: 'default' },
      { label: 'Refresh', icon: Icons.refresh, onClick: () => renderAutopilot('profiles'), type: 'default' },
    ]);
  }

  el.innerHTML = `
    <h1 class="page-title">Windows Autopilot</h1>
    <p class="page-subtitle">Configure deployment profiles and manage registered Autopilot devices.</p>

    <!-- Tab bar matching Intune Autopilot -->
    <div class="tab-bar" style="margin-bottom:16px;">
      <button class="tab-item ${currentAutopilotTab==='profiles'?'active':''}" id="ap-tab-profiles">Deployment profiles</button>
      <button class="tab-item ${currentAutopilotTab==='devices'?'active':''}" id="ap-tab-devices">Devices</button>
    </div>

    <div id="ap-tab-content"></div>
  `;

  document.getElementById('ap-tab-profiles')?.addEventListener('click', () => renderAutopilot('profiles'));
  document.getElementById('ap-tab-devices')?.addEventListener('click', () => renderAutopilot('devices'));

  const container = document.getElementById('ap-tab-content');
  if (currentAutopilotTab === 'devices') {
    renderAutopilotDevicesTab(container);
  } else {
    renderAutopilotProfilesTab(container);
  }
}

function renderAutopilotProfilesTab(container) {
  const profiles = Store.getAll(Collections.AUTOPILOT_PROFILES);
  container.innerHTML = `
    <div class="info-banner info-banner--info" style="margin-bottom:16px;">
      <span class="info-banner__icon" style="color:var(--color-info)">${Icons.info}</span>
      <span><strong>Windows Autopilot device preparation (v2)</strong> is now available. This new architecture provides faster provisioning and eliminates the need for hardware hashes.</span>
    </div>
    <div class="grid-toolbar">
      <div class="grid-toolbar__search"><span style="display:flex">${Icons.search}</span><input type="text" placeholder="Search deployment profiles..." id="ap-search"></div>
      <span style="font-size:12px;color:var(--color-text-secondary);margin-left:auto;">${profiles.length} profile${profiles.length!==1?'s':''}</span>
    </div>
    <div class="data-grid-wrapper">
      <table class="data-grid">
        <thead>
          <tr>
            <th>Profile name</th>
            <th>Deployment mode</th>
            <th>Join type</th>
            <th>Type</th>
            <th>Hardware hash requirement</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="ap-tbody"></tbody>
      </table>
    </div>
  `;

  const renderRows = (list) => {
    const tbody = document.getElementById('ap-tbody');
    if (!tbody) return;
    if (list.length === 0) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--color-text-secondary);">No profiles found</td></tr>'; return; }
    tbody.innerHTML = '';
    for (const p of list) {
      const tr = createElement('tr');
      tr.innerHTML = `
        <td><span class="cell-link">${escapeHtml(p.name)}</span></td>
        <td>${p.deploymentMode}</td>
        <td><span class="tag">${p.joinType}</span></td>
        <td>${p.type}</td>
        <td>${p.requiresHardwareHash?'Required':'Not required'}</td>
        <td><button class="btn-icon btn-delete" data-id="${p.id}" title="Delete profile">${Icons.delete}</button></td>
      `;
      tr.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete Autopilot profile "${p.name}"?`)) {
          Store.delete(Collections.AUTOPILOT_PROFILES, p.id);
          toast()?.success('Deleted', `Profile deleted.`);
          renderAutopilot('profiles');
        }
      });
      tbody.appendChild(tr);
    }
  };
  renderRows(profiles);
  document.getElementById('ap-search')?.addEventListener('input', (e) => renderRows(profiles.filter(p => p.name.toLowerCase().includes(e.target.value.toLowerCase()))));
}

function renderAutopilotDevicesTab(container) {
  const devices = Store.getAll(Collections.AUTOPILOT_DEVICES);
  container.innerHTML = `
    <div class="info-banner info-banner--info" style="margin-bottom:16px;">
      <span class="info-banner__icon" style="color:var(--color-info)">${Icons.info}</span>
      <span>Sync with the Windows Autopilot service can take up to 15 minutes. Click <strong>Sync</strong> above to synchronize newly imported devices or status updates.</span>
    </div>
    <div class="grid-toolbar">
      <div class="grid-toolbar__search"><span style="display:flex">${Icons.search}</span><input type="text" placeholder="Search by serial, product key, model, or user..." id="ap-dev-search"></div>
      <span style="font-size:12px;color:var(--color-text-secondary);margin-left:auto;">${devices.length} registered device${devices.length!==1?'s':''}</span>
    </div>
    <div class="data-grid-wrapper">
      <table class="data-grid">
        <thead>
          <tr>
            <th class="col-checkbox"><input type="checkbox" id="ap-dev-select-all"></th>
            <th>Device serial number</th>
            <th>Windows product ID</th>
            <th>Hardware model</th>
            <th>Assigned profile</th>
            <th>Profile status</th>
            <th>Associated user</th>
            <th>Group tag</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="ap-dev-tbody"></tbody>
      </table>
    </div>
  `;

  const renderDevRows = (list) => {
    const tbody = document.getElementById('ap-dev-tbody');
    if (!tbody) return;
    if (list.length === 0) { tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--color-text-secondary);">No Autopilot devices imported yet. Click "+ Import" to add devices.</td></tr>'; return; }
    tbody.innerHTML = '';
    for (const d of list) {
      const sel = selectedAutopilotDeviceIds.has(d.id);
      const tr = createElement('tr', { className: sel ? 'selected' : '' });
      tr.innerHTML = `
        <td class="col-checkbox"><input type="checkbox" class="ap-dev-cb" data-id="${d.id}" ${sel?'checked':''}></td>
        <td><strong>${escapeHtml(d.serialNumber)}</strong></td>
        <td style="font-family:monospace;font-size:12px;">${escapeHtml(d.productKey)}</td>
        <td>${escapeHtml(d.model)}</td>
        <td>${d.assignedProfile !== 'Unassigned' ? `<span class="tag">${escapeHtml(d.assignedProfile)}</span>` : '<span style="color:var(--color-text-secondary);">None</span>'}</td>
        <td><span class="status-pill status-pill--${d.profileStatus==='Assigned'?'compliant':'not-evaluated'}"><span class="status-pill__dot"></span>${d.profileStatus}</span></td>
        <td>${escapeHtml(d.associatedUser||'—')}</td>
        <td>${d.groupTag ? `<span class="tag">${escapeHtml(d.groupTag)}</span>` : '—'}</td>
        <td><button class="btn-icon btn-delete-ap-dev" data-id="${d.id}" title="Delete Autopilot device">${Icons.delete}</button></td>
      `;
      tr.querySelector('.ap-dev-cb')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (selectedAutopilotDeviceIds.has(d.id)) selectedAutopilotDeviceIds.delete(d.id);
        else selectedAutopilotDeviceIds.add(d.id);
        renderDevRows(list);
      });
      tr.querySelector('.btn-delete-ap-dev')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Remove device ${d.serialNumber} from Windows Autopilot?`)) {
          Store.delete(Collections.AUTOPILOT_DEVICES, d.id);
          selectedAutopilotDeviceIds.delete(d.id);
          toast()?.success('Deleted', `Autopilot device ${d.serialNumber} removed.`);
          renderAutopilot('devices');
        }
      });
      tbody.appendChild(tr);
    }
  };

  renderDevRows(devices);

  document.getElementById('ap-dev-select-all')?.addEventListener('click', (e) => {
    if (selectedAutopilotDeviceIds.size === devices.length) {
      selectedAutopilotDeviceIds.clear();
    } else {
      devices.forEach(d => selectedAutopilotDeviceIds.add(d.id));
    }
    renderDevRows(devices);
  });

  document.getElementById('ap-dev-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderDevRows(devices.filter(d =>
      d.serialNumber.toLowerCase().includes(q) ||
      d.productKey.toLowerCase().includes(q) ||
      d.model.toLowerCase().includes(q) ||
      (d.associatedUser||'').toLowerCase().includes(q) ||
      (d.groupTag||'').toLowerCase().includes(q)
    ));
  });
}

function openAutopilotImportModal() {
  const overlay = createElement('div', { className: 'blade-overlay visible', style: 'z-index:1500;display:flex;align-items:center;justify-content:center;' });
  const modal = createElement('div', { className: 'content-card', style: 'width:520px;max-width:92vw;padding:24px;box-shadow:var(--shadow-64);background:var(--color-bg-surface);' });
  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:1px solid var(--color-border);padding-bottom:10px;">
      <h3 style="font-size:16px;font-weight:600;margin:0;">Import Windows Autopilot devices</h3>
      <button class="blade-panel__close" id="modal-close" style="width:28px;height:28px;">${Icons.close}</button>
    </div>
    <p style="font-size:13px;color:var(--color-text-secondary);margin-bottom:16px;">
      Upload a CSV file containing device hardware hashes or enter device serial details:
    </p>
    <div class="form-group">
      <label class="form-label required">Device serial number</label>
      <input type="text" class="form-input" id="import-serial" placeholder="e.g., AP-DELL-99214">
    </div>
    <div class="form-group">
      <label class="form-label required">Windows product ID</label>
      <input type="text" class="form-input" id="import-pk" value="00329-00000-00003-AAOEM">
    </div>
    <div class="form-group">
      <label class="form-label">Hardware model</label>
      <input type="text" class="form-input" id="import-model" value="Dell Latitude 5540">
    </div>
    <div class="form-group">
      <label class="form-label">Group tag (optional)</label>
      <input type="text" class="form-input" id="import-gt" placeholder="e.g., Finance, Kiosk">
    </div>
    <div class="form-group">
      <label class="form-label">Assign Autopilot profile</label>
      <select class="form-input form-select" id="import-profile">
        <option value="Unassigned">Assign later</option>
        <option value="Corporate User-Driven Profile">Corporate User-Driven Profile</option>
        <option value="Kiosk Self-Deploying Profile">Kiosk Self-Deploying Profile</option>
        <option value="Device Prep - Standard Enrollment">Device Prep - Standard Enrollment</option>
      </select>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px;">
      <button class="btn btn-default" id="modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="modal-import-btn">Import device</button>
    </div>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  modal.querySelector('#modal-close')?.addEventListener('click', close);
  modal.querySelector('#modal-cancel')?.addEventListener('click', close);

  modal.querySelector('#modal-import-btn')?.addEventListener('click', () => {
    const serial = document.getElementById('import-serial')?.value?.trim();
    if (!serial) { alert('Please specify a device serial number'); return; }
    const pk = document.getElementById('import-pk')?.value?.trim() || '00329-00000-00003-AAOEM';
    const model = document.getElementById('import-model')?.value?.trim() || 'Generic PC';
    const gt = document.getElementById('import-gt')?.value?.trim() || '';
    const prof = document.getElementById('import-profile')?.value || 'Unassigned';

    Store.create(Collections.AUTOPILOT_DEVICES, {
      id: generateId(),
      serialNumber: serial,
      productKey: pk,
      model: model,
      manufacturer: model.includes('Dell') ? 'Dell Inc.' : 'Generic OEM',
      assignedProfile: prof,
      profileStatus: prof !== 'Unassigned' ? 'Assigned' : 'Not assigned',
      associatedUser: 'Unassigned',
      groupTag: gt,
      lastSynced: new Date().toISOString(),
    });

    close();
    toast()?.success('Device imported', `Autopilot device ${serial} successfully imported.`);
    renderAutopilot('devices');
  });
}

function syncAutopilotDevices() {
  toast()?.info('Autopilot sync initiated', 'Synchronizing device hardware hashes with Microsoft Windows Autopilot service...');
  setTimeout(() => {
    const list = Store.getAll(Collections.AUTOPILOT_DEVICES);
    for (const d of list) {
      Store.update(Collections.AUTOPILOT_DEVICES, d.id, { lastSynced: new Date().toISOString() });
    }
    toast()?.success('Sync complete', 'Windows Autopilot device sync finished.');
    renderAutopilot('devices');
  }, 1200);
}

function openAssignProfileModal() {
  if (selectedAutopilotDeviceIds.size === 0) {
    alert('Please select one or more devices to assign a deployment profile.');
    return;
  }
  const profiles = Store.getAll(Collections.AUTOPILOT_PROFILES);
  const overlay = createElement('div', { className: 'blade-overlay visible', style: 'z-index:1500;display:flex;align-items:center;justify-content:center;' });
  const modal = createElement('div', { className: 'content-card', style: 'width:440px;max-width:92vw;padding:24px;box-shadow:var(--shadow-64);background:var(--color-bg-surface);' });
  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:1px solid var(--color-border);padding-bottom:10px;">
      <h3 style="font-size:16px;font-weight:600;margin:0;">Assign Autopilot profile</h3>
      <button class="blade-panel__close" id="modal-close" style="width:28px;height:28px;">${Icons.close}</button>
    </div>
    <p style="font-size:13px;color:var(--color-text-secondary);margin-bottom:14px;">Assign profile to <strong>${selectedAutopilotDeviceIds.size} selected device(s)</strong>:</p>
    <div class="form-group">
      <label class="form-label required">Select deployment profile</label>
      <select class="form-input form-select" id="assign-profile-select">
        ${profiles.map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)} (${p.deploymentMode})</option>`).join('')}
      </select>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px;">
      <button class="btn btn-default" id="modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="modal-assign-confirm">Assign profile</button>
    </div>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  modal.querySelector('#modal-close')?.addEventListener('click', close);
  modal.querySelector('#modal-cancel')?.addEventListener('click', close);

  modal.querySelector('#modal-assign-confirm')?.addEventListener('click', () => {
    const profName = document.getElementById('assign-profile-select')?.value;
    for (const id of selectedAutopilotDeviceIds) {
      Store.update(Collections.AUTOPILOT_DEVICES, id, { assignedProfile: profName, profileStatus: 'Assigned' });
    }
    close();
    toast()?.success('Profile assigned', `Assigned "${profName}" to ${selectedAutopilotDeviceIds.size} device(s).`);
    renderAutopilot('devices');
  });
}

function exportAutopilotDevices() {
  const devices = Store.getAll(Collections.AUTOPILOT_DEVICES);
  const blob = new Blob([JSON.stringify(devices, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'autopilot-devices.json'; a.click();
  toast()?.success('Export complete', `${devices.length} Autopilot devices exported.`);
}

function exportAutopilotProfiles() {
  const profiles = Store.getAll(Collections.AUTOPILOT_PROFILES);
  const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'autopilot-profiles.json'; a.click();
  toast()?.success('Export complete', `${profiles.length} Autopilot profiles exported.`);
}

function createAutopilotProfile() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.clearActions();

  // Create wizard
  const wizard = new Wizard(el, {
    steps: [
      { name: 'Basics', render: (data, body) => {
        body.innerHTML = `
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Basics</h3>
          <div class="form-group"><label class="form-label required">Name</label><input class="form-input" id="ap-name" value="${data.name||''}"></div>
          <div class="form-group"><label class="form-label required">Profile type</label>
            <select class="form-input form-select" id="ap-type" style="max-width:300px;">
              <option value="Deployment profile (classic)">Windows Autopilot (classic)</option>
              <option value="Device preparation (v2)">Windows Autopilot device preparation (v2)</option>
            </select>
          </div>
        `;
      }, collect: (data) => {
        data.name = document.getElementById('ap-name')?.value?.trim() || '';
        data.type = document.getElementById('ap-type')?.value;
        data.requiresHardwareHash = data.type === 'Deployment profile (classic)';
      }},
      { name: 'OOBE / Settings', render: (data, body) => {
        if (data.type === 'Device preparation (v2)') {
          body.innerHTML = `
            <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Device preparation settings</h3>
            <div class="form-group"><label class="form-label">Deployment mode</label><select class="form-input form-select" id="ap-mode" style="max-width:300px;"><option>User-driven</option></select></div>
            <div class="form-group"><label class="form-label">Join type</label><select class="form-input form-select" id="ap-join" style="max-width:300px;"><option>Entra-joined</option></select></div>
            <div class="form-group"><label class="form-label">Device name template (optional)</label><input class="form-input" id="ap-template" placeholder="e.g., CORP-%SERIAL%"></div>
            <div class="form-group"><label class="form-label">Concurrent apps to track</label><input type="number" class="form-input" id="ap-apps" value="10" min="0" max="25" style="max-width:100px;"></div>
            <div class="form-group"><label class="form-label">Concurrent scripts to track</label><input type="number" class="form-input" id="ap-scripts" value="5" min="0" max="25" style="max-width:100px;"></div>
          `;
        } else {
          body.innerHTML = `
            <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Out-of-box experience (OOBE)</h3>
            <div class="form-group"><label class="form-label">Deployment mode</label><select class="form-input form-select" id="ap-mode" style="max-width:300px;"><option>User-driven</option><option>Self-deploying</option></select></div>
            <div class="form-group"><label class="form-label">Join to Microsoft Entra as</label><select class="form-input form-select" id="ap-join" style="max-width:300px;"><option>Entra-joined</option><option>Hybrid Entra-joined</option></select></div>
            <div class="form-group"><label class="form-label">Hide privacy settings</label><div class="toggle on" id="ap-privacy"><div class="toggle__track"><div class="toggle__thumb"></div></div></div></div>
            <div class="form-group"><label class="form-label">Hide change account options</label><div class="toggle on" id="ap-acct"><div class="toggle__track"><div class="toggle__thumb"></div></div></div></div>
            <div class="form-group"><label class="form-label">User account type</label><select class="form-input form-select" id="ap-usertype" style="max-width:300px;"><option>Standard</option><option>Administrator</option></select></div>
          `;
          body.querySelectorAll('.toggle').forEach(t => t.addEventListener('click', () => t.classList.toggle('on')));
        }
      }, collect: (data) => {
        data.deploymentMode = document.getElementById('ap-mode')?.value;
        data.joinType = document.getElementById('ap-join')?.value;
        if (data.type === 'Device preparation (v2)') {
          data.namingTemplate = document.getElementById('ap-template')?.value;
          data.appsToInstall = parseInt(document.getElementById('ap-apps')?.value) || 0;
          data.scriptsToRun = parseInt(document.getElementById('ap-scripts')?.value) || 0;
        } else {
          data.outOfBoxExperience = {
            hidePrivacy: document.getElementById('ap-privacy')?.classList.contains('on'),
            hideChangeAccount: document.getElementById('ap-acct')?.classList.contains('on'),
            userAccountType: document.getElementById('ap-usertype')?.value,
          };
        }
      }},
      { name: 'Scope tags', render: renderScopeTagsStep, collect: collectScopeTags },
      { name: 'Assignments', render: renderAssignmentsStep, collect: collectAssignments },
      { name: 'Review + create', render: (data) => Wizard.renderReview(data, { name: 'Name', type: 'Profile type', deploymentMode: 'Mode', joinType: 'Join type', assignedGroups: 'Assigned groups' }) },
    ],
    onComplete: (data) => {
      Store.create(Collections.AUTOPILOT_PROFILES, { id: generateId(), ...data });
      toast()?.success('Profile created', `Autopilot profile created.`);
      router.navigate('/devices/enrollment/autopilot');
    },
    onCancel: () => router.navigate('/devices/enrollment/autopilot')
  });
  wizard.render();
}

/* ══════════════════════════════════════════════════
   ESP (ENROLLMENT STATUS PAGE)
   ══════════════════════════════════════════════════ */
export function renderESP() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Create profile', icon: Icons.add, onClick: createESP, type: 'primary' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderESP, type: 'default' },
  ]);

  const configs = Store.getAll(Collections.ESP_CONFIGS);
  el.innerHTML = `
    <h1 class="page-title">Enrollment Status Page</h1>
    <p class="page-subtitle">Set up a page that shows installation progress during device enrollment.</p>
    <div class="data-grid-wrapper"><table class="data-grid"><thead><tr><th>Name</th><th>Status</th><th>Show progress</th><th>Block device</th><th>Assigned to</th><th></th></tr></thead><tbody id="esp-tbody"></tbody></table></div>
  `;

  const tbody = document.getElementById('esp-tbody');
  if (configs.length === 0 && tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;">No ESP configurations</td></tr>';
  for (const c of configs) {
    const tr = createElement('tr');
    tr.innerHTML = `<td><span class="cell-link">${escapeHtml(c.name)} ${c.isDefault?'(Default)':''}</span></td><td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>${c.status}</span></td>
      <td>${c.showAppInstallProgress?'Yes':'No'}</td><td>${c.blockDeviceUseUntilComplete?'Yes':'No'}</td><td>${(c.assignedGroups||[]).join(', ')}</td>
      <td>${!c.isDefault?`<button class="btn-icon btn-delete" data-id="${c.id}">${Icons.delete}</button>`:''}</td>`;
    tr.querySelector('.btn-delete')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Delete ESP profile?`)) { Store.delete(Collections.ESP_CONFIGS, c.id); renderESP(); }
    });
    tbody?.appendChild(tr);
  }
}

function createESP() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.clearActions();
  const wizard = new Wizard(el, {
    steps: [
      { name: 'Basics', render: (data, body) => {
        body.innerHTML = `<h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Basics</h3><div class="form-group"><label class="form-label required">Name</label><input class="form-input" id="esp-name" value="${data.name||''}"></div>`;
      }, collect: (data) => data.name = document.getElementById('esp-name')?.value||'' },
      { name: 'Settings', render: (data, body) => {
        body.innerHTML = `
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Settings</h3>
          <div class="form-group"><div class="toggle on" id="esp-show"><div class="toggle__track"><div class="toggle__thumb"></div></div><span class="toggle__label">Show app and profile configuration progress</span></div></div>
          <div class="content-card" id="esp-options">
            <div class="form-group"><div class="toggle on" id="esp-block"><div class="toggle__track"><div class="toggle__thumb"></div></div><span class="toggle__label">Block device use until all apps and profiles are installed</span></div></div>
            <div class="form-group"><label class="form-label">Time limit (minutes)</label><input type="number" class="form-input" id="esp-timeout" value="60" style="max-width:100px;"></div>
            <div class="form-group"><div class="toggle" id="esp-fail"><div class="toggle__track"><div class="toggle__thumb"></div></div><span class="toggle__label">Allow users to continue if installation error occurs</span></div></div>
          </div>
        `;
        body.querySelectorAll('.toggle').forEach(t => t.addEventListener('click', () => t.classList.toggle('on')));
        document.getElementById('esp-show')?.addEventListener('click', function() { document.getElementById('esp-options').style.opacity = this.classList.contains('on') ? '1' : '0.5'; });
      }, collect: (data) => {
        data.showAppInstallProgress = document.getElementById('esp-show')?.classList.contains('on');
        data.blockDeviceUseUntilComplete = document.getElementById('esp-block')?.classList.contains('on');
        data.timeoutMinutes = parseInt(document.getElementById('esp-timeout')?.value)||60;
        data.allowFailureAndContinue = document.getElementById('esp-fail')?.classList.contains('on');
      }},
      { name: 'Assignments', render: renderAssignmentsStep, collect: collectAssignments },
      { name: 'Review', render: (data) => Wizard.renderReview(data, { name: 'Name', showAppInstallProgress: 'Show progress', blockDeviceUseUntilComplete: 'Block device', assignedGroups: 'Assigned groups' }) }
    ],
    onComplete: (data) => { Store.create(Collections.ESP_CONFIGS, { id: generateId(), status: 'Active', isDefault: false, ...data }); router.navigate('/devices/enrollment/esp'); },
    onCancel: () => router.navigate('/devices/enrollment/esp')
  });
  wizard.render();
}

/* ══════════════════════════════════════════════════
   ENROLLMENT RESTRICTIONS
   ══════════════════════════════════════════════════ */
export function renderRestrictions() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Create restriction', icon: Icons.add, onClick: openCreateRestrictionModal, type: 'primary' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderRestrictions, type: 'default' }
  ]);
  el.innerHTML = `
    <h1 class="page-title">Enrollment restrictions</h1>
    <p class="page-subtitle">Control which device platforms and device limits apply to users.</p>
    <div class="content-card" style="margin-bottom:20px;">
      <div class="content-card__header">
        <h3 style="font-size:16px;font-weight:600;margin:0;">Device platform restrictions</h3>
        <button class="btn btn-default btn-sm" id="btn-edit-platform-restr">Configure platform limits</button>
      </div>
      <table class="data-grid">
        <thead>
          <tr>
            <th>Priority</th>
            <th>Name</th>
            <th>Platforms allowed</th>
            <th>Personally-owned (BYOD)</th>
            <th>Assigned to</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Default (1)</td>
            <td><span class="cell-link" id="link-def-restr">All Users Default Restriction</span></td>
            <td>Windows (10.0+), iOS (15+), Android, macOS</td>
            <td><span class="status-pill status-pill--warning"><span class="status-pill__dot"></span>Blocked on Windows</span></td>
            <td>All users</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="content-card">
      <div class="content-card__header">
        <h3 style="font-size:16px;font-weight:600;margin:0;">Device limit restrictions</h3>
        <button class="btn btn-default btn-sm" id="btn-edit-limit-restr">Configure device limits</button>
      </div>
      <table class="data-grid">
        <thead>
          <tr>
            <th>Priority</th>
            <th>Name</th>
            <th>Device limit</th>
            <th>Assigned to</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Default (1)</td>
            <td><span class="cell-link" id="link-def-limit">All Users Default Limit</span></td>
            <td><strong>5 devices</strong> (Max: 15)</td>
            <td>All users</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('btn-edit-platform-restr')?.addEventListener('click', openPlatformRestrictionsModal);
  document.getElementById('link-def-restr')?.addEventListener('click', openPlatformRestrictionsModal);
  document.getElementById('btn-edit-limit-restr')?.addEventListener('click', openDeviceLimitModal);
  document.getElementById('link-def-limit')?.addEventListener('click', openDeviceLimitModal);
}

function openCreateRestrictionModal() {
  openPlatformRestrictionsModal();
}

function openPlatformRestrictionsModal() {
  const overlay = createElement('div', { className: 'blade-overlay visible', style: 'z-index:1500;display:flex;align-items:center;justify-content:center;' });
  const modal = createElement('div', { className: 'content-card', style: 'width:520px;max-width:92vw;padding:24px;box-shadow:var(--shadow-64);background:var(--color-bg-surface);' });
  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:1px solid var(--color-border);padding-bottom:10px;">
      <h3 style="font-size:16px;font-weight:600;margin:0;">Device platform restrictions</h3>
      <button class="blade-panel__close" id="modal-close" style="width:28px;height:28px;">${Icons.close}</button>
    </div>
    <p style="font-size:13px;color:var(--color-text-secondary);margin-bottom:14px;">Allow or block device platforms and personal (BYOD) devices from enrolling into Microsoft Intune:</p>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;border:1px solid var(--color-border);border-radius:6px;">
        <div><strong>Windows (MDM)</strong><div style="font-size:11px;color:var(--color-text-secondary);">Minimum version: 10.0.19041</div></div>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;"><input type="checkbox" id="block-win-byod" checked> Block personal devices</label>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;border:1px solid var(--color-border);border-radius:6px;">
        <div><strong>iOS / iPadOS</strong><div style="font-size:11px;color:var(--color-text-secondary);">Minimum version: 16.0</div></div>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;"><input type="checkbox" id="block-ios-byod"> Block personal devices</label>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;border:1px solid var(--color-border);border-radius:6px;">
        <div><strong>Android enterprise</strong><div style="font-size:11px;color:var(--color-text-secondary);">Minimum version: 12.0</div></div>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;"><input type="checkbox" id="block-android-byod"> Block personal devices</label>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;border:1px solid var(--color-border);border-radius:6px;">
        <div><strong>macOS</strong><div style="font-size:11px;color:var(--color-text-secondary);">Minimum version: 13.0</div></div>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;"><input type="checkbox" id="block-mac-byod"> Block personal devices</label>
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px;">
      <button class="btn btn-default" id="modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="modal-save-restr">Save restrictions</button>
    </div>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  modal.querySelector('#modal-close')?.addEventListener('click', close);
  modal.querySelector('#modal-cancel')?.addEventListener('click', close);
  modal.querySelector('#modal-save-restr')?.addEventListener('click', () => {
    close();
    toast()?.success('Saved', 'Platform enrollment restrictions updated.');
  });
}

function openDeviceLimitModal() {
  const overlay = createElement('div', { className: 'blade-overlay visible', style: 'z-index:1500;display:flex;align-items:center;justify-content:center;' });
  const modal = createElement('div', { className: 'content-card', style: 'width:420px;max-width:92vw;padding:24px;box-shadow:var(--shadow-64);background:var(--color-bg-surface);' });
  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:1px solid var(--color-border);padding-bottom:10px;">
      <h3 style="font-size:16px;font-weight:600;margin:0;">Device limit restrictions</h3>
      <button class="blade-panel__close" id="modal-close" style="width:28px;height:28px;">${Icons.close}</button>
    </div>
    <p style="font-size:13px;color:var(--color-text-secondary);margin-bottom:14px;">Select the maximum number of devices that a user can enroll into Intune:</p>
    <div class="form-group">
      <label class="form-label required">Device limit</label>
      <select class="form-input form-select" id="device-limit-select">
        <option value="5" selected>5 devices</option>
        <option value="10">10 devices</option>
        <option value="15">15 devices (Maximum)</option>
      </select>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px;">
      <button class="btn btn-default" id="modal-cancel">Cancel</button>
      <button class="btn btn-primary" id="modal-save-limit">Save limit</button>
    </div>
  `;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  modal.querySelector('#modal-close')?.addEventListener('click', close);
  modal.querySelector('#modal-cancel')?.addEventListener('click', close);
  modal.querySelector('#modal-save-limit')?.addEventListener('click', () => {
    close();
    toast()?.success('Saved', 'Device limit updated.');
  });
}

export function renderAndroidEnrollment() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([{ label: 'Refresh', icon: Icons.refresh, onClick: renderAndroidEnrollment, type: 'default' }]);
  el.innerHTML = `
    <h1 class="page-title">Android enrollment</h1>
    <div class="content-card" style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
      <div style="width:48px;height:48px;border-radius:12px;background:#107C1020;display:flex;align-items:center;justify-content:center;color:#107C10;">${Icons.android}</div>
      <div style="flex:1;">
        <h3 style="font-size:16px;font-weight:600;">Managed Google Play</h3>
        <p style="color:var(--color-text-secondary);font-size:14px;margin-top:4px;">Status: <span style="color:var(--color-success);font-weight:600;">Linked</span> (admin@intunestudylab.com)</p>
      </div>
      <button class="btn btn-default">Disconnect</button>
    </div>
    <div class="content-card">
      <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Enrollment profiles</h3>
      <div class="tile-grid" style="grid-template-columns:1fr 1fr;">
        <div class="tile"><div class="tile__header"><span class="tile__title">Corporate-owned fully managed</span></div><div style="margin-top:12px;font-size:13px;color:var(--color-text-secondary);">For corporate devices associated with a user.</div></div>
        <div class="tile"><div class="tile__header"><span class="tile__title">Corporate-owned dedicated</span></div><div style="margin-top:12px;font-size:13px;color:var(--color-text-secondary);">For kiosk/shared devices not associated with a specific user.</div></div>
        <div class="tile"><div class="tile__header"><span class="tile__title">Corporate-owned with work profile</span></div><div style="margin-top:12px;font-size:13px;color:var(--color-text-secondary);">Corporate devices containing both a work profile and personal profile.</div></div>
        <div class="tile"><div class="tile__header"><span class="tile__title">Personally-owned with work profile</span></div><div style="margin-top:12px;font-size:13px;color:var(--color-text-secondary);">BYOD devices securing work data in a separate container.</div></div>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════
   ENROLLMENT SETTINGS
   ══════════════════════════════════════════════════ */
export function renderEnrollmentSettings() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Save', icon: Icons.checkmark, onClick: () => toast()?.success('Saved', 'Enrollment notification settings updated.'), type: 'primary' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderEnrollmentSettings, type: 'default' },
  ]);

  el.innerHTML = `
    <h1 class="page-title">Enrollment settings</h1>
    <p class="page-subtitle">Configure general tenant enrollment notifications, terms and conditions, and device categories.</p>

    <div class="content-card" style="margin-bottom:16px;">
      <h2 class="content-card__title" style="margin-bottom:12px;">Enrollment notifications</h2>
      <div class="form-group" style="display:flex;align-items:center;justify-content:space-between;padding-bottom:12px;border-bottom:1px solid var(--color-border);">
        <div>
          <label style="font-weight:600;display:block;">Send email notification on new device enrollment</label>
          <span style="font-size:12px;color:var(--color-text-secondary);">Sends confirmation email to user when a new device enrolls into Intune.</span>
        </div>
        <div class="toggle on"><div class="toggle__track"><div class="toggle__thumb"></div></div></div>
      </div>
      <div class="form-group" style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;">
        <div>
          <label style="font-weight:600;display:block;">Send push notification via Company Portal</label>
          <span style="font-size:12px;color:var(--color-text-secondary);">Alerts user on existing trusted devices when a new device enrolls.</span>
        </div>
        <div class="toggle on"><div class="toggle__track"><div class="toggle__thumb"></div></div></div>
      </div>
    </div>

    <div class="content-card">
      <h2 class="content-card__title" style="margin-bottom:12px;">Device categories</h2>
      <p style="font-size:13px;color:var(--color-text-secondary);margin-bottom:12px;">Device categories allow users to choose their device category during enrollment for dynamic group targeting.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <span class="tag" style="padding:6px 12px;font-size:13px;">Corporate devices</span>
        <span class="tag" style="padding:6px 12px;font-size:13px;">BYOD - Personal</span>
        <span class="tag" style="padding:6px 12px;font-size:13px;">Kiosk / Retail</span>
        <span class="tag" style="padding:6px 12px;font-size:13px;">Engineering Lab</span>
      </div>
    </div>
  `;

  el.querySelectorAll('.toggle').forEach(t => t.addEventListener('click', () => t.classList.toggle('on')));
}

