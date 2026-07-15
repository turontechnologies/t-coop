// Tracks whether a branded intro has already played this browser session. A
// plain module variable resets on every full page load/reload but survives
// client-side navigation — exactly the "was this a reload?" signal we need
// so a cold load or refresh always gets the full animated intro, while
// navigating around the app afterward doesn't replay it on every screen.
let introShown = false;

export function markAppIntroShown() {
  introShown = true;
}

export function hasAppIntroShown() {
  return introShown;
}
