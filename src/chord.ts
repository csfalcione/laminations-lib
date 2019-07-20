import {NaryFraction} from './nary'


export class Chord {

  public lower: NaryFraction
  public upper: NaryFraction

  constructor(a: NaryFraction, b: NaryFraction) {
    let [lower, upper] = [a, b].sort(NaryFraction.compare)
    this.lower = lower
    this.upper = upper
  }

  public static new(a: NaryFraction, b: NaryFraction) {
    return new Chord(a, b)
  }

  public static intersects(a: Chord, b: Chord): boolean {
    return a.intersects(b)
  }

  public static mapForward(chord: Chord): Chord {
    return chord.mapForward()
  }

  public intersects(other: Chord): boolean {
    const containsFirstButNotSecond = (first: NaryFraction, second: NaryFraction) => 
      this.inInnerRegion(first) && this.inOuterRegion(second)

    return containsFirstButNotSecond(other.lower, other.upper)
        || containsFirstButNotSecond(other.upper, other.lower)
  }

  public inInnerRegion(point: NaryFraction) {
    return point.greaterThan(this.lower) && point.lessThan(this.upper);
  }

  public inOuterRegion(point: NaryFraction) {
    return !(this.inInnerRegion(point) || this.onBoundary(point))
  }

  public onBoundary(point: NaryFraction): boolean {
    return this.lower.equals(point) || this.upper.equals(point)
  }

  public mapForward(): Chord {
    return Chord.new(this.lower.mapForward(), this.upper.mapForward())
  }


}