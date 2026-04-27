import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CampanaForm } from './campana-form';

describe('CampanaForm', () => {
  let component: CampanaForm;
  let fixture: ComponentFixture<CampanaForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampanaForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CampanaForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
