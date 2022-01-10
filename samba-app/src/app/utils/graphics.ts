export interface Window {
  x : { from : number, to : number }
  y : { from : number, to : number }
}

export interface Point {
  x : number,
  y : number,
}

export interface CircleOption {
  text?: string,
  textColor?: string,
  textBaseline?: string,
  fillColor?: string,
  borderColor?: string,
}

export class CanvasDrawer {
  private canvas: HTMLCanvasElement;
  private virtualWindow : Window;
  private drawingWindow : Window;

  constructor( canvas : HTMLCanvasElement, drawingWindow : Window, virtualWindow : Window ) {
    this.canvas = canvas
    this.drawingWindow = drawingWindow
    this.virtualWindow = virtualWindow
  }

  projectPoint( point : Point, source : Window, destination : Window  ) : Point {
    return {
      x: this.rescale( point.x, source.x.from, source.x.to, destination.x.from, destination.x.to ),
      y: destination.y.to  - this.rescale( point.y, source.y.from, source.y.to, destination.y.from, destination.y.to ),
    }
  }

  drawCircle( context : CanvasRenderingContext2D, at : Point, radius : number, option : CircleOption ) {
    let projectPoint = this.projectPoint( at, this.virtualWindow, this.drawingWindow )
    if (option.borderColor) {
      context.save();
      context.strokeStyle = option.borderColor
    }
    context.arc(projectPoint.x, projectPoint.y, radius, 0, 2 * Math.PI);
    if ( option.fillColor ) {
      context.save();
      context.fillStyle = option.fillColor;
      context.fill();
      context.stroke();
      context.restore();
    }
    if ( option.text ) {
      context.save()
      if ( option.textColor ) context.strokeStyle = option.textColor
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.strokeText( option.text, projectPoint.x, projectPoint.y );
      context.restore()
    }
    context.stroke()

  }

  drawText( context : CanvasRenderingContext2D, text : string, at : Point ) {
    let projectedPoint = this.projectPoint( at, this.virtualWindow, this.drawingWindow )
    context.strokeText( text, projectedPoint.x, projectedPoint.y )
  }

  drawLine( context : CanvasRenderingContext2D, from : Point, to : Point )  : void {
    let drawingWindow = this.drawingWindow
    let virtualWindow = this.virtualWindow

    let origin = this.projectPoint({ x:from.x, y:from.y }, virtualWindow, drawingWindow)
    let dest = this.projectPoint({ x:to.x, y:to.y }, virtualWindow, drawingWindow)

    context.beginPath()
    context.moveTo(origin.x, origin.y)
    context.lineTo(dest.x, dest.y)
    context.closePath()
    context.stroke()
  }

  private rescale( value : number, a : number, b : number, x : number, y : number ) : number {
    return (value - a) * (y - x) / (b - a) + x
  }

}
