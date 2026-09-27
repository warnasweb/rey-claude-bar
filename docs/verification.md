# Local verification — 2026-09-27

Environment: macOS, Node.js 22.15.1, Git 2.41.0.

- `npm test`: 11 tests passed, 0 failed.
- `npm run demo`: expected two-line model/context/usage/cost/session display.
- Installed into the user's real Claude configuration directory. Doctor reported installed, settingsMatch, skill, config and renderer all true.
- Read the saved real settings.json and invoked its statusLine shell command in two separate fresh processes: both rendered the supplied model and zero context correctly.
- Isolated tests verified previous-statusLine restoration, unrelated-setting preservation, external replacement preservation, malformed settings refusal, reinstall and retained preferences.

Limitation: Claude Code executable was not available on PATH (doctor: claude=false). An interactive Claude session, actual skill discovery, and quit/reopen UI acceptance were not tested. Persistent configuration and fresh-process execution were tested. Follow README's interactive acceptance check after installing Claude Code. CI matrix is configured but remote results are separate from this local record.

## Snake variant verification

15 tests passed using the bundled compatible Node runtime. Added checks for a continuous, non-self-crossing closed route, context growth, animation frames, narrow widths, unavailable metrics, active/expired rate limits, persisted variant, reinstall, and returning to classic. System Node binaries returned a CPU architecture error in this execution environment. Interactive Claude animation remains an acceptance check for the user.

## Snake direction and chopper update

16 tests pass. Snake uses the original emoji moving right to left, with dots ahead and no body/food. Chopper tests cover supplied fuselage, rotor frames, red ANSI color, mono/NO_COLOR, narrow widths, timer persistence, reinstall and return to classic. Interactive terminal appearance remains unverified.
