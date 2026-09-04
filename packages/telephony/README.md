# Telephony

The Telephony package provides the team-owned voice domain used by the application.

## Responsibilities

- Store agent configuration, including one editable knowledge text field.
- Store manually assigned Twilio phone numbers.
- Store call history and JSON message transcripts.
- Provide team-scoped dashboard data and creation endpoints.

## Deliberate MVP Limits

The package does not purchase or port phone numbers, call Twilio, process documents, manage FAQs, create embeddings, or perform vector search.

## Models

- `Agent` belongs to a team and has many phone numbers and calls.
- `PhoneNumber` belongs to a team and agent.
- `Call` belongs to a team, agent, and phone number.

The host application supplies `App\Models\Team` through `config/telephony.php`. HTTP routes remain in the host application so they can use the application’s existing team middleware.

## Installation

This repository registers the package as a local Composer path repository. After installing dependencies, Laravel discovers `TelephonyServiceProvider` automatically and loads the package migrations.
