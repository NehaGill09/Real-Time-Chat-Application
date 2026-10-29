# Solution Architecture

## Goal

Provide a single, trackable intake path for routine internal requests and reduce manual follow-up through workflow automation and self-service guidance.

## Components and responsibilities

| Component | Responsibility | Prototype choice |
|---|---|---|
| Power Apps | Request intake and status screen | Canvas app |
| Power Automate | Routing, notifications, status-change alerts | Cloud flows |
| SharePoint | Quick-start storage for requests and approved FAQ documents | List + document library |
| Dataverse | Relational, permission-aware data model for a more robust version | Optional production-oriented data layer |
| Copilot Studio | FAQ assistant and guided hand-off | Topics, knowledge, escalation |
| Microsoft Copilot | Maker assistance for formulas, expressions, summaries, and documentation | Human-reviewed assistance |

## Data flow

1. User submits a request from Power Apps.
2. The app validates required fields and writes a request record.
3. A flow triggers on creation and assigns a reference, routes the request, and sends confirmation.
4. Staff update assignment and status.
5. A second flow sends status updates and records failures for review.
6. Copilot Studio responds using approved knowledge and points users to the request form for transactional actions.

## Key design decisions

- Start with SharePoint for a low-complexity proof of concept if the tenant's permissions and requirements permit it.
- Consider Dataverse when relational integrity, granular security roles, auditing, or future expansion are important.
- Keep AI responses grounded in approved knowledge; do not allow the assistant to invent request status.
- Use least-privilege access and separate maker, operator, and end-user permissions.
- Use a dedicated service identity where organizational policy recommends it; manage connection ownership and recovery.

## Security and responsible AI

- Do not store passwords, access tokens, or secrets in app formulas, flow definitions, CSV files, or source control.
- Minimize personal data and define retention before production.
- Validate permissions on both the app and underlying data source.
- Avoid placing confidential data in prompts unless the organization's policies and configured services permit it.
- Require human review for consequential decisions; AI should assist, not silently approve sensitive requests.
- Test prompt injection, unsupported questions, data leakage, and escalation paths.

## Success measures

Track baseline and post-pilot values for:
- Average time from submission to acknowledgement.
- Percentage of requests correctly routed on first attempt.
- Number of manual follow-up messages.
- Self-service resolution rate for FAQ questions.
- Flow failure rate and time to recovery.
- User satisfaction from a short feedback question.

These are proposed metrics; no results are claimed until measured.
