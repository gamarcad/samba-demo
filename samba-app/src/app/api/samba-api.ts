import {Algorithm} from "../samba/algorithm";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {ExecutionHistory} from "../samba/executionHistory";
import {Observable, throwError} from "rxjs";
import {catchError, retry} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class SambaApi {
  endpoint = "http://localhost:8000/samba";
  httpClient : HttpClient;

  constructor( httpClient : HttpClient ) {
    this.httpClient = httpClient;
  }

  test() : any {
    return this.httpClient.get(this.endpoint);
  }


  getHistories() : Observable<ExecutionHistory[]> {
    return this.httpClient.get<ExecutionHistory[]>(this.endpoint + '/history')
      .pipe(
        retry(1),
        catchError(this.processError)
      );
  }

  getExecutionHistory(algorithm : Algorithm, budget : number, k : number, dataset : string, threshold : number) : Observable<ExecutionHistory> {
    console.log("[API] Getting a new execution for parameters: ", algorithm, budget)
    let data = {
      algorithm,
      budget,
      k,
      dataset,
      threshold,
    }
    return this.httpClient.post<ExecutionHistory>(this.endpoint + '/create', JSON.stringify(data))
      .pipe(
        retry(1),
        catchError(this.processError)
      );
  }

  processError(err : HttpErrorResponse) {
    let message = '';
    if(err.error instanceof ErrorEvent) {
      message = err.error.message;
    } else {
      message = `Error Code: ${err.status}\nMessage: ${err.message}`;
    }
    console.log(message);
    return throwError(message);
  }
}
