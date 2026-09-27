'use strict';
// ASCII art supplied by the user. Rotor frames share a fixed shaft position.
const rotors = ['   -----|-----', '      --|--   ', '        |     ', '      --|--   '];
function chopper(width, now) {
  const frame=Math.floor(now/1000)%rotors.length;
  return [rotors[frame], '*>=====[_]L)', "      -'-`-"].map(line=>line.slice(0,Math.max(0,width)));
}
module.exports={chopper};
