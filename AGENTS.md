# RBXC V2 Engineering Rules (`AGENTS.md`)

1. **Strict Separation of Core Math & Game Data (`src/core/`)**
   - All mathematical formulas, big-number parsing/formatting, time parsing/formatting, game constants, location multipliers, and simulation logic MUST live strictly inside `src/core/`.
   - Files inside `src/core/` MUST be pure TypeScript with **zero imports** from `react`, `react-dom`, `zustand`, `window`, `document`, or any browser/DOM APIs.

2. **Test Coverage Discipline (`Vitest`)**
   - Any addition or modification to formulas, multipliers, prices, parsing, or simulators in `src/core/` MUST be covered by unit tests in `src/core/__tests__/`.

3. **Mandatory Verification Gate**
   - After completing any task or code change, ALWAYS run:
     - `npm test`
     - `npm run build`
   - Both commands must exit with code `0` before finishing.
