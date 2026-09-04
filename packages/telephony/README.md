# Telephony

The Telephony package provides the team-owned voice domain used by the application.

## Responsibilities

- Store agent configuration, including one editable knowledge text field.
- Store team-owned Twilio phone numbers, including numbers awaiting agent assignment.
- Store call history and JSON message transcripts.
- Store private agent knowledge sources from text, URLs, and supported attachments.
- Provide team-scoped dashboard data and creation endpoints.

## Deliberate MVP Limits

The package does not purchase or port phone numbers, call Twilio, parse PDFs, manage FAQs, create embeddings, or perform vector search. URL sources only fetch public HTTP(S) addresses; redirects are rejected and the resolved address is pinned for the request. This is not a replacement for network-level egress controls.

## Models

- `Agent` belongs to a team and has many phone numbers and calls.
- `PhoneNumber` belongs to a team and may be assigned to an agent later.
- `Call` belongs to a team, agent, and phone number.
- `AgentKnowledgeSource` belongs to an agent and stores its processed content and source status.

The host application supplies `App\Models\Team` through `config/telephony.php`. HTTP routes remain in the host application so they can use the application’s existing team middleware.

## Installation

This repository registers the package as a local Composer path repository. After installing dependencies, Laravel discovers `TelephonyServiceProvider` automatically and loads the package migrations.

## Migrations

- `2026_09_04_000001_create_agents_table`
- `2026_09_04_000002_create_phone_numbers_table`
- `2026_09_04_000003_create_calls_table`
- `2026_09_04_000004_create_agent_knowledge_sources_table`
- `2026_09_04_000005_add_processing_at_to_agent_knowledge_sources_table`

Knowledge attachments use the dedicated `filesystems.knowledge_disk` configuration key, which defaults to the private `knowledge_private` disk and is independent of the application default disk.
Plain-text source content and plain-text attachments are limited by `telephony.knowledge.max_text_bytes`; deleting an agent or team also removes private source files.
