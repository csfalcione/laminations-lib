import { Fractions, Fraction } from "./fractions";
import { Polygons, Polygon } from './polygons';
import { BranchRegion } from './branch-region';
import { List, Range } from 'immutable';

const distinct = <T, U>(key: (item: T) => U) => {
  let set = new Set<U>()
  return (item: T): boolean => {
    const itemKey = key(item)
    const isNew = !set.has(itemKey)
    if (isNew) {
      set.add(itemKey)
    }
    return isNew
  }
}

const removeDuplicates = <T extends Polygon>() => distinct<T, String>(poly => poly.toString())

function* iterates(leaves: Polygon[], branches: BranchRegion[]): IterableIterator<Polygon[]> {
  let newLeaves = leaves
  while (true) {
    yield newLeaves
    newLeaves = pullBack((_, newPolygon) => newPolygon)(newLeaves, branches)
  }
}


const pullBack = <T extends Polygon>(raise: (parent: T, polygon: Polygon) => T) => (leaves: T[], branches: BranchRegion[]): T[] => {
  const result = []
  for (const leaf of leaves) {
    const pulledBackPoints: List<Fraction> = leaf.points.flatMap(Fractions.mapBackward)

    let remainingIndices = Range(0, pulledBackPoints.size).toSet()
    for (const branch of branches) {
      const filtered = remainingIndices.toSeq()
        .map((idx): [number, Fraction] => [idx, pulledBackPoints.get(idx)])
        .filter(([_idx, point]) => branch.contains(point))

      remainingIndices = remainingIndices.subtract(filtered.map(([idx, _point]) => idx))

      const newPoints = filtered.map(([_idx, point]) => point).toList()
      if (newPoints.size === 0) continue
      const nextPolygon = raise(leaf, Polygons.create(newPoints))
      result.push(nextPolygon)
    }
  }
  return result
}

const mapForward = (innerMapForward: (p: Polygon) => Polygon) => (leaves: Polygon[]) => leaves.map(innerMapForward).filter(removeDuplicates())

export const Laminations = { iterates, pullBack, mapForward, removeDuplicates }
