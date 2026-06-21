# 🌍 Deploying SahPravas

Two parts: the **database** (Supabase) and the **frontend** (Netlify). The
database has no servers to run, and the frontend is a static build.

---

## Part 1 — Supabase (database)

1. **Create a project** at <https://supabase.com> (free tier is enough).
2. **Apply the schema.** Open **SQL Editor → New query**, paste the contents of
   `backend/schema.sql`, and **Run**.
   - Prefer tracked migrations? Run `backend/migrations/0001_init.sql`,
     `0002_rls.sql`, `0003_book_seat.sql` in that order.
3. **Grab your keys** from **Project Settings → API**:
   - `Project URL`  → used as `VITE_SUPABASE_URL`
   - `anon public`  → used as `VITE_SUPABASE_ANON_KEY`

✅ No need to relax RLS or change any other setting — the policies in the schema
are designed for exactly this anonymous, public use.

---

## Part 2 — Netlify (frontend)

### Option A — Git (recommended, gives auto-deploys)

1. Push the repository to GitHub/GitLab.
2. In Netlify: **Add new site → Import an existing project** → pick your repo.
3. Set the build settings (or let `frontend/netlify.toml` provide them):
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
4. **Environment variables** → **Site settings → Environment variables → Add**:
   | Key | Value |
   | --- | ----- |
   | `VITE_SUPABASE_URL` | your Project URL |
   | `VITE_SUPABASE_ANON_KEY` | your anon public key |
5. **Deploy site.** Done — you get a `*.netlify.app` URL.

> ⚠️ Vite inlines `VITE_*` variables at **build time**. If you add or change them
> after a deploy, trigger **Deploys → Trigger deploy → Clear cache and deploy site**.

### Option B — Netlify CLI (manual)

```bash
cd frontend
npm install
npm run build

npm install -g netlify-cli
netlify deploy --prod --dir=dist
# set env vars first via the dashboard, then rebuild, OR:
# netlify env:set VITE_SUPABASE_URL "https://xxxx.supabase.co"
# netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key"
```

### Option C — Drag & drop

```bash
cd frontend && npm install && npm run build
```
Then drag the `frontend/dist` folder onto <https://app.netlify.com/drop>.
*(With this method you must hardcode env vars before building, so Option A or B
is preferred.)*

---

## SPA routing

Deep links like `/rides` and `/create` must serve `index.html`. This is already
configured in **`frontend/netlify.toml`** and **`frontend/public/_redirects`**
(`/* → /index.html 200`). Nothing else to do.

---

## Custom domain (optional)

Netlify → **Domain settings → Add a domain** → follow the DNS instructions.
HTTPS is provisioned automatically (Let's Encrypt).

---

## Post-deploy checklist

- [ ] Home page loads and the language toggle switches EN ↔ मराठी.
- [ ] **Offer a Ride** publishes successfully (check the `rides` table in Supabase).
- [ ] The new ride appears under **Find a Ride**.
- [ ] **Book Seat** succeeds and `booked_seats` increments by 1.
- [ ] A ride dated in the past does **not** appear (it's hidden by RLS).
- [ ] Refreshing on `/rides` does not 404 (SPA redirect working).
