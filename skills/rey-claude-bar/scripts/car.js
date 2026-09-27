'use strict';
const wheels = ['o', 'O'];
function car(width, now) {
  const tick = Math.floor(now / 1000);
  const wheel = wheels[tick % wheels.length];
  const rows = ['    ______', ' __/|_||_\\___', `|__(${wheel})___(${wheel})_>`];
  const size = Math.max(...rows.map(line => line.length));
  const padding = ' '.repeat(tick % (Math.max(0, width - size) + 1));
  return rows.map(line => (padding + line).slice(0, Math.max(0, width)));
}
module.exports = {car};
