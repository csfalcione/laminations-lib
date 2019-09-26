import { Chord } from './chord';
import { NaryFraction } from './nary';
import { BranchRegion } from './branch-region';

export interface BranchSpec {
  chord: Chord
  endpoints: NaryFraction[]
}

export const makeBranchSpec = (chord: Chord, ...endpoints: NaryFraction[]) => ({chord, endpoints})

class TreeNode {
  public region: BranchRegion
  public children: TreeNode[]

  constructor(protected branchSpec: BranchSpec) {
    this.region = BranchRegion.simple(branchSpec.chord, ...branchSpec.endpoints)
    this.children = []
  }

  public static new(branchSpec: BranchSpec) {
    return new TreeNode(branchSpec)
  }

  public addChild(node: TreeNode) {
    for (let child of this.children) {
      if (child.contains(node)) {
        return child.addChild(node)
      }
    }
    this.children.push(node)
  }

  public contains(other: TreeNode) {
    return this.region.containsChord(other.branchSpec.chord)
  }

  public *postOrder(): IterableIterator<TreeNode> {
    for (let child of this.children) {
      yield* child.postOrder()
    }
    yield this
  }
}

export const buildBranches = (specs: BranchSpec[]): BranchRegion[] => {
  const rootNodes = specs.map(TreeNode.new)
  .reduce((nodes: TreeNode[], newNode: TreeNode) => {
    for (let node of nodes) {
      if (node.contains(newNode)) {
        node.addChild(newNode)
        return nodes
      }
    }

    return [...nodes, newNode]
  }, [])

  return rootNodes.map((root: TreeNode): BranchRegion[] => {
    const result = []
    for (let node of root.postOrder()) {
      const region = node.region.without(...node.children.map(n => n.region))
      result.push(region)
    }
    return result
  }).reduce((arr1, arr2) => arr1.concat(arr2))

}

export const maybeAddFinalBranch = (base: number, regions: BranchRegion[]): BranchRegion[] => {
  if (regions.length === base) {
    return
  }
  const finalRegion = BranchRegion.complement(...regions)
  return [...regions, finalRegion]
}

export const makeBuilder = (base: number) => (specs: BranchSpec[]): BranchRegion[] => {
  return maybeAddFinalBranch(base, buildBranches(specs))
}
