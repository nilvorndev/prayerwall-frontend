# Prayer Wall Frontend

Astro frontend for the Prayer Wall backend API. The app is SSR-first, uses small client islands only where interaction is needed, and keeps registered and anonymous auth modes separate.

## Setup

```bash
npm install
npm run dev
```

## Environment

Create a `.env` file with:

```env
PUBLIC_API_BASE_URL=http://localhost:8000
```

All backend API requests are derived from this base URL.

## Scripts

- `npm run dev` starts the Astro dev server.
- `npm run build` creates the production build.
- `npm run preview` previews the build.
- `npm run typecheck` runs TypeScript validation.
- `npm run test` runs the unit test suite.

## Architecture

The frontend is organized around these layers:

- `src/lib/api/` contains the typed backend client and endpoint helpers.
- `src/lib/auth/session.ts` manages cookie names, session shape, and auth-mode helpers.
- `src/pages/api/auth/[...path].ts` and `src/pages/api/prayers/[...path].ts` proxy writes through the Astro server so tokens stay in server-managed cookies.
- `src/components/` contains reusable UI primitives, request cards, forms, and guard components.
- `src/pages/` contains SSR routes for public browsing, auth, personal areas, and admin workflows.

## Auth Model

The app treats these states as distinct:

- `guest`
- `registered`
- `anonymous`
- `admin` is a capability on top of a registered session

Registered and anonymous tokens are stored separately in cookies:

- `pw_registered_token`
- `pw_anonymous_token`
- `pw_anonymous_meta`

Registered auth is validated on each request via `GET /users/me/`.
Anonymous auth is kept separate and only used for anonymous actions.

## Route Map

Public:

- `/`
- `/prayers`
- `/prayers/[id]`

Auth:

- `/auth/login`
- `/auth/register`
- `/auth/verify`
- `/auth/anonymous`

User area:

- `/prayers/create`
- `/my/requests`
- `/my/prayers`
- `/account`

Admin:

- `/admin`
- `/admin/prayers`
- `/admin/users`
- `/admin/anonymous`

Legacy routes such as `/login`, `/register`, `/dashboard`, and `/prayers/submit` redirect to the new locations.

## API Integration Assumptions

The frontend expects the backend to expose the endpoints described in the task prompt.

Some admin browsing endpoints are inferred from the backend shape:

- `GET /users/` for registered users
- `GET /users/anonymous/` for anonymous identities

If those endpoints differ, adjust the helpers in `src/lib/api/admin.ts`.

The frontend also proxies write actions through local Astro endpoints:

- `/api/auth/*`
- `/api/prayers/*`

That proxy layer is what sets and clears auth cookies securely.

## Deployment Notes

- Build output is server-rendered, so the deployment target must support Astro SSR.
- The configured adapter is `@astrojs/node` in standalone mode.
- Ensure `PUBLIC_API_BASE_URL` points at the deployed backend API.
- If the backend runs behind different CORS or auth rules in production, keep the Astro proxy routes and avoid calling the backend directly from browser code.

## Folder Structure

```txt
src/
  components/
    auth/
    prayers/
    ui/
    admin/
  lib/
    api/
    auth/
    client/
    validation/
    utils/
  pages/
    api/
    auth/
    admin/
    my/
    prayers/
```

## Notes

- The app is designed to distinguish owners, anonymous identities, verified users, blocked users, and admins in the UI.
- Public pages are SSR-rendered and safe to bookmark/share.
- Request editing, deletion, prayer actions, and moderation all go through the same proxy layer so token handling stays consistent.
