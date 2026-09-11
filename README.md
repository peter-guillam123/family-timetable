# Family timetable

A small private page for two school timetables on a fortnightly Red/Blue rota.
Plain HTML, CSS and JavaScript. No build step, no dependencies, no npm.

Open `index.html` in a browser, or serve the folder and add it to a phone home screen.

## The files you will actually edit

| File | What is in it |
|---|---|
| `js/timetable.js` | Both timetables. Replace this each term. |
| `js/clubs.js` | Clubs, lessons and anything else outside school, weekends included. One line each. |
| `js/config.js` | The week anchor, bell times, kit rules, who's who. |

## Each new term

1. Replace `js/timetable.js` from the new paper sheets.
2. Set `CONFIG.weekAnchor` in `js/config.js` to the Monday of the first week and its colour.
3. Bump `CACHE` in `sw.js` (e.g. `timetable-v1` to `timetable-v2`) so phones pick the new version up.

## Mid-term drift

The Red/Blue rota pauses over half-term, so it can slip by one week.
Press and hold the week badge in the top right to shift it by one. That is stored per device.

## Testing another time

Add a query string. The controls are deliberately not in the interface.

    index.html?day=fri&time=13:45
    index.html?day=wed&time=08:10&week=red

`day` is `mon` to `fri` (or `sat`/`sun`), `time` is 24 hour, `week` is `red` or `blue`.

## Publishing

Built for GitHub Pages. `.nojekyll` is already there. The page sends `noindex`,
and the school name is not in the source. Teachers' names are, on purpose.
