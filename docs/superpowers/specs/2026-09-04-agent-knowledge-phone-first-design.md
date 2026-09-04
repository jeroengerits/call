# Agent Knowledge and Phone-First Setup Design

**Status:** Approved

## Goal

Allow a team to attach URLs, text, and private file uploads to an agent, process each source asynchronously, and make a phone number the first and most prominent setup step before agent configuration.

## Architecture

Knowledge sources live in the `packages/telephony` package as an `AgentKnowledgeSource` model related to `Agent`. The source record stores normalized metadata and processing state; a queued package job performs URL fetching and text extraction without coupling ingestion to the agent model. Attachments use the host application's private filesystem and are never publicly addressable.

The existing `agents.knowledge` field remains during this change for safe migration, but new knowledge UI writes source records. Retrieval, embeddings, vector search, and call-time context injection are intentionally deferred.

## Data Model

Create `agent_knowledge_sources` with:

- `agent_id` foreign key with cascade delete.
- `type` enum-like string: `url`, `text`, `attachment`.
- `title` nullable string.
- `url` nullable text.
- `content` nullable long text for entered or extracted text.
- `storage_path` nullable string for private attachments.
- `original_filename` nullable string.
- `mime_type` nullable string.
- `file_size` nullable unsigned integer.
- `status` string defaulting to `pending`: `pending`, `processing`, `ready`, `failed`.
- `error_message` nullable text.
- timestamps.

The model uses a PHP `KnowledgeSourceType` enum and `KnowledgeSourceStatus` enum. A source belongs to one agent; an agent has many sources. All controller lookups resolve the agent through the current team relationship.

## Ingestion

Creating a URL, text source, or attachment persists the source as `pending` and dispatches `ProcessAgentKnowledgeSource` to the database queue. The job marks it `processing`, extracts content, then marks it `ready`; exceptions mark it `failed` and persist a user-safe error message. Retries are supported through an explicit retry endpoint that resets the source to `pending` and dispatches the job again.

Supported attachment types are `.txt`, `.md`, `.pdf`, `.csv`, and `.json`, with a clear request size limit. Text extraction is isolated behind a package service so later parsers or indexing can be added without changing controllers. URL fetching uses an HTTP timeout and rejects unusable responses. No arbitrary remote URL is used as a browser download target.

## HTTP and UI

Add team-scoped package endpoints for listing, creating, retrying, and deleting sources. Upload requests use multipart validation; URL and text requests use dedicated request classes. Destructive deletion requires an accessible shadcn `AlertDialog` confirmation.

The agent page gets a Knowledge card with a compact source list. A shadcn `Tabs` control switches between URL, text, and attachment inputs. Each source displays its title/type, status badge, timestamp, and contextual actions. Failed sources expose Retry; processing sources expose a non-blocking status; empty state explains the three available source types.

Phone-first setup changes the dashboard and agent flow:

1. The dashboard presents Connected phone numbers as the primary setup card and primary CTA.
2. If no number exists, the dashboard explains that an agent cannot receive calls until a number is assigned and directs the user to add one.
3. Agent creation remains available, but the number page is first in the sidebar and the agent page surfaces a clear “Add a phone number first” prompt when the team has none.
4. Once a number exists, the dashboard can show agent and call activity as secondary information.

## Error Handling and Authorization

The existing `auth`, `verified`, and `EnsureTeamMembership` middleware remain the tenancy boundary. Every source mutation, retry, and delete scopes through the team-owned agent relationship. Validation errors return through Inertia field errors. Processing failures remain on the source row and do not block unrelated agent or source management.

## Testing

Add package tests for:

- Source relationships, enum casts, factories, and cascade deletion.
- URL, text, and attachment validation.
- Team isolation for listing, mutation, retry, and deletion.
- Private attachment storage and metadata persistence.
- Queue dispatch and job status transitions for success and failure.
- Retry resetting failed sources.
- Agent page source serialization.
- Phone-first dashboard state and navigation URLs.

Frontend verification covers type-checking, linting, and production build. PHP verification runs Pint, the focused package tests, the full test suite, and PHPStan.
