# 🚗 SahPravas — Community Ride Sharing for Maharashtra

**SahPravas** (सहप्रवास — "travelling together") is a **completely free**,
community-driven ride-sharing platform for Maharashtra. People travelling between
cities publish their empty seats; other travellers find a ride and contact the
driver directly.

> **No Commission • No Ads • Completely Free**

There are **no logins, no OTPs, no accounts, no profiles, and no payments.** Open
the site and use it immediately.

- 🧭 Find rides between any two cities (Beed → Latur, Beed → Pune, Latur → Pune, …)
- 📣 Offer a ride in under a minute
- 📞 Call / 💬 WhatsApp the driver directly, or 🎟️ book a seat in-app
- 🌐 Full **English + मराठी** support (every string is translated)
- 📱 Mobile-first, fast, clean orange-and-white design
- 🕑 Expired rides vanish automatically (enforced in the database)
- 🔒 Overbooking is impossible (atomic, row-locked booking)

---

## 🧱 Tech Stack

| Layer       | Choice                                              |
| ----------- | --------------------------------------------------- |
| Frontend    | React 18 + Vite + Tailwind CSS + React Router       |
| i18n        | react-i18next (English / Marathi)                   |
| Backend     | Supabase (Postgres + auto REST API + RLS)           |
| Hosting     | Netlify (frontend) — free tier                      |

The free tiers of Supabase and Netlify comfortably cover **1000+ users**.

---

## 📂 Project Structure

```
SahPravas/
├── frontend/                 # React app (deploys to Netlify)
│   ├── src/
│   │   ├── components/        # Navbar, RideCard, BookingModal, Filters, …
│   │   ├── pages/             # Home, Rides, CreateRide
│   │   ├── lib/               # supabase client, data access, helpers, constants
│   │   ├── i18n/              # i18next setup + locales/{en,mr}.json
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── netlify.toml
│   └── package.json
│
└── backend/                  # Supabase database
    ├── schema.sql            # full schema (one file)
    ├── migrations/           # 0001 init · 0002 RLS · 0003 booking RPC
    └── README.md             # schema + design notes
```

Frontend and backend are kept **separate** so each can evolve independently.

---

## 🚀 Quick Start (local)

### 1. Create a Supabase project
1. Go to <https://supabase.com> → **New project** (free tier).
2. Once it's ready, open **SQL Editor → New query**, paste the contents of
   [`backend/schema.sql`](backend/schema.sql), and click **Run**.
   *(Or run the three files in `backend/migrations/` in order.)*
3. Open **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

> The anon key is meant to live in the browser — RLS is what protects your data.
> Never use the `service_role` key in the frontend.

### 2. Configure & run the frontend
```bash
cd frontend
cp .env.example .env          # then edit .env with your two values
npm install
npm run dev                   # http://localhost:5173
```

That's it. Publish a ride, search for it, and book a seat.

---

## 🔑 Environment Variables

| Variable                  | Where to find it                              |
| ------------------------- | --------------------------------------------- |
| `VITE_SUPABASE_URL`       | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY`  | Supabase → Project Settings → API → anon public |

If these are missing, the app stays up and shows a friendly "Setup needed"
notice instead of crashing.

---

## 🌍 Deploy to Netlify

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the full step-by-step guide. In short:

1. Push this repo to GitHub.
2. Netlify → **Add new site → Import from Git**.
3. **Base directory:** `frontend` · **Build command:** `npm run build` ·
   **Publish directory:** `frontend/dist` (these are already in `netlify.toml`).
4. Add the two environment variables under **Site settings → Environment variables**.
5. Deploy. SPA routing is handled by `netlify.toml` / `public/_redirects`.

---

## 🧩 Features in detail

- **Home** — hero, ride search, "Why SahPravas", and community guidelines.
- **Find a Ride** (`/rides`) — search by city/date, filter by time-of-day and
  seats available; shows all active rides when no search is given.
- **Offer a Ride** (`/create`) — validated form (required fields, exactly
  10-digit phone, no past dates, seats > 0, distinct cities).
- **Ride Card** — Call, WhatsApp (pre-filled message), and Book Seat.
- **Booking** — atomic seat reservation with success state; overbooking blocked.
- **i18n** — toggle English/मराठी anywhere; preference saved to `localStorage`.

---

## 🤝 Contributing & License

Built by the community, for the community. Use it, fork it, improve it, and keep
it free. No commission, no ads — ever.
