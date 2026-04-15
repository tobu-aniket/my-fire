# Financial Goals Sheet — workbook overview

Source file: `Financial Goals Sheet.xlsx` (four worksheets).

| Sheet | Role |
|-------|------|
| **Goals** | Personal goals: cost today, target year, inflation by segment, duration, future value (`FV`), SIP (`PMT`), monthly SIP, aggregates. |
| **Retirement** | Expense inflation to retirement: annual expense, horizon years, per-year `FV` table, external calculator links. |
| **Sheet3** | Long horizon expense projection by year (compound growth, PV-style columns, annual totals). |
| **Sheet4** | **FIRE calculator** — implemented as static web app (see project root `index.html`). |

## Sheet4 web app

- **Plan:** [`docs/plans/fire-sheet4-html-plan-2026-04-15.md`](plans/fire-sheet4-html-plan-2026-04-15.md)
- **Entry:** [`index.html`](../index.html) — inputs, FIRE table, SWR table, custom CAGR, shareable hash URL, persistence, dark mode.

## Future work

Port **Goals**, **Retirement**, and **Sheet3** using the same stack when needed; formulas are summarized in the plan file.
