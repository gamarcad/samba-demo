import {Component, Input, OnInit, SimpleChanges} from '@angular/core';
import SambaGraph = Architecture.SambaGraph;
import {CanvasDrawer, Window} from "../graphics";

export namespace Architecture {
  export interface SambaNode {
    id: string,
    label: string,
    subLabel?: string,
    x: number,
    y: number,
  }

  export interface SambaEdge {
    from: string,
    to: string,
  }

  export interface  SambaGraph {
    nodes: SambaNode[],
    edges: SambaEdge[],
    window?: Window,
  }
}

@Component({
  selector: 'app-old-architecture',
  templateUrl: './architecture.component.html',
  styleUrls: ['./architecture.component.scss']
})
export class ArchitectureComponent implements OnInit {


  @Input() graph : SambaGraph;

  private canvas: HTMLCanvasElement | undefined = undefined;

  constructor() {
    this.graph = { nodes: [], edges: [] }
  }

  ngOnInit(): void {
    this.canvas = document.getElementById("architecture") as HTMLCanvasElement;
    let context = <CanvasRenderingContext2D>this.canvas.getContext("2d");
    context.imageSmoothingQuality = 'high'
    context.stroke()
    this.redraw()
  }

  ngOnChanges(changes: SimpleChanges) {
    this.graph = changes.graph.currentValue;
    this.redraw()
  }

  private redraw() {
    if ( this.canvas === undefined ) throw new Error("Cannot paint on undefined canvas")
    let context : CanvasRenderingContext2D = <CanvasRenderingContext2D>this.canvas?.getContext("2d");

    context.strokeStyle = "black"
    context.save()

    context.beginPath()
    let drawer = new CanvasDrawer( this.canvas, this.drawingWindow(), this.virtualWindow() )
    drawer.drawCircle(context, {x:50, y:50}, 50, {
      text: "test",
      textColor: "white",
      fillColor: 'blue',
      borderColor: 'blue',
    })
    context.closePath()
  }







  drawingWindow() : Window {
    return {
      x: { from: 0 , to : <number>this.canvas?.width },
      y: { from: 0, to : <number>this.canvas?.height },
    }
  }

  virtualWindow() : Window {
    if ( this.graph.window ) return this.graph.window
    return {
      x: {
        from: 0,
        to: 100,
      },
      y: {
        from:0,
        to: 100,
      }
    }
  }


}
