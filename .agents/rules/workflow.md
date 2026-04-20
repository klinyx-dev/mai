# Workflow rules

When the user asks for a new feature, follow this flow:
1. Read `AGENTS.md` and `.agents/rules/*.md`, plus relevant skill docs.
2. Draft or update a plan under `.agents/plans/<feature-name>/` with phased tasks and commit checkpoints.
3. Implement in small commits, following requested ordering and architecture boundaries.
4. Run tests locally after each meaningful phase and fix regressions.
5. Summarize completed plan outcomes into `.agents/memory/`.
6. Remove finished plan files from `.agents/plans/`.
