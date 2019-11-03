import { Chord } from './chord';
import { NaryFraction } from './nary';
import { BranchRegion } from './branch-region';

export interface BranchSpec {
  chord: Chord
  endpoints: NaryFraction[]
  flip?: boolean
}

export const makeBranchSpec = (chord: Chord, ...endpoints: NaryFraction[]) => ({chord, endpoints})

class TreeNode {
  public region: BranchRegion
  public children: Set<TreeNode>

  constructor(protected branchSpec: BranchSpec) {
    this.region = this.createRegion(branchSpec)
    this.children = new Set()
  }

  public static new(branchSpec: BranchSpec) {
    return new TreeNode(branchSpec)
  }

  public getChildren(): TreeNode[] {
    return [...this.children.values()]
  }

  public addChild(node: TreeNode) {
    for (let child of this.children) {
      if (child.contains(node)) {
        return child.addChild(node)
      }
      if (node.contains(child)) {
        this.children.delete(child)
        node.addChild(child)
        this.children.add(node)
      }
    }
    this.children.add(node)
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

  private createRegion(branchSpec: BranchSpec): BranchRegion {
    if (branchSpec.flip === true) {
      return BranchRegion.simple_flipped(branchSpec.chord, ...branchSpec.endpoints)
    }
    return BranchRegion.simple(branchSpec.chord, ...branchSpec.endpoints)
  }

}

export const buildBranches = (specs: BranchSpec[]): BranchRegion[] => {
  const forestSet = specs.map(TreeNode.new)
  .reduce((nodes: Set<TreeNode>, newNode: TreeNode) => {
    for (let node of nodes.values()) {
      if (node.contains(newNode)) {
        node.addChild(newNode)
        return nodes
      }
      if (newNode.contains(node)) {
        nodes.delete(node)
        newNode.addChild(node)
        nodes.add(newNode)
      }
    }
    nodes.add(newNode)

    return nodes
  }, new Set())

  const rootNodes = [...forestSet.values()]
  return rootNodes.map((root: TreeNode): BranchRegion[] => {
    const result = []
    for (let node of root.postOrder()) {
      const region = node.region.without(...node.getChildren().map(n => n.region))
      result.push(region)
    }
    return result
  }).reduce((arr1, arr2) => arr1.concat(arr2))

}

export const maybeAddFinalBranch = (base: number, regions: BranchRegion[]): BranchRegion[] => {
  if (regions.length === base) {
    return regions
  }
  const finalRegion = BranchRegion.complement(...regions)
  return [...regions, finalRegion]
}

export const makeBuilder = (base: number) => (specs: BranchSpec[]): BranchRegion[] => {
  return maybeAddFinalBranch(base, buildBranches(specs))
}
