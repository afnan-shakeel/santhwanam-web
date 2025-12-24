import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from '@angular/forms';

type InputSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'date' = 'text';
  @Input() size: InputSize = 'md';
  @Input() required = false;
  @Input() hint = '';
  @Input() error = '';

  @Output() blur = new EventEmitter<void>();

  value: string | number | null = '';
  disabled = false;

  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private cdr: ChangeDetectorRef) {}

  inputClasses(error: string): string {
    const sizeClasses: Record<InputSize, string> = {
      sm: 'py-1.5 pr-10 pl-3 text-sm',
      md: 'py-1.5 pr-10 pl-3 text-sm',
      lg: 'py-2 pr-10 pl-3 text-base'
    };

    const base =
      'col-start-1 row-start-1 block w-full rounded-md bg-white outline-1 -outline-offset-1 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 sm:pr-9';

    const state = error
      ? 'text-red-900 outline-red-300 focus:outline-red-600'
      : 'text-gray-900 outline-gray-300 focus:outline-indigo-600';

    const disabled = this.disabled
      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
      : '';

    return [base, state, sizeClasses[this.size] ?? sizeClasses.md, disabled]
      .filter(Boolean)
      .join(' ');
  }

  writeValue(value: unknown): void {
    this.value = (value as string) ?? '';
    // Trigger change detection when value is written (e.g., on form reset)
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    // Trigger change detection when disabled state changes
    this.cdr.markForCheck();
  }

  handleInput(value: string): void {
    const nextValue = this.type === 'number' ? Number(value) : value;
    this.value = nextValue;
    this.onChange(nextValue);
  }

  handleBlur(): void {
    this.onTouched();
    this.blur.emit();
  }
}

