ROLE: EXECUTE PROJECT TASKS WITH STRICT CONSTRAINT ADHERENCE

## SCOPE

- Repository root: `NoteBranch/`
- Main app: `app/desktop/`
- Canonical technical doc: `docs/tech/README.md`
- User guide: `docs/USER_GUIDE.md`

## PRIORITY / TRADE-OFF VECTOR

1. CORRECTNESS
2. SAFETY
3. STABILITY
4. MINIMAL CHANGE SURFACE
5. TEST COMPLETION

## EXECUTION PROTOCOL

1. VERIFY ASSUMPTIONS BEFORE EDITING.
2. PLAN MINIMAL, BOUNDED CHANGES.
3. PRESERVE PUBLIC INTERFACES AND EXISTING BEHAVIOR UNLESS REQUESTED.
4. RUN RELEVANT VALIDATION BEFORE FINAL RESPONSE.
5. DOCUMENT WHAT CHANGED, WHAT WAS TESTED, AND WHAT WAS NOT TESTED.

## WORKFLOW COMMANDS

Run from repository root unless specified.

- `<RUN:run-build>` -> `cd app/desktop && pnpm run build`
- `<RUN:run-test>` -> `cd app/desktop && pnpm run test`
- `<RUN:run-test:unit>` -> `cd app/desktop && pnpm run test`
- `<RUN:run-test:integration>` -> `cd app/desktop && pnpm run test:integration`
- `<RUN:run-lint>` -> `cd app/desktop && pnpm run lint`
- `<RUN:run-format>` -> `cd app/desktop && pnpm run format`
- `<RUN:run-coverage>` -> `cd app/desktop && pnpm run test:coverage && pnpm run coverage:check`
- `<RUN:run-dev>` -> `cd app/desktop && pnpm run dev`
- `<RUN:run-docs>` -> update docs and verify links/paths are valid
- `<RUN:run-benchmark>` -> not defined in current scripts; do not invent commands

## CODE STYLE & ARCHITECTURE CONSTRAINTS

- PRESERVE PUBLIC INTERFACES
- MATCH EXISTING MODULE BOUNDARIES
- KEEP FUNCTIONS SMALL AND SINGLE-PURPOSE
- CENTRALIZE CONSTANTS; NO MAGIC VALUES
- HANDLE ERRORS EXPLICITLY; NO SILENT FAILURES
- AVOID GLOBAL MUTATION
- PREFER PURE HELPERS OVER INLINE LOGIC
- MINIMIZE SIDE EFFECTS
- REUSE EXISTING PATTERNS AND NAMING

## TESTING REQUIREMENTS

- ADD OR UPDATE TESTS FOR ALL BEHAVIOR CHANGES
- COVER NEW EDGE CASES
- MAINTAIN OR INCREASE COVERAGE
- RUN RELEVANT TESTS BEFORE FINAL RESPONSE
- DOCUMENT SKIPPED TESTS WITH REASON
- 90% COVERAGE TARGET

## VALIDATION MINIMUMS

- CODE LOGIC CHANGE: targeted tests + lint
- BUILD/STARTUP/PACKAGING CHANGE: build + targeted tests
- DOCS-ONLY CHANGE: link/path integrity check
- HIGH-RISK CHANGE: prefer broader test sweep

## SECURITY & SAFETY RED LINES

- NO SECRET EXPOSURE
- NO AUTHZ BYPASS
- NO INPUT VALIDATION REMOVAL
- NO DESTRUCTIVE ACTIONS WITHOUT CONFIRMATION
- NO TELEMETRY OR NETWORK ADDITIONS WITHOUT APPROVAL
- NO DISABLING SAFETY CHECKS

## DO / DON'T MATRIX

| DO                                 | DON'T                      |
| ---------------------------------- | -------------------------- |
| VERIFY ASSUMPTIONS                 | GUESS UNCERTAIN BEHAVIOR   |
| MAKE MINIMAL DIFFS                 | REWRITE UNRELATED AREAS    |
| ADD TESTS FOR NEW LOGIC            | SKIP TESTS FOR SPEED       |
| PRESERVE PUBLIC INTERFACES         | BREAK PUBLIC CONTRACTS     |
| HANDLE FAILURES EXPLICITLY         | SWALLOW ERRORS             |
| FOLLOW EXISTING PATTERNS           | INTRODUCE NEW STYLE        |
| UPDATE DOCUMENTATION WHEN REQUIRED | LEAVE DOCS STALE           |
| CHECK EDGE CASES                   | IGNORE BOUNDARIES          |
| CONFIRM DESTRUCTIVE STEPS          | APPLY IRREVERSIBLE CHANGES |

## CANONICAL CODE PATTERNS

```pseudo
function DO_TASK(input):
  assert valid(input)
  result = WORK(input)
  if error(result): return FAILURE(error)
  return SUCCESS(result)
```

```pseudo
const CONFIG = {
  NAME: "value",
  LIMIT: 123
}
```

```pseudo
try:
  outcome = ACTION()
catch error:
  LOG(error)
  return FAILURE(error)
```

```pseudo
if CONDITION:
  APPLY_CHANGE()
else:
  NO_OP()
```
