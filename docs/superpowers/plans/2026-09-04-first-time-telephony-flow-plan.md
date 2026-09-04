# First-Time Telephony Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove inline agent knowledge editing and make phone numbers, agents, and knowledge a clear first-time setup sequence.

**Architecture:** Derive setup completion from existing team counts. Add one small reusable React setup-progress component, then provide page-specific next actions and empty states. Keep the existing team-scoped routes and dedicated knowledge-source flow; do not add onboarding persistence.

**Tech Stack:** Laravel, Inertia React, TypeScript, shadcn/ui, Wayfinder, PHPUnit.

---

### Task 1: Remove Inline Agent Knowledge

**Files:**

- Modify: `packages/telephony/src/Http/Requests/StoreAgentRequest.php`
- Modify: `packages/telephony/src/Http/Controllers/AgentController.php`
- Modify: `resources/js/pages/agents/index.tsx`
- Modify: `resources/js/types/index.ts`
- Test: `packages/telephony/tests/TelephonyEndpointsTest.php`

- [ ] **Step 1: Update the endpoint test contract**

Change the agent create/update test payloads so they exercise only `name`, `language`, `greeting`, and `instructions`; assert the created/updated model does not receive an inline knowledge value.

- [ ] **Step 2: Run the focused endpoint test**

Run: `php artisan test --compact packages/telephony/tests/TelephonyEndpointsTest.php`

Expected: the existing tests pass before the implementation change, confirming the test starts from the current behavior.

- [ ] **Step 3: Remove the request and controller knowledge contract**

Delete `knowledge` from the request rules and from the `agents` page prop mapping. Leave the database column untouched so existing stored data is preserved, but stop exposing it as editable agent-form data.

- [ ] **Step 4: Remove the form field and type property**

Delete `knowledge` from `AgentInput`, the `useForm` initial data, and the form JSX. The dialog should end after `instructions`, followed by its existing footer.

- [ ] **Step 5: Run the focused test**

Run: `php artisan test --compact packages/telephony/tests/TelephonyEndpointsTest.php`

Expected: PASS, including agent create/update behavior and team scoping.

- [ ] **Step 6: Commit**

```bash
git add packages/telephony/src/Http/Requests/StoreAgentRequest.php packages/telephony/src/Http/Controllers/AgentController.php resources/js/pages/agents/index.tsx resources/js/types/index.ts packages/telephony/tests/TelephonyEndpointsTest.php
git commit -m "refactor: remove inline agent knowledge"
```

### Task 2: Add Shared Setup Progress

**Files:**

- Create: `resources/js/components/telephony-setup-progress.tsx`
- Modify: `resources/js/types/telephony.ts`

- [ ] **Step 1: Define the setup state shape**

Create a component accepting `phoneNumbersCount`, `agentsCount`, and `knowledgeSourcesCount`, plus the current team slug. Derive completion as `phoneNumbersCount > 0`, `agentsCount > 0`, and `knowledgeSourcesCount > 0`.

- [ ] **Step 2: Render accessible progress semantics**

Render a labeled section with three ordered steps. Each step must include its number, title, explanatory text, and a descriptive Wayfinder link to `/phone-numbers`, `/agents`, or `/knowledge`. Use text and icons for completion, not color alone.

- [ ] **Step 3: Keep completed users unobstructed**

When all three steps are complete, render a compact “Setup complete” state with management links rather than a large onboarding card.

- [ ] **Step 4: Run frontend checks**

Run: `npm run types:check`

Expected: PASS once the component and props are wired with the existing route helper signatures.

- [ ] **Step 5: Commit**

```bash
git add resources/js/components/telephony-setup-progress.tsx resources/js/types/telephony.ts
git commit -m "feat: add telephony setup progress"
```

### Task 3: Improve First-Time Page Flows

**Files:**

- Modify: `packages/telephony/src/Http/Controllers/AgentController.php`
- Modify: `packages/telephony/src/Http/Controllers/PhoneNumberController.php`
- Modify: `packages/telephony/src/Http/Controllers/KnowledgeController.php`
- Modify: `resources/js/pages/phone-numbers/index.tsx`
- Modify: `resources/js/pages/agents/index.tsx`
- Modify: `resources/js/pages/knowledge/index.tsx`

- [ ] **Step 1: Return the counts needed by the progress component**

Add `agentsCount` and `knowledgeSourcesCount` to the phone-number page props, `phoneNumbersCount` and `knowledgeSourcesCount` to the agent page props, and `phoneNumbersCount` to the knowledge page props. Compute them from the current team relationship queries.

- [ ] **Step 2: Add progress to each page**

Place `TelephonySetupProgress` below each page header. Use the current team slug and the returned counts. The component should be secondary once data exists, but visible enough to orient a first-time user.

- [ ] **Step 3: Make phone numbers the strongest first step**

For zero phone numbers, use a prominent empty state that explains a number is required to make calls reachable and opens the existing number dialog. If agents already exist, mention that assigning an agent is the next step after adding a number.

- [ ] **Step 4: Make agents depend contextually on numbers**

For zero agents with numbers present, make “Create your first agent” the primary empty-state action. For zero agents without numbers, keep the phone-number action primary and explain why the order matters. Add a secondary knowledge link only when an agent exists.

- [ ] **Step 5: Make knowledge depend contextually on agents**

For zero agents, show “Create an agent first” with a direct agents link. For agents with zero sources, show each agent’s source action and an overview message explaining that sources are managed per agent. Preserve the existing processing/failed status badges.

- [ ] **Step 6: Verify keyboard and responsive behavior**

Ensure every setup action is a native `Link` or `Button`, headings remain sequential, icons are decorative where adjacent text supplies the label, and the progress layout collapses cleanly on narrow screens.

- [ ] **Step 7: Commit**

```bash
git add packages/telephony/src/Http/Controllers/AgentController.php packages/telephony/src/Http/Controllers/PhoneNumberController.php packages/telephony/src/Http/Controllers/KnowledgeController.php resources/js/pages/phone-numbers/index.tsx resources/js/pages/agents/index.tsx resources/js/pages/knowledge/index.tsx
git commit -m "feat: guide first-time telephony setup"
```

### Task 4: Verify the Complete Change

**Files:**

- Test: `packages/telephony/tests/TelephonyEndpointsTest.php`
- Test: `packages/telephony/tests/TelephonyModelsTest.php`

- [ ] **Step 1: Run PHP formatting and tests**

Run: `vendor/bin/pint --dirty --format agent && php artisan test --compact`

Expected: formatting succeeds and all tests pass.

- [ ] **Step 2: Run static and frontend verification**

Run: `vendor/bin/phpstan analyse --no-progress && npm run check && npm run types:check && npm run build`

Expected: PHPStan, frontend checks, TypeScript, and the production build all pass.

- [ ] **Step 3: Inspect the final diff**

Run: `git status --short --branch && git diff HEAD~3..HEAD --check`

Expected: only the planned files are changed and no whitespace errors are reported.
