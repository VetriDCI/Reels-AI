# RA Social Groq AI — Phase 8: Reasoning + Data AI

Implemented steps 148–162: calculations, quantitative reasoning, statistics guidance, table/data analysis, comparisons, pattern detection, forecasting assumptions, and decision support.

## Endpoint
`POST /api/ai/data-analysis`

Protected by the existing auth middleware.

## Tasks
- analyze
- calculate
- statistics
- compare
- patterns
- table
- decision
- forecast

## Routing
Requests that look computational/data-heavy or include data context prefer Groq Compound so the built-in code execution tool can be used when useful. Fallbacks remain Compound Mini, GPT-OSS 120B, then GPT-OSS 20B.

## Safety/accuracy behavior
- Does not expose hidden chain-of-thought.
- Preserves units, currencies, dates and column names.
- States assumptions and missing data.
- Distinguishes observations from estimates/projections.
- Does not claim causation from correlation alone.
- Does not claim execution/testing unless a tool actually executed.

NVIDIA AI integration is not used.
