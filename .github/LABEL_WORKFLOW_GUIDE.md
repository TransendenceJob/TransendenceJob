# Label Management & Workflow Validation

## What Was Fixed

### 1. **Label Validation in Commit Keywords**
**File**: `.github/workflows/on-commit-keywords.yml`

- **Before**: Workflow would move issues to "In Progress" or "In Review" based on commit keywords alone, even if issue had no type label
- **After**: Workflow now **validates that the issue has a valid type label** before moving
  - Valid types: `feature`, `bug`, `refactor`, `fix`
  - Skips movement if label is missing with clear warning

### 2. **Auto-Add Labels on Assignment**
**File**: `.github/workflows/on-issue-assigned.yml`

- **Before**: Would skip branch creation if issue lacked a type label
- **After**: 
  - Determines type from title tags `[feature]`, `[bug]`, `[refactor]`, `[fix]`
  - **Automatically adds the corresponding label** if missing
  - Creates branch and moves to "Ready" only after label is present

### 3. **Label Validation on Draft PR Creation**
**File**: `.github/workflows/create-pr-draft-on-review.yml`

- **Before**: Would create PR regardless of label presence
- **After**: Validates issue has a type label before creating draft PR
  - Skips PR creation if label is missing with clear warning

---

## How Label Workflow Now Works

```
Issue Created
  ↓
[No automatic labels added - issue must have a title tag or be manually labeled]
  ↓
[Self-Assigned]
  → on-issue-assigned.yml runs
  → Checks for [feature], [bug], [refactor], [fix] in title OR existing labels
  → If found: adds corresponding label (if missing)
  → Creates branch & moves to Ready
  → If NOT found: skips (does not add random labels)
  ↓
[First Commit [New] [#123]]
  → on-commit-keywords.yml runs
  → Validates issue has a valid type label
  → If label exists: moves to In Progress
  → If label missing: skips with warning
  ↓
[Code Complete [END] [#123]]
  → on-commit-keywords.yml runs + create-pr-draft-on-review.yml runs
  → Validates labels again
  → Moves to In Review
  → Creates draft PR
  → Posts link comment
  ↓
[Review & Approval → Done]
```

---

## Label Requirements

### Issue Title Tags (Auto-Detection)
Issues **must have one of these in the title** OR manually labeled:

```
[feature] - New feature
[bug]     - Bug fix
[refactor] - Code refactoring
[fix]     - Hotfix (merges to main instead of dev)
```

### Example Titles
✅ Valid:
- `[feature] Add user authentication`
- `[bug] Fix login redirect issue`
- `[refactor] Extract database logic`
- `[fix] Hotfix security vulnerability`

❌ Invalid (will be skipped):
- `Add user authentication` ← no tag, no label
- `Bug in login` ← no tag, no label

---

## Workflow Behavior Summary

| Workflow | Condition | Action |
|----------|-----------|--------|
| `on-issue-assigned.yml` | Has title tag OR label | Add label (if missing) + create branch + move to Ready |
| `on-issue-assigned.yml` | No title tag AND no label | **Skip** (does not move) |
| `on-commit-keywords.yml` | Has `[New]` + valid label | Move to In Progress |
| `on-commit-keywords.yml` | Has `[New]` + no label | **Skip with warning** |
| `on-commit-keywords.yml` | Has `[END]` + valid label | Move to In Review |
| `on-commit-keywords.yml` | Has `[END]` + no label | **Skip with warning** |
| `create-pr-draft-on-review.yml` | Has `[END]` + valid label | Create draft PR + post comment |
| `create-pr-draft-on-review.yml` | Has `[END]` + no label | **Skip with warning** |

---

## Repository Variables Required

Ensure these are set in GitHub repository variables:

```
LABEL_FEATURE = feature
LABEL_BUG = bug
LABEL_REFACTOR = refactor
LABEL_FIX = fix
COMMIT_KEYWORD_START = [New]
COMMIT_KEYWORD_END = [END]
```

---

## Troubleshooting

### Issue stuck and not moving?
1. Check GitHub Actions logs for warnings about missing labels
2. Verify issue has one of the type labels: `feature`, `bug`, `refactor`, `fix`
3. Add the label manually if needed: `github.com/repo/issues/123 → Labels → select type`

### Labels randomly changing?
- ✅ Fixed: Workflows now only add labels based on title tags, no random assignments
- They preserve existing labels and only add missing ones

### Ticket moved back to "In Progress" after "In Review"?
- ✅ Fixed: Workflows now validate label presence before any movement
- Multiple pushes without proper labels will not trigger unwanted moves
