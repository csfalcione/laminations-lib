import { Fractions, Fraction } from './fractions'
import { Chords, Chord } from './chords'
import { List } from 'immutable'
import { withCachedToString } from './util'

export interface Polygon {
  points: List<Fraction>,
}

const create = (points: List<Fraction>): Polygon => withCachedToString(toString, {
  points: points.sort(Fractions.compare)
})

const fromChord = (chord: Chord): Polygon => create(List.of(chord.lower, chord.upper))

const mapForward = (polygon: Polygon): Polygon => create(polygon.points.map(Fractions.mapForward))

const toChords = (polygon: Polygon): List<Chord> => {
  const points = polygon.points
  const lastIdx = points.size - 1

  return List<Chord>().withMutations(result => {
    for (let i = 0; i < lastIdx; i++) {
      result.push(Chords.create(points.get(i), points.get(i + 1)))
    }

    if (points.size > 2) {
      result.push(Chords.create(points.first(), points.last()))
    }
  })
}

const toString = (polygon: Polygon): string => polygon.points.join(', ')

export const Polygons = {
  create,
  fromChord,
  mapForward,
  toChords,
  toString,
}
