import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
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

type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './select.component.html',
  styleUrl: './select.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ]
})
export class SelectComponent<T = string> implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'Select an option';
  @Input() size: SelectSize = 'md';
  @Input() options: SelectOption<T>[] = [];
  @Input() required = false;
  @Input() hint = '';
  @Input() error = '';

  @Output() blur = new EventEmitter<void>();
  @Output() valueChange = new EventEmitter<T | null>();

  value: T | null = null;
  disabled = false;

  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  get selectClasses(): string {
    const sizeClasses: Record<SelectSize, string> = {
      sm: 'py-1.5 pr-8 pl-3 text-sm',
      md: 'py-1.5 pr-8 pl-3 text-sm',
      lg: 'py-2 pr-8 pl-3 text-base'
    };

    return [
      'col-start-1 row-start-1 w-full appearance-none rounded-md bg-white text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm',
      sizeClasses[this.size] ?? sizeClasses.md,
      this.disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
    ]
      .filter(Boolean)
      .join(' ');
  }

  writeValue(value: unknown): void {
    this.value = value as T;
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleChange(value: string): void {
    const selected = this.options.find((o) => `${o.value}` === value)?.value ?? null;
    this.value = selected;
    this.onChange(selected);
    this.valueChange.emit(selected);
  }

  handleBlur(): void {
    this.onTouched();
    this.blur.emit();
  }
}

