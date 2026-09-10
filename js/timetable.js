/* =============================================================
   THE TIMETABLE
   Replace this file each term. Nothing else needs to change
   except CONFIG.weekAnchor in config.js.

   L(subject, code, room, teacher) — in the same order the paper
   sheet prints them, so you can transcribe straight down a column.
   Use 'TBC' where the sheet says UNKNOWN.
   ============================================================= */

const L = (subject, code, room, teacher) => ({ subject, code, room, teacher });

const TIMETABLE = {

  /* -----------------------------------------------------------
     TESS — Year 9, form A03
     Transcribed from the school sheet dated 03/09/2026.
     ----------------------------------------------------------- */
  tess: {
    red: {
      mon: {
        p1: L('English',          '96/En', 'T8',  'Mr C Wood'),
        p2: L('History',          '96/Hi', 'H8',  'Mr H Bradbury'),
        tu: L('Tutor Time',       'WA03',  'S9',  'Mr M Dongray'),
        p3: L('Chemistry',        '96/Ch', 'S5',  'Mrs R Bull'),
        p4: L('Computer Science', '96/Cc', 'IT2', 'Mrs N Sinha'),
        p5: L('Mathematics',      '9Y/Ma1','M4',  'Mrs C Tobin')
      },
      tue: {
        p1: L('Mathematics',      '9Y/Ma1','M4',  'Mrs C Tobin'),
        p2: L('Physics',          '96/Ph', 'S10', 'Mr F Milne'),
        tu: L('Tutor Time',       'WA03',  'S9',  'Mr M Dongray'),
        p3: L('English',          '96/En', 'T8',  'Mr C Wood'),
        p4: L('French',           '96/Fr', 'H2',  'Mrs C Ashcroft'),
        p5: L('PE',               '9Y/Pe4','TBC', 'Mrs T Craig')
      },
      wed: {
        p1: L('Philosophy, Religion & Ethics', '96/Pr', 'H14', 'Mr R Romano'),
        p2: L('Spanish',          '96/Sp', 'L2',  'Mr S Bailey'),
        tu: L('Tutor Time',       'WA03',  'S9',  'Mr M Dongray'),
        p3: L('Music',            '96/Mu', 'MU1', 'Ms E Canavan'),
        p4: L('Drama',            '96/Dr', 'D1',  'Mrs N Jochum'),
        p5: L('Geography',        '96/Ge', 'H15', 'Miss E Evans')
      },
      thu: {
        p1: L('Spanish',          '96/Sp', 'H11', 'Mr S Bailey'),
        p2: L('Art',              '96/Ar', 'A1',  'Mrs N Gregory'),
        tu: L('Tutor Time',       'WA03',  'S9',  'Mr M Dongray'),
        p3: L('French',           '96/Fr', 'L4',  'Mrs C Ashcroft'),
        p4: L('Chemistry',        '96/Ch', 'S5',  'Mrs R Bull'),
        p5: L('PE',               '9Y/Pe4','TBC', 'Mrs C Fleming')
      },
      fri: {
        p1: L('Mathematics',      '9Y/Ma1','M4',  'Mrs C Tobin'),
        p2: L('Biology',          '96/Bi', 'S8',  'Miss C Penberthy'),
        tu: L('Tutor Time',       'WA03',  'S9',  'Mr M Dongray'),
        p3: L('English',          '96/En', 'LIB', 'Mr C Wood'),
        p4: L('Food Technology',  '9H/Tf', 'T5',  'Mrs L Barr'),
        p5: L('Food Technology',  '9H/Tf', 'T5',  'Mrs L Barr')
      }
    },
    blue: {
      mon: {
        p1: L('English',          '96/En', 'T8',  'Mr C Wood'),
        p2: L('Mathematics',      '9Y/Ma1','M4',  'Mrs C Tobin'),
        tu: L('Tutor Time',       'WA03',  'S9',  'Mr M Dongray'),
        p3: L('Spanish',          '96/Sp', 'L4',  'Mr S Bailey'),
        p4: L('Physics',          '96/Ph', 'S10', 'Mr F Milne'),
        p5: L('Geography',        '96/Ge', 'H15', 'Miss E Evans')
      },
      tue: {
        p1: L('History',          '96/Hi', 'H15', 'Mr H Bradbury'),
        p2: L('Mathematics',      '9Y/Ma1','M4',  'Mrs C Tobin'),
        tu: L('Tutor Time',       'WA03',  'S9',  'Mr M Dongray'),
        p3: L('PE',               '9Y/Pe4','TBC', 'Mrs T Craig'),
        p4: L('English',          '96/En', 'T8',  'Mr C Wood'),
        p5: L('French',           '96/Fr', 'L3',  'Mrs C Ashcroft')
      },
      wed: {
        p1: L('Art',              '96/Ar', 'A1',  'Mrs N Gregory'),
        p2: L('English',          '96/En', 'T8',  'Mr C Wood'),
        tu: L('Tutor Time',       'WA03',  'S9',  'Mr M Dongray'),
        p3: L('Biology',          '96/Bi', 'S8',  'Miss C Penberthy'),
        p4: L('Life Skills',      '96/LS', 'M1',  'Mrs L Andrews'),
        p5: L('History',          '96/Hi', 'H10', 'Mr H Bradbury')
      },
      thu: {
        p1: L('Music',            '96/Mu', 'MU1', 'Ms E Canavan'),
        p2: L('Mathematics',      '9Y/Ma1','M4',  'Mrs C Tobin'),
        tu: L('Tutor Time',       'WA03',  'S9',  'Mr M Dongray'),
        p3: L('Spanish',          '96/Sp', 'L2',  'Mr S Bailey'),
        p4: L('Drama',            '96/Dr', 'D2',  'Mrs N Jochum'),
        p5: L('French',           '96/Fr', 'L1',  'Mrs C Ashcroft')
      },
      fri: {
        p1: L('PE',               '9Y/Pe4','TBC', 'Mrs C Fleming'),
        p2: L('Chemistry',        '96/Ch', 'S5',  'Mrs R Bull'),
        tu: L('Tutor Time',       'WA03',  'S9',  'Mr M Dongray'),
        p3: L('Physics',          '96/Ph', 'S10', 'Mr F Milne'),
        p4: L('Geography',        '96/Ge', 'H15', 'Miss E Evans'),
        p5: L('Computer Science', '96/Cc', 'IT2', 'Mrs N Sinha')
      }
    }
  },

  /* -----------------------------------------------------------
     FINN — Year 7, form A12
     Checked against the school sheet dated 02/09/2026.
     ----------------------------------------------------------- */
  finn: {
    red: {
      mon: {
        p1: L('English',          '72/En', 'H1',        'Mr E Champion'),
        p2: L('Science',          '72/Sc', 'S3',        'Mrs H Savage'),
        tu: L('Tutor Time',       'WA12',  'A1',        'Mrs N Gregory'),
        p3: L('Computer Science', '72/Cc', 'IT2',       'Mrs N Sinha'),
        p4: L('PE',               '7X/Pe2','TBC'      , 'Mr N Spittle'),
        p5: L('Mathematics',      '72/Ma', 'M1',        'Mr G Compton')
      },
      tue: {
        p1: L('History',          '72/Hi', 'H8',        'Dr H Southwood'),
        p2: L('Life Skills',      '72/LS', 'H14',       'Mrs K Chafer'),
        tu: L('Tutor Time',       'WA12',  'A1',        'Mrs N Gregory'),
        p3: L('Geography',        '72/Ge', 'H11',       'Ms L Georghiades'),
        p4: L('Science',          '72/Sc', 'S8',        'Mrs N Leaper-Martin'),
        p5: L('Music',            '72/Mu', 'MU1',       'Ms E Canavan')
      },
      wed: {
        p1: L('Geography',        '72/Ge', 'H11',       'Ms L Georghiades'),
        p2: L('French',           '72/Fr', 'L3',        'Ms K Simcox'),
        tu: L('Tutor Time',       'WA12',  'A1',        'Mrs N Gregory'),
        p3: L('History',          '72/Hi', 'H8',        'Dr H Southwood'),
        p4: L('English',          '72/En', 'LIB',       'Mr E Champion'),
        p5: L('Spanish',          '72/Sp', 'L2',        'Miss C Occhionigro')
      },
      thu: {
        p1: L('PE',               '7X/Pe2','TBC'      , 'Mr G Agius'),
        p2: L('Drama',            '72/Dr', 'D1',        'Mr E Rousseau'),
        tu: L('Tutor Time',       'WA12',  'A1',        'Mrs N Gregory'),
        p3: L('Science',          '72/Sc', 'S4',        'Mrs H Savage'),
        p4: L('English',          '72/En', 'H1',        'Mr E Champion'),
        p5: L('Mathematics',      '72/Ma', 'M1',        'Mr G Compton')
      },
      fri: {
        p1: L('Philosophy, Religion & Ethics', '72/Pr', 'H15', 'Mr A Alcock'),
        p2: L('Textiles',         '7C/Tx', 'T4',        'Mrs L Barr'),
        tu: L('Tutor Time',       'WA12',  'A1',        'Mrs N Gregory'),
        p3: L('Textiles',         '7C/Tx', 'T4',        'Mrs L Barr'),
        p4: L('Mathematics',      '72/Ma', 'M4',        'Mrs C Tobin'),
        p5: L('Art',              '72/Ar', 'A1',        'Mrs N Gregory')
      }
    },
    blue: {
      mon: {
        p1: L('Computer Science', '72/Cc', 'IT2',       'Mrs N Sinha'),
        p2: L('Critical Thinking','72/CT', 'H3',        'Mr S Hayes'),
        tu: L('Tutor Time',       'WA12',  'A1',        'Mrs N Gregory'),
        p3: L('English',          '72/En', 'H1',        'Mr E Champion'),
        p4: L('Geography',        '72/Ge', 'H3',        'Ms L Georghiades'),
        p5: L('PE',               '7X/Pe2','TBC'      , 'Mr N Spittle')
      },
      tue: {
        p1: L('Life Skills',      '72/LS', 'H14',       'Mrs K Chafer'),
        p2: L('French',           '72/Fr', 'L1',        'Ms K Simcox'),
        tu: L('Tutor Time',       'WA12',  'A1',        'Mrs N Gregory'),
        p3: L('Art',              '72/Ar', 'A1',        'Mrs N Gregory'),
        p4: L('Science',          '72/Sc', 'S8',        'Mrs N Leaper-Martin'),
        p5: L('Mathematics',      '72/Ma', 'M4',        'Mrs C Tobin')
      },
      wed: {
        p1: L('History',          '72/Hi', 'H7',        'Dr H Southwood'),
        p2: L('English',          '72/En', 'H1',        'Mr E Champion'),
        tu: L('Tutor Time',       'WA12',  'A1',        'Mrs N Gregory'),
        p3: L('Spanish',          '72/Sp', 'L2',        'Miss C Occhionigro'),
        p4: L('Drama',            '72/Dr', 'D1',        'Mr E Rousseau'),
        p5: L('Mathematics',      '72/Ma', 'M4',        'Mrs C Tobin')
      },
      thu: {
        p1: L('PE',               '7X/Pe2','TBC'      , 'Mr G Agius'),
        p2: L('Science',          '72/Sc', 'S8',        'Mrs H Savage'),
        tu: L('Tutor Time',       'WA12',  'A1',        'Mrs N Gregory'),
        p3: L('French',           '72/Fr', 'L4',        'Ms K Simcox'),
        p4: L('Philosophy, Religion & Ethics', '72/Pr', 'H14', 'Mr A Alcock'),
        p5: L('Science',          '72/Sc', 'S8',        'Mrs H Savage')
      },
      fri: {
        p1: L('English',          '72/En', 'H1',        'Mr E Champion'),
        p2: L('Mathematics',      '72/Ma', 'M4',        'Mrs C Tobin'),
        tu: L('Tutor Time',       'WA12',  'A1',        'Mrs N Gregory'),
        p3: L('Spanish',          '72/Sp', 'L2',        'Miss C Occhionigro'),
        p4: L('Art',              '72/Ar', 'A1',        'Mrs N Gregory'),
        p5: L('Music',            '72/Mu', 'MU1',       'Ms E Canavan')
      }
    }
  }
};
