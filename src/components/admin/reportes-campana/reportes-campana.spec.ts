import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesCampana } from './reportes-campana';

describe('ReportesCampana', () => {
  let component: ReportesCampana;
  let fixture: ComponentFixture<ReportesCampana>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesCampana]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportesCampana);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
