/* ============================================================
   Copilot Component — Microsoft Security Copilot in Intune
   Provides interactive AI assistance, live telemetry analysis,
   MD-102 exam domain answers, and troubleshooting advice.
   ============================================================ */

import { $, escapeHtml } from '../utils.js';
import { Store, Collections } from '../store.js';
import { router } from '../router.js';

export class CopilotAssistant {
  constructor() {
    this.panel = $('#copilot-panel');
    this.overlay = $('#copilot-overlay');
    this.toggleBtn = $('#copilot-toggle');
    this.closeBtn = $('#copilot-close');
    this.clearBtn = $('#copilot-clear');
    this.input = $('#copilot-input');
    this.sendBtn = $('#copilot-send');
    this.chatBody = $('#copilot-chat');
    this.isOpen = false;

    this.init();
  }

  init() {
    if (!this.panel) return;

    // Toggle & Close listeners
    this.toggleBtn?.addEventListener('click', () => this.open());
    this.closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });
    this.overlay?.addEventListener('click', () => this.close());
    this.clearBtn?.addEventListener('click', () => this.clearChat());

    // Send handlers
    this.sendBtn?.addEventListener('click', () => this.handleSend());
    this.input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    // Global keyboard listener (Escape to close)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Suggestion chips
    this.bindSuggestionChips();
  }

  open() {
    this.isOpen = true;
    this.panel.classList.add('open');
    this.overlay.classList.add('visible');
    this.overlay.style.display = 'block';
    setTimeout(() => this.input?.focus(), 150);
  }

  close() {
    this.isOpen = false;
    this.panel.classList.remove('open');
    this.overlay.classList.remove('visible');
    setTimeout(() => {
      if (!this.isOpen) this.overlay.style.display = 'none';
    }, 250);
  }

  clearChat() {
    this.chatBody.innerHTML = `
      <div style="background:var(--color-bg-surface);padding:14px;border-radius:8px;border:1px solid var(--color-border);font-size:13px;line-height:1.5;box-shadow:var(--shadow-2);">
        <strong style="color:var(--color-primary);display:block;margin-bottom:6px;">✨ Microsoft Security Copilot</strong>
        Conversation cleared. How can I help you manage your Intune environment today?
      </div>
      <div id="copilot-suggestions" style="display:flex;flex-direction:column;gap:8px;">
        <button class="btn btn-default btn-sm copilot-chip" data-prompt="Summarize tenant compliance and non-compliant devices" style="text-align:left;justify-content:flex-start;font-size:12px;padding:8px 12px;border-radius:6px;background:var(--color-bg-surface);">
          📊 Summarize tenant compliance & non-compliant devices
        </button>
        <button class="btn btn-default btn-sm copilot-chip" data-prompt="Explain difference between Wipe, Retire, Fresh Start, and Autopilot Reset" style="text-align:left;justify-content:flex-start;font-size:12px;padding:8px 12px;border-radius:6px;background:var(--color-bg-surface);">
          🔄 Explain Wipe vs Retire vs Fresh Start vs Autopilot Reset
        </button>
        <button class="btn btn-default btn-sm copilot-chip" data-prompt="How to troubleshoot Windows enrollment error 0x80180014" style="text-align:left;justify-content:flex-start;font-size:12px;padding:8px 12px;border-radius:6px;background:var(--color-bg-surface);">
          ⚠️ Troubleshoot enrollment error 0x80180014 (Device type blocked)
        </button>
        <button class="btn btn-default btn-sm copilot-chip" data-prompt="Show BitLocker and Windows LAPS best practices" style="text-align:left;justify-content:flex-start;font-size:12px;padding:8px 12px;border-radius:6px;background:var(--color-bg-surface);">
          🛡️ BitLocker & Windows LAPS security guidelines
        </button>
      </div>
    `;
    this.bindSuggestionChips();
  }

  bindSuggestionChips() {
    this.chatBody.querySelectorAll('.copilot-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.dataset.prompt;
        if (prompt) {
          this.input.value = prompt;
          this.handleSend();
        }
      });
    });
  }

  handleSend() {
    const text = this.input.value.trim();
    if (!text) return;

    // Append user message
    this.appendUserMessage(text);
    this.input.value = '';

    // Typing indicator
    const typingId = this.showTypingIndicator();

    // Process query with live data & domain engine
    setTimeout(() => {
      this.removeTypingIndicator(typingId);
      const responseHtml = this.generateResponse(text);
      this.appendAssistantMessage(responseHtml);
    }, 450);
  }

  appendUserMessage(text) {
    const msg = document.createElement('div');
    msg.style.cssText = 'background:var(--color-primary);color:#fff;padding:10px 14px;border-radius:12px 12px 2px 12px;font-size:13px;line-height:1.4;align-self:flex-end;max-width:88%;word-break:break-word;box-shadow:var(--shadow-2);';
    msg.textContent = text;
    this.chatBody.appendChild(msg);
    this.scrollToBottom();
  }

  appendAssistantMessage(html) {
    const msg = document.createElement('div');
    msg.style.cssText = 'background:var(--color-bg-surface);color:var(--color-text-primary);padding:14px;border-radius:12px 12px 12px 2px;font-size:13px;line-height:1.5;border:1px solid var(--color-border);align-self:flex-start;max-width:92%;box-shadow:var(--shadow-2);';
    msg.innerHTML = html;
    this.chatBody.appendChild(msg);
    this.scrollToBottom();

    // Wire any internal action links/buttons
    msg.querySelectorAll('[data-route]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const r = link.dataset.route;
        if (r) {
          router.navigate(r);
          this.close();
        }
      });
    });
  }

  showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const ind = document.createElement('div');
    ind.id = id;
    ind.style.cssText = 'background:var(--color-bg-surface);padding:10px 14px;border-radius:12px;font-size:12px;color:var(--color-text-secondary);border:1px solid var(--color-border);align-self:flex-start;display:flex;align-items:center;gap:6px;';
    ind.innerHTML = `
      <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--color-primary);animation:pulse 1s infinite alternate;"></span>
      Copilot is analyzing tenant telemetry...
    `;
    this.chatBody.appendChild(ind);
    this.scrollToBottom();
    return id;
  }

  removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  scrollToBottom() {
    this.chatBody.scrollTop = this.chatBody.scrollHeight;
  }

  generateResponse(query) {
    const q = query.toLowerCase();
    const devices = Store.getAll(Collections.DEVICES);
    const nonCompliant = devices.filter(d => d.complianceState === 'Noncompliant');
    const compliant = devices.filter(d => d.complianceState === 'Compliant');
    const grace = devices.filter(d => d.complianceState === 'In grace period');

    // 1. Compliance / Noncompliant summary
    if (q.includes('compliance') || q.includes('non-compliant') || q.includes('noncompliant') || q.includes('summary')) {
      let listHtml = '';
      if (nonCompliant.length > 0) {
        listHtml = `
          <div style="margin-top:8px;padding:8px 12px;background:var(--color-bg-canvas);border-radius:6px;border-left:3px solid var(--color-error);">
            <strong style="color:var(--color-error);">Action Required (${nonCompliant.length} devices non-compliant):</strong>
            <ul style="margin:6px 0 0 16px;padding:0;">
              ${nonCompliant.map(d => `<li><strong>${escapeHtml(d.name)}</strong> (${d.primaryUser || 'Unassigned'}) — <em>${d.noncompliantReasons ? d.noncompliantReasons.join(', ') : 'Failed compliance checks'}</em></li>`).join('')}
            </ul>
          </div>
        `;
      }
      return `
        <div>
          <strong>Tenant Compliance Telemetry</strong>
          <div style="margin-top:6px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center;">
            <div style="padding:6px;background:var(--color-bg-canvas);border-radius:6px;">
              <div style="font-size:16px;font-weight:700;color:var(--color-success);">${compliant.length}</div>
              <div style="font-size:11px;color:var(--color-text-secondary);">Compliant</div>
            </div>
            <div style="padding:6px;background:var(--color-bg-canvas);border-radius:6px;">
              <div style="font-size:16px;font-weight:700;color:var(--color-error);">${nonCompliant.length}</div>
              <div style="font-size:11px;color:var(--color-text-secondary);">Non-compliant</div>
            </div>
            <div style="padding:6px;background:var(--color-bg-canvas);border-radius:6px;">
              <div style="font-size:16px;font-weight:700;color:var(--color-warning);">${grace.length}</div>
              <div style="font-size:11px;color:var(--color-text-secondary);">Grace Period</div>
            </div>
          </div>
          ${listHtml}
          <div style="margin-top:10px;">
            <a href="#/devices/all" data-route="/devices/all" class="btn btn-sm btn-primary" style="font-size:12px;display:inline-block;text-decoration:none;">View in All Devices →</a>
          </div>
        </div>
      `;
    }

    // 2. Wipe vs Retire vs Fresh Start vs Autopilot Reset
    if (q.includes('wipe') || q.includes('retire') || q.includes('fresh start') || q.includes('autopilot reset') || q.includes('remote action')) {
      return `
        <div>
          <strong>Remote Actions Comparison (MD-102 Core Concept)</strong>
          <table style="width:100%;font-size:12px;border-collapse:collapse;margin-top:8px;">
            <thead>
              <tr style="border-bottom:1px solid var(--color-border);text-align:left;">
                <th style="padding:4px;">Action</th>
                <th style="padding:4px;">Corporate Data</th>
                <th style="padding:4px;">Personal Data</th>
                <th style="padding:4px;">Enrollment</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom:1px solid var(--color-border-subtle);">
                <td style="padding:6px 4px;font-weight:600;color:var(--color-error);">Wipe</td>
                <td style="padding:6px 4px;">Removed</td>
                <td style="padding:6px 4px;">Removed (Factory reset)</td>
                <td style="padding:6px 4px;">Removed from Intune</td>
              </tr>
              <tr style="border-bottom:1px solid var(--color-border-subtle);">
                <td style="padding:6px 4px;font-weight:600;color:var(--color-warning);">Retire</td>
                <td style="padding:6px 4px;">Removed</td>
                <td style="padding:6px 4px;color:var(--color-success);">Preserved (BYOD)</td>
                <td style="padding:6px 4px;">Unenrolled</td>
              </tr>
              <tr style="border-bottom:1px solid var(--color-border-subtle);">
                <td style="padding:6px 4px;font-weight:600;color:var(--color-primary);">Fresh Start</td>
                <td style="padding:6px 4px;">Removed</td>
                <td style="padding:6px 4px;">Removed (or retained if chosen)</td>
                <td style="padding:6px 4px;">Keeps Windows clean install</td>
              </tr>
              <tr>
                <td style="padding:6px 4px;font-weight:600;color:var(--color-info);">Autopilot Reset</td>
                <td style="padding:6px 4px;">Reconfigured</td>
                <td style="padding:6px 4px;">Removed</td>
                <td style="padding:6px 4px;">Remains joined & enrolled!</td>
              </tr>
            </tbody>
          </table>
          <p style="margin-top:8px;font-size:12px;color:var(--color-text-secondary);">
            💡 <em>Exam Tip:</em> Use <strong>Retire</strong> when an employee leaves with their personal phone or laptop. Use <strong>Autopilot Reset</strong> to quickly repurpose a classroom or student Windows PC without reprovisioning from scratch.
          </p>
        </div>
      `;
    }

    // 3. Error 0x80180014 or enrollment errors
    if (q.includes('0x80180014') || q.includes('error') || q.includes('enrollment error')) {
      return `
        <div>
          <strong style="color:var(--color-error);">Error 0x80180014: MENROLL_E_DEVICENOTSUPPORTED</strong>
          <p style="margin:6px 0;">This error indicates that the device platform or ownership is blocked by your <strong>Enrollment Device Platform Restrictions</strong>.</p>
          <div style="background:var(--color-bg-canvas);padding:8px 12px;border-radius:6px;font-size:12px;margin:8px 0;">
            <strong>Recommended Remediation:</strong>
            <ol style="margin:4px 0 0 16px;padding:0;">
              <li>Navigate to <strong>Devices → Enrollment restrictions</strong>.</li>
              <li>Check the <em>Device type restrictions</em> policy assigned to the user.</li>
              <li>Verify if <strong>Personally Owned (BYOD)</strong> or <strong>Windows (MDM)</strong> is set to <em>Block</em>.</li>
              <li>If the device is corporate, verify its hardware hash or serial number is registered under <strong>Corporate device identifiers</strong>.</li>
            </ol>
          </div>
          <a href="#/devices/enrollment/restrictions" data-route="/devices/enrollment/restrictions" class="btn btn-sm btn-primary" style="font-size:12px;text-decoration:none;">Open Enrollment Restrictions →</a>
        </div>
      `;
    }

    // 4. BitLocker & LAPS
    if (q.includes('bitlocker') || q.includes('laps') || q.includes('encryption') || q.includes('key')) {
      const encrypted = devices.filter(d => d.isEncrypted).length;
      return `
        <div>
          <strong>BitLocker & Windows LAPS Security Overview</strong>
          <p style="margin:6px 0;">Current encryption posture: <strong>${encrypted} of ${devices.length}</strong> devices have BitLocker active.</p>
          <ul style="margin:6px 0 6px 16px;padding:0;font-size:12px;">
            <li><strong>BitLocker Key Backup:</strong> Automatically backed up to Microsoft Entra ID via Intune Endpoint Security Disk Encryption policy.</li>
            <li><strong>Windows LAPS:</strong> Manages local administrator account password rotation automatically with customizable complexity, expiration, and post-authentication actions.</li>
            <li><strong>Remote Key Rotation:</strong> Administrators can remotely rotate BitLocker keys or LAPS passwords directly from any device's detail blade.</li>
          </ul>
          <div style="margin-top:8px;display:flex;gap:8px;">
            <a href="#/endpoint-security/disk-encryption" data-route="/endpoint-security/disk-encryption" class="btn btn-sm btn-default" style="font-size:12px;text-decoration:none;">Disk Encryption Policies</a>
            <a href="#/devices/identity/laps" data-route="/devices/identity/laps" class="btn btn-sm btn-default" style="font-size:12px;text-decoration:none;">Windows LAPS</a>
          </div>
        </div>
      `;
    }

    // 5. Autopilot & ESP
    if (q.includes('autopilot') || q.includes('esp') || q.includes('enrollment status page')) {
      return `
        <div>
          <strong>Windows Autopilot & Enrollment Status Page (ESP)</strong>
          <p style="margin:6px 0;">Windows Autopilot simplifies device setup from out-of-box experience (OOBE) directly to managed state:</p>
          <ul style="margin:6px 0 6px 16px;padding:0;font-size:12px;">
            <li><strong>Deployment Profiles:</strong> User-driven (Entra Joined / Hybrid) vs Self-Deploying (Kiosks/shared devices).</li>
            <li><strong>ESP Phases:</strong> Device preparation → Device setup → Account setup.</li>
            <li><strong>Blocking Apps:</strong> Only mark critical security agents (e.g. Defender, Company Portal) as blocking to avoid timeouts.</li>
          </ul>
          <div style="margin-top:8px;">
            <a href="#/devices/enrollment/autopilot" data-route="/devices/enrollment/autopilot" class="btn btn-sm btn-primary" style="font-size:12px;text-decoration:none;">Manage Autopilot Profiles →</a>
          </div>
        </div>
      `;
    }

    // 6. Apps / Win32 / MAM
    if (q.includes('app') || q.includes('win32') || q.includes('mam') || q.includes('app protection')) {
      const apps = Store.getAll(Collections.APPS);
      return `
        <div>
          <strong>Applications Management (${apps.length} Total Apps)</strong>
          <p style="margin:6px 0;">Intune supports Win32 (.intunewin), Store apps, Microsoft 365 Apps, and mobile platform stores.</p>
          <ul style="margin:6px 0 6px 16px;padding:0;font-size:12px;">
            <li><strong>Win32 App Deployment:</strong> Packaged via Microsoft Win32 Content Prep Tool (IntuneWinAppUtil.exe) with install command, uninstall command, and detection rules.</li>
            <li><strong>App Protection (MAM):</strong> Restricts copy/paste, enforces PIN/biometrics, and enables selective wipe on unmanaged BYOD devices.</li>
          </ul>
          <div style="margin-top:8px;">
            <a href="#/apps/all" data-route="/apps/all" class="btn btn-sm btn-primary" style="font-size:12px;text-decoration:none;">View All Apps →</a>
          </div>
        </div>
      `;
    }

    // 7. General AI Intune answer
    return `
      <div>
        <strong>Intune Advisory Analysis</strong>
        <p style="margin:6px 0;">I've analyzed your query regarding <em>"${escapeHtml(query)}"</em> across your tenant's configuration:</p>
        <div style="background:var(--color-bg-canvas);padding:10px 12px;border-radius:6px;font-size:12px;line-height:1.5;margin:8px 0;">
          • <strong>Tenant Status:</strong> ${devices.length} managed devices (${compliant.length} compliant, ${nonCompliant.length} non-compliant).<br>
          • <strong>Policy State:</strong> Compliance policies and endpoint security baselines are actively monitoring telemetry.<br>
          • <strong>Recommendation:</strong> Use the navigation rail on the left or search devices and configuration profiles to inspect specific policy assignments.
        </div>
        <div style="font-size:12px;color:var(--color-text-secondary);">
          💡 You can ask me to: <em>"list non-compliant devices"</em>, <em>"compare Wipe vs Retire"</em>, <em>"explain BitLocker keys"</em>, or <em>"troubleshoot error 0x80180014"</em>.
        </div>
      </div>
    `;
  }
}
