/* ============================================================
   Router — Hash-based SPA Router
   Handles navigation, route matching, and history
   ============================================================ */

export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.currentParams = {};
    this.beforeNavigateHooks = [];
    this.afterNavigateHooks = [];
    this._onHashChange = this._onHashChange.bind(this);
  }

  /* ── Route Registration ── */
  register(pattern, handler, meta = {}) {
    // pattern like '/devices', '/devices/:id', '/devices/compliance-policies'
    this.routes.set(pattern, { handler, meta, pattern });
    return this;
  }

  /* ── Navigation ── */
  navigate(path, replace = false) {
    const newHash = '#' + path;
    if (location.hash === newHash) {
      this._onHashChange();
      return;
    }
    if (replace) {
      history.replaceState(null, '', newHash);
    } else {
      location.hash = newHash;
    }
  }

  /* ── Refresh current route ── */
  refresh() {
    this._onHashChange();
  }

  /* ── Hooks ── */
  beforeNavigate(fn) {
    this.beforeNavigateHooks.push(fn);
  }

  afterNavigate(fn) {
    this.afterNavigateHooks.push(fn);
  }

  /* ── Start ── */
  start() {
    window.addEventListener('hashchange', this._onHashChange);
    // Initial route
    this._onHashChange();
  }

  stop() {
    window.removeEventListener('hashchange', this._onHashChange);
  }

  /* ── Current Path ── */
  getPath() {
    const hash = location.hash.slice(1) || '/';
    return hash.startsWith('/') ? hash : '/' + hash;
  }

  /* ── Route Matching ── */
  _matchRoute(path) {
    // Try exact match first
    if (this.routes.has(path)) {
      return { route: this.routes.get(path), params: {} };
    }

    // Try pattern matching (with :param)
    for (const [pattern, route] of this.routes) {
      const params = this._matchPattern(pattern, path);
      if (params) {
        return { route, params };
      }
    }

    // Try prefix match (find longest matching prefix)
    let bestMatch = null;
    let bestLen = 0;
    for (const [pattern, route] of this.routes) {
      if (!pattern.includes(':') && path.startsWith(pattern) && pattern.length > bestLen) {
        bestMatch = { route, params: {} };
        bestLen = pattern.length;
      }
    }
    if (bestMatch) return bestMatch;

    return null;
  }

  _matchPattern(pattern, path) {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    if (patternParts.length !== pathParts.length) return null;

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  }

  /* ── Hash Change Handler ── */
  _onHashChange() {
    const path = this.getPath();
    const match = this._matchRoute(path);

    // Run before hooks
    for (const hook of this.beforeNavigateHooks) {
      if (hook(path, this.currentRoute) === false) return;
    }

    this.currentRoute = path;

    if (match) {
      this.currentParams = match.params;
      match.route.handler(match.params, path);
    } else {
      // Default: go to home
      this.navigate('/', true);
      return;
    }

    // Run after hooks
    for (const hook of this.afterNavigateHooks) {
      hook(path, match);
    }
  }

  /* ── Breadcrumb Builder ── */
  getBreadcrumbs(path) {
    const parts = path.split('/').filter(Boolean);
    const crumbs = [{ label: 'Home', path: '/' }];

    let accumulated = '';
    for (const part of parts) {
      accumulated += '/' + part;
      const label = this._routeLabel(part, accumulated);
      crumbs.push({ label, path: accumulated });
    }

    return crumbs;
  }

  _routeLabel(segment, fullPath) {
    // Check if route has meta.label
    const match = this._matchRoute(fullPath);
    if (match && match.route.meta && match.route.meta.label) {
      return match.route.meta.label;
    }

    // Convert slug to readable label
    return segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }
}

// Singleton
export const router = new Router();
