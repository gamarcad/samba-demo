import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {SambaConfigs, SambaConfigsFabric} from "../samba-configs";
import {ExecutionHistory} from "../executionHistory";
import {SambaChapter, SambaEntity, SambaState} from "../state";
import {Execution, SecurityOption} from "../../app.component";

@Component({
  selector: 'app-architecture-plot',
  templateUrl: './architecture-plot.component.html',
  styleUrls: ['./architecture-plot.component.scss']
})
export class ArchitecturePlotComponent implements OnInit, OnChanges {

  static NODE_FONTSIZE = 18;
  static AES_KEY = "AESKey"
  static PAILLIER_PK_KEY = "PaillierPK"
  static PAILLIER_SK_KEY = "PaillierSK"
  static MASK = "Mask"
  static PERM  ="Perm"

  static NODE_KNOW =  ArchitecturePlotComponent.AES_KEY + ", " + ArchitecturePlotComponent.PAILLIER_PK_KEY + ", " + ArchitecturePlotComponent.MASK
  static COMP_KNOW = ArchitecturePlotComponent.AES_KEY;
  static CUSTOMER_KNOW = ArchitecturePlotComponent.PAILLIER_PK_KEY + ", " + ArchitecturePlotComponent.PAILLIER_SK_KEY
  static CONTROLLER_KNOW = ArchitecturePlotComponent.PERM

  @Input() securityOption : SecurityOption | undefined;
  @Input() execution : Execution | undefined;
  @Input() onNodeClick : (( nodeIndex: number ) => void) | undefined;

  private configs : SambaConfigs;

  options : any;
  updateOptions : any;

  constructor() {
    this.configs = SambaConfigsFabric.configs();
    this.options = {
      tooltip: {},
      animationDurationUpdate: 200,
      animationDuration: 200,
      animationEasingUpdate: 'quinticInOut',
      series: [
        {
          type: 'graph',
          layout: 'none',
          symbolSize: 40,
          label: {
            show: true,
          },
          edgeSymbol: ['circle', 'arrow'],
          edgeSymbolSize: [4, 10],
          edgeLabel: {
            normal: {
              textStyle: {
                fontSize: 20
              }
            }
          },
          data: [],
          links: [],
          lineStyle: {
            normal: {
              opacity: 0.9,
              width: 2,
              curveness: 0
            }
          }
        }
      ]
    }
  }
  ngOnChanges( changes : SimpleChanges ) : void {
    this.drawArchitecture()
  }

  ngOnInit(): void {
    this.drawArchitecture()
  }

  onArchitectureClick(event : any ) {
    let clickedEntityName  = event.name
    if ( clickedEntityName.startsWith("Data Owner") ) {
      let nodeIndex = parseInt(clickedEntityName.split(' ')[1])
      if ( this.onNodeClick ) {
        this.onNodeClick( nodeIndex )
      }
    }
  }

  drawArchitecture() {
    // skip the drawing in case where the execution is not defined
    if ( this.execution === undefined || this.securityOption == undefined ) {
      console.warn("[Arch] Execution is not defined: skipping drawing")
      return
    } else {
      console.log("[Arch] Drawing the plot")
    }

    // draw nodes
    // Defining constants used to render the graph.
    // Notice the negative height, which is mandatory to get a controller/comp/customer nodes above
    // of data owners nodes.

    const width = 70;
    const height = 25;


    // drawing controller, comp, customer, external observer
    const middle = width / 2;
    let nodes = []
    nodes.push({
      name: SambaEntity.CONTROLLER,
      value: SambaEntity.known( SambaEntity.CONTROLLER, true, this.securityOption ),
      x: middle,
      y: -height,
      itemStyle:  {
        color: this.configs.colors.controller,
      },
      label: {
        fontSize: ArchitecturePlotComponent.NODE_FONTSIZE,
        color: "#000",
        offset: [0, -30]
      }
    })
    nodes.push({
      name: SambaEntity.COMP,
      value: SambaEntity.known( SambaEntity.COMP, true, this.securityOption ),
      x: middle / 4,
      y: -height,
      itemStyle:  {
        color: this.configs.colors.comp,
      },
      label: {
        fontSize: ArchitecturePlotComponent.NODE_FONTSIZE,
        color: "#000",
        offset: [0, -30]
      }
    })

    nodes.push({
      name: SambaEntity.CUSTOMER,
      value: SambaEntity.known( SambaEntity.CUSTOMER, true, this.securityOption ),
      x: middle * 2,
      y: -height,
      itemStyle: {
        color: this.configs.colors.customer
      },
      label: {
        fontSize: ArchitecturePlotComponent.NODE_FONTSIZE,
        color: "#000",
        offset: [0, -30]
      }
    })


    // drawing nodes
    let history = this.execution.history
    for (let index = 0; index < history.nb_arms; index++ ) {
      let nodeName = SambaEntity.genNodeName(index)
      let know = SambaEntity.known( SambaEntity.NODE, true, this.securityOption )
      let prob = this.execution.history.probs[index].toFixed(2)
      if ( know ) {
        know = prob + " - " + know
      } else {
        know = prob
      }
      nodes.push({
        name: nodeName,
        value: know,
        x: (width / (history.nb_arms - 1)) * index + ( (history.nb_arms / 2) - index  ) * 10 / history.nb_arms,
        y: 0,
        itemStyle: { color: this.configs.colors.node },
        label: {
          color: "#000",
          offset: [0, 30],
          fontSize: ArchitecturePlotComponent.NODE_FONTSIZE,
        },
        tooltip: {
          textStyle: {
            fontSize: 12,
          }
        }
      })
    }

    // edges are drawn only inside the core of the protocol or in the cumulative reward computation chapters
    let edges = []
    if ( this.execution.chapter != SambaChapter.BEGIN && this.execution.chapter != SambaChapter.INITIAL_EXPLORATION ){
      if ( this.execution.state   == SambaState.STEP_2 ||  this.execution.state  == SambaState.STEP_5 ) {
        for ( let index = 0; index < history.nb_arms; index++ ) {
          let nodeName = SambaEntity.genNodeName(index)
          edges.push({
            source: this.execution.state  == SambaState.STEP_2 ? nodeName : SambaEntity.CONTROLLER,
            target: this.execution.state  == SambaState.STEP_2 ? SambaEntity.CONTROLLER : nodeName,
          })
        }
      }

      if ( this.execution.state  == SambaState.STEP_3 || this.execution.state  == SambaState.STEP_4 ) {
        edges.push({
          source: this.execution.state  == SambaState.STEP_3 ? SambaEntity.CONTROLLER : SambaEntity.COMP,
          target: this.execution.state  == SambaState.STEP_3 ? SambaEntity.COMP : SambaEntity.CONTROLLER,
        })
      }

      if ( this.execution.state  == SambaState.STEP_6 ) {
        for ( let index = 0; index < history.nb_arms; index++ ) {
          let nodeName = SambaEntity.genNodeName(index)
          edges.push({
            source: nodeName,
            target: SambaEntity.CONTROLLER,
          })
        }
      }

      if ( this.execution.state  == SambaState.STEP_7 ) {
        edges.push({
          source: SambaEntity.CONTROLLER,
          target: SambaEntity.CUSTOMER,
        })
      }
    }

    this.updateOptions = {
      series:[{
        data: nodes,
        links: edges,
      }]
    }

  }





}
