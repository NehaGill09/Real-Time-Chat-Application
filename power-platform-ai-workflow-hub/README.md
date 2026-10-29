# Power Platform AI Workflow Hub

A portfolio-ready, project-level blueprint for streamlining internal business requests with Microsoft Power Platform and AI.

> **Project status:** Design prototype / implementation blueprint. This repository documents a proposed solution and illustrative artifacts; it does not claim a live Power Platform deployment or tested Microsoft 365 integrations.

## Business scenario

Employees submit requests for help with access, equipment, onboarding, or common workplace processes. The solution centralizes intake, tracks status, routes requests to the right team, and provides an AI-assisted self-service experience.

## Proposed architecture

- **Power Apps:** canvas app for submitting requests and viewing request status.
- **Power Automate:** notify the responsible team, route requests, and send status updates.
- **SharePoint:** document library for process guidance and a list for a lightweight prototype.
- **Dataverse:** recommended structured data layer for scalable records, relationships, and role-based access.
- **Copilot Studio:** conversational assistant to answer approved FAQs and guide users through request submission.
- **Microsoft Copilot:** assist makers with drafting formulas, flow expressions, summaries, and documentation, with human review.

## Example workflow

1. An employee submits a request with category, description, priority, and contact details.
2. The request is saved and assigned a unique reference number.
3. Power Automate routes the request based on category and sends a confirmation.
4. The assigned team updates the status.
5. The employee receives a notification when the request changes or is completed.
6. Copilot Studio answers common questions using approved knowledge and directs unresolved cases to the request form.

## Repository guide

- `docs/solution-architecture.md` — architecture, assumptions, and security considerations.
- `docs/data-model.md` — proposed SharePoint and Dataverse structures.
- `docs/power-automate-flows.md` — flow trigger, actions, routing, and error-handling plans.
- `docs/power-apps.md` — screen plan and illustrative Power Fx formulas.
- `docs/copilot-studio.md` — conversation topics, guardrails, and escalation behavior.
- `samples/requests.csv` — fictional sample data for design and testing.

## Suggested implementation plan

1. Build a small proof of concept with a SharePoint list and a Power Apps form.
2. Create a Power Automate flow for acknowledgement and routing.
3. Add status notifications and a failure-handling path.
4. Connect a Copilot Studio agent to approved FAQ content.
5. Evaluate Dataverse if security, relational data, or scale requirements justify it.
6. Test permissions, accessibility, failure paths, and AI answers before pilot rollout.

## Configuration and prerequisites

A Microsoft 365 / Power Platform environment with appropriate licensing and permissions may be required. Exact licensing depends on the connectors and services selected. Never commit credentials, tenant identifiers, customer data, or environment-specific secrets to this repository.

## Portfolio note

This project demonstrates solution planning and sample artifacts across Power Apps, Power Automate, SharePoint, Dataverse, Copilot Studio, and Microsoft Copilot. Replace the design status with verified implementation details only after you build and test the solution in your own environment.
