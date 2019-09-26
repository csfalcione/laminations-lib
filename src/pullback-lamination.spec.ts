import { NaryFraction } from "./nary";
import { Chord } from './chord';
import { Polygon } from './polygon';
import { PullbackLamination } from './pullback-lamination';
import { BranchRegion, not, or } from './branch-region';

const binary = NaryFraction.factory(2)
const ternary = NaryFraction.factory(3)

const displayPoint = (t: NaryFraction) => t.toRational().join('/')

const displayPolygon = (poly) => {
  return poly.points.map(displayPoint).join(', ')
}

describe('PullbackLamination', () => {
  it('binary rabbit lamination', () => {
    const criticalChord = Chord.new(
      binary([], [0, 0, 1]), // 1/7
      binary([1], [0, 1, 0]) // 9/14
    )
    
    
    const firstRegion = BranchRegion.simple(criticalChord, criticalChord.lower)
    const secondRegion = firstRegion.complement()

    const branches: Array<BranchRegion> = [
      firstRegion,
      secondRegion,
    ]

    const startingTriangle = Polygon.new([
      binary([], [0, 0, 1]), // 1/7
      binary([], [0, 1, 0]), // 2/7
      binary([], [1, 0, 0]), // 4/7
    ])

    const laminations = []
    const pullbackGenerator = PullbackLamination.iterates([startingTriangle], branches)
    for (let i = 0; i < 3; i++) {
      const leaves = pullbackGenerator.next().value
      laminations.push(leaves.map(displayPolygon))
    }

    expect(laminations).toEqual([
      ['1/7, 2/7, 4/7'],
      [
        '1/7, 2/7, 4/7',
        '1/14, 9/14, 11/14'
      ],
      [
        '1/7, 2/7, 4/7',
        '1/14, 9/14, 11/14',
        '9/28, 11/28, 15/28',
        '1/28, 23/28, 25/28'
      ]
    ])

  })

  it('ternary symmetric lamination', () => {
    const criticalA = Chord.new(
      ternary([], [0, 1]), // 1/8
      ternary([2], [1, 0]) // 19/24
    )
    const criticalB = Chord.new(
      ternary([0], [2, 1]), // 7/24
      ternary([], [1, 2]) // 5/8
    )

    const firstRegion = BranchRegion.simple(criticalA, criticalA.lower)
    const secondRegion = BranchRegion.simple(criticalB, criticalB.upper)
    const thirdRegion = BranchRegion.complement(firstRegion, secondRegion)

    const branches: Array<BranchRegion> = [
      firstRegion,
      secondRegion,
      thirdRegion
    ]

    const firstLeaves = [
      Chord.new(
        ternary([], [0, 1]), // 1/8
        ternary([], [2, 1]) // 7/8
      ),
      Chord.new(
        ternary([], [1, 0]), // 3/8
        ternary([], [1, 2]) // 5/8
      )
    ].map(Polygon.fromChord)

    const laminations = []
    const pullbackGenerator = PullbackLamination.iterates(firstLeaves, branches)
    for (let i = 0; i < 2; i++) {
      const leaves = pullbackGenerator.next().value
      laminations.push(leaves.map(displayPolygon))
    }

    expect(laminations).toEqual([
      [
        '1/8, 7/8',
        '3/8, 5/8'
      ],
      [
        '1/24, 23/24',
        '3/8, 5/8',
        '7/24, 17/24',
        '1/8, 7/8',
        '11/24, 13/24',
        '5/24, 19/24'
      ]
    ])
  }

  )
})