---
name: rey-claude-bar
description: Install, configure, diagnose, or remove Rey's persistent Claude Code status bar. Use when the user invokes /rey-claude-bar to manage model, context, usage, Git, session, and activity display.
argument-hint: "[install | configure <option> <value> | doctor | uninstall]"
disable-model-invocation: true
---

Manage the status bar using `scripts/manage.js` relative to this SKILL.md's directory. Resolve the actual skill directory before running commands; quote paths and arguments. Do not interpolate raw user input into shell commands.

- No arguments: run `node <skill-directory>/scripts/manage.js doctor`. If not installed, install it; otherwise summarize configuration options.
- Install: run `node <skill-directory>/scripts/manage.js install`.
- Configure: translate the requested change to one supported key/value pair and run `node <skill-directory>/scripts/manage.js configure <key> <value>`.
- Doctor: run the doctor command and explain any failed checks.
- Uninstall: run the uninstall command. It restores the previous status line only while Rey owns the setting; retained user configuration is intentional.

Options: `variant` = classic, snake (original emoji moving right to left), chopper (red helicopter with animated rotor), or car (blue car driving left to right with animated wheels); `theme` = default, dracula, mono; `width` = integer 20–500; `git`, `model`, `context`, `usage`, `session`, `cost`, `activity`, `status` = true/false. Example: `configure cost false`.

An existing unrelated status line is never silently replaced. Explain that `install --replace` saves and replaces it; use that flag only if the user requested replacement. Respect `CLAUDE_CONFIG_DIR`; `--claude-dir <path>` permits an explicit isolated configuration directory.

Installation copies the self-contained skill into the user's Claude configuration and saves a persistent `statusLine` command. No resident process is needed. The bar remains configured across sessions until removed. Run doctor after changes. Do not claim an interactive Claude restart was tested unless it actually was. Missing usage data is unavailable, not zero; transcript activity is recent observed activity, not a guaranteed live task state.

Snake, chopper, or car configuration enables a one-second statusLine refresh timer. Classic removes that timer. Snake is decorative: the emoji moves right to left through dots and wraps, and active usage limits pause it. No keyboard gameplay.
