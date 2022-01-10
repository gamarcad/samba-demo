import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Communication} from "../communications-plot.component";
import {SambaChapter, SambaEntity, SambaState} from "../../state";
import {Execution, FocusedNodeTracker, SecurityOption} from "../../../app.component";
import {permutation} from "../../../utils/permutation";

export interface token {
  message: string,
  aes: boolean,
  mask: boolean,
  paillier: boolean,
  permutation: boolean,
}

export interface EncryptedMessage {
  tokens: token[]
}

@Component({
  selector: 'app-single-communications-plot',
  templateUrl: './single-communications-plot.component.html',
  styleUrls: ['./single-communications-plot.component.scss']
})
export class SingleCommunicationsPlotComponent implements OnInit, OnChanges {

  static LABEL_SIZE = 18;


  static FROM_X = 0
  static FROM_Y = 0
  static TO_X = 100
  static TO_Y = 0

  @Input() secure : boolean | undefined;
  @Input() securityOption : SecurityOption | undefined;
  @Input() communication : Communication | undefined;
  @Input() execution : Execution | undefined;
  @Input() focusedNode : FocusedNodeTracker = {nodeIndex: 0};

  text : string = "";
  options : any;
  updateOptions : any;
  private graphIsSetUp: boolean;
  message : EncryptedMessage = {tokens: []}

  constructor() {
    this.graphIsSetUp = false;
  }

  ngOnInit(): void {
    if ( !this.graphIsSetUp ) this.setUpGraph()
    this.drawCommunication()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ( !this.graphIsSetUp ) this.setUpGraph()
    this.drawCommunication()
  }

  setUpGraph() {

    let paddingGenerator = ( node : string, position : 'left' | 'right' ) => {
      let direction = (position == 'left' ? 1 : -1)
      if ( node == SambaEntity.CUSTOMER ) {
        return [ 20 * direction, 25 ]
      }
      if ( node.startsWith("Data") ) {
        return [ 16 * direction, 25 ]
      } else {
        return [ 5 * direction, 25 ]
      }
    }

    if ( this.communication == undefined ) return
    this.options = {
      tooltip: {},
      animation: false,
        series: [
        {
          type: 'graph',
          layout: 'none',
          symbolSize: 30,
          label: {
            fontSize: SingleCommunicationsPlotComponent.LABEL_SIZE,
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
          data: [{
            name: this.communication.from.name,
            value: this.communication.from.value,
            x: SingleCommunicationsPlotComponent.FROM_X,
            y: SingleCommunicationsPlotComponent.FROM_Y,
            label: {
              offset: paddingGenerator(this.communication.from.name, 'left'),
              color: '#000'
            },
            itemStyle: {
              color: this.communication.from.color
            }
          },
            {
              name: this.communication.to.name,
              value: this.communication.to.value,
              label: {
                offset: paddingGenerator(this.communication.to.name, 'right'),
                color: '#000'
              },
              x: SingleCommunicationsPlotComponent.TO_X,
              y: SingleCommunicationsPlotComponent.TO_Y,
              itemStyle: {
                color: this.communication.to.color
              }
            }],
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
    this.graphIsSetUp = true
  }

  drawCommunication() {
    if (
      this.execution == undefined ||
      this.secure == undefined ||
      this.securityOption == undefined ||
      this.communication == undefined
    ) {
      console.warn("[SingleComm] Undefined parameters: skipping execution")
      return
    }

    // update graph
    let message = this.getMessage(
      this.execution,
      this.secure,
      this.securityOption,
      this.communication,
    )

    if ( typeof message == "string") {
      this.message = { tokens: [{ message: message, aes: false, mask: false, paillier: false, permutation: false }] }
    } else {
      this.message = message
    }

    // update tooltip over the nodes
    let nodes = [
      {
        name: this.communication.from.name,
        value: SambaEntity.known(this.communication.from.name, this.secure, this.securityOption),
        x: SingleCommunicationsPlotComponent.FROM_X,
        y: SingleCommunicationsPlotComponent.FROM_Y,
        label: {
          color: '#000'
        },
        itemStyle: {
          color: this.communication.from.color
        }
      },
      {
        name: this.communication.to.name,
        value: SambaEntity.known(this.communication.to.name, this.secure, this.securityOption),
        x: SingleCommunicationsPlotComponent.TO_X,
        y: SingleCommunicationsPlotComponent.TO_Y,
        label: {
          color: '#000'
        },
        itemStyle: {
          color: this.communication.to.color
        }
      },
    ]
    console.log("Updated nodes", nodes)

    this.updateOptions = {
      series: {
        data: nodes,
        links: [{
          source: this.communication?.from.name,
          target: this.communication?.to.name,
          label: {
            show: true,
            color: "#000",
            padding: 13,
            formatter: '',
            fontSize: 10,
          }
        }]
      }
    }
  }

  private createToken( msg : string, aes= false, permutation = false, mask = false, paillier = false ) : token {
    return {
      message: msg,
      aes: aes,
      mask: mask,
      paillier: paillier,
      permutation: permutation,
    }
  }

  private getMessage(
    execution : Execution,
    secure : boolean,
    securityOption : SecurityOption,
    communication : Communication
  ) : EncryptedMessage | string
  {

    // if the current state represented by the communication is not performed yet, print no message
    let state = execution.state
    let history = execution.history



    if ( execution.chapter == SambaChapter.BEGIN || execution.chapter == SambaChapter.INITIAL_EXPLORATION ) return ""
    if ( state < communication.state ) return ""

    // if we reach the end of the protocol, we do not need to display communications occurred during the core of
    // the protocol
    if ( (state == SambaState.STEP_6 || state == SambaState.STEP_7) && communication.state != SambaState.STEP_6 && communication.state != SambaState.STEP_7 )
      return ""


    // regarding on the state, we must create the corresponding message
    switch (communication.state) {
      case SambaState.STEP_2:
      {
        // At step 2, the node compute a score which is send next to the controller.
        // Hence we need to load it from the execution based on the currnent turn
        let score = <number>execution?.currentTurn?.scores[this.focusedNode.nodeIndex]

        // in case where the score must be masked, mask it
        if ( secure && securityOption.mask ) {
          let mask = this.createMask( <number>execution.turnIndex )
          score = score * mask
        }


        // round the score to avoid float growth
        let scoreText = score.toFixed(2)
        let messages : EncryptedMessage = {
          tokens: [],
        }
        if ( secure && securityOption.aes ) {
          messages.tokens.push(this.createToken( "AES(", true ))
          messages.tokens.push(this.createToken( scoreText, false, false, secure && securityOption.mask ))
          messages.tokens.push(this.createToken( ")", true))
        } else {
          messages.tokens.push(this.createToken( scoreText, false, false, secure && securityOption.mask ))
        }

        return messages
      }

      case SambaState.STEP_3:
      {
        // At step 3, the controller send the scores to the comp.
        // hence we need to create the appropriated list, depending on if permutation and/or aes are available
        // To do that, we create the list, that we manipulate and returns$
        // In case where the permutation need to be change
        let scores : number[] = []
        for ( let index = 0; index < history.nb_arms; index++ ) {
          let score = <number>execution?.currentTurn?.scores[index]
          scores.push(score)
        }
        let perm = permutation.CreatePermutationFromSeed( history.nb_arms, <number>execution.turnIndex );
        if ( secure && securityOption.permutation ) {
          scores = permutation.PermuteList( perm, scores )
        }



        let messages : EncryptedMessage = {
          tokens: [],
        }
        for ( let index  = 0; index < scores.length; index++ ) {
          let score = scores[index]
          if ( secure && securityOption.mask ) {
            let mask = this.createMask(<number>execution.turnIndex)
            score = score * mask
          }

          // round the score to avoid float growth
          let scoreText : string = score.toFixed(2)
          let scoreIsPermuted = secure && securityOption.permutation && index != perm.permutation[index]
          if ( secure && securityOption.aes ) {
            messages.tokens.push(
              this.createToken(
                "AES(",
                true,
                scoreIsPermuted
              )
            )
            messages.tokens.push(
              this.createToken(
                scoreText,
                false,
                scoreIsPermuted,
                secure && securityOption.mask
              ))
            messages.tokens.push(
              this.createToken(
                ")",
                true,
                scoreIsPermuted
              ))
          } else {
            messages.tokens.push(
              this.createToken(
                scoreText,
                false,
                scoreIsPermuted,
                secure && securityOption.mask
              ))
          }
        }

        return messages
      }

      case SambaState.STEP_4:
      {
        // At step 4, Comp computes and returns the selection bits, possibly permuted and encrypted
        let selectionBits = []
        for ( let index = 0; index < history.nb_arms; index++ ) {
          let selectedArm = <number>this.execution?.currentTurn?.selected_arm
          selectionBits.push( selectedArm == index ? 1 : 0 )
        }

        // In case where the permutation is required
        let perm = permutation.CreatePermutationFromSeed( history.nb_arms, <number>execution.turnIndex );
        if ( secure && securityOption.permutation ) {
          selectionBits = permutation.PermuteList( perm, selectionBits )
        }

        let messages : EncryptedMessage = {
          tokens: [],
        }
        for ( let index = 0; index < selectionBits.length; index++ ) {
          let scoreIsPermuted = secure && securityOption.permutation && index != perm.permutation[index]
          let bit = selectionBits[index]
          if ( secure && securityOption.aes ) {
            messages.tokens.push(this.createToken( "AES(", true, scoreIsPermuted ))
            messages.tokens.push(this.createToken( bit, false, scoreIsPermuted ))
            messages.tokens.push(this.createToken( ")", true, scoreIsPermuted))
          } else {
            messages.tokens.push(this.createToken( bit, false, scoreIsPermuted ))
          }
        }

        return messages
      }

      case SambaState.STEP_5:
      {
        // At step 5, the Controller sends back every selection bit possibly encrypted
        let selectedArm = <number>this.execution?.currentTurn?.selected_arm
        let selectionBit = selectedArm == this.focusedNode.nodeIndex ? "1" : "0"

        let messages : EncryptedMessage = {
          tokens: [],
        }
        if ( secure && securityOption.aes ) {
          messages.tokens.push(this.createToken( "AES(", true))
          messages.tokens.push(this.createToken( selectionBit ))
          messages.tokens.push(this.createToken( ")", true ))
        } else {
          messages.tokens.push(this.createToken( selectionBit ))
        }

        return messages
      }

      case SambaState.STEP_6:
      {
        // At step 6, each Node send his partial cumulative reward to the Controller
        let cumulativeReward = execution.nodes[this.focusedNode.nodeIndex].reward.toLocaleString()

        let messages : EncryptedMessage = {
          tokens: [],
        }

        if ( secure && securityOption.paillier ) {
          messages.tokens.push(this.createToken( "Paillier(", false, false, false, true))
          messages.tokens.push(this.createToken( cumulativeReward ))
          messages.tokens.push(this.createToken( ")", false, false, false, true ))
        } else {
          messages.tokens.push(this.createToken( cumulativeReward ))
        }

        return messages
      }

      case SambaState.STEP_7:
      {
        let totalCumulativeReward = 0
        for ( let node of execution.nodes ) {
          totalCumulativeReward += node.reward
        }
        let messages : EncryptedMessage = {
          tokens: [],
        }
        if ( secure && securityOption.paillier ) {
          messages.tokens.push(this.createToken( "Paillier(", false, false, false, true))
          messages.tokens.push(this.createToken( totalCumulativeReward.toLocaleString() ))
          messages.tokens.push(this.createToken( ")", false, false, false, true ))
        } else {
          messages.tokens.push(this.createToken( totalCumulativeReward.toLocaleString() ))
        }

        return messages
      }


      default: return ""

    }
  }

  private formatList( list : any[] ) : string {
    let res = ""
    for ( let v of list ) {
      res = res + v + " "
    }
    return res
  }

  private getEncryptedLikeString( message : any, scheme : 'aes' | 'paillier' )  : string {
    switch (scheme) {
      case "aes": return 'AES(' + message + ')'
      case 'paillier': return 'Paillier(' + message + ')'
    }
  }

  private createMask( turn : number ) : number {
    return 1 / (turn % 3 + 1)
  }


}
