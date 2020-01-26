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

const removeDuplicates = () => distinct<Polygon, String>(poly => poly.toString())

function* iterates(leaves: Polygon[], branches: BranchRegion[]): IterableIterator<Polygon[]> {
  let newLeaves = leaves
  while (true) {
    yield newLeaves
    newLeaves = newLeaves
      .map(leaf => pullBack(leaf, branches))
      .reduce((acc, leaves) => [...acc, ...leaves])
  }
}

const pullBack = (leaf: Polygon, branches: BranchRegion[]): Polygon[] => {
  let result = []
  const pulledBackPoints: List<Fraction> = leaf.points.flatMap(Fractions.mapBackward)

  let remainingIndices = Range(0, pulledBackPoints.size).toSet()
  for (const branch of branches) {
    const filtered = remainingIndices.toSeq()
      .map((idx): [number, Fraction] => [idx, pulledBackPoints.get(idx)])
      .filter(([_idx, point]) => branch.contains(point))

    remainingIndices = remainingIndices.subtract(filtered.map(([idx, _point]) => idx))

    const newPoints = filtered.map(([_idx, point]) => point).toList()
    if (newPoints.size === 0) continue
    result.push(Polygons.create(newPoints))
  }
  return result
}


const mapForward = (leaves: Polygon[]) => leaves.map(Polygons.mapForward).filter(removeDuplicates())

export const Laminations = { iterates, pullBack, mapForward, removeDuplicates }
