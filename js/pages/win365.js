/* ============================================================
   Windows 365 & Intune Suite Page Module
   Cloud PCs, Provisioning, Remote Help, EPM
   ============================================================ */

import { Icons, createElement, clearElement, $, generateId } from '../utils.js';
import { Store, Collections } from '../store.js';
import { router } from '../router.js';
import { Wizard, renderScopeTagsStep, collectScopeTags, renderAssignmentsStep, collectAssignments } from '../components/wizard.js';
import { DonutChart } from '../components/charts.js';

function getContentEl() { return $('#page-content'); }
function getCommandBar() { return window.IntuneApp?.commandBar; }
function toast() { return window.IntuneApp?.toastManager; }

/* ══════════════════════════════════════════════════
   WINDOWS 365 OVERVIEW
   ══════════════════════════════════════════════════ */
export function renderWin365Overview() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([{ label: 'Refresh', icon: Icons.refresh, onClick: renderWin365Overview, type: 'default' }]);

  const devices = Store.getAll(Collections.DEVICES);
  const cloudPCs = devices.filter(d => d.model?.includes('Cloud PC'));
  const provisionPolicies = Store.getAll(Collections.PROVISIONING_POLICIES);

  el.innerHTML = `
    <h1 class="page-title">Windows 365</h1>
    <div class="tile-grid">
      <div class="tile" id="w365-cpcs"><div class="tile__header"><span class="tile__title">Total Cloud PCs</span></div><div class="tile__value" style="color:var(--color-primary)">${cloudPCs.length}</div><div class="tile__label">Active Cloud PCs</div></div>
      <div class="tile" id="w365-prov"><div class="tile__header"><span class="tile__title">Provisioning policies</span></div><div class="tile__value" style="color:var(--color-primary)">${provisionPolicies.length}</div><div class="tile__label">Active policies</div></div>
      <div class="tile"><div class="tile__header"><span class="tile__title">Network connections</span></div><div class="tile__value" style="color:var(--color-success)">2</div><div class="tile__label">Healthy connections</div></div>
    </div>
    
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
      <div class="content-card">
        <div class="content-card__header"><h2 class="content-card__title">Cloud PC status</h2></div>
        <div style="display:flex;gap:24px;align-items:flex-start;">
          <canvas id="w365-donut" style="max-width:180px;"></canvas>
          <div id="w365-donut-legend" class="chart-legend" style="min-width:160px;"></div>
        </div>
      </div>
      <div class="content-card">
        <div class="content-card__header"><h2 class="content-card__title">Quick Tasks</h2></div>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:12px;">
          <li><a href="#/windows-365/all-cloud-pcs" style="color:var(--color-primary);text-decoration:none;display:flex;align-items:center;gap:8px;"><span style="color:var(--color-primary)">${Icons.devices}</span> View all Cloud PCs</a></li>
          <li><a href="#/windows-365/provisioning-policies" style="color:var(--color-primary);text-decoration:none;display:flex;align-items:center;gap:8px;"><span style="color:var(--color-primary)">${Icons.settings}</span> Manage provisioning policies</a></li>
        </ul>
      </div>
    </div>
  `;

  document.getElementById('w365-cpcs')?.addEventListener('click', () => router.navigate('/windows-365/all-cloud-pcs'));
  document.getElementById('w365-prov')?.addEventListener('click', () => router.navigate('/windows-365/provisioning-policies'));

  // Donut chart
  const segments = [
    { label: 'Provisioned', value: cloudPCs.length, color: '#107C10' },
    { label: 'Provisioning', value: 0, color: '#0078D4' },
    { label: 'Failed', value: 0, color: '#D13438' },
  ];
  new DonutChart($('#w365-donut'), { width: 180, height: 180, outerRadius: 80, innerRadius: 50, segments, centerText: String(cloudPCs.length) }).draw();
  DonutChart.renderLegend($('#w365-donut-legend'), segments);
}

/* ══════════════════════════════════════════════════
   PROVISIONING POLICIES
   ══════════════════════════════════════════════════ */
export function renderProvisioningPolicies() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Create policy', icon: Icons.add, onClick: createProvisioningPolicy, type: 'primary' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderProvisioningPolicies, type: 'default' },
  ]);

  const policies = Store.getAll(Collections.PROVISIONING_POLICIES);
  el.innerHTML = `
    <h1 class="page-title">Provisioning policies</h1>
    <p class="page-subtitle">Configure how Cloud PCs are provisioned and assigned to users.</p>
    <div class="data-grid-wrapper"><table class="data-grid"><thead><tr><th>Name</th><th>Join type</th><th>Network</th><th>Image</th><th>Assigned to</th><th></th></tr></thead><tbody id="prov-tbody"></tbody></table></div>
  `;

  const tbody = document.getElementById('prov-tbody');
  if (policies.length === 0 && tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;">No provisioning policies</td></tr>';
  for (const p of policies) {
    const tr = createElement('tr');
    tr.innerHTML = `<td><span class="cell-link">${p.name}</span></td><td>${p.joinType}</td><td>${p.network}</td><td>${p.image}</td><td>${(p.assignedGroups||[]).join(', ')}</td><td><button class="btn-icon btn-delete" data-id="${p.id}">${Icons.delete}</button></td>`;
    tr.querySelector('.btn-delete')?.addEventListener('click', (e) => { e.stopPropagation(); if (confirm('Delete policy?')) { Store.delete(Collections.PROVISIONING_POLICIES, p.id); renderProvisioningPolicies(); } });
    tbody?.appendChild(tr);
  }
}

function createProvisioningPolicy() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.clearActions();
  const wizard = new Wizard(el, {
    steps: [
      { name: 'General', render: (data, body) => {
        body.innerHTML = `
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">General</h3>
          <div class="form-group"><label class="form-label required">Name</label><input class="form-input" id="prov-name" value="${data.name||''}"></div>
          <div class="form-group"><label class="form-label required">Join type</label><select class="form-input form-select" id="prov-join" style="max-width:300px;"><option>Microsoft Entra joined</option><option>Hybrid Microsoft Entra joined</option></select></div>
          <div class="form-group"><label class="form-label required">Network</label><select class="form-input form-select" id="prov-net" style="max-width:300px;"><option>Microsoft hosted network</option><option>Azure network connection (ANC)</option></select></div>
        `;
      }, collect: (data) => {
        data.name = document.getElementById('prov-name')?.value||'';
        data.joinType = document.getElementById('prov-join')?.value;
        data.network = document.getElementById('prov-net')?.value;
      }},
      { name: 'Image', render: (data, body) => {
        body.innerHTML = `
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Image</h3>
          <div class="form-group"><label class="form-label required">Image type</label><select class="form-input form-select" id="prov-imgt" style="max-width:300px;"><option>Gallery image</option><option>Custom image</option></select></div>
          <div class="form-group"><label class="form-label required">Select image</label><select class="form-input form-select" id="prov-img" style="max-width:400px;"><option>Windows 11 Enterprise + Microsoft 365 Apps</option><option>Windows 11 Enterprise (OS optimized)</option><option>Windows 10 Enterprise + Microsoft 365 Apps</option></select></div>
        `;
      }, collect: (data) => data.image = document.getElementById('prov-img')?.value },
      { name: 'Configuration', render: (data, body) => {
        body.innerHTML = `
          <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Configuration</h3>
          <div class="form-group"><label class="form-label">Language & Region</label><select class="form-input form-select" style="max-width:300px;"><option>English (United States)</option></select></div>
          <div class="form-group"><label class="form-label">Additional services</label>
            <div class="toggle on"><div class="toggle__track"><div class="toggle__thumb"></div></div><span class="toggle__label">Windows Autopatch</span></div>
          </div>
        `;
        body.querySelectorAll('.toggle').forEach(t => t.addEventListener('click', () => t.classList.toggle('on')));
      }, collect: () => {} },
      { name: 'Assignments', render: renderAssignmentsStep, collect: collectAssignments },
      { name: 'Review + create', render: (data) => Wizard.renderReview(data, { name: 'Name', joinType: 'Join type', network: 'Network', image: 'Image', assignedGroups: 'Assigned groups' }) }
    ],
    onComplete: (data) => { Store.create(Collections.PROVISIONING_POLICIES, { id: generateId(), ...data }); router.navigate('/windows-365/provisioning-policies'); },
    onCancel: () => router.navigate('/windows-365/provisioning-policies')
  });
  wizard.render();
}

/* ══════════════════════════════════════════════════
   TENANT ADMIN - INTUNE SUITE ADD-ONS
   ══════════════════════════════════════════════════ */
export function renderIntuneAddons() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([{ label: 'Refresh', icon: Icons.refresh, onClick: renderIntuneAddons, type: 'default' }]);

  el.innerHTML = `
    <h1 class="page-title">Intune add-ons</h1>
    <p class="page-subtitle">Manage premium capabilities included in the Microsoft Intune Suite.</p>
    
    <div style="display:flex;flex-direction:column;gap:16px;">
      
      <div class="content-card" style="display:flex;align-items:center;gap:16px;">
        <div style="width:48px;height:48px;border-radius:12px;background:#0078D420;display:flex;align-items:center;justify-content:center;color:#0078D4;">${Icons.user}</div>
        <div style="flex:1;">
          <h3 style="font-size:16px;font-weight:600;">Remote Help</h3>
          <p style="color:var(--color-text-secondary);font-size:14px;margin-top:4px;">Enable secure, cloud-based remote assistance for your users.</p>
        </div>
        <div><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Active</span></div>
        <button class="btn btn-default" onclick="window.IntuneApp.router.navigate('/tenant-admin/remote-help')">Configure</button>
      </div>

      <div class="content-card" style="display:flex;align-items:center;gap:16px;">
        <div style="width:48px;height:48px;border-radius:12px;background:#0078D420;display:flex;align-items:center;justify-content:center;color:#0078D4;">${Icons.security}</div>
        <div style="flex:1;">
          <h3 style="font-size:16px;font-weight:600;">Endpoint Privilege Management (EPM)</h3>
          <p style="color:var(--color-text-secondary);font-size:14px;margin-top:4px;">Allow standard users to run approved applications with elevated privileges.</p>
        </div>
        <div><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Active</span></div>
        <button class="btn btn-default" onclick="window.IntuneApp.toastManager.info('EPM', 'Endpoint Privilege Management policies are managed under Endpoint Security.')">Configure</button>
      </div>

      <div class="content-card" style="display:flex;align-items:center;gap:16px;">
        <div style="width:48px;height:48px;border-radius:12px;background:#0078D420;display:flex;align-items:center;justify-content:center;color:#0078D4;">${Icons.charts}</div>
        <div style="flex:1;">
          <h3 style="font-size:16px;font-weight:600;">Advanced Analytics</h3>
          <p style="color:var(--color-text-secondary);font-size:14px;margin-top:4px;">Gain deeper insights into device health, battery performance, and application reliability.</p>
        </div>
        <div><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>Active</span></div>
      </div>

      <div class="content-card" style="display:flex;align-items:center;gap:16px;opacity:0.6;">
        <div style="width:48px;height:48px;border-radius:12px;background:#8A888620;display:flex;align-items:center;justify-content:center;color:#8A8886;">${Icons.app}</div>
        <div style="flex:1;">
          <h3 style="font-size:16px;font-weight:600;">Enterprise App Management</h3>
          <p style="color:var(--color-text-secondary);font-size:14px;margin-top:4px;">Streamline app deployment with a secure, pre-packaged catalog of third-party apps.</p>
        </div>
        <div><span class="status-pill status-pill--not-evaluated"><span class="status-pill__dot"></span>Available</span></div>
        <button class="btn btn-primary" onclick="window.IntuneApp.toastManager.info('App Management', 'Start trial required.')">Start trial</button>
      </div>

    </div>
  `;
}

export function renderRemoteHelp() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([{ label: 'Refresh', icon: Icons.refresh, onClick: renderRemoteHelp, type: 'default' }]);

  el.innerHTML = `
    <h1 class="page-title">Remote Help</h1>
    <p class="page-subtitle">Configure Remote Help settings for your tenant.</p>
    <div class="content-card">
      <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Settings</h3>
      <div class="form-group" style="display:flex;align-items:center;justify-content:space-between;padding-bottom:12px;border-bottom:1px solid var(--color-border-subtle);">
        <label>Enable Remote Help</label>
        <div class="toggle on"><div class="toggle__track"><div class="toggle__thumb"></div></div></div>
      </div>
      <div class="form-group" style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--color-border-subtle);">
        <label>Allow Remote Help to unenrolled devices</label>
        <div class="toggle on"><div class="toggle__track"><div class="toggle__thumb"></div></div></div>
      </div>
      <div class="form-group" style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;">
        <label>Disable chat</label>
        <div class="toggle"><div class="toggle__track"><div class="toggle__thumb"></div></div></div>
      </div>
      <button class="btn btn-primary" style="margin-top:16px;" id="save-remote-help">Save</button>
    </div>
  `;
  el.querySelector('#save-remote-help')?.addEventListener('click', () => toast()?.success('Saved', 'Remote Help settings saved.'));
  el.querySelectorAll('.toggle').forEach(t => t.addEventListener('click', () => t.classList.toggle('on')));
}

/* ── Cloud PC Details Blade ── */
export function showCloudPCDetailsBlade(c, onRefresh) {
  document.getElementById('cpc-blade')?.remove();
  const overlay = createElement('div', { id: 'cpc-blade', className: 'blade-overlay visible', style: 'z-index:1500;' });
  const blade = createElement('div', { className: 'blade-panel visible', style: 'width:700px;max-width:95vw;' });

  blade.innerHTML = `
    <div class="blade-panel__header">
      <div class="blade-panel__breadcrumb">Windows 365 &gt; All Cloud PCs &gt; ${escapeHtml(c.name)}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:36px;height:36px;background:var(--color-primary-lighter);color:var(--color-primary);display:flex;align-items:center;justify-content:center;border-radius:6px;">
            ${Icons.monitor}
          </div>
          <div>
            <h2 class="blade-panel__title" style="margin:0;font-size:18px;">${escapeHtml(c.name)}</h2>
            <span style="font-size:12px;color:var(--color-text-secondary);">${escapeHtml(c.user)} • ${escapeHtml(c.specs)}</span>
          </div>
        </div>
        <button class="blade-panel__close" id="blade-close">${Icons.close}</button>
      </div>
    </div>
    <div class="blade-panel__body">
      <!-- Remote Actions Bar -->
      <div style="display:flex;flex-wrap:wrap;gap:6px;padding:8px 0 16px;border-bottom:1px solid var(--color-border);margin-bottom:16px;">
        <button class="btn btn-sm btn-default" id="cpc-act-restart">${Icons.restart} Restart</button>
        <button class="btn btn-sm btn-default" id="cpc-act-restore">${Icons.sync} Restore</button>
        <button class="btn btn-sm btn-default" id="cpc-act-resize">${Icons.edit} Resize</button>
        <button class="btn btn-sm btn-default" id="cpc-act-trouble">${Icons.troubleshoot} Troubleshoot</button>
        <button class="btn btn-sm btn-default" id="cpc-act-review">${Icons.lock} Place under review</button>
        <button class="btn btn-sm btn-default" id="cpc-act-rename">${Icons.edit} Rename</button>
        <button class="btn btn-sm btn-default" id="cpc-act-reprov" style="color:var(--color-danger);">${Icons.refresh} Reprovision</button>
      </div>

      <!-- Essentials -->
      <div class="content-card" style="margin-bottom:16px;">
        <h3 style="font-size:14px;font-weight:600;margin-bottom:12px;">Cloud PC Essentials</h3>
        <dl class="kv-grid">
          <dt>Cloud PC name</dt><dd><strong>${escapeHtml(c.name)}</strong></dd>
          <dt>Primary user</dt><dd>${escapeHtml(c.user)}</dd>
          <dt>Status</dt><dd><span class="status-pill status-pill--${c.status === 'Provisioned' ? 'compliant' : 'warning'}"><span class="status-pill__dot"></span>${escapeHtml(c.status)}</span></dd>
          <dt>Provisioning policy</dt><dd>${escapeHtml(c.policy)}</dd>
          <dt>Configuration / Hardware</dt><dd>${escapeHtml(c.specs)}</dd>
          <dt>Network</dt><dd>${escapeHtml(c.network)}</dd>
          <dt>Region / Location</dt><dd>US West (Silicon Valley Datacenter)</dd>
          <dt>Operating system</dt><dd>Windows 11 Enterprise 23H2 Cloud</dd>
          <dt>Join type</dt><dd>Microsoft Entra joined</dd>
          <dt>Last connection</dt><dd>${escapeHtml(c.lastSeen)}</dd>
        </dl>
      </div>

      <!-- Connection Health & Diagnostics -->
      <div class="content-card" style="margin-bottom:16px;">
        <h3 style="font-size:14px;font-weight:600;margin-bottom:12px;">Connection quality</h3>
        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:12px;">
          <div style="padding:12px;background:var(--color-bg-subtle);border-radius:6px;">
            <div style="font-size:12px;color:var(--color-text-secondary);">Round-trip latency</div>
            <div style="font-size:18px;font-weight:600;color:var(--color-success);margin-top:4px;">18 ms (Excellent)</div>
          </div>
          <div style="padding:12px;background:var(--color-bg-subtle);border-radius:6px;">
            <div style="font-size:12px;color:var(--color-text-secondary);">Gateway health</div>
            <div style="font-size:18px;font-weight:600;color:var(--color-success);margin-top:4px;">Connected</div>
          </div>
          <div style="padding:12px;background:var(--color-bg-subtle);border-radius:6px;">
            <div style="font-size:12px;color:var(--color-text-secondary);">Available bandwidth</div>
            <div style="font-size:18px;font-weight:600;color:var(--color-primary);margin-top:4px;">245 Mbps</div>
          </div>
        </div>
      </div>

      <!-- Restore points (Snapshots) -->
      <div class="content-card">
        <h3 style="font-size:14px;font-weight:600;margin-bottom:12px;">Point-in-time restore points</h3>
        <table class="data-grid" style="margin:0;">
          <thead>
            <tr><th>Snapshot timestamp</th><th>Type</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Today, 12:00 PM</td>
              <td><span class="tag">Automatic system snapshot</span></td>
              <td><button class="btn btn-sm btn-default cpc-restore-pt-btn" data-time="Today 12:00 PM">Restore to this point</button></td>
            </tr>
            <tr>
              <td>Yesterday, 6:00 PM</td>
              <td><span class="tag">Daily baseline snapshot</span></td>
              <td><button class="btn btn-sm btn-default cpc-restore-pt-btn" data-time="Yesterday 6:00 PM">Restore to this point</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  overlay.appendChild(blade);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  blade.querySelector('#blade-close')?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // Remote Action Handlers
  blade.querySelector('#cpc-act-restart')?.addEventListener('click', () => {
    toast()?.success('Restart signal', `Restart command sent to ${c.name}.`);
  });

  blade.querySelector('#cpc-act-restore')?.addEventListener('click', () => {
    if (confirm(`Restore ${c.name} to the latest healthy point-in-time snapshot (Today 12:00 PM)? Unsaved changes since noon will be reverted.`)) {
      toast()?.info('Restoring', `${c.name} restore process initiated.`);
    }
  });

  blade.querySelector('#cpc-act-resize')?.addEventListener('click', () => {
    const targetSpec = prompt('Choose new hardware configuration for Cloud PC:\n1. 4 vCPU, 16 GB RAM, 256 GB\n2. 8 vCPU, 32 GB RAM, 512 GB\n3. 16 vCPU, 64 GB RAM, 1024 GB (GPU enabled)\nEnter 1, 2, or 3:', '2');
    if (targetSpec) {
      const specMap = { '1': '4 vCPU, 16 GB RAM, 256 GB', '2': '8 vCPU, 32 GB RAM, 512 GB', '3': '16 vCPU, 64 GB RAM, 1024 GB (GPU)' };
      const chosen = specMap[targetSpec] || targetSpec;
      c.specs = chosen;
      toast()?.success('Resized', `${c.name} successfully upgraded to ${chosen}.`);
      close();
      if (onRefresh) onRefresh();
    }
  });

  blade.querySelector('#cpc-act-trouble')?.addEventListener('click', () => {
    toast()?.info('Troubleshooting', `Diagnostics completed: Cloud PC agent is healthy. Network latency is 18ms. Session host status: Healthy.`);
  });

  blade.querySelector('#cpc-act-review')?.addEventListener('click', () => {
    if (confirm(`Place ${c.name} under review? A forensically sound snapshot will be copied to your Azure Storage account for legal and security review.`)) {
      toast()?.success('Placed under review', `Snapshot of ${c.name} exported to compliance storage container.`);
    }
  });

  blade.querySelector('#cpc-act-rename')?.addEventListener('click', () => {
    const newName = prompt(`Enter new display name for Cloud PC:`, c.name);
    if (newName && newName.trim()) {
      c.name = newName.trim();
      toast()?.success('Renamed', `Cloud PC renamed to "${c.name}".`);
      close();
      if (onRefresh) onRefresh();
    }
  });

  blade.querySelector('#cpc-act-reprov')?.addEventListener('click', () => {
    if (confirm(`Reprovision ${c.name}? All personal files on the C: drive will be re-created from the baseline image.`)) {
      toast()?.info('Reprovisioning', `${c.name} has entered the reprovisioning pipeline.`);
    }
  });

  blade.querySelectorAll('.cpc-restore-pt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.time;
      if (confirm(`Restore ${c.name} to ${t}?`)) {
        toast()?.success('Restoring', `Reverting virtual machine disk to snapshot ${t}.`);
      }
    });
  });
}

/* ══════════════════════════════════════════════════
   ALL CLOUD PCS
   ══════════════════════════════════════════════════ */
export function renderAllCloudPCs() {
  const el = getContentEl(); clearElement(el);

  const cloudPCs = [
    { id: 'cpc-1', name: 'CPC-AlexJ-01', user: 'Alex Johnson', status: 'Provisioned', policy: 'Standard Engineering Cloud PC', specs: '4 vCPU, 16 GB RAM, 256 GB', network: 'US-West Azure Network', lastSeen: 'Today, 2:15 PM' },
    { id: 'cpc-2', name: 'CPC-SarahC-02', user: 'Sarah Chen', status: 'Provisioned', policy: 'Standard Engineering Cloud PC', specs: '8 vCPU, 32 GB RAM, 512 GB', network: 'US-West Azure Network', lastSeen: 'Today, 11:30 AM' },
    { id: 'cpc-3', name: 'CPC-MikeW-03', user: 'Mike Williams', status: 'Provisioned', policy: 'Business Productivity Cloud PC', specs: '2 vCPU, 8 GB RAM, 128 GB', network: 'Hosted (Microsoft-managed)', lastSeen: 'Yesterday' },
    { id: 'cpc-4', name: 'CPC-Finance-04', user: 'Priya Patel', status: 'In grace period', policy: 'Business Productivity Cloud PC', specs: '4 vCPU, 16 GB RAM, 256 GB', network: 'Hosted (Microsoft-managed)', lastSeen: '3 days ago' },
  ];

  getCommandBar()?.setActions([
    { label: 'Reprovision all', icon: Icons.refresh, onClick: () => toast()?.info('Reprovision', 'Select Cloud PCs to reprovision.'), type: 'default' },
    { label: 'Export', icon: Icons.download, onClick: () => {
        exportCsv('cloud_pcs.csv', ['Cloud PC name', 'Primary user', 'Status', 'Policy', 'Specs', 'Network', 'Last seen'], cloudPCs.map(c => [c.name, c.user, c.status, c.policy, c.specs, c.network, c.lastSeen]));
        toast()?.success('Export', 'Cloud PC inventory exported.');
      }, type: 'default' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderAllCloudPCs, type: 'default' },
  ]);

  el.innerHTML = `
    <h1 class="page-title">All Cloud PCs</h1>
    <p class="page-subtitle">Monitor, configure, and remotely control Windows 365 Cloud PCs across your organization.</p>

    <div class="content-card" style="padding:0;">
      <div class="grid-toolbar" style="padding:12px 16px;">
        <div class="grid-toolbar__search">
          <span style="display:flex">${Icons.search}</span>
          <input type="text" placeholder="Search Cloud PCs by name or user..." id="cpc-search">
        </div>
        <span style="font-size:12px;color:var(--color-text-secondary);margin-left:auto;">${cloudPCs.length} Cloud PCs</span>
      </div>
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Cloud PC name</th><th>Primary user</th><th>Status</th><th>Provisioning policy</th><th>Configuration</th><th>Actions</th></tr>
          </thead>
          <tbody id="cpc-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  const renderList = (items) => {
    const tbody = document.getElementById('cpc-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    for (const c of items) {
      const tr = createElement('tr');
      const pillCls = c.status === 'Provisioned' ? 'compliant' : 'warning';
      tr.innerHTML = `
        <td><span class="cell-link" style="font-weight:600;">${escapeHtml(c.name)}</span></td>
        <td>${escapeHtml(c.user)}</td>
        <td><span class="status-pill status-pill--${pillCls}"><span class="status-pill__dot"></span>${escapeHtml(c.status)}</span></td>
        <td>${escapeHtml(c.policy)}</td>
        <td style="font-size:12px;color:var(--color-text-secondary);">${escapeHtml(c.specs)}</td>
        <td>
          <div style="display:flex;gap:4px;">
            <button class="btn btn-sm btn-default cpc-restart-btn" data-name="${c.name}" title="Restart Cloud PC">${Icons.restart} Restart</button>
            <button class="btn btn-sm btn-default cpc-blade-btn" title="Open Cloud PC blade">Manage</button>
          </div>
        </td>
      `;
      tr.querySelector('.cell-link')?.addEventListener('click', () => showCloudPCDetailsBlade(c, renderAllCloudPCs));
      tr.querySelector('.cpc-blade-btn')?.addEventListener('click', () => showCloudPCDetailsBlade(c, renderAllCloudPCs));
      tr.querySelector('.cpc-restart-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toast()?.success('Restart signal', `Restart command sent to ${c.name}.`);
      });
      tbody.appendChild(tr);
    }
  };

  renderList(cloudPCs);

  document.getElementById('cpc-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderList(cloudPCs.filter(c => c.name.toLowerCase().includes(q) || c.user.toLowerCase().includes(q)));
  });
}

/* ══════════════════════════════════════════════════
   CUSTOM IMAGES
   ══════════════════════════════════════════════════ */
export function renderCustomImages() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Add image', icon: Icons.add, onClick: createCustomImage, type: 'primary' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderCustomImages, type: 'default' },
  ]);

  let images = Store.getAll(Collections.CLOUD_IMAGES);
  if (images.length === 0) {
    images = [
      { id: 'img-1', name: 'Contoso-Win11-23H2-Dev-v2', os: 'Windows 11 Enterprise (23H2)', status: 'Ready', size: '128 GB', date: 'Aug 10, 2024' },
      { id: 'img-2', name: 'Contoso-Win11-22H2-Baseline-v1', os: 'Windows 11 Enterprise (22H2)', status: 'Ready', size: '64 GB', date: 'May 14, 2024' },
    ];
    images.forEach(img => Store.create(Collections.CLOUD_IMAGES, img));
  }

  el.innerHTML = `
    <h1 class="page-title">Custom device images</h1>
    <p class="page-subtitle">Manage customized enterprise OS images for Windows 365 Cloud PC deployments.</p>

    <div class="content-card" style="padding:0;">
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Image name</th><th>Operating system</th><th>Status</th><th>Disk size</th><th>Added date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${images.map(img => `
              <tr>
                <td><strong>${escapeHtml(img.name)}</strong></td>
                <td>${escapeHtml(img.os)}</td>
                <td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>${escapeHtml(img.status)}</span></td>
                <td>${img.size}</td>
                <td>${img.date}</td>
                <td>
                  <button class="btn btn-sm btn-default" onclick="window.IntuneApp.toastManager.info('Image verified', 'Image checksum and Sysprep integrity valid.')">Verify</button>
                  <button class="btn-icon btn-delete" data-id="${img.id}" style="margin-left:6px;">${Icons.delete}</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  el.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Delete custom image?')) {
        Store.delete(Collections.CLOUD_IMAGES, btn.dataset.id);
        toast()?.success('Deleted', 'Custom image removed.');
        renderCustomImages();
      }
    });
  });
}

function createCustomImage() {
  document.getElementById('w365-modal')?.remove();
  const overlay = createElement('div', { id: 'w365-modal', className: 'blade-overlay visible', style: 'z-index:1500;display:flex;align-items:center;justify-content:center;' });
  const modal = createElement('div', { className: 'content-card', style: 'width:480px;max-width:90vw;background:var(--color-bg-surface);box-shadow:var(--shadow-64);border-radius:8px;padding:20px;' });

  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:1px solid var(--color-border);padding-bottom:10px;">
      <h3 style="font-size:16px;font-weight:600;margin:0;">Add Custom Device Image</h3>
      <button class="blade-panel__close" id="w365-modal-close" style="width:28px;height:28px;">${Icons.close}</button>
    </div>
    <div class="form-group"><label class="form-label required">Image Name</label><input class="form-input" id="img-name" placeholder="e.g. Contoso-Win11-24H2-Engineering"></div>
    <div class="form-group"><label class="form-label">Operating System</label><select class="form-input form-select" id="img-os"><option selected>Windows 11 Enterprise (24H2)</option><option>Windows 11 Enterprise (23H2)</option><option>Windows 10 Enterprise (22H2)</option></select></div>
    <div class="form-group"><label class="form-label">Image Source URI / Resource ID</label><input class="form-input" id="img-uri" placeholder="/subscriptions/.../galleries/.../images/..."></div>
    <div class="form-group"><label class="form-label">OS Disk Size</label><select class="form-input form-select" id="img-size"><option>64 GB</option><option selected>128 GB</option><option>256 GB</option></select></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
      <button class="btn btn-default" id="w365-cancel">Cancel</button>
      <button class="btn btn-primary" id="w365-submit">Add image</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  modal.querySelector('#w365-modal-close')?.addEventListener('click', close);
  modal.querySelector('#w365-cancel')?.addEventListener('click', close);

  modal.querySelector('#w365-submit')?.addEventListener('click', () => {
    const name = modal.querySelector('#img-name')?.value?.trim();
    if (!name) { toast()?.error('Validation', 'Image name is required.'); return; }
    Store.create(Collections.CLOUD_IMAGES, {
      id: generateId(),
      name,
      os: modal.querySelector('#img-os')?.value,
      size: modal.querySelector('#img-size')?.value,
      status: 'Ready',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    });
    toast()?.success('Added', `Custom image "${name}" added.`);
    close();
    renderCustomImages();
  });
}

/* ══════════════════════════════════════════════════
   AZURE NETWORK CONNECTIONS (ANC)
   ══════════════════════════════════════════════════ */
export function renderNetworkConnections() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Create connection', icon: Icons.add, onClick: createNetworkConnection, type: 'primary' },
    { label: 'Run checks', icon: Icons.refresh, onClick: () => toast()?.success('Health check', 'ANC diagnostic checks passed without error.'), type: 'default' },
  ]);

  let connections = Store.getAll(Collections.NETWORK_CONNECTIONS);
  if (connections.length === 0) {
    connections = [
      { id: 'anc-1', name: 'ANC-USWest-Production', joinType: 'Microsoft Entra join', vnet: 'vnet-uswest-prod (10.100.0.0/16)', subnet: 'snet-cloudpc (10.100.4.0/24)', status: 'All checks passed', lastCheck: '15 minutes ago' },
      { id: 'anc-2', name: 'ANC-Hybrid-CorpHQ', joinType: 'Hybrid Entra join', vnet: 'vnet-eastus-hub (10.200.0.0/16)', subnet: 'snet-hybrid-cpc (10.200.8.0/24)', status: 'All checks passed', lastCheck: '1 hour ago' },
    ];
    connections.forEach(c => Store.create(Collections.NETWORK_CONNECTIONS, c));
  }

  el.innerHTML = `
    <h1 class="page-title">Azure network connections</h1>
    <p class="page-subtitle">Connect Windows 365 Cloud PCs to on-premises resources and virtual networks.</p>

    <div class="content-card" style="padding:0;">
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Connection name</th><th>Join type</th><th>Virtual network</th><th>Subnet</th><th>Health status</th><th>Last check</th><th></th></tr>
          </thead>
          <tbody>
            ${connections.map(c => `
              <tr>
                <td><strong>${escapeHtml(c.name)}</strong></td>
                <td>${escapeHtml(c.joinType)}</td>
                <td>${escapeHtml(c.vnet)}</td>
                <td>${escapeHtml(c.subnet)}</td>
                <td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>${escapeHtml(c.status)}</span></td>
                <td>${escapeHtml(c.lastCheck)}</td>
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
      if (confirm('Delete network connection?')) {
        Store.delete(Collections.NETWORK_CONNECTIONS, btn.dataset.id);
        toast()?.success('Deleted', 'Network connection removed.');
        renderNetworkConnections();
      }
    });
  });
}

function createNetworkConnection() {
  document.getElementById('w365-modal')?.remove();
  const overlay = createElement('div', { id: 'w365-modal', className: 'blade-overlay visible', style: 'z-index:1500;display:flex;align-items:center;justify-content:center;' });
  const modal = createElement('div', { className: 'content-card', style: 'width:480px;max-width:90vw;background:var(--color-bg-surface);box-shadow:var(--shadow-64);border-radius:8px;padding:20px;' });

  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:1px solid var(--color-border);padding-bottom:10px;">
      <h3 style="font-size:16px;font-weight:600;margin:0;">Create Azure Network Connection</h3>
      <button class="blade-panel__close" id="w365-modal-close" style="width:28px;height:28px;">${Icons.close}</button>
    </div>
    <div class="form-group"><label class="form-label required">Connection Name</label><input class="form-input" id="anc-name" placeholder="e.g. ANC-EastUS-Branch"></div>
    <div class="form-group"><label class="form-label">Join Type</label><select class="form-input form-select" id="anc-join"><option selected>Microsoft Entra join</option><option>Hybrid Entra join</option></select></div>
    <div class="form-group"><label class="form-label">Azure Virtual Network</label><select class="form-input form-select" id="anc-vnet"><option selected>vnet-production-eastus (10.150.0.0/16)</option><option>vnet-corporate-westus (10.100.0.0/16)</option></select></div>
    <div class="form-group"><label class="form-label">Subnet</label><select class="form-input form-select" id="anc-subnet"><option selected>snet-cloudpc-pool (10.150.4.0/24)</option><option>snet-general (10.150.1.0/24)</option></select></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
      <button class="btn btn-default" id="w365-cancel">Cancel</button>
      <button class="btn btn-primary" id="w365-submit">Create connection</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  modal.querySelector('#w365-modal-close')?.addEventListener('click', close);
  modal.querySelector('#w365-cancel')?.addEventListener('click', close);

  modal.querySelector('#w365-submit')?.addEventListener('click', () => {
    const name = modal.querySelector('#anc-name')?.value?.trim();
    if (!name) { toast()?.error('Validation', 'Connection name is required.'); return; }
    Store.create(Collections.NETWORK_CONNECTIONS, {
      id: generateId(),
      name,
      joinType: modal.querySelector('#anc-join')?.value,
      vnet: modal.querySelector('#anc-vnet')?.value,
      subnet: modal.querySelector('#anc-subnet')?.value,
      status: 'All checks passed',
      lastCheck: 'Just now',
    });
    toast()?.success('Created', `Network connection "${name}" configured.`);
    close();
    renderNetworkConnections();
  });
}

/* ══════════════════════════════════════════════════
   ENDPOINT PRIVILEGE MANAGEMENT (EPM)
   ══════════════════════════════════════════════════ */
export function renderEPM() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Create elevation rule', icon: Icons.add, onClick: createEPMRule, type: 'primary' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderEPM, type: 'default' },
  ]);

  let rules = Store.getAll(Collections.EPM_POLICIES);
  if (rules.length === 0) {
    rules = [
      { id: 'epm-1', name: 'Elevate Visual Studio Installer', app: 'vs_installer.exe', type: 'Automatic elevation', assigned: 'Software Developers', status: 'Active' },
      { id: 'epm-2', name: 'Elevate Wireshark Network Capture', app: 'wireshark.exe', type: 'User confirmed (with business justification)', assigned: 'Network Engineers', status: 'Active' },
      { id: 'epm-3', name: 'Elevate Azure CLI & PowerShell Core', app: 'pwsh.exe', type: 'Support approved', assigned: 'IT Administrators', status: 'Active' },
    ];
    rules.forEach(r => Store.create(Collections.EPM_POLICIES, r));
  }

  el.innerHTML = `
    <h1 class="page-title">Endpoint Privilege Management (EPM)</h1>
    <p class="page-subtitle">Allow standard users to run approved administrative tasks without full local admin rights.</p>

    <div class="tile-grid" style="grid-template-columns:repeat(3, 1fr);margin-bottom:20px;">
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Elevation rules</span></div>
        <div class="tile__value" style="color:var(--color-primary)">${rules.length}</div>
        <div class="tile__label">Active policies</div>
      </div>
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Elevations today</span></div>
        <div class="tile__value" style="color:var(--color-success)">18</div>
        <div class="tile__label">Completed successfully</div>
      </div>
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Pending approvals</span></div>
        <div class="tile__value" style="color:var(--color-warning)">0</div>
        <div class="tile__label">All requests reviewed</div>
      </div>
    </div>

    <div class="content-card" style="padding:0;">
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Rule name</th><th>Executable name</th><th>Elevation type</th><th>Assigned group</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            ${rules.map(r => `
              <tr>
                <td><strong>${escapeHtml(r.name)}</strong></td>
                <td><code style="background:var(--color-bg-subtle);padding:2px 6px;border-radius:4px;">${escapeHtml(r.app)}</code></td>
                <td><span class="tag">${escapeHtml(r.type)}</span></td>
                <td>${escapeHtml(r.assigned)}</td>
                <td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>${escapeHtml(r.status)}</span></td>
                <td><button class="btn-icon btn-delete" data-id="${r.id}">${Icons.delete}</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  el.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Delete elevation rule?')) {
        Store.delete(Collections.EPM_POLICIES, btn.dataset.id);
        toast()?.success('Deleted', 'Elevation rule removed.');
        renderEPM();
      }
    });
  });
}

function createEPMRule() {
  document.getElementById('w365-modal')?.remove();
  const overlay = createElement('div', { id: 'w365-modal', className: 'blade-overlay visible', style: 'z-index:1500;display:flex;align-items:center;justify-content:center;' });
  const modal = createElement('div', { className: 'content-card', style: 'width:480px;max-width:90vw;background:var(--color-bg-surface);box-shadow:var(--shadow-64);border-radius:8px;padding:20px;' });

  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:1px solid var(--color-border);padding-bottom:10px;">
      <h3 style="font-size:16px;font-weight:600;margin:0;">Create Elevation Rule</h3>
      <button class="blade-panel__close" id="w365-modal-close" style="width:28px;height:28px;">${Icons.close}</button>
    </div>
    <div class="form-group"><label class="form-label required">Rule Name</label><input class="form-input" id="epm-name" placeholder="e.g. Elevate Docker Desktop"></div>
    <div class="form-group"><label class="form-label required">File / Executable Name</label><input class="form-input" id="epm-app" placeholder="e.g. Docker Desktop Installer.exe"></div>
    <div class="form-group"><label class="form-label">Elevation Type</label><select class="form-input form-select" id="epm-type"><option selected>Automatic elevation</option><option>User confirmed (with business justification)</option><option>Support approved</option></select></div>
    <div class="form-group"><label class="form-label">Validation Type</label><select class="form-input form-select" id="epm-val"><option selected>Publisher certificate + file hash</option><option>File hash (SHA-256)</option><option>Internal file path</option></select></div>
    <div class="form-group"><label class="form-label">Assigned Group</label><select class="form-input form-select" id="epm-assign"><option>Software Developers</option><option>Network Engineers</option><option>IT Administrators</option><option>All Corporate Users</option></select></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
      <button class="btn btn-default" id="w365-cancel">Cancel</button>
      <button class="btn btn-primary" id="w365-submit">Create rule</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  modal.querySelector('#w365-modal-close')?.addEventListener('click', close);
  modal.querySelector('#w365-cancel')?.addEventListener('click', close);

  modal.querySelector('#w365-submit')?.addEventListener('click', () => {
    const name = modal.querySelector('#epm-name')?.value?.trim();
    const app = modal.querySelector('#epm-app')?.value?.trim();
    if (!name || !app) { toast()?.error('Validation', 'Rule name and application file name are required.'); return; }
    Store.create(Collections.EPM_POLICIES, {
      id: generateId(),
      name,
      app,
      type: modal.querySelector('#epm-type')?.value,
      assigned: modal.querySelector('#epm-assign')?.value,
      status: 'Active',
    });
    toast()?.success('Created', `Elevation rule "${name}" deployed.`);
    close();
    renderEPM();
  });
}

/* ══════════════════════════════════════════════════
   ENTERPRISE APP CATALOG
   ══════════════════════════════════════════════════ */
export function renderEnterpriseAppCatalog() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Check for updates', icon: Icons.refresh, onClick: () => toast()?.success('Catalog', 'All Enterprise App packages up to date.'), type: 'default' },
  ]);

  const catalogApps = [
    { name: '7-Zip (64-bit)', publisher: 'Igor Pavlov', version: '24.07', size: '1.5 MB', autoUpdate: 'Enabled' },
    { name: 'Google Chrome Enterprise', publisher: 'Google LLC', version: '128.0.6613.85', size: '104 MB', autoUpdate: 'Enabled' },
    { name: 'Notepad++', publisher: 'Don Ho', version: '8.6.9', size: '4.8 MB', autoUpdate: 'Enabled' },
    { name: 'Zoom Client for Meetings', publisher: 'Zoom Video Communications', version: '6.1.5', size: '68 MB', autoUpdate: 'Enabled' },
    { name: 'Adobe Acrobat Reader (64-bit)', publisher: 'Adobe Systems', version: '24.002.20965', size: '320 MB', autoUpdate: 'Enabled' },
  ];

  el.innerHTML = `
    <h1 class="page-title">Enterprise App Catalog</h1>
    <p class="page-subtitle">Deploy pre-packaged, verified Win32 applications with automated patch management.</p>

    <div class="content-card" style="padding:0;">
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Application</th><th>Publisher</th><th>Version</th><th>Package size</th><th>Self-updating</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${catalogApps.map(app => `
              <tr>
                <td><strong>${escapeHtml(app.name)}</strong></td>
                <td>${escapeHtml(app.publisher)}</td>
                <td>${escapeHtml(app.version)}</td>
                <td>${app.size}</td>
                <td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>${app.autoUpdate}</span></td>
                <td><button class="btn btn-sm btn-primary catalog-deploy-btn" data-app="${app.name}">Add to tenant</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  el.querySelectorAll('.catalog-deploy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      toast()?.success('App deployed', `${btn.dataset.app} added to Managed Apps catalog.`);
    });
  });
}

/* ══════════════════════════════════════════════════
   CLOUD PKI
   ══════════════════════════════════════════════════ */
export function renderCloudPKI() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Create CA', icon: Icons.add, onClick: createCloudPKICA, type: 'primary' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderCloudPKI, type: 'default' },
  ]);

  let cas = Store.getAll('cloudPKICAs');
  if (cas.length === 0) {
    cas = [
      { id: 'ca-1', name: 'Contoso-CloudPKI-RootCA', type: 'Root CA', algo: 'RSA 4096 / SHA-256', status: 'Active', certs: '2 (Issuing CAs)', expires: 'Dec 31, 2039' },
      { id: 'ca-2', name: 'Contoso-CloudPKI-IssuingCA-01', type: 'Issuing CA (SCEP)', algo: 'RSA 2048 / SHA-256', status: 'Active', certs: '142 device certs', expires: 'Dec 31, 2029' },
    ];
    cas.forEach(c => Store.create('cloudPKICAs', c));
  }

  el.innerHTML = `
    <h1 class="page-title">Microsoft Cloud PKI</h1>
    <p class="page-subtitle">Cloud-native public key infrastructure for certificate-based authentication without on-premises NDES/SCEP servers.</p>

    <div class="content-card" style="padding:0;">
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>CA name</th><th>CA type</th><th>Algorithm</th><th>Status</th><th>Certificates issued</th><th>Expires</th><th></th></tr>
          </thead>
          <tbody>
            ${cas.map(ca => `
              <tr>
                <td><strong>${escapeHtml(ca.name)}</strong></td>
                <td><span class="tag">${escapeHtml(ca.type)}</span></td>
                <td>${escapeHtml(ca.algo)}</td>
                <td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>${escapeHtml(ca.status)}</span></td>
                <td>${escapeHtml(ca.certs)}</td>
                <td>${escapeHtml(ca.expires)}</td>
                <td><button class="btn-icon btn-delete" data-id="${ca.id}">${Icons.delete}</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  el.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Delete Certificate Authority?')) {
        Store.delete('cloudPKICAs', btn.dataset.id);
        toast()?.success('Deleted', 'Certification Authority removed.');
        renderCloudPKI();
      }
    });
  });
}

function createCloudPKICA() {
  document.getElementById('w365-modal')?.remove();
  const overlay = createElement('div', { id: 'w365-modal', className: 'blade-overlay visible', style: 'z-index:1500;display:flex;align-items:center;justify-content:center;' });
  const modal = createElement('div', { className: 'content-card', style: 'width:480px;max-width:90vw;background:var(--color-bg-surface);box-shadow:var(--shadow-64);border-radius:8px;padding:20px;' });

  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:1px solid var(--color-border);padding-bottom:10px;">
      <h3 style="font-size:16px;font-weight:600;margin:0;">Create Certification Authority</h3>
      <button class="blade-panel__close" id="w365-modal-close" style="width:28px;height:28px;">${Icons.close}</button>
    </div>
    <div class="form-group"><label class="form-label required">CA Name</label><input class="form-input" id="ca-name" placeholder="e.g. Contoso-CloudPKI-IssuingCA-02"></div>
    <div class="form-group"><label class="form-label">CA Type</label><select class="form-input form-select" id="ca-type"><option selected>Issuing CA (SCEP)</option><option>Root CA</option><option>Bring Your Own CA (BYOCA)</option></select></div>
    <div class="form-group"><label class="form-label">Key Algorithm</label><select class="form-input form-select" id="ca-algo"><option selected>RSA 2048 / SHA-256</option><option>RSA 4096 / SHA-256</option><option>ECDSA P-256 / SHA-256</option></select></div>
    <div class="form-group"><label class="form-label">Validity Period</label><select class="form-input form-select" id="ca-val"><option selected>5 Years</option><option>10 Years</option><option>15 Years</option></select></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
      <button class="btn btn-default" id="w365-cancel">Cancel</button>
      <button class="btn btn-primary" id="w365-submit">Create CA</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  modal.querySelector('#w365-modal-close')?.addEventListener('click', close);
  modal.querySelector('#w365-cancel')?.addEventListener('click', close);

  modal.querySelector('#w365-submit')?.addEventListener('click', () => {
    const name = modal.querySelector('#ca-name')?.value?.trim();
    if (!name) { toast()?.error('Validation', 'CA name is required.'); return; }
    Store.create('cloudPKICAs', {
      id: generateId(),
      name,
      type: modal.querySelector('#ca-type')?.value,
      algo: modal.querySelector('#ca-algo')?.value,
      status: 'Active',
      certs: '0 device certs',
      expires: 'Dec 31, 2029',
    });
    toast()?.success('Created', `Certification Authority "${name}" initialized.`);
    close();
    renderCloudPKI();
  });
}

/* ══════════════════════════════════════════════════
   MICROSOFT TUNNEL FOR MAM
   ══════════════════════════════════════════════════ */
export function renderMicrosoftTunnel() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Create Tunnel policy', icon: Icons.add, onClick: createTunnelPolicy, type: 'primary' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderMicrosoftTunnel, type: 'default' },
  ]);

  let sites = Store.getAll('tunnelSites');
  if (sites.length === 0) {
    sites = [
      { id: 'tun-1', name: 'US-West-GatewaySite', host: 'tunnel-uswest.contoso.com', port: '443 (TCP/UDP)', status: 'Online', health: 'Healthy (0 packet loss)' },
      { id: 'tun-2', name: 'EU-North-GatewaySite', host: 'tunnel-eunorth.contoso.com', port: '443 (TCP/UDP)', status: 'Online', health: 'Healthy (0 packet loss)' },
    ];
    sites.forEach(s => Store.create('tunnelSites', s));
  }

  el.innerHTML = `
    <h1 class="page-title">Microsoft Tunnel for MAM</h1>
    <p class="page-subtitle">Provide secure per-app VPN access to internal corporate web apps from unmanaged personal devices.</p>

    <div class="tile-grid" style="grid-template-columns:repeat(3, 1fr);margin-bottom:20px;">
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Gateway servers</span></div>
        <div class="tile__value" style="color:var(--color-success)">${sites.length} Online</div>
        <div class="tile__label">Linux Docker hosts</div>
      </div>
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Active sessions</span></div>
        <div class="tile__value" style="color:var(--color-primary)">34</div>
        <div class="tile__label">Connected MAM applications</div>
      </div>
      <div class="tile">
        <div class="tile__header"><span class="tile__title">IP pool utilization</span></div>
        <div class="tile__value" style="color:var(--color-primary)">14%</div>
        <div class="tile__label">10.150.0.0/20 subnet</div>
      </div>
    </div>

    <div class="content-card">
      <h2 class="content-card__title" style="margin-bottom:12px;">Tunnel configuration sites</h2>
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Site name</th><th>Server host</th><th>Port</th><th>Status</th><th>Health</th><th></th></tr>
          </thead>
          <tbody>
            ${sites.map(site => `
              <tr>
                <td><strong>${escapeHtml(site.name)}</strong></td>
                <td>${escapeHtml(site.host)}</td>
                <td>${escapeHtml(site.port)}</td>
                <td><span class="status-pill status-pill--compliant"><span class="status-pill__dot"></span>${escapeHtml(site.status)}</span></td>
                <td>${escapeHtml(site.health)}</td>
                <td><button class="btn-icon btn-delete" data-id="${site.id}">${Icons.delete}</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  el.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Delete Tunnel site?')) {
        Store.delete('tunnelSites', btn.dataset.id);
        toast()?.success('Deleted', 'Tunnel site configuration removed.');
        renderMicrosoftTunnel();
      }
    });
  });
}

function createTunnelPolicy() {
  document.getElementById('w365-modal')?.remove();
  const overlay = createElement('div', { id: 'w365-modal', className: 'blade-overlay visible', style: 'z-index:1500;display:flex;align-items:center;justify-content:center;' });
  const modal = createElement('div', { className: 'content-card', style: 'width:480px;max-width:90vw;background:var(--color-bg-surface);box-shadow:var(--shadow-64);border-radius:8px;padding:20px;' });

  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:1px solid var(--color-border);padding-bottom:10px;">
      <h3 style="font-size:16px;font-weight:600;margin:0;">Create Microsoft Tunnel Site</h3>
      <button class="blade-panel__close" id="w365-modal-close" style="width:28px;height:28px;">${Icons.close}</button>
    </div>
    <div class="form-group"><label class="form-label required">Site Name</label><input class="form-input" id="tun-name" placeholder="e.g. EastUS-Secondary-GatewaySite"></div>
    <div class="form-group"><label class="form-label required">Server Hostname / FQDN</label><input class="form-input" id="tun-host" placeholder="e.g. tunnel-east.contoso.com"></div>
    <div class="form-group"><label class="form-label">Port</label><input class="form-input" id="tun-port" value="443" placeholder="443"></div>
    <div class="form-group"><label class="form-label">Client IP Address Pool</label><input class="form-input" id="tun-pool" value="10.160.0.0/20"></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
      <button class="btn btn-default" id="w365-cancel">Cancel</button>
      <button class="btn btn-primary" id="w365-submit">Create site</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  modal.querySelector('#w365-modal-close')?.addEventListener('click', close);
  modal.querySelector('#w365-cancel')?.addEventListener('click', close);

  modal.querySelector('#w365-submit')?.addEventListener('click', () => {
    const name = modal.querySelector('#tun-name')?.value?.trim();
    const host = modal.querySelector('#tun-host')?.value?.trim();
    if (!name || !host) { toast()?.error('Validation', 'Site name and host FQDN are required.'); return; }
    Store.create('tunnelSites', {
      id: generateId(),
      name,
      host,
      port: `${modal.querySelector('#tun-port')?.value || '443'} (TCP/UDP)`,
      status: 'Online',
      health: 'Healthy (0 packet loss)',
    });
    toast()?.success('Created', `Tunnel site "${name}" deployed.`);
    close();
    renderMicrosoftTunnel();
  });
}

/* ══════════════════════════════════════════════════
   ADVANCED ANALYTICS
   ══════════════════════════════════════════════════ */
export function renderAdvancedAnalytics() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Export insights', icon: Icons.download, onClick: () => toast()?.success('Export', 'Analytics data exported to CSV.'), type: 'default' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderAdvancedAnalytics, type: 'default' },
  ]);

  el.innerHTML = `
    <h1 class="page-title">Advanced Analytics</h1>
    <p class="page-subtitle">AI-powered endpoint telemetry, device anomaly detection, and battery health forecasting.</p>

    <div class="tile-grid" style="grid-template-columns:repeat(4, 1fr);margin-bottom:20px;">
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Device health score</span></div>
        <div class="tile__value" style="color:var(--color-success)">88 / 100</div>
        <div class="tile__label">Top quartile performance</div>
      </div>
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Anomalies detected</span></div>
        <div class="tile__value" style="color:var(--color-warning)">2 devices</div>
        <div class="tile__label">High crash frequency</div>
      </div>
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Battery health degradation</span></div>
        <div class="tile__value" style="color:var(--color-primary)">1 device</div>
        <div class="tile__label">&lt; 50% capacity remaining</div>
      </div>
      <div class="tile">
        <div class="tile__header"><span class="tile__title">App stop errors</span></div>
        <div class="tile__value" style="color:var(--color-primary)">0.4%</div>
        <div class="tile__label">Low crash rate</div>
      </div>
    </div>

    <div class="content-card">
      <h2 class="content-card__title" style="margin-bottom:12px;">Device timeline & detected anomalies</h2>
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Device</th><th>User</th><th>Anomaly type</th><th>Impact</th><th>Recommended remediation</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>DESKTOP-WIN02</strong></td>
              <td>Mike Williams</td>
              <td><span class="tag" style="background:#FDE7E9;color:#A4262C;">Blue screen / BugCheck 0x9F</span></td>
              <td>3 crashes in 48 hrs</td>
              <td>Update Intel Wi-Fi driver to v23.40</td>
            </tr>
            <tr>
              <td><strong>LAPTOP-WIN05</strong></td>
              <td>Alex Johnson</td>
              <td><span class="tag" style="background:#FFF4CE;color:#7A5E00;">Battery degradation</span></td>
              <td>Capacity at 44%</td>
              <td>Schedule battery replacement</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

