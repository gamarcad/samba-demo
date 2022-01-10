import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Execution, SecurityOption} from "../../app.component";
import {SambaConfigs, SambaConfigsFabric} from "../samba-configs";
import {SambaChapter, SambaEntity} from "../state";
import {ExecutionHistory} from "../executionHistory";

@Component({
  selector: 'app-execution-time-components-plot',
  templateUrl: './execution-time-components-plot.component.html',
  styleUrls: ['./execution-time-components-plot.component.scss']
})
export class ExecutionTimeComponentsPlotComponent implements OnInit, OnChanges {

  private static LABEL_FONTSIZE = 18;
  @Input() execution : Execution | undefined;
  @Input() securityOption : SecurityOption | undefined;
  private sambaConfigs : SambaConfigs;



  options1 : any = {
    series: [
      {
        type: 'pie',
        radius: [14, 30],
        data: [
          { value: 1, name: SambaEntity.CONTROLLER, },
          { value: 1, name: SambaEntity.COMP,  },
          { value: 1, name: SambaEntity.CUSTOMER, label: {show: true}  },
          { value: 1, name: SambaEntity.genNodeName("i"), label: {show: true}  },
        ],
      }
    ]
  };
  updateOptions1 : any;

  options2 : any = {
    series: {
        type: 'pie',
        radius: [14, 30],
        data: [
          { value: 1, name: SambaEntity.CONTROLLER, },
          { value: 1, name: SambaEntity.COMP,  },
          { value: 1, name: SambaEntity.CUSTOMER, label: {show: true}  },
          { value: 1, name: SambaEntity.genNodeName("i"), label: {show: true}  },
        ],
      }
  };
  updateOptions2 : any;


  constructor() {
    this.sambaConfigs = SambaConfigsFabric.configs();
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.update();
  }

  update() : void {
    // do nothing if some variables are undefined
    if ( this.securityOption == undefined || this.execution == undefined ) {
      console.warn("[ExecComp] Some variables are undefined: Skipping the update");
      return;
    }

    // compute the execution time for the not secure execution time components
    let history = this.execution.history
    let sumOfExecutionTime = (history.time.components.arms.reduce((a, b) => a + b))
    let currentTurnIndex = NaN;
    if ( this.execution.chapter == SambaChapter.BEGIN || this.execution.chapter == SambaChapter.INITIAL_EXPLORATION ) {
      currentTurnIndex = 0
    } else if ( this.execution.chapter == SambaChapter.CORE_OF_PROTO ) {
      currentTurnIndex = <number>this.execution.turnIndex
    } else if ( this.execution.chapter == SambaChapter.CUMULATIVE_REWARD_COMPUTATION ) {
      currentTurnIndex = this.execution.history.budget
    } else {
      throw new Error("Undefined chapter" + this.execution.chapter)
    }

    let notSecureExecutionTime = {
      node:  sumOfExecutionTime  / this.execution.history.nb_arms,
      controller: history.time.components.controller,
      customer: history.time.components.customer,
      comp: history.time.components.comp,
    }


    this.updateOptions1 = {
      series: [{
        label: {
          fontSize: ExecutionTimeComponentsPlotComponent.LABEL_FONTSIZE,
          alignTo: 'edge',
          formatter: '{b}\n{time|{c}s}',
          minMargin: 5,
          edgeDistance: 10,
          lineHeight: 15,
          rich: {
            time: {
              fontSize: 10,
              color: '#999'
            }
          }
        },
        labelLine: {
          length: 15,
          length2: 0,
          maxSurfaceAngle: 80
        },
        labelLayout: function (params : any) {
          const isLeft = params.labelRect.x < 300 / 2;
          const points = params.labelLinePoints;
          // Update the end point.
          points[2][0] = isLeft
            ? params.labelRect.x
            : params.labelRect.x + params.labelRect.width;
          return {
            labelLinePoints: points
          };
        },
        data: [
          { value: this.round(notSecureExecutionTime.controller), name: SambaEntity.CONTROLLER, itemStyle: {color: this.sambaConfigs.colors.controller} },
          { value: this.round(notSecureExecutionTime.comp), name: SambaEntity.COMP, itemStyle: {color: this.sambaConfigs.colors.comp} },
          { value: this.round(notSecureExecutionTime.customer), name: SambaEntity.CUSTOMER, itemStyle: {color: this.sambaConfigs.colors.customer} },
          { value: this.round(notSecureExecutionTime.node), name: SambaEntity.genNodeName("i"),  itemStyle: {color: this.sambaConfigs.colors.node} },
        ]
      }]
    }




    // compute the execution time for the secure execution time components
    let nodeSecurityOverhead = 0;
    let compSecurityOverhead = 0;
    let controllerSecurityOverhead = 0;
    let customerSecurityOverhead = 0;

    if ( this.securityOption.aes ) {
      nodeSecurityOverhead +=  (
        history.time.security.aes.decryption + history.time.security.aes.encryption
      )  * history.nb_arms * history.budget;
      compSecurityOverhead +=  (
        history.time.security.aes.decryption + history.time.security.aes.encryption
      )  * history.nb_arms * history.budget;

    }
    if ( this.securityOption.mask ) {
      nodeSecurityOverhead +=  history.time.security.mask * history.nb_arms * history.budget;
    }

    if ( this.securityOption.permutation ) {
      controllerSecurityOverhead += 2 * history.nb_arms * history.time.security.permutation * history.budget;
    }

    if ( this.securityOption.paillier ) {
      nodeSecurityOverhead += history.nb_arms * history.time.security.paillier.encryption;
      controllerSecurityOverhead += history.nb_arms * history.time.security.paillier.addition;
      customerSecurityOverhead += history.time.security.paillier.decryption;
    }

    let secureExecutionTime = {
      node: (sumOfExecutionTime + nodeSecurityOverhead) / this.execution.history.nb_arms,
      controller: notSecureExecutionTime.controller + controllerSecurityOverhead,
      comp: notSecureExecutionTime.comp + compSecurityOverhead,
      customer: notSecureExecutionTime.customer + customerSecurityOverhead,
    }

    this.updateOptions2 = {
      series: {
        label: {
          fontSize: ExecutionTimeComponentsPlotComponent.LABEL_FONTSIZE,
          alignTo: 'edge',
          formatter: '{b}\n{time|{c}s}',
          minMargin: 5,
          edgeDistance: 10,
          lineHeight: 15,
          rich: {
            time: {
              fontSize: 10,
              color: '#999'
            }
          }
      },
        labelLine: {
          length: 15,
          length2: 0,
          maxSurfaceAngle: 80
        },
        labelLayout: function (params : any) {
          const isLeft = params.labelRect.x < 300 / 2;
          const points = params.labelLinePoints;
          // Update the end point.
          points[2][0] = isLeft
            ? params.labelRect.x
            : params.labelRect.x + params.labelRect.width;
          return {
            labelLinePoints: points
          };
        },
        data: [
          { value: this.round(secureExecutionTime.controller), name: SambaEntity.CONTROLLER, itemStyle: {color: this.sambaConfigs.colors.controller} },
          { value: this.round(secureExecutionTime.comp), name: SambaEntity.COMP, itemStyle: {color: this.sambaConfigs.colors.comp} },
          { value: this.round(secureExecutionTime.customer), name: SambaEntity.CUSTOMER, itemStyle: {color: this.sambaConfigs.colors.customer} },
          { value: this.round(secureExecutionTime.node), name: SambaEntity.genNodeName("i"), itemStyle: {color: this.sambaConfigs.colors.node} },
        ]
      }
    }
  }

  private estimate_executon_time( time : number, target_iteration : number, history : ExecutionHistory ) : number {
    return target_iteration * time / history.execution_time.budget
  }

  private round( value : number, decimals : number = 3 ) : string
  {
    return (Math.round(value * 10**decimals) / 10**decimals).toFixed(decimals);
  }

}
