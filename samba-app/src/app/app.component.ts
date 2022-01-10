import {Component, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {SambaApi} from "./api/samba-api";
import {Algorithm} from "./samba/algorithm";
import {ExecutionHistory, Turn} from "./samba/executionHistory";
import {SambaChapter, SambaState} from "./samba/state";


/**
 * Contains data use
 */
export interface SecurityOption {
  paillier : boolean,
  mask : boolean,
  aes : boolean,
  permutation : boolean,
}



export interface Execution {
  turnIndex : number | undefined,
  state : SambaState,
  currentTurn: Turn | undefined,
  history : ExecutionHistory,
  chapter: SambaChapter,
  nodes: {
    reward: number,
    pulls: number,
  }[],
}

export interface FocusedNodeTracker {
  nodeIndex : number,
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnChanges  {

  PLAY_EXECUTION_TIME = 1000

  ALGORITHMS_SET = [
    { id: Algorithm.THOMPSON_SAMPLING, name: "Thomson Sampling" },
    { id: Algorithm.UCB, name: 'UCB'},
    { id: Algorithm.EPSILON_GREEDY, name:"E Greedy" },
    { id: Algorithm.EPSILON_DECREASING_GREEDY, name:"E Decreasing Greedy" },
    { id: Algorithm.SOFTMAX, name:"Softmax" },
  ]

  BUDGETS_SET = [
    50,
    100,
    200,
    500,
    1000,
  ]

  DATASETS_SET = [
    {
      id: "googlelocal",
      name: "Google Local Review",
    },
    {
      id: 'steam',
      name: "Steam",
    }
  ]

  TRESHOLD_SET = [
    2, 3, 4, 5
  ]

  NB_ARMS_SET = [
    3, 4, 5
  ]


  codeDetailsShowAll : boolean = true;
  showHistoryPopup : boolean = false;
  execution : Execution | undefined;

  selectedAlgorithm : Algorithm;
  selectedBudget: number;
  selectedDataset : string;
  selectedThreshold : number;
  selectedK : number;
  selectedTurnField :  string | undefined;


  history: ExecutionHistory | undefined;
  securityOption : SecurityOption;
  paillier: boolean;
  mask : boolean;
  aes : boolean;
  permutation : boolean;
  isPlaying : boolean = false;

  SambaState : any;
  SambaChapter : any;
  Algorithm : any;
  focusedNode: FocusedNodeTracker;

  constructor( public api : SambaApi ){
    this.selectedAlgorithm = Algorithm.THOMPSON_SAMPLING;
    this.selectedDataset = this.DATASETS_SET[0].id
    this.selectedBudget = this.BUDGETS_SET[0];
    this.selectedThreshold = this.TRESHOLD_SET[0]
    this.selectedK = this.NB_ARMS_SET[0]

    this.focusedNode = {nodeIndex: 0}
    this.execution = undefined;

    this.SambaState = SambaState;
    this.SambaChapter = SambaChapter;
    this.Algorithm = Algorithm

    // init action player
    setInterval(() => {
      if ( this.isPlaying ) {
        this.nextState()
      }
    }, this.PLAY_EXECUTION_TIME)

    // init security components
    this.aes = this.paillier = this.mask = this.permutation = true
    this.securityOption = {
      aes: this.aes,
      mask: this.mask,
      permutation: this.permutation,
      paillier: this.paillier,
    }
  }

  ngOnInit() {
    this.api.test()
    this.changeExecution()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ( this.execution == undefined ) return
    this.updateNodeVariable(this.execution)
  }


  changeExecution() {
    this.api.getExecutionHistory(
      this.selectedAlgorithm,
      this.selectedBudget,
      this.selectedK,
      this.selectedDataset,
      this.selectedThreshold
    )
      .subscribe(
        ( executionHistory : ExecutionHistory ) => {
          console.log("Receiving history", executionHistory)
          this.execution = this.createExecutionFromHistory( executionHistory )
          this.history = executionHistory
        }
      );
  }

  createExecutionFromHistory( history : ExecutionHistory ) : Execution {
    // creete the node history
    let nodes =  []
    for ( let node = 0; node  < history.nb_arms; node++ ) {
      nodes.push({
        reward: 0,
        pulls: 0,
      })
    }

     return {
       history: history,
       nodes: nodes,
       state: SambaState.STEP_2,
       chapter: SambaChapter.BEGIN,
       turnIndex: 1,
       currentTurn: undefined,
     }
  }

  onSecurityOptionsChanged() {
    this.securityOption = {
      aes: this.aes,
      mask: this.mask,
      permutation: this.permutation,
      paillier: this.paillier,
    }
  }

  previousState() {
    // ensure that an execution is defined
    if ( this.execution === undefined ) {
      console.warn("[Main] Execution is not defined, skip the next action");
      return
    }


    // perform the next action depending on the current case
    switch ( this.execution.chapter ) {
      case SambaChapter.INITIAL_EXPLORATION:
      {
        this.execution.chapter = SambaChapter.BEGIN
        this.execution.turnIndex = undefined
        this.execution.currentTurn = undefined
        break
      }

      case SambaChapter.CORE_OF_PROTO:
      {
        if ( this.execution.turnIndex == undefined ) throw new Error("Undefined turn index")
        switch (this.execution.state) {

          // Step 2
          case SambaState.STEP_2:
          {
            if ( this.execution.turnIndex == this.execution.history.nb_arms ) {
              this.execution.chapter = SambaChapter.INITIAL_EXPLORATION
            } else {
              this.execution.turnIndex--;
              this.execution.state = SambaState.STEP_5
              let executionHistory = this.execution.history
              this.execution.currentTurn = executionHistory.turns[ this.execution.turnIndex - executionHistory.nb_arms ]
            }
            break
          }

          // Step 3
          case SambaState.STEP_3:
          {
            this.execution.state = SambaState.STEP_2
            break
          }

          // Step 4
          case SambaState.STEP_4:
          {
            this.execution.state = SambaState.STEP_3
            break
          }

          // Step 5
          case SambaState.STEP_5:
          {
            this.execution.state = SambaState.STEP_4
            break
          }
        }
        break
      }

      case SambaChapter.CUMULATIVE_REWARD_COMPUTATION:
      {
        switch (this.execution.state) {
          case SambaState.STEP_6:
          {
            this.execution.chapter = SambaChapter.CORE_OF_PROTO
            this.execution.state = SambaState.STEP_5
            let history = this.execution.history
            this.execution.turnIndex = history.budget
            this.execution.currentTurn = history.turns[history.turns.length - 1 ]
            break
          }

          case SambaState.STEP_7: {
            this.execution.state = SambaState.STEP_6
            break
          }
        }
      }
    }

    this.updateNodeVariable(this.execution)

    this.execution = JSON.parse(JSON.stringify(this.execution))
  }


  nextState() {
    // ensure that an execution is defined
    if ( this.execution === undefined ) {
      console.warn("[Main] Execution is not defined, skip the next action");
      return
    }


    // perform the next action depending on the current case
    switch ( this.execution.chapter ) {
      // the begin chapter represent the point where no action has been already done
      case SambaChapter.BEGIN:
      {
        this.execution.chapter = SambaChapter.INITIAL_EXPLORATION
        break
      }

      case SambaChapter.INITIAL_EXPLORATION:
      {
        this.execution.chapter = SambaChapter.CORE_OF_PROTO
        this.execution.state = SambaState.STEP_2
        this.execution.turnIndex = this.execution.history.nb_arms
        this.execution.currentTurn = this.execution.history.turns[ this.execution.turnIndex - this.execution.history.nb_arms ]
        break
      }

      case SambaChapter.CORE_OF_PROTO:
      {
        if ( this.execution.turnIndex == undefined ) throw new Error("Undefined turn index")
        switch (this.execution.state) {

          // Step 2
          case SambaState.STEP_2:
          {
            this.execution.state = SambaState.STEP_3
             break
          }

          // Step 3
          case SambaState.STEP_3:
          {
            this.execution.state = SambaState.STEP_4
            break
          }

          // Step 4
          case SambaState.STEP_4:
          {
            this.execution.state = SambaState.STEP_5
            break
          }

          // Step 5
          case SambaState.STEP_5:
          {
            if ( this.execution.turnIndex == this.execution.history.budget ) {
              this.execution.chapter = SambaChapter.CUMULATIVE_REWARD_COMPUTATION
              this.execution.state = SambaState.STEP_6
            } else {
              this.execution.turnIndex++;
              this.execution.state = SambaState.STEP_2
              let executionHistory = this.execution.history
              this.execution.currentTurn = executionHistory.turns[ this.execution.turnIndex - executionHistory.nb_arms ]
            }
            break
          }
        }
        break
      }

      case SambaChapter.CUMULATIVE_REWARD_COMPUTATION:
      {
        switch (this.execution.state) {
          case SambaState.STEP_6:
          {
            this.execution.state = SambaState.STEP_7
            break
          }

          case SambaState.STEP_7: {
            // in case where the player is running, stop it
            this.isPlaying = false
            break

          }
        }
      }
    }

    this.updateNodeVariable(this.execution)

    this.execution = JSON.parse(JSON.stringify(this.execution))
  }

  reset() {
    this.changeExecution();
  }

  updateFocusedNode( nodeIndex : number) {
    this.focusedNode = {nodeIndex: nodeIndex}
  }

  moveToCumulativeRewardChapter() {
    // if needed variables are undefined, skip the execution
    if ( this.execution == undefined ) return
    console.log("[Main] Moving to cumulative reward computations")

    this.execution.chapter = SambaChapter.CUMULATIVE_REWARD_COMPUTATION
    this.execution.state  = SambaState.STEP_6;
    this.execution.turnIndex = this.execution.history.budget
    this.updateNodeVariable( this.execution  )
    this.execution = JSON.parse(JSON.stringify(this.execution))
  }

  updateNodeVariable( execution : Execution ) {
    // define variables that we will used to update node var
    let rewards = []
    let pulls = []

    // update variables depending on the
    let history = execution.history
    switch (execution.chapter) {
      case SambaChapter.BEGIN:
      {
        for ( let node = 0; node < history.nb_arms; node++ ) {
          rewards.push(0)
          pulls.push(0)
        }
        break
      }

      case SambaChapter.INITIAL_EXPLORATION:
      {
        rewards = execution.history.initial_exploration.rewards
        pulls = execution.history.initial_exploration.pulls
        console.log("INIT ", rewards, pulls)
        break
      }

      case SambaChapter.CORE_OF_PROTO:
      {
        if ( execution.currentTurn == undefined ) throw new Error( "Current turn is undefined" )
        switch (execution.state) {
          case SambaState.STEP_5:
          {
            rewards = execution.currentTurn?.nb_rewards
            pulls = execution.currentTurn?.nb_pulls

            break
          }
          default:
          {
            for ( let nodeIndex = 0; nodeIndex < <number>this.execution?.history.nb_arms; nodeIndex++ ) {
              let r = nodeIndex == execution.currentTurn.selected_arm ? execution.currentTurn.reward : 0;
              rewards.push(execution.currentTurn?.nb_rewards[nodeIndex] - r)

              let o = nodeIndex == execution.currentTurn.selected_arm ? 1 : 0;
              pulls.push(execution.currentTurn?.nb_pulls[nodeIndex] - o)
            }
          }
        }
        break
      }

      case SambaChapter.CUMULATIVE_REWARD_COMPUTATION:
      {
        let history = execution.history
        rewards = history.turns[ history.turns.length - 1 ].nb_rewards
        pulls = history.turns[ history.turns.length - 1 ].nb_pulls
      }
    }

    // update variable
    let nodeIndex = 0;
    for ( let node of execution.nodes ) {
      node.reward = rewards[nodeIndex]
      node.pulls = pulls[nodeIndex]
      nodeIndex++
    }
  }

  /**
   * Take the selected turn index given as a string by the user in the input DOM object
   * and update the internal object correctly.
   *
   * Note that the input may not be proper to be used directly.
   * In a such case, no modification occur.
   *
   * If the given value is valid but does not match with the current instance, no modification occur.
   */
  selectTurnByUser() {
    // do nothing if the current execution is undefined
    if (!this.execution || !this.execution.history) {
      console.log("No execution or no history")
      return
    }

    // if input is empty
    if ( !this.selectedTurnField ) {
      console.log("Empty field")
      this.selectedTurnField = "";
      return
    }

    try {
      // read and check the value
      let selectedTurnIndex : number = parseInt(this.selectedTurnField);
      if ( selectedTurnIndex < 1 ||  this.execution.history.budget <= selectedTurnIndex ) {
        this.selectedTurnField = "";
        return
      }

      // move to the desired turn
      while ( <number>this.execution.turnIndex != selectedTurnIndex ) {
        if ( <number>this.execution.turnIndex < selectedTurnIndex ) {
          this.nextState()
        } else {
          this.previousState()
        }
      }
    } catch (e) {
    }
    this.selectedTurnField = "";
  }

  showHistory() {
    this.showHistoryPopup = true;
  }

  hideHistory() {
    this.showHistoryPopup = false;
    console.log("Popup must be hidden now", this.showHistoryPopup)
  }

  existsInArray( arr : any[], item : any ) : boolean {
    for( var i = 0; i < arr.length; i++ )
      if( arr[ i ] === item ) return true;

    return false;
  }

  switchPlaying() {
    this.isPlaying = !this.isPlaying
  }

  switchSecurity(security: 'paillier' | 'aes' | 'mask' | 'permutation') {
    if ( security == "paillier" ) {
      this.paillier = !this.paillier;
    }
    if ( security == 'aes') {
      this.aes = !this.aes
    }
    if (security == 'mask') {
      this.mask = !this.mask
    }
    if (security == 'permutation') {
      this.permutation = !this.permutation
    }
    this.onSecurityOptionsChanged()
  }

  highlightStatus : boolean = false;
  switchHighlight($event: any) {
    this.highlightStatus = !this.highlightStatus;
  }

	initializeForPresentation($event: any) {
    if ( !this.execution ) return
    this.execution.chapter = SambaChapter.BEGIN
    this.execution.state = SambaState.STEP_2
    this.execution.currentTurn = this.execution.history.turns[this.execution.history.nb_arms  - 1]
    this.execution.turnIndex = this.execution.history.nb_arms
	}
}
