import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchitecturePlotComponent } from './architecture-plot.component';

describe('ArchitecturePlotComponent', () => {
  let component: ArchitecturePlotComponent;
  let fixture: ComponentFixture<ArchitecturePlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArchitecturePlotComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ArchitecturePlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
