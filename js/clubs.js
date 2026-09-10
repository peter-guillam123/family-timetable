/* =============================================================
   CLUBS AND EVERYTHING ELSE AFTER 15:40

   One line per club. Delete the examples, add the real ones.

     who    'tess' | 'finn' | ['tess','finn']
     day    'mon' 'tue' 'wed' 'thu' 'fri' (or 'sat' / 'sun')
     week   'both' | 'red' | 'blue'
     start  '15:45'   end '16:45'
     name   what it is
     where  where it is
     pickup true if somebody has to go and get them
     kit    optional string, appears in the bag list
     note   optional, appears on the card

   Clubs live in this file rather than in the app so that all
   four of us see the same thing. Nothing is stored per phone.
   ============================================================= */

const CLUBS = [

  // { who: 'tess', day: 'tue', week: 'both', start: '15:45', end: '16:45',
  //   name: 'Netball', where: 'Sports hall', pickup: true, kit: 'Netball kit' },

  // { who: 'finn', day: 'thu', week: 'red', start: '15:45', end: '16:30',
  //   name: 'Chess club', where: 'H3' },

];

/* Other fixed things in the week that are not lessons and not
   clubs: music lessons, orthodontist, the bus that only runs on
   Fridays. Same shape, drawn a bit quieter. */
const FIXTURES = [

  // { who: 'tess', day: 'wed', week: 'both', start: '13:00', end: '13:30',
  //   name: 'Cello lesson', where: 'MU2', note: 'Comes out of lunch' },

];
