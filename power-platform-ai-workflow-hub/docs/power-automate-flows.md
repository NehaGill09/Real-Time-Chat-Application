# Power Automate Flow Specifications

These are implementation plans, not exported or deployed cloud flows. Connector names and actions may differ by tenant and configuration.

## Flow A — Request intake and routing

**Trigger:** When an item is created in the SharePoint `ServiceRequests` list (or the equivalent Dataverse row trigger).

**Planned steps**
1. Validate that Title, Description, Category, and Requester identity are present.
2. Set Status to `New` if no initial value is supplied.
3. Route by Category to the configured support group or queue.
4. Notify the requester with the reference number and expected next step.
5. Notify the assigned team with a link to the request record.
6. Write diagnostic details to an approved operational log if a step fails.

**Routing example**
- Access → IT support
- Equipment → Workplace / IT support
- Onboarding → People operations
- General → Service desk triage

Replace these example teams with real owners only after approval.

## Flow B — Status change notification

**Trigger:** When a request record is modified.

**Planned steps**
1. Detect whether Status or AssignedTo changed; avoid notifying on unrelated edits.
2. Notify the requester when the status changes.
3. Send a completion message when Status becomes `Completed`.
4. Prevent duplicate notifications using change detection or a stored notification marker.
5. Capture failures and alert the flow owner.

## Flow C — Scheduled stale-request review (optional)

**Trigger:** Recurrence on a business-approved schedule.

**Planned steps**
1. Find requests that remain in `New`, `Assigned`, or `In Progress` beyond the agreed service threshold.
2. Notify the assigned team with a summary and record links.
3. Escalate only according to an approved support policy.
4. Exclude completed and cancelled requests.

## Reliability checklist

- Use scopes for Try / Catch / Finally patterns where appropriate.
- Configure retry policies thoughtfully and make repeated actions idempotent.
- Handle missing assignees and invalid categories.
- Test connector permission expiry and connection-owner departure.
- Use environment variables and connection references in managed solutions where applicable.
- Keep email bodies free of unnecessary sensitive details.
- Confirm notification recipients and list permissions before pilot launch.

## Acceptance tests

- Valid request receives a reference and acknowledgement.
- Each category routes to the expected configured team.
- Invalid or incomplete requests are rejected or flagged clearly.
- Status changes send one notification, not duplicates.
- Failed actions are visible to the owner and can be recovered.
- A requester cannot access another request unless policy allows it.
