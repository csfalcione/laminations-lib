import { NaryFraction } from "./nary";
import { Polygon } from './polygon';
import { BranchRegion } from './branch-region';

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

const getContainedPullback = (branch: BranchRegion) => (number: NaryFraction): NaryFraction[] => {
  return number.mapBackward().filter(branch.unwrap());
}

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
    for (const branch of branches) {
      const nextPolygon = Polygon.new(
        leaf.points
          .map(getContainedPullback(branch))
          .filter(points => points.length > 0)
          .map(points => points[0])
      )
      if (nextPolygon.points.size === 0) continue;
      result.push(nextPolygon)
    }
  }
  return result
}

const mapForward = (leaves: Polygon[]) => leaves.map(poly => poly.mapForward()).filter(removeDuplicates())

export const Lamination = { iterates, pullBack, mapForward, removeDuplicates }
