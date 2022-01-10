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
  @Input() execution : Execution | undefined;

  constructor() { this.text = "" }

  ngOnInit(): void {
    this.updateText();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.updateText();
  }

  private updateText() {
    if ( this.execution == undefined ) {
      this.text = ""
      return
    }
    this.text = this.getMessage( this.execution.chapter, this.execution.state )
  }

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

  formatProbs(probs: number[]) {
    return probs.map((value => {
      return value.toFixed(2)
    }))
  }

  formatProb(prob: number) {
    return prob.toFixed(2)
  }
}
