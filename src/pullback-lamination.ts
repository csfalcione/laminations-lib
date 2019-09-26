import { NaryFraction } from "./nary";
import { Polygon } from './polygon';
import { BranchRegion } from './branch-region';

const getContainedPullback = (branch: BranchRegion) => (number: NaryFraction): Array<NaryFraction> => {
  return number.mapBackward().filter(branch.unwrap());
}

function *iterates(leaves: Array<Polygon>, branches: Array<BranchRegion>): IterableIterator<Array<Polygon>> {
  let newLeaves = leaves
  while (true) {
    yield newLeaves
    newLeaves = pullback(newLeaves, branches)
  }
}


const pullback = (leaves: Array<Polygon>, branches: Array<BranchRegion>): Array<Polygon> => {
  const result = []
  for (const leaf of leaves) {
    for (const branch of branches) {
      const nextPolygon = Polygon.new(
        leaf.points
        .map(getContainedPullback(branch))
        .filter(points => points.length > 0)
        .map(points => points[0])
      )
      if (nextPolygon.points.length === 0) continue;
      result.push(nextPolygon)
    }
  }
  return result
}

export const PullbackLamination = {iterates, pullback}
