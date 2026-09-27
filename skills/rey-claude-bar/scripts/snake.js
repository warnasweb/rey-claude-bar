'use strict';
const number = n => typeof n === 'number' && Number.isFinite(n) && n >= 0;
// A closed serpentine route ensures the decorative snake never crosses itself.
function route(width) {
  const cells=[];
  for(let x=0;x<width;x++) cells.push([x,0]);
  for(let x=width-1;x>0;x--) cells.push([x,1]);
  for(let x=1;x<width;x++) cells.push([x,2]);
  for(let x=width-1;x>=0;x--) cells.push([x,3]);
  cells.push([0,2],[0,1]);
  return cells;
}
function snakeBoard(data, width, now, cfg) {
  if(width<20) return ['SNAKE'.slice(0,Math.max(0,width))];
  const columns=Math.min(48,width-2), track=route(columns);
  let pct=data.context_window?.used_percentage;
  const c=data.context_window, u=c?.current_usage;
  if(!number(pct) && u && number(c.context_window_size) && c.context_window_size>0) {
    const counts=[u.input_tokens,u.cache_creation_input_tokens,u.cache_read_input_tokens];
    if(counts.every(number)) pct=counts.reduce((a,b)=>a+b,0)/c.context_window_size*100;
  }
  if(!cfg.context || !number(pct)) pct=null;
  else pct=Math.min(100,pct);
  const limited=cfg.usage && ['five_hour','seven_day'].some(key=>{
    const w=data.rate_limits?.[key];
    return number(w?.used_percentage) && w.used_percentage>=100 && (!number(w.resets_at)||w.resets_at*1000>now);
  });
  const length=4+Math.round((pct??0)/100*(track.length-7));
  // Clock-based frames need no state files, background process, or session history.
  const head=limited?0:Math.floor(now/1000)%track.length;
  const grid=Array.from({length:4},()=>Array(columns).fill(' '));
  const food=track[(head+3)%track.length];grid[food[1]][food[0]]='*';
  for(let i=length-1;i>=0;i--) {const [x,y]=track[(head-i+track.length)%track.length];grid[y][x]='#';}
  const [x,y]=track[head], [nx,ny]=track[(head+1)%track.length];
  grid[y][x]=limited?'X':nx>x?'>':nx<x?'<':ny>y?'v':'^';
  const label=limited?'SNAKE | LIMIT REACHED':`SNAKE | ctx ${pct===null?'?':Math.round(pct)+'%'} used`;
  const border='+'+'-'.repeat(columns)+'+';
  return [label.slice(0,width),border,...grid.map(row=>'|'+row.join('')+'|'),border];
}
module.exports={snakeBoard,route};
