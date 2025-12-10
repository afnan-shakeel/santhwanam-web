# GitHub Copilot Instructions

## Project Overview
This is an Angular 20 standalone application with Tailwind CSS v4, and a modular architecture.

## Project Setup
- **Framework**: Angular 20 standalone components (no NgModules)
- **Styling**: Tailwind CSS v4 with custom primary/secondary theme colors and fonts
- **State Management**: Signals and observables (Angular 20+ built-in features, no NgRx)
- **Folder Structure**:
  - `src/app/core/` - Core services (HTTP, interceptors, guards, state management)
  - `src/app/layouts/` - Layout components (header, footer, sidebar, main layout)
  - `src/app/features/` - Feature modules with components, services, and routes
  - `src/app/shared/` - Shared components, services, pipes, directives, models
  - `docs/ui-html-templates/` - UI template references (HTML examples for components)
- **HTTP Service**: Core HTTP service wrapping HttpClient with interceptors
- **Interceptors**:
  - Authorization tokens (`auth.interceptor.ts`)
  - Logging/Error handling (`logging.interceptor.ts`)
  - Loading indicators (`loading.interceptor.ts`)
- **Environment Configuration**: `environments/environment.ts` and `environment.prod.ts`
- **Code Quality**: ESLint and Prettier configured (run `npm run lint`)
- **Testing**: No testing framework configured currently

## Development Guidelines

### Component Creation
- Always use standalone components (Angular 20 pattern)
- Register routes in `src/app/app.routes.ts`
- Use signals for reactive state management
- Keep components focused and single-responsibility
- **Use Angular 20+ control flow syntax**: `@if`, `@else`, `@for`, `@switch` instead of `*ngIf`, `*ngFor`, `*ngSwitch`

### State Management
- Use Angular signals for local and shared state
- Create signal stores in `src/app/core/state/` (e.g., `app.store.ts`)
- Expose readonly signals and update via methods
- Prefer signals over traditional observables where appropriate

### HTTP Calls
- Always use the core `HttpService` instead of direct `HttpClient`
- This ensures all interceptors (auth, logging, loading) apply automatically
- API base URL is configured in environment files

### Styling
- Use Tailwind CSS utility classes
- Reference custom theme colors: `primary` and `secondary` variants
- Custom fonts are configured in `src/styles.css`
- Avoid custom CSS unless absolutely necessary
- Reuse shared components for consistent UI

### Shared Components
- Refer to `docs/ui-html-templates/` for UI implementation references
- Create new shared components in `src/app/shared/components/`
- Keep components reusable and well-documented

### Code Style
- Follow ESLint and Prettier rules
- Keep code concise and readable
- Add comments only for non-obvious logic
- Use TypeScript strict mode features
- Prefer functional programming patterns where appropriate

### Template Syntax (Angular 20+)
- Use `@if (condition) { } @else { }` instead of `*ngIf`
- Use `@for (item of items; track item.id) { }` instead of `*ngFor`
- Use `@switch (value) { @case (x) { } @default { } }` instead of `*ngSwitch`
- Always provide a `track` expression in `@for` loops for performance
- Create separate `.html` and `.css` files instead of inline templates (except for very small components)

### Best Practices
- Avoid adding new dependencies unless necessary
- Use existing tooling and patterns
- Keep feature modules self-contained
- Lazy load feature routes when possible
- Use dependency injection effectively
- Follow Angular style guide conventions

## Loading State
- Loading indicators are managed by `LoadingService` using signals
- Service automatically tracks HTTP requests via interceptor
- Access loading state via the service's signal

## When Building Features
1. Create standalone component in appropriate feature folder
2. Add route to `app.routes.ts`
3. Use shared components and Tailwind utilities
4. Manage state with signals
5. Use `HttpService` for API calls
6. Follow existing patterns in the codebase
