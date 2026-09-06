/* ============================================================
   Nav Component — Collapsible Left Navigation Rail
   Matches Intune admin center hierarchical structure
   ============================================================ */

import { Icons, $, createElement } from '../utils.js';
import { router } from '../router.js';

/* ── Nav Tree Definition ── */
const NAV_TREE = [
  {
    id: 'home', label: 'Home', icon: Icons.home, route: '/',
  },
  {
    id: 'devices', label: 'Devices', icon: Icons.devices, route: '/devices',
    children: [
      { id: 'devices-overview', label: 'Overview', route: '/devices/overview' },
      { id: 'devices-all', label: 'All devices', route: '/devices/all' },
      {
        id: 'devices-monitor', label: 'Monitor', route: '/devices/monitor',
      },
      {
        id: 'devices-enrollment', label: 'Enrollment', route: '/devices/enrollment',
        children: [
          { id: 'enrollment-settings', label: 'Enrollment settings', route: '/devices/enrollment/settings' },
          { id: 'enrollment-android', label: 'Android enrollment', route: '/devices/enrollment/android' },
          { id: 'enrollment-restrictions', label: 'Enrollment restrictions', route: '/devices/enrollment/restrictions' },
          { id: 'enrollment-autopilot', label: 'Windows Autopilot', route: '/devices/enrollment/autopilot' },
          { id: 'enrollment-esp', label: 'Enrollment Status Page', route: '/devices/enrollment/esp' },
        ]
      },
      { id: 'devices-compliance', label: 'Compliance policies', route: '/devices/compliance-policies' },
      { id: 'devices-config', label: 'Configuration profiles', route: '/devices/configuration-profiles' },
      { id: 'devices-scripts', label: 'Scripts and remediations', route: '/devices/scripts' },
      {
        id: 'devices-identity', label: 'Identity and compliance', route: '/devices/identity',
        children: [
          { id: 'identity-roles', label: 'Roles', route: '/devices/identity/roles' },
          { id: 'identity-scope-tags', label: 'Scope tags', route: '/devices/identity/scope-tags' },
          { id: 'identity-hello', label: 'Windows Hello for Business', route: '/devices/identity/hello' },
          { id: 'identity-laps', label: 'Windows LAPS', route: '/devices/identity/laps' },
          { id: 'identity-ca', label: 'Conditional Access', route: '/devices/identity/conditional-access' },
          { id: 'identity-groups', label: 'Dynamic groups', route: '/devices/identity/dynamic-groups' },
        ]
      },
    ]
  },
  {
    id: 'apps', label: 'Apps', icon: Icons.apps, route: '/apps',
    children: [
      { id: 'apps-all', label: 'All apps', route: '/apps/all' },
      { id: 'apps-quiet-time', label: 'Quiet Time policies', route: '/apps/quiet-time' },
      { id: 'apps-m365', label: 'Microsoft 365 Apps', route: '/apps/microsoft-365' },
      { id: 'apps-protection', label: 'App protection policies', route: '/apps/protection-policies' },
      { id: 'apps-config', label: 'App configuration policies', route: '/apps/configuration-policies' },
      { id: 'apps-stores', label: 'Platform stores', route: '/apps/platform-stores' },
    ]
  },
  {
    id: 'endpoint-security', label: 'Endpoint security', icon: Icons.security, route: '/endpoint-security',
    children: [
      { id: 'es-overview', label: 'Overview', route: '/endpoint-security/overview' },
      { id: 'es-all-devices', label: 'All devices', route: '/endpoint-security/all-devices' },
      { id: 'es-antivirus', label: 'Antivirus', route: '/endpoint-security/antivirus' },
      { id: 'es-firewall', label: 'Firewall', route: '/endpoint-security/firewall' },
      { id: 'es-disk', label: 'Disk encryption', route: '/endpoint-security/disk-encryption' },
      { id: 'es-asr', label: 'Attack surface reduction', route: '/endpoint-security/asr' },
      { id: 'es-account', label: 'Account protection', route: '/endpoint-security/account-protection' },
      { id: 'es-baselines', label: 'Security baselines', route: '/endpoint-security/baselines' },
      { id: 'es-app-control', label: 'App Control for Business', route: '/endpoint-security/app-control' },
      { id: 'es-defender', label: 'Defender for Endpoint', route: '/endpoint-security/defender' },
      { id: 'es-update-rings', label: 'Update rings', route: '/endpoint-security/update-rings' },
      { id: 'es-feature-updates', label: 'Feature updates', route: '/endpoint-security/feature-updates' },
      { id: 'es-quality-updates', label: 'Quality updates', route: '/endpoint-security/quality-updates' },
      { id: 'es-autopatch', label: 'Windows Autopatch', route: '/endpoint-security/autopatch' },
      { id: 'es-delivery-opt', label: 'Delivery Optimization', route: '/endpoint-security/delivery-optimization' },
    ]
  },
  {
    id: 'windows365', label: 'Windows 365', icon: Icons.cloud, route: '/windows-365',
    children: [
      { id: 'w365-overview', label: 'Overview', route: '/windows-365/overview' },
      { id: 'w365-all', label: 'All Cloud PCs', route: '/windows-365/all-cloud-pcs' },
      { id: 'w365-provisioning', label: 'Provisioning policies', route: '/windows-365/provisioning-policies' },
      { id: 'w365-network', label: 'Azure network connections', route: '/windows-365/azure-network-connections' },
      { id: 'w365-images', label: 'Custom images', route: '/windows-365/custom-images' },
    ]
  },
  {
    id: 'intune-suite', label: 'Intune Suite', icon: Icons.puzzle, route: '/intune-suite',
    children: [
      { id: 'suite-epm', label: 'Endpoint Privilege Management', route: '/intune-suite/epm' },
      { id: 'suite-catalog', label: 'Enterprise App Catalog', route: '/intune-suite/app-catalog' },
      { id: 'suite-remote', label: 'Remote Help', route: '/intune-suite/remote-help' },
      { id: 'suite-pki', label: 'Cloud PKI', route: '/intune-suite/cloud-pki' },
      { id: 'suite-tunnel', label: 'Microsoft Tunnel for MAM', route: '/intune-suite/tunnel' },
      { id: 'suite-analytics', label: 'Advanced Analytics', route: '/intune-suite/advanced-analytics' },
    ]
  },
  {
    id: 'reports', label: 'Reports', icon: Icons.reports, route: '/reports',
    children: [
      { id: 'reports-compliance', label: 'Device compliance', route: '/reports/device-compliance' },
      { id: 'reports-enrollment', label: 'Device enrollment', route: '/reports/device-enrollment' },
      { id: 'reports-apps', label: 'App reports', route: '/reports/app-reports' },
      { id: 'reports-analytics', label: 'Endpoint Analytics', route: '/reports/endpoint-analytics' },
    ]
  },
  {
    id: 'tenant', label: 'Tenant administration', icon: Icons.settings, route: '/tenant',
    children: [
      { id: 'tenant-health', label: 'Service health', route: '/tenant/service-health' },
      { id: 'tenant-messages', label: 'Message center', route: '/tenant/message-center' },
      { id: 'tenant-connectors', label: 'Connectors', route: '/tenant/connectors' },
      { id: 'tenant-customization', label: 'Customization', route: '/tenant/customization' },
      { id: 'tenant-audit-logs', label: 'Audit logs', route: '/tenant/audit-logs' },
      { id: 'tenant-alerts', label: 'Alerts', route: '/tenant/alerts' },
      { id: 'tenant-copilot', label: 'Security Copilot', route: '/tenant/security-copilot' },
    ]
  },
  {
    id: 'troubleshooting', label: 'Troubleshooting + support', icon: Icons.troubleshoot, route: '/troubleshooting',
  },
];

export class Nav {
  constructor(containerEl) {
    this.container = containerEl;
    this.expanded = new Set();
    this.activeRoute = '/';
    this.isMobileOpen = false;
  }

  render() {
    const content = createElement('div', { className: 'nav-rail__content', role: 'navigation', 'aria-label': 'Main navigation' });
    this._renderItems(NAV_TREE, content, 0);
    this.container.innerHTML = '';
    this.container.appendChild(content);
  }

  _renderItems(items, parent, depth) {
    for (const item of items) {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = this.expanded.has(item.id);
      const isActive = this._isActiveItem(item);

      // Nav item button
      const classes = ['nav-item'];
      if (isActive) classes.push('active');
      if (hasChildren && isExpanded) classes.push('expanded');

      const btn = createElement('button', {
        className: classes.join(' '),
        'aria-label': item.label,
        dataset: { navId: item.id, route: item.route, tooltip: item.label },
        role: 'menuitem',
      });

      // Icon
      if (item.icon) {
        btn.appendChild(createElement('span', { className: 'nav-item__icon', innerHTML: item.icon }));
      }

      // Label
      btn.appendChild(createElement('span', { className: 'nav-item__label', textContent: item.label }));

      // Chevron for expandable items
      if (hasChildren) {
        btn.appendChild(createElement('span', { className: 'nav-item__chevron', innerHTML: Icons.chevronRight }));
      }

      // Click handler
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (hasChildren) {
          this._toggleExpand(item.id);
        }
        if (item.route) {
          router.navigate(item.route);
          this.setActive(item.route);
          // Close mobile nav
          if (this.isMobileOpen) this.closeMobileNav();
        }
      });

      parent.appendChild(btn);

      // Children group
      if (hasChildren) {
        const group = createElement('div', {
          className: `nav-group ${isExpanded ? 'open' : ''}`,
          dataset: { groupId: item.id },
          role: 'group',
        });
        this._renderItems(item.children, group, depth + 1);
        parent.appendChild(group);
      }

      // Add divider after certain sections
      if (['home'].includes(item.id)) {
        parent.appendChild(createElement('div', { className: 'nav-divider' }));
      }
    }
  }

  _isActiveItem(item) {
    if (item.route === this.activeRoute) return true;
    // Check if active route starts with item route (parent highlight)
    if (item.route !== '/' && this.activeRoute.startsWith(item.route + '/')) return true;
    return false;
  }

  _toggleExpand(id) {
    if (this.expanded.has(id)) {
      this.expanded.delete(id);
    } else {
      this.expanded.add(id);
    }
    this._updateExpandState();
  }

  _updateExpandState() {
    const groups = this.container.querySelectorAll('.nav-group');
    groups.forEach(group => {
      const id = group.dataset.groupId;
      if (this.expanded.has(id)) {
        group.classList.add('open');
      } else {
        group.classList.remove('open');
      }
    });

    // Update chevrons
    const items = this.container.querySelectorAll('.nav-item');
    items.forEach(item => {
      const id = item.dataset.navId;
      if (this.expanded.has(id)) {
        item.classList.add('expanded');
      } else {
        item.classList.remove('expanded');
      }
    });
  }

  setActive(route) {
    this.activeRoute = route;

    // Auto-expand parent groups
    this._autoExpandForRoute(route);

    // Update active states
    const items = this.container.querySelectorAll('.nav-item');
    items.forEach(item => {
      const itemRoute = item.dataset.route;
      const isActive = (itemRoute === route) ||
        (itemRoute !== '/' && route.startsWith(itemRoute + '/'));
      item.classList.toggle('active', isActive);
    });
  }

  _autoExpandForRoute(route) {
    const expandPath = (items, path = []) => {
      for (const item of items) {
        if (item.route === route || (item.route !== '/' && route.startsWith(item.route))) {
          path.forEach(id => this.expanded.add(id));
          if (item.children) this.expanded.add(item.id);
          return true;
        }
        if (item.children) {
          if (expandPath(item.children, [...path, item.id])) return true;
        }
      }
      return false;
    };
    expandPath(NAV_TREE);
    this._updateExpandState();
  }

  /* ── Mobile Nav ── */
  openMobileNav() {
    this.isMobileOpen = true;
    this.container.classList.add('mobile-open');
    const backdrop = document.getElementById('nav-backdrop');
    if (backdrop) backdrop.classList.add('visible');
  }

  closeMobileNav() {
    this.isMobileOpen = false;
    this.container.classList.remove('mobile-open');
    const backdrop = document.getElementById('nav-backdrop');
    if (backdrop) backdrop.classList.remove('visible');
  }

  toggleMobileNav() {
    if (this.isMobileOpen) this.closeMobileNav();
    else this.openMobileNav();
  }
}

export { NAV_TREE };
