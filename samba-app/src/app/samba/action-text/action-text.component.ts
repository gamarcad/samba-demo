import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Execution} from "../../app.component";
import {SambaChapter, SambaState} from "../state";

@Component({
  selector: 'app-action-text',
  templateUrl: './action-text.component.html',
  styleUrls: ['./action-text.component.scss']
})
export class ActionTextComponent implements OnInit, OnChanges {

  text : string;
  approximatedProbability : number[] | undefined
  @Input() execution : Execution | undefined;

  constructor() { this.text = "" }

  ngOnInit(): void {
    this.updateText();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // When a changes occur, the text must be updated as well as the
    // approximated probabilities for each arm.
    this.updateText();
  }


  /**
   * Returns the aproximated probability of the given arm index.
   * @param armIndex
   */
  getApproximatedProbability( armIndex : number ) : string {
    // if the current execution is not defined, abort the computation
    if ( !this.execution || !this.execution.currentTurn ) return "-"

    // if the current chapter is not for the computation, skip it
    if ( this.execution.chapter != SambaChapter.CORE_OF_PROTO ) return "-"

    // compute the number of pulls and the number of rewards
    let numberOfPulls = this.execution.currentTurn.nb_pulls[armIndex]
    let numberOfRewars = this.execution.currentTurn.nb_rewards[armIndex]

    return (numberOfRewars / numberOfPulls).toFixed(2)
  }

  /**
   * Update the displayed text explaining the action done in the inteface.
   * @private
   */
  private updateText() {
    if ( this.execution == undefined ) {
      this.text = ""
      return
    }
    this.text = this.getMessage( this.execution.chapter, this.execution.state )
  }

  /**
   * Returns the "humanized" description of the current state.
   * @param chapter
   * @param state
   * @private
   */
  private getMessage( chapter : SambaChapter, state : SambaState ) : string {
    switch (chapter) {
      case SambaChapter.BEGIN: return ""
      case SambaChapter.INITIAL_EXPLORATION: return "Each node is pulled one time"
      case SambaChapter.CORE_OF_PROTO: {
        switch (state) {
          case SambaState.STEP_2: return "Each node sends his score to Controller"
          case SambaState.STEP_3: return "Controller sends scores to Comp"
          case SambaState.STEP_4: return "Comp sends selection bits to Controller"
          case SambaState.STEP_5: return "Controller sends selection bit to each Node"
        }
        break
      }
      case SambaChapter.CUMULATIVE_REWARD_COMPUTATION: {
        switch (state) {
          case SambaState.STEP_6:
            return "Each node sends his partial cumulative reward to Controller"
          case SambaState.STEP_7:
            return "Controller sends cumulative reward to Customer"
        }
      }
    }
    throw new Error("Message not generated")
  }

  formatProb(prob: number) {
    return prob.toFixed(2)
  }
}
