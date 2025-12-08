# AI Assistant Guidelines

Use these notes when building with Claude or GitHub Copilot.

## Project setup
- Angular 20 standalone app with signals-first state (see `src/app/core/state/app.store.ts`).
- Tailwind CSS v4 with custom theme colors and fonts (see `src/styles.css`).
- Layout/feature structure:
  - `src/app/core/` services, interceptors, state.
  - `src/app/layouts/` app shells.
  - `src/app/features/` feature modules/components.
  - `src/app/shared/` shared UI (buttons, etc.).
- Core HTTP service wraps `HttpClient` and uses interceptors for auth, logging, loading.
- Environments live in `src/environments/` with `apiBaseUrl`.
- ESLint + Prettier configured; run `npm run lint`.

## Building features
- Prefer standalone components; wire routes through `src/app/app.routes.ts`.
- Reuse shared components and Tailwind utility classes; theme tokens are `primary` and `secondary`.
- Keep state in signal stores; expose readonly signals, update via methods.
- Use `HttpService` for API calls so interceptors apply automatically.
- Loading indicator state is provided by `LoadingService` (signal).

## Contributions
- Place UI references in `docs/ui-html-templates/` when provided.
- Keep new code ASCII and concise; add comments only for non-obvious logic.
- Avoid adding new dependencies unless necessary; prefer existing tooling.

