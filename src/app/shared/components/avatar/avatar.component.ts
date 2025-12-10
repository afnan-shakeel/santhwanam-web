import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.css']
})
export class AvatarComponent {
  @Input() text = '';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';

  get sizeClasses(): string {
    const sizes = {
      'xs': 'size-6',
      'sm': 'size-8',
      'md': 'size-10',
      'lg': 'size-12',
      'xl': 'size-14'
    };
    return sizes[this.size];
  }

  get textSizeClass(): string {
    const textSizes = {
      'xs': 'text-xs',
      'sm': 'text-sm',
      'md': 'text-base',
      'lg': 'text-lg',
      'xl': 'text-xl'
    };
    return textSizes[this.size];
  }

  get initials(): string {
    if (!this.text || !this.text.trim()) return 'U';
    
    const words = this.text.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
}
