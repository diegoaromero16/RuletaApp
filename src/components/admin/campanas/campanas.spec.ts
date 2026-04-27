import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Campanas } from './campanas';

describe('Campanas', () => {
  let component: Campanas;
  let fixture: ComponentFixture<Campanas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Campanas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Campanas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
