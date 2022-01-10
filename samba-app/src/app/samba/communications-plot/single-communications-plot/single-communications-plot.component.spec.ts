import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleCommunicationsPlotComponent } from './single-communications-plot.component';

describe('SingleCommunicationsPlotComponent', () => {
  let component: SingleCommunicationsPlotComponent;
  let fixture: ComponentFixture<SingleCommunicationsPlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SingleCommunicationsPlotComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SingleCommunicationsPlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
