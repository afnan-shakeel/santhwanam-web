import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  Input
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from '@angular/forms';

type RadioSize = 'sm' | 'md' | 'lg';

export interface RadioOption<T = string> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-radio-group',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './radio-group.component.html',
  styleUrl: './radio-group.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioGroupComponent),
      multi: true
    }
  ]
})
export class RadioGroupComponent<T = string> implements ControlValueAccessor {
  @Input() label = '';
  @Input() name = `radio-${Math.random().toString(36).slice(2)}`;
  @Input() size: RadioSize = 'md';
  @Input() options: RadioOption<T>[] = [];
  @Input() hint = '';
  @Input() error = '';

  value: T | null = null;
  disabled = false;

  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  get circleSize(): string {
    const sizeMap: Record<RadioSize, string> = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };
    return sizeMap[this.size] ?? sizeMap.md;
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

  select(value: T): void {
    if (this.disabled) return;
    this.value = value;
    this.onChange(value);
    this.onTouched();
  }
}

