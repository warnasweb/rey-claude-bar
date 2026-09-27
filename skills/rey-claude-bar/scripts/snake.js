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
  const length=2+Math.round((pct??0)/100*(columns-5));
  // Shift the complete motif so the body stays together, even at the edges.
  const travel=columns-length-2;
  const tick=limited?0:Math.floor(now/1000)%(travel*2);
  const offset=tick<=travel?tick:travel*2-tick;
  const cells=Array(columns).fill('·');
  cells[offset]='🐍';
  for(let i=1;i<length;i++) cells[offset+i]='🟢';
  cells[offset+length+1]='🍎';
  const line='[ '+cells.join('')+' ]';
  const label=limited?'LIMIT REACHED':`ctx ${pct===null?'?':Math.round(pct)+'%'} used`;
  const cellsWidth=cells.reduce((sum,c)=>sum+(c==='·'?1:2),0)+4;
  return [line+(cellsWidth+3+label.length<=width?' | '+label:'')];
}
module.exports={snakeBoard};
