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

  for (const branch of branches) {
    const newPoints = pulledBackPoints.filter(point => branch.contains(point))
    if (newPoints.count() == 0) {
      continue;
    }
    result.push(Polygons.create(newPoints))
  }

  return result
}


const mapForward = (leaves: Polygon[]) => leaves.map(Polygons.mapForward).filter(removeDuplicates())

export const Laminations = { iterates, pullBack, mapForward, removeDuplicates }
