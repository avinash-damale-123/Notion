# My Work Performance Hub

A responsive, Vercel-ready Next.js dashboard for the Notion **My Work** task database.

## Dashboard coverage

- Global cross-filters: keyword, project, sub-project, status, task type and owner/person
- Portfolio KPIs: total tasks, completion rate, overdue tasks, average progress and weighted delivery
- Status distribution, project workload, person-wise allocation and planning-data completeness
- Project, people and detailed task-register views
- Responsive desktop/mobile layout
- Live Notion data with a safe preview fallback

## Connect Notion

1. Create a Notion internal integration and copy its token.
2. Share the **My Work** database with that integration.
3. Copy `.env.example` to `.env.local` and set `NOTION_TOKEN`.
4. Keep `NOTION_DATA_SOURCE_ID=a7b899cb-46a3-4e80-9a31-003aaf3cc76a` for the current My Work source.

The token is read only on the server and is never sent to the browser.

## Run locally

```bash
npm install
npm run dev
```

## Deploy on Vercel

Import this GitHub repository into Vercel, add the two environment variables, and deploy. The API route requests current Notion records on every refresh.
