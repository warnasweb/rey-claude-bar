const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync,spawnSync} = require('node:child_process');
const {render,validate,activity,git} = require('../skills/rey-claude-bar/scripts/statusline');
const manage = path.resolve('skills/rey-claude-bar/scripts/manage.js');
const renderer = path.resolve('skills/rey-claude-bar/scripts/statusline.js');
const cfg = validate({theme:'mono',width:500});
function temp(t) {const p=fs.mkdtempSync(path.join(os.tmpdir(),"rey bar's "));t.after(()=>fs.rmSync(p,{recursive:true,force:true}));return p;}
function cli(base,...args) {return execFileSync(process.execPath,[manage,...args,'--claude-dir',base],{encoding:'utf8'});}
test('missing/null data and invalid stdin are safe',()=>{
  assert.match(render(null,cfg),/ctx \?/);assert.match(render({context_window:{used_percentage:null}},cfg),/ctx \?/);
  assert.match(execFileSync(process.execPath,[renderer],{input:'broken',encoding:'utf8'}),/unavailable/);
});
test('context fallback excludes output and preserves zero',()=>{
  assert.match(render({context_window:{used_percentage:0}},cfg),/0%/);
  assert.match(render({context_window:{context_window_size:100,current_usage:{input_tokens:10,cache_creation_input_tokens:10,cache_read_input_tokens:20,output_tokens:60}}},cfg),/40%/);
});
test('usage absence/expiry and cost estimates',()=>{
  assert.doesNotMatch(render({},cfg),/5h/);
  assert.doesNotMatch(render({rate_limits:{five_hour:{used_percentage:90,resets_at:1}}},cfg),/5h/);
  assert.match(render({cost:{total_cost_usd:0}},cfg),/~\$0.00/);
});
test('sanitizes terminal controls, NO_COLOR and narrow output',()=>{
  const out=render({model:{display_name:'x\n\x1b[31mevil'}},validate({width:20}),{NO_COLOR:'',COLUMNS:'20'});
  assert.ok(!out.includes('\x1b'));assert.ok(out.split('\n').every(s=>s.length<=18));
});
test('validates config',()=>{assert.throws(()=>validate({cost:'false'}));assert.throws(()=>validate({theme:'bad'}));assert.throws(()=>validate({width:0}));assert.throws(()=>validate({oops:true}));});
test('real git unborn, dirty, committed, detached and non-git',t=>{
  const p=temp(t);assert.equal(git(p),'');execFileSync('git',['init','-q',p]);assert.match(git(p),/clean/);
  fs.writeFileSync(path.join(p,'a'),'a');assert.match(git(p),/dirty:1/);
  execFileSync('git',['-C',p,'add','.']);execFileSync('git',['-C',p,'-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','test']);assert.match(git(p),/clean/);
  execFileSync('git',['-C',p,'checkout','--detach','-q']);assert.match(git(p),/HEAD/);
});
test('bounded transcript, malformed lines, completion, session isolation, stale data',t=>{
  const p=path.join(temp(t),'transcript');
  const row={sessionId:'s',message:{content:[{type:'tool_use',id:'a',name:'Read',input:{secret:'never shown'}}]}};
  fs.writeFileSync(p,'bad\n'+JSON.stringify(row)+'\n');assert.match(activity(p,'s'),/pending: Read/);assert.equal(activity(p,'other'),'');
  fs.appendFileSync(p,JSON.stringify({message:{content:[{type:'tool_result',tool_use_id:'a'}]}})+'\n');assert.match(activity(p,'s'),/done Read/);assert.doesNotMatch(activity(p,'s'),/secret/);
  fs.utimesSync(p,new Date(0),new Date(0));assert.equal(activity(p,'s'),'');
});
test('install persists across fresh processes, idempotence, configure and restore',t=>{
  const base=temp(t);const previous={type:'command',command:'echo prior',padding:2};
  fs.writeFileSync(path.join(base,'settings.json'),JSON.stringify({statusLine:previous,unrelated:{keep:true}}));
  assert.throws(()=>cli(base,'install'));cli(base,'install','--replace');cli(base,'install');cli(base,'configure','theme','mono');
  const file=path.join(base,'settings.json');const settings=JSON.parse(fs.readFileSync(file));
  for(let i=0;i<2;i++) assert.match(execFileSync('/bin/sh',['-c',settings.statusLine.command],{input:'{"model":{"display_name":"Persisted"}}',encoding:'utf8'}),/Persisted/);
  assert.equal(JSON.parse(cli(base,'doctor')).settingsMatch,true);
  cli(base,'uninstall');assert.deepEqual(JSON.parse(fs.readFileSync(file)),{statusLine:previous,unrelated:{keep:true}});
});
test('uninstall respects externally replaced setting',t=>{
  const base=temp(t);cli(base,'install');const p=path.join(base,'settings.json');fs.writeFileSync(p,JSON.stringify({statusLine:{command:'echo external'}}));cli(base,'uninstall');assert.equal(JSON.parse(fs.readFileSync(p)).statusLine.command,'echo external');
});
test('invalid settings are never overwritten',t=>{const base=temp(t),p=path.join(base,'settings.json');fs.writeFileSync(p,'invalid');assert.throws(()=>cli(base,'install'));assert.equal(fs.readFileSync(p,'utf8'),'invalid');});
test('reinstall after uninstall preserves preferences',t=>{const base=temp(t);cli(base,'install');cli(base,'configure','theme','dracula');cli(base,'uninstall');cli(base,'install');assert.equal(JSON.parse(fs.readFileSync(path.join(base,'skills/rey-claude-bar/config/user.json'))).theme,'dracula');});
const {snakeBoard}=require('../skills/rey-claude-bar/scripts/snake');
test('snake moves only left, wraps, fits width and handles unknown context',()=>{
  const c=validate({variant:'snake',theme:'mono'}), draw=(p,t=1000)=>snakeBoard({context_window:{used_percentage:p}},60,t,c).join('\n');
  for(let tick=0;tick<24;tick++) {
    const line=draw(20,tick*1000);
    assert.equal(line.indexOf('🐍'),2+23-tick);
    assert.doesNotMatch(line,/🟢|🍎/u);
    assert.match(line,/^\[ ·*🐍 +\]/u);
  }
  assert.equal(draw(20,24000),draw(20,0));
  assert.notEqual(draw(20,1000),draw(20,2000));assert.match(draw(null),/ctx \?/);
  for(let w=1;w<130;w++) assert.ok(snakeBoard({},w,1000,c).every(l=>Array.from(l).reduce((n,ch)=>n+(ch.codePointAt(0)>0xffff?2:1),0)<=w));
});
test('snake pauses only for reported active limits',()=>{
  const c=validate({variant:'snake'}),d={rate_limits:{five_hour:{used_percentage:100,resets_at:100}}};
  assert.deepEqual(snakeBoard(d,60,1000,c),snakeBoard(d,60,2000,c));
  assert.match(snakeBoard(d,60,1000,c).join('\n'),/LIMIT REACHED/);
  assert.doesNotMatch(snakeBoard(d,60,101000,c).join('\n'),/LIMIT REACHED/);
});
test('snake setting persists and classic removes animation refresh',t=>{
  const base=temp(t);cli(base,'install');cli(base,'configure','variant','snake');
  const settings=()=>JSON.parse(fs.readFileSync(path.join(base,'settings.json')));
  assert.equal(settings().statusLine.refreshInterval,1);cli(base,'install');assert.equal(settings().statusLine.refreshInterval,1);
  assert.match(execFileSync('/bin/sh',['-c',settings().statusLine.command],{input:'{}',encoding:'utf8'}),/🐍/);
  cli(base,'configure','variant','classic');assert.equal(settings().statusLine.refreshInterval,undefined);
});
const {chopper}=require('../skills/rey-claude-bar/scripts/chopper');
test('chopper keeps supplied fuselage and animates rotor within width',()=>{
  const a=chopper(60,0), b=chopper(60,1000);
  assert.equal(a[1],'*>=====[_]L)');assert.notEqual(a[0],b[0]);assert.deepEqual(a.slice(1),b.slice(1));
  assert.deepEqual(a,chopper(60,4000));
  for(let w=1;w<60;w++) assert.ok(chopper(w,0).every(line=>line.length<=w));
  const c=validate({variant:'chopper'});
  assert.match(render({},c,{}),/\x1b\[31m/);
  assert.doesNotMatch(render({},c,{NO_COLOR:''}),/\x1b/);
  assert.doesNotMatch(render({},validate({variant:'chopper',theme:'mono'}),{}),/\x1b/);
});
test('chopper configuration persists with timer through reinstall',t=>{
  const base=temp(t);cli(base,'install');cli(base,'configure','variant','chopper');cli(base,'install');
  const s=JSON.parse(fs.readFileSync(path.join(base,'settings.json')));assert.equal(s.statusLine.refreshInterval,1);
  assert.match(execFileSync('/bin/sh',['-c',s.statusLine.command],{input:'{}',encoding:'utf8'}),/\*>=====\[_\]L\)/);
  cli(base,'configure','variant','classic');assert.equal(JSON.parse(fs.readFileSync(path.join(base,'settings.json'))).statusLine.refreshInterval,undefined);
});
