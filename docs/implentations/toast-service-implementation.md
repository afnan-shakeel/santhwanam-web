# Toast Notification Service - Implementation Guide

## Overview
Implement a global toast notification service for displaying temporary success, error, warning, and info messages throughout the application. Toasts should appear in a queue system, support auto-dismiss and manual dismissal, and follow the UI design from `docs/ui-html-templates/toast-notification.html`.

---

## Requirements

### 1. Toast Types
Support four notification types with distinct visual styles:
- **Success** - Green theme with checkmark icon
- **Error** - Red theme with X/error icon  
- **Warning** - Yellow/amber theme with exclamation icon
- **Info** - Blue theme with info icon

### 2. Position Options
- **Top Right** (default) - Most common for notifications
- **Bottom Right** - Alternative position when specified

### 3. Queue System
- Multiple toasts should stack vertically with spacing
- New toasts added to the queue display in order
- Maximum visible toasts: **3-5** (configurable)
- Older toasts auto-dismiss when queue exceeds limit

### 4. Dismissal Behavior
- **Auto-dismiss**: Configurable duration (default: 5 seconds)
  - Success: 3 seconds
  - Info: 5 seconds  
  - Warning: 7 seconds
  - Error: 10 seconds (longer for critical messages)
- **Manual dismiss**: Close button (X) always visible if `dismissable: true`

### 5. Animation
- **Entry**: Slide in from right (top-right) or slide up (bottom-right) with fade
- **Exit**: Fade out and slide away
- **Stacking**: Smooth reordering when toasts are added/removed

### 6. Accessibility
- Use `aria-live="polite"` for info/success
- Use `aria-live="assertive"` for error/warning
- Screen reader announcements for toast content
- Keyboard accessible dismiss button

---

## Technical Specification

### File Structure
```
src/app/core/services/
  └── toast.service.ts

src/app/shared/components/toast/
  ├── toast.component.ts
  ├── toast.component.html
  ├── toast.component.css
  └── toast-container.component.ts
```

### Toast Interface
```typescript
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'bottom-right';

export interface ToastConfig {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // milliseconds, 0 = no auto-dismiss
  dismissable?: boolean; // default: true
  position?: ToastPosition; // default: 'top-right'
}

export interface Toast extends ToastConfig {
  id: string; // unique identifier
  timestamp: number;
}
```

### Toast Service API

#### Methods

```typescript
class ToastService {
  // Main method - show toast with full config
  show(config: ToastConfig): string; // returns toast ID
  
  // Convenience methods
  success(title: string, message?: string, duration?: number): string;
  error(title: string, message?: string, duration?: number): string;
  warning(title: string, message?: string, duration?: number): string;
  info(title: string, message?: string, duration?: number): string;
  
  // Queue management
  dismiss(id: string): void; // dismiss specific toast
  dismissAll(): void; // clear all toasts
  
  // Observables
  toasts$: Observable<Toast[]>; // current toast queue
}
```

#### Default Duration by Type
```typescript
const DEFAULT_DURATIONS = {
  success: 3000,  // 3 seconds
  info: 5000,     // 5 seconds
  warning: 7000,  // 7 seconds
  error: 10000    // 10 seconds
};
```

---

## Component Implementation

### 1. Toast Service (`toast.service.ts`)

**Key Features:**
- Use `BehaviorSubject<Toast[]>` to manage toast queue
- Generate unique IDs using `crypto.randomUUID()` or timestamp + random
- Implement queue limit (max 5 toasts visible)
- Auto-dismiss using `setTimeout` - clear timeout on manual dismiss
- Support for multiple positions (separate queues or single queue with position property)

**Sample Usage:**
```typescript
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();
  
  private maxToasts = 5;
  
  show(config: ToastConfig): string {
    const toast: Toast = {
      id: crypto.randomUUID(),
      type: config.type,
      title: config.title,
      message: config.message,
      duration: config.duration ?? this.getDefaultDuration(config.type),
      dismissable: config.dismissable ?? true,
      position: config.position ?? 'top-right',
      dismissOnClick: config.dismissOnClick ?? false,
      timestamp: Date.now()
    };
    
    const currentToasts = this.toastsSubject.value;
    const newToasts = [toast, ...currentToasts].slice(0, this.maxToasts);
    this.toastsSubject.next(newToasts);
    
    // Auto-dismiss
    if (toast.duration > 0) {
      setTimeout(() => this.dismiss(toast.id), toast.duration);
    }
    
    return toast.id;
  }
  
  success(title: string, message?: string, duration?: number): string {
    return this.show({ type: 'success', title, message, duration });
  }
  
  // ... similar for error, warning, info
  
  dismiss(id: string): void {
    const toasts = this.toastsSubject.value.filter(t => t.id !== id);
    this.toastsSubject.next(toasts);
  }
  
  dismissAll(): void {
    this.toastsSubject.next([]);
  }
  
  private getDefaultDuration(type: ToastType): number {
    const durations = { success: 3000, info: 5000, warning: 7000, error: 10000 };
    return durations[type];
  }
}
```

---

### 2. Toast Container Component (`toast-container.component.ts`)

**Purpose:** 
- Global component added to `app.component.html` or main layout
- Subscribes to `toasts$` from service
- Renders toasts at specified position(s)
- Handles positioning classes based on `position` property

**Template Structure:**
```html
<!-- Top Right Container -->
<div 
  aria-live="polite" 
  class="pointer-events-none fixed inset-0 flex items-start justify-end px-4 py-6 sm:p-6 z-50"
>
  <div class="flex w-full max-w-sm flex-col items-end space-y-4">
    @for (toast of topRightToasts(); track toast.id) {
      <app-toast 
        [toast]="toast" 
        (dismiss)="onDismiss($event)"
      ></app-toast>
    }
  </div>
</div>

<!-- Bottom Right Container -->
<div 
  aria-live="polite" 
  class="pointer-events-none fixed inset-0 flex items-end justify-end px-4 py-6 sm:p-6 z-50"
>
  <div class="flex w-full max-w-sm flex-col-reverse items-end space-y-reverse space-y-4">
    @for (toast of bottomRightToasts(); track toast.id) {
      <app-toast 
        [toast]="toast" 
        (dismiss)="onDismiss($event)"
      ></app-toast>
    }
  </div>
</div>
```

**Component Logic:**
```typescript
export class ToastContainerComponent {
  private toastService = inject(ToastService);
  
  toasts = toSignal(this.toastService.toasts$, { initialValue: [] });
  
  topRightToasts = computed(() => 
    this.toasts().filter(t => t.position === 'top-right')
  );
  
  bottomRightToasts = computed(() => 
    this.toasts().filter(t => t.position === 'bottom-right')
  );
  
  onDismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
```

---

### 3. Toast Component (`toast.component.ts`)

**Purpose:** Individual toast notification

**Inputs:**
```typescript
@Input() toast!: Toast;
@Output() dismiss = new EventEmitter<string>();
```

**Template (based on `toast-notification.html`):**
```html
<div 
  class="pointer-events-auto w-full max-w-sm rounded-lg bg-white shadow-lg outline-1 outline-black/5 dark:bg-gray-800 dark:-outline-offset-1 dark:outline-white/10 transition-all duration-300"
  [class.cursor-pointer]="toast.dismissOnClick"
  (click)="toast.dismissOnClick && onDismiss()"
  [@slideIn]
>
  <div class="p-4">
    <div class="flex items-start">
      <!-- Icon based on type -->
      <div class="shrink-0">
        @switch (toast.type) {
          @case ('success') {
            <svg class="size-6 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          }
          @case ('error') {
            <svg class="size-6 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9.75 9.75 14.25 14.25m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          }
          @case ('warning') {
            <svg class="size-6 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          }
          @case ('info') {
            <svg class="size-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          }
        }
      </div>
      
      <!-- Content -->
      <div class="ml-3 w-0 flex-1 pt-0.5">
        <p class="text-sm font-medium text-gray-900 dark:text-white">{{ toast.title }}</p>
        @if (toast.message) {
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ toast.message }}</p>
        }
      </div>
      
      <!-- Dismiss Button -->
      @if (toast.dismissable) {
        <div class="ml-4 flex shrink-0">
          <button 
            type="button" 
            (click)="onDismiss(); $event.stopPropagation()"
            class="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 dark:hover:text-white dark:focus:outline-indigo-500"
          >
            <span class="sr-only">Close</span>
            <svg class="size-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
      }
    </div>
  </div>
</div>
```

**Component Logic:**
```typescript
export class ToastComponent {
  @Input() toast!: Toast;
  @Output() dismiss = new EventEmitter<string>();
  
  onDismiss(): void {
    this.dismiss.emit(this.toast.id);
  }
}
```

**Animations (`toast.component.ts`):**
```typescript
import { trigger, transition, style, animate } from '@angular/animations';

animations: [
  trigger('slideIn', [
    transition(':enter', [
      style({ transform: 'translateX(100%)', opacity: 0 }),
      animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
    ]),
    transition(':leave', [
      animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
    ])
  ])
]
```

---

## Integration Steps

### 1. Add Toast Container to App

**In `app.component.html` or `main-layout.component.html`:**
```html
<!-- Existing content -->
<router-outlet></router-outlet>

<!-- Add at the end, outside main content -->
<app-toast-container></app-toast-container>
```

### 2. Usage in Components

**Replace alert() calls with toast:**
```typescript
// Before
alert('Member saved successfully!');

// After
export class SomeComponent {
  private toastService = inject(ToastService);
  
  onSave(): void {
    this.memberService.save().subscribe({
      next: () => {
        this.toastService.success(
          'Success!', 
          'Member saved successfully'
        );
      },
      error: (err) => {
        this.toastService.error(
          'Error', 
          err.message || 'Failed to save member'
        );
      }
    });
  }
}
```

### 3. HTTP Interceptor Integration (Optional)

**Automatically show errors from API:**
```typescript
export class ErrorInterceptor implements HttpInterceptor {
  private toastService = inject(ToastService);
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        this.toastService.error(
          'API Error',
          error.error?.message || 'An error occurred'
        );
        return throwError(() => error);
      })
    );
  }
}
```

---

## Advanced Features (Optional Enhancements)

### 1. Progress Bar
Add visual countdown for auto-dismiss:
```html
<div class="h-1 bg-gray-200 dark:bg-gray-700">
  <div 
    class="h-full bg-indigo-600 transition-all"
    [style.width.%]="progress"
  ></div>
</div>
```

### 2. Action Buttons
Support for action buttons in toast (e.g., "Undo", "View"):
```typescript
export interface ToastAction {
  label: string;
  action: () => void;
}

export interface ToastConfig {
  // ... existing properties
  actions?: ToastAction[];
}
```

### 3. Persist on Hover
Pause auto-dismiss when user hovers:
```typescript
@HostListener('mouseenter')
onMouseEnter(): void {
  if (this.dismissTimeout) {
    clearTimeout(this.dismissTimeout);
  }
}

@HostListener('mouseleave')
onMouseLeave(): void {
  this.startAutoDismiss();
}
```

### 4. Toast History
Keep dismissed toasts in memory for "Show Recent Notifications":
```typescript
private toastHistory: Toast[] = [];
private maxHistorySize = 20;

getHistory(): Toast[] {
  return this.toastHistory.slice(0, this.maxHistorySize);
}
```

### 5. Sound Notifications
Play subtle sounds for different toast types (accessibility):
```typescript
private playSound(type: ToastType): void {
  const sounds = {
    success: 'assets/sounds/success.mp3',
    error: 'assets/sounds/error.mp3',
    warning: 'assets/sounds/warning.mp3',
    info: 'assets/sounds/info.mp3'
  };
  
  const audio = new Audio(sounds[type]);
  audio.volume = 0.3;
  audio.play().catch(() => {}); // Ignore errors
}
```

---

## Testing Checklist

- [ ] Success toast displays with green theme
- [ ] Error toast displays with red theme
- [ ] Warning toast displays with amber theme
- [ ] Info toast displays with blue theme
- [ ] Auto-dismiss works with correct durations
- [ ] Manual dismiss button works
- [ ] Queue system limits visible toasts
- [ ] Multiple toasts stack correctly
- [ ] Animations smooth (enter/exit)
- [ ] Top-right position works
- [ ] Bottom-right position works
- [ ] Dismiss on click works when enabled
- [ ] Keyboard navigation for dismiss button
- [ ] Screen reader announces toast content
- [ ] No memory leaks (timeouts cleared)
- [ ] Works in light and dark mode

---

## Accessibility Requirements

1. **ARIA Attributes:**
   - `aria-live="polite"` for info/success
   - `aria-live="assertive"` for error/warning
   - `role="status"` or `role="alert"` on toast

2. **Keyboard Navigation:**
   - Tab to dismiss button
   - Enter/Space to dismiss
   - Optional: Escape to dismiss all

3. **Screen Readers:**
   - Announce toast title and message
   - Indicate toast type in announcement

4. **Focus Management:**
   - Don't steal focus from current element
   - Focus dismiss button only if user tabs to it

---

## Performance Considerations

- Use `OnPush` change detection for toast components
- Limit maximum toasts to prevent DOM bloat
- Clean up timeouts in `ngOnDestroy`
- Use `trackBy` in `@for` loop for toast list
- Debounce rapid toast calls (prevent spam)

---

## Summary

The toast service should provide:
✅ Four toast types with distinct styling
✅ Queue-based system with stacking
✅ Auto-dismiss with type-specific durations
✅ Manual dismiss with close button
✅ Two position options (top-right, bottom-right)
✅ Smooth animations
✅ Accessibility support
✅ Simple API for easy usage
✅ Optional enhancements for advanced use cases

This implementation will replace all `alert()` calls throughout the application with a modern, user-friendly notification system.
