import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Nominee } from '../../../../../shared/models/member.model';

@Component({
  selector: 'app-nominee-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nominee-card.component.html',
  styleUrls: ['./nominee-card.component.css']
})
export class NomineeCardComponent {
  nominee = input.required<Nominee>();
  isPrimary = input<boolean>(false);
  canEdit = input<boolean>(true);
  canRemove = input<boolean>(true);

  edit = output<Nominee>();
  remove = output<Nominee>();

  age = computed(() => {
    const dob = this.nominee()?.dateOfBirth;
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  });

  fullAddress = computed(() => {
    const n = this.nominee();
    if (!n) return '';
    const parts = [n.addressLine1, n.addressLine2, n.city, n.state, n.postalCode, n.country].filter(Boolean);
    return parts.join(', ');
  });

  onEdit(): void {
    this.edit.emit(this.nominee());
  }

  onRemove(): void {
    this.remove.emit(this.nominee());
  }
}
