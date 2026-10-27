# T-Coop API Contracts

The API contract lives in one place: the backend repo's
[`t-coop-backend/documentation/api-contracts.md`](../../t-coop-backend/documentation/api-contracts.md).
It's kept up to date with every endpoint the web and mobile apps call.

This file used to hold a separate copy written before the backend existed,
when this app ran on mock data. The two drifted apart, so the copy was
removed (2026-10-27) — use the backend's version. The app has no mock mode;
every service in `src/services/` calls the real backend at
`NEXT_PUBLIC_API_URL`.
