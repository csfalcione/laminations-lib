import { NaryFraction } from "./nary";
import { Polygon } from './polygon';


export interface BranchRegion {
    isInBranch: (NaryFraction) => boolean,
    getContainedPullback: (NaryFraction) => Array<NaryFraction>,
}

export const makeRegion = (identifierFunc: (NaryFraction) => boolean): BranchRegion => {
    const getContainedPullback = (number: NaryFraction): Array<NaryFraction> => {
        return number.mapBackward().filter(identifierFunc);
    }

    return {
        isInBranch: identifierFunc,
        getContainedPullback
    }
}


function *iterates(leaves: Array<Polygon>, branches: Array<BranchRegion>): Iterator<Array<Polygon>> {
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
        .map(branch.getContainedPullback)
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
