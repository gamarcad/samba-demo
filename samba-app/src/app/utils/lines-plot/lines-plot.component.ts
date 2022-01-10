import {Component, OnInit, Input, SimpleChanges, OnChanges} from '@angular/core';
import {min} from "rxjs/operators";
import {CanvasDrawer, Window} from "../graphics";

export interface Data {
  lines: {
    x: number[],
    y: number[],
    color: string,
  }[],
  focusOn?: number | undefined,
}




export interface Option {
  max : number | undefined,
}


@Component({
  selector: 'app-lines-plot',
  templateUrl: './lines-plot.component.html',
  styleUrls: ['./lines-plot.component.scss']
})
export class LinesPlotComponent implements OnInit, OnChanges {

  @Input() data : Data;
  @Input() option : Option;

  private canvas: HTMLCanvasElement | undefined = undefined;

  constructor() {
    this.data = { lines: [] }
    this.option = { max: undefined }
  }

  ngOnInit(): void {
    this.redraw();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.data = changes.data.currentValue;
    console.log("Data ", this.data)
    this.redraw()
  }

  private redraw() {
    // load context from canvas
    this.canvas = document.getElementById('lines-layout') as HTMLCanvasElement;
    let context = <CanvasRenderingContext2D>this.canvas.getContext("2d");
    console.log("Drawing lines layout on canvas of dimension ", this.canvas.width, "width and ", this.canvas.height, "height")
    let drawer = new CanvasDrawer( this.canvas, this.drawingWindow(), this.virtualWindow() )
    // if no data, paint in gray
    if ( this.data.lines.length === 0 ) {
      return
    } else {
      console.log("There are data: ", this.data)
    }
    context.strokeStyle = '#888';
    context.lineWidth = 1 ;



    // draw the curve
    for ( let curve of this.data.lines ) {
      context.strokeStyle = curve.color;
      let p1 = {x: curve.x[0], y: curve.y[0]}
      for (let index = 1; index < curve.x.length; index++) {
        let p2 = {x: curve.x[index], y: curve.y[index]}
        drawer.drawLine(context, p1, p2)
        p1 = p2
      }
    }

    // draw the plan
    context.strokeStyle = '#888';
    context.lineWidth = .5;
    drawer.drawLine(context,{ x:0, y:0 }, {x: 0, y:100});
    drawer.drawLine(context, { x:0, y:0 }, {x: 100, y:0});

    // draw the plot ticks
    let virtualWindow = this.virtualWindow();
    for ( let x = virtualWindow.x.from; x <= virtualWindow.x.to; x += 10) {
      drawer.drawText(context, x.toString(), {x: x - 2, y: -10});
    }

    for ( let y = virtualWindow.y.from; y <= virtualWindow.y.to; y += 10 ) {
      drawer.drawText( context, y.toFixed().toString(), { x: -5, y: y } );
    }

    // in case where a focus is required
    if ( this.data.focusOn ) {
      drawer.drawLine(
        context,
        { x: this.data.focusOn, y:0 },
        { x: this.data.focusOn, y: this.virtualWindow().y.to }
      )
    }
  }







  drawingWindow() : Window {
    return {
      x: { from: 0 + 20, to : <number>this.canvas?.width },
      y: { from: 0 + 10, to : <number>this.canvas?.height - 20 },
    }
  }

  virtualWindow() : Window {
    let minX = this.data.lines[0].x[0]
    let maxX = minX
    let minY = this.data.lines[0].y[0]
    let maxY = minY
    for ( let curve of this.data.lines ) {
      for ( let x of curve.x ) {
        if ( x < minX ) minX = x
        if ( maxX < x ) maxX = x
      }
      for ( let  y of curve.y ) {
        if ( y < minY ) minY = y
        if ( maxY < y ) maxY = y
      }
    }
    return {
      x: {
        from: minX,
        to: maxX,
      },
      y: {
        from:minY,
        to: maxY,
      }
    }
  }

  height() : number { return <number>this.canvas?.height }
  width() : number { return <number>this.canvas?.width }



}
