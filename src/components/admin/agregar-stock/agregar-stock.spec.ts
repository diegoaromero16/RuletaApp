import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarStock } from './agregar-stock';

describe('AgregarStock', () => {
  let component: AgregarStock;
  let fixture: ComponentFixture<AgregarStock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarStock]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarStock);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
