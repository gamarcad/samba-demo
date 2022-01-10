import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LinesPlotComponent } from './utils/lines-plot/lines-plot.component';
import { ArchitectureComponent } from './utils/architecture/architecture.component';
import {FormsModule} from "@angular/forms";
import { ExecutionTimePlotComponent } from './samba/execution-time-plot/execution-time-plot.component';
import { NgxEchartsModule } from 'ngx-echarts';
import { CommunicationsPlotComponent } from './samba/communications-plot/communications-plot.component';
import { ExecutionTimeComponentsPlotComponent } from './samba/execution-time-components-plot/execution-time-components-plot.component';
import { ArchitecturePlotComponent } from './samba/architecture-plot/architecture-plot.component';
import { SingleCommunicationsPlotComponent } from './samba/communications-plot/single-communications-plot/single-communications-plot.component';
import { ActionTextComponent } from './samba/action-text/action-text.component';
import { HistoryComponent } from './samba/history/history.component';

@NgModule({
  declarations: [
    AppComponent,
    LinesPlotComponent,
    ArchitectureComponent,
    ExecutionTimePlotComponent,
    CommunicationsPlotComponent,
    ExecutionTimeComponentsPlotComponent,
    ArchitecturePlotComponent,
    SingleCommunicationsPlotComponent,
    ActionTextComponent,
    HistoryComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
