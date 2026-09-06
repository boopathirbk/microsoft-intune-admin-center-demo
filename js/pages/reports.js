/* ============================================================
   Reports Page Module
   Overview, Device Compliance, Endpoint Analytics
   ============================================================ */

import { Icons, createElement, clearElement, $, generateId, formatDate, escapeHtml, exportCsv } from '../utils.js';
import { Store, Collections } from '../store.js';
import { router } from '../router.js';
import { DonutChart, BarChart, LineChart } from '../components/charts.js';

function getContentEl() { return $('#page-content'); }
function getCommandBar() { return window.IntuneApp?.commandBar; }
function toast() { return window.IntuneApp?.toastManager; }

/* ══════════════════════════════════════════════════
   REPORTS OVERVIEW
   ══════════════════════════════════════════════════ */
export function renderReportsOverview() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([{ label: 'Refresh', icon: Icons.refresh, onClick: renderReportsOverview, type: 'default' }]);

  const devices = Store.getAll(Collections.DEVICES);
  const apps = Store.getAll(Collections.APPS);
  const compStats = Store.getStats(Collections.DEVICES, 'complianceState');

  el.innerHTML = `
    <h1 class="page-title">Reports</h1>
    <div class="tile-grid">
      <div class="tile" id="rep-dev-comp"><div class="tile__header"><span class="tile__title">Device compliance</span></div><div class="tile__value" style="color:var(--color-success)">${compStats['Compliant']||0} / ${devices.length}</div><div class="tile__label">Compliant devices</div></div>
      <div class="tile" id="rep-ep-ana"><div class="tile__header"><span class="tile__title">Endpoint analytics</span></div><div class="tile__value" style="color:var(--color-primary)">82</div><div class="tile__label">Overall score (out of 100)</div></div>
      <div class="tile" id="rep-app-rep"><div class="tile__header"><span class="tile__title">App installs</span></div><div class="tile__value" style="color:var(--color-primary)">${apps.length}</div><div class="tile__label">Monitored apps</div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div class="content-card">
        <div class="content-card__header"><h2 class="content-card__title">Available reports</h2></div>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:12px;">
          <li><a href="#/reports/device-compliance" style="color:var(--color-primary);text-decoration:none;display:flex;align-items:center;gap:8px;">${Icons.security} Device compliance report</a></li>
          <li><a href="#/reports/endpoint-analytics" style="color:var(--color-primary);text-decoration:none;display:flex;align-items:center;gap:8px;">${Icons.analytics} Endpoint analytics</a></li>
          <li><a href="#/reports/device-enrollment" style="color:var(--color-primary);text-decoration:none;display:flex;align-items:center;gap:8px;">${Icons.enrollment} Device enrollment report</a></li>
          <li><a href="#/reports/app-reports" style="color:var(--color-primary);text-decoration:none;display:flex;align-items:center;gap:8px;">${Icons.apps} App install status report</a></li>
        </ul>
      </div>
      <div class="content-card">
        <div class="content-card__header"><h2 class="content-card__title">Compliance breakdown</h2></div>
        <div style="display:flex;gap:24px;align-items:flex-start;">
          <canvas id="rep-donut" style="max-width:180px;"></canvas>
          <div id="rep-donut-legend" class="chart-legend" style="min-width:160px;"></div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('rep-dev-comp')?.addEventListener('click', () => router.navigate('/reports/device-compliance'));
  document.getElementById('rep-ep-ana')?.addEventListener('click', () => router.navigate('/reports/endpoint-analytics'));
  document.getElementById('rep-app-rep')?.addEventListener('click', () => router.navigate('/reports/app-reports'));

  const segments = [
    { label: 'Compliant', value: compStats['Compliant']||0, color: '#107C10' },
    { label: 'Noncompliant', value: compStats['Noncompliant']||0, color: '#D13438' },
    { label: 'In grace period', value: compStats['In grace period']||0, color: '#FFB900' },
  ];
  new DonutChart($('#rep-donut'), { width: 180, height: 180, outerRadius: 80, innerRadius: 50, segments, centerText: String(devices.length) }).draw();
  DonutChart.renderLegend($('#rep-donut-legend'), segments);
}

/* ══════════════════════════════════════════════════
   DEVICE COMPLIANCE REPORT
   ══════════════════════════════════════════════════ */
export function renderDeviceComplianceReport() {
  const el = getContentEl(); clearElement(el);
  const devices = Store.getAll(Collections.DEVICES);
  const stats = Store.getStats(Collections.DEVICES, 'complianceState');
  const nc = devices.filter(d => d.complianceState === 'Noncompliant' || d.complianceState === 'In grace period');

  getCommandBar()?.setActions([
    { label: 'Export', icon: Icons.download, onClick: () => {
        exportCsv('device_compliance_report.csv', ['Device name', 'User', 'OS', 'Compliance state', 'Reasons', 'Last check-in'], devices.map(d => [
          d.name,
          d.primaryUser || '—',
          d.osVersion || d.os,
          d.complianceState,
          (d.noncompliantReasons || []).join('; '),
          formatDate(d.lastCheckIn)
        ]));
        toast()?.success('Export', 'Device compliance report exported to CSV.');
      }, type: 'default' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderDeviceComplianceReport, type: 'default' },
  ]);

  // Trend data mock
  const trendData = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    trendData.push({ label: d.getDate(), value: Math.max(0, (stats['Noncompliant']||0) + Math.floor(Math.random() * 5) - 2) });
  }

  el.innerHTML = `
    <h1 class="page-title">Device compliance report</h1>
    <p class="page-subtitle">Historical trends and real-time noncompliant devices requiring remediation.</p>

    <div style="display:grid;grid-template-columns:1fr 2fr;gap:16px;margin-bottom:16px;">
      <div class="content-card">
        <div class="content-card__header"><h2 class="content-card__title">Compliance status</h2></div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:16px;">
          <canvas id="rep-comp-donut" style="max-width:200px;"></canvas>
          <div id="rep-comp-legend" class="chart-legend" style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;"></div>
        </div>
      </div>
      <div class="content-card">
        <div class="content-card__header"><h2 class="content-card__title">Noncompliant devices trend (30 days)</h2></div>
        <canvas id="rep-comp-trend"></canvas>
      </div>
    </div>

    <div class="content-card" style="padding:0;">
      <div class="grid-toolbar" style="padding:12px 16px;">
        <div class="grid-toolbar__search">
          <span style="display:flex">${Icons.search}</span>
          <input type="text" placeholder="Search noncompliant devices..." id="rep-nc-search">
        </div>
        <span style="font-size:12px;color:var(--color-text-secondary);margin-left:auto;">${nc.length} noncompliant</span>
      </div>
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead><tr><th>Device name</th><th>User</th><th>OS</th><th>Noncompliant reasons</th><th>Last check-in</th></tr></thead>
          <tbody id="rep-nc-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  // Charts
  const segments = [
    { label: 'Compliant', value: stats['Compliant']||0, color: '#107C10' },
    { label: 'Noncompliant', value: stats['Noncompliant']||0, color: '#D13438' },
    { label: 'In grace period', value: stats['In grace period']||0, color: '#FFB900' },
    { label: 'Not evaluated', value: stats['Not evaluated']||0, color: '#8A8886' },
  ];
  new DonutChart($('#rep-comp-donut'), { width: 200, height: 200, outerRadius: 90, innerRadius: 60, segments, centerText: String(devices.length) }).draw();
  DonutChart.renderLegend($('#rep-comp-legend'), segments);
  new LineChart($('#rep-comp-trend'), { width: 600, height: 220, data: trendData, color: '#D13438' }).draw();

  const renderList = (items) => {
    const tbody = document.getElementById('rep-nc-tbody');
    if (!tbody) return;
    if (items.length === 0) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--color-text-secondary);">No noncompliant devices found.</td></tr>'; return; }
    tbody.innerHTML = '';
    for (const d of items) {
      const tr = createElement('tr');
      tr.innerHTML = `<td><strong>${escapeHtml(d.name)}</strong></td><td>${escapeHtml(d.primaryUser||'—')}</td><td>${escapeHtml(d.osVersion||d.os)}</td><td><span class="tag" style="background:#FDE7E9;color:#A4262C;">${escapeHtml((d.noncompliantReasons||[]).join(', ') || 'Password length / BitLocker')}</span></td><td>${formatDate(d.lastCheckIn)}</td>`;
      tbody.appendChild(tr);
    }
  };

  renderList(nc);
  document.getElementById('rep-nc-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderList(nc.filter(d => d.name.toLowerCase().includes(q) || (d.primaryUser||'').toLowerCase().includes(q)));
  });
}

/* ══════════════════════════════════════════════════
   ENDPOINT ANALYTICS
   ══════════════════════════════════════════════════ */
export function renderEndpointAnalytics() {
  const el = getContentEl(); clearElement(el);
  getCommandBar()?.setActions([
    { label: 'Export scores', icon: Icons.download, onClick: () => {
        exportCsv('endpoint_analytics_scores.csv', ['Category', 'Score', 'Baseline', 'Status'], [
          ['Overall Score', '82', '50', 'Good'],
          ['Startup Performance', '78', '50', 'Good'],
          ['App Reliability', '85', '50', 'Good'],
          ['Work From Anywhere', '91', '50', 'Excellent']
        ]);
        toast()?.success('Export', 'Endpoint analytics scores exported to CSV.');
      }, type: 'default' },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderEndpointAnalytics, type: 'default' }
  ]);

  el.innerHTML = `
    <h1 class="page-title">Endpoint analytics</h1>
    <p class="page-subtitle">Quantify and improve user experience across your organization with performance insights and AI recommendations.</p>
    
    <div class="content-card" style="margin-bottom:16px;display:flex;align-items:center;gap:24px;">
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:120px;height:120px;border-radius:50%;border:8px solid var(--color-success);color:var(--color-success);">
        <span style="font-size:32px;font-weight:700;">82</span>
        <span style="font-size:12px;font-weight:600;text-transform:uppercase;">Score</span>
      </div>
      <div style="flex:1;">
        <h2 style="font-size:20px;font-weight:600;margin-bottom:8px;">Endpoint analytics score</h2>
        <p style="color:var(--color-text-secondary);font-size:14px;margin-bottom:12px;">Your score is 32 points higher than the commercial baseline of 50. Devices are delivering high performance.</p>
        <div style="display:flex;gap:32px;">
          <div><div style="font-size:24px;font-weight:600;color:var(--color-primary);">78</div><div style="font-size:12px;color:var(--color-text-secondary);">Startup performance</div></div>
          <div><div style="font-size:24px;font-weight:600;color:var(--color-success);">85</div><div style="font-size:12px;color:var(--color-text-secondary);">App reliability</div></div>
          <div><div style="font-size:24px;font-weight:600;color:var(--color-success);">91</div><div style="font-size:12px;color:var(--color-text-secondary);">Work from anywhere</div></div>
        </div>
      </div>
    </div>
    
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div class="content-card">
        <h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Top app reliability issues</h3>
        <table class="data-grid"><thead><tr><th>Model</th><th>Boot time</th></tr></thead><tbody>
          <tr><td>Surface Pro 8</td><td>18s</td></tr>
          <tr><td>Lenovo ThinkPad T14</td><td>22s</td></tr>
          <tr><td>Dell Latitude 5420</td><td>25s</td></tr>
        </tbody></table>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════
   DEVICE ENROLLMENT REPORT
   ══════════════════════════════════════════════════ */
export function renderDeviceEnrollmentReport() {
  const el = getContentEl(); clearElement(el);

  const failures = [
    { user: 'Sarah Chen', model: 'Personal Samsung Galaxy S21', os: 'Android 9', code: '0x80180014', reason: 'OS version below minimum required (Android 10+)', date: 'Sep 02, 2024' },
    { user: 'Mike Williams', model: 'MacBook Pro 16"', os: 'macOS 14.5', code: '0x87D1041C', reason: 'Personally owned devices blocked by restriction policy', date: 'Aug 29, 2024' },
    { user: 'Alex Johnson', model: 'DESKTOP-TEST99', os: 'Windows 11 23H2', code: '0x800705B4', reason: 'Autopilot ESP timeout during app installation', date: 'Aug 19, 2024' },
    { user: 'David Kim', model: 'Google Pixel 6a', os: 'Android 14', code: '0x80180026', reason: 'User reached maximum device enrollment limit (15 devices)', date: 'Aug 12, 2024' },
    { user: 'Emily Watson', model: 'iPad Air 5th Gen', os: 'iPadOS 16.2', code: '0x87D103E8', reason: 'Apple MDM Push certificate handshake timeout', date: 'Aug 04, 2024' },
  ];

  getCommandBar()?.setActions([
    {
      label: 'Export report',
      icon: Icons.download,
      onClick: () => {
        exportCsv(
          'device_enrollment_failures.csv',
          ['User', 'Device model', 'OS', 'Failure code', 'Failure reason', 'Date'],
          failures.map(f => [f.user, f.model, f.os, f.code, f.reason, f.date])
        );
        toast()?.success('Export', 'Enrollment failures log exported to CSV.');
      },
      type: 'default',
    },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderDeviceEnrollmentReport, type: 'default' },
  ]);

  const devices = Store.getAll(Collections.DEVICES);

  el.innerHTML = `
    <h1 class="page-title">Device enrollment report</h1>
    <p class="page-subtitle">Historical analysis of device registration, Autopilot deployments, and enrollment restriction blocks.</p>

    <div class="tile-grid" style="grid-template-columns:repeat(3, 1fr);margin-bottom:20px;">
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Total enrolled</span></div>
        <div class="tile__value" style="color:var(--color-primary)">${devices.length}</div>
        <div class="tile__label">Active enrollments</div>
      </div>
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Autopilot success rate</span></div>
        <div class="tile__value" style="color:var(--color-success)">95.4%</div>
        <div class="tile__label">ESP completed without error</div>
      </div>
      <div class="tile">
        <div class="tile__header"><span class="tile__title">Enrollment blocks (30d)</span></div>
        <div class="tile__value" style="color:var(--color-warning)">${failures.length} blocked</div>
        <div class="tile__label">Platform restriction violations</div>
      </div>
    </div>

    <div class="content-card" style="padding:0;margin-bottom:16px;">
      <div class="grid-toolbar" style="padding:12px 16px;">
        <div class="grid-toolbar__search">
          <span style="display:flex">${Icons.search}</span>
          <input type="text" placeholder="Search enrollment failure logs..." id="enroll-fail-search" aria-label="Search enrollment failures">
        </div>
        <span style="font-size:12px;color:var(--color-text-secondary);margin-left:auto;" id="enroll-fail-count">${failures.length} logged incidents</span>
      </div>
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>User</th><th>Device model</th><th>OS</th><th>Failure code</th><th>Failure reason</th><th>Date</th></tr>
          </thead>
          <tbody id="enroll-fail-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  const renderFailures = (list) => {
    const tbody = document.getElementById('enroll-fail-tbody');
    if (!tbody) return;
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--color-text-secondary);">No enrollment failures matching filter.</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    for (const f of list) {
      const tr = createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(f.user)}</strong></td>
        <td>${escapeHtml(f.model)}</td>
        <td>${escapeHtml(f.os)}</td>
        <td><span class="tag" style="background:rgba(241,112,123,0.18);color:#F1707B;font-family:monospace;">${escapeHtml(f.code)}</span></td>
        <td>${escapeHtml(f.reason)}</td>
        <td style="white-space:nowrap;">${escapeHtml(f.date)}</td>
      `;
      tbody.appendChild(tr);
    }
  };

  renderFailures(failures);

  document.getElementById('enroll-fail-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = failures.filter(f =>
      f.user.toLowerCase().includes(q) ||
      f.model.toLowerCase().includes(q) ||
      f.code.toLowerCase().includes(q) ||
      f.reason.toLowerCase().includes(q)
    );
    renderFailures(filtered);
    const countEl = document.getElementById('enroll-fail-count');
    if (countEl) countEl.textContent = `${filtered.length} logged incident${filtered.length !== 1 ? 's' : ''}`;
  });
}

/* ══════════════════════════════════════════════════
   APP REPORTS
   ══════════════════════════════════════════════════ */
export function renderAppReports() {
  const el = getContentEl(); clearElement(el);
  const apps = Store.getAll(Collections.APPS);

  const getAppData = (a) => {
    const inst = a.installStatus?.installed || Math.floor(Math.random() * 8) + 4;
    const fail = a.installStatus?.failed || (Math.random() > 0.7 ? 1 : 0);
    const total = inst + fail;
    const rate = total > 0 ? Math.round((inst / total) * 100) : 100;
    return { inst, fail, rate };
  };

  getCommandBar()?.setActions([
    {
      label: 'Export',
      icon: Icons.download,
      onClick: () => {
        exportCsv(
          'app_installation_report.csv',
          ['Application', 'Platform', 'Type', 'Installed', 'Failed', 'Success rate'],
          apps.map(a => {
            const data = getAppData(a);
            return [a.name, a.platform, a.type, data.inst, data.fail, `${data.rate}%`];
          })
        );
        toast()?.success('Export', 'App installation report exported to CSV.');
      },
      type: 'default',
    },
    { label: 'Refresh', icon: Icons.refresh, onClick: renderAppReports, type: 'default' },
  ]);

  el.innerHTML = `
    <h1 class="page-title">App installation and protection reports</h1>
    <p class="page-subtitle">Monitor application distribution status, deployment errors, and App Protection Policy check-ins.</p>

    <div class="content-card" style="padding:0;">
      <div class="grid-toolbar" style="padding:12px 16px;">
        <div class="grid-toolbar__search">
          <span style="display:flex">${Icons.search}</span>
          <input type="text" placeholder="Search application reports..." id="app-rep-search" aria-label="Search app reports">
        </div>
        <span style="font-size:12px;color:var(--color-text-secondary);margin-left:auto;" id="app-rep-count">${apps.length} applications</span>
      </div>
      <div class="data-grid-wrapper">
        <table class="data-grid">
          <thead>
            <tr><th>Application</th><th>Platform</th><th>Type</th><th>Installed</th><th>Failed</th><th>Install success rate</th></tr>
          </thead>
          <tbody id="app-rep-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  const renderAppRows = (list) => {
    const tbody = document.getElementById('app-rep-tbody');
    if (!tbody) return;
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--color-text-secondary);">No applications found</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    for (const a of list) {
      const { inst, fail, rate } = getAppData(a);
      const tr = createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(a.name)}</strong></td>
        <td>${escapeHtml(a.platform)}</td>
        <td><span class="tag">${escapeHtml(a.type)}</span></td>
        <td style="color:var(--color-success);font-weight:600;">${inst}</td>
        <td style="color:${fail > 0 ? 'var(--color-error)' : 'var(--color-text-secondary)'};font-weight:600;">${fail}</td>
        <td>
          <span class="status-pill status-pill--${rate >= 90 ? 'compliant' : 'warning'}">
            <span class="status-pill__dot"></span>${rate}%
          </span>
        </td>
      `;
      tbody.appendChild(tr);
    }
  };

  renderAppRows(apps);

  document.getElementById('app-rep-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = apps.filter(a => a.name.toLowerCase().includes(q) || (a.platform || '').toLowerCase().includes(q) || (a.type || '').toLowerCase().includes(q));
    renderAppRows(filtered);
    const countEl = document.getElementById('app-rep-count');
    if (countEl) countEl.textContent = `${filtered.length} application${filtered.length !== 1 ? 's' : ''}`;
  });
}


