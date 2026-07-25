# Security

- **Environment Variables:** Never commit `.env`.
- **API Keys:** Kept exclusively on the server (Next.js API routes). Client never sees the Apify key.
- **Git Ignore:** `.next`, `node_modules`, and local databases are excluded.
