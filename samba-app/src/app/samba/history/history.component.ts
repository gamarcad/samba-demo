import {Component, EventEmitter, OnInit, Output, Input} from '@angular/core';
import {SambaApi} from "../../api/samba-api";
import {ExecutionHistory} from "../executionHistory";

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {

  @Input() histories : ExecutionHistory[];
  @Output() closeEvent = new EventEmitter<void>();
  @Output() deleteHistoryCallback = new EventEmitter<ExecutionHistory>();


  constructor() {
    this.histories = []
  }

  ngOnInit(): void {

  }



  getFormattedAlgorithName(algorithm: string) : string {
    if ( algorithm == 'epsilon-greedy' ) { return "Epsilon Greedy" }
    if ( algorithm == 'thompson-sampling' ) { return "Thompson Sampling" }
    if ( algorithm == 'ucb' ) return 'UCB'
    return algorithm
  }

  getExecutionTime(history: ExecutionHistory) {
    // estimate the execution time curve for each budget
    let unsecureTime = history.execution_time.time

    // estimate the execution time for the secure version base on enabled security options and unsecure time
    let budget = history.budget
    let secureTime = unsecureTime;
    secureTime += history.time.security.mask * history.nb_arms * budget;
    secureTime +=  2 * (
      history.time.security.aes.encryption +
      history.time.security.aes.decryption
    ) * history.nb_arms * budget
    secureTime += 2 * history.time.security.permutation * budget
    secureTime +=
      history.time.security.paillier.encryption * history.nb_arms +
      history.time.security.paillier.addition * ( history.nb_arms - 1 ) +
      history.time.security.paillier.decryption

    return secureTime.toFixed(2)
  }


  close() {
    this.closeEvent.emit();
  }

  /**
   * Delete the history from the list of history
   * @param history
   */
  deleteHistory(history : ExecutionHistory) {
    this.deleteHistoryCallback.emit( history );
  }
}
