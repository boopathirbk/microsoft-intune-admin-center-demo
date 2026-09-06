/* ============================================================
   Notifications — Toast system + Notification center dropdown
   ============================================================ */

import { Icons, createElement, relativeTime, clearElement } from '../utils.js';
import { Store, Collections } from '../store.js';

/* ── Toast Notification System ── */
export class ToastManager {
  constructor(containerEl) {
    this.container = containerEl;
    this.toasts = [];
    this.maxVisible = 5;
  }

  show({ type = 'info', title, message, duration = 5000, action = null }) {
    const toast = this._createToast({ type, title, message, action });
    this.container.appendChild(toast.el);
    this.toasts.push(toast);

    // Auto-dismiss
    if (duration > 0) {
      toast.timer = setTimeout(() => this.dismiss(toast), duration);
    }

    // Store as notification
    Store.addNotification({
      type,
      title,
      message,
    });

    // Update notification badge
    this._updateBadge();

    // Limit visible toasts
    while (this.toasts.length > this.maxVisible) {
      this.dismiss(this.toasts[0]);
    }

    return toast;
  }

  dismiss(toast) {
    if (!toast || toast.dismissed) return;
    toast.dismissed = true;
    clearTimeout(toast.timer);
    toast.el.classList.add('exiting');
    setTimeout(() => {
      if (toast.el.parentNode) toast.el.parentNode.removeChild(toast.el);
      this.toasts = this.toasts.filter(t => t !== toast);
    }, 200);
  }

  _createToast({ type, title, message, action }) {
    const toast = { dismissed: false };

    const iconSvg = {
      success: Icons.success,
      error: Icons.error,
      warning: Icons.warning,
      info: Icons.info,
    }[type] || Icons.info;

    const el = createElement('div', { className: `toast toast--${type}`, role: 'alert', 'aria-live': 'assertive' });

    // Icon
    el.appendChild(createElement('span', { className: 'toast__icon', innerHTML: iconSvg }));

    // Content
    const content = createElement('div', { className: 'toast__content' });
    if (title) content.appendChild(createElement('div', { className: 'toast__title', textContent: title }));
    if (message) content.appendChild(createElement('div', { className: 'toast__message', textContent: message }));
    if (action) {
      const actionBtn = createElement('button', { className: 'btn btn-link btn-sm', textContent: action.label });
      actionBtn.addEventListener('click', action.onClick);
      content.appendChild(actionBtn);
    }
    el.appendChild(content);

    // Close button
    const closeBtn = createElement('button', { className: 'toast__close', 'aria-label': 'Dismiss notification' });
    closeBtn.innerHTML = Icons.close;
    closeBtn.addEventListener('click', () => this.dismiss(toast));
    el.appendChild(closeBtn);

    toast.el = el;
    return toast;
  }

  /* ── Convenience Methods ── */
  success(title, message) { return this.show({ type: 'success', title, message }); }
  error(title, message) { return this.show({ type: 'error', title, message, duration: 8000 }); }
  warning(title, message) { return this.show({ type: 'warning', title, message, duration: 7000 }); }
  info(title, message) { return this.show({ type: 'info', title, message }); }

  _updateBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    const count = Store.getUnreadNotificationCount();
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

/* ── Notification Center (dropdown panel) ── */
export class NotificationCenter {
  constructor(panelEl, toggleBtnEl) {
    this.panel = panelEl;
    this.toggleBtn = toggleBtnEl;
    this.isOpen = false;

    this.toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.panel.contains(e.target) && !this.toggleBtn.contains(e.target)) {
        this.close();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  open() {
    this.isOpen = true;
    this.render();
    this.panel.classList.add('open');
  }

  close() {
    this.isOpen = false;
    this.panel.classList.remove('open');
  }

  render() {
    const body = this.panel.querySelector('.notification-center__body');
    if (!body) return;

    clearElement(body);

    const notifications = Store.getAll(Collections.NOTIFICATIONS);

    if (notifications.length === 0) {
      body.appendChild(createElement('div', {
        className: 'notification-center__empty',
        innerHTML: `<span style="font-size:32px;margin-bottom:8px;">🔔</span><span>No notifications</span>`,
      }));
      return;
    }

    for (const notif of notifications) {
      const entry = createElement('div', {
        className: `notification-entry ${notif.read ? '' : 'unread'}`,
        dataset: { notifId: notif.id },
      });

      const iconSvg = {
        success: Icons.success,
        error: Icons.error,
        warning: Icons.warning,
        info: Icons.info,
      }[notif.type] || Icons.info;

      const iconColor = {
        success: 'var(--color-success)',
        error: 'var(--color-error)',
        warning: 'var(--color-warning)',
        info: 'var(--color-info)',
      }[notif.type] || 'var(--color-info)';

      entry.appendChild(createElement('span', {
        className: 'notification-entry__icon',
        innerHTML: iconSvg,
        style: { color: iconColor },
      }));

      const content = createElement('div', { className: 'notification-entry__content' });
      content.appendChild(createElement('div', { className: 'notification-entry__message', textContent: notif.title || notif.message }));
      if (notif.message && notif.title) {
        content.appendChild(createElement('div', {
          className: 'notification-entry__message',
          textContent: notif.message,
          style: { fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' },
        }));
      }
      content.appendChild(createElement('div', { className: 'notification-entry__time', textContent: relativeTime(notif.timestamp) }));
      entry.appendChild(content);

      entry.addEventListener('click', () => {
        Store.markNotificationRead(notif.id);
        entry.classList.remove('unread');
        this._updateBadge();
        if (notif.actionUrl) {
          window.location.hash = notif.actionUrl;
          this.close();
        }
      });

      body.appendChild(entry);
    }
  }

  _updateBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;
    const count = Store.getUnreadNotificationCount();
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }

  updateBadge() {
    this._updateBadge();
  }
}
