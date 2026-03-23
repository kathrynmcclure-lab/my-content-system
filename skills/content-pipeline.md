# Skill: Content Pipeline

A five-step pipeline that takes a content brief from ideation to a review-ready packet, with an auto-correcting style guide gatekeeper before anything reaches the content designer.

**References:**
- `CLAUDE.md` — brand values, voice, tone, and all style rules
- `skills/tone-checker.md` — tone-checking logic used in Steps 3 and 4

---

## How to invoke

> "Run the content pipeline for: [brief]"
> "Content pipeline — [audience], [content type]: [requirements]"

Run all five steps sequentially. Show output after each step so the user can follow progress and intervene if needed.

---

## Required inputs

Ask the user for these before starting if not already provided:

| Input | Description |
|-------|-------------|
| **Content brief** | Topic, goal, audience (D2C / B2B-IPN / Product-UX), and content type (email, push notification, UX copy, social post, IPN one-pager, etc.) |
| **Requirements** | Specific messaging, constraints, CTAs, or mandatories |
| **Reference files** *(optional)* | Paths to any project docs, strategy files, or briefs in the repo to pull additional context from |

---

## Step 1: Ideation and research

1. Read the brief and any referenced files the user provided.
2. Identify the audience mode (D2C / B2B-IPN / Product-UX) and content type.
3. Pull the relevant voice, tone, and brand values from `CLAUDE.md` for that audience.
4. Generate 2-3 content angles or concepts with a recommended direction.
5. State key messages, tone direction, and which style rules will be especially important for this specific content type.

**Output:**
```
## Step 1: Ideation
**Audience:** [D2C / B2B-IPN / Product-UX]
**Content type:** [email / push notification / UX copy / etc.]

**Angles considered:**
1. [Angle A — brief description]
2. [Angle B — brief description]
3. [Angle C — brief description]

**Recommended angle:** [chosen angle + rationale]

**Key messages:**
- [Message 1]
- [Message 2]
- [Message 3]

**Tone notes:** [what the right tone looks like for this specific piece]
**Style rules to watch:** [most relevant rules for this content type]
```

---

## Step 2: Draft creation

1. Use the recommended angle and key messages from Step 1.
2. Incorporate all user requirements (from brief or referenced files).
3. Write the first draft, applying the correct style guide rules for the detected audience from the start.
4. Follow structure conventions for the content type:
   - **Email:** Subject line → preheader → headline → body → CTA
   - **Push notification:** Short, action-driven headline (≤ 10 words) → optional body (≤ 20 words)
   - **UX copy:** Headline (sentence case) → body → CTA button (3-5 words, sentence case, no pronouns)
   - **Social post:** Hook → value → CTA
   - **IPN one-pager:** Bold claim → supporting evidence → CTA to connect

**Output:**
```
## Step 2: Draft
[Full first draft of the content, formatted for its content type]
```

---

## Step 3: Style guide verification

Apply the full rule set from `skills/tone-checker.md` for the detected audience. List every FAIL and WARN with the original text and suggested fix. This is a diagnostic pass only — do not rewrite yet.

**Output:**
```
## Step 3: Verification
**Audience mode:** [D2C / B2B-IPN / Product-UX]

### Issues found
- FAIL  [Rule name]: "[original text]"
  Fix: "[corrected text]"
- WARN  [Rule name]: "[original text]"
  Fix: "[corrected text]"

*(or: ✓ No issues found — proceed to Step 4)*
```

---

## Step 4: Gatekeeper

### Scoring formula
- Start at **100**
- Each **FAIL** deducts **10 points**
- Each **WARN** deducts **3 points**
- Minimum score is **0**

### Gate logic

| Score | Action |
|-------|--------|
| ≥ 80 | **PASS** — proceed to Step 5 |
| < 80 | **Auto-revise** — apply all FAIL and WARN fixes, re-run Step 3 scoring. Repeat up to 3 attempts. |
| < 80 after 3 attempts | **STOP** — show full details and ask the user to override or provide additional guidance |

### Auto-revision process
1. Apply every FAIL fix and WARN fix identified in Step 3.
2. Re-run the full Step 3 diagnostic on the revised content.
3. Recalculate the score.
4. If ≥ 80, pass. If still < 80, repeat up to 2 more times.

**Output:**
```
## Step 4: Gatekeeper
**Score: [X]/100**  [PASS ✓ / FAIL ✗]

*(If auto-revised:)*
Draft score: [X] → Revision 1: [X] → Revision 2: [X] → Final: [X]

**Status:** Passed on first attempt / Passed after [N] revision(s) / Override required

*(If override required:)*
The content scored [X]/100 after 3 revision attempts.
Remaining issues:
- [list of unresolved FAILs and WARNs]
How would you like to proceed? Override and send to review, or provide additional guidance?
```

---

## Step 5: Review packet

Produce a clean, self-contained review packet ready to paste into Slack, email, or a doc. The reviewer should have everything they need without needing additional context.

**Output:**
```
---
## Content Review Packet
**Date:** [today's date]
**Requested by:** [user's name if known]
**Content type:** [type]
**Audience:** [D2C / B2B-IPN / Product-UX]
**Pipeline score:** [X]/100

---
### Final copy

[The gate-passing version of the content, formatted for its content type]

---
### Reviewer notes

**Revision summary:** [What changed from draft to final, if applicable. "No revisions required" if first-pass pass.]

**Remaining judgment calls:** [Any WARNs that passed the gate but warrant human review — e.g., tone calls, brand voice nuances. "None" if clean.]

---
### To approve, reply with:
- ✅ Approved
- 🔁 Revise — [your feedback]
- ❌ Reject — [reason]
---
```

---

## Quick reference: scoring thresholds

| Score | Meaning |
|-------|---------|
| 90-100 | Excellent — clean or near-clean first draft |
| 80-89 | Good — minor issues caught and fixed |
| 70-79 | Needs work — auto-revision attempted but fell short; human review required |
| < 70 | Significant issues — multiple rule violations; likely needs a brief revision or clearer requirements |
