import { NaryFraction } from './nary';
import { Chord } from './chord';

type Identifier = (NaryFraction) => boolean
type MappingFunc = (Identifier) => Identifier

export class BranchRegion {
  constructor(
    private identifier: Identifier
  ) {}

  public static new(identifier: Identifier): BranchRegion {
    return new BranchRegion(identifier)
  }

  public static simple(c: Chord, ...points: NaryFraction[]): BranchRegion {
    return unit(or(chord(c), ...points.map(point)))
  }

  public contains(point: NaryFraction): boolean {
    return this.identifier(point)
  }

  public unwrap(): Identifier {
    return this.identifier
  }
  

  public map(func: MappingFunc): BranchRegion {
    return unit(func(this.identifier))
  }

  public without(branch: BranchRegion): BranchRegion {
    return this.map(b => and(b, not(branch.unwrap())))
  }

}

export const unit = BranchRegion.new

export const or = (...identifiers: Identifier[]): Identifier => {
  return (point: NaryFraction) => identifiers.some(
    identifier => identifier(point)
  )
}

export const and = (...identifiers: Identifier[]): Identifier => {
  return (point: NaryFraction) => identifiers.every(
    identifier => identifier(point)
  )
}

export const not = (identifier: Identifier): Identifier => {
  return (point: NaryFraction) => !identifier(point)
}

export const none = (...identifiers: Identifier[]): Identifier => {
  return not(or(...identifiers))
}

export const point = (p: NaryFraction): Identifier => {
  return (candidate: NaryFraction) => p.equals(candidate)
}

export const chord = (c: Chord): Identifier => {
  return (point: NaryFraction) => c.contains(point)
}
