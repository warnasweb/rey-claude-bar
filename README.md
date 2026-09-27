# Rey Claude Bar

An original, dependency-free Node.js status bar for Claude Code, delivered as a local skill. Run the installer once: Claude Code invokes the saved command in every session. There is no daemon.

```text
my-project | Claude | ctx [####------] 42% | 5h 23% | week 41% | ~$0.38
git main clean | session Build Rey | 12m | effort high
```

## Install

Requires Node.js 20+ and Claude Code. Git is optional. Installer supports macOS and Linux; native Windows installation is not yet supported.

```sh
git clone https://github.com/warnasweb/rey-claude-bar.git
cd rey-claude-bar
node skills/rey-claude-bar/scripts/manage.js install
node skills/rey-claude-bar/scripts/manage.js doctor
```

The installer copies the self-contained skill to `~/.claude/skills/rey-claude-bar/` and updates `~/.claude/settings.json`. It respects `CLAUDE_CONFIG_DIR`. An absolute Node executable and shell-quoted script path make rendering independent of your working directory and shell startup files. If you remove or upgrade that Node installation to a different path, rerun install from this repository.

In Claude Code, invoke `/rey-claude-bar`, `/rey-claude-bar configure theme dracula`, or `/rey-claude-bar doctor`. The skill is explicitly user-invoked. Once installed, you can move/delete this checkout without breaking the installed renderer.

Existing unrelated status lines require `install --replace`. Their value is saved in `rey-claude-bar-install.json` for restoration. Unrelated settings are preserved. Invalid JSON is rejected. Settings writes use temporary files and rename. Avoid simultaneous install/configure/uninstall operations or editing settings during installation.

## Nokia-style Snake variant

Enable it with `/rey-claude-bar configure variant snake` or:

```sh
node skills/rey-claude-bar/scripts/manage.js configure variant snake
```

The compact inline row shows the original 🐍 emoji and dots: `[ ·········🐍 ]`. The snake moves right to left once per second, leaving blank space behind it, then wraps to the right edge. There is no body or food. Context usage remains in the metric label. At a reported active 5-hour or weekly limit of 100%, the snake pauses with `LIMIT REACHED`. Missing context shows `?`; expired limits do not pause it.

The variant retains the metric rows and adds one compact emoji row. It adapts to narrow terminals and supports `NO_COLOR`/mono. The installer sets Claude's `refreshInterval` to one second for animation; older clients without timer refresh update only on normal status-line events. No background process or animation cache is created. Return with `/rey-claude-bar configure variant classic`; this removes Rey's animation interval.

Inspired by the metric-driven arcade presentation in [sorosora/arcade-statusline](https://github.com/sorosora/arcade-statusline), implemented independently with a Snake design. No code or assets were copied.

## Red chopper variant

Select `/rey-claude-bar configure variant chopper` for this red ASCII helicopter with animated rotor blades:

```text
   -----|-----
*>=====[_]L)
      -'-`-
```

The helicopter moves one column to the right each second while its rotor spins. It stays fully within the available width, then wraps to the left edge. In very narrow terminals, movement pauses and the drawing is clipped to fit. The three-row drawing fits beneath the existing metrics. `NO_COLOR` or the mono theme disables red coloring. Both chopper and snake enable the persistent one-second refresh timer; classic removes it. Return to Snake with `/rey-claude-bar configure variant snake`.

## Configure and remove

```sh
node skills/rey-claude-bar/scripts/manage.js configure theme dracula
node skills/rey-claude-bar/scripts/manage.js configure cost false
node skills/rey-claude-bar/scripts/manage.js configure width 100
node skills/rey-claude-bar/scripts/manage.js uninstall
```

| Option | Values / default |
| --- | --- |
| variant | `classic` (default), `snake`, `chopper` |
| theme | `default`, `dracula`, `mono` |
| width | 20–500 columns; default 120, further limited by `COLUMNS` |
| git, model, context, usage, session, cost, activity, status | `true` or `false`; default true |

User overrides live in the installed skill's `config/user.json`; invalid overrides fall back to defaults during rendering and are flagged by doctor. `NO_COLOR` disables ANSI color. Uninstall retains user overrides and the ownership marker for reinstallation, removes the skill entry and scripts, and restores the previous statusLine only if Rey's command is still active. To remove retained preferences, delete the remaining skill directory after uninstall.

## Features and limits

- Model, input-only context percentage/bar, estimated session cost, duration, session name/ID.
- Native five-hour and weekly usage when supplied. Missing or expired data is hidden, never invented. No credential access or private usage API.
- Git branch, upstream/ahead/behind when Git reports them, clean/dirty file count, detached and unborn repositories. Git is read-only, bounded to 180 ms and 128 KiB output; slow/large repositories hide the Git segment.
- Vim mode, agent name, effort, fast mode and PR review status where supplied.
- Optional transcript activity reads only the last 64 KiB of a regular file modified within two minutes. Tool names, observed pending/completed/failed results, and TodoWrite progress are best-effort. No prompts or tool arguments are displayed. No transcript content is cached or uploaded.
- Transcript format is not a stable public API. A pending observation is not proof a tool is still running. Older or truncated events may be absent; activity refreshes only when Claude re-invokes the renderer. No guaranteed live spinner, service-health check, task graph, or marketplace integration in this initial version.
- Control characters are stripped. Long lines truncate conservatively; complex emoji may leave unused space. Malformed/oversized stdin gets a plain fallback. Renderer makes no network requests.

## Tests and persistence

```sh
npm test
npm run demo
node skills/rey-claude-bar/scripts/manage.js install --claude-dir /tmp/rey-sandbox
node skills/rey-claude-bar/scripts/manage.js doctor --claude-dir /tmp/rey-sandbox
```

Tests cover fallback rendering, usage expiry, context math, configuration validation, actual Git states, transcript parsing, settings preservation, install/configure/uninstall, shell quoting for spaces/apostrophes, and invoking the saved command from two fresh processes. No dependency installation is required.

Persistence comes from the saved `statusLine` setting, not a continuously running skill. For an interactive acceptance check, install, launch Claude Code, send a prompt, confirm the bar, exit and reopen Claude Code, then confirm it returns. Project or managed settings may override user settings. Doctor checks the installation and executable; it cannot prove what the interactive UI displays.

## Layout and future plugin packaging

`skills/rey-claude-bar/` is self-contained: SKILL.md, scripts and configuration travel together. Tests and documentation stay at repository level. A future `.claude-plugin/plugin.json` can package this existing skill without rewriting the renderer. A plugin setup step must still install the persistent user command; merely enabling a plugin does not configure statusLine. Marketplace publication is deliberately a later phase.

## Research and attribution

Verified 2026-09-27 against the official [skill interface](https://code.claude.com/docs/en/skills) and [statusLine interface](https://code.claude.com/docs/en/statusline). Field availability varies with client version and account; rendering is feature-detected.

[briansmith80/claude-code-status-bar](https://github.com/briansmith80/claude-code-status-bar) inspired feature selection (themes, segment toggles, usage, Git and activity). This is an independent Node.js implementation; no source code was copied or cloned. See [research notes](docs/research.md) and [test record](docs/verification.md).

MIT licensed; see [LICENSE](LICENSE).
