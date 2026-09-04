# First-Time Telephony Flow

## Goal

Make the first successful telephony setup obvious while keeping agents,
phone numbers, and knowledge independently usable. The setup order is:

1. Add a phone number.
2. Create an agent.
3. Add knowledge sources.

## Scope

- Remove the legacy inline `knowledge` textarea from the agent form.
- Remove `knowledge` from agent request validation, persistence, and page props
  where it is only used for that textarea.
- Keep knowledge exclusively in the dedicated knowledge-source pages.
- Add a shared, compact setup-progress treatment to the three setup pages.
- Each step shows its current state, explains the next useful action, and links
  directly to the next page.
- Empty states must remain actionable and must not prevent users from opening a
  page or using an existing resource.

## UX Behavior

- Phone numbers is step one. With no numbers, the page leads with adding a
  number and explains that a number makes an agent reachable.
- Agents is step two. With numbers but no agents, the page leads with creating
  an agent. With no numbers, it links back to phone numbers instead.
- Knowledge is step three. With no agents, it links to agents. With agents but
  no sources, it links each agent to its source setup.
- Completed steps display a concise completed state rather than repeating the
  full empty-state explanation.
- Existing users with data see the normal management layout, with the setup
  progress available but visually secondary.

## Data and Routes

- Use existing team-scoped props and named Wayfinder routes.
- Do not add a new persistence model or onboarding state. Completion is derived
  from the counts already returned by the controllers.
- Agent create and update payloads no longer include `knowledge`.
- Existing persisted knowledge values are not migrated or deleted; the field is
  simply no longer editable through the agent form.

## Accessibility

- Progress uses headings and text, not color alone, to communicate state.
- Every step action has descriptive link text.
- Empty-state actions remain keyboard reachable and use existing native/shadcn
  controls.
- Form errors remain associated with their fields after the knowledge field is
  removed.

## Verification

- Update endpoint tests to assert agent payloads no longer accept inline
  knowledge as part of the managed form contract.
- Run Pint, PHP tests, PHPStan, frontend checks, TypeScript, and the production
  build.
