/* ============================================================
   Command Bar — Top action bar with breadcrumbs
   ============================================================ */

import { Icons, createElement, clearElement } from '../utils.js';
import { router } from '../router.js';

export class CommandBar {
  constructor(commandBarEl, breadcrumbEl) {
    this.commandBarEl = commandBarEl;
    this.breadcrumbEl = breadcrumbEl;
    this.actions = [];
    this.searchPlaceholder = 'Search...';
    this.onSearch = null;
  }

  /* ── Set page-specific actions ── */
  setActions(actions) {
    // actions = [{ label, icon, onClick, type, disabled, id }]
    this.actions = actions;
    this._renderActions();
  }

  clearActions() {
    this.actions = [];
    this._renderActions();
  }

  _renderActions() {
    clearElement(this.commandBarEl);

    const actionsDiv = createElement('div', { className: 'command-bar__actions' });

    for (const action of this.actions) {
      const btn = createElement('button', {
        className: `btn ${action.type === 'primary' ? 'btn-primary' : 'btn-default'} ${action.className || ''}`,
        id: action.id || '',
        'aria-label': action.label,
      });

      if (action.disabled) btn.disabled = true;

      if (action.icon) {
        btn.appendChild(createElement('span', { innerHTML: action.icon, style: { display: 'flex' } }));
      }
      btn.appendChild(document.createTextNode(action.label));

      if (action.onClick) {
        btn.addEventListener('click', action.onClick);
      }

      actionsDiv.appendChild(btn);
    }

    this.commandBarEl.appendChild(actionsDiv);

    // Spacer
    this.commandBarEl.appendChild(createElement('div', { className: 'command-bar__spacer' }));

    // Search (optional)
    const searchWrapper = createElement('div', { className: 'command-bar__search' });
    searchWrapper.appendChild(createElement('span', { innerHTML: Icons.search, style: { display: 'flex' } }));
    const searchInput = createElement('input', {
      type: 'text',
      placeholder: this.searchPlaceholder,
      'aria-label': 'Search',
      id: 'command-bar-search',
    });
    if (this.onSearch) {
      searchInput.addEventListener('input', (e) => this.onSearch(e.target.value));
    }
    searchWrapper.appendChild(searchInput);
    this.commandBarEl.appendChild(searchWrapper);

    // Refresh button
    const refreshBtn = createElement('button', {
      className: 'btn-icon',
      'aria-label': 'Refresh',
      title: 'Refresh',
    });
    refreshBtn.innerHTML = Icons.refresh;
    refreshBtn.addEventListener('click', () => {
      // Re-render current page
      const path = router.getPath();
      router.navigate(path, true);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    this.commandBarEl.appendChild(refreshBtn);
  }

  /* ── Breadcrumbs ── */
  updateBreadcrumbs(path) {
    clearElement(this.breadcrumbEl);

    const crumbs = router.getBreadcrumbs(path);

    crumbs.forEach((crumb, index) => {
      if (index > 0) {
        const sep = createElement('span', { className: 'breadcrumb-separator', innerHTML: Icons.chevronRight });
        this.breadcrumbEl.appendChild(sep);
      }

      const isLast = index === crumbs.length - 1;
      const item = createElement('span', {
        className: `breadcrumb-item ${isLast ? 'current' : ''}`,
        textContent: crumb.label,
        role: 'link',
        'aria-current': isLast ? 'page' : undefined,
      });

      if (!isLast) {
        item.addEventListener('click', () => router.navigate(crumb.path));
        item.setAttribute('tabindex', '0');
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') router.navigate(crumb.path);
        });
      }

      this.breadcrumbEl.appendChild(item);
    });
  }
}
