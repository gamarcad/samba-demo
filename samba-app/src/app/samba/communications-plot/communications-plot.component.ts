import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {SambaChapter, SambaEntity, SambaState} from "../state";
import {Execution, FocusedNodeTracker, SecurityOption} from "../../app.component";
import {SambaConfigs, SambaConfigsFabric} from "../samba-configs";
import {ArchitectureComponent} from "../../utils/architecture/architecture.component";
import {ArchitecturePlotComponent} from "../architecture-plot/architecture-plot.component";


export interface Communication {
  chapter : SambaChapter,
  state: SambaState,
  from: { name: string, value: string, color: string  },
  to: { name: string, value: string, color: string, },
  message: string,
  hidden: boolean,
}


@Component({
  selector: 'app-communications-plot',
  templateUrl: './communications-plot.component.html',
  styleUrls: ['./communications-plot.component.scss']
})
export class CommunicationsPlotComponent implements OnInit, OnChanges {

  @Input() securityOptions : SecurityOption | undefined;
  @Input() execution : Execution | undefined;
  @Input() focusedNodeIndex : FocusedNodeTracker;


  private configs : SambaConfigs;
  communications : Communication[];
  NODE = "Data Owner 0"
  CUSTOMER  = "Data Customer"

  constructor() {
    this.focusedNodeIndex = {nodeIndex: 0};

    // create the communication
    this.configs = SambaConfigsFabric.configs();
    this.communications  = [
      {
        chapter: SambaChapter.CORE_OF_PROTO,
        state: SambaState.STEP_2,
        from: { name: SambaEntity.genNodeName("i"), value: ArchitecturePlotComponent.NODE_KNOW, color: this.configs.colors.node },
        to: { name: SambaEntity.CONTROLLER, value: ArchitecturePlotComponent.CONTROLLER_KNOW, color: this.configs.colors.controller },
        message: "",
        hidden: false,
      },
      {
        chapter: SambaChapter.CORE_OF_PROTO,
        state: SambaState.STEP_3,
        from: { name: SambaEntity.CONTROLLER, value: ArchitecturePlotComponent.CONTROLLER_KNOW, color: this.configs.colors.controller },
        to: { name: SambaEntity.COMP, value: ArchitecturePlotComponent.COMP_KNOW, color: this.configs.colors.comp },
        message: "",
        hidden: false,
      },
      {
        chapter: SambaChapter.CORE_OF_PROTO,
        state: SambaState.STEP_4,
        from: { name: SambaEntity.COMP, value: ArchitecturePlotComponent.COMP_KNOW, color: this.configs.colors.comp  },
        to: { name: SambaEntity.CONTROLLER, value: ArchitecturePlotComponent.CONTROLLER_KNOW, color: this.configs.colors.controller },
        message: "",
        hidden: false,
      },
      {
        chapter: SambaChapter.CORE_OF_PROTO,
        state: SambaState.STEP_5,
        from: { name: SambaEntity.CONTROLLER, value: ArchitecturePlotComponent.CONTROLLER_KNOW, color: this.configs.colors.controller },
        to: { name: SambaEntity.genNodeName("i"), value: ArchitecturePlotComponent.NODE_KNOW, color: this.configs.colors.node },
        message: "",
        hidden: false,
      },
      {
        chapter: SambaChapter.CUMULATIVE_REWARD_COMPUTATION,
        state: SambaState.STEP_6,
        from: { name: SambaEntity.genNodeName("i"), value: ArchitecturePlotComponent.NODE_KNOW,  color: this.configs.colors.node },
        to: { name: SambaEntity.CONTROLLER, value: ArchitecturePlotComponent.CONTROLLER_KNOW, color: this.configs.colors.controller },
        message: "",
        hidden: false,
      },
      {
        chapter: SambaChapter.CUMULATIVE_REWARD_COMPUTATION,
        state: SambaState.STEP_7,
        from: { name: SambaEntity.CONTROLLER, value: ArchitecturePlotComponent.CONTROLLER_KNOW, color: this.configs.colors.controller },
        to: { name: SambaEntity.CUSTOMER, value: ArchitecturePlotComponent.CUSTOMER_KNOW, color: this.configs.colors.customer },
        message: "",
        hidden: false,
      },
    ]

  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ( this.execution == undefined ) return
    for ( let comm of this.communications ) {
      if ( this.execution.chapter != SambaChapter.CUMULATIVE_REWARD_COMPUTATION  ) {
        comm.hidden = comm.chapter == SambaChapter.CUMULATIVE_REWARD_COMPUTATION
      } else {
        comm.hidden = comm.chapter != SambaChapter.CUMULATIVE_REWARD_COMPUTATION
      }
    }

    console.log("[Comm] Updated communications", this.communications)

  }



}
