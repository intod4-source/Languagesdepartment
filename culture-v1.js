(function () {
  'use strict';
  const DATA_ROOT = './culture-data/';
  let catalogue = null;
  let selected = null;
  const $ = (s) => document.querySelector(s);
  const clean = (v) => String(v || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function injectStyle() {
    const style = document.createElement('style');
    style.textContent = `
      .culture-hero{padding:26px;border-radius:22px;color:#fff;background:linear-gradient(125deg,#0b483d,#097061 58%,#c99a35);margin-bottom:18px;position:relative;overflow:hidden}.culture-hero:after{content:'';position:absolute;width:260px;height:260px;border:1px solid #ffffff50;border-radius:50%;right:-74px;top:-128px}.culture-hero h2{font-size:28px;margin:0 0 8px;position:relative;z-index:1}.culture-hero p{margin:0;max-width:700px;opacity:.92;position:relative;z-index:1}.culture-toolbar{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 16px}.culture-search{flex:1;min-width:230px}.culture-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(235px,1fr));gap:14px}.culture-card{border:1px solid #dbe8e4;border-radius:16px;background:#fff;padding:17px;text-align:left;cursor:pointer;transition:.18s;box-shadow:0 3px 12px #1c4c4210}.culture-card:hover{transform:translateY(-3px);border-color:#159278;box-shadow:0 12px 22px #1c4c4220}.culture-card .flag{font-size:34px;line-height:1}.culture-card h3{margin:11px 0 5px;color:#143a34}.culture-card p{margin:0;color:#638078;font-size:13px}.culture-back{margin-bottom:14px}.culture-country-hero{background:linear-gradient(130deg,#f6faf8,#e5f3ed);border:1px solid #cce4da;border-radius:18px;padding:22px;display:flex;gap:17px;align-items:center;margin-bottom:16px}.culture-country-hero .flag{font-size:56px}.culture-country-hero h2{margin:0;color:#123f35}.culture-country-hero p{margin:6px 0 0;color:#58736b}.culture-content{max-width:960px;margin:auto}.culture-section{background:#fff;border:1px solid #dbe8e4;border-radius:16px;padding:21px;margin:13px 0}.culture-section h3{font-size:19px;color:#0f5a4b;margin:0 0 12px;padding-bottom:10px;border-bottom:2px solid #d7eee6}.culture-section p{white-space:pre-line;line-height:1.85;color:#263b36;margin:0}.culture-empty{padding:36px;text-align:center;color:#658078}.culture-count{font-size:13px;color:#57736b;padding:8px 0}@media(max-width:600px){.culture-hero{padding:20px}.culture-country-hero{padding:16px}.culture-grid{grid-template-columns:1fr 1fr}.culture-card{padding:13px}}
    `;
    document.head.appendChild(style);
  }

  async function loadCatalogue() {
    if (catalogue) return catalogue;
    const r = await fetch(DATA_ROOT + 'index.json', {cache: 'no-store'});
    if (!r.ok) throw new Error('Country Culture data could not be loaded.');
    catalogue = await r.json();
    return catalogue;
  }

  function listView(items) {
    return `<div class="culture-hero"><h2>Country Culture Library</h2><p>Read essential cultural guidance before working in a country. Select a country to explore its people, customs, communication and local practices.</p></div><div class="culture-toolbar"><input class="input culture-search" id="cultureSearch" placeholder="Search a country…" value="${clean(filters.cultureSearch || '')}"><button class="btn btn-secondary" id="cultureClear">Clear</button></div><div class="culture-count">${items.length} country guides available</div><div class="culture-grid">${items.map(c => `<button class="culture-card" data-culture="${clean(c.slug)}"><div class="flag">${clean(c.flag)}</div><h3>${clean(c.name)}</h3><p>${clean(c.summary || 'Country culture guide')}</p></button>`).join('')}</div>`;
  }

  function detailView(c) {
    const sections = (c.sections || []).map(s => `<section class="culture-section"><h3>${clean(s.heading)}</h3><p>${clean(s.body)}</p></section>`).join('');
    return `<div class="culture-content"><button class="btn btn-secondary culture-back" id="cultureBack">← All Countries</button><div class="culture-country-hero"><div class="flag">${clean(c.flag)}</div><div><h2>${clean(c.name)}</h2><p>Country Culture Guide · Read carefully before undertaking local work.</p></div></div>${sections || '<div class="culture-empty">This guide is being prepared.</div>'}</div>`;
  }

  async function renderCulture() {
    const host = $('#content');
    if (!host) return;
    host.innerHTML = '<div class="culture-empty">Loading Country Culture Library…</div>';
    try {
      const all = await loadCatalogue();
      if (selected) {
        const r = await fetch(DATA_ROOT + selected + '.json', {cache:'no-store'});
        if (!r.ok) throw new Error('This country guide is unavailable.');
        host.innerHTML = detailView(await r.json());
        $('#cultureBack').onclick = () => { selected = null; renderCulture(); };
        return;
      }
      const q = String(filters.cultureSearch || '').toLowerCase().trim();
      const visible = q ? all.filter(x => x.name.toLowerCase().includes(q)) : all;
      host.innerHTML = listView(visible);
      $('#cultureSearch').oninput = e => { filters.cultureSearch = e.target.value; renderCulture(); };
      $('#cultureClear').onclick = () => { filters.cultureSearch = ''; renderCulture(); };
      host.querySelectorAll('[data-culture]').forEach(b => b.onclick = () => { selected = b.dataset.culture; renderCulture(); });
    } catch (e) { host.innerHTML = `<div class="notice">${clean(e.message)}</div>`; }
  }

  function install() {
    if (typeof pages === 'undefined' || typeof NAV_ADMIN === 'undefined' || typeof NAV_MEMBER === 'undefined') return setTimeout(install, 80);
    injectStyle();
    if (!NAV_ADMIN.some(x => x[0] === 'culture')) NAV_ADMIN.splice(1, 0, ['culture', 'Country Culture', '◈']);
    if (!NAV_MEMBER.some(x => x[0] === 'culture')) NAV_MEMBER.splice(1, 0, ['culture', 'Country Culture', '◈']);
    pages.culture = function () { setTimeout(renderCulture, 0); return '<div class="culture-empty">Loading Country Culture Library…</div>'; };
    if (typeof session !== 'undefined' && session) renderNav();
  }
  install();
})();
