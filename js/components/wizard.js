/* ============================================================
   Wizard Component — Reusable multi-step wizard
   Intune pattern: Basics → Settings → Scope tags → 
   Assignments → Review + create
   ============================================================ */

import { Icons, createElement, clearElement, $ } from '../utils.js';

export class Wizard {
  /**
   * @param {HTMLElement} container
   * @param {Object} config
   * @param {Array<{name:string, render:Function, validate?:Function}>} config.steps
   * @param {Function} config.onComplete - called with collected data
   * @param {Function} [config.onCancel]
   * @param {string} [config.completeLabel] - label for final button
   */
  constructor(container, config) {
    this.container = container;
    this.steps = config.steps;
    this.onComplete = config.onComplete;
    this.onCancel = config.onCancel || (() => {});
    this.completeLabel = config.completeLabel || 'Create';
    this.currentStep = 0;
    this.data = config.initialData || {};
  }

  render() {
    clearElement(this.container);

    const wizard = createElement('div', { className: 'wizard' });

    // Step indicator
    const stepsBar = createElement('div', { className: 'wizard__steps' });
    this.steps.forEach((step, i) => {
      if (i > 0) {
        stepsBar.appendChild(createElement('span', { className: 'wizard-step__connector' }));
      }
      const classes = ['wizard-step'];
      if (i === this.currentStep) classes.push('active');
      if (i < this.currentStep) classes.push('completed');

      const stepEl = createElement('div', { className: classes.join(' ') });
      const numEl = createElement('span', { className: 'wizard-step__number' });
      if (i < this.currentStep) {
        numEl.innerHTML = Icons.check;
      } else {
        numEl.textContent = i + 1;
      }
      stepEl.appendChild(numEl);
      stepEl.appendChild(createElement('span', { className: 'wizard-step__label', textContent: step.name }));
      stepsBar.appendChild(stepEl);
    });
    wizard.appendChild(stepsBar);

    // Body
    const body = createElement('div', { className: 'wizard__body', id: 'wizard-body' });
    wizard.appendChild(body);

    // Footer
    const footer = createElement('div', { className: 'wizard__footer' });
    const footerLeft = createElement('div', { className: 'wizard__footer-left' });
    const footerRight = createElement('div', { className: 'wizard__footer-right' });

    const cancelBtn = createElement('button', {
      className: 'btn btn-default', textContent: 'Cancel',
      onClick: () => this.onCancel(),
    });
    footerLeft.appendChild(cancelBtn);

    if (this.currentStep > 0) {
      const backBtn = createElement('button', {
        className: 'btn btn-default', textContent: '← Previous',
        onClick: () => this.goToStep(this.currentStep - 1),
      });
      footerRight.appendChild(backBtn);
    }

    if (this.currentStep < this.steps.length - 1) {
      const nextBtn = createElement('button', {
        className: 'btn btn-primary', textContent: 'Next →', id: 'wizard-next',
        onClick: () => this._next(),
      });
      footerRight.appendChild(nextBtn);
    } else {
      const createBtn = createElement('button', {
        className: 'btn btn-primary', textContent: this.completeLabel, id: 'wizard-complete',
        onClick: () => this._complete(),
      });
      footerRight.appendChild(createBtn);
    }

    footer.appendChild(footerLeft);
    footer.appendChild(footerRight);
    wizard.appendChild(footer);

    this.container.appendChild(wizard);

    // Render current step content
    this._renderStep();
  }

  _renderStep() {
    const body = $('#wizard-body') || this.container.querySelector('.wizard__body');
    if (!body) return;
    clearElement(body);
    const step = this.steps[this.currentStep];
    if (step.render) {
      const content = step.render(this.data, body);
      if (typeof content === 'string') {
        body.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        body.appendChild(content);
      }
    }
  }

  _next() {
    const step = this.steps[this.currentStep];
    // Collect data from current step
    if (step.collect) step.collect(this.data);
    // Validate
    if (step.validate && !step.validate(this.data)) return;
    this.goToStep(this.currentStep + 1);
  }

  _complete() {
    const step = this.steps[this.currentStep];
    if (step.collect) step.collect(this.data);
    if (step.validate && !step.validate(this.data)) return;
    this.onComplete(this.data);
  }

  goToStep(index) {
    if (index < 0 || index >= this.steps.length) return;
    // Collect data from current step before leaving
    const currentStep = this.steps[this.currentStep];
    if (currentStep.collect) currentStep.collect(this.data);
    this.currentStep = index;
    this.render();
  }

  /** Build a review summary from the wizard data */
  static renderReview(data, fieldMap) {
    let html = '<div class="content-card"><h3 style="margin-bottom:16px;font-size:16px;font-weight:600;">Review + create</h3>';
    html += '<p style="color:var(--color-text-secondary);margin-bottom:16px;">Review your selections. Click Create to save.</p>';
    html += '<dl class="kv-grid">';
    for (const [key, label] of Object.entries(fieldMap)) {
      const val = data[key];
      let display = '—';
      if (Array.isArray(val)) display = val.length > 0 ? val.join(', ') : '—';
      else if (typeof val === 'boolean') display = val ? 'Yes' : 'No';
      else if (typeof val === 'object' && val !== null) display = JSON.stringify(val);
      else if (val !== undefined && val !== null && val !== '') display = String(val);
      html += `<dt>${label}</dt><dd>${display}</dd>`;
    }
    html += '</dl></div>';
    return html;
  }
}

/* ── Scope Tags Step (reusable) ── */
export function renderScopeTagsStep(data, body) {
  const { Store, Collections } = window.IntuneApp || {};
  const scopeTags = Store ? Store.getAll(Collections.SCOPE_TAGS) : [];

  let html = '<h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Scope tags</h3>';
  html += '<p style="color:var(--color-text-secondary);margin-bottom:16px;">Select scope tags to control which admins can see this policy.</p>';

  html += '<div style="display:flex;flex-direction:column;gap:8px;">';
  for (const tag of scopeTags) {
    const checked = (data.scopeTags || ['Default']).includes(tag.name);
    html += `
      <label class="checkbox ${checked ? 'checked' : ''}" data-tag="${tag.name}" style="padding:8px;border:1px solid var(--color-border);border-radius:4px;">
        <span class="checkbox__box"><svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path d="M9.78 3.22a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0L2.22 6.28a.75.75 0 011.06-1.06L5 6.94l3.72-3.72a.75.75 0 011.06 0z"/></svg></span>
        <span class="checkbox__label"><strong>${tag.name}</strong>${tag.description ? ` — ${tag.description}` : ''}</span>
      </label>
    `;
  }
  html += '</div>';
  body.innerHTML = html;

  // Toggle checkboxes
  body.querySelectorAll('.checkbox').forEach(cb => {
    cb.addEventListener('click', () => {
      cb.classList.toggle('checked');
    });
  });
}

export function collectScopeTags(data) {
  const body = document.getElementById('wizard-body');
  if (!body) return;
  data.scopeTags = Array.from(body.querySelectorAll('.checkbox.checked')).map(cb => cb.dataset.tag);
}

/* ── Assignments Step (reusable) ── */
export function renderAssignmentsStep(data, body) {
  const { Store, Collections } = window.IntuneApp || {};
  const groups = Store ? Store.getAll(Collections.DYNAMIC_GROUPS) : [];

  let html = '<h3 style="font-size:16px;font-weight:600;margin-bottom:16px;">Assignments</h3>';
  html += '<p style="color:var(--color-text-secondary);margin-bottom:16px;">Select groups to assign this policy to.</p>';

  html += `
    <div class="form-group">
      <label class="form-label">Included groups</label>
      <div style="display:flex;flex-direction:column;gap:8px;" id="assignment-groups">
  `;

  const presetGroups = ['All devices', 'All users', ...groups.map(g => g.name)];
  for (const group of presetGroups) {
    const checked = (data.assignedGroups || []).includes(group);
    html += `
      <label class="checkbox ${checked ? 'checked' : ''}" data-group="${group}" style="padding:8px;border:1px solid var(--color-border);border-radius:4px;">
        <span class="checkbox__box"><svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path d="M9.78 3.22a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0L2.22 6.28a.75.75 0 011.06-1.06L5 6.94l3.72-3.72a.75.75 0 011.06 0z"/></svg></span>
        <span class="checkbox__label">${group}</span>
      </label>
    `;
  }
  html += '</div></div>';

  // Assignment filter builder teaser
  html += `
    <div class="content-card" style="margin-top:16px;background:var(--color-neutral-99);">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="color:var(--color-primary)">${Icons.filter}</span>
        <strong>Assignment filters</strong>
      </div>
      <p style="font-size:13px;color:var(--color-text-secondary);">Use filters to refine which devices receive this policy based on device properties.</p>
      <div style="margin-top:12px;">
        <div class="form-group" style="margin-bottom:8px;">
          <label class="form-label" style="font-size:12px;">Filter rule (optional)</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <select class="form-input form-select" style="width:140px;" id="filter-property">
              <option value="">Property...</option>
              <option value="device.deviceOSType">device.deviceOSType</option>
              <option value="device.manufacturer">device.manufacturer</option>
              <option value="device.model">device.model</option>
              <option value="device.deviceOwnership">device.deviceOwnership</option>
              <option value="device.enrollmentProfileName">device.enrollmentProfileName</option>
            </select>
            <select class="form-input form-select" style="width:100px;" id="filter-operator">
              <option value="-eq">-eq</option>
              <option value="-ne">-ne</option>
              <option value="-contains">-contains</option>
              <option value="-startsWith">-startsWith</option>
            </select>
            <input type="text" class="form-input" style="width:160px;" placeholder="Value..." id="filter-value">
          </div>
        </div>
      </div>
    </div>
  `;

  body.innerHTML = html;

  // Toggle checkboxes
  body.querySelectorAll('.checkbox').forEach(cb => {
    cb.addEventListener('click', () => cb.classList.toggle('checked'));
  });
}

export function collectAssignments(data) {
  const body = document.getElementById('wizard-body');
  if (!body) return;
  data.assignedGroups = Array.from(body.querySelectorAll('#assignment-groups .checkbox.checked')).map(cb => cb.dataset.group);

  // Collect filter
  const prop = body.querySelector('#filter-property')?.value;
  const op = body.querySelector('#filter-operator')?.value;
  const val = body.querySelector('#filter-value')?.value;
  if (prop && val) {
    data.assignmentFilter = `(${prop} ${op} "${val}")`;
  }
}
