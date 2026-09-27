'use strict';
// ASCII art supplied by the user. Rotor frames share a fixed shaft position.
const rotors = ['   -----|-----', '      --|--   ', '        |     ', '      --|--   '];
function chopper(width, now) {
  const tick=Math.floor(now/1000);
  const frame=tick%rotors.length;
  // Keep the whole drawing on screen, then wrap to the left edge.
  const travel=Math.max(0,width-rotors[0].length);
  const padding=' '.repeat(tick%(travel+1));
  return [rotors[frame], '*>=====[_]L)', "      -'-`-"].map(line=>(padding+line).slice(0,Math.max(0,width)));
}
module.exports={chopper};
