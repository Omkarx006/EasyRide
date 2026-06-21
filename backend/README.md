# SahPravas — Backend (Supabase)

The backend is **Supabase** (hosted Postgres + auto REST API). There is no custom
server to run — the React frontend talks to Supabase directly using the public
**anon** key, and **Row Level Security (RLS)** is what actually protects the data.

There is intentionally **no authentication** (no login, OTP, accounts, or profiles).

```
backend/
├── schema.sql                  # full schema in one file (convenience)
└── migrations/
    ├── 0001_init.sql           # tables: rides, bookings + indexes
    ├── 0002_rls.sql            # RLS: read active rides, publish rides; lock bookings
    └── 0003_book_seat.sql      # atomic, overbooking-safe booking RPC
```

## Tables

### `rides`
| column             | type          | notes                                            |
| ------------------ | ------------- | ------------------------------------------------ |
| id                 | uuid (PK)     | `gen_random_uuid()`                              |
| pickup_city        | text          | required                                         |
| pickup_area        | text          | required                                         |
| destination_city   | text          | required                                         |
| destination_area   | text          | required                                         |
| journey_date       | date          | required                                         |
| journey_time       | time          | required                                         |
| available_seats    | integer       | `> 0`                                            |
| booked_seats       | integer       | default `0`, `<= available_seats`                |
| driver_name        | text          | required                                         |
| phone_number       | text          | exactly 10 digits (`^[0-9]{10}$`)                |
| created_at         | timestamptz   | default `now()`                                  |

### `bookings`
| column           | type        | notes                                  |
| ---------------- | ----------- | -------------------------------------- |
| id               | uuid (PK)   | `gen_random_uuid()`                    |
| ride_id          | uuid (FK)   | → `rides.id`, `on delete cascade`      |
| passenger_name   | text        | required                               |
| passenger_phone  | text        | exactly 10 digits                      |
| created_at       | timestamptz | default `now()`                        |

## Key design decisions

- **Expired rides disappear automatically.** The `rides` SELECT policy is
  `using (journey_date >= current_date)`, so any expired ride is invisible to the
  client at the database layer. No cron job, no cleanup script.
- **Overbooking is impossible.** Bookings are created **only** via the
  `book_seat()` RPC, which locks the ride row (`FOR UPDATE`), re-checks capacity,
  inserts the booking, and increments `booked_seats` in one transaction. It is
  `SECURITY DEFINER`, so it runs as the table owner and bypasses RLS — which is
  why `anon` has no direct insert rights on `bookings`.
- **anon can read active rides and publish rides**, nothing more. It cannot edit
  or delete rides, and cannot touch `bookings` except through the RPC.

## Apply the schema

**Option A — SQL Editor (quickest)**
1. Open your project → **SQL Editor** → **New query**.
2. Paste the contents of `schema.sql` and click **Run**.

**Option B — migrations in order (recommended for change tracking)**
Run `0001_init.sql`, then `0002_rls.sql`, then `0003_book_seat.sql`.

**Option C — Supabase CLI**
```bash
supabase db push           # if using the CLI with these files under supabase/migrations
```

All files are idempotent and safe to re-run.

## Quick verification (SQL Editor)

```sql
-- publish a test ride for tomorrow
insert into public.rides
  (pickup_city, pickup_area, destination_city, destination_area,
   journey_date, journey_time, available_seats, driver_name, phone_number)
values
  ('Beed','Bus Stand','Pune','Swargate', current_date + 1, '08:30', 3, 'Test Driver','9876543210');

-- book a seat atomically (replace the uuid with the id returned above)
select public.book_seat('<ride-id>', 'Test Passenger', '9123456780');
-- => {"success": true, "booking_id": "...", "seats_left": 2}
```
