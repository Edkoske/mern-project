# Frontend – airesume.studio

React 19 + Vite application that powers the AI resume and portfolio builder. Tailwind 4 is used for styling and Axios handles communication with the Express API.

## Available scripts

- `npm run dev` – start the Vite dev server
- `npm run build` – build production assets
- `npm run preview` – preview the production build
- `npm run lint` – run ESLint over the client codebase

## Environment variables

Copy `env.example` to `.env` and configure:

```
VITE_API_URL=http://localhost:5000/api
```

## Architecture notes

- Authentication state lives in `context/AuthContext.js` and is consumed via the `useAuth` hook.
- API calls are centralized in `services/api.js` with automatic JWT injection and error normalization.
- Resume editing is handled by `components/ResumeForm.js` with Gemini-powered improvements exposed via `/api/ai`.
- Live previews and portfolio management live under `components/TemplatePreview.js` and `pages/Portfolio.js`.
