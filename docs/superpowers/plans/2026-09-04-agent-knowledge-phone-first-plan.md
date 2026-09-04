# Agent Knowledge and Phone-First Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add queued URL, text, and private attachment knowledge sources to agents while making phone-number setup the first onboarding action.

**Architecture:** Keep source persistence, enums, requests, controllers, job, and extraction service in `packages/telephony`. Keep Inertia page composition in `resources/js`; every source operation resolves through the current team and agent. Persist source metadata immediately, then process it asynchronously through the database queue.

**Tech Stack:** Laravel 13, PHP 8.5, PHPUnit, Inertia React 3, TypeScript, shadcn/ui, Laravel filesystem, database queue.

---

### Task 1: Add source enums, model, migration, and factory

**Files:**
- Create: `packages/telephony/src/Enums/KnowledgeSourceType.php`
- Create: `packages/telephony/src/Enums/KnowledgeSourceStatus.php`
- Create: `packages/telephony/src/Models/AgentKnowledgeSource.php`
- Create: `packages/telephony/database/migrations/2026_09_04_000004_create_agent_knowledge_sources_table.php`
- Create: `packages/telephony/database/factories/AgentKnowledgeSourceFactory.php`
- Modify: `packages/telephony/src/Models/Agent.php`
- Test: `packages/telephony/tests/TelephonyModelsTest.php`

- [ ] **Step 1: Write failing model tests**

Add tests that assert an agent has many sources, a source belongs to an agent, enum casts return `KnowledgeSourceType` and `KnowledgeSourceStatus`, and deleting an agent deletes its sources.

- [ ] **Step 2: Run the focused model test**

Run: `php artisan test --compact packages/telephony/tests/TelephonyModelsTest.php`

Expected: FAIL because the source model, relation, and table do not exist.

- [ ] **Step 3: Implement the source model and schema**

Use a package-owned `AgentKnowledgeSource` model with `#[Fillable]`, `HasFactory`, an `agent(): BelongsTo` relation, enum casts, and fields for `agent_id`, `type`, `title`, `url`, `content`, `storage_path`, `original_filename`, `mime_type`, `file_size`, `status`, and `error_message`. Use a foreign key to `agents` with cascade delete. Add `knowledgeSources(): HasMany` to `Agent`.

- [ ] **Step 4: Add the factory and rerun tests**

The factory should create an agent by default, default source type to `text`, status to `pending`, and generate valid text content. Run the focused model test and expect PASS.

- [ ] **Step 5: Run migration rollback coverage**

Run: `php artisan test --compact packages/telephony/tests/TelephonyModelsTest.php`

Expected: PASS, including package migration rollback/reapply coverage updated for the fourth migration.

### Task 2: Add extraction service and queued processing

**Files:**
- Create: `packages/telephony/src/Services/KnowledgeSourceExtractor.php`
- Create: `packages/telephony/src/Jobs/ProcessAgentKnowledgeSource.php`
- Modify: `packages/telephony/src/Enums/KnowledgeSourceStatus.php`
- Test: `packages/telephony/tests/KnowledgeSourceProcessingTest.php`

- [ ] **Step 1: Write processing tests**

Cover text sources becoming `ready` with preserved content, URL sources becoming `ready` after a successful HTTP response, unsupported or unreadable sources becoming `failed` with an error message, and an exception transitioning `processing` to `failed`.

- [ ] **Step 2: Run the processing tests**

Run: `php artisan test --compact packages/telephony/tests/KnowledgeSourceProcessingTest.php`

Expected: FAIL because the extractor and job do not exist.

- [ ] **Step 3: Implement the extractor boundary**

Create an extractor with explicit methods for text, URL, and attachment sources. Text returns normalized content. URL fetching uses Laravel's HTTP client with a finite timeout, follows no uncontrolled redirects, requires a successful response, and extracts readable body text. Attachments support `.txt`, `.md`, `.csv`, and `.json` directly; PDF extraction must use an explicitly available parser or executable discovered during implementation, otherwise the source is marked failed with a clear message rather than silently reporting ready.

- [ ] **Step 4: Implement the queued job**

The job should load the source, mark it `processing`, call the extractor, persist extracted content and `ready`, or catch failures, persist `failed` and a safe error message, and rethrow only according to the chosen queue retry policy. Make the job implement `ShouldQueue` and use the database queue already configured by the application.

- [ ] **Step 5: Rerun processing tests**

Run the focused test file and expect PASS with the test queue configured synchronously.

### Task 3: Add source validation, storage, and team-scoped endpoints

**Files:**
- Create: `packages/telephony/src/Http/Requests/StoreKnowledgeSourceRequest.php`
- Create: `packages/telephony/src/Http/Controllers/AgentKnowledgeSourceController.php`
- Modify: `routes/web.php`
- Modify: `packages/telephony/src/Http/Controllers/AgentController.php`
- Test: `packages/telephony/tests/KnowledgeSourceEndpointsTest.php`

- [ ] **Step 1: Write endpoint tests**

Cover listing sources for an agent, creating URL/text sources, uploading an allowed attachment to the private disk, rejecting invalid URLs/files/types/sizes, dispatching processing jobs, retrying failed sources, deleting a source and private file, and returning `404` for another team’s agent or source.

- [ ] **Step 2: Run the endpoint tests**

Run: `php artisan test --compact packages/telephony/tests/KnowledgeSourceEndpointsTest.php`

Expected: FAIL because routes, requests, and controller do not exist.

- [ ] **Step 3: Implement validation and private storage**

Use separate validation branches for `type=url`, `type=text`, and `type=attachment`. Limit attachments to `.txt,.md,.pdf,.csv,.json` and a documented size limit. Store uploads under a deterministic private path such as `agent-knowledge/{agent_id}/{uuid}` using the configured local disk. Never return a direct public storage URL.

- [ ] **Step 4: Implement team-scoped controller actions**

Add `index`, `store`, `retry`, and `destroy`. Resolve the team from `current_team`, resolve the agent through `$team->agents()`, and resolve sources through `$agent->knowledgeSources()`. Persist first, dispatch `ProcessAgentKnowledgeSource`, and return back/Inertia responses with source data and safe flash messages.

- [ ] **Step 5: Register routes and rerun endpoint tests**

Register GET/POST/DELETE routes under the existing authenticated, verified, membership-protected team group. Add a POST retry route. Run the focused endpoint test and expect PASS.

### Task 4: Serialize agent sources and integrate the agent page

**Files:**
- Modify: `packages/telephony/src/Http/Controllers/AgentController.php`
- Modify: `resources/js/types/telephony.ts`
- Modify: `resources/js/pages/agents/index.tsx`
- Add or update shadcn components under: `resources/js/components/ui/`
- Test: `packages/telephony/tests/KnowledgeSourceEndpointsTest.php`

- [ ] **Step 1: Add serialization coverage**

Assert the agent page includes source id, type, title, status, filename, MIME type, size, error message, and action URLs without exposing private storage paths.

- [ ] **Step 2: Extend TypeScript types**

Add source type/status unions and an `AgentKnowledgeSource` type matching the serialized payload. Add the source collection and source endpoint URLs to the agent page props.

- [ ] **Step 3: Build the shadcn knowledge card**

Add a compact Knowledge card below agent configuration. Use shadcn `Tabs` for URL, text, and attachment modes, `Input`, `Textarea`, file input, `Button`, `Badge`, `Empty`, and `AlertDialog`. Show source status with text as well as color, keep error messages visible, and provide Retry/Delete actions with accessible names. Use Inertia forms with multipart upload for attachments.

- [ ] **Step 4: Add source list UX**

Show newest sources first, title/type metadata, ready/processing/failed badges, and a concise empty state explaining what can be added. Disable submit while processing and preserve form errors after failed requests.

- [ ] **Step 5: Verify frontend behavior**

Run: `npm run check -- --fix && npm run types:check`

Expected: PASS with no lint or type errors.

### Task 5: Make phone numbers the primary setup path

**Files:**
- Modify: `resources/js/pages/dashboard.tsx`
- Modify: `resources/js/pages/agents/index.tsx`
- Modify: `resources/js/pages/phone-numbers/index.tsx`
- Modify: `resources/js/components/app-sidebar.tsx`
- Modify: `packages/telephony/src/DashboardData.php`
- Test: `packages/telephony/tests/TelephonyEndpointsTest.php`

- [ ] **Step 1: Add phone-first behavior tests**

Assert the dashboard has a primary add-number action when no number exists, the agent page receives a no-number setup state, and phone numbers appear before agents in navigation/order.

- [ ] **Step 2: Implement dashboard setup state**

Make Connected phone numbers the first and visually dominant setup card. When empty, explain that an agent cannot receive calls until a number is assigned and link directly to the phone-number page. Keep call history available as the primary operational view once setup exists.

- [ ] **Step 3: Implement agent-page guardrail**

When the team has no phone numbers, show a concise shadcn `Alert` or `Empty` callout above agent knowledge with an Add phone number link. Do not block editing an agent; guide rather than force the order.

- [ ] **Step 4: Reorder sidebar items**

Place Phone numbers immediately after Dashboard and before Agents, preserving active state and responsive collapsed-sidebar behavior.

- [ ] **Step 5: Rerun endpoint tests**

Run: `php artisan test --compact packages/telephony/tests/TelephonyEndpointsTest.php`

Expected: PASS.

### Task 6: Documentation, formatting, and full verification

**Files:**
- Modify: `packages/telephony/README.md`
- Modify: `packages/telephony/tests/TelephonyModelsTest.php`
- Modify: `packages/telephony/tests/TelephonyEndpointsTest.php`

- [ ] **Step 1: Document source lifecycle and limits**

Update the package README to describe source types, private storage, queued status transitions, supported files, and the explicit absence of embeddings/vector search.

- [ ] **Step 2: Run formatting and static checks**

Run: `vendor/bin/pint --dirty --format agent`

Run: `vendor/bin/phpstan analyse --no-progress`

Run: `npm run check -- --fix && npm run types:check`

- [ ] **Step 3: Run the full test suite and build**

Run: `php artisan test --compact`

Run: `npm run build`

Expected: all tests pass, PHPStan passes, lint/type checks pass, and the production build completes successfully.

- [ ] **Step 4: Check the final diff**

Run: `git diff --check`

Review that no private storage paths, secrets, generated build files, or unrelated changes are included.
