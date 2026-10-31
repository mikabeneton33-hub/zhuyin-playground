(function () {
  'use strict';
  const C = window.WORKS_CATALOG;
  const sites = window.WENSHU_SITES;
  const groups = window.WENSHU_GROUPS;
  const state = { query: '', task: '', group: '', limit: 12 };
  const byId = (id) => document.getElementById(id);
  const cards = Array.from(byId('results').children);
  const dialog = byId('tool-dialog');
  let returnFocus;
  let lastDialogId;
  let changedHash = false;
  let beforeDialogHash = '';

  function readLast() {
    try { return localStorage.getItem('danaiworks.last-entered'); } catch { return null; }
  }
  function showRecent() {
    const site = sites.find((s) => s.id === readLast());
    if (!site) return;
    byId('recent').innerHTML = `接著上次的探索：<a href="${C.escape(site.url)}" target="_blank" rel="noopener" data-enter="${site.id}">${C.escape(site.siteName)} ↗</a>`;
    byId('recent').hidden = false;
  }
  function update() {
    const matches = C.filter(sites, groups, state);
    const shown = new Set(matches.slice(0, state.limit).map((s) => s.id));
    cards.forEach((card) => { card.hidden = !shown.has(card.dataset.site); });
    const task = C.tasks.find((t) => t.id === state.task);
    const group = groups.find((g) => g.id === state.group);
    const criteria = [task?.label, group?.label, state.query.trim() ? `「${state.query.trim()}」` : ''].filter(Boolean);
    byId('result-count').textContent = `${criteria.length ? criteria.join(' · ') + '：' : '全部工具：'}找到 ${matches.length} 個，顯示 ${shown.size} 個`;
    byId('clear-filters').hidden = !criteria.length;
    byId('empty-state').hidden = matches.length !== 0;
    const more = byId('show-more');
    more.hidden = state.limit >= matches.length;
    more.textContent = `再看 ${Math.min(12, matches.length - shown.size)} 個工具（還有 ${matches.length - shown.size} 個）`;
    document.querySelectorAll('[data-filter]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === state.task)));
  }
  function reset() {
    Object.assign(state, { query: '', task: '', group: '', limit: 12 });
    byId('search').value = ''; byId('group-filter').value = ''; update();
    byId('search').focus({ preventScroll: true });
  }
  function goToResults() {
    byId('discover').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    byId('search').focus({ preventScroll: true });
  }
  function openDetails(id, trigger) {
    const site = sites.find((s) => s.id === id);
    if (!site) return;
    lastDialogId = site.id;
    returnFocus = trigger || document.activeElement;
    byId('dialog-content').innerHTML = `<div class="dialog-body"><div><img class="dialog-shot" src="${C.escape(site.screenshot)}" alt="${C.escape(site.siteName)}畫面預覽"><div class="share-tools"><img src="${C.escape(site.qr)}" alt="掃描開啟${C.escape(site.siteName)}"><div><span>給學生或朋友掃碼開啟</span><button class="copy-link" type="button">複製網站連結</button></div></div><p class="copy-url">${C.escape(site.url)}</p><p class="copy-status" role="status" aria-live="polite"></p></div><div><p class="card-eyebrow">${C.escape(groups.find((g) => g.id === site.group)?.label || '')}</p><h2 id="dialog-title">${C.escape(site.siteName)}</h2><p>${C.escape(site.desc)}</p><div class="card-tags">${site.tags.map((tag) => `<span>${C.escape(tag)}</span>`).join('')}</div><a class="primary-button" href="${C.escape(site.url)}" target="_blank" rel="noopener" data-enter="${site.id}">${C.escape(site.action || '立即使用')} ↗</a><p>網站將在新分頁開啟。</p>${site.mirrors?.length ? `<details class="mirror-links"><summary>主站無法開啟？查看備援網址</summary>${site.mirrors.map((mirror) => `<a href="${C.escape(mirror.url)}" target="_blank" rel="noopener">${C.escape(mirror.label)} ↗</a>`).join('')}</details>` : ''}</div></div>`;
    byId('dialog-content').querySelector('.copy-link').addEventListener('click', async () => {
      const feedback = byId('dialog-content').querySelector('.copy-status');
      try { await navigator.clipboard.writeText(site.url); feedback.textContent = '已複製網站連結'; }
      catch { feedback.textContent = '無法自動複製，請選取上方網址複製。'; }
    });
    if (!dialog.open) dialog.showModal();
  }
  function readHash() {
    const id = new URLSearchParams(location.hash.slice(1)).get('site');
    if (id && sites.some((s) => s.id === id)) openDetails(id);
    else if (dialog.open) dialog.close();
  }
  byId('search-form').addEventListener('submit', (event) => { event.preventDefault(); state.query = byId('search').value; state.limit = 12; update(); });
  byId('search').addEventListener('input', (event) => { state.query = event.target.value; state.limit = 12; update(); });
  byId('group-filter').addEventListener('change', (event) => { state.group = event.target.value; state.limit = 12; update(); });
  byId('clear-filters').addEventListener('click', reset);
  byId('reset-empty').addEventListener('click', reset);
  byId('show-more').addEventListener('click', () => {
    const previous = new Set(cards.filter((card) => !card.hidden));
    state.limit += 12; update();
    cards.find((card) => !card.hidden && !previous.has(card))?.querySelector('a')?.focus({ preventScroll: true });
  });
  document.addEventListener('click', (event) => {
    const target = event.target.closest('a,button');
    if (!target) return;
    if (target.hasAttribute('data-filter')) {
      state.task = target.dataset.filter;
      state.group = ''; byId('group-filter').value = ''; state.limit = 12; update();
    }
    if (target.hasAttribute('data-task')) {
      event.preventDefault();
      Object.assign(state, { task: target.dataset.task, group: '', query: '', limit: 12 });
      byId('search').value = ''; byId('group-filter').value = ''; update(); goToResults();
    }
    if (target.dataset.detail) {
      beforeDialogHash = location.hash;
      history.pushState(null, '', `#site=${target.dataset.detail}`);
      changedHash = true;
      openDetails(target.dataset.detail, target);
    }
    if (target.dataset.enter) {
      try { localStorage.setItem('danaiworks.last-entered', target.dataset.enter); } catch { /* 儲存不可用仍可開啟工具。 */ }
      showRecent();
    }
  });
  dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (new URLSearchParams(location.hash.slice(1)).get('site') === lastDialogId) {
      if (changedHash) history.back();
      else history.replaceState(null, '', location.pathname + location.search + beforeDialogHash);
    }
    changedHash = false;
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  });
  window.addEventListener('hashchange', readHash);
  document.querySelectorAll('.card-image img').forEach((img) => img.addEventListener('error', () => { img.hidden = true; }));
  document.documentElement.classList.add('has-js');
  update(); showRecent(); readHash();
})();
