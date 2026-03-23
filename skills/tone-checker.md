# Skill: Tone Checker

Check any piece of content against the Ox & Adder voice and tone guidelines in `CLAUDE.md`.

---

## How to invoke

Paste content and ask to check tone. Example:
> "Check the tone of this: [content]"
> "Tone check this email copy."
> "Does this button copy follow our guidelines?"

---

## Step 1: Auto-detect audience

Before checking rules, determine which audience mode applies based on signals in the content:

| Signal | Audience mode |
|--------|--------------|
| UI elements: button copy, error messages, empty states, navigation labels, modal copy, toast messages | **Product / UX** |
| B2B terms: "advertisers," "publishers," "retailers," "IPN," "CPG," "performance marketing," "ROAS," "incremental," "pay-per-sale," "closed-loop" | **B2B / IPN** |
| Everything else | **D2C (consumer)** |

Always state the detected mode at the top of the output so the user can correct it if wrong.

---

## Step 2: Apply the rule set for the detected audience

### D2C rules

1. **Active voice** — Flag "was/were + past participle" constructions.
   - FAIL: "Cash back was earned by you." → "You earned cash back."

2. **Contractions** — Flag written-out forms that should be contractions.
   - FAIL: "you will," "we cannot," "it is," "you are," "we are," "do not," "they will"

3. **Word usage** — Flag any banned or incorrect words from the style guide:
   - `cashback` → `cash back`
   - `rebate(s)` / `coupon(s)` / `points` → `offer(s)`
   - `users` / `customers` / `shoppers` → `people`, `you`, or `<Name>`
   - `invalid` → `incorrect` or `wrong`
   - `verify` (for offers) → `match` or `matched`
   - `upload` (for receipts) → `submit`
   - `view` → `see`
   - `select` → `choose`, `click`, or `tap`
   - `in store` / `instore` → `in-store`
   - `e-mail` → `email`
   - `e-commerce` / `eCommerce` → `ecommerce`
   - `cancelled` → `canceled`
   - `double check` / `doublecheck` → `double-check`
   - `OK` / `O.K.` / `Okay` → `Ok`
   - `My [anything]` (navigation) → `Your [anything]`

4. **Exclamation points** — Flag more than 1 per paragraph. Flag any exclamation point in error messages, failure states, or alerts.

5. **Formal/corporate language** — Flag words that are too stiff for D2C:
   - WARN: "utilize" → "use"
   - WARN: "leverage" (non-IPN context) → "use" or "take advantage of"
   - WARN: "in order to" → "to"
   - WARN: "please note" → rewrite conversationally

6. **Pronoun rules** — Flag "I" or "me" used to refer to Ox & Adder. Flag "my" in navigation labels.

7. **Sentence case** — Flag headlines, CTAs, or button copy written in Title Case when Sentence case is expected.

8. **Readability** — WARN on sentences that are likely above grade 6: very long sentences (20+ words), multiple clauses, or complex vocabulary.

9. **Tone guardrails** — WARN on:
   - Overly casual or trendy language (slang, internet speak)
   - Overly pushy or micromanaging language ("you need to," "you must," "make sure you")
   - Overbearing or coach-y language

---

### B2B / IPN rules

1. **Active voice** — Same as D2C.

2. **Word usage** — Flag incorrect audience terms:
   - `clients` / `CPG brands` (when referring to network participants) → `advertisers`, `publishers`, or `retailers`
   - `Savers` (in B2B context) → `consumers`
   - `shoppers` (in Sales collateral) → `consumers`

3. **IPN naming** — Flag incorrect ways to refer to the network:
   - FAIL: "Ox & Adder's IPN" → "Ox & Adder Performance Network" or "IPN"
   - FAIL: "The Performance Network" → "Ox & Adder Performance Network"
   - FAIL: "The Network" → "IPN" or "Ox & Adder Performance Network"
   - FAIL: IPN used without being spelled out on first reference → spell out "Ox & Adder Performance Network (IPN)" first

4. **Ox & Adder name** — Flag:
   - `ox & adder` (lowercase) → `Ox & Adder`
   - `OX & ADDER` (all caps) → `Ox & Adder`
   - `Ox & Adder's [product]` (possessive with logo/product) → "the Ox & Adder [product]"

5. **Acronym expansion** — Flag initialisms used before being defined on first reference (IPN, FAR, CPG, etc.).

6. **Tone guardrails** — WARN on:
   - Overly casual or D2C-style language (too playful, too informal)
   - Overly friendly tone that undermines professional credibility

---

### Product / UX rules

1. **Sentence case** — Flag Title Case in buttons, labels, body copy, error messages, and toasts. Navigation elements are the exception (they use Title Case — do not flag those).

2. **Button copy** — Flag buttons that:
   - Exceed 5 words
   - Use pronouns ("my," "your," "I")
   - Go to two lines (flag as a warning if copy is long)

3. **Error messages** — Flag any that:
   - Blame the user ("you entered the wrong," "you failed to," "your mistake")
   - Contain an exclamation point
   - Exceed 2 lines for input field errors

4. **Period usage**:
   - FAIL: Missing period at end of body copy, error messages, toasts, confirmations, or list items that are full sentences
   - FAIL: Period present at end of a headline or subheadline

5. **Word usage** — Same banned words as D2C, plus:
   - `view` → `see`
   - `select` → `choose`, `tap`, or `click`
   - `upload` (for receipts) → `submit`
   - `capture` → `scan`
   - `picture` / `image` → `photo`
   - `My [X]` → `Your [X]`
   - `Sign-in` (noun) → `login`
   - `log in to` (when logging in IS the action) → `log into`

6. **Click vs. tap** — Flag "click" in clearly mobile contexts or "tap" in clearly web contexts when the platform is identifiable.

---

## Step 3: Output format

```
## Tone Check: [D2C / B2B-IPN / Product-UX]
*Auto-detected. If this is wrong, specify the audience and re-run.*

### Issues found
- FAIL  [Rule name]: "[original text]"
  Fix: "[corrected text]"
- WARN  [Rule name]: "[original text]"
  Fix: "[corrected text]"

### Suggested rewrite
[Full corrected version of the content]
```

- `FAIL` = clear violation of a named style rule
- `WARN` = judgment call or tone issue that isn't a hard rule violation
- If no issues found: `✓ No issues found. Content matches [audience] voice and tone guidelines.`

Always end with a **Suggested rewrite** section containing the full corrected content, even if only minor fixes were made.
