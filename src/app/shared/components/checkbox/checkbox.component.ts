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

type CheckboxSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true
    }
  ]
})
export class CheckboxComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() description = '';
  @Input() size: CheckboxSize = 'md';

  checked = false;
  disabled = false;

  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  get boxClasses(): string {
    const sizeMap: Record<CheckboxSize, string> = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };
    const size = sizeMap[this.size] ?? sizeMap.md;

    return [
      'grid place-content-center rounded-md border border-slate-300 bg-white',
      'transition-colors',
      size,
      this.checked ? 'border-primary-500 bg-primary-50' : '',
      this.disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''
    ]
      .filter(Boolean)
      .join(' ');
  }

  writeValue(value: unknown): void {
    this.checked = !!value;
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

  toggle(): void {
    if (this.disabled) return;
    this.checked = !this.checked;
    this.onChange(this.checked);
    this.onTouched();
  }
}

