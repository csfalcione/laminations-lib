import {NaryFraction} from './nary'
import {Chord} from './chord'


export class Polygon {

  public points: Array<NaryFraction>

  constructor(points: Array<NaryFraction>) {
    this.points = [...points].sort(NaryFraction.compare)
  }

  public static new(points: Array<NaryFraction>) {
    return new Polygon(points)
  }

  public static mapForward(polygon: Polygon): Polygon {
    return polygon.mapForward()
  }

  public static fromChord(chord: Chord): Polygon {
    return Polygon.new([chord.lower, chord.upper])
  }

  public static toChords(polygon: Polygon): Array<Chord> {
    return polygon.toChords();
  }

  public mapForward(): Polygon {
    return Polygon.new(this.points.map(NaryFraction.mapForward))
  }

  public toChords(): Array<Chord> {
    const result = []
    const points = this.points
    const lastIdx = points.length - 1

    for (let i = 0; i < lastIdx; i++) {
      result.push(Chord.new(points[i], points[i+1]))
    }

    if (points.length > 2) {
      result.push(points[0], points[lastIdx])
    }

    return result;
  }


}