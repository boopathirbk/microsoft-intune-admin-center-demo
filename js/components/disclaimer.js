/* ============================================================
   Disclaimer Component — Study Purpose Notice & First-Time Modal
   Author: Boopathi R. (https://github.com/boopathirbk)
   ============================================================ */

import { createElement, $, Icons } from '../utils.js';

export const DISCLAIMER_STORAGE_KEY = 'intune_study_notice_dismissed';
export const GITHUB_PROFILE_URL = 'https://github.com/boopathirbk';

const GITHUB_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`;

/**
 * Opens the comprehensive Study Disclaimer & Terms modal centered on screen
 */
export function showStudyDisclaimerModal() {
  document.getElementById('study-disclaimer-overlay')?.remove();

  const overlay = createElement('div', {
    id: 'study-disclaimer-overlay',
    className: 'blade-overlay visible',
    style: 'z-index:3000;display:flex;align-items:center;justify-content:center;',
  });

  const modal = createElement('div', {
    className: 'study-modal-container',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'study-modal-title',
  });

  modal.innerHTML = `
    <!-- Modal Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--color-border);background:var(--color-bg-surface);">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="color:#FFB900;display:flex;background:rgba(255,185,0,0.15);padding:6px;border-radius:6px;">
          ${Icons.warning}
        </span>
        <div>
          <h2 id="study-modal-title" style="font-size:16px;font-weight:700;margin:0;color:var(--color-text-primary);">
            Educational Study Lab — Disclaimer & Terms
          </h2>
          <span style="font-size:12px;color:var(--color-text-secondary);">
            Independent Microsoft Intune & MD-102 Exam Preparation Sandbox
          </span>
        </div>
      </div>
      <button class="blade-panel__close" id="study-modal-close" aria-label="Close dialog" style="width:32px;height:32px;">
        ${Icons.close}
      </button>
    </div>

    <!-- Modal Body -->
    <div style="padding:20px;overflow-y:auto;max-height:calc(85vh - 130px);display:flex;flex-direction:column;gap:16px;background:var(--color-bg-canvas);font-size:13px;line-height:1.6;">
      
      <!-- Highlight Notice Box -->
      <div style="background:rgba(255,185,0,0.1);border:1px solid rgba(255,185,0,0.35);border-left:4px solid #FFB900;padding:14px;border-radius:6px;color:var(--color-text-primary);">
        <strong style="display:block;margin-bottom:4px;color:#FFD335;font-size:14px;">⚠️ Purely for Educational & Study Purposes</strong>
        This application was engineered solely as an interactive study companion for endpoint administrators, IT professionals, and students studying cloud device management and preparing for the <strong>Microsoft MD-102: Endpoint Administrator</strong> examination.
      </div>

      <!-- Legal & Trademark Disclaimer Card -->
      <div class="content-card" style="margin:0;padding:16px;">
        <h3 style="font-size:14px;font-weight:600;margin:0 0 10px 0;color:var(--color-text-primary);display:flex;align-items:center;gap:6px;">
          <span>⚖️</span> Non-Affiliation & Trademark Notice
        </h3>
        <ul style="margin:0;padding-left:18px;color:var(--color-text-secondary);display:flex;flex-direction:column;gap:8px;">
          <li>
            <strong>Non-Affiliation:</strong> This software is an independent, non-commercial project and is <strong>NOT affiliated with, sponsored by, endorsed by, certified by, or associated with Microsoft Corporation</strong> or any of its subsidiaries.
          </li>
          <li>
            <strong>Trademarks:</strong> <em>Microsoft</em>, <em>Microsoft Intune</em>, <em>Windows</em>, <em>Windows 11</em>, <em>Microsoft 365</em>, <em>Microsoft Entra ID</em>, <em>Azure</em>, <em>BitLocker</em>, <em>Windows Hello</em>, and related product names, logos, or icons are registered trademarks or trademarks of Microsoft Corporation in the United States and/or other countries.
          </li>
          <li>
            <strong>Fair Use:</strong> All trademarks and brand designations are used strictly for reference, identification, and educational analysis under nominative fair use doctrine.
          </li>
        </ul>
      </div>

      <!-- Architecture & Privacy Card -->
      <div class="content-card" style="margin:0;padding:16px;">
        <h3 style="font-size:14px;font-weight:600;margin:0 0 10px 0;color:var(--color-text-primary);display:flex;align-items:center;gap:6px;">
          <span>🔒</span> Client-Side Sandbox & Privacy
        </h3>
        <ul style="margin:0;padding-left:18px;color:var(--color-text-secondary);display:flex;flex-direction:column;gap:8px;">
          <li>
            <strong>100% In-Browser Execution:</strong> The entire simulator runs locally inside your browser using HTML5, JavaScript, and <code>localStorage</code>.
          </li>
          <li>
            <strong>Zero Cloud Access:</strong> No Microsoft cloud tenants, Azure subscriptions, or real device hardware are accessed, controlled, or modified.
          </li>
          <li>
            <strong>No Data Harvesting:</strong> No telemetry, analytics trackers, or personal identification data are transmitted or collected.
          </li>
        </ul>
      </div>

      <!-- Author & GitHub Star Card -->
      <div class="content-card" style="margin:0;padding:18px;background:linear-gradient(135deg, rgba(0, 120, 212, 0.08) 0%, rgba(121, 115, 249, 0.12) 100%);border:1px solid rgba(0, 120, 212, 0.3);">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:44px;height:44px;border-radius:50%;background:#24292e;display:flex;align-items:center;justify-content:center;color:#ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.3);">
              ${GITHUB_SVG}
            </div>
            <div>
              <div style="font-size:14px;font-weight:700;color:var(--color-text-primary);">
                Project Author: Boopathi R. (<a href="${GITHUB_PROFILE_URL}" target="_blank" rel="noopener noreferrer" style="color:var(--color-link);text-decoration:none;">@boopathirbk</a>)
              </div>
              <div style="font-size:12px;color:var(--color-text-secondary);margin-top:2px;">
                Support this open-source Intune study laboratory
              </div>
            </div>
          </div>
          <a href="${GITHUB_PROFILE_URL}" target="_blank" rel="noopener noreferrer" class="btn-github-star" style="padding:8px 16px;font-size:13px;" id="modal-star-btn">
            ${GITHUB_SVG}
            <span>⭐ Star on GitHub (@boopathirbk)</span>
          </a>
        </div>
      </div>

    </div>

    <!-- Modal Footer -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-top:1px solid var(--color-border);background:var(--color-bg-surface);">
      <button class="btn btn-default btn-sm" id="study-reset-banner-btn" title="Show the first-time notice dialog on next reload">
        Reset Notice Preference
      </button>
      <div style="display:flex;gap:8px;">
        <a href="${GITHUB_PROFILE_URL}" target="_blank" rel="noopener noreferrer" class="btn btn-default btn-sm" style="display:inline-flex;align-items:center;gap:6px;">
          ${GITHUB_SVG} GitHub Profile
        </a>
        <button class="btn btn-primary btn-sm" id="study-modal-accept">
          I Understand & Accept
        </button>
      </div>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const closeModal = () => overlay.remove();

  modal.querySelector('#study-modal-close')?.addEventListener('click', closeModal);
  modal.querySelector('#study-modal-accept')?.addEventListener('click', () => {
    localStorage.setItem(DISCLAIMER_STORAGE_KEY, 'true');
    closeModal();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Reset disclaimer preference
  modal.querySelector('#study-reset-banner-btn')?.addEventListener('click', () => {
    localStorage.removeItem(DISCLAIMER_STORAGE_KEY);
    window.IntuneApp?.toastManager?.info('Notice Reset', 'First-time study notice dialog will be displayed on reload.');
  });
}

/**
 * Initializes the study disclaimer listeners and triggers first-time modal at start
 */
export function initStudyDisclaimer() {
  const btn = document.getElementById('study-disclaimer-btn');
  btn?.addEventListener('click', () => {
    showStudyDisclaimerModal();
  });

  // Show centered modal at start on first visit
  if (localStorage.getItem(DISCLAIMER_STORAGE_KEY) !== 'true') {
    setTimeout(() => {
      showStudyDisclaimerModal();
    }, 450);
  }
}
