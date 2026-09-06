/* ============================================================
   About Component — Comprehensive Lab Details, Verification & MD-102 Guide
   Author: Boopathi R. (https://github.com/boopathirbk)
   ============================================================ */

import { createElement, $, Icons } from '../utils.js';

export const GITHUB_REPO_URL = 'https://github.com/boopathirbk/microsoft-intune-admin-center-demo';
export const GITHUB_PROFILE_URL = 'https://github.com/boopathirbk';

const GITHUB_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`;

/**
 * Shows the comprehensive About this Lab modal
 */
export function showAboutLabModal(defaultTab = 'contents') {
  document.getElementById('about-lab-overlay')?.remove();

  const overlay = createElement('div', {
    id: 'about-lab-overlay',
    className: 'blade-overlay visible',
    style: 'z-index:3000;display:flex;align-items:center;justify-content:center;',
  });

  const modal = createElement('div', {
    className: 'study-modal-container',
    style: 'max-width:820px;width:92vw;',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'about-modal-title',
  });

  modal.innerHTML = `
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--color-border);background:var(--color-bg-surface);">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:36px;height:36px;border-radius:6px;background:linear-gradient(135deg,#0078D4,#005A9E);display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 2px 8px rgba(0,120,212,0.3);">
          ${Icons.info}
        </div>
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <h2 id="about-modal-title" style="font-size:16px;font-weight:700;margin:0;color:var(--color-text-primary);">
              About Microsoft Intune Admin Center Lab
            </h2>
            <span class="app-header__brand-badge" style="font-size:10px;">Interactive Demo</span>
          </div>
          <span style="font-size:12px;color:var(--color-text-secondary);">
            Official Microsoft Learn MD-102: Endpoint Administrator Aligned Simulator
          </span>
        </div>
      </div>
      <button class="blade-panel__close" id="about-modal-close" aria-label="Close dialog" style="width:32px;height:32px;">
        ${Icons.close}
      </button>
    </div>

    <!-- Navigation Tabs -->
    <div class="tabs-bar" style="padding:0 20px;background:var(--color-bg-surface);border-bottom:1px solid var(--color-border);display:flex;gap:4px;">
      <button class="tab-btn ${defaultTab === 'contents' ? 'active' : ''}" data-tab="contents" style="padding:10px 14px;font-size:13px;font-weight:600;">
        📦 What This Contains
      </button>
      <button class="tab-btn ${defaultTab === 'verification' ? 'active' : ''}" data-tab="verification" style="padding:10px 14px;font-size:13px;font-weight:600;">
        ✅ How It Was Verified
      </button>
      <button class="tab-btn ${defaultTab === 'audience' ? 'active' : ''}" data-tab="audience" style="padding:10px 14px;font-size:13px;font-weight:600;">
        🎯 Who It Helps
      </button>
      <button class="tab-btn ${defaultTab === 'author' ? 'active' : ''}" data-tab="author" style="padding:10px 14px;font-size:13px;font-weight:600;">
        ⭐ Author & Source
      </button>
    </div>

    <!-- Tab Contents -->
    <div style="padding:22px;overflow-y:auto;max-height:calc(85vh - 160px);display:flex;flex-direction:column;gap:16px;background:var(--color-bg-canvas);font-size:13px;line-height:1.6;">

      <!-- TAB 1: What This Contains -->
      <div id="tab-pane-contents" class="tab-pane" style="${defaultTab === 'contents' ? '' : 'display:none;'}">
        <div class="content-card" style="margin:0;padding:16px;border-left:4px solid #0078D4;">
          <h3 style="margin:0 0 8px 0;font-size:14px;font-weight:600;color:var(--color-text-primary);">
            An End-to-End Endpoint Management Sandbox
          </h3>
          <p style="margin:0;color:var(--color-text-secondary);">
            Unlike static documentation, this application provides an interactive replica of the modern Microsoft Intune admin center with <strong>77 registered routes</strong> across <strong>8 primary management hubs</strong>:
          </p>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin-top:4px;">
          <div class="content-card" style="margin:0;padding:14px;">
            <div style="font-weight:700;display:flex;align-items:center;gap:8px;color:var(--color-text-primary);margin-bottom:6px;">
              <span style="color:#0078D4;">${Icons.devices}</span> Devices Hub
            </div>
            <p style="margin:0;font-size:12px;color:var(--color-text-secondary);">
              Windows, macOS, iOS, Android inventory with live search, filters, column customizer, CSV export, and <strong>15 remote actions</strong> (BitLocker rotation, Windows LAPS, Remote Lock, Fresh Start, Diagnostics, Wipe).
            </p>
          </div>

          <div class="content-card" style="margin:0;padding:14px;">
            <div style="font-weight:700;display:flex;align-items:center;gap:8px;color:var(--color-text-primary);margin-bottom:6px;">
              <span style="color:#54B054;">${Icons.security}</span> Endpoint Security
            </div>
            <p style="margin:0;font-size:12px;color:var(--color-text-secondary);">
              Antivirus, Defender Firewall, Disk Encryption (BitLocker), Attack Surface Reduction (ASR), Account Protection, and Windows Update Rings with deferral and maintenance pause controls.
            </p>
          </div>

          <div class="content-card" style="margin:0;padding:14px;">
            <div style="font-weight:700;display:flex;align-items:center;gap:8px;color:var(--color-text-primary);margin-bottom:6px;">
              <span style="color:#FFB900;">${Icons.enrollment}</span> Windows Autopilot
            </div>
            <p style="margin:0;font-size:12px;color:var(--color-text-secondary);">
              Autopilot deployment profile creator, hardware hash CSV batch import simulation, device sync, profile assignment, and Enrollment Status Page (ESP) configuration.
            </p>
          </div>

          <div class="content-card" style="margin:0;padding:14px;">
            <div style="font-weight:700;display:flex;align-items:center;gap:8px;color:var(--color-text-primary);margin-bottom:6px;">
              <span style="color:#B146C2;">${Icons.apps}</span> Apps & MAM Policies
            </div>
            <p style="margin:0;font-size:12px;color:var(--color-text-secondary);">
              Win32, Store, and M365 app deployment, App Protection policies (MAM) with DLP encryption controls, quiet time policies, and app config profiles.
            </p>
          </div>

          <div class="content-card" style="margin:0;padding:14px;">
            <div style="font-weight:700;display:flex;align-items:center;gap:8px;color:var(--color-text-primary);margin-bottom:6px;">
              <span style="color:#00A4EF;">${Icons.cloud}</span> Windows 365
            </div>
            <p style="margin:0;font-size:12px;color:var(--color-text-secondary);">
              Cloud PC provisioning policies, Azure Network Connections, custom gallery images, point-in-time snapshot restores, and VM hardware resizing.
            </p>
          </div>

          <div class="content-card" style="margin:0;padding:14px;">
            <div style="font-weight:700;display:flex;align-items:center;gap:8px;color:var(--color-text-primary);margin-bottom:6px;">
              <span style="color:#F25022;">${Icons.puzzle}</span> Intune Suite & Reports
            </div>
            <p style="margin:0;font-size:12px;color:var(--color-text-secondary);">
              Endpoint Privilege Management (EPM), Enterprise App Catalog, Remote Help, Cloud PKI, MAM Tunnel, and visual compliance / analytics reports.
            </p>
          </div>
        </div>
      </div>

      <!-- TAB 2: How It Was Verified -->
      <div id="tab-pane-verification" class="tab-pane" style="${defaultTab === 'verification' ? '' : 'display:none;'}">
        <div class="content-card" style="margin:0;padding:16px;">
          <h3 style="margin:0 0 10px 0;font-size:14px;font-weight:600;color:var(--color-text-primary);display:flex;align-items:center;gap:8px;">
            <span style="color:var(--color-success);">${Icons.success}</span> Alignment with Official Microsoft Learn MD-102
          </h3>
          <p style="margin:0 0 12px 0;color:var(--color-text-secondary);">
            Every workflow, policy field, blade layout, and remote action was verified against Microsoft Learn course specifications and production Intune admin center environments:
          </p>
          <ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:8px;color:var(--color-text-secondary);">
            <li>
              <strong>MD-102 Curriculum Mapping:</strong> Covers Exam MD-102 domains including <em>Deploy and manage endpoints</em>, <em>Implement compliance and configuration</em>, <em>Protect devices</em>, and <em>Manage apps</em>.
            </li>
            <li>
              <strong>Live Intune Parity:</strong> Menu hierarchy, toolbar commands, slide-over blade anatomy, table column presets, and status pills replicate Microsoft's Fluent 2 design language.
            </li>
            <li>
              <strong>Zero Broken Handlers (100% Verified):</strong> All 77 routes and action handlers are verified with automated audit scripts ensuring zero 404s, missing views, or empty placeholders.
            </li>
            <li>
              <strong>Official Microsoft Fluent 2 Icons:</strong> Migrated to pixel-perfect vector SVGs from Microsoft's <code>@fluentui/svg-icons</code> library.
            </li>
          </ul>
        </div>

        <div style="background:rgba(0,120,212,0.08);border:1px solid rgba(0,120,212,0.3);padding:14px;border-radius:6px;">
          <div style="font-weight:700;color:var(--color-text-primary);margin-bottom:4px;display:flex;align-items:center;gap:6px;">
            <span>🔬</span> Automated Quality Assurance
          </div>
          <div style="font-size:12px;color:var(--color-text-secondary);">
            Run <code>node scratch/audit.js</code> to test all 21 JavaScript controllers, 77 router endpoints, 63 icons, and DOM element bindings.
          </div>
        </div>
      </div>

      <!-- TAB 3: Who It Helps -->
      <div id="tab-pane-audience" class="tab-pane" style="${defaultTab === 'audience' ? '' : 'display:none;'}">
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div class="content-card" style="margin:0;padding:16px;">
            <h4 style="margin:0 0 6px 0;font-size:14px;color:#5CAEE5;display:flex;align-items:center;gap:8px;">
              🎓 1. MD-102 Certification Candidates
            </h4>
            <p style="margin:0;color:var(--color-text-secondary);">
              Microsoft 365 developer/evaluation tenants expire after 30 days and require credit card verifications. This simulator provides a permanent, zero-cost practice lab to explore policies, remote actions, and device workflows at any time.
            </p>
          </div>

          <div class="content-card" style="margin:0;padding:16px;">
            <h4 style="margin:0 0 6px 0;font-size:14px;color:#54B054;display:flex;align-items:center;gap:8px;">
              💼 2. Systems & Endpoint Administrators
            </h4>
            <p style="margin:0;color:var(--color-text-secondary);">
              Test policy hierarchies, rehearse BitLocker recovery key rotations, inspect Autopilot profiles, and simulate MAM app protection logic without risking production corporate devices.
            </p>
          </div>

          <div class="content-card" style="margin:0;padding:16px;">
            <h4 style="margin:0 0 6px 0;font-size:14px;color:#FFB900;display:flex;align-items:center;gap:8px;">
              🎙️ 3. Technical Interview Preparation
            </h4>
            <p style="margin:0;color:var(--color-text-secondary);">
              Walk through actual Intune blades, explain device compliance remediation steps, demonstrate Windows Update Ring controls, and showcase your familiarity with Microsoft Endpoint Manager.
            </p>
          </div>
        </div>
      </div>

      <!-- TAB 4: Author & Source -->
      <div id="tab-pane-author" class="tab-pane" style="${defaultTab === 'author' ? '' : 'display:none;'}">
        <div class="content-card" style="margin:0;padding:18px;background:linear-gradient(135deg, rgba(0, 120, 212, 0.08) 0%, rgba(121, 115, 249, 0.12) 100%);border:1px solid rgba(0, 120, 212, 0.3);">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="width:48px;height:48px;border-radius:50%;background:#24292e;display:flex;align-items:center;justify-content:center;color:#ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.3);">
                ${GITHUB_SVG}
              </div>
              <div>
                <div style="font-size:15px;font-weight:700;color:var(--color-text-primary);">
                  Boopathi R. (<a href="${GITHUB_PROFILE_URL}" target="_blank" rel="noopener noreferrer" style="color:var(--color-link);text-decoration:none;">@boopathirbk</a>)
                </div>
                <div style="font-size:12px;color:var(--color-text-secondary);margin-top:2px;">
                  Open-Source Author & Cloud Endpoint Advocate
                </div>
              </div>
            </div>
            <a href="${GITHUB_REPO_URL}" target="_blank" rel="noopener noreferrer" class="btn-github-star" style="padding:8px 16px;font-size:13px;" id="about-star-btn">
              ${GITHUB_SVG}
              <span>⭐ Star on GitHub (@boopathirbk)</span>
            </a>
          </div>
        </div>

        <div class="content-card" style="margin:0;padding:16px;">
          <h4 style="margin:0 0 8px 0;font-size:13px;font-weight:600;color:var(--color-text-primary);">
            Architecture & Open Source Stack
          </h4>
          <ul style="margin:0;padding-left:18px;color:var(--color-text-secondary);display:flex;flex-direction:column;gap:6px;">
            <li><strong>Core:</strong> Vanilla JavaScript (ES6 Modules), HTML5, Custom CSS Variables</li>
            <li><strong>Design System:</strong> Microsoft Fluent 2 System & `@fluentui/svg-icons`</li>
            <li><strong>Storage & State:</strong> Local browser <code>localStorage</code> with client-side CSV exports</li>
            <li><strong>Privacy:</strong> 100% In-browser execution. Zero telemetry, trackers, or cloud calls.</li>
            <li><strong>License:</strong> MIT Open Source License</li>
          </ul>
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-top:1px solid var(--color-border);background:var(--color-bg-surface);">
      <span style="font-size:12px;color:var(--color-text-secondary);">
        Independent study companion • Built by Boopathi R.
      </span>
      <div style="display:flex;gap:8px;">
        <a href="${GITHUB_REPO_URL}" target="_blank" rel="noopener noreferrer" class="btn btn-default btn-sm" style="display:inline-flex;align-items:center;gap:6px;">
          ${GITHUB_SVG} GitHub Repo
        </a>
        <button class="btn btn-primary btn-sm" id="about-modal-close-btn">
          Done Exploring
        </button>
      </div>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const closeModal = () => overlay.remove();

  modal.querySelector('#about-modal-close')?.addEventListener('click', closeModal);
  modal.querySelector('#about-modal-close-btn')?.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Tab switching
  modal.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      modal.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      const targetPane = modal.querySelector(`#tab-pane-${tabId}`);
      if (targetPane) targetPane.style.display = 'block';
    });
  });
}

/**
 * Initializes listeners for About button
 */
export function initAboutLab() {
  document.getElementById('about-lab-btn')?.addEventListener('click', () => {
    showAboutLabModal('contents');
  });
}
