/* =============================================================
   CONFIG
   The bits you change. Everything else is worked out from here.
   ============================================================= */

const CONFIG = {

  appName: 'Timetable',
  version: '1.0.0',

  /* ---------------------------------------------------------
     WHICH WEEK IS IT?
     Set `monday` to the Monday of any week you know the colour
     of, and `week` to that colour. The app counts forwards and
     backwards from there.

     A two-week rota pauses over holidays, so this drifts by one
     after most half-terms. Two ways to deal with that: reset the
     line below when you upload a new term's timetable, or long-
     press the week badge in the app to nudge it by one (that
     correction is remembered on that device only).
     --------------------------------------------------------- */
  weekAnchor: { monday: '2026-09-07', week: 'blue' },

  /* Bell times. `kind` decides how a slot is drawn.
     lesson = a taught period · move = corridor time
     break  = break or lunch  · Times are 24h, local. */
  bells: [
    { id: 'p1',    name: 'Period 1',   short: '1',  start: '08:45', end: '09:45', kind: 'lesson' },
    { id: 'm1',    name: 'Moving',     short: '',   start: '09:45', end: '09:50', kind: 'move'   },
    { id: 'p2',    name: 'Period 2',   short: '2',  start: '09:50', end: '10:50', kind: 'lesson' },
    { id: 'tu',    name: 'Tutor',      short: 'Tu', start: '10:50', end: '11:10', kind: 'lesson' },
    { id: 'brk',   name: 'Break',      short: '',   start: '11:10', end: '11:35', kind: 'break'  },
    { id: 'p3',    name: 'Period 3',   short: '3',  start: '11:35', end: '12:35', kind: 'lesson' },
    { id: 'm2',    name: 'Moving',     short: '',   start: '12:35', end: '12:40', kind: 'move'   },
    { id: 'p4',    name: 'Period 4',   short: '4',  start: '12:40', end: '13:40', kind: 'lesson' },
    { id: 'lunch', name: 'Lunch',      short: '',   start: '13:40', end: '14:40', kind: 'break'  },
    { id: 'p5',    name: 'Period 5',   short: '5',  start: '14:40', end: '15:40', kind: 'lesson' }
  ],

  dayStart: '08:45',
  dayEnd:   '15:40',

  /* When the morning view takes over the home screen. */
  morningFrom: '06:00',
  morningTo:   '08:45',

  /* When tomorrow's bag becomes the thing you care about. */
  bagFrom: '15:00',

  people: [
    { id: 'tess', name: 'Tess', year: 9, form: 'A03', tutor: 'Mr M Dongray', tutorRoom: 'S9' },
    { id: 'finn', name: 'Finn', year: 7, form: 'A12', tutor: 'Mrs N Gregory', tutorRoom: 'A1' }
  ],

  /* Which faculty a subject belongs to. Drives the colour spine
     on lesson cards and the grouping in the teacher directory.
     A subject missing from here falls back to 'other'. */
  faculty: {
    'English': 'english',
    'Mathematics': 'maths',
    'Science': 'science',
    'Biology': 'science',
    'Chemistry': 'science',
    'Physics': 'science',
    'Computer Science': 'computing',
    'History': 'humanities',
    'Geography': 'humanities',
    'Philosophy, Religion & Ethics': 'humanities',
    'Life Skills': 'humanities',
    'Critical Thinking': 'humanities',
    'French': 'languages',
    'Spanish': 'languages',
    'Art': 'arts',
    'Drama': 'arts',
    'Music': 'arts',
    'Textiles': 'arts',
    'Food Technology': 'arts',
    'PE': 'pe',
    'Tutor Time': 'tutor'
  },

  facultyLabel: {
    english: 'English',
    maths: 'Maths',
    science: 'Science',
    computing: 'Computing',
    humanities: 'Humanities',
    languages: 'Languages',
    arts: 'Arts and tech',
    pe: 'PE',
    tutor: 'Tutor',
    other: 'Other'
  },

  /* KIT
     What a subject needs you to pack, and how many days' warning
     you want. `lead: 2` on Food Technology means it shows up on
     Wednesday for a Friday lesson, which is when the shopping
     actually has to happen. `critical` gets it louder styling.

     Add a subject here and the heads-up appears everywhere by
     itself: the home screen, the morning view, the bag list. */
  kit: {
    'PE':               { icon: '👟', label: 'PE kit and trainers',              lead: 1 },
    'Food Technology':  { icon: '🍳', label: 'Ingredients, apron, a container',  lead: 2, critical: true },
    'Textiles':         { icon: '🧵', label: 'Fabric and sewing kit',            lead: 1 },
    'Art':              { icon: '🎨', label: 'Sketchbook and pencils',           lead: 1 }
    // Off by default because they would fire most weeks without
    // telling you anything. Uncomment if they turn out to matter.
    // 'Music':         { icon: '🎵', label: 'Instrument',                       lead: 1 },
    // 'Drama':         { icon: '🎭', label: 'Something you can move in',        lead: 1 }
  },

  /* Rooms the school sheet leaves blank. Shown as "TBC". */
  unknownRoom: ['UNKNOWN', 'TBC', '', null, undefined]
};

const DAYS = [
  { id: 'mon', name: 'Monday',    short: 'Mon', dow: 1 },
  { id: 'tue', name: 'Tuesday',   short: 'Tue', dow: 2 },
  { id: 'wed', name: 'Wednesday', short: 'Wed', dow: 3 },
  { id: 'thu', name: 'Thursday',  short: 'Thu', dow: 4 },
  { id: 'fri', name: 'Friday',    short: 'Fri', dow: 5 }
];
