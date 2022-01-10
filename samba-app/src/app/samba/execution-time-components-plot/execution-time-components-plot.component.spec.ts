import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExecutionTimeComponentsPlotComponent } from './execution-time-components-plot.component';

describe('ExecutionTimeComponentsPlotComponent', () => {
  let component: ExecutionTimeComponentsPlotComponent;
  let fixture: ComponentFixture<ExecutionTimeComponentsPlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExecutionTimeComponentsPlotComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExecutionTimeComponentsPlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
