/* ============================================================
   Endpoint Security Page Module
   Overview, Antivirus, Firewall, Disk Encryption, ASR, Defender
   ============================================================ */

import { Icons, createElement, clearElement, $, generateId, formatDate, formatDateTime, escapeHtml, exportCsv } from '../utils.js';
import { Store, Collections } from '../store.js';
import { router } from '../router.js';
import { Wizard, renderScopeTagsStep, collectScopeTags, renderAssignmentsStep, collectAssignments } from '../components/wizard.js';
import { DonutChart } from '../components/charts.js';

function getContentEl() { return $('#page-content'); }
function getCommandBar() { return window.IntuneApp?.commandBar; }
function toast() { return window.IntuneApp?.toastManager; }

/* ── Policy Details Slide-over Blade ── */
export function showPolicyDetailsBlade(policy, collectionKey, onRefresh) {
  document.getElementById('sec-policy-blade')?.remove();
  const overlay = createElement('div', { id: 'sec-policy-blade', className: 'blade-overlay visible', style: 'z-index:1500;' });
  const blade = createElement('div', { className: 'blade-panel visible', style: 'width:620px;max-width:92vw;' });

  const settingsEntries = Object.entries(policy.settings || {});
  const settingsRows = settingsEntries.length > 0
    ? settingsEntries.map(([k, v]) => `
      <tr>
        <td style="font-weight:500;color:var(--color-text-secondary);">${escapeHtml(k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()))}</td>
        <td><strong>${typeof v === 'boolean' ? (v ? 'Enabled' : 'Disabled') : escapeHtml(String(v))}</strong></td>
      </tr>
    `).join('')
    : '<tr><td colspan="2" style="color:var(--color-text-secondary);padding:12px;">Default Microsoft baseline settings applied.</td></tr>';

  blade.innerHTML = `
    <div class="blade-panel__header">
      <div class="blade-panel__breadcrumb">Endpoint security &gt; ${escapeHtml(policy.profileType || 'Policy')} &gt; ${escapeHtml(policy.name)}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
        <h2 class="blade-panel__title" style="margin:0;">${escapeHtml(policy.name)}</h2>
        <button class="blade-panel__close" id="blade-close">${Icons.close}</button>
      </div>
    </div>
    <div class="blade-panel__body">
      <!-- Action strip -->
      <div style="display:flex;gap:8px;padding:8px 0 16px;border-bottom:1px solid var(--color-border);margin-bottom:16px;">
        <button class="btn btn-sm btn-default" id="blade-export-btn">${Icons.download} Export settings</button>
        <button class="btn btn-sm btn-delete" id="blade-delete-btn" style="color:var(--color-danger);">${Icons.delete} Delete policy</button>
      </div>

      <!-- Essentials -->
      <div class="content-card" style="margin-bottom:16px;">
        <h3 style="font-size:14px;font-weight:600;margin-bottom:12px;">Essentials</h3>
        <dl class="kv-grid">
          <dt>Platform</dt><dd>${escapeHtml(policy.platform || 'Windows 10/11')}</dd>
          <dt>Profile type</dt><dd>${escapeHtml(policy.profileType || 'Configuration')}</dd>
          <dt>Assigned groups</dt><dd>${(policy.assignedGroups || []).join(', ') || 'All devices'}</dd>
          <dt>Scope tags</dt><dd>${(policy.scopeTags || ['Default']).join(', ')}</dd>
          <dt>Created / Modified</dt><dd>${formatDate(policy.createdAt || Date.now())}</dd>
        </dl>
      </div>

      <!-- Settings -->
      <div class="content-card" style="margin-bottom:16px;">
        <h3 style="font-size:14px;font-weight:600;margin-bottom:12px;">Configuration settings</h3>
        <table class="data-grid" style="margin:0;">
          <tbody>${settingsRows}</tbody>
        </table>
      </div>

      <!-- Device check-in status -->
      <div class="content-card">
        <h3 style="font-size:14px;font-weight:600;margin-bottom:12px;">Device check-in status</h3>
        <div style="display:flex;gap:24px;margin-bottom:12px;">
          <div><span style="font-size:20px;font-weight:700;color:var(--color-success)">8</span><div style="font-size:12px;color:var(--color-text-secondary);">Succeeded</div></div>
          <div><span style="font-size:20px;font-weight:700;color:var(--color-warning)">0</span><div style="font-size:12px;color:var(--color-text-secondary);">Pending</div></div>
          <div><span style="font-size:20px;font-weight:700;color:var(--color-danger)">0</span><div style="font-size:12px;color:var(--color-text-secondary);">Error</div></div>
        </div>
      </div>
    </div>
  `;

  overlay.appendChild(blade);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  blade.querySelector('#blade-close')?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  blade.querySelector('#blade-export-btn')?.addEventListener('click', () => {
    exportCsv(`${policy.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_settings.csv`, ['Setting', 'Configured Value'], settingsEntries.map(([k, v]) => [k, v]));
    toast()?.success('Export', 'Policy settings exported to CSV.');
  });

  blade.querySelector('#blade-delete-btn')?.addEventListener('click', () => {
    if (confirm(`Delete policy "${policy.name}"?`)) {
      Store.delete(collectionKey, policy.id);
      toast()?.success('Deleted', `Policy "${policy.name}" removed.`);
      close();
      if (onRefresh) onRefresh();
    }
  });
}

/* ══════════════════════════════════════════════════
   ENDPOINT SECURITY OVERVIEW
   ══════════════════════════════════════════════════ */
export function renderEndpointSecurityOverview() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([{ label: 'Refresh', icon: Icons.refresh, onClick: renderEndpointSecurityOverview, type: 'default' }]);

  const devices = Store.getAll(Collections.DEVICES);
  const defenderCount = devices.filter(d => d.defenderStatus === 'Active' || d.defenderStatus === 'On').length;
  const encryptedCount = devices.filter(d => d.isEncrypted).length;
  const avPolicies = Store.getAll(Collections.ANTIVIRUS_POLICIES);

  el.innerHTML = `
    <h1 class="page-title">Endpoint security</h1>
    <div class="tile-grid">
      <div class="tile" id="es-defender"><div class="tile__header"><span class="tile__title">Defender status</span></div><div class="tile__value" style="color:var(--color-success)">${defenderCount}</div><div class="tile__label">Devices protected</div></div>
      <div class="tile" id="es-encrypt"><div class="tile__header"><span class="tile__title">Disk encryption</span></div><div class="tile__value" style="color:var(--color-primary)">${encryptedCount}</div><div class="tile__label">Devices encrypted</div></div>
      <div class="tile" id="es-av"><div class="tile__header"><span class="tile__title">Antivirus policies</span></div><div class="tile__value" style="color:var(--color-primary)">${avPolicies.length}</div><div class="tile__label">Active policies</div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
      <div class="content-card">
        <div class="content-card__header"><h2 class="content-card__title">Defender for Endpoint onboarding</h2></div>
        <div style="display:flex;gap:24px;align-items:flex-start;">
          <canvas id="es-defender-donut" style="max-width:180px;"></canvas>
          <div id="es-defender-legend" class="chart-legend" style="min-width:160px;"></div>
        </div>
      </div>
      <div class="content-card">
        <div class="content-card__header"><h2 class="content-card__title">Quick Tasks</h2></div>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:12px;">
          <li><a href="#/endpoint-security/antivirus" style="color:var(--color-primary);text-decoration:none;display:flex;align-items:center;gap:8px;"><span style="color:var(--color-primary)">${Icons.security}</span> Manage Antivirus</a></li>
          <li><a href="#/endpoint-security/firewall" style="color:var(--color-primary);text-decoration:none;display:flex;align-items:center;gap:8px;"><span style="color:var(--color-primary)">${Icons.firewall}</span> Configure Firewall rules</a></li>
          <li><a href="#/endpoint-security/disk-encryption" style="color:var(--color-primary);text-decoration:none;display:flex;align-items:center;gap:8px;"><span style="color:var(--color-primary)">${Icons.key}</span> Manage BitLocker / FileVault</a></li>
          <li><a href="#/endpoint-security/asr" style="color:var(--color-primary);text-decoration:none;display:flex;align-items:center;gap:8px;"><span style="color:var(--color-primary)">${Icons.warning}</span> Attack Surface Reduction</a></li>
          <li><a href="#/endpoint-security/update-rings" style="color:var(--color-primary);text-decoration:none;display:flex;align-items:center;gap:8px;"><span style="color:var(--color-primary)">${Icons.update}</span> Update rings for Windows 10/11</a></li>
        </ul>
      </div>
    </div>
  `;

  // Routes
  document.getElementById('es-defender')?.addEventListener('click', () => router.navigate('/endpoint-security/defender'));
  document.getElementById('es-encrypt')?.addEventListener('click', () => router.navigate('/endpoint-security/disk-encryption'));
  document.getElementById('es-av')?.addEventListener('click', () => router.navigate('/endpoint-security/antivirus'));

  // Donut chart
  const segments = [
    { label: 'Onboarded', value: defenderCount, color: '#107C10' },
    { label: 'Not onboarded', value: devices.length - defenderCount, color: '#D13438' },
  ];
  new DonutChart(document.getElementById('es-defender-donut'), { width: 180, height: 180, outerRadius: 80, innerRadius: 50, segments, centerText: String(devices.length) }).draw();
  DonutChart.renderLegend(document.getElementById('es-defender-legend'), segments);
}

/* ══════════════════════════════════════════════════
   ANTIVIRUS
   ══════════════════════════════════════════════════ */
export function renderAntivirus() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Create policy', icon: Icons.add, onClick: createAntivirusPolicy, type: 'primary' },
    { label: 'Export', icon: Icons.download, onClick: () => {
        const pols = Store.getAll(Collections.ANTIVIRUS_POLICIES);
        exportCsv('antivirus_policies.csv', ['Name', 'Profile type', 'Platform', 'Targeted'], pols.map(p => [p.name, p.profileType, p.platform, (p.assignedGroups||[]).join('; ')]));
        toast()?.success('Export', 'Antivirus policies exported to CSV.');
      }, type: 'default' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderAntivirus, type: 'default' },
  ]);
  
  const policies = Store.getAll(Collections.ANTIVIRUS_POLICIES);
  el.innerHTML = `
    <h1 class="page-title">Antivirus</h1>
    <p class="page-subtitle">Configure Microsoft Defender Antivirus and third-party AV settings for devices.</p>
    <div class="content-card" style="padding:0;">
      <div class="grid-toolbar" style="padding:12px 16px;">
        <div class="grid-toolbar__search">
          <span style="display:flex">${Icons.search}</span>
          <input type="text" placeholder="Search antivirus policies..." id="av-search">
        </div>
        <span style="font-size:12px;color:var(--color-text-secondary);margin-left:auto;">${policies.length} policies</span>
      </div>
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead><tr><th>Name</th><th>Profile type</th><th>Platform</th><th>Targeted</th><th>Actions</th></tr></thead>
          <tbody id="av-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  const renderList = (items) => {
    const tbody = document.getElementById('av-tbody');
    if (!tbody) return;
    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--color-text-secondary);">No Antivirus policies</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    for (const p of items) {
      const tr = createElement('tr');
      tr.innerHTML = `
        <td><span class="cell-link" style="font-weight:600;">${escapeHtml(p.name)}</span></td>
        <td>${escapeHtml(p.profileType)}</td>
        <td>${escapeHtml(p.platform)}</td>
        <td>${escapeHtml((p.assignedGroups||[]).join(', '))}</td>
        <td><button class="btn-icon btn-delete" data-id="${p.id}" title="Delete policy">${Icons.delete}</button></td>
      `;
      tr.querySelector('.cell-link')?.addEventListener('click', () => showPolicyDetailsBlade(p, Collections.ANTIVIRUS_POLICIES, renderAntivirus));
      tr.querySelector('.btn-delete')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete policy "${p.name}"?`)) {
          Store.delete(Collections.ANTIVIRUS_POLICIES, p.id);
          toast()?.success('Deleted', 'Policy removed.');
          renderAntivirus();
        }
      });
      tbody.appendChild(tr);
    }
  };

  renderList(policies);
  document.getElementById('av-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderList(policies.filter(p => p.name.toLowerCase().includes(q) || p.profileType.toLowerCase().includes(q)));
  });
}

function createAntivirusPolicy() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.clearActions();
  const wizard = new Wizard(el, {
    steps: [
      { name: 'Basics', render: (data, body) => {
        body.innerHTML = `
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Basics</h3>
          <div class="form-group"><label class="form-label required">Platform</label><select class="form-input form-select" id="av-plat" style="max-width:300px;"><option>Windows 10, Windows 11, and Windows Server</option><option>macOS</option></select></div>
          <div class="form-group"><label class="form-label required">Profile</label><select class="form-input form-select" id="av-prof" style="max-width:300px;"><option>Microsoft Defender Antivirus</option><option>Windows Security experience</option></select></div>
          <div class="form-group"><label class="form-label required">Name</label><input class="form-input" id="av-name" value="${data.name||''}"></div>
        `;
      }, collect: (data) => {
        data.platform = document.getElementById('av-plat')?.value;
        data.profileType = document.getElementById('av-prof')?.value;
        data.name = document.getElementById('av-name')?.value||'';
      }},
      { name: 'Configuration settings', render: (data, body) => {
        body.innerHTML = `
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Configuration settings</h3>
          <div class="content-card">
            <h4 style="font-weight:600;margin-bottom:12px;">Cloud protection</h4>
            <div class="form-group"><label class="form-label">Turn on cloud-delivered protection</label><select class="form-input form-select" id="av-cloud" style="max-width:200px;"><option>Not configured</option><option selected>Yes</option><option>No</option></select></div>
            <div class="form-group"><label class="form-label">Cloud block level</label><select class="form-input form-select" id="av-block" style="max-width:200px;"><option>Not configured</option><option selected>High</option><option>High plus</option><option>Zero tolerance</option></select></div>
          </div>
          <div class="content-card">
            <h4 style="font-weight:600;margin-bottom:12px;">Real-time protection</h4>
            <div class="form-group"><label class="form-label">Turn on real-time protection</label><select class="form-input form-select" id="av-real" style="max-width:200px;"><option>Not configured</option><option selected>Yes</option><option>No</option></select></div>
          </div>
        `;
      }, collect: (data) => {
        data.settings = { cloudDelivered: document.getElementById('av-cloud')?.value, cloudBlockLevel: document.getElementById('av-block')?.value, realTime: document.getElementById('av-real')?.value };
      }},
      { name: 'Scope tags', render: renderScopeTagsStep, collect: collectScopeTags },
      { name: 'Assignments', render: renderAssignmentsStep, collect: collectAssignments },
      { name: 'Review + create', render: (data) => Wizard.renderReview(data, { name: 'Name', platform: 'Platform', profileType: 'Profile', assignedGroups: 'Assigned groups' }) }
    ],
    onComplete: (data) => { Store.create(Collections.ANTIVIRUS_POLICIES, { id: generateId(), ...data }); router.navigate('/endpoint-security/antivirus'); },
    onCancel: () => router.navigate('/endpoint-security/antivirus')
  });
  wizard.render();
}

/* ══════════════════════════════════════════════════
   FIREWALL
   ══════════════════════════════════════════════════ */
export function renderFirewall() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Create policy', icon: Icons.add, onClick: createFirewallPolicy, type: 'primary' },
    { label: 'Export', icon: Icons.download, onClick: () => {
        const pols = Store.getAll(Collections.FIREWALL_POLICIES);
        exportCsv('firewall_policies.csv', ['Name', 'Profile type', 'Platform', 'Targeted'], pols.map(p => [p.name, p.profileType, p.platform, (p.assignedGroups||[]).join('; ')]));
        toast()?.success('Export', 'Firewall policies exported to CSV.');
      }, type: 'default' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderFirewall, type: 'default' }
  ]);
  const policies = Store.getAll(Collections.FIREWALL_POLICIES);
  el.innerHTML = `
    <h1 class="page-title">Firewall</h1>
    <p class="page-subtitle">Configure Windows Defender Firewall and macOS Firewall settings.</p>
    <div class="content-card" style="padding:0;">
      <div class="grid-toolbar" style="padding:12px 16px;">
        <div class="grid-toolbar__search">
          <span style="display:flex">${Icons.search}</span>
          <input type="text" placeholder="Search firewall policies..." id="fw-search">
        </div>
        <span style="font-size:12px;color:var(--color-text-secondary);margin-left:auto;">${policies.length} policies</span>
      </div>
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead><tr><th>Name</th><th>Profile type</th><th>Platform</th><th>Targeted</th><th>Actions</th></tr></thead>
          <tbody id="fw-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  const renderList = (items) => {
    const tbody = document.getElementById('fw-tbody');
    if (!tbody) return;
    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--color-text-secondary);">No Firewall policies</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    for (const p of items) {
      const tr = createElement('tr');
      tr.innerHTML = `
        <td><span class="cell-link" style="font-weight:600;">${escapeHtml(p.name)}</span></td>
        <td>${escapeHtml(p.profileType)}</td>
        <td>${escapeHtml(p.platform)}</td>
        <td>${escapeHtml((p.assignedGroups||[]).join(', '))}</td>
        <td><button class="btn-icon btn-delete" data-id="${p.id}" title="Delete policy">${Icons.delete}</button></td>
      `;
      tr.querySelector('.cell-link')?.addEventListener('click', () => showPolicyDetailsBlade(p, Collections.FIREWALL_POLICIES, renderFirewall));
      tr.querySelector('.btn-delete')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete policy "${p.name}"?`)) {
          Store.delete(Collections.FIREWALL_POLICIES, p.id);
          toast()?.success('Deleted', 'Policy removed.');
          renderFirewall();
        }
      });
      tbody.appendChild(tr);
    }
  };

  renderList(policies);
  document.getElementById('fw-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderList(policies.filter(p => p.name.toLowerCase().includes(q) || p.profileType.toLowerCase().includes(q)));
  });
}

function createFirewallPolicy() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.clearActions();
  const wizard = new Wizard(el, {
    steps: [
      {
        name: 'Basics',
        render: (data, body) => {
          body.innerHTML = `
            <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Basics</h3>
            <div class="form-group"><label class="form-label required">Platform</label><select class="form-input form-select" id="fw-plat" style="max-width:300px;"><option>Windows 10 and later</option><option>macOS</option></select></div>
            <div class="form-group"><label class="form-label required">Profile</label><select class="form-input form-select" id="fw-prof" style="max-width:300px;"><option>Microsoft Defender Firewall</option><option>Firewall Rules</option></select></div>
            <div class="form-group"><label class="form-label required">Name</label><input class="form-input" id="fw-name" value="${data.name || ''}" placeholder="e.g. Enterprise Defender Firewall"></div>
            <div class="form-group"><label class="form-label">Description</label><textarea class="form-input form-textarea" id="fw-desc" placeholder="Optional description...">${data.description || ''}</textarea></div>
          `;
        },
        collect: (data) => {
          data.platform = document.getElementById('fw-plat')?.value || 'Windows 10 and later';
          data.profileType = document.getElementById('fw-prof')?.value || 'Microsoft Defender Firewall';
          data.name = document.getElementById('fw-name')?.value?.trim() || '';
          data.description = document.getElementById('fw-desc')?.value?.trim() || '';
        }
      },
      {
        name: 'Configuration settings',
        render: (data, body) => {
          body.innerHTML = `
            <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Firewall profile settings</h3>
            <div class="form-group"><label class="form-label">Enable Domain network firewall</label><select class="form-input form-select" id="fw-dom" style="max-width:200px;"><option selected>Yes</option><option>No</option></select></div>
            <div class="form-group"><label class="form-label">Enable Private network firewall</label><select class="form-input form-select" id="fw-priv" style="max-width:200px;"><option selected>Yes</option><option>No</option></select></div>
            <div class="form-group"><label class="form-label">Enable Public network firewall</label><select class="form-input form-select" id="fw-pub" style="max-width:200px;"><option selected>Yes</option><option>No</option></select></div>
            <div class="form-group"><label class="form-label">Block all incoming connections</label><select class="form-input form-select" id="fw-in" style="max-width:200px;"><option>Not configured</option><option selected>Yes</option><option>No</option></select></div>
            <div class="form-group"><label class="form-label">Stealth mode (Prevent port scanning)</label><select class="form-input form-select" id="fw-stealth" style="max-width:200px;"><option selected>Enable</option><option>Disable</option></select></div>
          `;
        },
        collect: (data) => {
          data.settings = {
            domainFirewall: document.getElementById('fw-dom')?.value,
            privateFirewall: document.getElementById('fw-priv')?.value,
            publicFirewall: document.getElementById('fw-pub')?.value,
            stealthMode: document.getElementById('fw-stealth')?.value,
          };
        }
      },
      { name: 'Scope tags', render: renderScopeTagsStep, collect: collectScopeTags },
      { name: 'Assignments', render: renderAssignmentsStep, collect: collectAssignments },
      { name: 'Review + create', render: (data) => Wizard.renderReview(data, { name: 'Name', platform: 'Platform', profileType: 'Profile', assignedGroups: 'Assigned groups' }) }
    ],
    onComplete: (data) => {
      Store.create(Collections.FIREWALL_POLICIES, { id: generateId(), ...data });
      toast()?.success('Policy created', `Firewall policy "${data.name}" created.`);
      Store.addNotification({ type: 'success', title: 'Firewall policy created', message: `Firewall policy "${data.name}" has been deployed.` });
      router.navigate('/endpoint-security/firewall');
    },
    onCancel: () => router.navigate('/endpoint-security/firewall')
  });
  wizard.render();
}

/* ══════════════════════════════════════════════════
   DISK ENCRYPTION (BITLOCKER / FILEVAULT)
   ══════════════════════════════════════════════════ */
export function renderDiskEncryption() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Create policy', icon: Icons.add, onClick: createDiskEncryptionPolicy, type: 'primary' },
    { label: 'Export', icon: Icons.download, onClick: () => {
        const pols = Store.getAll(Collections.DISK_ENCRYPTION_POLICIES);
        exportCsv('disk_encryption_policies.csv', ['Name', 'Profile type', 'Platform', 'Targeted'], pols.map(p => [p.name, p.profileType, p.platform, (p.assignedGroups||[]).join('; ')]));
        toast()?.success('Export', 'Disk encryption policies exported to CSV.');
      }, type: 'default' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderDiskEncryption, type: 'default' }
  ]);
  const policies = Store.getAll(Collections.DISK_ENCRYPTION_POLICIES);
  el.innerHTML = `
    <h1 class="page-title">Disk encryption</h1>
    <p class="page-subtitle">Configure BitLocker for Windows and FileVault for macOS.</p>
    <div class="content-card" style="padding:0;">
      <div class="grid-toolbar" style="padding:12px 16px;">
        <div class="grid-toolbar__search">
          <span style="display:flex">${Icons.search}</span>
          <input type="text" placeholder="Search encryption policies..." id="de-search">
        </div>
        <span style="font-size:12px;color:var(--color-text-secondary);margin-left:auto;">${policies.length} policies</span>
      </div>
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead><tr><th>Name</th><th>Profile type</th><th>Platform</th><th>Targeted</th><th>Actions</th></tr></thead>
          <tbody id="de-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  const renderList = (items) => {
    const tbody = document.getElementById('de-tbody');
    if (!tbody) return;
    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--color-text-secondary);">No Disk Encryption policies</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    for (const p of items) {
      const tr = createElement('tr');
      tr.innerHTML = `
        <td><span class="cell-link" style="font-weight:600;">${escapeHtml(p.name)}</span></td>
        <td>${escapeHtml(p.profileType)}</td>
        <td>${escapeHtml(p.platform)}</td>
        <td>${escapeHtml((p.assignedGroups||[]).join(', '))}</td>
        <td><button class="btn-icon btn-delete" data-id="${p.id}" title="Delete policy">${Icons.delete}</button></td>
      `;
      tr.querySelector('.cell-link')?.addEventListener('click', () => showPolicyDetailsBlade(p, Collections.DISK_ENCRYPTION_POLICIES, renderDiskEncryption));
      tr.querySelector('.btn-delete')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete policy "${p.name}"?`)) {
          Store.delete(Collections.DISK_ENCRYPTION_POLICIES, p.id);
          toast()?.success('Deleted', 'Policy removed.');
          renderDiskEncryption();
        }
      });
      tbody.appendChild(tr);
    }
  };

  renderList(policies);
  document.getElementById('de-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderList(policies.filter(p => p.name.toLowerCase().includes(q) || p.profileType.toLowerCase().includes(q)));
  });
}

function createDiskEncryptionPolicy() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.clearActions();
  const wizard = new Wizard(el, {
    steps: [
      { name: 'Basics', render: (data, body) => {
        body.innerHTML = `
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Basics</h3>
          <div class="form-group"><label class="form-label required">Platform</label><select class="form-input form-select" id="de-plat" style="max-width:300px;"><option>Windows 10 and later</option><option>macOS</option></select></div>
          <div class="form-group"><label class="form-label required">Profile</label><select class="form-input form-select" id="de-prof" style="max-width:300px;"><option>BitLocker</option></select></div>
          <div class="form-group"><label class="form-label required">Name</label><input class="form-input" id="de-name" value="${data.name||''}"></div>
        `;
        document.getElementById('de-plat')?.addEventListener('change', function() {
          const prof = document.getElementById('de-prof');
          prof.innerHTML = this.value === 'macOS' ? '<option>FileVault</option>' : '<option>BitLocker</option>';
        });
      }, collect: (data) => {
        data.platform = document.getElementById('de-plat')?.value;
        data.profileType = document.getElementById('de-prof')?.value;
        data.name = document.getElementById('de-name')?.value||'';
      }},
      { name: 'Configuration settings', render: (data, body) => {
        if (data.profileType === 'FileVault') {
          body.innerHTML = `<h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">FileVault settings</h3>
            <div class="form-group"><label class="form-label">Enable FileVault</label><select class="form-input form-select" id="de-fv" style="max-width:200px;"><option>Not configured</option><option selected>Yes</option></select></div>
            <div class="form-group"><label class="form-label">Recovery key type</label><select class="form-input form-select" id="de-fvrk" style="max-width:200px;"><option>Personal Recovery Key</option><option>Institutional Recovery Key</option></select></div>`;
        } else {
          body.innerHTML = `<h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">BitLocker settings</h3>
            <div class="form-group"><label class="form-label">Require encryption</label><select class="form-input form-select" id="de-bl" style="max-width:200px;"><option>Not configured</option><option selected>Require</option></select></div>
            <div class="form-group"><label class="form-label">Warning for other disk encryption</label><select class="form-input form-select" id="de-blw" style="max-width:200px;"><option>Not configured</option><option selected>Block</option></select></div>
            <div class="form-group"><label class="form-label">Configure encryption methods</label><select class="form-input form-select" id="de-blm" style="max-width:200px;"><option>Not configured</option><option selected>Enable</option></select></div>
            <div class="form-group"><label class="form-label">Encryption for OS drives</label><select class="form-input form-select" id="de-blos" style="max-width:200px;"><option>XTS-AES 256-bit</option><option>XTS-AES 128-bit</option></select></div>`;
        }
      }, collect: (data) => { data.settings = {}; }},
      { name: 'Scope tags', render: renderScopeTagsStep, collect: collectScopeTags },
      { name: 'Assignments', render: renderAssignmentsStep, collect: collectAssignments },
      { name: 'Review + create', render: (data) => Wizard.renderReview(data, { name: 'Name', platform: 'Platform', profileType: 'Profile', assignedGroups: 'Assigned groups' }) }
    ],
    onComplete: (data) => { Store.create(Collections.DISK_ENCRYPTION_POLICIES, { id: generateId(), ...data }); router.navigate('/endpoint-security/disk-encryption'); },
    onCancel: () => router.navigate('/endpoint-security/disk-encryption')
  });
  wizard.render();
}

/* ══════════════════════════════════════════════════
   ASR (ATTACK SURFACE REDUCTION)
   ══════════════════════════════════════════════════ */
export function renderASR() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Create policy', icon: Icons.add, onClick: createASRPolicy, type: 'primary' },
    { label: 'Export', icon: Icons.download, onClick: () => {
        const pols = Store.getAll(Collections.ASR_POLICIES);
        exportCsv('asr_policies.csv', ['Name', 'Profile type', 'Platform', 'Targeted'], pols.map(p => [p.name, p.profileType, p.platform, (p.assignedGroups||[]).join('; ')]));
        toast()?.success('Export', 'ASR policies exported to CSV.');
      }, type: 'default' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderASR, type: 'default' }
  ]);
  const policies = Store.getAll(Collections.ASR_POLICIES);
  el.innerHTML = `
    <h1 class="page-title">Attack surface reduction</h1>
    <p class="page-subtitle">Configure rules to help prevent attacks on devices.</p>
    <div class="content-card" style="padding:0;">
      <div class="grid-toolbar" style="padding:12px 16px;">
        <div class="grid-toolbar__search">
          <span style="display:flex">${Icons.search}</span>
          <input type="text" placeholder="Search ASR policies..." id="asr-search">
        </div>
        <span style="font-size:12px;color:var(--color-text-secondary);margin-left:auto;">${policies.length} policies</span>
      </div>
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead><tr><th>Name</th><th>Profile type</th><th>Platform</th><th>Targeted</th><th>Actions</th></tr></thead>
          <tbody id="asr-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  const renderList = (items) => {
    const tbody = document.getElementById('asr-tbody');
    if (!tbody) return;
    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--color-text-secondary);">No ASR policies</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    for (const p of items) {
      const tr = createElement('tr');
      tr.innerHTML = `
        <td><span class="cell-link" style="font-weight:600;">${escapeHtml(p.name)}</span></td>
        <td>${escapeHtml(p.profileType)}</td>
        <td>${escapeHtml(p.platform)}</td>
        <td>${escapeHtml((p.assignedGroups||[]).join(', '))}</td>
        <td><button class="btn-icon btn-delete" data-id="${p.id}" title="Delete policy">${Icons.delete}</button></td>
      `;
      tr.querySelector('.cell-link')?.addEventListener('click', () => showPolicyDetailsBlade(p, Collections.ASR_POLICIES, renderASR));
      tr.querySelector('.btn-delete')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete policy "${p.name}"?`)) {
          Store.delete(Collections.ASR_POLICIES, p.id);
          toast()?.success('Deleted', 'Policy removed.');
          renderASR();
        }
      });
      tbody.appendChild(tr);
    }
  };

  renderList(policies);
  document.getElementById('asr-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderList(policies.filter(p => p.name.toLowerCase().includes(q) || p.profileType.toLowerCase().includes(q)));
  });
}

function createASRPolicy() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.clearActions();
  const wizard = new Wizard(el, {
    steps: [
      {
        name: 'Basics',
        render: (data, body) => {
          body.innerHTML = `
            <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Basics</h3>
            <div class="form-group"><label class="form-label required">Platform</label><select class="form-input form-select" id="asr-plat" style="max-width:300px;"><option>Windows 10 and later</option></select></div>
            <div class="form-group"><label class="form-label required">Profile</label><select class="form-input form-select" id="asr-prof" style="max-width:300px;"><option>Attack Surface Reduction Rules</option><option>Device Control</option><option>Exploit Protection</option></select></div>
            <div class="form-group"><label class="form-label required">Name</label><input class="form-input" id="asr-name" value="${data.name || ''}" placeholder="e.g. Standard Enterprise ASR Baseline"></div>
            <div class="form-group"><label class="form-label">Description</label><textarea class="form-input form-textarea" id="asr-desc" placeholder="Optional description...">${data.description || ''}</textarea></div>
          `;
        },
        collect: (data) => {
          data.platform = document.getElementById('asr-plat')?.value || 'Windows 10 and later';
          data.profileType = document.getElementById('asr-prof')?.value || 'Attack Surface Reduction Rules';
          data.name = document.getElementById('asr-name')?.value?.trim() || '';
          data.description = document.getElementById('asr-desc')?.value?.trim() || '';
        }
      },
      {
        name: 'Configuration settings',
        render: (data, body) => {
          body.innerHTML = `
            <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">ASR rule settings</h3>
            <div class="form-group"><label class="form-label">Block credential stealing from Windows LSASS</label><select class="form-input form-select" style="max-width:240px;"><option selected>Block</option><option>Audit</option><option>Disabled</option></select></div>
            <div class="form-group"><label class="form-label">Block executable content from email client</label><select class="form-input form-select" style="max-width:240px;"><option selected>Block</option><option>Audit</option><option>Disabled</option></select></div>
            <div class="form-group"><label class="form-label">Block execution of potentially obfuscated scripts</label><select class="form-input form-select" style="max-width:240px;"><option selected>Block</option><option>Audit</option><option>Disabled</option></select></div>
            <div class="form-group"><label class="form-label">Block abuse of exploited vulnerable signed drivers</label><select class="form-input form-select" style="max-width:240px;"><option selected>Block</option><option>Audit</option><option>Disabled</option></select></div>
          `;
        },
        collect: (data) => {
          data.settings = { rulesEnforced: 4 };
        }
      },
      { name: 'Scope tags', render: renderScopeTagsStep, collect: collectScopeTags },
      { name: 'Assignments', render: renderAssignmentsStep, collect: collectAssignments },
      { name: 'Review + create', render: (data) => Wizard.renderReview(data, { name: 'Name', platform: 'Platform', profileType: 'Profile', assignedGroups: 'Assigned groups' }) }
    ],
    onComplete: (data) => {
      Store.create(Collections.ASR_POLICIES, { id: generateId(), ...data });
      toast()?.success('Policy created', `ASR policy "${data.name}" created.`);
      Store.addNotification({ type: 'success', title: 'ASR policy created', message: `ASR policy "${data.name}" has been deployed.` });
      router.navigate('/endpoint-security/asr');
    },
    onCancel: () => router.navigate('/endpoint-security/asr')
  });
  wizard.render();
}

/* ══════════════════════════════════════════════════
   DEFENDER FOR ENDPOINT
   ══════════════════════════════════════════════════ */
export function renderDefender() {
  const el = getContentEl(); clearElement(el);
  const defConfig = Store.get('defenderSettings', 'config') || {
    winConnect: true,
    iosConnect: true,
    androidConnect: true,
    macosConnect: true,
    androidMam: true,
    iosMam: true,
    shareSecConfig: true,
    blockUnsupported: true,
    lastSync: Date.now() - 1800000
  };

  getCommandBar()?.setActions([
    { label: 'Open Microsoft Defender XDR', icon: Icons.security, onClick: () => {
        toast()?.info('Defender XDR', 'Navigating to Microsoft Defender security center portal (security.microsoft.com).');
      }, type: 'primary' },
    { label: 'Sync intelligence', icon: Icons.sync, onClick: () => {
        defConfig.lastSync = Date.now();
        Store.set('defenderSettings', 'config', defConfig);
        toast()?.success('Synchronized', 'Intelligence & definitions synchronized from Defender Security Center.');
        renderDefender();
      }, type: 'default' },
    { label: 'Onboard devices', icon: Icons.download, onClick: showDefenderOnboardingModal, type: 'default' },
    { label: 'Save configuration', icon: Icons.check, onClick: () => {
        defConfig.winConnect = document.getElementById('def-win')?.classList.contains('on');
        defConfig.iosConnect = document.getElementById('def-ios')?.classList.contains('on');
        defConfig.androidConnect = document.getElementById('def-android')?.classList.contains('on');
        defConfig.macosConnect = document.getElementById('def-macos')?.classList.contains('on');
        defConfig.androidMam = document.getElementById('def-and-mam')?.classList.contains('on');
        defConfig.iosMam = document.getElementById('def-ios-mam')?.classList.contains('on');
        defConfig.shareSecConfig = document.getElementById('def-share')?.classList.contains('on');
        defConfig.blockUnsupported = document.getElementById('def-block')?.classList.contains('on');
        Store.set('defenderSettings', 'config', defConfig);
        toast()?.success('Saved', 'Defender for Endpoint configuration saved.');
      }, type: 'default' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderDefender, type: 'default' },
  ]);

  const devices = Store.getAll(Collections.DEVICES);
  const onboardedCount = devices.filter(d => d.defenderStatus === 'Active' || d.defenderStatus === 'Onboarded').length;

  el.innerHTML = `
    <h1 class="page-title">Microsoft Defender for Endpoint</h1>
    <p class="page-subtitle">Connect Intune to Microsoft Defender for Endpoint for risk-based conditional access, threat detection, and response.</p>

    <!-- Connector Status Card -->
    <div class="content-card" style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
      <div style="width:48px;height:48px;border-radius:12px;background:#107C1020;display:flex;align-items:center;justify-content:center;color:#107C10;">${Icons.security}</div>
      <div style="flex:1;">
        <h3 style="font-size:16px;font-weight:600;margin:0;">Defender for Endpoint connection status</h3>
        <p style="color:var(--color-text-secondary);font-size:13px;margin:4px 0 0;">
          Status: <span style="color:var(--color-success);font-weight:600;">Available &amp; Connected</span> • 
          Last synchronized: <strong>${formatDateTime(defConfig.lastSync)}</strong> • 
          Engine: <strong>v1.417.842.0</strong>
        </p>
      </div>
      <span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Service active</span>
    </div>

    <!-- Telemetry Tiles -->
    <div class="tile-grid" style="grid-template-columns:repeat(3, 1fr);margin-bottom:16px;">
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Onboarded endpoints</span></div>
        <div class="tile__value" style="color:var(--color-success)">${onboardedCount}</div>
        <div class="tile__label">Defender telemetry reporting</div>
      </div>
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Sensor active</span></div>
        <div class="tile__value" style="color:var(--color-primary)">${Math.max(0, onboardedCount - 1)}</div>
        <div class="tile__label">Healthy heartbeat (&lt; 1 hour)</div>
      </div>
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Misconfigured / Pending</span></div>
        <div class="tile__value" style="color:var(--color-warning)">${devices.length - onboardedCount}</div>
        <div class="tile__label">Requires onboarding package</div>
      </div>
    </div>

    <!-- MDM Compliance Policy Settings -->
    <div class="content-card" style="margin-bottom:16px;">
      <h3 style="font-size:15px;font-weight:600;margin-bottom:14px;">MDM Compliance Policy Settings</h3>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="form-group" style="display:flex;align-items:center;justify-content:space-between;margin:0;padding:8px 0;border-bottom:1px solid var(--color-border-subtle);">
          <div>
            <strong>Connect Windows devices version 10.0.15063 and above to Microsoft Defender for Endpoint</strong>
            <p style="margin:2px 0 0;font-size:12px;color:var(--color-text-secondary);">Evaluate machine risk score as a condition for compliance.</p>
          </div>
          <div class="toggle ${defConfig.winConnect ? 'on' : ''}" id="def-win"><div class="toggle__track"><div class="toggle__thumb"></div></div></div>
        </div>
        <div class="form-group" style="display:flex;align-items:center;justify-content:space-between;margin:0;padding:8px 0;border-bottom:1px solid var(--color-border-subtle);">
          <div>
            <strong>Connect iOS/iPadOS devices to Microsoft Defender for Endpoint</strong>
            <p style="margin:2px 0 0;font-size:12px;color:var(--color-text-secondary);">Evaluate iOS mobile threat defense risk in Intune compliance.</p>
          </div>
          <div class="toggle ${defConfig.iosConnect ? 'on' : ''}" id="def-ios"><div class="toggle__track"><div class="toggle__thumb"></div></div></div>
        </div>
        <div class="form-group" style="display:flex;align-items:center;justify-content:space-between;margin:0;padding:8px 0;border-bottom:1px solid var(--color-border-subtle);">
          <div>
            <strong>Connect Android devices to Microsoft Defender for Endpoint</strong>
            <p style="margin:2px 0 0;font-size:12px;color:var(--color-text-secondary);">Evaluate Android device risk level against compliance baseline.</p>
          </div>
          <div class="toggle ${defConfig.androidConnect ? 'on' : ''}" id="def-android"><div class="toggle__track"><div class="toggle__thumb"></div></div></div>
        </div>
        <div class="form-group" style="display:flex;align-items:center;justify-content:space-between;margin:0;padding:8px 0;">
          <div>
            <strong>Connect macOS devices to Microsoft Defender for Endpoint</strong>
            <p style="margin:2px 0 0;font-size:12px;color:var(--color-text-secondary);">Enforce Defender risk level compliance on Apple macOS devices.</p>
          </div>
          <div class="toggle ${defConfig.macosConnect ? 'on' : ''}" id="def-macos"><div class="toggle__track"><div class="toggle__thumb"></div></div></div>
        </div>
      </div>
    </div>

    <!-- App Protection Policy Settings (MAM) -->
    <div class="content-card" style="margin-bottom:16px;">
      <h3 style="font-size:15px;font-weight:600;margin-bottom:14px;">App Protection Policy Settings (MAM)</h3>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="form-group" style="display:flex;align-items:center;justify-content:space-between;margin:0;padding:8px 0;border-bottom:1px solid var(--color-border-subtle);">
          <div>
            <strong>Connect Android devices to Microsoft Defender for Endpoint for app protection policy evaluation</strong>
            <p style="margin:2px 0 0;font-size:12px;color:var(--color-text-secondary);">Send threat signals to Intune mobile application management (MAM) without MDM enrollment.</p>
          </div>
          <div class="toggle ${defConfig.androidMam ? 'on' : ''}" id="def-and-mam"><div class="toggle__track"><div class="toggle__thumb"></div></div></div>
        </div>
        <div class="form-group" style="display:flex;align-items:center;justify-content:space-between;margin:0;padding:8px 0;">
          <div>
            <strong>Connect iOS devices to Microsoft Defender for Endpoint for app protection policy evaluation</strong>
            <p style="margin:2px 0 0;font-size:12px;color:var(--color-text-secondary);">Send iOS security threat events to MAM policies.</p>
          </div>
          <div class="toggle ${defConfig.iosMam ? 'on' : ''}" id="def-ios-mam"><div class="toggle__track"><div class="toggle__thumb"></div></div></div>
        </div>
      </div>
    </div>

    <!-- Common Settings -->
    <div class="content-card">
      <h3 style="font-size:15px;font-weight:600;margin-bottom:14px;">Common Settings</h3>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="form-group" style="display:flex;align-items:center;justify-content:space-between;margin:0;padding:8px 0;border-bottom:1px solid var(--color-border-subtle);">
          <div>
            <strong>Share device security configuration data with Microsoft Defender for Endpoint</strong>
            <p style="margin:2px 0 0;font-size:12px;color:var(--color-text-secondary);">Allows Defender Vulnerability Management to inspect Intune policy settings.</p>
          </div>
          <div class="toggle ${defConfig.shareSecConfig ? 'on' : ''}" id="def-share"><div class="toggle__track"><div class="toggle__thumb"></div></div></div>
        </div>
        <div class="form-group" style="display:flex;align-items:center;justify-content:space-between;margin:0;padding:8px 0;">
          <div>
            <strong>Block unsupported OS versions</strong>
            <p style="margin:2px 0 0;font-size:12px;color:var(--color-text-secondary);">Prevent unsupported platforms from communicating with the Defender tenant.</p>
          </div>
          <div class="toggle ${defConfig.blockUnsupported ? 'on' : ''}" id="def-block"><div class="toggle__track"><div class="toggle__thumb"></div></div></div>
        </div>
      </div>
    </div>
  `;

  el.querySelectorAll('.toggle').forEach(t => t.addEventListener('click', () => t.classList.toggle('on')));
}

function showDefenderOnboardingModal() {
  document.getElementById('def-modal')?.remove();
  const overlay = createElement('div', { id: 'def-modal', className: 'blade-overlay visible', style: 'z-index:1500;display:flex;align-items:center;justify-content:center;' });
  const modal = createElement('div', { className: 'content-card', style: 'width:540px;max-width:92vw;background:var(--color-bg-surface);box-shadow:var(--shadow-64);border-radius:8px;padding:24px;' });

  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;border-bottom:1px solid var(--color-border);padding-bottom:12px;">
      <h3 style="font-size:16px;font-weight:600;margin:0;">Onboard Devices to Defender for Endpoint</h3>
      <button class="blade-panel__close" id="def-modal-close" style="width:28px;height:28px;">${Icons.close}</button>
    </div>
    <div class="form-group">
      <label class="form-label required">Operating system</label>
      <select class="form-input form-select" id="def-onboard-os">
        <option>Windows 10 and Windows 11</option>
        <option>macOS</option>
        <option>iOS / iPadOS</option>
        <option>Android</option>
        <option>Windows Server</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label required">Deployment method</label>
      <select class="form-input form-select" id="def-onboard-method">
        <option>Microsoft Intune (Automatic / Cloud native)</option>
        <option>Local Script (up to 10 devices)</option>
        <option>Group Policy</option>
      </select>
    </div>
    <div class="info-banner info-banner--info" style="margin:16px 0;">
      <span class="info-banner__icon">${Icons.info}</span>
      <span>For cloud-managed devices in Intune, Defender onboarding can be assigned via an Endpoint Detection and Response (EDR) policy without running manual scripts.</span>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px;">
      <button class="btn btn-default" id="def-cancel">Close</button>
      <button class="btn btn-primary" id="def-download-pkg">${Icons.download} Download onboarding script</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  modal.querySelector('#def-modal-close')?.addEventListener('click', close);
  modal.querySelector('#def-cancel')?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  modal.querySelector('#def-download-pkg')?.addEventListener('click', () => {
    const os = modal.querySelector('#def-onboard-os')?.value;
    const blob = new Blob([`REM Microsoft Defender for Endpoint Onboarding Script for ${os}\r\nREM OrgID: 3fa85f64-5717-4562-b3fc-2c963f66afa6\r\necho Onboarding device to Microsoft Defender for Endpoint...\r\nsc.exe start sense\r\n`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WindowsDefenderATPLocalOnboardingScript.cmd`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast()?.success('Downloaded', 'Defender onboarding script package downloaded.');
    close();
  });
}

/* ══════════════════════════════════════════════════
   ENDPOINT SECURITY — ALL DEVICES
   ══════════════════════════════════════════════════ */
export function renderSecurityAllDevices() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Export', icon: Icons.download, onClick: () => toast()?.success('Export', 'Security posture exported.'), type: 'default' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderSecurityAllDevices, type: 'default' },
  ]);

  const devices = Store.getAll(Collections.DEVICES);

  el.innerHTML = `
    <h1 class="page-title">Endpoint security — All devices</h1>
    <p class="page-subtitle">Monitor Microsoft Defender onboarding status, sensor health, and encryption posture across all managed endpoints.</p>

    <div class="content-card" style="padding:0;">
      <div class="grid-toolbar" style="padding:12px 16px;">
        <div class="grid-toolbar__search">
          <span style="display:flex">${Icons.search}</span>
          <input type="text" placeholder="Search security devices..." id="sec-dev-search">
        </div>
        <span style="font-size:12px;color:var(--color-text-secondary);margin-left:auto;">${devices.length} endpoints</span>
      </div>
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Device name</th><th>OS</th><th>Defender sensor</th><th>Antivirus engine</th><th>Disk encryption</th><th>Risk level</th></tr>
          </thead>
          <tbody id="sec-dev-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  const renderList = (items) => {
    const tbody = document.getElementById('sec-dev-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    for (const d of items) {
      const tr = createElement('tr');
      const defCls = (d.defenderStatus === 'Onboarded' || d.defenderStatus === 'Active') ? 'compliant' : 'noncompliant';
      const encCls = d.isEncrypted ? 'compliant' : 'noncompliant';
      const risk = d.complianceState === 'Noncompliant' ? 'Medium' : 'No risk';
      const riskTag = risk === 'Medium' ? '<span class="tag" style="background:#FFF4CE;color:#7A5E00;">Medium</span>' : '<span class="tag" style="background:#DFF6DD;color:#107C10;">No risk</span>';

      tr.innerHTML = `
        <td><span class="cell-link" style="font-weight:600;">${escapeHtml(d.name)}</span></td>
        <td>${escapeHtml(d.osVersion || d.os)}</td>
        <td><span class="status-pill status-pill--${defCls}"><span class="status-pill__dot"></span>${escapeHtml(d.defenderStatus || 'Onboarded')}</span></td>
        <td>${escapeHtml(d.antivirusStatus || 'Active')}</td>
        <td><span class="status-pill status-pill--${encCls}"><span class="status-pill__dot"></span>${d.isEncrypted ? 'Encrypted' : 'Not encrypted'}</span></td>
        <td>${riskTag}</td>
      `;
      tbody.appendChild(tr);
    }
  };

  renderList(devices);

  document.getElementById('sec-dev-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderList(devices.filter(d => d.name.toLowerCase().includes(q) || (d.osVersion || '').toLowerCase().includes(q)));
  });
}

/* ══════════════════════════════════════════════════
   ACCOUNT PROTECTION
   ══════════════════════════════════════════════════ */
export function renderAccountProtection() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Create policy', icon: Icons.add, onClick: createAccountProtectionPolicy, type: 'primary' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderAccountProtection, type: 'default' },
  ]);

  let policies = Store.getAll('accountProtectionPolicies');
  if (policies.length === 0) {
    policies = [
      { id: 'ap-1', name: 'Corporate Windows Hello for Business', type: 'Account protection', platform: 'Windows 10/11', assigned: 'All Corporate Users', status: 'Active' },
      { id: 'ap-2', name: 'Windows Defender Credential Guard - High Security', type: 'Credential Guard', platform: 'Windows 11', assigned: 'Domain Controllers & Admins', status: 'Active' },
      { id: 'ap-3', name: 'Windows LAPS Password Complexity Policy', type: 'Local admin password', platform: 'Windows 10/11', assigned: 'All Managed Endpoints', status: 'Active' },
    ];
    policies.forEach(p => Store.create('accountProtectionPolicies', p));
  }

  el.innerHTML = `
    <h1 class="page-title">Account protection</h1>
    <p class="page-subtitle">Configure Windows Hello for Business, Credential Guard, and local administrator protection.</p>

    <div class="content-card" style="padding:0;">
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Policy name</th><th>Profile type</th><th>Platform</th><th>Assigned to</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            ${policies.map(p => `
              <tr>
                <td><strong>${escapeHtml(p.name)}</strong></td>
                <td><span class="tag">${escapeHtml(p.type)}</span></td>
                <td>${escapeHtml(p.platform)}</td>
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
      if (confirm('Delete policy?')) {
        Store.delete('accountProtectionPolicies', btn.dataset.id);
        toast()?.success('Deleted', 'Account protection policy removed.');
        renderAccountProtection();
      }
    });
  });
}

function createAccountProtectionPolicy() {
  document.getElementById('sec-modal')?.remove();
  const overlay = createElement('div', { id: 'sec-modal', className: 'blade-overlay visible', style: 'z-index:1500;display:flex;align-items:center;justify-content:center;' });
  const modal = createElement('div', { className: 'content-card', style: 'width:460px;max-width:90vw;background:var(--color-bg-surface);box-shadow:var(--shadow-64);border-radius:8px;padding:20px;' });

  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:1px solid var(--color-border);padding-bottom:10px;">
      <h3 style="font-size:16px;font-weight:600;margin:0;">Create Account Protection Policy</h3>
      <button class="blade-panel__close" id="sec-modal-close" style="width:28px;height:28px;">${Icons.close}</button>
    </div>
    <div class="form-group"><label class="form-label required">Policy Name</label><input class="form-input" id="ap-name" placeholder="e.g. Windows Hello & Credential Guard Baseline"></div>
    <div class="form-group"><label class="form-label">Profile Type</label><select class="form-input form-select" id="ap-type"><option>Account protection</option><option>Credential Guard</option><option>Local admin password (LAPS)</option></select></div>
    <div class="form-group"><label class="form-label">Platform</label><select class="form-input form-select" id="ap-plat"><option>Windows 10/11</option><option>Windows 11 only</option></select></div>
    <div class="form-group"><label class="form-label">Assignment</label><select class="form-input form-select" id="ap-assign"><option>All Corporate Users</option><option>Domain Controllers & Admins</option><option>All Managed Endpoints</option><option>Finance Team</option></select></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
      <button class="btn btn-default" id="sec-cancel">Cancel</button>
      <button class="btn btn-primary" id="sec-submit">Create policy</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  modal.querySelector('#sec-modal-close')?.addEventListener('click', close);
  modal.querySelector('#sec-cancel')?.addEventListener('click', close);

  modal.querySelector('#sec-submit')?.addEventListener('click', () => {
    const name = modal.querySelector('#ap-name')?.value?.trim();
    if (!name) { toast()?.error('Validation', 'Policy name is required.'); return; }
    Store.create('accountProtectionPolicies', {
      id: generateId(),
      name,
      type: modal.querySelector('#ap-type')?.value,
      platform: modal.querySelector('#ap-plat')?.value,
      assigned: modal.querySelector('#ap-assign')?.value,
      status: 'Active',
    });
    toast()?.success('Created', `Policy "${name}" created.`);
    close();
    renderAccountProtection();
  });
}

/* ══════════════════════════════════════════════════
   APP CONTROL FOR BUSINESS (WDAC)
   ══════════════════════════════════════════════════ */
export function renderAppControl() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Create policy', icon: Icons.add, onClick: createAppControlPolicy, type: 'primary' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderAppControl, type: 'default' },
  ]);

  let policies = Store.getAll('appControlPolicies');
  if (policies.length === 0) {
    policies = [
      { id: 'ac-1', name: 'Contoso Enterprise Application Control - Audit Mode', mode: 'Audit only', platform: 'Windows 11', trustedPublishers: 'Microsoft, Adobe, Google', assigned: 'Finance Department', status: 'Active' },
      { id: 'ac-2', name: 'High-Security Kiosk WDAC Policy', mode: 'Enforce', platform: 'Windows 10/11', trustedPublishers: 'Whitelisted Binaries Only', assigned: 'Kiosk Devices', status: 'Active' },
    ];
    policies.forEach(p => Store.create('appControlPolicies', p));
  }

  el.innerHTML = `
    <h1 class="page-title">App Control for Business</h1>
    <p class="page-subtitle">Mitigate malware and unauthorized applications by enforcing Windows Defender Application Control (WDAC) code integrity rules.</p>

    <div class="content-card" style="padding:0;">
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Policy name</th><th>Enforcement mode</th><th>Platform</th><th>Trust rules</th><th>Target group</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            ${policies.map(p => `
              <tr>
                <td><strong>${escapeHtml(p.name)}</strong></td>
                <td><span class="tag" style="${p.mode==='Enforce'?'background:#DFF6DD;color:#107C10;':'background:#FFF4CE;color:#7A5E00;'}">${escapeHtml(p.mode)}</span></td>
                <td>${escapeHtml(p.platform)}</td>
                <td>${escapeHtml(p.trustedPublishers)}</td>
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
      if (confirm('Delete policy?')) {
        Store.delete('appControlPolicies', btn.dataset.id);
        toast()?.success('Deleted', 'App control policy removed.');
        renderAppControl();
      }
    });
  });
}

function createAppControlPolicy() {
  document.getElementById('sec-modal')?.remove();
  const overlay = createElement('div', { id: 'sec-modal', className: 'blade-overlay visible', style: 'z-index:1500;display:flex;align-items:center;justify-content:center;' });
  const modal = createElement('div', { className: 'content-card', style: 'width:460px;max-width:90vw;background:var(--color-bg-surface);box-shadow:var(--shadow-64);border-radius:8px;padding:20px;' });

  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:1px solid var(--color-border);padding-bottom:10px;">
      <h3 style="font-size:16px;font-weight:600;margin:0;">Create App Control Policy</h3>
      <button class="blade-panel__close" id="sec-modal-close" style="width:28px;height:28px;">${Icons.close}</button>
    </div>
    <div class="form-group"><label class="form-label required">Policy Name</label><input class="form-input" id="wdac-name" placeholder="e.g. Enterprise App Whitelisting"></div>
    <div class="form-group"><label class="form-label">Enforcement Mode</label><select class="form-input form-select" id="wdac-mode"><option>Enforce</option><option selected>Audit only</option></select></div>
    <div class="form-group"><label class="form-label">Trust Rules</label><select class="form-input form-select" id="wdac-rules"><option>Microsoft, WHQL & Intelligent Security Graph (ISG)</option><option>Whitelisted Binaries & Hash Only</option><option>Store apps + Enterprise Signed</option></select></div>
    <div class="form-group"><label class="form-label">Target Group</label><select class="form-input form-select" id="wdac-assign"><option>All Corporate Devices</option><option>Finance Department</option><option>Kiosk Devices</option></select></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
      <button class="btn btn-default" id="sec-cancel">Cancel</button>
      <button class="btn btn-primary" id="sec-submit">Create policy</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  modal.querySelector('#sec-modal-close')?.addEventListener('click', close);
  modal.querySelector('#sec-cancel')?.addEventListener('click', close);

  modal.querySelector('#sec-submit')?.addEventListener('click', () => {
    const name = modal.querySelector('#wdac-name')?.value?.trim();
    if (!name) { toast()?.error('Validation', 'Policy name is required.'); return; }
    Store.create('appControlPolicies', {
      id: generateId(),
      name,
      mode: modal.querySelector('#wdac-mode')?.value,
      platform: 'Windows 11',
      trustedPublishers: modal.querySelector('#wdac-rules')?.value,
      assigned: modal.querySelector('#wdac-assign')?.value,
      status: 'Active',
    });
    toast()?.success('Created', `App Control policy "${name}" created.`);
    close();
    renderAppControl();
  });
}

/* ══════════════════════════════════════════════════
   FEATURE UPDATES
   ══════════════════════════════════════════════════ */
export function renderFeatureUpdates() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Create profile', icon: Icons.add, onClick: createFeatureUpdatesProfile, type: 'primary' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderFeatureUpdates, type: 'default' },
  ]);

  let profiles = Store.getAll(Collections.FEATURE_UPDATES);
  if (profiles.length === 0) {
    profiles = [
      { id: 'fu-1', name: 'Target Windows 11 23H2 Deployment', targetVersion: 'Windows 11 23H2', rollout: 'Immediately when available', assigned: 'All Windows Endpoints', devicesAssigned: 8, devicesCompliant: 6 },
      { id: 'fu-2', name: 'Pilot Windows 11 24H2 Early Adopters', targetVersion: 'Windows 11 24H2', rollout: 'Gradual schedule (10% per day)', assigned: 'IT Department', devicesAssigned: 2, devicesCompliant: 2 },
    ];
    profiles.forEach(p => Store.create(Collections.FEATURE_UPDATES, p));
  }

  el.innerHTML = `
    <h1 class="page-title">Feature updates for Windows 10 and later</h1>
    <p class="page-subtitle">Select the specific Windows operating system version that devices should update to and maintain.</p>

    <div class="content-card" style="padding:0;">
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Profile name</th><th>Target OS version</th><th>Rollout options</th><th>Assigned group</th><th>Progress</th><th></th></tr>
          </thead>
          <tbody>
            ${profiles.map(p => `
              <tr>
                <td><strong>${escapeHtml(p.name)}</strong></td>
                <td><span class="tag" style="background:var(--color-primary-lighter);color:var(--color-primary);">${escapeHtml(p.targetVersion)}</span></td>
                <td>${escapeHtml(p.rollout)}</td>
                <td>${escapeHtml(p.assigned)}</td>
                <td>
                  <div style="font-size:12px;font-weight:600;">${p.devicesCompliant || 0} / ${p.devicesAssigned || 8} devices updated</div>
                </td>
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
      if (confirm('Delete profile?')) {
        Store.delete(Collections.FEATURE_UPDATES, btn.dataset.id);
        toast()?.success('Deleted', 'Feature update profile removed.');
        renderFeatureUpdates();
      }
    });
  });
}

function createFeatureUpdatesProfile() {
  document.getElementById('sec-modal')?.remove();
  const overlay = createElement('div', { id: 'sec-modal', className: 'blade-overlay visible', style: 'z-index:1500;display:flex;align-items:center;justify-content:center;' });
  const modal = createElement('div', { className: 'content-card', style: 'width:460px;max-width:90vw;background:var(--color-bg-surface);box-shadow:var(--shadow-64);border-radius:8px;padding:20px;' });

  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:1px solid var(--color-border);padding-bottom:10px;">
      <h3 style="font-size:16px;font-weight:600;margin:0;">Create Feature Update Profile</h3>
      <button class="blade-panel__close" id="sec-modal-close" style="width:28px;height:28px;">${Icons.close}</button>
    </div>
    <div class="form-group"><label class="form-label required">Profile Name</label><input class="form-input" id="fu-name" placeholder="e.g. Windows 11 24H2 Rollout"></div>
    <div class="form-group"><label class="form-label">Target OS Version</label><select class="form-input form-select" id="fu-ver"><option selected>Windows 11 24H2</option><option>Windows 11 23H2</option><option>Windows 10 22H2</option></select></div>
    <div class="form-group"><label class="form-label">Rollout Options</label><select class="form-input form-select" id="fu-roll"><option>Immediately when available</option><option>Gradual schedule (10% per day)</option><option>Make available on specific date</option></select></div>
    <div class="form-group"><label class="form-label">Assigned Group</label><select class="form-input form-select" id="fu-assign"><option>All Windows Endpoints</option><option>IT Department</option><option>Pilot Ring</option></select></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
      <button class="btn btn-default" id="sec-cancel">Cancel</button>
      <button class="btn btn-primary" id="sec-submit">Create profile</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  modal.querySelector('#sec-modal-close')?.addEventListener('click', close);
  modal.querySelector('#sec-cancel')?.addEventListener('click', close);

  modal.querySelector('#sec-submit')?.addEventListener('click', () => {
    const name = modal.querySelector('#fu-name')?.value?.trim();
    if (!name) { toast()?.error('Validation', 'Profile name is required.'); return; }
    Store.create(Collections.FEATURE_UPDATES, {
      id: generateId(),
      name,
      targetVersion: modal.querySelector('#fu-ver')?.value,
      rollout: modal.querySelector('#fu-roll')?.value,
      assigned: modal.querySelector('#fu-assign')?.value,
      devicesAssigned: 8,
      devicesCompliant: 0,
    });
    toast()?.success('Created', `Feature update profile "${name}" created.`);
    close();
    renderFeatureUpdates();
  });
}

/* ══════════════════════════════════════════════════
   UPDATE RINGS FOR WINDOWS 10 AND LATER
   ══════════════════════════════════════════════════ */
export function renderUpdateRings() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Create profile', icon: Icons.add, onClick: createUpdateRingModal, type: 'primary' },
    { label: 'Pause quality updates', icon: Icons.warning, onClick: pauseRingModal, type: 'default' },
    { label: 'Resume quality updates', icon: Icons.sync, onClick: resumeRingModal, type: 'default' },
    { label: 'Export', icon: Icons.download, onClick: () => {
        const rings = Store.getAll(Collections.UPDATE_RINGS);
        exportCsv('update_rings.csv', ['Name', 'Servicing channel', 'Quality deferral (days)', 'Feature deferral (days)', 'Pause status', 'Assigned groups'], rings.map(r => [
          r.name,
          r.settings?.servicingChannel || 'General Availability Channel',
          r.settings?.qualityDeferral ?? 7,
          r.settings?.featureDeferral ?? 30,
          r.pauseQualityUpdates ? `Paused until ${r.pauseQualityUpdates}` : 'Active',
          (r.assignedGroups || []).join('; ')
        ]));
        toast()?.success('Export', 'Update rings exported to CSV.');
      }, type: 'default' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderUpdateRings, type: 'default' },
  ]);

  const rings = Store.getAll(Collections.UPDATE_RINGS);
  el.innerHTML = `
    <h1 class="page-title">Update rings for Windows 10 and later</h1>
    <p class="page-subtitle">Manage servicing channels, deferral periods, deadline settings, and pause quality updates across your Windows fleet.</p>

    <div class="content-card" style="padding:0;">
      <div class="grid-toolbar" style="padding:12px 16px;">
        <div class="grid-toolbar__search">
          <span style="display:flex">${Icons.search}</span>
          <input type="text" placeholder="Search update rings..." id="ur-search">
        </div>
        <span style="font-size:12px;color:var(--color-text-secondary);margin-left:auto;">${rings.length} rings</span>
      </div>
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr>
              <th>Profile name</th>
              <th>Servicing channel</th>
              <th>Quality deferral</th>
              <th>Feature deferral</th>
              <th>Quality update state</th>
              <th>Assigned groups</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="ur-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  const renderTable = (items) => {
    const tbody = document.getElementById('ur-tbody');
    if (!tbody) return;
    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--color-text-secondary);">No update rings configured</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    for (const r of items) {
      const tr = createElement('tr');
      const isPaused = Boolean(r.pauseQualityUpdates);
      const statePill = isPaused
        ? `<span class="status-pill status-pill--warning"><span class="status-pill__dot"></span>Paused (${r.pauseQualityUpdates})</span>`
        : `<span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Active</span>`;

      tr.innerHTML = `
        <td><span class="cell-link" style="font-weight:600;">${escapeHtml(r.name)}</span></td>
        <td>${escapeHtml(r.settings?.servicingChannel || 'General Availability Channel')}</td>
        <td>${r.settings?.qualityDeferral ?? 7} days</td>
        <td>${r.settings?.featureDeferral ?? 30} days</td>
        <td>${statePill}</td>
        <td>${(r.assignedGroups || []).join(', ') || 'All devices'}</td>
        <td>
          <div style="display:flex;gap:4px;">
            <button class="btn btn-sm btn-default ur-pause-btn" data-id="${r.id}" title="${isPaused ? 'Resume updates' : 'Pause quality updates for 35 days'}">${isPaused ? 'Resume' : 'Pause'}</button>
            <button class="btn-icon btn-delete" data-id="${r.id}" title="Delete ring">${Icons.delete}</button>
          </div>
        </td>
      `;

      tr.querySelector('.cell-link')?.addEventListener('click', () => {
        showPolicyDetailsBlade(r, Collections.UPDATE_RINGS, renderUpdateRings);
      });

      tr.querySelector('.ur-pause-btn')?.addEventListener('click', () => {
        if (isPaused) {
          Store.update(Collections.UPDATE_RINGS, r.id, { pauseQualityUpdates: null });
          toast()?.success('Resumed', `Quality updates resumed for "${r.name}".`);
        } else {
          const pauseUntil = new Date(Date.now() + 35 * 86400000).toLocaleDateString();
          Store.update(Collections.UPDATE_RINGS, r.id, { pauseQualityUpdates: pauseUntil });
          toast()?.warning('Paused', `Quality updates paused for "${r.name}" until ${pauseUntil} (35 days).`);
        }
        renderUpdateRings();
      });

      tr.querySelector('.btn-delete')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete update ring "${r.name}"?`)) {
          Store.delete(Collections.UPDATE_RINGS, r.id);
          toast()?.success('Deleted', `Update ring "${r.name}" deleted.`);
          renderUpdateRings();
        }
      });

      tbody.appendChild(tr);
    }
  };

  renderTable(rings);
  document.getElementById('ur-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderTable(rings.filter(r => r.name.toLowerCase().includes(q)));
  });
}

function createUpdateRingModal() {
  document.getElementById('sec-modal')?.remove();
  const overlay = createElement('div', { id: 'sec-modal', className: 'blade-overlay visible', style: 'z-index:1500;display:flex;align-items:center;justify-content:center;' });
  const modal = createElement('div', { className: 'content-card', style: 'width:520px;max-width:92vw;background:var(--color-bg-surface);box-shadow:var(--shadow-64);border-radius:8px;padding:24px;' });

  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;border-bottom:1px solid var(--color-border);padding-bottom:12px;">
      <h3 style="font-size:16px;font-weight:600;margin:0;">Create Update Ring Profile</h3>
      <button class="blade-panel__close" id="sec-modal-close" style="width:28px;height:28px;">${Icons.close}</button>
    </div>
    <div class="form-group"><label class="form-label required">Profile name</label><input class="form-input" id="ring-name" placeholder="e.g. Executive Device Update Ring"></div>
    <div class="form-group"><label class="form-label">Servicing channel</label><select class="form-input form-select" id="ring-channel"><option selected>General Availability Channel</option><option>Windows Insider - Release Preview</option><option>Windows Insider - Beta Channel</option></select></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div class="form-group"><label class="form-label">Quality update deferral (days)</label><input type="number" min="0" max="30" value="7" class="form-input" id="ring-qd"></div>
      <div class="form-group"><label class="form-label">Feature update deferral (days)</label><input type="number" min="0" max="365" value="30" class="form-input" id="ring-fd"></div>
    </div>
    <div class="form-group"><label class="form-label">Automatic update behavior</label><select class="form-input form-select" id="ring-auto"><option selected>Auto install and restart at scheduled time</option><option>Auto install and restart at maintenance time</option><option>Auto install and reboot without end-user control</option></select></div>
    <div class="form-group"><label class="form-label">Active hours</label><div style="font-size:13px;color:var(--color-text-secondary);padding:6px 0;">8:00 AM – 5:00 PM (No automatic restarts during active hours)</div></div>
    <div class="form-group"><label class="form-label">Deadline grace period (days)</label><input type="number" min="0" max="7" value="2" class="form-input" id="ring-dl"></div>
    <div class="form-group"><label class="form-label">Target assignment</label><select class="form-input form-select" id="ring-assign"><option>All corporate Windows devices</option><option>IT pilot group</option><option>Executive Leadership</option><option>Finance and Accounting</option></select></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px;">
      <button class="btn btn-default" id="sec-cancel">Cancel</button>
      <button class="btn btn-primary" id="sec-submit">Create update ring</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  modal.querySelector('#sec-modal-close')?.addEventListener('click', close);
  modal.querySelector('#sec-cancel')?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  modal.querySelector('#sec-submit')?.addEventListener('click', () => {
    const name = modal.querySelector('#ring-name')?.value?.trim();
    if (!name) { toast()?.error('Validation', 'Profile name is required.'); return; }
    Store.create(Collections.UPDATE_RINGS, {
      id: generateId(),
      name,
      status: 'Active',
      assignedGroups: [modal.querySelector('#ring-assign')?.value || 'All corporate Windows devices'],
      createdAt: new Date().toISOString(),
      settings: {
        servicingChannel: modal.querySelector('#ring-channel')?.value,
        qualityDeferral: parseInt(modal.querySelector('#ring-qd')?.value || '7', 10),
        featureDeferral: parseInt(modal.querySelector('#ring-fd')?.value || '30', 10),
        autoRestart: true,
        deadlineDays: parseInt(modal.querySelector('#ring-dl')?.value || '2', 10),
      }
    });
    toast()?.success('Created', `Update ring "${name}" created.`);
    close();
    renderUpdateRings();
  });
}

function pauseRingModal() {
  const rings = Store.getAll(Collections.UPDATE_RINGS);
  if (rings.length === 0) { toast()?.warning('No rings', 'No update rings configured.'); return; }
  const activeRings = rings.filter(r => !r.pauseQualityUpdates);
  if (activeRings.length === 0) { toast()?.info('All paused', 'All update rings are already paused.'); return; }

  const ringName = activeRings[0].name;
  if (confirm(`Pause quality updates for "${ringName}" for 35 days? End-user devices will defer receiving quality updates.`)) {
    const pauseUntil = new Date(Date.now() + 35 * 86400000).toLocaleDateString();
    Store.update(Collections.UPDATE_RINGS, activeRings[0].id, { pauseQualityUpdates: pauseUntil });
    toast()?.warning('Paused', `Quality updates paused for "${ringName}" until ${pauseUntil}.`);
    renderUpdateRings();
  }
}

function resumeRingModal() {
  const rings = Store.getAll(Collections.UPDATE_RINGS);
  const pausedRings = rings.filter(r => r.pauseQualityUpdates);
  if (pausedRings.length === 0) { toast()?.info('None paused', 'No update rings are currently paused.'); return; }

  const ringName = pausedRings[0].name;
  if (confirm(`Resume quality updates for "${ringName}"? Devices will immediately resume normal update scan and installation.`)) {
    Store.update(Collections.UPDATE_RINGS, pausedRings[0].id, { pauseQualityUpdates: null });
    toast()?.success('Resumed', `Quality updates resumed for "${ringName}".`);
    renderUpdateRings();
  }
}

/* ══════════════════════════════════════════════════
   QUALITY UPDATES (EXPEDITED)
   ══════════════════════════════════════════════════ */
export function renderQualityUpdates() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Create expedited policy', icon: Icons.add, onClick: createQualityUpdatesPolicy, type: 'primary' },
    { label: 'Export', icon: Icons.download, onClick: () => {
        const pols = Store.getAll(Collections.QUALITY_UPDATES);
        exportCsv('expedited_quality_updates.csv', ['Profile name', 'Expedited patch', 'Deadline', 'Target group', 'Status'], pols.map(p => [p.name, p.patch, p.deadline, p.assigned, p.status]));
        toast()?.success('Export', 'Quality update policies exported to CSV.');
      }, type: 'default' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderQualityUpdates, type: 'default' },
  ]);

  let policies = Store.getAll(Collections.QUALITY_UPDATES);
  if (policies.length === 0) {
    policies = [
      { id: 'qu-1', name: 'Expedite August 2024 Security Patch (KB5041585)', patch: '2024.08 B Security Update', deadline: '2 days', assigned: 'All Windows Devices', status: '92% Complete' },
    ];
    policies.forEach(p => Store.create(Collections.QUALITY_UPDATES, p));
  }

  el.innerHTML = `
    <h1 class="page-title">Quality updates for Windows 10 and later</h1>
    <p class="page-subtitle">Expedite the installation of critical monthly security patches and zero-day vulnerabilities across your fleet.</p>

    <div class="content-card" style="padding:0;">
      <div class="grid-toolbar" style="padding:12px 16px;">
        <div class="grid-toolbar__search">
          <span style="display:flex">${Icons.search}</span>
          <input type="text" placeholder="Search expedited updates..." id="qu-search">
        </div>
        <span style="font-size:12px;color:var(--color-text-secondary);margin-left:auto;">${policies.length} policies</span>
      </div>
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Profile name</th><th>Expedited patch</th><th>Deadline</th><th>Target group</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody id="qu-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  const renderRows = (items) => {
    const tbody = document.getElementById('qu-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    for (const p of items) {
      const tr = createElement('tr');
      tr.innerHTML = `
        <td><span class="cell-link" style="font-weight:600;">${escapeHtml(p.name)}</span></td>
        <td>${escapeHtml(p.patch)}</td>
        <td>${escapeHtml(p.deadline)}</td>
        <td>${escapeHtml(p.assigned)}</td>
        <td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>${escapeHtml(p.status)}</span></td>
        <td><button class="btn-icon btn-delete" data-id="${p.id}" title="Delete policy">${Icons.delete}</button></td>
      `;
      tr.querySelector('.cell-link')?.addEventListener('click', () => {
        showPolicyDetailsBlade(p, Collections.QUALITY_UPDATES, renderQualityUpdates);
      });
      tr.querySelector('.btn-delete')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete policy "${p.name}"?`)) {
          Store.delete(Collections.QUALITY_UPDATES, p.id);
          toast()?.success('Deleted', 'Quality update policy removed.');
          renderQualityUpdates();
        }
      });
      tbody.appendChild(tr);
    }
  };

  renderRows(policies);
  document.getElementById('qu-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderRows(policies.filter(p => p.name.toLowerCase().includes(q) || p.patch.toLowerCase().includes(q)));
  });
}

function createQualityUpdatesPolicy() {
  document.getElementById('sec-modal')?.remove();
  const overlay = createElement('div', { id: 'sec-modal', className: 'blade-overlay visible', style: 'z-index:1500;display:flex;align-items:center;justify-content:center;' });
  const modal = createElement('div', { className: 'content-card', style: 'width:460px;max-width:90vw;background:var(--color-bg-surface);box-shadow:var(--shadow-64);border-radius:8px;padding:20px;' });

  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:1px solid var(--color-border);padding-bottom:10px;">
      <h3 style="font-size:16px;font-weight:600;margin:0;">Create Expedited Quality Update</h3>
      <button class="blade-panel__close" id="sec-modal-close" style="width:28px;height:28px;">${Icons.close}</button>
    </div>
    <div class="form-group"><label class="form-label required">Policy Name</label><input class="form-input" id="qu-name" placeholder="e.g. Expedite Zero-Day Patch (KB5042890)"></div>
    <div class="form-group"><label class="form-label">Quality Update to Expedite</label><select class="form-input form-select" id="qu-patch"><option>2026.08 B Security Update</option><option>2026.07 B Security Update</option><option>Latest Security Patch (Zero-day emergency)</option></select></div>
    <div class="form-group"><label class="form-label">Reboot Deadline</label><select class="form-input form-select" id="qu-deadline"><option>0 days (Immediate forced reboot)</option><option selected>1 day</option><option>2 days</option></select></div>
    <div class="form-group"><label class="form-label">Target Group</label><select class="form-input form-select" id="qu-assign"><option>All Windows Devices</option><option>Corporate Laptops</option><option>Critical Servers</option></select></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
      <button class="btn btn-default" id="sec-cancel">Cancel</button>
      <button class="btn btn-primary" id="sec-submit">Create expedited policy</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  modal.querySelector('#sec-modal-close')?.addEventListener('click', close);
  modal.querySelector('#sec-cancel')?.addEventListener('click', close);

  modal.querySelector('#sec-submit')?.addEventListener('click', () => {
    const name = modal.querySelector('#qu-name')?.value?.trim();
    if (!name) { toast()?.error('Validation', 'Policy name is required.'); return; }
    Store.create(Collections.QUALITY_UPDATES, {
      id: generateId(),
      name,
      patch: modal.querySelector('#qu-patch')?.value,
      deadline: modal.querySelector('#qu-deadline')?.value,
      assigned: modal.querySelector('#qu-assign')?.value,
      status: 'Queued (0% complete)',
    });
    toast()?.success('Created', `Expedited update policy "${name}" deployed.`);
    close();
    renderQualityUpdates();
  });
}

/* ══════════════════════════════════════════════════
   WINDOWS AUTOPATCH
   ══════════════════════════════════════════════════ */
export function renderAutopatch() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'View release schedule', icon: Icons.calendar, onClick: () => toast()?.info('Autopatch', 'Current release cycle: Week 2 Broad.'), type: 'default' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderAutopatch, type: 'default' },
  ]);

  const rings = [
    { name: 'Ring 0: Test', percent: '1% of fleet', devices: '1 device', cadence: 'Release day', status: 'Healthy' },
    { name: 'Ring 1: First', percent: '9% of fleet', devices: '1 device', cadence: '+2 days', status: 'Healthy' },
    { name: 'Ring 2: Fast', percent: '30% of fleet', devices: '2 devices', cadence: '+5 days', status: 'Healthy' },
    { name: 'Ring 3: Broad', percent: '60% of fleet', devices: '4 devices', cadence: '+7 days', status: 'In progress' },
  ];

  el.innerHTML = `
    <h1 class="page-title">Windows Autopatch</h1>
    <p class="page-subtitle">Automate Windows, Microsoft 365 Apps, Teams, and Edge patch management across progressive release rings.</p>

    <div class="tile-grid" style="grid-template-columns:repeat(4, 1fr);margin-bottom:20px;">
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Autopatch service</span></div>
        <div class="tile__value" style="color:var(--color-success)">Active</div>
        <div class="tile__label">Microsoft-managed</div>
      </div>
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Registered devices</span></div>
        <div class="tile__value" style="color:var(--color-primary)">8 devices</div>
        <div class="tile__label">Assigned to rings</div>
      </div>
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Rollback alerts</span></div>
        <div class="tile__value" style="color:var(--color-success)">0 alerts</div>
        <div class="tile__label">No adverse telemetry</div>
      </div>
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Quality update status</span></div>
        <div class="tile__value" style="color:var(--color-primary)">96% up to date</div>
        <div class="tile__label">Within compliance SLO</div>
      </div>
    </div>

    <div class="content-card">
      <h2 class="content-card__title" style="margin-bottom:12px;">Deployment rings</h2>
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Ring name</th><th>Fleet distribution</th><th>Device count</th><th>Deployment cadence</th><th>Ring health</th></tr>
          </thead>
          <tbody>
            ${rings.map(r => `
              <tr>
                <td><strong>${escapeHtml(r.name)}</strong></td>
                <td>${escapeHtml(r.percent)}</td>
                <td>${escapeHtml(r.devices)}</td>
                <td><span class="tag">${escapeHtml(r.cadence)}</span></td>
                <td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>${escapeHtml(r.status)}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════
   DELIVERY OPTIMIZATION
   ══════════════════════════════════════════════════ */
export function renderDeliveryOptimization() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Create profile', icon: Icons.add, onClick: createDeliveryOptimizationProfile, type: 'primary' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderDeliveryOptimization, type: 'default' },
  ]);

  let profiles = Store.getAll('deliveryOptimizationProfiles');
  if (profiles.length === 0) {
    profiles = [
      { id: 'do-1', name: 'Corporate Office Delivery Optimization', mode: 'HTTP blended with Peering (Mode 1)', bandwidthCap: 'Limit to 80% bandwidth', peerSelection: 'Subnet / Domain', assigned: 'All Corporate Devices' },
      { id: 'do-2', name: 'Remote Worker Bandwidth Throttling', mode: 'HTTP blended with Cloud Peering (Mode 2)', bandwidthCap: 'Limit to 50% bandwidth', peerSelection: 'Group ID', assigned: 'All Remote BYOD' },
    ];
    profiles.forEach(p => Store.create('deliveryOptimizationProfiles', p));
  }

  el.innerHTML = `
    <h1 class="page-title">Delivery Optimization</h1>
    <p class="page-subtitle">Configure peer-to-peer content distribution for Windows Updates, Microsoft Store apps, and Win32 applications.</p>

    <div class="tile-grid" style="grid-template-columns:repeat(3, 1fr);margin-bottom:20px;">
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Bandwidth saved</span></div>
        <div class="tile__value" style="color:var(--color-success)">64%</div>
        <div class="tile__label">From local LAN peers</div>
      </div>
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Total data downloaded</span></div>
        <div class="tile__value" style="color:var(--color-primary)">42.8 GB</div>
        <div class="tile__label">Last 30 days</div>
      </div>
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Peer cache hit ratio</span></div>
        <div class="tile__value" style="color:var(--color-primary)">78%</div>
        <div class="tile__label">High efficiency</div>
      </div>
    </div>

    <div class="content-card">
      <h2 class="content-card__title" style="margin-bottom:12px;">Active Delivery Optimization profiles</h2>
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Profile name</th><th>Download mode</th><th>Background bandwidth cap</th><th>Peer selection</th><th>Assigned</th><th></th></tr>
          </thead>
          <tbody>
            ${profiles.map(p => `
              <tr>
                <td><strong>${escapeHtml(p.name)}</strong></td>
                <td><span class="tag">${escapeHtml(p.mode)}</span></td>
                <td>${escapeHtml(p.bandwidthCap)}</td>
                <td>${escapeHtml(p.peerSelection)}</td>
                <td>${escapeHtml(p.assigned)}</td>
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
      if (confirm('Delete profile?')) {
        Store.delete('deliveryOptimizationProfiles', btn.dataset.id);
        toast()?.success('Deleted', 'Delivery Optimization profile removed.');
        renderDeliveryOptimization();
      }
    });
  });
}

function createDeliveryOptimizationProfile() {
  document.getElementById('sec-modal')?.remove();
  const overlay = createElement('div', { id: 'sec-modal', className: 'blade-overlay visible', style: 'z-index:1500;display:flex;align-items:center;justify-content:center;' });
  const modal = createElement('div', { className: 'content-card', style: 'width:460px;max-width:90vw;background:var(--color-bg-surface);box-shadow:var(--shadow-64);border-radius:8px;padding:20px;' });

  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:1px solid var(--color-border);padding-bottom:10px;">
      <h3 style="font-size:16px;font-weight:600;margin:0;">Create Delivery Optimization Profile</h3>
      <button class="blade-panel__close" id="sec-modal-close" style="width:28px;height:28px;">${Icons.close}</button>
    </div>
    <div class="form-group"><label class="form-label required">Profile Name</label><input class="form-input" id="do-name" placeholder="e.g. Branch Office Peering Profile"></div>
    <div class="form-group"><label class="form-label">Download Mode</label><select class="form-input form-select" id="do-mode"><option selected>HTTP blended with Peering (Mode 1)</option><option>HTTP blended with Cloud Peering (Mode 2)</option><option>HTTP Only (No peering - Mode 0)</option></select></div>
    <div class="form-group"><label class="form-label">Bandwidth Cap</label><select class="form-input form-select" id="do-cap"><option selected>Limit to 80% bandwidth</option><option>Limit to 50% bandwidth</option><option>Unlimited</option></select></div>
    <div class="form-group"><label class="form-label">Assigned Group</label><select class="form-input form-select" id="do-assign"><option>All Corporate Devices</option><option>Branch Offices</option><option>Remote BYOD</option></select></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
      <button class="btn btn-default" id="sec-cancel">Cancel</button>
      <button class="btn btn-primary" id="sec-submit">Create profile</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  modal.querySelector('#sec-modal-close')?.addEventListener('click', close);
  modal.querySelector('#sec-cancel')?.addEventListener('click', close);

  modal.querySelector('#sec-submit')?.addEventListener('click', () => {
    const name = modal.querySelector('#do-name')?.value?.trim();
    if (!name) { toast()?.error('Validation', 'Profile name is required.'); return; }
    Store.create('deliveryOptimizationProfiles', {
      id: generateId(),
      name,
      mode: modal.querySelector('#do-mode')?.value,
      bandwidthCap: modal.querySelector('#do-cap')?.value,
      peerSelection: 'Subnet / Group ID',
      assigned: modal.querySelector('#do-assign')?.value,
    });
    toast()?.success('Created', `Delivery Optimization profile "${name}" created.`);
    close();
    renderDeliveryOptimization();
  });
}

