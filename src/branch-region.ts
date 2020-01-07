import { Fractions, Fraction } from './fractions';
import { Chords, Chord } from './chords';

type Identifier = (NaryFraction) => boolean
type MappingFunc = (Identifier) => Identifier

export class BranchRegion {
  constructor(
    private identifier: Identifier
  ) { }

  public static new(identifier: Identifier): BranchRegion {
    return new BranchRegion(identifier)
  }

  public static simple(c: Chord, ...points: Fraction[]): BranchRegion {
    return unit(or(chord(c), ...points.map(point)))
  }

  public static simple_flipped(c: Chord, ...points: Fraction[]): BranchRegion {
    return unit(or(chord(c, true), ...points.map(point)))
  }

  public static complement(...branches: BranchRegion[]): BranchRegion {
    return unit(none(...branches.map(b => b.unwrap())))
  }

  public contains(point: Fraction): boolean {
    return this.identifier(point)
  }

  public containsChord(chord: Chord): boolean {
    return this.contains(chord.lower) && this.contains(chord.upper)
  }

  public unwrap(): Identifier {
    return this.identifier
  }


  public map(func: MappingFunc): BranchRegion {
    return unit(func(this.identifier))
  }

  public without(...branches: BranchRegion[]): BranchRegion {
    return this.map(b => and(b, BranchRegion.complement(...branches).unwrap()))
  }

  public complement(): BranchRegion {
    return this.map(not)
  }

}

const unit = BranchRegion.new

const or = (...identifiers: Identifier[]): Identifier => {
  return (point: Fraction) => identifiers.some(
    identifier => identifier(point)
  )
}

const and = (...identifiers: Identifier[]): Identifier => {
  return (point: Fraction) => identifiers.every(
    identifier => identifier(point)
  )
}

const not = (identifier: Identifier): Identifier => {
  return (point: Fraction) => !identifier(point)
}

const none = (...identifiers: Identifier[]): Identifier => {
  return not(or(...identifiers))
}

const point = (p: Fraction): Identifier => {
  return (candidate: Fraction) => Fractions.equals(p, candidate)
}

const chord = (c: Chord, flip = false): Identifier => {
  return (point: Fraction) => Chords.contains(c, point, flip)
}

export const operators = {
  unit,
  or,
  and,
  not,
  none,
  point,
  chord,
}
