# Strength Log

A personal, offline strength-training journal. Log workouts from templates or freeform, see what you did last time while you lift, chart progress per exercise (top set, estimated 1RM, volume), and track bodyweight (with a 7-day trend) and body fat %.

All data lives on your device (IndexedDB). Use **Settings → Export backup** regularly.

## Run locally

```bash
npm install
npm run dev
```

## Test and build

```bash
npm test
npm run build
```

## Put it on your phone

The app is a PWA, so it needs to be served over HTTPS to install. Build it and deploy the `dist/` folder to any static host (Netlify Drop, Vercel, GitHub Pages), open the URL on your phone, then **Share → Add to Home Screen** (iOS) or **Install app** (Android). After the first load it works offline.

Your data stays in that phone's browser storage for that site. If you change the URL you host it on, export a backup first and restore it on the new URL.
