// app.js — boot, state and wiring for the Leonida platinum companion.
// Progress lives in localStorage; nothing here touches the network beyond the one
// fetch of the app's own data file.

import {
  KIND_LABELS, detailPanel, missableCard, roadmapCard, sourceItem, statCard, trophyRow,
} from './render.js';

const EARNED_KEY = 'vice-got-a-price:earned';
const SPOILER_KEY = 'vice-got-a-price:spoilers';
const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

const view = {
  earned: new Set(JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]')),
  revealed: new Set(),
  spoilers: localStorage.getItem(SPOILER_KEY) !== 'off',
  filter: 'all',
  grade: 'all',
  query: '',
  sort: 'roadmap',
  selected: 28,
  tab: 'tracker',
};

let data = null;

const $ = (id) => document.getElementById(id);

function saveEarned() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...view.earned]));
}

function saveSpoilers() {
  localStorage.setItem(SPOILER_KEY, view.spoilers ? 'on' : 'off');
}

function trophyById(id) {
  return data.trophies.find((t) => t.id === id);
}

function matchesFilter(trophy) {
  if (view.grade !== 'all' && trophy.grade !== view.grade) return false;
  if (view.filter === 'missable' && !trophy.missable) return false;
  if (view.filter === 'earned' && !view.earned.has(trophy.id)) return false;
  if (view.filter === 'remaining' && view.earned.has(trophy.id)) return false;
  if (view.filter !== 'all' && !['missable', 'earned', 'remaining'].includes(view.filter) && trophy.kind !== view.filter) return false;
  if (view.query) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.kind} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(view.query.toLowerCase())) return false;
  }
  return true;
}

function sortedTrophies(list) {
  const byRoadmap = (a, b) => a.stage - b.stage || a.id - b.id;
  if (view.sort === 'rarity') return [...list].sort((a, b) => a.rate - b.rate || byRoadmap(a, b));
  if (view.sort === 'grade') return [...list].sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || byRoadmap(a, b));
  if (view.sort === 'name') return [...list].sort((a, b) => a.name.localeCompare(b.name));
  return [...list].sort(byRoadmap);
}

const handlers = {
  toggleEarned(id) {
    if (view.earned.has(id)) view.earned.delete(id);
    else view.earned.add(id);
    saveEarned();
    renderAll();
  },
  select(id) {
    view.selected = id;
    renderAll();
  },
  reveal(id) {
    view.revealed.add(id);
    renderAll();
  },
  jumpTo(id) {
    view.selected = id;
    view.tab = 'tracker';
    view.filter = 'all';
    view.grade = 'all';
    view.query = '';
    $('search').value = '';
    syncChips();
    renderAll();
    document.querySelector('.tracker-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
};

function renderProgress() {
  const total = data.trophies.length;
  const pct = Math.round((view.earned.size / total) * 100);
  $('ring').style.background = `conic-gradient(var(--cyan) ${pct * 3.6}deg, rgba(10,7,32,.55) ${pct * 3.6}deg)`;
  $('ringPct').textContent = `${pct}%`;
  $('progressLabel').textContent = `${view.earned.size} of ${total} earned`;
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of data.trophies) if (view.earned.has(t.id)) counts[t.grade] += 1;
  $('gradeCounts').textContent = `◆ ${counts.platinum}/1 · ● ${counts.gold}/2 · ● ${counts.silver}/6 · ● ${counts.bronze}/46`;
}

function renderStats() {
  const strip = $('statStrip');
  strip.replaceChildren(
    statCard('55', 'official PS5 trophies: 1 platinum, 2 gold, 6 silver, 46 bronze'),
    statCard('28', 'hidden on PlayStation until earned'),
    statCard('1 + 3', 'confirmed missable, plus three cautions', true),
    statCard('~200 h', 'to the platinum — community estimate, see Sources'),
    statCard('4 / 10', 'difficulty: a long list, not a hard one'),
    statCard('0', 'online trophies — every trophy is single-player'),
  );
}

function renderStageStrip() {
  const strip = $('stageStrip');
  strip.replaceChildren();
  for (const stage of data.roadmap) {
    const inStage = data.trophies.filter((t) => t.stage === stage.stage);
    const done = inStage.filter((t) => view.earned.has(t.id)).length;
    const chip = document.createElement('span');
    chip.className = 'stage-chip';
    chip.innerHTML = '';
    const b = document.createElement('b');
    b.textContent = `Stage ${stage.stage}`;
    chip.append(b, document.createTextNode(` ${stage.name.split(':')[0]} — ${done}/${inStage.length}`));
    strip.append(chip);
  }
}

function renderList() {
  const list = $('trophyList');
  list.replaceChildren();
  const visible = sortedTrophies(data.trophies.filter(matchesFilter));
  if (!visible.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No trophies match that filter. Loosen the search or pick another kind.';
    list.append(empty);
    return;
  }
  if (view.sort === 'roadmap') {
    let lastStage = null;
    for (const trophy of visible) {
      if (trophy.stage !== lastStage) {
        lastStage = trophy.stage;
        const stage = data.roadmap.find((s) => s.stage === lastStage);
        const head = document.createElement('h3');
        head.className = 'stage-head';
        head.textContent = `Stage ${stage.stage} — ${stage.name}`;
        list.append(head);
      }
      list.append(trophyRow(trophy, view, handlers));
    }
  } else {
    for (const trophy of visible) list.append(trophyRow(trophy, view, handlers));
  }
}

function renderDetail() {
  const panel = $('detailPanel');
  panel.replaceChildren(detailPanel(trophyById(view.selected) ?? data.trophies[0], view, handlers));
}

function renderRoadmap() {
  const wrap = $('roadmapList');
  wrap.replaceChildren();
  for (const stage of data.roadmap) {
    const inStage = data.trophies.filter((t) => t.stage === stage.stage).sort((a, b) => a.id - b.id);
    wrap.append(roadmapCard(stage, inStage, view, handlers));
  }
}

function renderMissables() {
  const wrap = $('missableList');
  wrap.replaceChildren();
  const flagged = data.trophies.filter((t) => t.missable);
  flagged.sort((a, b) => (a.missable === 'yes' ? 0 : 1) - (b.missable === 'yes' ? 0 : 1) || a.id - b.id);
  for (const trophy of flagged) wrap.append(missableCard(trophy, view, handlers));
}

function renderSources() {
  const wrap = $('sourceList');
  wrap.replaceChildren();
  for (const source of data.sources) wrap.append(sourceItem(source));
  $('ratesNote').textContent = data.ratesNote;
}

function renderTabs() {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.view === view.tab);
  });
  for (const name of ['tracker', 'roadmap', 'missables', 'sources']) {
    $(`view-${name}`).hidden = name !== view.tab;
  }
}

function renderAll() {
  renderProgress();
  renderStageStrip();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
  renderTabs();
}

function syncChips() {
  document.querySelectorAll('#kindChips .chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.filter === view.filter);
  });
}

function buildChips() {
  const wrap = $('kindChips');
  const defs = [
    ['all', 'All 55'],
    ...Object.entries(KIND_LABELS).map(([key, label]) => [key, label]),
    ['missable', '⚠ Missable & caution'],
    ['remaining', 'Remaining'],
    ['earned', 'Earned'],
  ];
  for (const [key, label] of defs) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (key === 'missable' ? ' danger' : '');
    chip.dataset.filter = key;
    chip.textContent = label;
    chip.addEventListener('click', () => {
      view.filter = key;
      syncChips();
      renderAll();
    });
    wrap.append(chip);
  }
  syncChips();
}

function applyUrlParams() {
  const params = new URLSearchParams(location.search);
  if (params.get('view')) view.tab = params.get('view');
  if (params.get('open')) view.selected = Number(params.get('open')) || view.selected;
  if (params.get('filter')) view.filter = params.get('filter');
  if (params.get('grade')) view.grade = params.get('grade');
  if (params.get('sort')) view.sort = params.get('sort');
  if (params.get('q')) { view.query = params.get('q'); $('search').value = view.query; }
  if (params.get('spoilers') === 'off') view.spoilers = false;
  if (params.get('spoilers') === 'on') view.spoilers = true;
  if (params.get('earned')) {
    view.earned = new Set(params.get('earned').split(',').map(Number).filter(Boolean));
    saveEarned();
  }
  $('spoilerToggle').checked = view.spoilers;
  $('gradeFilter').value = view.grade;
  $('sortBy').value = view.sort;
}

function wireControls() {
  $('search').addEventListener('input', (e) => { view.query = e.target.value; renderAll(); });
  $('gradeFilter').addEventListener('change', (e) => { view.grade = e.target.value; renderAll(); });
  $('sortBy').addEventListener('change', (e) => { view.sort = e.target.value; renderAll(); });
  $('spoilerToggle').addEventListener('change', (e) => { view.spoilers = e.target.checked; saveSpoilers(); renderAll(); });
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => { view.tab = tab.dataset.view; renderAll(); });
  });
  $('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ app: 'vice-got-a-price', version: 1, earned: [...view.earned] }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vice-got-a-price-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const raw = Array.isArray(parsed) ? parsed : parsed.earned ?? [];
      const ids = new Set();
      for (const item of raw) {
        if (typeof item === 'number' && trophyById(item)) ids.add(item);
        if (typeof item === 'string') {
          const byName = data.trophies.find((t) => t.name === item);
          if (byName) ids.add(byName.id);
        }
      }
      view.earned = ids;
      saveEarned();
      renderAll();
    } catch {
      // A malformed file changes nothing; the tracker keeps its saved state.
    }
    e.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    view.earned = new Set();
    view.revealed = new Set();
    saveEarned();
    renderAll();
  });
}

async function boot() {
  const res = await fetch('data/trophies.json');
  data = await res.json();
  buildChips();
  wireControls();
  applyUrlParams();
  syncChips();
  renderStats();
  renderSources();
  renderAll();
}

boot();
