'use strict';
const number = n => typeof n === 'number' && Number.isFinite(n) && n >= 0;
function snakeBoard(data, width, now, cfg) {
  if(width<20) return ['SNAKE'.slice(0,Math.max(0,width))];
  // Reserve two terminal columns per cell, including emoji.
  const columns=Math.min(24,Math.floor((width-4)/2));
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
  // Move right one cell per second, wrapping to the left after the final cell.
  const offset=limited?0:Math.floor(now/1000)%columns;
  const line='[ '+' '.repeat(offset)+'🐍'+'·'.repeat(columns-offset-1)+' ]';
  const label=limited?'LIMIT REACHED':`ctx ${pct===null?'?':Math.round(pct)+'%'} used`;
  const cellsWidth=columns+5;
  return [line+(cellsWidth+3+label.length<=width?' | '+label:'')];
}
module.exports={snakeBoard};
