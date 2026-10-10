# ECC components in this repo

Picked from [affaan-m/ECC](https://github.com/affaan-m/ECC) v2.2.3 (commit 4eb71d9), MIT licensed (notice below).
Only plain Markdown agents, commands and skills are vendored here. Nothing in this folder runs code on its own.

- Agents (`.claude/agents`): code-reviewer, typescript-reviewer, react-reviewer, security-reviewer, silent-failure-hunter, planner, react-build-resolver
- Commands (`.claude/commands`): /react-review, /react-build, /build-fix
- Skills (`.claude/skills`): react-patterns, react-performance, frontend-a11y, vite-patterns, security-checklist, verification-loop

## Local changes from upstream

- Agent descriptions no longer say "MUST BE USED" / "PROACTIVELY", so Claude runs these subagents when asked or before a PR instead of after every edit.
- The `security-review` skill is renamed `security-checklist` so it does not shadow Claude Code's built-in `/security-review`.
- Some files link to ECC paths that are not vendored (`rules/...`, other skills/agents). Those links are dead here and can be ignored.

## Not included, and why

- **Hooks** (`hooks/hooks.json`, ~27 entries): they need the full ECC runtime installed under `~/.claude`, log every tool call to `~/.claude` (continuous-learning observer, activity tracker), and some block edits (GateGuard, config protection). Too heavy and intrusive for a shared repo config.
- **Rules** (`rules/*`): always-on context. The common ones mandate TDD and 80% coverage, and the React/React Native ones assume TypeScript and Expo Router; Circle is JavaScript with no test suite yet.
- **MCP configs**: placeholders needing personal API keys; Firebase and GitHub are already reachable another way.
- **/security-scan** (runs `npx ecc-agentshield`, downloads and executes a package), **i18n-sync** (needs the `locakit` CLI), **/plan** and **/code-review** (shadow Claude Code built-ins).
- Everything language- or domain-specific that Circle does not use (Go, Python, Rust, Flutter, healthcare, trading, ...).

## License

MIT License

Copyright (c) 2026 Affaan Mustafa

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
