import { NaryFraction } from "./nary";
import { Chord } from './chord';
import { Polygon } from './polygon';
import { Lamination } from './lamination';
import { BranchRegion } from './branch-region';
import { List } from 'immutable';

const binary = NaryFraction.parseFactory(2)
const ternary = NaryFraction.parseFactory(3)

const displayPoint = (t: NaryFraction) => t.toRational().join('/')

const displayPolygon = (poly) => {
  return poly.points.map(displayPoint).join(', ')
}

const newPolygon = (points: NaryFraction[]) => Polygon.new(List(points))

describe('PullbackLamination', () => {

  test('pullBack and mapForward are inverses', () => {
    const criticalChord = Chord.new(
      binary("_001"), // 1/7
      binary("1_010") // 9/14
    )


    const firstRegion = BranchRegion.simple(criticalChord, criticalChord.lower)
    const secondRegion = firstRegion.complement()

    const branches: BranchRegion[] = [
      firstRegion,
      secondRegion,
    ]

    const startingTriangle = newPolygon([
      binary("_001"), // 1/7
      binary("_010"), // 2/7
      binary("_100"), // 4/7
    ])

    let previousPullback = [startingTriangle]
    for (let i = 0; i < 5; i++) {
      const newPullback = Lamination.pullBack(previousPullback, branches)
      const mappedForward = Lamination.mapForward(newPullback)
      expect(mappedForward.map(displayPolygon)).toEqual(previousPullback.map(displayPolygon))
      previousPullback = newPullback
    }
  })

  test('binary rabbit lamination', () => {
    const criticalChord = Chord.new(
      binary("_001"), // 1/7
      binary("1_010") // 9/14
    )


    const firstRegion = BranchRegion.simple(criticalChord, criticalChord.lower)
    const secondRegion = firstRegion.complement()

    const branches: BranchRegion[] = [
      firstRegion,
      secondRegion,
    ]

    const startingTriangle = newPolygon([
      binary("_001"), // 1/7
      binary("_010"), // 2/7
      binary("_100"), // 4/7
    ])

    const laminations = []
    const pullbackGenerator = Lamination.iterates([startingTriangle], branches)
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

  test('ternary symmetric lamination', () => {
    const criticalA = Chord.new(
      ternary("_01"), // 1/8
      ternary("2_10") // 19/24
    )
    const criticalB = Chord.new(
      ternary("0_21"), // 7/24
      ternary("_12") // 5/8
    )

    const firstRegion = BranchRegion.simple(criticalA, criticalA.lower)
    const secondRegion = BranchRegion.simple(criticalB, criticalB.upper)
    const thirdRegion = BranchRegion.complement(firstRegion, secondRegion)

    const branches: BranchRegion[] = [
      firstRegion,
      secondRegion,
      thirdRegion
    ]

    const firstLeaves = [
      Chord.new(
        ternary("_01"), // 1/8
        ternary("_21") // 7/8
      ),
      Chord.new(
        ternary("_10"), // 3/8
        ternary("_12") // 5/8
      )
    ].map(Polygon.fromChord)

    const laminations = []
    const pullbackGenerator = Lamination.iterates(firstLeaves, branches)
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