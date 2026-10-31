(function (root) {
  'use strict';
  const tasks = [
    { id: 'classroom', icon: '互', label: '帶一堂互動課', note: '課堂競賽、即時回應、班級經營', groups: ['g11'], ids: ['class-points'] },
    { id: 'language', icon: '讀', label: '練國文與閱讀', note: '字詞、文言文、閱讀理解', groups: ['g1'] },
    { id: 'exams', icon: '題', label: '找歷屆考題', note: '會考、學測、統測分類練習', groups: ['g7', 'g8', 'g9'] },
    { id: 'habits', icon: '心', label: '培養自我領導力', note: '七個習慣、情境選擇、養成遊戲', groups: ['g2'] },
    { id: 'explore', icon: '探', label: '自學與親子陪伴', note: '各科自學、閱讀、文化與知識探索', groups: ['g0', 'g5', 'g6', 'g12', 'g13'] },
    { id: 'teacher', icon: '師', label: '找教師成長資源', note: '研習、教檢、親師溝通與校園工具', groups: ['g3', 'g4', 'g10', 'g14'], exclude: ['class-points'] },
  ];
  const starters = [
    { id: 'quiz-arena', label: '我是老師｜讓全班一起參與', action: '開始課堂互動', tip: '老師登入建題庫；學生用房號加入。' },
    { id: 'reading-expedition', label: '我是學生｜每天讀懂一篇', action: '開始閱讀練習', tip: '國中閱讀｜選一篇文章，從原文找依據。' },
    { id: 'self-learning-passport', label: '我是家長｜陪孩子累積一點', action: '看看每日任務', tip: '每天 5～15 分鐘，從一個小任務開始。' },
    { id: 'bianshui-town', label: '隨意逛逛｜在探索裡發現樂趣', action: '走進汴水小鎮', tip: '依自己的步調，探索宋韻生活與城鎮營造。' },
  ];
  const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const matchesTask = (site, id) => {
    const task = tasks.find((item) => item.id === id);
    return !task || (!task.exclude?.includes(site.id) && (task.groups.includes(site.group) || task.ids?.includes(site.id)));
  };
  const normalize = (value) => String(value).normalize('NFKC').toLowerCase().replaceAll('臺', '台').replaceAll('英語', '英文');
  function filter(sites, groups, state) {
    const words = normalize(state.query || '').trim().split(/\s+/).filter(Boolean);
    return sites.filter((site) => {
      const text = normalize([site.siteName, site.tagline, site.desc, ...site.tags, groups.find((g) => g.id === site.group)?.label].join(' '));
      return matchesTask(site, state.task) && (!state.group || site.group === state.group) && words.every((word) => text.includes(word));
    });
  }
  function card(site, groups, starter) {
    const group = groups.find((item) => item.id === site.group);
    return `<article class="tool-card${starter ? ' starter-card' : ''}" data-site="${escape(site.id)}">
      <div class="card-image"><img src="${escape(site.screenshot)}" alt="${escape(site.siteName)}畫面預覽" loading="lazy" width="640" height="360"></div>
      <div class="card-body"><p class="card-eyebrow">${escape(starter?.label || group?.label || '')}</p>
      <h3>${escape(site.siteName)}</h3><p class="card-description">${escape(site.tagline)}</p>
      ${starter ? `<p class="start-tip">${escape(starter.tip)}</p>` : `<div class="card-tags">${site.tags.slice(0, 3).map((tag) => `<span>${escape(tag)}</span>`).join('')}</div>`}
      <div class="card-actions"><a class="start-link" href="${escape(site.url)}" target="_blank" rel="noopener" data-enter="${escape(site.id)}" aria-label="${escape(starter?.action || site.action || '立即使用')}：${escape(site.siteName)}（另開分頁）">${escape(starter?.action || site.action || '立即使用')} <span aria-hidden="true">↗</span></a>
      <button type="button" class="detail-button js-only" data-detail="${escape(site.id)}" aria-label="了解${escape(site.siteName)}">了解更多</button></div></div></article>`;
  }
  function home(sites, groups) {
    const spotlight = sites.find((s) => s.id === 'bianshui-town');
    return `<section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy"><p class="eyebrow"><span class="tiny-line"></span> 給每個人的學習與探索入口</p>
      <h1 id="hero-title">找到好工具，<br>讓學習<span>發生。</span></h1>
      <p class="hero-description">教學、自學、陪孩子練習，或只是想探索。<br>從 ${sites.length} 個工具與資源裡，找到適合你的開始。</p>
      <div class="hero-actions"><a class="primary-button" href="#discover">找到適合的工具 <span aria-hidden="true">↓</span></a><a class="quiet-link" href="#start">第一次來？從這裡開始 ↗</a></div>
      <p class="hero-note">教師設計 <span>／</span> 免費瀏覽 <span>／</span> 每個人都能找到入口</p></div>
      <a class="spotlight" href="${escape(spotlight.url)}" target="_blank" rel="noopener" data-enter="${spotlight.id}">
      <div class="spotlight-heading"><span>學習，也可以是一場探索</span><span class="spotlight-number">精選工具</span></div>
      <div class="spotlight-image"><img src="${escape(spotlight.screenshot)}" alt="汴水小鎮的文化探索與營造畫面" width="640" height="360" fetchpriority="high"></div>
      <div class="spotlight-copy"><div><p>依自己的步調，走進一城煙火</p><h2>汴水小鎮</h2></div><span class="circle-arrow" aria-hidden="true">↗</span></div></a>
    </section>
    <div id="recent" class="recent js-only" hidden></div>
    <section class="about-strip"><div><h2>App 與專案資料</h2><p>非網站作品與需自行安裝的專案，登入後即可瀏覽。</p></div><a class="primary-button" href="https://naicheng-tw.pages.dev/members/">登入查看專案 ↗</a></section>
    <section class="needs" aria-labelledby="needs-title"><div class="section-heading"><div><p class="eyebrow">從你的需要出發</p><h2 id="needs-title">今天，你想做什麼？</h2></div><span class="section-note">六種方向，少一點尋找。</span></div>
    <div class="needs-grid">${tasks.map((task, i) => `<a class="need-card" href="#discover" data-task="${task.id}"><span class="need-icon tone-${i}">${task.icon}</span><span class="need-copy"><strong>${task.label}</strong><small>${task.note}</small></span><span class="need-count">${sites.filter((s) => matchesTask(s, task.id)).length}<span aria-hidden="true"> ↗</span></span></a>`).join('')}</div></section>
    <section id="start" class="starters" aria-labelledby="start-title"><div class="section-heading"><div><p class="eyebrow">老師、學生、家長，或帶著好奇心的你</p><h2 id="start-title">不同的你，都有一個開始</h2></div><a class="quiet-link" href="#discover">看全部 ${sites.length} 個工具 ↓</a></div><div class="starter-grid">${starters.map((item) => card(sites.find((s) => s.id === item.id), groups, item)).join('')}</div></section>
    <section id="discover" class="discover" aria-labelledby="discover-title"><div class="section-heading"><div><p class="eyebrow">你的教學與學習工具箱</p><h2 id="discover-title">找一個，現在就用</h2></div><span class="section-note">每個作品都能直接開啟 ↗</span></div>
    <div class="finder js-only"><form id="search-form" role="search"><label for="search">搜尋工具</label><div class="search-wrap"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="試試「會考」、「閱讀」或「班級經營」" autocomplete="off" aria-controls="results"><button class="search-button" type="submit">搜尋</button></div></form>
    <div class="filter-row"><div id="task-filters" class="filter-chips" role="group" aria-label="依使用需求篩選"><button type="button" data-filter="" aria-pressed="true">全部</button>${tasks.map((task) => `<button type="button" data-filter="${task.id}" aria-pressed="false">${task.label}</button>`).join('')}</div><label class="group-label" for="group-filter">依主題細找<select id="group-filter" aria-label="依主題細找"><option value="">所有主題</option>${groups.map((g) => `<option value="${g.id}">${escape(g.label)}</option>`).join('')}</select></label></div>
    <div class="results-meta"><p id="result-count" role="status" aria-live="polite"></p><button id="clear-filters" type="button" class="quiet-button" hidden>清除條件</button></div></div>
    <div id="results" class="results-grid">${sites.map((site) => card(site, groups)).join('')}</div>
    <div id="empty-state" class="empty-state" hidden><p class="empty-mark" aria-hidden="true">⌕</p><h3>還沒找到符合的工具</h3><p>試著縮短關鍵字，或清除條件看看其他選擇。</p><button id="reset-empty" class="primary-button" type="button">查看全部工具</button></div>
    <button id="show-more" class="more-button js-only" type="button" hidden>載入更多工具</button>
    <noscript><p>搜尋與篩選需要 JavaScript；以下所有作品連結仍可直接使用。</p></noscript></section>
    <section class="about-strip" id="about"><div class="about-seal" aria-hidden="true">乃</div><div><p class="eyebrow">從教學現場長出來的工具</p><h2>我是大乃老師，想讓更多人享受學習。</h2><p>國中國文教師，也是數位教學的實作者。這裡收錄我做的練習、遊戲與課堂工具。不論是教學、自學、陪伴孩子，或探索感興趣的知識，都能從一個小工具開始。</p></div><a class="quiet-link" href="https://naicheng-tw.pages.dev/" target="_blank" rel="noopener">認識大乃老師 ↗</a></section>`;
  }
  root.WORKS_CATALOG = { tasks, starters, escape, matchesTask, filter, card, home };
})(typeof window === 'undefined' ? globalThis : window);
