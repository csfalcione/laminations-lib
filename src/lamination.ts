import { NaryFraction } from "./nary";
import { Polygon } from './polygon';
import { BranchRegion } from './branch-region';
import { List, Range, Set as ImmutableSet } from 'immutable';

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

const removeDuplicates = () => distinct<Polygon, String>(poly => poly.toString())

function* iterates(leaves: Polygon[], branches: BranchRegion[]): IterableIterator<Polygon[]> {
  let newLeaves = leaves
  while (true) {
    yield newLeaves
    newLeaves = pullBack(newLeaves, branches)
  }
}


const pullBack = (leaves: Polygon[], branches: BranchRegion[]): Polygon[] => {
  const result = []
  for (const leaf of leaves) {
    const pulledBackPoints: List<NaryFraction> = leaf.points.flatMap(point => point.mapBackward())

    let remainingIndices = Range(0, pulledBackPoints.size).toSet()
    for (const branch of branches) {
      const filtered = remainingIndices.toSeq()
        .map((idx): [number, NaryFraction] => [idx, pulledBackPoints.get(idx)])
        .filter(([_idx, point]) => branch.contains(point))

      remainingIndices = remainingIndices.subtract(filtered.map(([idx, _point]) => idx))

      const newPoints = filtered.map(([_idx, point]) => point).toList()
      if (newPoints.size === 0) continue
      const nextPolygon = Polygon.new(newPoints)
      result.push(nextPolygon)
    }

  }
  return result
}

const mapForward = (leaves: Polygon[]) => leaves.map(poly => poly.mapForward()).filter(removeDuplicates())

export const Lamination = { iterates, pullBack, mapForward, removeDuplicates }
