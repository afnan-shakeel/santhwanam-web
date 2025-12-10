import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomDatatable } from './custom-datatable';

describe('CustomDatatable', () => {
  let component: CustomDatatable;
  let fixture: ComponentFixture<CustomDatatable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomDatatable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomDatatable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
