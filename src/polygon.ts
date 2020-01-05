import { NaryFraction } from './nary'
import { Chord } from './chord'
import { List } from 'immutable'


export class Polygon {

  public points: List<NaryFraction>

  constructor(points: List<NaryFraction>) {
    this.points = points.sort(NaryFraction.compare)
  }

  public static new(points: List<NaryFraction>) {
    return new Polygon(points)
  }

  public static mapForward(polygon: Polygon): Polygon {
    return polygon.mapForward()
  }

  public static fromChord(chord: Chord): Polygon {
    return Polygon.new(List.of(chord.lower, chord.upper))
  }

  public static toChords(polygon: Polygon): List<Chord> {
    return polygon.toChords();
  }

  public mapForward(): Polygon {
    return Polygon.new(this.points.map(NaryFraction.mapForward))
  }

  public toChords(): List<Chord> {
    const points = this.points
    const lastIdx = points.size - 1

    return List().withMutations(result => {
      for (let i = 0; i < lastIdx; i++) {
        result.push(Chord.new(points.get(i), points.get(i + 1)))
      }

      if (points.size > 2) {
        result.push(Chord.new(points.first(), points.last()))
      }
    })

  }

  public toString() {
    return this.points.map(point => point.toString()).join(', ')
  }

}