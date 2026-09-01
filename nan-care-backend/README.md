# Nan Care Hospital — Backend API

Express + MongoDB backend for the Nan Care Hospital website (`nan-care-next` frontend).
Handles appointment booking requests, and department/doctor listings that the site can
fetch dynamically instead of using hardcoded data.

## Features

- `POST /api/appointments` — public endpoint the booking form submits to
- `GET /api/departments`, `GET /api/doctors` — public, used to render the site
- Admin-only endpoints (protected by an `x-admin-key` header) to add/edit/delete
  departments, doctors, and to view/manage appointment requests
- Basic rate limiting on the appointment endpoint to block spam
- CORS locked to your frontend's domain(s)

## 1. Local setup

```bash
cd nan-care-backend
npm install
cp .env.example .env
# edit .env: set MONGO_URI, ADMIN_KEY, FRONTEND_URL
npm run seed   # populates departments & doctors matching the current frontend content
npm run dev    # starts on http://localhost:5000
```

You need a MongoDB connection string. Easiest free option: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) —
create a free cluster, add a database user, allow access from anywhere (0.0.0.0/0) for Railway,
and copy the connection string into `MONGO_URI`.

## 2. Deploying to Railway

1. Push this `nan-care-backend` folder to its own GitHub repo (or a `backend/` subfolder
   in your existing repo — Railway lets you set a root directory).
2. On [railway.app](https://railway.app): **New Project → Deploy from GitHub repo** → select the repo.
3. In the Railway project, go to **Variables** and add:
   - `MONGO_URI` — your Atlas connection string
   - `ADMIN_KEY` — a long random string (used to protect admin routes)
   - `FRONTEND_URL` — your deployed frontend URL(s), comma-separated, no trailing slash
   - `PORT` — Railway sets this automatically; you don't need to add it
4. Railway will detect Node.js automatically (via `package.json` + `railway.json`) and run
   `npm start`.
5. Once deployed, Railway gives you a public URL like `https://nan-care-backend-production.up.railway.app`.
   Test it: open `<that-url>/health` — you should see `{"status":"healthy", ...}`.
6. Run the seed script once against production data. Easiest way: temporarily set `MONGO_URI`
   in your local `.env` to the same Atlas URI Railway is using, then run `npm run seed` locally.

## 3. Connecting the Next.js frontend

In your `nan-care-next` project, replace the demo `handleSubmit` in `app/page.js` with a real
fetch call to the deployed backend:

```js
async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const payload = {
    fullName: form.fname.value.trim(),
    phone: form.phone.value.trim(),
    department: form.dept.value,
    message: form.msg.value.trim(),
  };

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Something went wrong');

    setFormNote(data.message);
    form.reset();
  } catch (err) {
    setFormNote('Could not submit right now. Please call the front desk instead.');
  }
}
```

Add `NEXT_PUBLIC_API_URL=https://<your-railway-backend-url>` to the frontend's environment
variables (both locally in `.env.local` and in your frontend's hosting provider).

To load departments/doctors dynamically instead of the hardcoded arrays, fetch
`${NEXT_PUBLIC_API_URL}/api/departments` and `/api/doctors` in a `useEffect` or as a
server component fetch.

## 4. API Reference

### Public

| Method | Route              | Body                                              |
|--------|---------------------|----------------------------------------------------|
| GET    | `/api/departments`  | —                                                  |
| GET    | `/api/doctors`      | —                                                  |
| POST   | `/api/appointments` | `{ fullName, phone, department, message }`        |

### Admin (require header `x-admin-key: <ADMIN_KEY>`)

| Method | Route                     | Purpose                       |
|--------|---------------------------|--------------------------------|
| GET    | `/api/appointments`       | List all appointment requests |
| PATCH  | `/api/appointments/:id`   | Update status                 |
| DELETE | `/api/appointments/:id`   | Delete a request               |
| POST   | `/api/departments`        | Add a department              |
| PUT    | `/api/departments/:id`    | Edit a department              |
| DELETE | `/api/departments/:id`    | Delete a department            |
| POST   | `/api/doctors`            | Add a doctor                  |
| PUT    | `/api/doctors/:id`        | Edit a doctor                  |
| DELETE | `/api/doctors/:id`        | Delete a doctor                |

## Notes

- This does not include patient login/records — the frontend had no such feature, so it
  wasn't built. If you need it later, add a `User` model with JWT auth.
- `ADMIN_KEY` is a simple shared-secret approach, fine for a small clinic-run admin panel.
  For a public-facing admin dashboard with multiple staff logins, switch to proper JWT-based
  auth with hashed passwords.
