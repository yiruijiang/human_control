# Changelog

## [0.2.0.0] - 2026-05-05

### Added
- Visual canvas: ReactFlow node graph for designing and executing AI workflows
- NL init: describe a workflow in natural language, get a complete YAML chain
- Live execution: SSE streaming output per node, color-coded states (amber/green/red)
- Skill palette: searchable sidebar with all gstack skills, one-click add to canvas
- Custom node rendering: pending/running/completed/failed states with real-time updates
- Re-run from here: execute from any node, downstream only
- Terminal/IDE dark theme with CSS design tokens (GitHub-dark color scheme)
- API routes: chains CRUD, skills list, run-chain SSE, generate-chain, runs, artifacts
- Edge translation: bidirectional YAML inputs ↔ ReactFlow edges

### Changed
- Executor: added `--from` flag for per-node execution

## [0.1.0.0] - 2026-05-05

### Added
- `human-control` CLI: run multi-step AI workflows defined in YAML chain files
- `human-control run <chain.yaml>` — execute chains with topological ordering
- `human-control run --resume <run_id>` — auto-skip completed nodes on re-run
- `human-control run --dry-run` — validate and print execution order without running
- `human-control list-runs` — list all runs with status and node counts
- Command nodes: run arbitrary shell commands as chain steps with env var injection
- Model nodes: execute via claude_code_cli, local (Ollama), or API (OpenAI-compatible)
- `cache: true` on nodes permanently skips re-execution when artifact exists
- Pre-flight checks: claude PATH, model registry, skill file existence, Ollama health
- Configurable subprocess timeout per model type
- GStack skill injection with AskUserQuestion section stripping for unattended execution

