# Car Loan Score Calculator

A bank-internal calculator for the Annexure-I "Revised Car Loan Score Card (RSM)". Loan officers
enter applicant and deal details; the app computes the weighted score and, if it falls below the
approval threshold of 41, suggests ranked combinations of Loan Amount / Tenure / Net Monthly
Income changes that would clear it.

Runs entirely client-side as an installable PWA (Android & iPhone, via "Add to Home Screen") —
no backend, no database, no AI. Access is gated by Cloudflare Access (email one-time PIN,
restricted to a single allowed address) rather than any app-level auth. See
[reference/car-loan-scorecard.jpeg](reference/car-loan-scorecard.jpeg) for the source scorecard.

## Development

```bash
npm install
npm run dev      # dev server
npm test         # Vitest unit tests for the scoring/suggestion engine
npm run build    # production build to dist/
npm run preview  # serve the production build locally
```

The scoring/EMI/suggestion logic lives entirely under [src/engine/](src/engine/) as plain,
React-free TypeScript — see its unit tests for the full set of band boundaries and cascade rules.

## Deployment

Hosted on Cloudflare (Workers with static assets), connected directly to this GitHub repo.
Pushes to `main` build and deploy automatically via Cloudflare's own git integration — no
GitHub Actions involved. Build config lives in [wrangler.jsonc](wrangler.jsonc); access control
(email one-time PIN, single allowed address, 30-minute session) is configured in the Cloudflare
Zero Trust dashboard under Access controls → Applications, not in this repo.
