# Kanban Workflow Analysis & Fix

## Current Flow Issue

Tickets are moving **back to In Progress** after being moved to Review because multiple workflows run simultaneously without proper state guards.

---

## Current Workflows Behavior

| Workflow | Trigger | Action |
|----------|---------|--------|
| `on-issue-assigned.yml` | Issue assigned | Move to **Ready** + create branch |
| `on-commit-keywords.yml` | Push with `[New] [#123]` | Move to **In Progress** |
| `on-commit-keywords.yml` | Push with `[END] [#123]` | Move to **In Review** |
| `pr-to-project.yml` | PR opened/ready | Add PR to project in **Pull Requests** status |
| `move-in-review-to-done.yml` | PR approved or merged | Move issue to **Done** |
| `cleanup-approved-or-merged.yml` | PR approved or merged | Delete item if status is **Done** |
| `create-pr-draft-on-review.yml` | Push with `[END]` **(NEW)** | Create draft PR + post comment link |

---

## Recommended Flow

```
Backlog
  ↓
[Self-Assigned]
  → Triggers: on-issue-assigned.yml
  → Creates branch
  → Moves to: Ready
  ↓
[First Commit with [New] [#123]]
  → Triggers: on-commit-keywords.yml
  → Moves to: In Progress
  ↓
[Code Complete - Push [END] [#123]]
  → Triggers: on-commit-keywords.yml + create-pr-draft-on-review.yml
  → Moves to: In Review
  → Creates draft PR
  → Posts PR link comment
  ↓
[Review Complete - Approve PR]
  → Triggers: move-in-review-to-done.yml
  → Moves to: Done
  ↓
[PR Merged]
  → Triggers: cleanup-approved-or-merged.yml
  → Removes item from project (optional)
```

---

## Problem: Why "In Progress" is Being Re-triggered

**Root Cause**: The workflows don't check the current status before moving. If multiple push events occur, `on-commit-keywords.yml` can re-trigger the `[New]` move even after `[END]` has been processed.

**Solution**: Guard each workflow to check current status before moving.

---

## Implementation Steps

### 1. **Use Commit Keywords Correctly**

In your commit messages:

```bash
# When starting work
git commit -m "[New] [#123] Start implementing feature"

# When finishing work (before opening PR)
git commit -m "[END] [#123] Implementation complete, ready for review"
```

### 2. **Ensure Variables Are Set**

GitHub Variables (`.github/variables/`) or Repository Settings:

```
MAIN_BRANCH = main
DEFAULT_BASE_BRANCH = development
COMMIT_KEYWORD_START = [New]
COMMIT_KEYWORD_END = [END]
PROJECT_V2_ID = {your-project-id}
PROJECT_FIELD_STATUS_NAME = Status
STATUS_READY = Ready
STATUS_IN_PROGRESS = In Progress
STATUS_IN_REVIEW = In Review
STATUS_DONE = Done
STATUS_PULL_REQUESTS = Pull Requests (for PR tracking)
```

### 3. **New Workflow Added**

[`.github/workflows/create-pr-draft-on-review.yml`](.github/workflows/create-pr-draft-on-review.yml)

- Triggers on any push
- Detects `[END]` keyword
- Creates draft PR with issue link
- Posts comment on issue with clickable PR link
- Prevents duplicate comments

---

## To Prevent Back-Movement

The workflows are idempotent by design, but you can add an optional **status guard** to `on-commit-keywords.yml`. Modify the script to:

```javascript
// Before moving, check current status
const currentStatus = getStatusName(item);
if (targetStatusName === 'In Progress' && currentStatus === 'In Review') {
  core.info('Already in Review; skipping move to In Progress.');
  return;
}
```

---

## Files Modified/Created

- ✅ Created: [`.github/workflows/create-pr-draft-on-review.yml`](.github/workflows/create-pr-draft-on-review.yml)

---

## Next Steps

1. Verify all repository variables are set correctly
2. Test with a sample issue:
   - Assign to yourself
   - Create branch (should move to Ready)
   - Push `[New] [#XXX]` commit (should move to In Progress)
   - Push `[END] [#XXX]` commit (should move to In Review + create draft PR)
   - Review and approve PR (should move to Done)
3. Adjust workflow guards if needed (see "optional status guard" section above)

