// render.js — every DOM builder for the companion. Pure presentation: each function
// takes data plus a small view-state object and returns elements; app.js owns the state.

export const KIND_LABELS = {
  story: 'Story',
  strangers: 'Strangers',
  robbery: 'Robbery',
  partner: 'Partner',
  activities: 'Activities',
  collectibles: 'Collectibles',
  feats: 'Feats',
  economy: 'Money & grind',
  completion: 'Completion',
};

export const EFFORT_LABELS = {
  quick: 'Quick',
  moderate: 'Moderate',
  long: 'Long grind',
  marathon: 'Marathon',
};

export function rarityLabel(rate) {
  if (rate >= 50) return 'Common';
  if (rate >= 20) return 'Uncommon';
  if (rate >= 5) return 'Rare';
  if (rate >= 1) return 'Very rare';
  return 'Ultra rare';
}

export function isMasked(trophy, view) {
  return view.spoilers && trophy.hidden && !view.earned.has(trophy.id) && !view.revealed.has(trophy.id);
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function gradeBadge(trophy) {
  return el('span', `badge ${trophy.grade}`, trophy.grade);
}

function tag(text, cls = 'tag') {
  return el('span', cls, text);
}

export function metaTags(trophy, view) {
  const wrap = el('div', 'meta');
  wrap.append(gradeBadge(trophy));
  wrap.append(tag(KIND_LABELS[trophy.kind] ?? trophy.kind));
  wrap.append(tag(`${trophy.rate}% · ${rarityLabel(trophy.rate)}`, 'tag rate'));
  if (trophy.count) wrap.append(tag(`Count: ${trophy.count.toLocaleString('en-US')}`));
  if (trophy.hidden) wrap.append(tag('Hidden'));
  if (trophy.missable === 'yes') wrap.append(tag('⚠ Missable', 'tag miss'));
  if (trophy.missable === 'caution') wrap.append(tag('⚠ Caution', 'tag caution'));
  if (view.earned.has(trophy.id)) wrap.append(tag('✓ Earned', 'tag done'));
  return wrap;
}

export function trophyRow(trophy, view, handlers) {
  const masked = isMasked(trophy, view);
  const row = el('button', 'row' + (view.earned.has(trophy.id) ? ' earned' : '') + (view.selected === trophy.id ? ' selected' : ''));
  row.type = 'button';
  row.dataset.id = String(trophy.id);

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = view.earned.has(trophy.id);
  box.setAttribute('aria-label', `Mark ${trophy.name} earned`);
  box.addEventListener('click', (ev) => ev.stopPropagation());
  box.addEventListener('change', () => handlers.toggleEarned(trophy.id));
  row.append(box);

  const body = el('div');
  body.append(el('div', 'name', masked ? 'Hidden trophy' : trophy.name));
  body.append(el('div', 'desc', masked ? 'Name and description stay hidden until you earn it — or lift the spoiler shield.' : trophy.description));
  body.append(metaTags(trophy, view));
  row.append(body);

  const side = el('div', 'side', `Stage ${trophy.stage}\n${EFFORT_LABELS[trophy.effort]}`);
  side.style.whiteSpace = 'pre-line';
  row.append(side);

  row.addEventListener('click', () => handlers.select(trophy.id));
  return row;
}

export function detailPanel(trophy, view, handlers) {
  const panel = el('div');
  const masked = isMasked(trophy, view);
  panel.append(gradeBadge(trophy));
  if (masked) {
    panel.append(el('h2', '', 'Hidden trophy'));
    panel.append(el('p', 'masked-note', 'This trophy is hidden on PlayStation and the spoiler shield is on, so its name, description and guide stay covered until you earn it. Earned it already? Tick it and the cover lifts. Peeking is allowed too — the shield is yours, not ours.'));
    const reveal = el('button', 'reveal-btn', 'Reveal anyway');
    reveal.type = 'button';
    reveal.addEventListener('click', () => handlers.reveal(trophy.id));
    panel.append(reveal);
  } else {
    panel.append(el('h2', '', trophy.name));
    panel.append(el('p', 'official', `“${trophy.description}”`));
    panel.append(el('div', 'meta-line',
      `${KIND_LABELS[trophy.kind] ?? trophy.kind} · Roadmap stage ${trophy.stage} · ${EFFORT_LABELS[trophy.effort]}` +
      (trophy.count ? ` · Tracked count: ${trophy.count.toLocaleString('en-US')}` : '') +
      (trophy.hidden ? ' · Hidden on PSN' : '')));
    panel.append(el('div', 'meta-line', `Earn rate ${trophy.rate}% of tracked players — ${rarityLabel(trophy.rate).toLowerCase()} (Exophase launch snapshot, 19 Nov 2026).`));

    if (trophy.missable === 'yes') {
      const box = el('div', 'miss-box');
      box.append(el('b', '', '⚠ MISSABLE — '));
      box.append(document.createTextNode('this one can be lost for the whole playthrough. Read the guide before you finish Chapter 1.'));
      panel.append(box);
    }
    if (trophy.missable === 'caution') {
      const box = el('div', 'miss-box caution-box');
      box.append(el('b', '', '⚠ CAUTION — '));
      box.append(document.createTextNode('method unconfirmed or one-chance, and this game has no mission replay. Keep a manual save before you attempt it.'));
      panel.append(box);
    }

    panel.append(el('h3', '', 'Guide'));
    panel.append(el('p', '', trophy.guide));
    if (trophy.steps?.length) {
      panel.append(el('h3', '', 'Steps'));
      const list = el('ol');
      for (const step of trophy.steps) list.append(el('li', '', step));
      panel.append(list);
    }
    const src = el('p', 'sources');
    src.append(el('b', '', 'Sources: '));
    src.append(document.createTextNode(trophy.sources));
    panel.append(src);
  }

  const earn = el('button', 'earn-btn' + (view.earned.has(trophy.id) ? ' is-earned' : ''),
    view.earned.has(trophy.id) ? '✓ Earned — tap to undo' : 'Mark as earned');
  earn.type = 'button';
  earn.addEventListener('click', () => handlers.toggleEarned(trophy.id));
  panel.append(earn);
  return panel;
}

export function roadmapCard(stage, trophies, view, handlers) {
  const card = el('article', 'stage-card');
  const title = el('h3');
  title.append(el('span', 'n', `STAGE ${stage.stage} — `));
  title.append(document.createTextNode(stage.name));
  card.append(title);
  card.append(el('p', '', stage.summary));
  if (stage.tips?.length) {
    const list = el('ul');
    for (const tip of stage.tips) list.append(el('li', '', tip));
    card.append(list);
  }
  const chips = el('div', 'chips-row');
  for (const trophy of trophies) {
    const chip = el('button', 'mini-chip' + (view.earned.has(trophy.id) ? ' done' : ''),
      `${trophy.name} · ${trophy.grade}`);
    chip.type = 'button';
    chip.addEventListener('click', () => handlers.jumpTo(trophy.id));
    chips.append(chip);
  }
  card.append(chips);
  return card;
}

export function missableCard(trophy, view, handlers) {
  const card = el('article', 'stage-card');
  card.style.borderLeftColor = trophy.missable === 'yes' ? 'var(--danger)' : 'var(--sun)';
  const title = el('h3');
  title.append(document.createTextNode(trophy.missable === 'yes' ? '⚠ MISSABLE — ' : '⚠ CAUTION — '));
  title.append(document.createTextNode(trophy.name));
  card.append(title);
  card.append(el('p', '', trophy.guide));
  const src = el('p', 'sources');
  src.append(el('b', '', 'Sources: '));
  src.append(document.createTextNode(trophy.sources));
  card.append(src);
  const open = el('button', 'mini-chip', 'Open in the tracker');
  open.type = 'button';
  open.addEventListener('click', () => handlers.jumpTo(trophy.id));
  card.append(open);
  return card;
}

export function sourceItem(source) {
  const item = el('article', 'source-item');
  if (source.url) {
    const link = el('a', '', source.name);
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const bold = el('b');
    bold.append(link);
    item.append(bold);
  } else {
    item.append(el('b', '', source.name));
  }
  item.append(el('p', '', source.note));
  return item;
}

export function statCard(value, label, hot = false) {
  const card = el('div', 'stat' + (hot ? ' hot' : ''));
  card.append(el('b', '', value));
  card.append(el('span', '', label));
  return card;
}
