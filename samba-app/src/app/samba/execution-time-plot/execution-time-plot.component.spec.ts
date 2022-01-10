import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExecutionTimePlotComponent } from './execution-time-plot.component';

describe('ExecutionTimePlotComponent', () => {
  let component: ExecutionTimePlotComponent;
  let fixture: ComponentFixture<ExecutionTimePlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExecutionTimePlotComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExecutionTimePlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
