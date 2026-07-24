# Contributing to BizRank

## Branching Strategy
- Main production branch is `main`.
- Feature branches should be branched off `main` as `feature/[name]`.
- Bugfix branches should be branched as `bugfix/[name]`.

## Pull Requests
- All code must pass `npm run lint` and `npm run build` prior to PR approval.
- Ensure no `.env` values are pushed. Keep `.env.example` updated if new dependencies are introduced.
- Run `npx prisma generate` locally if the database schema is altered.
