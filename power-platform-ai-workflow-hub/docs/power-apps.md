# Power Apps Design

## Suggested screens

1. **Home** — short explanation, new request button, and the user's recent requests.
2. **New Request** — title, description, category, and priority fields with validation.
3. **My Requests** — requests filtered to the signed-in user, with status and reference.
4. **Request Details** — status, assignment, timestamps, and requester-safe notes.
5. **Triage (staff only)** — assign and update requests, subject to data-source permissions.

## Illustrative Power Fx

These snippets are examples to adapt to the actual control and data-source names. They have not been tested in a tenant.

### Validate a request form before submit

```powerfx
If(
    IsBlank(Trim(txtTitle.Text)) || IsBlank(Trim(txtDescription.Text)),
    Notify("Enter a title and description.", NotificationType.Error),
    SubmitForm(frmNewRequest)
)
```

### Show the signed-in user's requests

For a SharePoint list with a text column named `RequesterEmail`:

```powerfx
Filter(
    ServiceRequests,
    Lower(RequesterEmail) = Lower(User().Email)
)
```

This is a user-experience filter, not a substitute for securing the underlying data source.

### Reset the form after a successful save

Set the form's `OnSuccess` property to:

```powerfx
Notify("Your request was submitted.", NotificationType.Success);
ResetForm(frmNewRequest);
Navigate(scrHome)
```

## Accessibility and usability

- Label every input and provide clear required-field messages.
- Use status text as well as color to communicate progress.
- Support keyboard navigation and sufficient contrast.
- Show useful loading, empty, and error states.
- Confirm before destructive actions.
- Test on the intended browser and mobile layouts.
