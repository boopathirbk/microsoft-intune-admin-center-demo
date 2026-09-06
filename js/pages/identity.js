/* ============================================================
   Identity Page Module
   Overview, Windows Hello for Business, Windows LAPS
   ============================================================ */

import { Icons, createElement, clearElement, $, generateId, exportCsv, escapeHtml } from '../utils.js';
import { Store, Collections } from '../store.js';
import { router } from '../router.js';
import { Wizard, renderScopeTagsStep, collectScopeTags, renderAssignmentsStep, collectAssignments } from '../components/wizard.js';

function getContentEl() { return $('#page-content'); }
function getCommandBar() { return window.IntuneApp?.commandBar; }
function toast() { return window.IntuneApp?.toastManager; }

/* ══════════════════════════════════════════════════
   IDENTITY OVERVIEW
   ══════════════════════════════════════════════════ */
export function renderIdentityOverview() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([{ label: 'Refresh', icon: Icons.refresh, onClick: renderIdentityOverview, type: 'default' }]);

  const users = Store.getAll(Collections.USERS);
  const roles = Store.getAll(Collections.ROLES);
  const scopeTags = Store.getAll(Collections.SCOPE_TAGS);

  el.innerHTML = `
    <h1 class="page-title">Identity and compliance</h1>
    <div class="tile-grid">
      <div class="tile" id="t-users"><div class="tile__header"><span class="tile__title">Total users</span></div><div class="tile__value" style="color:var(--color-primary)">${users.length}</div><div class="tile__label">Synced from Microsoft Entra</div></div>
      <div class="tile" id="t-roles"><div class="tile__header"><span class="tile__title">RBAC Roles</span></div><div class="tile__value" style="color:var(--color-primary)">${roles.length}</div><div class="tile__label">Role definitions</div></div>
      <div class="tile" id="t-scopes"><div class="tile__header"><span class="tile__title">Scope tags</span></div><div class="tile__value" style="color:var(--color-primary)">${scopeTags.length}</div><div class="tile__label">Active scope tags</div></div>
    </div>

    <div class="content-card">
      <div class="content-card__header"><h2 class="content-card__title">Security and Access</h2></div>
      <div class="tile-grid" style="grid-template-columns:1fr 1fr;">
        <div class="tile" id="t-hello">
          <div class="tile__header" style="display:flex;align-items:center;gap:8px;"><span style="color:var(--color-primary)">${Icons.security}</span><span class="tile__title">Windows Hello for Business</span></div>
          <div style="margin-top:12px;font-size:13px;color:var(--color-text-secondary);">Configure tenant-wide or targeted PIN and biometric authentication settings.</div>
        </div>
        <div class="tile" id="t-laps">
          <div class="tile__header" style="display:flex;align-items:center;gap:8px;"><span style="color:var(--color-primary)">${Icons.lock}</span><span class="tile__title">Windows LAPS</span></div>
          <div style="margin-top:12px;font-size:13px;color:var(--color-text-secondary);">Manage local administrator passwords on managed devices.</div>
        </div>
        <div class="tile" id="t-ca">
          <div class="tile__header" style="display:flex;align-items:center;gap:8px;"><span style="color:var(--color-primary)">${Icons.settings}</span><span class="tile__title">Conditional Access</span></div>
          <div style="margin-top:12px;font-size:13px;color:var(--color-text-secondary);">Define conditions for accessing corporate resources (Read-only).</div>
        </div>
        <div class="tile" id="t-groups">
          <div class="tile__header" style="display:flex;align-items:center;gap:8px;"><span style="color:var(--color-primary)">${Icons.devices}</span><span class="tile__title">Dynamic groups</span></div>
          <div style="margin-top:12px;font-size:13px;color:var(--color-text-secondary);">Manage Entra ID dynamic groups used for Intune assignments.</div>
        </div>
      </div>
    </div>
  `;

  // Routing
  document.getElementById('t-roles')?.addEventListener('click', () => router.navigate('/devices/identity/roles'));
  document.getElementById('t-scopes')?.addEventListener('click', () => router.navigate('/devices/identity/scope-tags'));
  document.getElementById('t-hello')?.addEventListener('click', () => router.navigate('/devices/identity/hello'));
  document.getElementById('t-laps')?.addEventListener('click', () => router.navigate('/devices/identity/laps'));
  document.getElementById('t-ca')?.addEventListener('click', () => router.navigate('/devices/identity/conditional-access'));
  document.getElementById('t-groups')?.addEventListener('click', () => router.navigate('/devices/identity/dynamic-groups'));
}

/* ══════════════════════════════════════════════════
   WINDOWS HELLO FOR BUSINESS
   ══════════════════════════════════════════════════ */
export function renderWHfB() {
  const el = getContentEl(); clearElement(el);
  const policies = Store.getAll(Collections.HELLO_POLICIES);

  getCommandBar()?.setActions([
    { label: 'Create policy', icon: Icons.add, onClick: createWHfBPolicy, type: 'primary' },
    {
      label: 'Export',
      icon: Icons.download,
      onClick: () => {
        exportCsv(
          'windows_hello_policies.csv',
          ['Name', 'Status', 'Targeted groups', 'TPM Required', 'Min PIN Length', 'Biometrics'],
          policies.map(p => [
            p.name,
            p.status,
            (p.assignedGroups || []).join('; '),
            p.settings?.useTpm ? 'Yes' : 'No',
            p.settings?.pinMinLength || 6,
            p.settings?.biometric ? 'Enabled' : 'Disabled',
          ])
        );
        toast()?.success('Export', 'Windows Hello policies exported to CSV.');
      },
      type: 'default',
    },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderWHfB, type: 'default' },
  ]);

  el.innerHTML = `
    <h1 class="page-title">Windows Hello for Business</h1>
    <p class="page-subtitle">Configure Windows Hello for Business tenant-wide or targeted PIN and biometric authentication settings.</p>

    <div class="content-card" style="padding:0;">
      <div class="grid-toolbar" style="padding:12px 16px;">
        <div class="grid-toolbar__search">
          <span style="display:flex">${Icons.search}</span>
          <input type="text" placeholder="Search Windows Hello policies..." id="whfb-search" aria-label="Search policies">
        </div>
        <span style="font-size:12px;color:var(--color-text-secondary);margin-left:auto;" id="whfb-count">${policies.length} polic${policies.length !== 1 ? 'ies' : 'y'}</span>
      </div>
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Name</th><th>Status</th><th>Targeted groups</th><th>Min PIN</th><th>Biometrics</th><th></th></tr>
          </thead>
          <tbody id="whfb-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  const renderTableRows = (list) => {
    const tbody = document.getElementById('whfb-tbody');
    if (!tbody) return;
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--color-text-secondary);">No Windows Hello policies found</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    for (const p of list) {
      const tr = createElement('tr');
      tr.style.cursor = 'pointer';
      tr.innerHTML = `
        <td><span class="cell-link" style="font-weight:600;">${escapeHtml(p.name)}</span></td>
        <td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>${escapeHtml(p.status)}</span></td>
        <td>${escapeHtml((p.assignedGroups || []).join(', ') || 'All devices')}</td>
        <td>${p.settings?.pinMinLength || 6} digits</td>
        <td><span class="tag">${p.settings?.biometric !== false ? 'Allowed' : 'Blocked'}</span></td>
        <td style="text-align:right;"><button class="btn-icon btn-delete" data-id="${p.id}" title="Delete policy">${Icons.delete}</button></td>
      `;

      tr.querySelector('.cell-link')?.addEventListener('click', (e) => {
        e.stopPropagation();
        showWHfBBlade(p);
      });
      tr.addEventListener('click', () => showWHfBBlade(p));

      tr.querySelector('.btn-delete')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete Windows Hello policy "${p.name}"?`)) {
          Store.delete(Collections.HELLO_POLICIES, p.id);
          toast()?.success('Deleted', 'Policy removed.');
          renderWHfB();
        }
      });
      tbody.appendChild(tr);
    }
  };

  renderTableRows(policies);

  document.getElementById('whfb-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = policies.filter(p => p.name.toLowerCase().includes(q) || (p.assignedGroups || []).some(g => g.toLowerCase().includes(q)));
    renderTableRows(filtered);
    const countEl = document.getElementById('whfb-count');
    if (countEl) countEl.textContent = `${filtered.length} polic${filtered.length !== 1 ? 'ies' : 'y'}`;
  });
}

function showWHfBBlade(p) {
  document.getElementById('whfb-blade')?.remove();
  const overlay = createElement('div', { id: 'whfb-blade', className: 'blade-overlay visible', style: 'z-index:1500;' });
  const blade = createElement('div', { className: 'blade-panel visible', style: 'width:580px;max-width:94vw;' });

  blade.innerHTML = `
    <div class="blade-panel__header">
      <div class="blade-panel__breadcrumb">Identity &gt; Windows Hello for Business &gt; ${escapeHtml(p.name)}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
        <h2 class="blade-panel__title" style="font-size:18px;">${escapeHtml(p.name)}</h2>
        <button class="blade-panel__close" id="whfb-blade-close" aria-label="Close">${Icons.close}</button>
      </div>
    </div>

    <div class="blade-panel__body" style="padding:20px;overflow-y:auto;display:flex;flex-direction:column;gap:16px;">
      <div class="content-card" style="margin:0;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <h3 class="content-card__title" style="margin:0;">Policy status</h3>
          <span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Active</span>
        </div>
        <dl class="kv-grid" style="grid-template-columns:1fr 2fr;gap:10px 16px;">
          <dt>Policy name</dt><dd><strong>${escapeHtml(p.name)}</strong></dd>
          <dt>Platform</dt><dd>Windows 10 and later</dd>
          <dt>Targeted groups</dt><dd>${escapeHtml((p.assignedGroups || []).join(', ') || 'All devices')}</dd>
          <dt>Created date</dt><dd>${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Active baseline'}</dd>
        </dl>
      </div>

      <div class="content-card" style="margin:0;">
        <h3 class="content-card__title" style="margin-bottom:12px;">Configured settings</h3>
        <div class="data-grid-wrapper">
          <table class="data-grid">
            <thead><tr><th>Setting</th><th>Configuration</th></tr></thead>
            <tbody>
              <tr><td>Use a Trusted Platform Module (TPM)</td><td><strong>${p.settings?.useTpm !== false ? 'Required' : 'Optional'}</strong></td></tr>
              <tr><td>Minimum PIN length</td><td><strong>${p.settings?.pinMinLength || 6} characters</strong></td></tr>
              <tr><td>Maximum PIN length</td><td><strong>${p.settings?.pinMaxLength || 127} characters</strong></td></tr>
              <tr><td>Allow biometric authentication</td><td><strong>${p.settings?.biometric !== false ? 'Allowed' : 'Blocked'}</strong></td></tr>
              <tr><td>Use enhanced anti-spoofing</td><td><strong>${p.settings?.enhancedAntiSpoofing !== false ? 'Yes' : 'No'}</strong></td></tr>
              <tr><td>PIN complexity rules</td><td>Uppercase, lowercase, numbers, special characters allowed</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="blade-panel__footer" style="display:flex;justify-content:space-between;gap:8px;">
      <button class="btn btn-danger btn-sm" id="whfb-blade-delete">Delete policy</button>
      <button class="btn btn-default btn-sm" id="whfb-blade-close-btn">Close</button>
    </div>
  `;

  overlay.appendChild(blade);
  document.body.appendChild(overlay);

  const closeBlade = () => overlay.remove();
  blade.querySelector('#whfb-blade-close')?.addEventListener('click', closeBlade);
  blade.querySelector('#whfb-blade-close-btn')?.addEventListener('click', closeBlade);
  blade.querySelector('#whfb-blade-delete')?.addEventListener('click', () => {
    if (confirm(`Delete policy "${p.name}"?`)) {
      Store.delete(Collections.HELLO_POLICIES, p.id);
      toast()?.success('Deleted', 'Policy removed.');
      closeBlade();
      renderWHfB();
    }
  });
}

function createWHfBPolicy() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.clearActions();
  const wizard = new Wizard(el, {
    steps: [
      { name: 'Basics', render: (data, body) => body.innerHTML = `<h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Basics</h3><div class="form-group"><label class="form-label required">Name</label><input class="form-input" id="whfb-name" value="${data.name||''}"></div>`, collect: (data) => data.name = document.getElementById('whfb-name')?.value||'' },
      { name: 'Settings', render: (data, body) => {
        body.innerHTML = `
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Settings</h3>
          <div class="form-group"><div class="toggle on" id="whfb-enable"><div class="toggle__track"><div class="toggle__thumb"></div></div><span class="toggle__label">Configure Windows Hello for Business</span></div></div>
          <div class="content-card" id="whfb-opts">
            <div class="form-group"><div class="toggle on" id="whfb-tpm"><div class="toggle__track"><div class="toggle__thumb"></div></div><span class="toggle__label">Use a Trusted Platform Module (TPM)</span></div></div>
            <div class="form-group"><label class="form-label">Minimum PIN length</label><input type="number" class="form-input" id="whfb-pinmin" value="6" style="max-width:100px;"></div>
            <div class="form-group"><div class="toggle on" id="whfb-bio"><div class="toggle__track"><div class="toggle__thumb"></div></div><span class="toggle__label">Allow biometric authentication</span></div></div>
            <div class="form-group"><div class="toggle on" id="whfb-spoof"><div class="toggle__track"><div class="toggle__thumb"></div></div><span class="toggle__label">Use enhanced anti-spoofing, when available</span></div></div>
          </div>
        `;
        body.querySelectorAll('.toggle').forEach(t => t.addEventListener('click', () => t.classList.toggle('on')));
        document.getElementById('whfb-enable')?.addEventListener('click', function() { document.getElementById('whfb-opts').style.opacity = this.classList.contains('on') ? '1' : '0.5'; });
      }, collect: (data) => {
        data.settings = {
          enabled: document.getElementById('whfb-enable')?.classList.contains('on'),
          useTpm: document.getElementById('whfb-tpm')?.classList.contains('on'),
          pinMinLength: parseInt(document.getElementById('whfb-pinmin')?.value)||6,
          biometric: document.getElementById('whfb-bio')?.classList.contains('on'),
          enhancedAntiSpoofing: document.getElementById('whfb-spoof')?.classList.contains('on'),
        };
      }},
      { name: 'Assignments', render: renderAssignmentsStep, collect: collectAssignments },
      { name: 'Review', render: (data) => Wizard.renderReview(data, { name: 'Name', assignedGroups: 'Assigned groups' }) }
    ],
    onComplete: (data) => { Store.create(Collections.HELLO_POLICIES, { id: generateId(), status: 'Active', ...data }); router.navigate('/devices/identity/hello'); },
    onCancel: () => router.navigate('/devices/identity/hello')
  });
  wizard.render();
}

/* ══════════════════════════════════════════════════
   WINDOWS LAPS
   ══════════════════════════════════════════════════ */
export function renderLAPS() {
  const el = getContentEl(); clearElement(el);
  const policies = Store.getAll(Collections.LAPS_POLICIES);

  getCommandBar()?.setActions([
    { label: 'Create profile', icon: Icons.add, onClick: createLAPSPolicy, type: 'primary' },
    {
      label: 'Export',
      icon: Icons.download,
      onClick: () => {
        exportCsv(
          'windows_laps_policies.csv',
          ['Name', 'Status', 'Assigned to', 'Backup directory', 'Password age (days)', 'Password length'],
          policies.map(p => [
            p.name,
            p.status,
            (p.assignedGroups || []).join('; '),
            p.settings?.backupDirectory || 'Microsoft Entra ID',
            p.settings?.passwordAge || 30,
            p.settings?.passwordLength || 14,
          ])
        );
        toast()?.success('Export', 'Windows LAPS policies exported to CSV.');
      },
      type: 'default',
    },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderLAPS, type: 'default' },
  ]);

  el.innerHTML = `
    <h1 class="page-title">Windows LAPS</h1>
    <p class="page-subtitle">Manage local administrator passwords for Windows devices and escrow recovery credentials to Microsoft Entra ID.</p>

    <div class="content-card" style="padding:0;">
      <div class="grid-toolbar" style="padding:12px 16px;">
        <div class="grid-toolbar__search">
          <span style="display:flex">${Icons.search}</span>
          <input type="text" placeholder="Search Windows LAPS profiles..." id="laps-search" aria-label="Search profiles">
        </div>
        <span style="font-size:12px;color:var(--color-text-secondary);margin-left:auto;" id="laps-count">${policies.length} profile${policies.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Name</th><th>Status</th><th>Assigned to</th><th>Backup directory</th><th>Password age</th><th></th></tr>
          </thead>
          <tbody id="laps-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  const renderTableRows = (list) => {
    const tbody = document.getElementById('laps-tbody');
    if (!tbody) return;
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--color-text-secondary);">No LAPS profiles found</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    for (const p of list) {
      const tr = createElement('tr');
      tr.style.cursor = 'pointer';
      tr.innerHTML = `
        <td><span class="cell-link" style="font-weight:600;">${escapeHtml(p.name)}</span></td>
        <td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>${escapeHtml(p.status)}</span></td>
        <td>${escapeHtml((p.assignedGroups || []).join(', ') || 'All corporate Windows devices')}</td>
        <td><span class="tag">${escapeHtml(p.settings?.backupDirectory || 'Microsoft Entra ID')}</span></td>
        <td>${p.settings?.passwordAge || 30} days</td>
        <td style="text-align:right;"><button class="btn-icon btn-delete" data-id="${p.id}" title="Delete profile">${Icons.delete}</button></td>
      `;

      tr.querySelector('.cell-link')?.addEventListener('click', (e) => {
        e.stopPropagation();
        showLAPSBlade(p);
      });
      tr.addEventListener('click', () => showLAPSBlade(p));

      tr.querySelector('.btn-delete')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete LAPS profile "${p.name}"?`)) {
          Store.delete(Collections.LAPS_POLICIES, p.id);
          toast()?.success('Deleted', 'Profile removed.');
          renderLAPS();
        }
      });
      tbody.appendChild(tr);
    }
  };

  renderTableRows(policies);

  document.getElementById('laps-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = policies.filter(p => p.name.toLowerCase().includes(q) || (p.assignedGroups || []).some(g => g.toLowerCase().includes(q)));
    renderTableRows(filtered);
    const countEl = document.getElementById('laps-count');
    if (countEl) countEl.textContent = `${filtered.length} profile${filtered.length !== 1 ? 's' : ''}`;
  });
}

function showLAPSBlade(p) {
  document.getElementById('laps-blade')?.remove();
  const overlay = createElement('div', { id: 'laps-blade', className: 'blade-overlay visible', style: 'z-index:1500;' });
  const blade = createElement('div', { className: 'blade-panel visible', style: 'width:580px;max-width:94vw;' });

  blade.innerHTML = `
    <div class="blade-panel__header">
      <div class="blade-panel__breadcrumb">Identity &gt; Windows LAPS &gt; ${escapeHtml(p.name)}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
        <h2 class="blade-panel__title" style="font-size:18px;">${escapeHtml(p.name)}</h2>
        <button class="blade-panel__close" id="laps-blade-close" aria-label="Close">${Icons.close}</button>
      </div>
    </div>

    <div class="blade-panel__body" style="padding:20px;overflow-y:auto;display:flex;flex-direction:column;gap:16px;">
      <div class="content-card" style="margin:0;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <h3 class="content-card__title" style="margin:0;">Profile status</h3>
          <span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Active</span>
        </div>
        <dl class="kv-grid" style="grid-template-columns:1fr 2fr;gap:10px 16px;">
          <dt>Profile name</dt><dd><strong>${escapeHtml(p.name)}</strong></dd>
          <dt>Platform</dt><dd>Windows 10 and later</dd>
          <dt>Targeted groups</dt><dd>${escapeHtml((p.assignedGroups || []).join(', ') || 'All corporate Windows devices')}</dd>
          <dt>Created date</dt><dd>${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Active baseline'}</dd>
        </dl>
      </div>

      <div class="content-card" style="margin:0;">
        <h3 class="content-card__title" style="margin-bottom:12px;">Configured password settings</h3>
        <div class="data-grid-wrapper">
          <table class="data-grid">
            <thead><tr><th>Setting</th><th>Configuration</th></tr></thead>
            <tbody>
              <tr><td>Backup Directory</td><td><strong>${escapeHtml(p.settings?.backupDirectory || 'Microsoft Entra ID')}</strong></td></tr>
              <tr><td>Password Age (Days)</td><td><strong>${p.settings?.passwordAge || 30} days</strong></td></tr>
              <tr><td>Administrator Account Name</td><td><strong>${escapeHtml(p.settings?.administratorAccountName || 'Built-in Administrator')}</strong></td></tr>
              <tr><td>Password Complexity</td><td><strong>${escapeHtml(p.settings?.passwordComplexity || 'Large + small letters + numbers + special characters')}</strong></td></tr>
              <tr><td>Password Length</td><td><strong>${p.settings?.passwordLength || 14} characters</strong></td></tr>
              <tr><td>Post-Authentication Actions</td><td><strong>Reset password and log off</strong></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="blade-panel__footer" style="display:flex;justify-content:space-between;gap:8px;">
      <button class="btn btn-danger btn-sm" id="laps-blade-delete">Delete profile</button>
      <button class="btn btn-default btn-sm" id="laps-blade-close-btn">Close</button>
    </div>
  `;

  overlay.appendChild(blade);
  document.body.appendChild(overlay);

  const closeBlade = () => overlay.remove();
  blade.querySelector('#laps-blade-close')?.addEventListener('click', closeBlade);
  blade.querySelector('#laps-blade-close-btn')?.addEventListener('click', closeBlade);
  blade.querySelector('#laps-blade-delete')?.addEventListener('click', () => {
    if (confirm(`Delete LAPS profile "${p.name}"?`)) {
      Store.delete(Collections.LAPS_POLICIES, p.id);
      toast()?.success('Deleted', 'Profile removed.');
      closeBlade();
      renderLAPS();
    }
  });
}

function createLAPSPolicy() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.clearActions();
  const wizard = new Wizard(el, {
    steps: [
      { name: 'Basics', render: (data, body) => body.innerHTML = `<h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Basics</h3><div class="form-group"><label class="form-label required">Name</label><input class="form-input" id="laps-name" value="${data.name||''}"></div>`, collect: (data) => data.name = document.getElementById('laps-name')?.value||'' },
      { name: 'Settings', render: (data, body) => {
        body.innerHTML = `
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Settings</h3>
          <div class="form-group"><label class="form-label">Backup Directory</label><select class="form-input form-select" id="laps-backup" style="max-width:300px;"><option>Microsoft Entra ID</option><option>Active Directory</option></select></div>
          <div class="form-group"><label class="form-label">Password Age (Days)</label><input type="number" class="form-input" id="laps-age" value="30" style="max-width:100px;"></div>
          <div class="form-group"><label class="form-label">Administrator Account Name (Optional)</label><input class="form-input" id="laps-admin" placeholder="Built-in Administrator if left blank"></div>
          <div class="form-group"><label class="form-label">Password Complexity</label><select class="form-input form-select" id="laps-comp" style="max-width:400px;"><option>Large letters + small letters + numbers + special characters</option><option>Large letters + small letters + numbers</option></select></div>
          <div class="form-group"><label class="form-label">Password Length</label><input type="number" class="form-input" id="laps-len" value="14" min="8" max="64" style="max-width:100px;"></div>
        `;
      }, collect: (data) => {
        data.settings = {
          backupDirectory: document.getElementById('laps-backup')?.value,
          passwordAge: parseInt(document.getElementById('laps-age')?.value)||30,
          administratorAccountName: document.getElementById('laps-admin')?.value||'',
          passwordComplexity: document.getElementById('laps-comp')?.value,
          passwordLength: parseInt(document.getElementById('laps-len')?.value)||14,
        };
      }},
      { name: 'Scope tags', render: renderScopeTagsStep, collect: collectScopeTags },
      { name: 'Assignments', render: renderAssignmentsStep, collect: collectAssignments },
      { name: 'Review', render: (data) => Wizard.renderReview(data, { name: 'Name', assignedGroups: 'Assigned groups' }) }
    ],
    onComplete: (data) => { Store.create(Collections.LAPS_POLICIES, { id: generateId(), status: 'Active', ...data }); router.navigate('/devices/identity/laps'); },
    onCancel: () => router.navigate('/devices/identity/laps')
  });
  wizard.render();
}

