import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SearchSelectComponent, SearchSelectOption } from '../../../shared/components/search-select/search-select.component';
import { SelectComponent } from '../../../shared/components/select/select.component';
import { AgentService } from '../../../core/services/agent.service';
import { ForumService } from '../../../core/services/forum.service';
import { AreaService } from '../../../core/services/area.service';
import { UnitService } from '../../../core/services/unit.service';
import { Agent, RegisterAgentRequest, UpdateDraftRequest, UpdateAgentRequest } from '../../../shared/models/agent.model';
import { Forum } from '../../../shared/models/forum.model';
import { Area } from '../../../shared/models/area.model';
import { Unit } from '../../../shared/models/unit.model';
import { ButtonComponent } from "../../../shared/components/button/button.component";

@Component({
  selector: 'app-agent-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
    SearchSelectComponent,
    SelectComponent,
    ButtonComponent
],
  templateUrl: './agent-form.component.html',
  styleUrls: ['./agent-form.component.css'],
})
export class AgentFormComponent implements OnInit, OnChanges {
  @Input() agentId?: string;
  @Input() open = false;

  @Output() openChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<Agent>();
  @Output() cancelled = new EventEmitter<void>();

  loading = signal(false);
  saving = signal(false);
  submitting = signal(false);
  isEditMode = signal(false);
  isDraftMode = signal(false);
  currentAgentId = signal<string | undefined>(undefined);

  // Forum-related signals
  forums = signal<Forum[]>([]);
  forumsLoading = signal(false);
  selectedForumId = signal<string | undefined>(undefined);

  forumOptions = computed<SearchSelectOption<string>[]>(() => {
    return this.forums().map((forum) => ({
      value: forum.forumId,
      label: `${forum.forumName} (${forum.forumCode})`,
    }));
  });

  // Area-related signals
  areas = signal<Area[]>([]);
  areasLoading = signal(false);
  selectedAreaId = signal<string | undefined>(undefined);

  areaOptions = computed<SearchSelectOption<string>[]>(() => {
    const selectedForum = this.selectedForumId();
    return this.areas()
      .filter((area) => !selectedForum || area.forumId === selectedForum)
      .map((area) => ({
        value: area.areaId,
        label: `${area.areaName} (${area.areaCode})`,
      }));
  });

  // Unit-related signals
  units = signal<Unit[]>([]);
  unitsLoading = signal(false);

  unitOptions = computed<SearchSelectOption<string>[]>(() => {
    const selectedArea = this.selectedAreaId();
    return this.units()
      .filter((unit) => !selectedArea || unit.areaId === selectedArea)
      .map((unit) => ({
        value: unit.unitId,
        label: `${unit.unitName} (${unit.unitCode})`,
      }));
  });

  genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
  ];

  fb = inject(FormBuilder);
  agentService = inject(AgentService);
  forumService = inject(ForumService);
  areaService = inject(AreaService);
  unitService = inject(UnitService);

  agentForm: FormGroup = this.fb.group({
    forumId: ['', [Validators.required]],
    areaId: ['', [Validators.required]],
    unitId: ['', [Validators.required]],
    agentCode: ['', [Validators.required, Validators.maxLength(50)]],
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    middleName: ['', [Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    dateOfBirth: ['', [Validators.required]],
    gender: ['', [Validators.required]],
    contactNumber: ['', [Validators.required]],
    alternateContactNumber: [''],
    email: ['', [Validators.required, Validators.email]],
    addressLine1: [''],
    addressLine2: [''],
    city: [''],
    state: [''],
    postalCode: [''],
    country: [''],
    joinedDate: ['', [Validators.required]],
  });

  ngOnInit(): void {
    // Load initial data
    this.loadForums('');
    this.loadAreas('');
    this.loadUnits('');

    // Watch forum selection to filter areas
    this.agentForm.get('forumId')?.valueChanges.subscribe((forumId) => {
      this.selectedForumId.set(forumId);
      if (!this.isEditMode()) {
        this.agentForm.patchValue({ areaId: '', unitId: '' });
      }
    });

    // Watch area selection to filter units
    this.agentForm.get('areaId')?.valueChanges.subscribe((areaId) => {
      this.selectedAreaId.set(areaId);
      if (!this.isEditMode()) {
        this.agentForm.patchValue({ unitId: '' });
      }
    });

    if (this.agentId) {
      this.isEditMode.set(true);
      this.loadAgent();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      if (this.agentId) {
        this.isEditMode.set(true);
        this.loadAgent();
      } else {
        // Reset for create mode
        this.isEditMode.set(false);
        this.isDraftMode.set(false);
        this.currentAgentId.set(undefined);
        this.agentForm.reset();
        this.selectedForumId.set(undefined);
        this.selectedAreaId.set(undefined);
      }
    }

    if (changes['agentId']) {
      if (this.agentId) {
        this.isEditMode.set(true);
      } else {
        this.isEditMode.set(false);
      }
    }
  }

  loadAgent(): void {
    if (!this.agentId) return;

    this.loading.set(true);
    this.agentService.getAgent(this.agentId).subscribe({
      next: (agent) => {
        this.currentAgentId.set(agent.agentId);
        this.isDraftMode.set(agent.registrationStatus === 'draft');

        const dateOfBirth = agent.dateOfBirth ? this.formatDateForInput(agent.dateOfBirth) : '';
        const joinedDate = agent.joinedDate ? this.formatDateForInput(agent.joinedDate) : '';

        // Set forum and area first
        this.selectedForumId.set(agent.forumId);
        this.selectedAreaId.set(agent.areaId);

        this.agentForm.patchValue({
          forumId: agent.forumId,
          areaId: agent.areaId,
          unitId: agent.unitId,
          agentCode: agent.agentCode,
          firstName: agent.firstName,
          middleName: agent.middleName,
          lastName: agent.lastName,
          dateOfBirth: dateOfBirth,
          gender: agent.gender,
          contactNumber: agent.contactNumber,
          alternateContactNumber: agent.alternateContactNumber,
          email: agent.email,
          addressLine1: agent.addressLine1,
          addressLine2: agent.addressLine2,
          city: agent.city,
          state: agent.state,
          postalCode: agent.postalCode,
          country: agent.country,
          joinedDate: joinedDate,
        });

        // Load related entities
        this.loadRelatedEntities(agent.forumId, agent.areaId, agent.unitId);

        // Disable immutable fields based on status
        if (!this.isDraftMode()) {
          // For approved agents, only allow updating certain fields
          this.agentForm.get('forumId')?.disable();
          this.agentForm.get('areaId')?.disable();
          this.agentForm.get('unitId')?.disable();
          this.agentForm.get('agentCode')?.disable();
          this.agentForm.get('dateOfBirth')?.disable();
          this.agentForm.get('gender')?.disable();
          this.agentForm.get('email')?.disable();
          this.agentForm.get('joinedDate')?.disable();
        }

        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load agent:', error);
        this.loading.set(false);
      },
    });
  }

  private loadRelatedEntities(forumId: string, areaId: string, unitId: string): void {
    // Load forum
    this.forumService.getForum(forumId).subscribe({
      next: (forum) => {
        const currentForums = this.forums();
        if (!currentForums.find((f) => f.forumId === forum.forumId)) {
          this.forums.set([forum, ...currentForums]);
        }
      },
      error: (error) => console.error('Failed to load forum:', error),
    });

    // Load area
    this.areaService.getArea(areaId).subscribe({
      next: (area) => {
        const currentAreas = this.areas();
        if (!currentAreas.find((a) => a.areaId === area.areaId)) {
          this.areas.set([area, ...currentAreas]);
        }
      },
      error: (error) => console.error('Failed to load area:', error),
    });

    // Load unit
    this.unitService.getUnit(unitId).subscribe({
      next: (unit) => {
        const currentUnits = this.units();
        if (!currentUnits.find((u) => u.unitId === unit.unitId)) {
          this.units.set([unit, ...currentUnits]);
        }
      },
      error: (error) => console.error('Failed to load unit:', error),
    });
  }

  private formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onForumSearch(searchTerm: string): void {
    this.loadForums(searchTerm);
  }

  private loadForums(searchTerm: string): void {
    this.forumsLoading.set(true);
    this.forumService
      .searchForums({
        searchTerm,
        page: 1,
        pageSize: 50,
      })
      .subscribe({
        next: (response) => {
          this.forums.set(response.items);
          this.forumsLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load forums:', error);
          this.forumsLoading.set(false);
        },
      });
  }

  onAreaSearch(searchTerm: string): void {
    this.loadAreas(searchTerm);
  }

  private loadAreas(searchTerm: string): void {
    this.areasLoading.set(true);
    this.areaService
      .searchAreas({
        searchTerm,
        page: 1,
        pageSize: 50,
      })
      .subscribe({
        next: (response) => {
          this.areas.set(response.items);
          this.areasLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load areas:', error);
          this.areasLoading.set(false);
        },
      });
  }

  onUnitSearch(searchTerm: string): void {
    this.loadUnits(searchTerm);
  }

  private loadUnits(searchTerm: string): void {
    this.unitsLoading.set(true);
    this.unitService
      .searchUnits({
        searchTerm,
        page: 1,
        pageSize: 50,
      })
      .subscribe({
        next: (response) => {
          this.units.set(response.items);
          this.unitsLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load units:', error);
          this.unitsLoading.set(false);
        },
      });
  }

  getFieldError(fieldName: string): string {
    const control = this.agentForm.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'This field is required';
    }
    if (control.errors['maxlength']) {
      return `Maximum ${control.errors['maxlength'].requiredLength} characters allowed`;
    }
    if (control.errors['email']) {
      return 'Invalid email format';
    }

    return 'Invalid value';
  }

  isFormValid(): boolean {
    return this.agentForm.valid;
  }

  onSaveAsDraft(): void {
    if (this.saving()) return;

    this.saving.set(true);

    const agentId = this.currentAgentId();

    if (!agentId) {
      // First time save - register agent
      const registerData: RegisterAgentRequest = {
        unitId: this.agentForm.value.unitId,
        areaId: this.agentForm.value.areaId,
        forumId: this.agentForm.value.forumId,
        agentCode: this.agentForm.value.agentCode,
        firstName: this.agentForm.value.firstName,
        middleName: this.agentForm.value.middleName,
        lastName: this.agentForm.value.lastName,
        dateOfBirth: this.agentForm.value.dateOfBirth,
        gender: this.agentForm.value.gender,
        contactNumber: this.agentForm.value.contactNumber,
        alternateContactNumber: this.agentForm.value.alternateContactNumber,
        email: this.agentForm.value.email,
        addressLine1: this.agentForm.value.addressLine1,
        addressLine2: this.agentForm.value.addressLine2,
        city: this.agentForm.value.city,
        state: this.agentForm.value.state,
        postalCode: this.agentForm.value.postalCode,
        country: this.agentForm.value.country,
        joinedDate: this.agentForm.value.joinedDate,
      };

      this.agentService.registerAgent(registerData).subscribe({
        next: (response) => {
          this.currentAgentId.set(response.agentId);
          this.isDraftMode.set(true);
          this.saving.set(false);
          console.log('Draft saved with agentId:', response.agentId);
        },
        error: (error) => {
          console.error('Failed to register agent:', error);
          this.saving.set(false);
        },
      });
    } else {
      // Update existing draft
      const updateData: UpdateDraftRequest = {
        firstName: this.agentForm.value.firstName,
        middleName: this.agentForm.value.middleName,
        lastName: this.agentForm.value.lastName,
        dateOfBirth: this.agentForm.value.dateOfBirth,
        gender: this.agentForm.value.gender,
        contactNumber: this.agentForm.value.contactNumber,
        alternateContactNumber: this.agentForm.value.alternateContactNumber,
        email: this.agentForm.value.email,
        addressLine1: this.agentForm.value.addressLine1,
        addressLine2: this.agentForm.value.addressLine2,
        city: this.agentForm.value.city,
        state: this.agentForm.value.state,
        postalCode: this.agentForm.value.postalCode,
        country: this.agentForm.value.country,
      };

      this.agentService.updateDraft(agentId, updateData).subscribe({
        next: () => {
          this.saving.set(false);
          console.log('Draft updated');
        },
        error: (error) => {
          console.error('Failed to update draft:', error);
          this.saving.set(false);
        },
      });
    }
  }

  onSubmit(): void {
    if (!this.isFormValid() || this.submitting()) return;

    const agentId = this.currentAgentId();

    if (!agentId) {
      // Need to save as draft first
      this.onSaveAsDraft();
      setTimeout(() => {
        if (this.currentAgentId()) {
          this.submitRegistration();
        }
      }, 500);
    } else if (this.isDraftMode()) {
      // Submit draft for approval
      this.submitRegistration();
    } else {
      // Update approved agent
      this.updateApprovedAgent();
    }
  }

  private submitRegistration(): void {
    const agentId = this.currentAgentId();
    if (!agentId) return;

    this.submitting.set(true);
    this.agentService.submitAgent(agentId).subscribe({
      next: () => {
        this.submitting.set(false);
        this.agentService.getAgent(agentId).subscribe({
          next: (agent) => {
            this.saved.emit(agent);
            this.openChange.emit(false);
          },
        });
      },
      error: (error) => {
        console.error('Failed to submit agent:', error);
        this.submitting.set(false);
      },
    });
  }

  private updateApprovedAgent(): void {
    const agentId = this.currentAgentId();
    if (!agentId) return;

    this.submitting.set(true);
    const updateData: UpdateAgentRequest = {
      firstName: this.agentForm.value.firstName,
      middleName: this.agentForm.value.middleName,
      lastName: this.agentForm.value.lastName,
      contactNumber: this.agentForm.value.contactNumber,
      alternateContactNumber: this.agentForm.value.alternateContactNumber,
      addressLine1: this.agentForm.value.addressLine1,
      addressLine2: this.agentForm.value.addressLine2,
      city: this.agentForm.value.city,
      state: this.agentForm.value.state,
      postalCode: this.agentForm.value.postalCode,
      country: this.agentForm.value.country,
    };

    this.agentService.updateAgent(agentId, updateData).subscribe({
      next: (agent) => {
        this.submitting.set(false);
        this.saved.emit(agent);
        this.openChange.emit(false);
      },
      error: (error) => {
        console.error('Failed to update agent:', error);
        this.submitting.set(false);
      },
    });
  }

  onCancel(): void {
    this.cancelled.emit();
    this.openChange.emit(false);
  }
}
