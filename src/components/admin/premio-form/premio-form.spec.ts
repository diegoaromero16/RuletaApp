import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PremioForm } from './premio-form';

describe('PremioForm', () => {
  let component: PremioForm;
  let fixture: ComponentFixture<PremioForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PremioForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PremioForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
