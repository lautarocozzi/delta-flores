# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| Bubbletea TUI, editing Go files in installer/internal/tui/ | gentleman-bubbletea | /home/lautaro/.claude/skills/gentleman-bubbletea/SKILL.md |
| E2E testing, editing files in installer/e2e/ | gentleman-e2e | /home/lautaro/.claude/skills/gentleman-e2e/SKILL.md |
| editing installer.go, adding installation steps | gentleman-installer | /home/lautaro/.claude/skills/gentleman-installer/SKILL.md |
| editing files in installer/internal/system/ | gentleman-system | /home/lautaro/.claude/skills/gentleman-system/SKILL.md |
| editing files in installer/internal/tui/trainer/ | gentleman-trainer | /home/lautaro/.claude/skills/gentleman-trainer/SKILL.md |
| Go tests, go test coverage, Bubbletea teatest | go-testing | /home/lautaro/.claude/skills/go-testing/SKILL.md |
| AI chat features, breaking changes from v4 | ai-sdk-5 | /home/lautaro/.claude/skills/ai-sdk-5/SKILL.md |
| PRs over 400 lines, stacked PRs, review slices | chained-pr | /home/lautaro/.claude/skills/chained-pr/SKILL.md |
| writing guides, READMEs, RFCs, onboarding docs | cognitive-doc-design | /home/lautaro/.claude/skills/cognitive-doc-design/SKILL.md |
| PR feedback, issue replies, reviews, comments | comment-writer | /home/lautaro/.claude/skills/comment-writer/SKILL.md |
| REST APIs with Django - ViewSets, Serializers | django-drf | /home/lautaro/.claude/skills/django-drf/SKILL.md |
| release, bump version, update homebrew | homebrew-release | /home/lautaro/.claude/skills/homebrew-release/SKILL.md |
| GitHub issues, bug reports, feature requests | issue-creation | /home/lautaro/.claude/skills/issue-creation/SKILL.md |
| create Jira epics, large features, multi-task | jira-epic | /home/lautaro/.claude/skills/jira-epic/SKILL.md |
| create Jira task, ticket, or issue | jira-task | /home/lautaro/.claude/skills/jira-task/SKILL.md |
| judgment day, dual review, adversarial review | judgment-day | /home/lautaro/.claude/skills/judgment-day/SKILL.md |
| Next.js routing, Server Actions, data fetching | nextjs-15 | /home/lautaro/.claude/skills/nextjs-15/SKILL.md |
| Playwright E2E, Page Objects, selectors | playwright | /home/lautaro/.claude/skills/playwright/SKILL.md |
| review PRs, analyze issues, PR/issue backlog | pr-review | /home/lautaro/.claude/skills/pr-review/SKILL.md |
| Python tests, fixtures, mocking, markers | pytest | /home/lautaro/.claude/skills/pytest/SKILL.md |
| React components, no useMemo/useCallback | react-19 | /home/lautaro/.claude/skills/react-19/SKILL.md |
| new skills, agent instructions, AI patterns | skill-creator | /home/lautaro/.claude/skills/skill-creator/SKILL.md |
| Tailwind styling, cn(), theme variables | tailwind-4 | /home/lautaro/.claude/skills/tailwind-4/SKILL.md |
| technical exercises, candidate submissions | technical-review | /home/lautaro/.claude/skills/technical-review/SKILL.md |
| TypeScript code - types, interfaces, generics | typescript | /home/lautaro/.claude/skills/typescript/SKILL.md |
| planning commits as reviewable work units | work-unit-commits | /home/lautaro/.claude/skills/work-unit-commits/SKILL.md |
| Zod validation, breaking changes from v3 | zod-4 | /home/lautaro/.claude/skills/zod-4/SKILL.md |
| React state management with Zustand | zustand-5 | /home/lautaro/.claude/skills/zustand-5/SKILL.md |
| PRs, issues, reviews, branches, feature branches | branch-pr | /home/lautaro/.claude/skills/branch-pr/SKILL.md |
| Notion libros via xavi-libros CLI | notion-libros | /home/lautaro/.config/opencode/skill/notion-libros/SKILL.md |
| Notion tareas via xavi-tareas CLI | notion-tareas | /home/lautaro/.config/opencode/skill/notion-tareas/SKILL.md |
| Notion clientes via xavi-clients CLI | notion-clients | /home/lautaro/.config/opencode/skill/notion-clients/SKILL.md |
| Notion goals via xavi-goals CLI | notion-goals | /home/lautaro/.config/opencode/skill/notion-goals/SKILL.md |
| Notion projects via xavi-projects CLI | notion-projects | /home/lautaro/.config/opencode/skill/notion-projects/SKILL.md |
| Notion proveedores via xavi-proveedores CLI | notion-proveedores | /home/lautaro/.config/opencode/skill/notion-proveedores/SKILL.md |
| Notion gastos/subscriptions/finances via xavi-gastos CLI | notion-gastos | /home/lautaro/.config/opencode/skill/notion-gastos/SKILL.md |
| Notion habits via xavi-habits CLI | notion-habits | /home/lautaro/.config/opencode/skill/notion-habits/SKILL.md |
| Notion activos/pasivos via xavi-activos CLI | notion-activos | /home/lautaro/.config/opencode/skill/notion-activos/SKILL.md |
| Notion pedidos via xavi-pedidos CLI | notion-pedidos-2 | /home/lautaro/.config/opencode/skill/notion-pedidos/SKILL.md |
| Notion Resources IT via xavi-resource CLI | notion-resources-it | /home/lautaro/.config/opencode/skill/notion-resources-it/SKILL.md |
| Logging with JSON, Elasticsearch, syslog | structured-logging | /home/lautaro/.config/opencode/skills/structured-logging/SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### gentleman-bubbletea
- Use `tea.Screen` for full-screen renders, `tea.Println` for logging in tests
- Prefer `program.Send()` over manual update calls in tests
- Models: `Model` struct with `Init()`, `Update()`, `View()` methods
- Use `tea.WindowSizeMsg` for responsive layouts, not hardcoded sizes
- Commands: return `tea.Cmd` from Update, use `tea.Batch` to run multiple
- Always handle `tea.KeyMsg` for keyboard shortcuts
- Styles: use `lipgloss` for styling, define at package level, reuse

### gentleman-e2e
- Docker-based tests, each test case runs in isolated container
- Use `testcontainers-go` for container lifecycle management
- Assert on container stdout/stderr, not on internal state
- Platform detection: use `runtime.GOOS` for OS-specific paths
- Fixtures: mount test data via volume binds, avoid copying into image
- Always clean up containers with `defer` after test completion
- Parallel-safe: use unique container names per test

### gentleman-installer
- Steps implement `Step` interface: `Title()`, `Description()`, `Run()`, `Status()`
- Steps are registered in order in `installer.go` via `AddStep()`
- Status: uses `StepStatus` enum (Pending, Running, Completed, Failed)
- Progress reporting: use `program.Send()` with status updates from `Run()`
- Error handling: return error from `Run()`, installer handles UI update
- Idempotent steps: check prerequisites before executing
- Config: share state via installer context, not global vars

### gentleman-system
- OS detection: use `runtime.GOOS`, check `/etc/os-release` for distro
- Command execution: use `exec.CommandContext` with timeout, not raw `exec.Command`
- Shell access: prefer direct binary calls over shell pipes
- Sudo: request elevation via `pkexec` or `sudo -A`, cache credentials
- Package managers: detect (apt/brew/pacman/dnf) before running install
- Error wrapping: use `fmt.Errorf("context: %w", err)` for all system errors
- Path resolution: use `filepath.Join`, never string concatenation for paths

### gentleman-trainer
- Modules: YAML-defined with `ID`, `Title`, `Exercises`, `Prerequisites`
- Exercises: `type Exercise` with `Task`, `ExpectedInput`, `Hints`, `Points`
- Game state: persisted to JSON via `Save()`/`Load()` on trainer.Model
- XP/Level: compute from completed exercises, track streaks
- Tip system: cooldown per exercise, decrement score on use
- Keyboard: vim motions captured via tea.KeyMsg, compare to ExpectedInput
- Progress: save after every completed exercise, auto-load on init

### go-testing
- Table-driven tests with `[]struct{name, input, expected}` pattern
- Use `t.Parallel()` on subtests, not parent test
- Golden files: `testdata/*.golden` with `flag.Update()` for updates
- Bubbletea teatest: use `teatest.NewModel()` with `teatest.WithInitialModel()`
- Coverage: `go test -cover -coverprofile=coverage.out`, enforce >= 80%
- Mock interfaces, not concrete types — use `mockgen` or hand-roll
- Test packages: `package_test` for black-box tests, `package` for white-box

### ai-sdk-5
- `generateText()` replaces `generateCompletion()`, returns `{text, finishReason, usage}`
- `streamText()` returns `TextStreamPart<...>` — iterate with `for await (const part of stream)`
- Tools: define with `tool({description, parameters: z.object({...}), execute: async ...})`
- `maxSteps` param enables tool-calling loops (auto-execute tool results)
- Middleware: `wrapLanguageModel()` with `yourMiddleware()` for logging/guardrails
- No more `experimental_buildOpenAIMessages()` — provider messages are internal

### chained-pr
- Split if PR > 400 lines or touches > 10 files
- Each chain is a stack: branch-1/feature → branch-2/feature → ... → main
- Each PR must be independently reviewable and mergeable
- Shared code goes in earliest PR in the stack
- Use `gh pr create --base <parent-branch>` to chain PRs
- Label each PR with `stack/N` for ordering
- Never split tests from their implementation — keep them in same PR

### cognitive-doc-design
- One concept per section, each section ≤ 7 ± 2 paragraphs
- Lead with the problem statement, not the solution
- Use mermaid diagrams for architecture/flow (sequence, class, flowchart)
- Code examples: inline and runnable, never truncated pseudo-code
- Navigation: TOC with anchors for any doc > 300 words
- Glossary: define domain terms at first use in bold
- Decisions: use ADR format (Context → Decision → Consequences)

### comment-writer
- Open with a warm, specific praise ("good catch on X", "nice approach to Y")
- Frame critiques as observations, not accusations ("noticed X could be an issue because Y")
- End with an open invitation to discuss ("wdyt?", "what do you think?")
- Use 1-2 emoji max, and only when it enhances tone (🚀🎯✅)
- Never use passive-aggressive tone, sarcasm, or excessive exclamation
- Suggest alternatives, not demands: "what about trying X instead?"
- Lead with "we" when possible — "we should consider", "we could do X"

### django-drf
- ViewSets: use `ModelViewSet` for CRUD, override `get_queryset` for filtering
- Serializers: use `ModelSerializer`, validate with `validate_<field>()` methods
- Permissions: `IsAuthenticated` by default, custom for per-object access
- Filtering: use `django-filter` with `FilterSet`, not manual queryset params
- Pagination: use `PageNumberPagination` or `CursorPagination` globally
- Routers: use `DefaultRouter` to register ViewSets, not manual urlpatterns
- Tests: use `APITestCase` with `APIClient`, factory_boy for fixtures

### homebrew-release
- Bump version in `VERSION` file or formula variable
- Update `sha256` in `.rb` formula — use `curl -L <release.tar.gz> | shasum -a 256`
- Tag with `git tag v{version} && git push origin v{version}`
- Release: `gh release create v{version} --generate-notes`
- Test locally: `brew install --build-from-source ./Formula/<formula>.rb`
- Formula class name = PascalCase of package name
- Only release from `main` branch, never from feature branches

### issue-creation
- Bug reports: `**Describe the bug**`, `**To Reproduce**`, `**Expected behavior**`, `**Screenshots**`, `**Environment**`
- Feature requests: `**Problem**`, `**Proposed Solution**`, `**Alternatives**`, `**Implementation Notes**`
- One issue per concern — do not combine multiple bugs/features
- Labels: at minimum `bug`/`enhancement`, add `good first issue` if appropriate
- Checklist: use `- [ ]` for action items, add `- [ ] Tests` and `- [ ] Documentation`
- Priority: label `P0` (blocking), `P1` (important), `P2` (nice-to-have)

### jira-epic
- Epic format: `[Project] Feature Name — Epic` title convention
- Fields: Summary, Description, Priority, Labels, Fix Version
- Description: Problem Statement → Success Criteria → Scope (In/Out) → Technical Notes
- Always link epic to a Jira Initiative parent
- Break epic into 3-15 stories before marking as Ready
- Acceptance Criteria per story, not at epic level
- Attach RFC/design doc link in Technical Notes

### jira-task
- Task format: `[Component] Brief actionable description`
- Fields: Summary, Description, Priority, Labels, Sprint, Story Points
- Description: Acceptance Criteria (checklist) → Technical Notes (links, decisions) → Definition of Done
- Assignee required, Sprint required for active work
- Labels: at least `team-{name}` and `area-{component}`
- Story points: Fibonacci (1, 2, 3, 5, 8, 13), never fractional
- Subtasks for tasks > 3 days of work

### judgment-day
- Blind dual review: agent A reviews code, agent B reviews agent A's review
- No communication between agents during review
- Each agent independently lists issues (blocker/major/minor)
- Third agent resolves conflicts between A and B
- Only confirmed issues get fixed — no speculative changes
- After fixes, re-judge: at least as strict as first review
- If no issues found by either, pass without modification

### nextjs-15
- App Router only — no pages/ directory, no `_app.tsx` or `_document.tsx`
- Server Components by default, `'use client'` only for interactivity/context
- Data fetching: `async` component, `fetch` with `cache: 'no-store'` or `next: { revalidate }`
- Server Actions: `'use server'` in separate file, call from `action` prop on form
- Dynamic routes: `[param]` folders, `params` prop in page/layout, `searchParams` in page only
- Middleware: `middleware.ts` at root, `matcher` config for route filtering
- Streaming: `loading.tsx` for instant loading states, `Suspense` boundaries per section

### playwright
- Page Objects: class with page property, methods return locators not promises
- Selectors: prefer `getByRole`, `getByText`, `getByTestId` — never CSS selectors
- Assertions: `expect(locator).toHaveText()`, `toBeVisible()`, `toHaveValue()` — use web-first assertions
- Fixtures: `test.use({ storageState: 'auth.json' })` for authenticated state
- Parallel: tests are parallel by default, use `test.describe.serial` for dependent flows
- MCP: use `@anthropic-ai/mcp-playwright` for AI-driven browser automation
- Trace: `--trace on` in CI, `--trace retain-on-failure` locally

### pr-review
- Run `gh pr list --limit 20` first, then ask user which to review
- Use `gh pr view <number> --json title,body,comments,reviews,commits,files`
- Each comment is a suggestion: `**{Blocker/Major/Minor}** — {file}:{line} — {why}`, optionally with ````suggestion`
- Group: Blocker (won't merge), Major (should fix), Minor (nice-to-have), Question (clarify)
- Check: tests exist, test coverage, no commented code, no secrets, error handling, types correct
- Summary block at top: `## Review of #{n}: {title}` with overall verdict
- Approve only if no Blockers and ≤2 Majors

### pytest
- Fixtures: `conftest.py` for shared fixtures, `scope='session'` for DB/API clients
- Parametrize: `@pytest.mark.parametrize('input,expected', [...])` for table tests
- Mocking: `monkeypatch` for stdlib, `mocker` (pytest-mock) for third-party
- Markers: `@pytest.mark.asyncio` for async tests, `@pytest.mark.django_db` for DB tests
- Temp files: `tmp_path` fixture (pathlib) — never use `tempfile` directly
- Coverage: `--cov=src --cov-report=term-missing`, enforce >= 85%
- Conventions: test files `test_*.py`, test functions `test_*`, classes `Test*`

### react-19
- No useMemo/useCallback — React Compiler handles memoization
- `use()` hook for reading promises/context, replaces `useEffect` for data fetching
- `useActionState` for form mutations, `useOptimistic` for optimistic UI
- `ref` is a regular prop in React 19 — no `forwardRef` needed
- `useTransition` improvements: `startTransition` can be async
- Server Components: default, add `'use client'` only when hooks/interactivity needed
- JSX runtime: automatic (no `import React` needed in files)

### skill-creator
- Frontmatter: `---\nname: <kebab-case>\ndescription: "<trigger>: <what>"\n---\n`
- Description: one physical line, quoted, ≤ 250 chars, trigger-first
- Structure: Activation Contract, Hard Rules (observable), Decision Gates (real forks), Execution Steps, Output Contract, References
- Body: 180-450 tokens — move examples/schemas/edge cases to `references/` or `assets/`
- Files must be `SKILL.md` at root of a kebab-case directory
- References: local relative paths `<references/foo.md>` and `file://` paths
- Frontmatter `description` field is the trigger — match against real user/repo patterns

### tailwind-4
- Use `cn()` helper from `tailwind-merge` + `clsx` for conditional classes
- Theme variables: CSS custom properties `--color-*`, reference via `var(--color-*)` NOT in className string
- No `@apply` directive — use component classes or inline utility classes instead
- Dark mode: `dark:` prefix variant, controlled via `class` strategy
- Container queries: `@sm:` `@md:` `@lg:` variants for responsive components
- Custom values: `w-[120px]` syntax for one-off values, theme extension for repeated use
- No `@tailwind` directives — use `@import "tailwindcss"` (v4) or `@layer` (v3)

### technical-review
- Evaluate: Correctness → Performance → Maintainability → Testing → Error Handling → Documentation
- Score each category: 1-5, with clear justification per score
- Never give 5/5 in all categories — there's always room for improvement
- Highlight strengths first, then improvement areas with concrete examples
- Final verdict: Hire / Strong Hire / Lean Hire / No Hire with explicit reasoning
- Reference the rubric statement: "This is a technical exercise — treat it as real production code"
- Time-box review to max 30 minutes for exercises under 500 lines

### typescript
- Strict mode: `strict: true` in tsconfig — no `strictNullChecks` alone
- Prefer `interface` for public API shapes, `type` for unions/intersections
- `unknown` over `any` — type-narrow with type guards or Zod/Zod schema
- `as const` for literal types, `satisfies` for type validation without widening
- Utility types: `Pick`, `Omit`, `Partial`, `Required`, `Record` — compose don't redefine
- Discriminated unions: `type Result<T> = { status: 'ok'; data: T } | { status: 'err'; error: string }`
- `noUncheckedIndexedAccess: true` for safe object access

### work-unit-commits
- Each commit is a reviewable unit: one concern, testable, independently reversible
- Structure: `type(scope): description` — conventional commits format
- Tests and docs ship with the code that needs them, never separate commits
- If a PR has > 5 commits, squash related commits before review
- Do not split refactors from feature changes in same PR
- Commit body explains WHY, title explains WHAT
- `fixup!` commits for review feedback, squash before merge

### zod-4
- `.pipe()` replaces `.transform().parse()` chaining — compose schemas left to right
- `.describe()` returns modified schema with metadata, not a string
- `z.instanceOf()` for class validation replaces `z.instanceof()` (different capitalization)
- Branded types: `z.string().brand('UserId')` replaces manual intersection branding
- Effects: `.refine()`, `.transform()`, `.preprocess()` — order matters
- Internationalization: `z.i18n()` for locale-specific error messages
- `ZodError` flattened issues: `error.flatten()` for simpler error consumption

### zustand-5
- `create()` still works but `createStore()` is the lower-level primitive
- Slices pattern: `create<StoreType>()((...a) => ({ ...slice1(...a), ...slice2(...a) }))`
- Subscribe: `useStore(store, selector)` — selector is required for performance
- Immer: use `immer` middleware for nested state mutations
- Persist: `persist` middleware with `partialize` to select serialized keys
- No Provider needed — Zustand store is module-scoped by default
- `useStore` replaces `useContext` for global state, no more context providers

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| AGENTS.md | /home/lautaro/.config/opencode/AGENTS.md | System-wide agent instructions loaded by OpenCode |
