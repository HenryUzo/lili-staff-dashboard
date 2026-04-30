# Lili Vet staff dashboard

This is the staff-facing React/Vite dashboard for Lili Vet Hospital.

## Local development

1. Install dependencies:
   - `npm install`
2. Create `.env` from `.env.example`
3. Start the dev server:
   - `npm run dev`

## Environment variable

```env
VITE_API_BASE_URL=https://lilivet.onrender.com
```

The app calls backend endpoints under `/api/...`, so the base URL should be the Render host, not the `/api` path itself.

## Vercel deployment

- Framework Preset: `Vite`
- Root Directory: repository root
- Build Command: `npm run build`
- Output Directory: `dist`

Set:

```env
VITE_API_BASE_URL=https://lilivet.onrender.com
```
