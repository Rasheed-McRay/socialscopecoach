# Hybrid model strategy

Keep the depth of Pro where it matters (full conversation analysis) and Flash where speed matters more than nuance (short daily monologues).

## Changes

### 1. `supabase/functions/analyze-conversation/index.ts`
Revert the model back to `google/gemini-2.5-pro` (it was switched to flash in the previous turn). Restore the original comment.

### 2. `supabase/functions/analyze-monologue/index.ts`
No change — already on `google/gemini-2.5-flash`.

### 3. `src/components/ProcessingState.tsx`
The auto-animating progress bar currently assumes one set of stage durations. Pro analyses take noticeably longer than Flash, so a single estimate will feel inaccurate for one path or the other.

Add an optional `pace` prop (`"fast" | "deep"`, default `"deep"`) that swaps the `estMs` values for the `analyzing` stage:
- `deep` (Pro / conversation): analyzing ~22s to approach cap
- `fast` (Flash / monologue): analyzing ~9s to approach cap

Transcribing and uploading estimates stay the same for both.

### 4. Callers pass the right pace
- `src/pages/Record.tsx` → `<ProcessingState pace="deep" ... />`
- Wherever the Daily Scope monologue renders `ProcessingState` (search for usage) → `pace="fast"`

If Daily Scope doesn't currently use `ProcessingState`, skip step 4b — the default still works.

## Out of scope
- No streaming of the AI response (would require larger refactor of the edge function + client).
- No changes to scoring/prompts.
- No changes to credit/usage logic.
