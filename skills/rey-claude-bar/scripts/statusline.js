#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {snakeBoard} = require('./snake');
const {chopper} = require('./chopper');
const {car} = require('./car');
const defaults = require('../config/default.json');
const numeric = n => typeof n === 'number' && Number.isFinite(n) && n >= 0;
const clean = s => typeof s === 'string' ? s.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '').replace(/[\x00-\x1f\x7f-\x9f]/g, '').slice(0, 300) : '';
function config(file = path.join(__dirname, '../config/user.json')) {
  try { return validate(JSON.parse(fs.readFileSync(file, 'utf8'))); } catch { return {...defaults}; }
}
function validate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Configuration must be an object');
  for (const [k,v] of Object.entries(input)) {
    if (!(k in defaults)) throw Error(`Unknown option: ${k}`);
    if (k === 'variant' ? !['classic','snake','chopper','car'].includes(v) : k === 'theme' ? !['default','dracula','mono'].includes(v) : k === 'width' ? !Number.isInteger(v) || v < 20 || v > 500 : typeof v !== 'boolean') throw Error(`Invalid value for ${k}`);
  }
  return {...defaults, ...input};
}
function git(dir) {
  try {
    const result = execFileSync('git', ['--no-optional-locks','-C',dir,'status','--porcelain=v1','--branch','--untracked-files=normal'], {encoding:'utf8',timeout:180,maxBuffer:128*1024,stdio:['ignore','pipe','ignore']});
    const [head,...files] = result.trimEnd().split('\n');
    return `git ${clean(head.replace(/^## /,'').replace(/\.\.\./,' → '))} ${files.length ? `dirty:${files.length}` : 'clean'}`;
  } catch { return ''; }
}
// Transcript format is best-effort, not a stable public activity API. Never show prompts/tool arguments.
function activity(file, session) {
  let fd;
  try {
    fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK);
    const st = fs.fstatSync(fd);
    if (!st.isFile() || Date.now()-st.mtimeMs > 120000) return '';
    const size = Math.min(st.size,65536), buffer = Buffer.alloc(size);
    fs.readSync(fd,buffer,0,size,st.size-size);
    const lines = buffer.toString('utf8').split('\n');
    if (st.size > size) lines.shift();
    const pending = new Map(); let last = ''; let todos = '';
    for (const line of lines) {
      let row; try { row = JSON.parse(line); } catch { continue; }
      if (row.sessionId && session && row.sessionId !== session) continue;
      const content = row.message?.content;
      if (!Array.isArray(content)) continue;
      for (const item of content) {
        if (item.type === 'tool_use' && typeof item.id === 'string') {
          pending.set(item.id,clean(item.name));
          if (item.name === 'TodoWrite' && Array.isArray(item.input?.todos)) {
            const ts = item.input.todos; todos = `tasks ${ts.filter(t=>t.status==='completed').length}/${ts.length}`;
          }
        }
        if (item.type === 'tool_result') {
          const name = pending.get(item.tool_use_id);
          if (name) { last = `${item.is_error ? 'failed' : 'done'} ${name}`; pending.delete(item.tool_use_id); }
        }
      }
    }
    return [pending.size ? `observed pending: ${[...pending.values()].slice(-2).join(', ')}` : last,todos].filter(Boolean).join(' | ');
  } catch { return ''; } finally { if (fd !== undefined) fs.closeSync(fd); }
}
function render(data, cfg = defaults, env = process.env) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) data = {};
  const dir = data.workspace?.current_dir || data.cwd;
  const top = [], bottom = [];
  if (typeof dir === 'string') top.push(clean(path.basename(dir) || dir));
  if (cfg.model) top.push(clean(data.model?.display_name || data.model?.id) || 'model ?');
  if (cfg.context) {
    const c = data.context_window; let p = c?.used_percentage;
    if (!numeric(p) && c?.current_usage && numeric(c.context_window_size) && c.context_window_size > 0) {
      const u = c.current_usage;
      const values = [u.input_tokens,u.cache_creation_input_tokens,u.cache_read_input_tokens];
      if (values.every(numeric)) p = values.reduce((a,b)=>a+b,0)/c.context_window_size*100;
    }
    const n = numeric(p) ? Math.min(100,Math.round(p)) : null;
    top.push(n === null ? 'ctx ?' : `ctx [${'#'.repeat(Math.round(n/10))}${'-'.repeat(10-Math.round(n/10))}] ${n}%`);
  }
  if (cfg.usage) for (const [key,label] of [['five_hour','5h'],['seven_day','week']]) {
    const w = data.rate_limits?.[key];
    if (numeric(w?.used_percentage) && (!numeric(w.resets_at) || w.resets_at*1000>Date.now())) top.push(`${label} ${Math.round(w.used_percentage)}%`);
  }
  if (cfg.cost && numeric(data.cost?.total_cost_usd)) top.push(`~$${data.cost.total_cost_usd.toFixed(2)}`);
  if (cfg.git && typeof dir === 'string') bottom.push(git(dir));
  if (cfg.session) {
    const name = clean(data.session_name) || clean(data.session_id).slice(0,8);
    if (name) bottom.push(`session ${name}`);
    if (numeric(data.cost?.total_duration_ms)) bottom.push(`${Math.floor(data.cost.total_duration_ms/60000)}m`);
  }
  if (cfg.status) {
    if (data.vim?.mode) bottom.push(clean(data.vim.mode));
    if (data.agent?.name) bottom.push(`agent ${clean(data.agent.name)}`);
    if (data.effort?.level) bottom.push(`effort ${clean(data.effort.level)}`);
    if (data.fast_mode === true) bottom.push('fast');
    if (numeric(data.pr?.number)) bottom.push(`PR #${data.pr.number} ${clean(data.pr.review_state)}`.trim());
  }
  if (cfg.activity && typeof data.transcript_path === 'string') bottom.push(activity(data.transcript_path,data.session_id));
  const width = Math.min(cfg.width, Number(env.COLUMNS)>0 ? Math.max(1,Number(env.COLUMNS)-2) : cfg.width);
  // Conservative width: non-ASCII code points consume two columns; combining marks consume zero.
  const truncate = line => { let out='', used=0; for (const ch of line) { const w=/\p{Mark}/u.test(ch)?0:ch.codePointAt(0)>127?2:1; if(used+w>width-1) return out+'…'; out+=ch; used+=w; } return out; };
  const lines = [top,bottom].map(xs=>truncate(xs.filter(Boolean).join(' | '))).filter(Boolean);
  const color = cfg.theme !== 'mono' && env.NO_COLOR === undefined;
  if (cfg.variant === 'snake') {
    const board = snakeBoard(data, Math.floor(width), Date.now(), cfg);
    lines.push(...board);
  }
  if (cfg.variant === 'chopper') lines.push(...chopper(Math.floor(width), Date.now()));
  if (cfg.variant === 'car') lines.push(...car(Math.floor(width), Date.now()));
  return lines.map(line=>color ? `\x1b[${cfg.variant==='car'?'34':cfg.variant==='chopper'?'31':cfg.variant==='snake'?'32':cfg.theme==='dracula'?'95':'36'}m${line}\x1b[0m` : line).join('\n') || 'rey-claude-bar';
}
if (require.main === module) {
  let raw = '', oversized = false;
  const timer = setTimeout(()=>{process.stdout.write('rey-claude-bar | input unavailable\n');process.exit(0);},1000);
  process.stdin.setEncoding('utf8');
  process.stdin.on('data',part=>{if(raw.length+part.length>1024*1024) oversized=true; else if(!oversized) raw+=part;});
  process.stdin.on('end',()=>{clearTimeout(timer);try { if(oversized) throw Error(); console.log(render(JSON.parse(raw),config())); } catch { console.log('rey-claude-bar | data unavailable'); }});
  process.stdin.on('error',()=>{clearTimeout(timer);console.log('rey-claude-bar | input unavailable');});
}
module.exports = {render,config,validate,activity,git,clean};
