# Copilot Studio Assistant Plan

## Purpose

Provide self-service answers for approved workplace FAQs and guide employees to the service request form when a human action or individualized investigation is required.

## Example topics

### Topic: How do I request equipment?
1. Recognize phrases such as “need a laptop” or “request a monitor.”
2. Explain the approved equipment-request process using the maintained knowledge source.
3. Offer a link to the Power Apps request form.
4. Ask whether the user needs help finding the form.
5. If unresolved, explain how to contact the service desk.

### Topic: Check a request
1. Explain which request identifier is needed.
2. Use an authenticated, permission-checked integration if live lookup is implemented.
3. Return only records the current user is authorized to view.
4. If no secure integration exists, direct the user to the app's My Requests screen rather than inventing a status.

### Topic: Talk to support
1. Acknowledge the user's issue.
2. Collect only the minimum information required for triage.
3. Link to the request form or the approved support channel.
4. Clearly state when the assistant cannot complete the action itself.

## Knowledge and grounding

- Use approved SharePoint help articles or another organization-approved source.
- Assign an owner and review date to each article.
- Exclude confidential lists and content not approved for broad access.
- Test citations / source links and behavior when no grounded answer is available.

## Guardrails

- Do not ask for passwords, MFA codes, access tokens, or payment details.
- Do not expose other users' requests or personal data.
- Do not claim a ticket was created unless a working, verified action confirms creation.
- Do not make HR, legal, security, or access-approval decisions autonomously.
- Provide a safe fallback for unclear questions and a route to human support.

## Evaluation plan

Test at least: common FAQ, ambiguous wording, unsupported question, prompt-injection attempt, request for another person's data, missing request number, and escalation. Record whether the answer is accurate, grounded, permission-safe, and clear about limitations.
