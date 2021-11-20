import { Fractions, Fraction } from './fractions'
import { cache, xor, withCachedToString } from './util'

export interface Chord {
  lower: Fraction,
  upper: Fraction,
}

const create = (a: Fraction, b: Fraction): Chord => {
  if (Fractions.greaterThan(a, b)) {
    return withCachedToString(toString, {
      lower: b,
      upper: a,
    })
  }
  return withCachedToString(toString, {
    lower: a,
    upper: b,
  })
}

const mapForward = (chord: Chord): Chord => create(Fractions.mapForward(chord.lower), Fractions.mapForward(chord.upper))

const onBoundary = (chord: Chord, point: Fraction): boolean => {
  return Fractions.equals(chord.lower, point) || Fractions.equals(chord.upper, point)
}

const intersects = (a: Chord, b: Chord): boolean => {
  const containsFirstButNotSecond = (first: Fraction, second: Fraction) =>
    inInnerRegion(a, first) && inOuterRegion(a, second)

  return containsFirstButNotSecond(b.lower, b.upper)
    || containsFirstButNotSecond(b.upper, b.lower)
}

const inInnerRegion = (chord: Chord, point: Fraction) => {
  return Fractions.greaterThan(point, chord.lower) && Fractions.lessThan(point, chord.upper)
}

const inInnerRegionLoose = (chord: Chord, point: Fraction) => {
  return inInnerRegion(chord, point) || onBoundary(chord, point)
}

const inOuterRegion = (chord: Chord, point: Fraction) => {
  return !inInnerRegionLoose(chord, point)
}

const inOuterRegionLoose = (chord: Chord, point: Fraction) => {
  return !inInnerRegion(chord, point)
}

const contains = (chord: Chord, point: Fraction, flip = false) => {
  if (xor(width(chord) > 0.5, flip)) {
    return inOuterRegion(chord, point)
  }
  return inInnerRegion(chord, point)
}

const containsLoose = (chord: Chord, point: Fraction, flip = false) => {
  if (xor(width(chord) > 0.5, flip)) {
    return inOuterRegionLoose(chord, point)
  }
  return inInnerRegionLoose(chord, point)
}

const width = (chord: Chord): number => {
  const upperNum = Fractions.numerator(chord.upper)
  const upperDenom = Fractions.denominator(chord.upper)
  const lowerNum = Fractions.numerator(chord.lower)
  const lowerDenom = Fractions.denominator(chord.lower)

  return (upperNum * lowerDenom - lowerNum * upperDenom) / (upperDenom * lowerDenom)
}

const isDiameter = (chord: Chord) => {
  const upperNum = Fractions.numerator(chord.upper)
  const upperDenom = Fractions.denominator(chord.upper)
  const lowerNum = Fractions.numerator(chord.lower)
  const lowerDenom = Fractions.denominator(chord.lower)
  // this.upper >= this.lower implies that the difference below is positive.
  return 2 * (upperNum * lowerDenom - lowerNum * upperDenom) === upperDenom * lowerDenom
}

const toString = (chord: Chord): string => `${chord.lower}, ${chord.upper}`


export const Chords = {
  create,
  mapForward,
  onBoundary,
  intersects,
  inInnerRegion,
  inOuterRegion,
  contains,
  containsLoose,
  width,
  isDiameter,
  toString,
}
