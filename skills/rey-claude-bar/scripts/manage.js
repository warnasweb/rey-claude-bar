#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {execFileSync} = require('node:child_process');
const {validate} = require('./statusline');
const source = path.resolve(__dirname,'..');
const args = process.argv.slice(2);
const index = args.indexOf('--claude-dir');
if (index !== -1 && !args[index+1]) throw Error('--claude-dir requires a path');
const base = path.resolve(index === -1 ? process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(),'.claude') : args.splice(index,2)[1]);
const target = path.join(base,'skills/rey-claude-bar');
const settingsFile = path.join(base,'settings.json');
const stateFile = path.join(base,'rey-claude-bar-install.json');
const read = (p,fallback) => { try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch(e) {if(e.code==='ENOENT') return fallback; throw e;} };
const object = x => x && typeof x === 'object' && !Array.isArray(x);
const write = (p,value) => {
  fs.mkdirSync(path.dirname(p),{recursive:true});
  if(fs.existsSync(p) && fs.lstatSync(p).isSymbolicLink()) throw Error(`Refusing symlink: ${p}`);
  const tmp = `${p}.${process.pid}.tmp`;
  try {fs.writeFileSync(tmp,JSON.stringify(value,null,2)+'\n',{mode:0o600,flag:'wx'});fs.renameSync(tmp,p);} finally {if(fs.existsSync(tmp)) fs.unlinkSync(tmp);}
};
const quote = s => "'"+s.replace(/'/g,"'\\''")+"'";
const command = `${quote(process.execPath)} ${quote(path.join(target,'scripts/statusline.js'))}`;
const equal = (a,b) => JSON.stringify(a) === JSON.stringify(b);
function main() {
  const action = args.shift() || 'doctor';
  const settings = read(settingsFile,{});
  if(!object(settings)) throw Error('settings.json must contain an object');
  const state = read(stateFile,null);
  if(action === 'install') {
    if(process.platform === 'win32') throw Error('Installer currently supports macOS/Linux POSIX shells only');
    if(args.some(x=>x!=='--replace')) throw Error('Usage: install [--replace]');
    if(state && settings.statusLine?.command !== state.command && !equal(settings.statusLine, state.hadPrevious ? state.previous : undefined)) throw Error('Status line changed after install. Uninstall first; external settings will be preserved.');
    if(!state && settings.statusLine && !args.includes('--replace')) throw Error('Existing statusLine found. Review it and use install --replace to save and replace it.');
    if(fs.existsSync(target) && source !== target && !state && !fs.existsSync(path.join(target,'.rey-managed'))) throw Error('Skill directory already exists and is not managed by this installer');
    const next = state || {version:1,command,hadPrevious:Object.hasOwn(settings,'statusLine'),previous:settings.statusLine ?? null};
    // Persist recovery metadata before changing settings. Repeat install recovers interrupted installs.
    if(!state) write(stateFile,next);
    fs.mkdirSync(target,{recursive:true});
    fs.writeFileSync(path.join(target,'.rey-managed'),'rey-claude-bar\n');
    if(source!==target) {
      for(const name of ['SKILL.md','scripts','config']) fs.cpSync(path.join(source,name),path.join(target,name),{recursive:true,filter:p=>path.basename(p)!=='user.json'});
    }
    next.command = command;
    write(stateFile,next);
    settings.statusLine={type:'command',command,padding:0};
    if(read(path.join(target,'config/user.json'),{}).variant==='snake') settings.statusLine.refreshInterval=1;
    write(settingsFile,settings);
    console.log(`Installed ${target}\nPersistent statusLine saved in ${settingsFile}`);
  } else if(action === 'configure') {
    if(!state) throw Error('Install first');
    if(args.length!==2) throw Error('Usage: configure <option> <value>');
    const [key,raw] = args; let value; try {value=JSON.parse(raw);} catch {value=raw;}
    const file = path.join(target,'config/user.json');
    if(args[0]==='variant' && settings.statusLine?.command!==state.command) throw Error('Active statusLine is not owned by Rey');
    const current = read(file,{}); const updated = {...current,[key]:value}; validate(updated); write(file,updated);
    if(key==='variant') {
      if(value==='snake') settings.statusLine.refreshInterval=1;
      else delete settings.statusLine.refreshInterval;
      write(settingsFile,settings);
    }
    console.log(`Configured ${key}=${JSON.stringify(value)}`);
  } else if(action === 'uninstall') {
    if(!state) {console.log('Not installed');return;}
    if(settings.statusLine?.command === state.command) {
      if(state.hadPrevious) settings.statusLine=state.previous; else delete settings.statusLine;
      write(settingsFile,settings);
    }
    // Remove only files installed by this tool. Keep user config and any unexpected files.
    for(const name of ['SKILL.md','scripts','config/default.json']) fs.rmSync(path.join(target,name),{recursive:true,force:true});
    fs.unlinkSync(stateFile);
    console.log('Uninstalled. User configuration retained; any external statusLine preserved.');
  } else if(action === 'doctor') {
    const checks = {node:process.versions.node,installed:!!state,settingsMatch:!!state && settings.statusLine?.command===state.command,skill:fs.existsSync(path.join(target,'SKILL.md'))};
    try {execFileSync('claude',['--version'],{timeout:3000,stdio:'pipe'});checks.claude=true;} catch {checks.claude=false;}
    try {validate(read(path.join(target,'config/user.json'),{}));checks.config=true;} catch {checks.config=false;}
    try {
      const result=execFileSync(process.execPath,[path.join(target,'scripts/statusline.js')],{input:'{"model":{"display_name":"Doctor"}}',encoding:'utf8',timeout:2000});
      checks.renderer=result.includes('Doctor');
    } catch {checks.renderer=false;}
    console.log(JSON.stringify(checks,null,2));
    if(!checks.installed||!checks.settingsMatch||!checks.skill||!checks.config||!checks.renderer) process.exitCode=1;
  } else throw Error('Commands: install [--replace], configure <key> <value>, doctor, uninstall');
}
try { main(); } catch(e) {console.error(`rey-claude-bar: ${e.message}`);process.exitCode=1;}
