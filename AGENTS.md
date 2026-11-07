# HORIZON Agent Instructions

OpenCode must inspect and use the installed skill library before substantive work. When a task matches a skill, load it and follow it. Do not ignore relevant skills.

## Always use skills when needed

For any non-trivial development task, use the relevant skill(s) from the installed library:
- Website/app building: use architecture, frontend, backend, testing, debugging, code review, security, documentation, DevOps, and database skills as appropriate.
- Game/app making or large projects: use game/programming/architecture/testing/debugging skills and run adversarial review before release.
- Bug reports, reviews, security audits: use `bug-hunter` by default. It is scan-only unless the user explicitly requests edits.
- Complex execution: use planner/architecture/debugging skills in sequence.

## Skill usage order

1. Triage the request.
2. Load matching skills before editing or designing.
3. For big projects, use a structured flow:
   - discovery/planning skills
   - architecture review
   - implementation with test-driven execution
   - code review
   - debugging if needed
   - bug/security scan with `bug-hunter`
4. If no skill matches, still follow normal best practices and mention the gap.

## Minimum expectations

- Do not edit blindly; inspect the codebase first.
- Use subagents for independent research, code review, and documentation when a task is broad.
- Validate with build/tests before claiming readiness.
- Never expose secrets or credentials in frontend code.
- Prefer secure defaults, input validation, authorization, and idempotent backend operations.
- Keep responses factual and avoid unsupported claims.