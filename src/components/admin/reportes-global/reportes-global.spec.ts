import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesGlobal } from './reportes-global';

describe('ReportesGlobal', () => {
  let component: ReportesGlobal;
  let fixture: ComponentFixture<ReportesGlobal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesGlobal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportesGlobal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
