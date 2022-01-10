import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinesPlotComponent } from './lines-plot.component';

describe('LinesPlotComponent', () => {
  let component: LinesPlotComponent;
  let fixture: ComponentFixture<LinesPlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LinesPlotComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LinesPlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
