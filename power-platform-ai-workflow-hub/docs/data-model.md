# Data Model

The design below is illustrative. Choose either SharePoint for a simple prototype or Dataverse for a more structured application; do not assume both are required at once.

## Request record

| Field | Type | Required | Notes |
|---|---|---:|---|
| RequestNumber | Autonumber / generated text | Yes | Human-readable reference |
| Title | Text | Yes | Short summary |
| Description | Multiline text | Yes | Avoid secrets and unnecessary sensitive data |
| Category | Choice | Yes | Access, Equipment, Onboarding, General |
| Priority | Choice | Yes | Low, Normal, High |
| Status | Choice | Yes | New, Assigned, In Progress, Waiting, Completed, Cancelled |
| RequesterEmail | Email / text | Yes | Use identity-based fields where available |
| AssignedTo | User / person | No | Staff responsible for the request |
| CreatedOn | Date/time | Yes | System-generated |
| UpdatedOn | Date/time | Yes | Updated on status changes |
| ResolutionNotes | Multiline text | No | Keep notes appropriate for the audience |

## Optional StatusHistory table

- HistoryId: primary key.
- RequestNumber: lookup to Request.
- PreviousStatus: choice.
- NewStatus: choice.
- ChangedBy: user reference.
- ChangedOn: date/time.
- Comment: text, subject to retention and privacy rules.

## SharePoint prototype

Create a list named `ServiceRequests` with columns corresponding to the request fields. Prefer built-in Created and Modified columns where appropriate. Restrict the list and views so requesters cannot see other people's requests unless that is an explicit requirement.

Create a document library named `ApprovedHelpArticles` for reviewed FAQ and process documents. Only designated content owners should publish knowledge articles.

## Dataverse option

Create a `Request` table and optionally a related `Request Status History` table. Use appropriate ownership, security roles, auditing, and relationships. Use Dataverse choices for Category, Priority, and Status.

## Data quality and access checks

- Enforce required fields at the app and data layers where possible.
- Derive requester identity from the authenticated session rather than trusting a user-entered email alone.
- Limit who can assign requests or mark them completed.
- Define retention, deletion, and audit expectations with the business owner.
