import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CampanaDetalle } from './campana-detalle';

describe('CampanaDetalle', () => {
  let component: CampanaDetalle;
  let fixture: ComponentFixture<CampanaDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CampanaDetalle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CampanaDetalle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
