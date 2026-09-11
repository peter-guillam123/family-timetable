/* =============================================================
   CLUBS AND EVERYTHING ELSE AFTER 15:40

   One line per club. Delete the examples, add the real ones.

     who    'tess' | 'finn' | ['tess','finn']
     day    'mon' 'tue' 'wed' 'thu' 'fri' (or 'sat' / 'sun')
     week   'both' | 'red' | 'blue'
     start  '15:45'   end '16:45'
     name   what it is
     where  where it is. Write 'Home' for anything at the house:
            it shows as "At home" and never counts as a trip.
     pickup true if somebody has to go and get them. Leave it out
            if unsure: the app says nothing rather than guessing.
     kit    optional string, appears in the bag list
     note   optional, appears on the card

   Clubs live in this file rather than in the app so that all
   four of us see the same thing. Nothing is stored per phone.

   If two children are at the same venue at the same time the app
   says "one collection"; at two different venues at once it flags
   the clash. Weekend days show up in a child's day picker only if
   they have something on.
   ============================================================= */

const CLUBS = [

  { who: 'tess', day: 'mon', week: 'both', start: '17:00', end: '18:30', name: 'GCSE drama',    where: 'Gable Hall' },
  { who: 'finn', day: 'mon', week: 'both', start: '18:00', end: '18:30', name: 'LAMDA lesson',  where: 'Gable Hall' },
  { who: 'tess', day: 'wed', week: 'both', start: '18:00', end: '18:30', name: 'LAMDA lesson',  where: 'Gable Hall' },
  { who: 'tess', day: 'fri', week: 'both', start: '17:00', end: '18:30', name: 'Gobstoppers',   where: 'Gable Hall' },
  { who: 'finn', day: 'fri', week: 'both', start: '18:10', end: '18:40', name: 'Guitar lesson', where: 'Home' },
  { who: 'finn', day: 'sat', week: 'both', start: '10:00', end: '12:00', name: 'Gobstoppers',   where: 'Gable Hall' },
  { who: 'tess', day: 'sun', week: 'both', start: '08:00', end: '16:00', name: 'Stable work',   where: "Kim's Equestrian" },

  // Shape, for adding more:
  // { who: 'finn', day: 'thu', week: 'red', start: '15:45', end: '16:30',
  //   name: 'Chess club', where: 'H3', pickup: true, kit: 'Chess set' },

];

/* Other fixed things in the week that are not lessons and not
   clubs: music lessons, orthodontist, the bus that only runs on
   Fridays. Same shape, drawn a bit quieter. */
const FIXTURES = [

  // { who: 'tess', day: 'wed', week: 'both', start: '13:00', end: '13:30',
  //   name: 'Cello lesson', where: 'MU2', note: 'Comes out of lunch' },

];
