# Local verification — 2026-09-27

Environment: macOS, Node.js 22.15.1, Git 2.41.0.

- `npm test`: 11 tests passed, 0 failed.
- `npm run demo`: expected two-line model/context/usage/cost/session display.
- Installed into the user's real Claude configuration directory. Doctor reported installed, settingsMatch, skill, config and renderer all true.
- Read the saved real settings.json and invoked its statusLine shell command in two separate fresh processes: both rendered the supplied model and zero context correctly.
- Isolated tests verified previous-statusLine restoration, unrelated-setting preservation, external replacement preservation, malformed settings refusal, reinstall and retained preferences.

Limitation: Claude Code executable was not available on PATH (doctor: claude=false). An interactive Claude session, actual skill discovery, and quit/reopen UI acceptance were not tested. Persistent configuration and fresh-process execution were tested. Follow README's interactive acceptance check after installing Claude Code. CI matrix is configured but remote results are separate from this local record.
