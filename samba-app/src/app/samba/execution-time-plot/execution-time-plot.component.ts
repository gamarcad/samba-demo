import {Component, OnInit, Input, OnChanges, SimpleChanges} from '@angular/core';
import {ExecutionHistory} from "../executionHistory";
import {Execution, SecurityOption} from "../../app.component";


@Component({
  selector: 'app-execution-time-plot',
  templateUrl: './execution-time-plot.component.html',
  styleUrls: ['./execution-time-plot.component.scss']
})
export class ExecutionTimePlotComponent implements OnInit, OnChanges {

  @Input() execution: Execution | undefined;
  @Input() securityOption: SecurityOption | undefined;

  private static SECURE_LINE = "Secure"
  private static NO_SECURE_LINE = "Non-Secure"
  private static SECURE_MARKER = "arrow"
  private static NO_SECURE_MARKER = "pin"

  options: any;
  updateOptions : any;


  constructor() {

  }

  ngOnInit(): void {
    this.options = {
      legend: {
        textStyle: {
          fontSize: 15,
        },
        itemWidth: 8,
        itemHeight: 12,
        data: [{
          icon: ExecutionTimePlotComponent.NO_SECURE_MARKER,
          name: ExecutionTimePlotComponent.NO_SECURE_LINE
        },
        {
          icon: ExecutionTimePlotComponent.SECURE_MARKER,
          name: ExecutionTimePlotComponent.SECURE_LINE
        }],
        align: 'left',
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        data: [],
        silent: false,
        splitLine: {
          show: false,
        },
        nameLocation: 'center',
        nameGap: 30,
      },
      yAxis: {},
      series: [
        {
          name: ExecutionTimePlotComponent.SECURE_LINE,
          type: 'line',
          data: [],
        },
        {
          name: ExecutionTimePlotComponent.NO_SECURE_LINE,
          type: 'line',
          data: [],
        },
      ],
      animationEasing: 'elasticOut',
    };
  }



  ngOnChanges(changes: SimpleChanges): void {
    console.log("[Time] Modification dectected")
    // we update variables on changes
    if ( changes.execution !== undefined ) {
      this.execution = changes.execution.currentValue
    }

    if ( changes.securityOption !== undefined ) {
      this.securityOption = changes.securityOption.currentValue
    }

    // we only plot the curve only when there are data
    if ( this.execution !== undefined ) {
      this.drawCurve()
    }
  }


  private resizeIsDone : boolean = false
  drawCurve() {
    if ( this.execution === undefined || this.securityOption === undefined )
      throw new Error("Execution and security options must be defined")

    // create the estimated execution time
    let xData = []
    let notSecureData = []
    let secureData = []
    let history = this.execution.history
    for ( let budget = 0; budget <= history.budget; budget++ ) {
      xData.push(budget);

      // estimate the execution time curve for each budget
      let executionTime =
        (history.time.components.arms.reduce((a, b) => a + b)) +
        history.time.components.controller +
        history.time.components.comp +
        history.time.components.customer

      let unsecureTime = budget * executionTime / history.execution_time.budget
      notSecureData.push(unsecureTime)


      // estimate the execution time for the secure version base on enabled security options and unsecure time
      let secureTime = unsecureTime;
      if ( this.securityOption?.mask  ) {
        secureTime += history.time.security.mask * history.nb_arms * budget;
      }
      if ( this.securityOption?.aes ) {
        secureTime +=  2 * (
          history.time.security.aes.encryption +
          history.time.security.aes.decryption
        ) * history.nb_arms * budget
      }
      if ( this.securityOption?.permutation ) {
        secureTime += 2 * history.time.security.permutation * budget
      }
      if ( this.securityOption.paillier )  {
        secureTime +=
          history.time.security.paillier.encryption * history.nb_arms +
          history.time.security.paillier.addition * ( history.nb_arms - 1 ) +
          history.time.security.paillier.decryption
      }

      secureData.push(secureTime)
    }

    // recompute the execution time with all security enabled in order to compute the maximum time
    let budget = history.budget;
    let timeWithAllSecurities = notSecureData[notSecureData.length - 1]
    timeWithAllSecurities += history.time.security.mask * history.nb_arms * budget;
    timeWithAllSecurities +=  2 * (
      history.time.security.aes.encryption +
      history.time.security.aes.decryption
    ) * history.nb_arms * budget
    timeWithAllSecurities += 2 * history.time.security.permutation * budget
    timeWithAllSecurities +=
      history.time.security.paillier.encryption * history.nb_arms +
      history.time.security.paillier.addition * ( history.nb_arms - 1 ) +
      history.time.security.paillier.decryption


    // update the execution time curve
    let dataGenerator = ( data : number[], marker : string ) => {
      let res = []
      for ( let v of data ) {
        res.push({
          value: v,
          symbol: marker,
          symbolSize: 7,
        })
      }
      return res
    }

    this.updateOptions = {
      colorBy: 'data',
      markLine: {
        data: [
          {
            name: 'Markline between two points',
            x: this.execution.turnIndex,
            y: 0
          },
          {
            x: this.execution.turnIndex,
            y: '100%',
          }
        ]
      },
      xAxis: {
        data: xData,
        min: 0,
        max: Math.round(xData.reduce((a, b) => a > b ? a : b) * 1.1),
        name: "Budget",
      },
      yAxis: {
        min: 0,
        max: Math.round(timeWithAllSecurities * 1.1),
        name: "Time (s)",
      },
      series: [
        {
          name: ExecutionTimePlotComponent.NO_SECURE_LINE,
          itemStyle: {
            color: 'rgb(0, 0, 0)',
          },
          data: dataGenerator(notSecureData, ExecutionTimePlotComponent.NO_SECURE_MARKER),
        },
        {
          name: ExecutionTimePlotComponent.SECURE_LINE,
          itemStyle: {
            color: 'rgb(36, 178, 182)',
          },
          data: dataGenerator(secureData, ExecutionTimePlotComponent.SECURE_MARKER),
        },
      ],
    }

    // prevent the resize
    if ( !this.resizeIsDone ) {
      window.addEventListener("resize", () => {
        this.resizeCanvas()
      })
      this.resizeIsDone = true
    }
    this.resizeCanvas()

    // create the vertical bar in the execution time
    let plotContainer = document.getElementById("execution-time-plot");
    if (!plotContainer) {
      console.log("Plot Container undefined")
      return;
    }



    let canvas  = document.getElementById("custom-layer") as HTMLCanvasElement;
    if ( !canvas ) {
      console.error("Execution time Canvas undefined")
      return
    }

    let context = canvas.getContext("2d");
    if (!context) {
      console.warn("Execution time Canvas context undefined")
      return;
    }

    console.log("Drawing")
    context.imageSmoothingQuality = "high"
    context.strokeStyle = 'black';
    context.lineWidth=1;
    context.save();
    context.beginPath()

    let referentialWidth = 827
    let referentialBudget = 50
    let currentwidth = canvas.width
    let currentBudget = this.execution.history.budget

    let x = 85 * currentwidth / referentialWidth
    let step = 12.125 * currentwidth / referentialWidth * (referentialBudget / currentBudget)
    x = x - step
    //context.moveTo(x + step * <number>this.execution.turnIndex, 180 );
    //context.lineTo( x + step * <number>this.execution.turnIndex, 50  );

    context.moveTo(x + step * <number>this.execution.turnIndex, 50   );
    context.lineTo( x + step * <number>this.execution.turnIndex, canvas.height - 70  );

    context.stroke()
    context.closePath();
  }

  resizeCanvas() {
    // load first canvas
    let container = document.getElementById("original-layer")
    if ( container == undefined ) throw new Error("Original layer container  cannot be null !")
    let c1 = container.getElementsByTagName("canvas")[0]
    let c2 = document.getElementById("custom-layer") as HTMLCanvasElement
    if ( c1 == undefined ) throw new Error("Original layer cannot be null !")
    if ( c2 == undefined ) throw new Error("Duplicated layer cannot be null !")
    c2.width = c1.width
    c2.height = c1.height
    console.log("sizes:", c1.width, c1.height, c2.width, c2.height)
  }
}
