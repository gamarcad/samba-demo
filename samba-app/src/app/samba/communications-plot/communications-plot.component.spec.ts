import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunicationsPlotComponent } from './communications-plot.component';

describe('CommunicationsPlotComponent', () => {
  let component: CommunicationsPlotComponent;
  let fixture: ComponentFixture<CommunicationsPlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommunicationsPlotComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommunicationsPlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
