/* =============================================================
   Family timetable — app logic
   Plain JS, no framework. Loaded after config/timetable/clubs.
   ============================================================= */
(function () {
'use strict';

/* ---------- tiny helpers ---------- */
const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const pad = n => String(n).padStart(2, '0');
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const MINS = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const HHMM = m => pad(Math.floor(m / 60) % 24) + ':' + pad(((m % 60) + 60) % 60);
const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const humanMins = m => m >= 60 ? Math.floor(m / 60) + 'h ' + (m % 60) + 'm' : m + ' min';
const isoOf = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const DAY_MS = 86400000;

const DAY_START = MINS(CONFIG.dayStart);
const DAY_END   = MINS(CONFIG.dayEnd);

const ABBR = {
  'English':'Eng','Mathematics':'Maths','Science':'Sci','Biology':'Bio','Chemistry':'Chem',
  'Physics':'Phys','Computer Science':'CS','History':'Hist','Geography':'Geog',
  'Philosophy, Religion & Ethics':'PRE','Life Skills':'Life','Critical Thinking':'Crit',
  'French':'Fr','Spanish':'Sp','Art':'Art','Drama':'Drama','Music':'Music',
  'Textiles':'Tex','Food Technology':'Food','PE':'PE','Tutor Time':'Tutor'
};
const abbr = s => ABBR[s] || s;
const facOf = s => CONFIG.faculty[s] || 'other';
const facVar = s => 'var(--f-' + facOf(s) + ')';
const kitFor = s => CONFIG.kit[s] || null;
const roomKnown = r => r && !CONFIG.unknownRoom.includes(r);
const roomText = r => roomKnown(r) ? r : 'TBC';
const person = id => CONFIG.people.find(p => p.id === id);
const dayOf = date => ALL_DAYS.find(x => x.dow === date.getDay());
const isHome = w => !!w && w.trim().toLowerCase() === 'home';
const whereText = w => (isHome(w) ? 'At home' : (w || ''));

/* Ring numbers: minutes for anything short, whole hours for a long day
   at the stables, so it never reads "480 MIN". */
function ringText(left, label) {
  const hrs = left >= 90;
  const halves = Math.round(left / 30);
  const num = hrs ? Math.floor(halves / 2) + (halves % 2 ? '½' : '') + 'h' : String(Math.max(0, left));
  const unit = label === 'min left' ? (hrs ? 'left' : 'min') : (label || 'left');
  return { num, unit };
}

/* ---------- state ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('ft.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('ft.' + k, JSON.stringify(v)); } catch (e) {} }
};

const state = {
  tab: 'now',
  weekNudge: store.get('weekNudge', 0),
  theme: store.get('theme', 'auto'),
  profile: store.get('profile', null),
  gridWho: store.get('gridWho', 'tess'),
  cursor: { tess: null, finn: null },   // {dayId, week} or null = follow today
  checks: store.get('checks', {}),
  sim: null,
  sig: '',
  teacherQuery: ''
};

/* ---------- simulated time, for testing ----------
   ?day=thu&time=14:20  (and optionally &week=red)
   Deliberately not in the UI. -------------------------------- */
(function readSim() {
  const q = new URLSearchParams(location.search);
  const day = q.get('day'), time = q.get('time'), wk = q.get('week');
  if (!day && !time && !wk) return;
  state.sim = { day, time, week: wk };
})();

function now() {
  const real = new Date();
  if (!state.sim) return real;
  const d = new Date(real);
  if (state.sim.day) {
    // Monday-first, so ?day=sun means the Sunday at the end of this week.
    const target = ALL_DAYS.find(x => x.id === state.sim.day);
    const dow = target ? target.dow : d.getDay();
    d.setDate(d.getDate() + ((dow || 7) - (d.getDay() || 7)));
  }
  if (state.sim.time) { const [h, m] = state.sim.time.split(':').map(Number); d.setHours(h, m, 0, 0); }
  return d;
}

/* ---------- week maths ---------- */
function mondayOf(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
}
function weekFor(date) {
  if (state.sim && state.sim.week) return state.sim.week;
  const a = mondayOf(parseISO(CONFIG.weekAnchor.monday));
  const t = mondayOf(date);
  const weeks = Math.round((t - a) / (7 * DAY_MS));
  const parity = (((weeks + state.weekNudge) % 2) + 2) % 2;
  const base = CONFIG.weekAnchor.week;
  return parity === 0 ? base : (base === 'red' ? 'blue' : 'red');
}
const otherWeek = w => (w === 'red' ? 'blue' : 'red');
const weekName = w => (w === 'red' ? 'Week Red' : 'Week Blue');

function schoolDay(date) {
  const day = DAYS.find(d => d.dow === date.getDay());
  return day ? { date: new Date(date), day, week: weekFor(date) } : null;
}
function nextSchoolDay(from) {
  const d = new Date(from);
  for (let i = 0; i < 8; i++) {
    d.setDate(d.getDate() + 1);
    const s = schoolDay(d);
    if (s) return s;
  }
  return null;
}

/* ---------- lookups ---------- */
const lessonAt = (who, week, dayId, slotId) =>
  ((TIMETABLE[who] || {})[week] || {})[dayId] ? TIMETABLE[who][week][dayId][slotId] : null;

function lessonsOn(who, week, dayId) {
  return CONFIG.bells
    .filter(b => b.kind === 'lesson')
    .map(b => ({ bell: b, lesson: lessonAt(who, week, dayId, b.id) }))
    .filter(x => x.lesson);
}
function slotAt(mins) {
  return CONFIG.bells.find(b => mins >= MINS(b.start) && mins < MINS(b.end)) || null;
}
function eventsOn(who, week, dayId) {
  const match = e => {
    const whoOk = Array.isArray(e.who) ? e.who.includes(who) : e.who === who;
    return whoOk && e.day === dayId && (e.week === 'both' || !e.week || e.week === week);
  };
  return CLUBS.filter(match).map(e => Object.assign({ type: 'club' }, e))
    .concat(FIXTURES.filter(match).map(e => Object.assign({ type: 'fixture' }, e)))
    .sort((a, b) => MINS(a.start) - MINS(b.start));
}

/* Everything outside school on one day, for both children, in time
   order. Pass a week to drop the other week's red- or blue-only items. */
function activitiesOn(dayId, week) {
  const out = [];
  CLUBS.concat(FIXTURES).forEach(e => {
    if (e.day !== dayId) return;
    if (week && e.week && e.week !== 'both' && e.week !== week) return;
    (Array.isArray(e.who) ? e.who : [e.who]).forEach(w => {
      const p = person(w);
      if (p) out.push(Object.assign({}, e, { who: w, person: p.name }));
    });
  });
  return out.sort((a, b) => MINS(a.start) - MINS(b.start) || a.person.localeCompare(b.person));
}

/* The only logistics worth pointing out: two children at the same venue
   at once (one trip), or at two different venues at once (a clash).
   Anything at home needs nobody to drive, so it never counts. */
function logistics(items) {
  const notes = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      if (a.who === b.who || isHome(a.where) || isHome(b.where) || !a.where || !b.where) continue;
      const overlap = MINS(a.start) < MINS(b.end) && MINS(b.start) < MINS(a.end);
      if (!overlap) continue;
      if (a.where.trim().toLowerCase() === b.where.trim().toLowerCase()) {
        notes.push({ tone: 'good', text: a.end === b.end
          ? a.person + ' and ' + b.person + ' both finish at ' + a.where + ' at ' + a.end + ', so one collection.'
          : a.person + ' and ' + b.person + ' are both at ' + a.where + ' (' + a.person + ' until ' + a.end + ', ' + b.person + ' until ' + b.end + ').' });
      } else {
        notes.push({ tone: 'warn', text: 'Two places at once: ' + a.person + ' at ' + a.where + ' and ' + b.person + ' at ' + b.where + ', ' +
          (MINS(a.start) > MINS(b.start) ? a.start : b.start) + ' to ' + (MINS(a.end) < MINS(b.end) ? a.end : b.end) + '.' });
      }
    }
  }
  return notes;
}

function laterStatus(e, pill, mins) {
  const delta = MINS(e.start) - mins;
  return {
    kind: 'later', tone: 'off', pill,
    eyebrow: 'Later today', title: e.name,
    chips: [{ t: e.start + '–' + e.end, cls: 'room' }, e.where ? { t: whereText(e.where), cls: '' } : null].filter(Boolean),
    nextLabel: 'Starts in ' + humanMins(delta), nextWhen: e.start,
    progress: null,
    countdown: delta <= 120 ? delta : null, countdownLabel: 'to go'
  };
}

/* ---------- status ---------- */
function statusFor(who, date) {
  const mins = date.getHours() * 60 + date.getMinutes();
  const sd = schoolDay(date);
  const today = dayOf(date);
  const evs = eventsOn(who, weekFor(date), today.id);

  // Something outside school happening right now beats everything else.
  const ev = evs.find(e => mins >= MINS(e.start) && mins < MINS(e.end));
  if (ev) {
    const after = evs.find(e => MINS(e.start) >= MINS(ev.end));
    const home = isHome(ev.where);
    return {
      kind: 'club', tone: 'live', pill: 'Until ' + ev.end,
      eyebrow: ev.start + '–' + ev.end, title: ev.name,
      chips: [ev.where ? { t: whereText(ev.where), cls: home ? '' : 'room' } : null,
              ev.pickup === true ? { t: 'Needs collecting', cls: 'accent' } : null].filter(Boolean),
      nextLabel: after ? after.name : (home ? 'Nothing else today' : 'Home'),
      nextWhen: after ? after.start : (home ? '' : 'from ' + ev.end),
      progress: { from: MINS(ev.start), to: MINS(ev.end) }, countdownLabel: 'min left'
    };
  }
  const later = evs.filter(e => MINS(e.start) > mins);

  if (!sd) {
    if (later.length) return laterStatus(later[0], today.name, mins);
    const nx = nextSchoolDay(date);
    const first = nx ? lessonAt(who, nx.week, nx.day.id, 'p1') : null;
    return {
      kind: 'weekend', tone: 'off', pill: 'Weekend',
      eyebrow: nx ? nx.day.name + ' starts with' : 'No school',
      title: first ? first.subject : 'Nothing timetabled',
      chips: first ? chipsFor(first) : [],
      nextLabel: 'First bell', nextWhen: nx ? nx.day.short + ' 08:45' : '', progress: null
    };
  }

  if (mins < DAY_START) {
    const first = lessonAt(who, sd.week, sd.day.id, 'p1');
    return {
      kind: 'before', tone: 'off', pill: 'Not started',
      eyebrow: 'First up', title: first ? first.subject : 'School',
      chips: first ? chipsFor(first) : [],
      nextLabel: 'Bell at ' + CONFIG.dayStart, nextWhen: humanMins(DAY_START - mins) + ' from now',
      progress: null, countdown: DAY_START - mins, countdownLabel: 'to bell'
    };
  }

  if (mins >= DAY_END) {
    if (later.length) return laterStatus(later[0], 'School done', mins);
    const nx = nextSchoolDay(date);
    const first = nx ? lessonAt(who, nx.week, nx.day.id, 'p1') : null;
    const doneToday = evs.length ? 'Done for the day' : 'Finished at ' + CONFIG.dayEnd;
    return {
      kind: 'after', tone: 'off', pill: 'Day done',
      eyebrow: doneToday, title: 'Home',
      chips: [],
      nextLabel: nx ? (first ? first.subject : nx.day.name) : '—',
      nextWhen: nx ? nx.day.short + ' 08:45' : '', progress: null
    };
  }

  const slot = slotAt(mins);
  if (!slot) {
    return { kind: 'gap', tone: 'off', pill: 'At school', eyebrow: 'In between', title: 'Between lessons',
             chips: [], nextLabel: '—', nextWhen: '', progress: null };
  }

  const nextUp = upNext(who, sd, slot);
  const prog = { from: MINS(slot.start), to: MINS(slot.end) };

  if (slot.kind === 'break') {
    return {
      kind: 'break', tone: 'break', pill: slot.name,
      eyebrow: slot.name, title: slot.name === 'Lunch' ? 'Lunch' : 'Break',
      chips: [], nextLabel: nextUp.label, nextWhen: nextUp.when,
      progress: prog, countdown: prog.to - mins, countdownLabel: 'left'
    };
  }
  if (slot.kind === 'move') {
    return {
      kind: 'move', tone: 'off', pill: 'Moving',
      eyebrow: 'Between lessons', title: 'Walking to ' + (nextUp.room ? nextUp.room : 'the next room'),
      chips: [], nextLabel: nextUp.label, nextWhen: nextUp.when,
      progress: prog, countdown: prog.to - mins, countdownLabel: 'left'
    };
  }

  const lesson = lessonAt(who, sd.week, sd.day.id, slot.id);
  if (!lesson) {
    return { kind: 'free', tone: 'off', pill: 'Free', eyebrow: slot.name, title: 'Nothing timetabled',
             chips: [], nextLabel: nextUp.label, nextWhen: nextUp.when, progress: prog };
  }
  return {
    kind: 'lesson', tone: 'live', pill: 'In ' + slot.name.toLowerCase(),
    eyebrow: slot.name + ' · ' + slot.start + '–' + slot.end,
    title: lesson.subject, subject: lesson.subject,
    chips: chipsFor(lesson),
    nextLabel: nextUp.label, nextWhen: nextUp.when,
    progress: prog, countdown: prog.to - mins, countdownLabel: 'min left'
  };
}

function chipsFor(lesson) {
  const c = [{ t: roomText(lesson.room), cls: 'room' }];
  if (lesson.teacher) c.push({ t: lesson.teacher, cls: '' });
  return c;
}

function upNext(who, sd, slot) {
  const i = CONFIG.bells.indexOf(slot);
  for (let j = i + 1; j < CONFIG.bells.length; j++) {
    const b = CONFIG.bells[j];
    if (b.kind === 'move') continue;
    if (b.kind === 'break') return { label: b.name, when: b.start, room: null };
    const l = lessonAt(who, sd.week, sd.day.id, b.id);
    if (l) return { label: l.subject, when: b.start, room: roomKnown(l.room) ? l.room : null };
  }
  const ev = eventsOn(who, sd.week, sd.day.id).find(e => MINS(e.start) >= MINS(slot.end));
  if (ev) return { label: ev.name, when: ev.start, room: isHome(ev.where) ? null : ev.where };
  return { label: 'Home', when: CONFIG.dayEnd, room: null };
}

/* ---------- kit heads-ups ---------- */
function headsUps(date) {
  const out = [];
  const mins = date.getHours() * 60 + date.getMinutes();
  const morning = mins < DAY_START;
  const maxLead = Math.max.apply(null, Object.values(CONFIG.kit).map(k => k.lead || 1));

  for (let away = 0; away <= maxLead; away++) {
    const d = new Date(date); d.setDate(d.getDate() + away);
    const sd = schoolDay(d);
    if (!sd) continue;
    if (away === 0 && !morning) continue;

    CONFIG.people.forEach(p => {
      const seen = new Set();
      lessonsOn(p.id, sd.week, sd.day.id).forEach(({ bell, lesson }) => {
        const kit = kitFor(lesson.subject);
        if (!kit || (kit.lead || 1) < away) return;
        if (seen.has(lesson.subject)) return;
        seen.add(lesson.subject);
        if (away === 0 && MINS(bell.end) <= mins) return;
        out.push({
          who: p.id, name: p.name, subject: lesson.subject, kit,
          away, dayName: sd.day.name, week: sd.week,
          when: away === 0 ? 'today' : away === 1 ? 'tomorrow' : 'on ' + sd.day.name
        });
      });
    });
  }
  return out.sort((a, b) => (b.kit.critical ? 1 : 0) - (a.kit.critical ? 1 : 0) || a.away - b.away);
}

/* ---------- bag ---------- */
function bagTarget(date) {
  const mins = date.getHours() * 60 + date.getMinutes();
  const sd = schoolDay(date);
  if (sd && mins < MINS(CONFIG.bagFrom)) return sd;      // today, before mid-afternoon
  return nextSchoolDay(date);
}
function checkKey(sd, who, label) { return isoOf(sd.date) + '|' + who + '|' + label; }
function isChecked(k) { return !!state.checks[k]; }
function toggleCheck(k) {
  if (state.checks[k]) delete state.checks[k]; else state.checks[k] = 1;
  store.set('checks', state.checks);
}
function pruneChecks(date) {
  const cutoff = isoOf(new Date(date.getTime() - 3 * DAY_MS));
  let changed = false;
  Object.keys(state.checks).forEach(k => {
    if (k.split('|')[0] < cutoff) { delete state.checks[k]; changed = true; }
  });
  if (changed) store.set('checks', state.checks);
}

/* ---------- render: shell bits ---------- */
function setText(sel, txt) { const el = $(sel); if (el) el.textContent = txt; }

function renderTopbar(d) {
  const wk = weekFor(d);
  const badge = $('#weekBadge');
  if (badge) {
    badge.dataset.week = wk;
    badge.setAttribute('aria-label', weekName(wk) + '. Press and hold to correct if the school rota has shifted.');
  }
  setText('#weekBadgeText', weekName(wk));
  setText('#clockDate', d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }));
  const strip = $('#simStrip');
  if (strip) strip.hidden = !state.sim;
  if (state.sim) {
    setText('#simText', 'Simulated: ' +
      d.toLocaleDateString('en-GB', { weekday: 'long' }) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) +
      ', ' + weekName(weekFor(d)));
  }
}

function tickClock(d) {
  setText('#clockTime', pad(d.getHours()) + ':' + pad(d.getMinutes()));
}

/* ---------- render: the day spine ---------- */
function spineHTML(d) {
  const sd = schoolDay(d);
  const mins = d.getHours() * 60 + d.getMinutes();
  if (!sd) {
    const nx = nextSchoolDay(d);
    const today = dayOf(d);
    const items = activitiesOn(today.id, weekFor(d));
    const datestr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
    return '<div class="spine"><div class="spine-head"><span class="big">' + esc(today.name) + '</span>' +
      '<span class="meta">' + esc(datestr + ' · no school' + (nx ? ', back ' + nx.day.name + ' (' + weekName(nx.week) + ')' : '')) + '</span></div>' +
      (items.length ? planHTML(items, mins) : '<p class="spine-quiet">Nothing on today.</p>') +
      '</div>';
  }
  const slot = slotAt(mins);
  const segs = CONFIG.bells.map(b => {
    const s = MINS(b.start), e = MINS(b.end);
    const done = mins >= e ? 1 : 0;
    const isNow = slot && slot.id === b.id ? 1 : 0;
    return '<div class="spine-seg" style="flex:' + (e - s) + ' 1 0" data-kind="' + b.kind + '"' +
      ' data-done="' + done + '" data-now="' + isNow + '" title="' + esc(b.name + ' ' + b.start + '–' + b.end) + '">' +
      esc(b.short || '') + '</div>';
  }).join('');

  const pct = clamp((mins - DAY_START) / (DAY_END - DAY_START) * 100, 0, 100);
  const inDay = mins >= DAY_START && mins < DAY_END;
  const left = inDay ? '<div class="spine-now" id="spineNow" style="left:' + pct.toFixed(2) + '%"></div>' : '';

  let headline;
  if (mins < DAY_START) headline = 'School starts at ' + CONFIG.dayStart;
  else if (mins >= DAY_END) headline = 'School finished at ' + CONFIG.dayEnd;
  else headline = slot ? slot.name + ' · until ' + slot.end : 'At school';

  const datestr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  return '<div class="spine">' +
    '<div class="spine-head"><span class="big">' + esc(sd.day.name) + '</span>' +
    '<span class="meta">' + esc(datestr + ' · ' + headline) + '</span></div>' +
    '<div class="spine-bar">' + segs + left + '</div>' +
    '<div class="spine-scale"><span>' + CONFIG.dayStart + '</span><span>' + CONFIG.dayEnd + '</span></div>' +
    '</div>';
}

/* ---------- render: a day's activities ---------- */
function planHTML(items, mins, opts) {
  opts = opts || {};
  if (!items.length) return '';
  const rows = items.map(i => {
    let st = 'todo', tag = '';
    if (mins != null) {
      if (mins >= MINS(i.end)) { st = 'done'; tag = 'Done'; }
      else if (mins >= MINS(i.start)) { st = 'now'; tag = 'Now'; }
    }
    if (!tag && opts.weekTags && i.week && i.week !== 'both') tag = (i.week === 'red' ? 'Red' : 'Blue') + ' only';
    const meta = [i.person, whereText(i.where), i.pickup === true ? 'needs collecting' : null, i.note].filter(Boolean).join(' · ');
    return '<li class="plan-item" data-who="' + esc(i.who) + '" data-state="' + st + '">' +
      '<span class="plan-time"><b>' + esc(i.start) + '</b>' + esc(i.end) + '</span>' +
      '<span class="plan-dot" aria-hidden="true"></span>' +
      '<span class="plan-what"><span class="plan-name">' + esc(i.name) + '</span>' +
      '<span class="plan-meta">' + esc(meta) + '</span></span>' +
      (tag ? '<span class="plan-tag">' + esc(tag) + '</span>' : '') +
      '</li>';
  }).join('');
  const notes = opts.notes === false ? '' : logistics(items).map(n =>
    '<p class="plan-note" data-tone="' + n.tone + '">' + esc(n.text) + '</p>').join('');
  return '<ul class="plan">' + rows + '</ul>' + notes;
}

/* ---------- render: person card ---------- */
const RING_R = 32, RING_C = 2 * Math.PI * RING_R;

function personCardHTML(p, d) {
  const st = statusFor(p.id, d);
  const mins = d.getHours() * 60 + d.getMinutes();

  let ring = '';
  if (st.progress || st.countdown != null) {
    const total = st.progress ? st.progress.to - st.progress.from : st.countdown;
    const left = st.progress ? st.progress.to - mins : st.countdown;
    const frac = total > 0 ? clamp(1 - left / total, 0, 1) : 0;
    ring =
      '<div class="ring" data-who="' + p.id + '" role="img" aria-label="' + esc(humanMins(Math.max(0, left)) + ' ' + (st.countdownLabel === 'min left' ? 'left' : (st.countdownLabel || 'left'))) + '">' +
      '<svg viewBox="0 0 74 74" aria-hidden="true">' +
      '<circle class="track" cx="37" cy="37" r="' + RING_R + '"></circle>' +
      '<circle class="value" cx="37" cy="37" r="' + RING_R + '" stroke-dasharray="' + RING_C.toFixed(1) + '"' +
      ' stroke-dashoffset="' + (RING_C * (1 - frac)).toFixed(1) + '"></circle></svg>' +
      '<span class="ring-label"><span class="ring-num">' + esc(ringText(left, st.countdownLabel).num) + '</span>' +
      '<span class="ring-unit">' + esc(ringText(left, st.countdownLabel).unit) + '</span></span></div>';
  }

  const chips = (st.chips || []).map(c =>
    '<span class="chip ' + c.cls + '">' + esc(c.t) + '</span>').join('');

  return '<article class="card person" data-who="' + p.id + '">' +
    '<div class="person-top">' +
      '<span class="avatar" aria-hidden="true">' + esc(p.name[0]) + '</span>' +
      '<span class="person-who"><span class="person-name">' + esc(p.name) + '</span>' +
      '<span class="person-meta">Year ' + p.year + ' · ' + esc(p.form) + '</span></span>' +
      '<span class="statuspill" data-tone="' + st.tone + '">' +
        (st.tone === 'live' ? '<span class="beat" aria-hidden="true"></span>' : '') + esc(st.pill) + '</span>' +
    '</div>' +
    '<div class="person-body">' +
      '<div class="person-what">' +
        '<div class="person-eyebrow">' + esc(st.eyebrow) + '</div>' +
        '<h3 class="person-subject">' + esc(st.title) + '</h3>' +
        (chips ? '<div class="person-where">' + chips + '</div>' : '') +
      '</div>' + ring +
    '</div>' +
    '<div class="person-foot"><span class="lbl">Next</span>' +
      '<span class="next">' + esc(st.nextLabel) + '</span>' +
      '<span class="when">' + esc(st.nextWhen) + '</span></div>' +
    '</article>';
}

/* ---------- render: notices ---------- */
function noticesHTML(ups) {
  if (!ups || !ups.length) return '';
  return ups.slice(0, 4).map(u => {
    const tone = u.kit.critical ? 'alert' : (u.away <= 1 ? 'warn' : 'calm');
    return '<div class="notice" data-tone="' + tone + '">' +
      '<span class="ic" aria-hidden="true">' + u.kit.icon + '</span>' +
      '<span class="body"><strong>' + esc(u.name + ' has ' + u.subject + ' ' + u.when) + '</strong>' +
      '<span class="sub">' + esc(u.kit.label) + '</span></span>' +
      '<span class="tag">' + esc(u.dayName.slice(0, 3)) + '</span>' +
      '</div>';
  }).join('');
}

/* ---------- render: morning mode ---------- */
function morningHTML(d) {
  const mins = d.getHours() * 60 + d.getMinutes();
  const sd = schoolDay(d);
  if (!sd) return '';
  const left = DAY_START - mins;
  const until = humanMins(left);

  const firsts = CONFIG.people.map(p => {
    const l = lessonAt(p.id, sd.week, sd.day.id, 'p1');
    if (!l) return null;
    return esc(p.name) + ' starts with <b>' + esc(l.subject) + '</b>' +
      (roomKnown(l.room) ? ' in ' + esc(l.room) : '');
  }).filter(Boolean);

  const tonight = activitiesOn(sd.day.id, sd.week).filter(i => MINS(i.start) >= DAY_END);
  const tonightLine = tonight.length
    ? ' Tonight: ' + tonight.map(i => esc(i.person) + ' has ' + esc(i.name) + ' at ' + esc(i.start)).join(', ') + '.'
    : '';

  return '<section class="card card-pad morning">' +
    '<div class="person-eyebrow">' + esc(sd.day.name + ' morning · ' + weekName(sd.week)) + '</div>' +
    '<div class="morning-time">' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + '</div>' +
    '<p class="morning-lead"><b>' + until + '</b> until the first bell. ' + firsts.join('. ') + '.' + tonightLine + '</p>' +
    '</section>';
}

/* ---------- render: bag ---------- */
function bagHTML(d) {
  const sd = bagTarget(d);
  if (!sd) return '';
  const isToday = schoolDay(d) && isoOf(schoolDay(d).date) === isoOf(sd.date);
  const label = isToday ? 'today' : (isoOf(sd.date) === isoOf(new Date(d.getTime() + DAY_MS)) ? 'tomorrow' : sd.day.name);

  const cards = CONFIG.people.map(p => {
    const lessons = lessonsOn(p.id, sd.week, sd.day.id);
    const subs = [];
    const seen = new Set();
    lessons.forEach(({ lesson }) => {
      if (lesson.subject === 'Tutor Time' || seen.has(lesson.subject)) return;
      seen.add(lesson.subject);
      subs.push(lesson);
    });

    const kits = [];
    const kitSeen = new Set();
    subs.forEach(l => {
      const k = kitFor(l.subject);
      if (k && !kitSeen.has(l.subject)) { kitSeen.add(l.subject); kits.push({ subject: l.subject, kit: k }); }
    });

    const chips = subs.map(l =>
      '<span class="bag-sub" style="--fac:' + facVar(l.subject) + '">' +
      '<i class="fdot" aria-hidden="true"></i>' + esc(l.subject) +
      '<span class="chip room" style="padding:1px 6px;font-size:11px">' + esc(roomText(l.room)) + '</span></span>').join('');

    const items = kits.map(k => {
      const key = checkKey(sd, p.id, k.subject);
      const on = isChecked(key);
      return '<button class="checkitem" type="button" role="checkbox" aria-checked="' + on + '"' +
        ' data-check="' + esc(key) + '"' +
        (k.kit.critical ? ' data-critical="1"' : '') + '>' +
        '<span class="box" aria-hidden="true">✓</span>' +
        '<span class="txt"><span class="emoji" aria-hidden="true">' + k.kit.icon + '</span>' +
        esc(k.kit.label) + '<span class="sr"> for ' + esc(k.subject) + '</span></span>' +
        '</button>';
    }).join('');

    const evs = eventsOn(p.id, sd.week, sd.day.id);
    const evHTML = evs.length ? '<div class="clubcard" style="margin-top:10px">' + evs.map(e =>
      '<div><span class="n">' + esc(e.name) + '</span><span class="m">' +
      esc(e.start + '–' + e.end + (e.where ? ' · ' + whereText(e.where).toLowerCase() : '') + (e.pickup === true ? ' · needs collecting' : '')) +
      '</span></div>').join('') + '</div>' : '';

    return '<div class="card card-pad bag" data-who="' + p.id + '">' +
      '<div class="bag-head"><span class="avatar" style="width:24px;height:24px;font-size:13px;border-radius:8px" aria-hidden="true">' + esc(p.name[0]) + '</span>' +
      esc(p.name) + '<span class="count">' + subs.length + ' subject' + (subs.length === 1 ? '' : 's') + '</span></div>' +
      '<div class="bag-subjects">' + chips + '</div>' +
      (items || '<div class="empty" style="padding:12px 0;text-align:left">Nothing special to pack.</div>') +
      evHTML + '</div>';
  }).join('');

  return '<section><h2 class="sectionhead">Bag for ' + esc(label) + ' · ' + esc(sd.day.name + ', ' + weekName(sd.week)) + '</h2>' +
    '<div class="baggrid">' + cards + '</div></section>';
}

/* ---------- render: Now panel ---------- */
function renderNow(d) {
  const mins = d.getHours() * 60 + d.getMinutes();
  const isMorning = schoolDay(d) && mins >= MINS(CONFIG.morningFrom) && mins < MINS(CONFIG.morningTo);

  const parts = [];
  if (isMorning) parts.push(morningHTML(d));
  parts.push('<section class="card no-print">' + spineHTML(d) + '</section>');

  // Anything critical (the shopping) jumps the queue. Everything else
  // sits below the live cards, which are what you opened this for.
  const ups = headsUps(d);
  const urgent = noticesHTML(ups.filter(u => u.kit.critical));
  const rest   = noticesHTML(ups.filter(u => !u.kit.critical));
  if (urgent) parts.push('<section class="stack">' + urgent + '</section>');

  const anyOut = CONFIG.people.some(p => statusFor(p.id, d).kind === 'club');
  const heading = anyOut || (schoolDay(d) && mins >= DAY_START && mins < DAY_END) ? 'Right now'
    : !schoolDay(d) ? 'Coming up' : 'Where they are';
  parts.push('<section><h2 class="sectionhead">' + heading + '</h2><div class="people">' +
    CONFIG.people.map(p => personCardHTML(p, d)).join('') + '</div></section>');

  // Tonight, on school days, from mid-afternoon until the last thing ends.
  const sdNow = schoolDay(d);
  if (sdNow && mins >= MINS(CONFIG.bagFrom)) {
    const tonight = activitiesOn(sdNow.day.id, sdNow.week).filter(i => MINS(i.start) >= DAY_END);
    if (tonight.length && tonight.some(i => mins < MINS(i.end))) {
      parts.push('<section><h2 class="sectionhead">Tonight</h2><div class="card card-pad">' +
        planHTML(tonight, mins) + '</div></section>');
    }
  }

  if (rest) parts.push('<section><h2 class="sectionhead">Worth knowing</h2><div class="stack">' + rest + '</div></section>');

  parts.push(bagHTML(d));

  parts.push(
    '<section class="card card-pad no-print" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
    '<span style="font-size:13.5px;color:var(--ink-2)">Open this on your phone as</span>' +
    '<span class="seg" role="group" aria-label="Which tab to open on">' +
    ['now', 'tess', 'finn'].map(k =>
      '<button type="button" data-profile="' + k + '" aria-pressed="' + (state.profile === k || (!state.profile && k === 'now')) + '">' +
      (k === 'now' ? 'Everyone' : esc(person(k).name)) + '</button>').join('') +
    '</span></section>');

  $('#panel-now').innerHTML = parts.join('');

  const live = CONFIG.people.map(p => {
    const s = statusFor(p.id, d);
    return p.name + ': ' + s.title + (s.chips && s.chips.length ? ', ' + s.chips.map(c => c.t).join(', ') : '');
  }).join('. ');
  $('#liveRegion').textContent = live;
}

/* ---------- render: person panel ---------- */
function fortnightDays(d, who) {
  const thisWeek = weekFor(d);
  const out = [];
  [thisWeek, otherWeek(thisWeek)].forEach((w, wi) => {
    DAYS.forEach(day => out.push({ dayId: day.id, day, week: w, order: wi }));
    WEEKEND.forEach(day => {
      if (eventsOn(who, w, day.id).length) out.push({ dayId: day.id, day, week: w, order: wi, weekend: true });
    });
  });
  return out;
}

function renderPerson(who, d) {
  const p = person(who);
  const sd = schoolDay(d);
  const today = dayOf(d);
  const todayWeek = weekFor(d);
  let fallback;
  if (sd) fallback = { dayId: sd.day.id, week: sd.week };
  else if (eventsOn(who, todayWeek, today.id).length) fallback = { dayId: today.id, week: todayWeek };
  else { const nx = nextSchoolDay(d); fallback = nx ? { dayId: nx.day.id, week: nx.week } : { dayId: 'mon', week: todayWeek }; }
  const cur = state.cursor[who] || fallback;
  const list = fortnightDays(d, who);

  const picker = '<div class="daypick-wrap"><div class="daypick no-print" role="group" aria-label="Pick a day">' + list.map(x => {
    const isToday = today.id === x.dayId && todayWeek === x.week;
    const on = cur.dayId === x.dayId && cur.week === x.week;
    return '<button type="button" data-day="' + x.dayId + '" data-week="' + x.week + '" data-who="' + who + '"' +
      ' aria-pressed="' + on + '" data-today="' + (isToday ? 1 : 0) + '">' +
      '<span class="d">' + esc(x.day.short) + '</span>' +
      '<span class="w" data-week="' + x.week + '">' + (x.week === 'red' ? 'Red' : 'Blue') + '</span>' +
      '</button>';
  }).join('') + '</div></div>';

  const showingToday = cur.dayId === today.id && cur.week === todayWeek;
  const mins = d.getHours() * 60 + d.getMinutes();
  const slot = showingToday && sd ? slotAt(mins) : null;
  const isSchoolDay = DAYS.some(x => x.id === cur.dayId);

  const rows = (isSchoolDay ? CONFIG.bells : []).map(b => {
    const isNow = slot && slot.id === b.id;
    const isPast = showingToday && mins >= MINS(b.end);
    const state_ = isNow ? 'now' : (isPast ? 'past' : 'todo');

    let body;
    if (b.kind === 'lesson') {
      const l = lessonAt(who, cur.week, cur.dayId, b.id);
      if (!l) body = '<div class="interlude">Free</div>';
      else {
        const k = kitFor(l.subject);
        body = '<div class="lesson" style="--fac:' + facVar(l.subject) + '">' +
          (isNow ? '<div class="nowflag"><span class="beat" aria-hidden="true"></span>Now</div>' : '') +
          '<div class="lesson-top"><h3 class="lesson-name">' + esc(l.subject) + '</h3>' +
          '<span class="lesson-room">' + esc(roomText(l.room)) + '</span></div>' +
          '<div class="lesson-sub"><span>' + esc(l.teacher || '') + '</span>' +
          '<span class="code">' + esc(l.code || '') + '</span></div>' +
          (k ? '<div class="lesson-kit"><span class="emoji" aria-hidden="true">' + k.icon + '</span>' + esc(k.label) + '</div>' : '') +
          '</div>';
      }
    } else {
      body = '<div class="interlude">' + (b.kind === 'break' ? '☕ ' : '→ ') + esc(b.name) + '</div>';
    }

    return '<div class="tl-row" data-state="' + state_ + '">' +
      '<div class="tl-time"><b>' + esc(b.start) + '</b>' + esc(b.end) + '</div>' +
      '<div class="tl-rail"><span class="tl-node"></span></div>' +
      '<div class="tl-body">' + body + '</div></div>';
  });

  const evs = eventsOn(who, cur.week, cur.dayId);
  if (isSchoolDay && evs.length) {
    const outState = showingToday && mins >= DAY_END ? 'past' : 'todo';
    rows.push('<div class="tl-row" data-state="' + outState + '">' +
      '<div class="tl-time"><b>' + esc(CONFIG.dayEnd) + '</b></div>' +
      '<div class="tl-rail"><span class="tl-node"></span></div>' +
      '<div class="tl-body"><div class="interlude">School out</div></div></div>');
  }
  evs.forEach(e => {
    const isNow = showingToday && mins >= MINS(e.start) && mins < MINS(e.end);
    const isPast = showingToday && mins >= MINS(e.end);
    const meta = [whereText(e.where), e.pickup === true ? 'Needs collecting' : null, e.note].filter(Boolean).join(' · ');
    rows.push('<div class="tl-row" data-state="' + (isNow ? 'now' : isPast ? 'past' : 'todo') + '">' +
      '<div class="tl-time"><b>' + esc(e.start) + '</b>' + esc(e.end) + '</div>' +
      '<div class="tl-rail"><span class="tl-node"></span></div>' +
      '<div class="tl-body"><div class="clubcard">' +
      (isNow ? '<div class="nowflag"><span class="beat" aria-hidden="true"></span>Now</div>' : '') +
      '<div class="n">' + esc(e.name) + '</div>' +
      (meta ? '<div class="m">' + esc(meta) + '</div>' : '') + '</div></div></div>');
  });
  if (!rows.length) rows.push('<div class="empty">Nothing on.</div>');

  const dayName = (ALL_DAYS.find(x => x.id === cur.dayId) || DAYS[0]).name;

  $('#panel-' + who).innerHTML =
    '<section class="card card-pad" data-who="' + who + '" style="padding-bottom:10px">' +
      '<div class="rowbetween personhead" style="margin-bottom:10px">' +
        '<div class="grow"><h2 style="font-family:var(--serif);font-weight:600;font-size:22px;letter-spacing:-.02em;font-variation-settings:\'SOFT\' 40,\'WONK\' 1">' +
        esc(p.name) + '</h2>' +
        '<div style="font-size:13px;color:var(--ink-2)">Year ' + p.year + ' · form ' + esc(p.form) +
        ' · tutor ' + esc(p.tutor) + ' in ' + esc(p.tutorRoom) + '</div></div>' +
        '<span class="chip" data-week="' + cur.week + '" style="color:var(--week-' + cur.week + ')">' +
        esc(dayName + ', ' + weekName(cur.week)) + '</span>' +
      '</div>' + picker +
    '</section>' +
    '<section class="card card-pad" data-who="' + who + '" style="margin-top:14px">' +
      '<div class="timeline">' + rows.join('') + '</div>' +
    '</section>';
}

/* ---------- render: fortnight grid ---------- */
function gridTableHTML(who, week, d) {
  const sd = schoolDay(d);
  const mins = d.getHours() * 60 + d.getMinutes();
  const slot = sd ? slotAt(mins) : null;
  const isThisWeek = sd && sd.week === week;

  const head = '<tr><th class="rowhead" scope="col"><span class="sr">Period</span></th>' +
    DAYS.map(day => '<th scope="col" data-today="' + (isThisWeek && sd.day.id === day.id ? 1 : 0) + '">' +
      '<span class="fullday">' + esc(day.name) + '</span><span class="shortday">' + esc(day.short) + '</span></th>').join('') + '</tr>';

  const body = CONFIG.bells.filter(b => b.kind !== 'move').map(b => {
    if (b.kind === 'break') {
      return '<tr><th class="rowhead" scope="row"><small>' + esc(b.start) + '</small></th>' +
        '<td colspan="5" style="padding:4px 6px"><div class="interlude" style="justify-content:center">' +
        esc(b.name + ' · ' + b.start + '–' + b.end) + '</div></td></tr>';
    }
    return '<tr><th class="rowhead" scope="row">' + esc(b.short) + '<small>' + esc(b.start) + '</small></th>' +
      DAYS.map(day => {
        const l = lessonAt(who, week, day.id, b.id);
        const today = isThisWeek && sd.day.id === day.id;
        const isNow = today && slot && slot.id === b.id;
        if (!l) return '<td data-today="' + (today ? 1 : 0) + '"></td>';
        const k = kitFor(l.subject);
        return '<td data-today="' + (today ? 1 : 0) + '">' +
          '<div class="cell" style="--fac:' + facVar(l.subject) + '" data-now="' + (isNow ? 1 : 0) + '"' +
          (k ? ' data-kit="1" data-kiticon="' + k.icon + '"' : '') + '>' +
          '<span class="s"><span class="full">' + esc(l.subject) + '</span>' +
          '<span class="ab" title="' + esc(l.subject) + '">' + esc(abbr(l.subject)) + '</span></span>' +
          '<span class="r">' + esc(roomText(l.room)) + '</span>' +
          '<span class="t">' + esc(l.teacher || '') + '</span></div></td>';
      }).join('') + '</tr>';
  }).join('');

  return '<div class="card" style="overflow:hidden">' +
    '<div class="weekbanner" data-week="' + week + '">' + esc(weekName(week)) +
    (isThisWeek ? '<span class="this">This week</span>' : '') + '</div>' +
    '<div class="gridwrap"><table class="grid"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div></div>';
}

function teacherIndex() {
  const map = new Map();
  Object.keys(TIMETABLE).forEach(who => {
    ['red', 'blue'].forEach(w => {
      DAYS.forEach(day => {
        Object.keys(TIMETABLE[who][w][day.id] || {}).forEach(sid => {
          const l = TIMETABLE[who][w][day.id][sid];
          if (!l || !l.teacher) return;
          if (!map.has(l.teacher)) map.set(l.teacher, { name: l.teacher, subjects: new Set(), kids: new Set() });
          const t = map.get(l.teacher);
          t.subjects.add(l.subject);
          t.kids.add(person(who).name);
        });
      });
    });
  });
  const surname = n => n.split(' ').pop().toLowerCase();
  return Array.from(map.values()).sort((a, b) => surname(a.name).localeCompare(surname(b.name)));
}

function teacherListHTML() {
  const teachers = teacherIndex().filter(t => {
    if (!state.teacherQuery) return true;
    const q = state.teacherQuery;
    return t.name.toLowerCase().includes(q) ||
      Array.from(t.subjects).some(s => s.toLowerCase().includes(q));
  });

  const initials = n => n.replace(/^(Mr|Mrs|Ms|Miss|Dr)\s+/i, '').split(/[\s-]+/).map(x => x[0]).join('').slice(0, 2).toUpperCase();

  return teachers.length ? teachers.map(t => {
    const subs = Array.from(t.subjects).filter(s => s !== 'Tutor Time');
    const main = subs[0] || 'Tutor Time';
    return '<li class="teacher" style="--fac:' + facVar(main) + '">' +
      '<span class="init" aria-hidden="true">' + esc(initials(t.name)) + '</span>' +
      '<span><span class="nm">' + esc(t.name) + '</span>' +
      '<span class="sj">' + esc(Array.from(t.subjects).join(', ')) + ' · ' + esc(Array.from(t.kids).join(' and ')) + '</span></span></li>';
  }).join('') : '<li class="empty">Nobody by that name.</li>';
}

function outsideSchoolHTML(d) {
  const today = dayOf(d);
  const any = ALL_DAYS.some(x => activitiesOn(x.id).length);
  if (!any) {
    return '<section style="margin-top:22px"><h2 class="sectionhead">Outside school</h2>' +
      '<div class="card empty">No clubs yet. They go in <code>js/clubs.js</code>, one line each.</div></section>';
  }
  const rows = ALL_DAYS.map(x => {
    const items = activitiesOn(x.id);
    return '<div class="outday" data-today="' + (x.id === today.id ? 1 : 0) + '">' +
      '<div class="outday-name">' + esc(x.short) + '</div>' +
      '<div class="outday-body">' + (items.length ? planHTML(items, null, { weekTags: true }) : '<span class="quiet">Nothing on</span>') + '</div>' +
      '</div>';
  }).join('');
  return '<section style="margin-top:22px"><h2 class="sectionhead">Outside school</h2>' +
    '<div class="card card-pad"><div class="outweek">' + rows + '</div></div></section>';
}

function renderWeek(d) {
  const who = state.gridWho;
  const wk = weekFor(d);

  const legend = Object.keys(CONFIG.facultyLabel).filter(f => f !== 'other').map(f =>
    '<span><i style="background:var(--f-' + f + ')"></i>' + esc(CONFIG.facultyLabel[f]) + '</span>').join('');

  const bells = CONFIG.bells.filter(b => b.kind !== 'move').map(b => {
    const sd = schoolDay(d);
    const mins = d.getHours() * 60 + d.getMinutes();
    const isNow = sd && mins >= MINS(b.start) && mins < MINS(b.end);
    return '<div class="bell" data-kind="' + b.kind + '" data-now="' + (isNow ? 1 : 0) + '">' +
      '<div class="n">' + esc(b.name) + '</div><div class="t">' + esc(b.start + '–' + b.end) + '</div></div>';
  }).join('');

  $('#panel-week').innerHTML =
    '<section class="rowbetween no-print" style="margin-bottom:12px">' +
      '<span class="seg" role="group" aria-label="Whose timetable">' +
      CONFIG.people.map(p => '<button type="button" data-grid="' + p.id + '" aria-pressed="' + (who === p.id) + '">' +
        esc(p.name) + '</button>').join('') + '</span>' +
      '<span class="grow"></span>' +
      '<span class="legend">' + legend + '</span>' +
    '</section>' +
    '<div class="stack">' +
      gridTableHTML(who, wk, d) +
      gridTableHTML(who, otherWeek(wk), d) +
    '</div>' +
    outsideSchoolHTML(d) +
    '<section style="margin-top:22px"><h2 class="sectionhead">The bells</h2>' +
      '<div class="card card-pad"><div class="bells">' + bells + '</div></div></section>' +
    '<section style="margin-top:22px"><h2 class="sectionhead">Who teaches what</h2>' +
      '<div class="card card-pad">' +
      '<div class="searchbox no-print" style="margin-bottom:6px">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4.5-4.5" stroke-linecap="round"/></svg>' +
      '<input type="search" id="teacherSearch" placeholder="Search a name or subject" ' +
      'value="' + esc(state.teacherQuery) + '" aria-label="Search teachers"></div>' +
      '<ul id="teacherList">' + teacherListHTML() + '</ul></div></section>';
}

/* ---------- orchestration ---------- */
let frame = null;
function paint() {
  frame = null;
  const d = now();
  renderTopbar(d);
  tickClock(d);
  if (state.tab === 'now') renderNow(d);
  else if (state.tab === 'week') renderWeek(d);
  else renderPerson(state.tab, d);
}
function renderAll() {
  // Coalesce a burst of changes into one paint. A backgrounded tab never
  // fires rAF, so draw straight away there instead of leaving it blank.
  if (document.hidden) { if (frame) { cancelAnimationFrame(frame); frame = null; } paint(); return; }
  if (frame) cancelAnimationFrame(frame);
  frame = requestAnimationFrame(paint);
}

function signature(d) {
  const sd = schoolDay(d);
  const mins = d.getHours() * 60 + d.getMinutes();
  const slot = slotAt(mins);
  const who = CONFIG.people.map(p => { const st = statusFor(p.id, d); return st.kind + ':' + st.title; }).join(',');
  return [state.tab, isoOf(d), sd ? sd.week : '-', slot ? slot.id : (mins < DAY_START ? 'pre' : 'post'),
          state.gridWho, JSON.stringify(state.cursor), who].join('|');
}

function tick() {
  const d = now();
  const sig = signature(d);
  const typing = document.activeElement && document.activeElement.id === 'teacherSearch';
  if (sig !== state.sig && !typing) { state.sig = sig; renderAll(); return; }

  tickClock(d);

  const mins = d.getHours() * 60 + d.getMinutes();
  const marker = $('#spineNow');
  if (marker) marker.style.left = clamp((mins - DAY_START) / (DAY_END - DAY_START) * 100, 0, 100).toFixed(2) + '%';

  $$('.ring').forEach(r => {
    const who = r.dataset.who;
    const st = statusFor(who, d);
    if (!st.progress && st.countdown == null) return;
    const total = st.progress ? st.progress.to - st.progress.from : st.countdown;
    const left = st.progress ? st.progress.to - mins : st.countdown;
    const frac = total > 0 ? clamp(1 - left / total, 0, 1) : 0;
    const v = r.querySelector('.value');
    if (v) v.setAttribute('stroke-dashoffset', (RING_C * (1 - frac)).toFixed(1));
    const rt = ringText(left, st.countdownLabel);
    const n = r.querySelector('.ring-num');
    if (n) n.textContent = rt.num;
    const u = r.querySelector('.ring-unit');
    if (u) u.textContent = rt.unit;
  });
}

/* ---------- tabs ---------- */
const TABS = ['now', 'tess', 'finn', 'week'];

function setTab(tab, focus) {
  if (!TABS.includes(tab)) tab = 'now';
  state.tab = tab;
  if (location.hash.slice(1) !== tab) history.replaceState(null, '', '#' + tab);
  $$('.nav button').forEach(b => {
    const on = b.dataset.tab === tab;
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;   // roving focus, so Tab leaves the tablist
  });
  $$('.panel').forEach(p => { p.hidden = p.id !== 'panel-' + tab; });
  state.sig = '';
  renderAll();
  const panel = $('#panel-' + tab);
  if (focus && panel) panel.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'auto' });
}

/* ---------- theme ---------- */
function measureTopbar() {
  const t = $('.topbar');
  if (t) document.documentElement.style.setProperty('--topbarh', t.offsetHeight + 'px');
}

function applyTheme() {
  if (state.theme === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', state.theme);
  const b = $('#themeBtn');
  if (b) b.setAttribute('aria-label', 'Colour scheme: ' + state.theme + '. Tap to change.');
}

/* ---------- events ---------- */
function wire() {
  $$('.nav button').forEach(b => {
    b.addEventListener('click', () => setTab(b.dataset.tab));
    b.addEventListener('keydown', e => {
      const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
      if (!keys.includes(e.key)) return;
      e.preventDefault();
      const all = $$('.nav button');
      const i = all.indexOf(b);
      const n = e.key === 'ArrowRight' ? (i + 1) % all.length
              : e.key === 'ArrowLeft'  ? (i - 1 + all.length) % all.length
              : e.key === 'Home' ? 0 : all.length - 1;
      all[n].focus(); setTab(all[n].dataset.tab, true);
    });
  });

  // Week badge: tap explains, long press (or shift-click) nudges the rota.
  const badge = $('#weekBadge');
  let pressTimer = null, longFired = false;
  const nudge = () => {
    state.weekNudge = (state.weekNudge + 1) % 2;
    store.set('weekNudge', state.weekNudge);
    state.sig = '';
    renderAll();
    toast('Rota nudged by one week. Now showing ' + weekName(weekFor(now())) + '.');
  };
  if (badge) {
    badge.addEventListener('pointerdown', () => {
      longFired = false;
      pressTimer = setTimeout(() => { longFired = true; nudge(); }, 550);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev =>
      badge.addEventListener(ev, () => clearTimeout(pressTimer)));
    badge.addEventListener('click', e => {
      if (longFired) { longFired = false; return; }
      if (e.shiftKey) { nudge(); return; }
      toast(weekName(weekFor(now())) + '. Wrong after a half-term? Press and hold to shift it by one.');
    });
    // keyboard equivalent of the long press
    badge.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); nudge(); }
    });
  }

  const themeBtn = $('#themeBtn');
  if (themeBtn) themeBtn.addEventListener('click', () => {
    state.theme = state.theme === 'auto' ? 'light' : state.theme === 'light' ? 'dark' : 'auto';
    store.set('theme', state.theme);
    applyTheme();
    toast('Colour scheme: ' + state.theme);
  });

  document.addEventListener('click', e => {
    const day = e.target.closest('[data-day]');
    if (day) {
      state.cursor[day.dataset.who] = { dayId: day.dataset.day, week: day.dataset.week };
      state.sig = ''; renderAll(); return;
    }
    const grid = e.target.closest('[data-grid]');
    if (grid) {
      state.gridWho = grid.dataset.grid; store.set('gridWho', state.gridWho);
      state.sig = ''; renderAll(); return;
    }
    const chk = e.target.closest('[data-check]');
    if (chk) {
      toggleCheck(chk.dataset.check);
      const on = isChecked(chk.dataset.check);
      chk.setAttribute('aria-checked', String(on));
      return;
    }
    const prof = e.target.closest('[data-profile]');
    if (prof) {
      state.profile = prof.dataset.profile;
      store.set('profile', state.profile);
      $$('[data-profile]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.profile === state.profile)));
      toast(state.profile === 'now' ? 'This will open on the family view.' : 'This will open on ' + person(state.profile).name + "'s day.");
    }
  });

  document.addEventListener('input', e => {
    if (e.target.id !== 'teacherSearch') return;
    state.teacherQuery = e.target.value.trim().toLowerCase();
    const list = $('#teacherList');
    if (list) list.innerHTML = teacherListHTML();
  });

  document.addEventListener('visibilitychange', () => { if (!document.hidden) { state.sig = ''; tick(); } });
}

let toastTimer = null;
function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 3600);
}

/* ---------- go ---------- */
function boot() {
  const stamp = $('#buildStamp');
  if (stamp) stamp.textContent = 'v' + CONFIG.version + ' · rota anchored to ' +
    parseISO(CONFIG.weekAnchor.monday).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' (' + weekName(CONFIG.weekAnchor.week).toLowerCase() + ')';
  applyTheme();
  measureTopbar();
  addEventListener('resize', measureTopbar, { passive: true });
  pruneChecks(now());
  wire();
  const fromHash = location.hash.slice(1);
  const start = TABS.includes(fromHash) ? fromHash
    : (state.profile && state.profile !== 'now' ? state.profile : 'now');
  setTab(start);
  addEventListener('hashchange', () => {
    const t = location.hash.slice(1);
    if (TABS.includes(t) && t !== state.tab) setTab(t);
  });
  tick();
  setInterval(tick, 1000);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})();
