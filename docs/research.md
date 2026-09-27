# Interface research — 2026-09-27

Sources: https://code.claude.com/docs/en/skills and https://code.claude.com/docs/en/statusline

Personal skills live under the Claude configuration directory's skills/<name>/SKILL.md. YAML frontmatter names/describes the skill; disable-model-invocation makes it an explicit user action. Plugin skills use the same directory shape beneath the plugin root.

statusLine is a command-type setting. The shell command receives JSON via stdin and returns display text on stdout. Settings persist between sessions. Updates are event-driven; a recent optional refreshInterval also exists but is not required by this implementation. Multiple output lines and ANSI color are supported, and COLUMNS supplies terminal sizing.

Implementation reads documented model, workspace, context_window, rate_limits, cost, session, transcript_path, vim, agent, effort, fast_mode and pr fields. Null context means unknown. Fallback context math uses input + cache creation + cache read, excluding output. Usage windows may be absent; reset times are epoch seconds. Cost is a client estimate rather than a billing statement.

Inspiration review: https://github.com/briansmith80/claude-code-status-bar

Reviewed README highlights, layout, configuration and activity sections. Selected themes/toggles, Git, usage, session and activity for the initial scope. Did not adopt OAuth fallbacks, forecasts, network checks, self-updates, bash parsing, or background helpers. Implementation was written from scratch using Node standard libraries. No copied code or assets.

Transcript-derived activity is explicitly best-effort, because transcript_path is documented but the event schema is not a guaranteed statusLine activity interface. No unsupported top-level activity/status fields are presumed.
