(() => {
  const APP_ORIGIN = 'https://sense-bridge-production.netlify.app';
  const WEBSITE_ORIGINS = ['https://sensebridge.app', 'https://www.sensebridge.app'];
  const mode = document.currentScript?.dataset.mode;
  const isWebsite = mode === 'website' && WEBSITE_ORIGINS.includes(location.origin);
  const isApp = mode === 'app' && location.origin === APP_ORIGIN;
  if ((!isWebsite && !isApp) || navigator.webdriver || navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;
  const TTL = 30 * 60 * 1000;
  const STORAGE = 'sb_content_source_v1';
  const seen = new Set();
  const language = value => /^[A-Z]{2,3}(?:-[A-Z0-9]{2,8}){0,2}$/.test(String(value || '').toUpperCase()) ? String(value).toUpperCase() : 'UNKNOWN';
  const validPage = value => value === '/' || /^\/(?:help|guide|country)\/[a-zA-Z0-9-]+\/$/.test(value) || value === '/help/' || value === '/countries/';
  function getStored(key) {try {return JSON.parse(sessionStorage.getItem(key) || 'null');} catch (_) {return null;}}
  function putStored(key, value) {try {sessionStorage.setItem(key, JSON.stringify(value));} catch (_) {}}
  let source = null;
  if (isApp) {
    const query = new URLSearchParams(location.search);
    if (query.has('sb_page')) {
      const page = query.get('sb_page');
      if (validPage(page)) source = {page, pageLang: language(query.get('sb_page_lang')), until: Date.now() + TTL};
      else putStored(STORAGE, null);
    } else source = getStored(STORAGE);
    if (source && source.until > Date.now() && validPage(source.page)) putStored(STORAGE, source);
    else source = null;
  }
  function activeSource() {return source && source.until > Date.now() ? source : null;}
  function uiLanguage() {
    try {if (typeof UI !== 'undefined' && UI?.lang) return language(UI.lang);} catch (_) {}
    return language(document.documentElement.lang);
  }
  function record(event, details = {}, once = false) {
    const data = {event, ...details};
    const key = 'sb_content_event_v1:' + JSON.stringify([data.event, data.page, data.pageLang]);
    const previous = getStored(key);
    if (once && (seen.has(key) || Number(previous) > Date.now() - TTL)) return;
    if (once) {seen.add(key); putStored(key, Date.now());}
    try {
      Promise.resolve(fetch(APP_ORIGIN + '/.netlify/functions/content-event', {
        method: 'POST', credentials: 'omit', keepalive: true,
        headers: {'Content-Type': 'text/plain;charset=UTF-8'}, body: JSON.stringify(data)
      })).catch(() => {});
    } catch (_) {}
  }
  if (isApp) {
    window.SBContentMetrics = {record(event) {
      if (!['install_click', 'install_confirm'].includes(event)) return;
      const from = activeSource();
      record(event, {page: from?.page || 'DIRECT_APP', pageLang: from?.pageLang || 'UNKNOWN', appLang: uiLanguage()}, event === 'install_confirm');
    }};
    const from = activeSource();
    if (from) record('app_arrival', {...from, appLang: uiLanguage()}, true);
    return;
  }
  const page = location.pathname === '/index.html' ? '/' : location.pathname;
  if (!validPage(page)) return;
  const pageLanguage = () => language(document.documentElement.lang);
  function appLink(anchor) {
    try {
      const url = new URL(anchor.href, location.href);
      if (url.origin === location.origin && /^\/app\/?$/.test(url.pathname)) url.href = APP_ORIGIN + '/' + url.search;
      if (url.origin !== APP_ORIGIN || !['/', '/app', '/app/', '/index.html'].includes(url.pathname)) return null;
      url.searchParams.set('sb_page', page);
      url.searchParams.set('sb_page_lang', pageLanguage());
      anchor.href = url.href;
      return url;
    } catch (_) {return null;}
  }
  function prepareLinks() {document.querySelectorAll('a[href]').forEach(appLink);}
  function view() {prepareLinks(); record('page_view', {page, pageLang: pageLanguage()}, true);}
  let pending;
  function scheduleView() {clearTimeout(pending); pending = setTimeout(view, 0);}
  new MutationObserver(scheduleView).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
  for (const type of ['pointerdown', 'focusin', 'contextmenu']) document.addEventListener(type, event => {
    const anchor = event.target.closest?.('a[href]'); if (anchor) appLink(anchor);
  }, true);
  for (const type of ['click', 'auxclick']) document.addEventListener(type, event => {
    if (event.defaultPrevented || (type === 'auxclick' && event.button !== 1)) return;
    const anchor = event.target.closest?.('a[href]');
    if (anchor && appLink(anchor)) record('app_click', {page, pageLang: pageLanguage()});
  }, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleView, {once: true});
  else scheduleView();
})();
