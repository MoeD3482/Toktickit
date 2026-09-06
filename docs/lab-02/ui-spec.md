# Lab 2 UI Specification

## 1. Purpose

This document defines the approved user-interface contract for the TokTickIT Lab 2 Requester-facing application.

The Lab 2 UI provides:

- Development Requester Selection
- Application shell and navigation
- Create Ticket
- My Tickets
- Requester Ticket Detail
- Attachment management
- Loading, validation, success, empty, no-results, and failure states
- Responsive desktop, tablet, and mobile behavior

The UI must remain consistent across all Lab 2 screens and must follow the Zen Green visual language required by the Lab 2 handout.

---

## 2. Design Principles

The Lab 2 interface shall follow these principles:

1. Use a consistent Zen Green theme.
2. Keep screens simple and readable.
3. Reuse common form, button, badge, card, table, validation, and feedback styles.
4. Clearly distinguish editable and read-only information.
5. Never rely on color alone to communicate status or meaning.
6. Keep validation messages close to the related field.
7. Preserve visible keyboard focus.
8. Keep all required actions usable on desktop, tablet, and mobile.
9. Avoid horizontal page scrolling.
10. Provide explicit loading, empty, success, and error states.

---

## 3. Color Tokens

| Token | Value | Use |
|---|---|---|
| Primary Green | `#006B3C` | Header, primary actions, strong emphasis |
| Secondary Green | `#0B7A46` | Active navigation, links, focus accents, hover states |
| Pale Green | `#EAF6EF` | Success surfaces, selected states, subtle emphasis |
| Page Background | `#F5F7F6` | Main application background |
| Surface | `#FFFFFF` | Cards, forms, tables, panels |
| Primary Text | `#1F332A` | Main readable text |
| Muted Text | `#5F6F67` | Secondary labels and metadata |
| Neutral Border | `#CED8D2` | Form and card borders |
| Read-only Background | `#F1F4F2` | Read-only and generated fields |
| Error | `#B3261E` | Validation and destructive feedback |
| Warning | `#A66500` | Warning callouts |
| Success | `#006B3C` | Successful states and confirmations |

Status, priority, warning, and error information must include readable text and must not depend only on color.

---

## 4. Typography

TokTickIT shall use the standard Bootstrap/system font stack.

### Heading hierarchy

- Page title: clear and prominent
- Section title: smaller than page title
- Form labels: medium weight
- Body text: standard readable size
- Metadata/help text: smaller but still readable

Text must remain readable without requiring zoom at supported viewport sizes.

---

## 5. Spacing and Layout

Bootstrap spacing and grid conventions should be used consistently.

General rules:

- Main content is centered.
- Desktop content uses a sensible maximum width.
- Cards and form sections use consistent internal padding.
- Related fields are grouped together.
- Major sections have visible spacing between them.
- Labels appear above controls.
- Validation messages appear immediately below related controls.

---

# 6. Application Shell

## 6.1 Required Elements

After a Development Requester is selected, the application shell must include:

- TokTickIT application identity
- My Tickets navigation
- Create Ticket navigation
- Current Development Requester display
- Change Requester action
- Clear active-page indication

Example navigation:

```text
TokTickIT | My Tickets | Create Ticket | Requester: Jennifer Anderson | Change Requester