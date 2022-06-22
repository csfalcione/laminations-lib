import { Fractions, Fraction } from "./fractions";
import { Chords } from './chords';
import { Polygons } from './polygons';
import { Laminations } from './lamination';
import { BranchRegion } from './branch-region';
import { List } from 'immutable';
import { buildBranches } from './branch-builder';

const binary = Fractions.parseFactory(2)
const ternary = Fractions.parseFactory(3)
const quaternary = Fractions.parseFactory(4)
const quintic = Fractions.parseFactory(5)

const displayPoint = (t: Fraction) => Fractions.toRational(t).join('/')

const displayPolygon = (poly) => {
  return poly.points.map(displayPoint).join(', ')
}

const newPolygon = (points: Fraction[]) => Polygons.create(List(points))

describe('PullbackLamination', () => {

  test('pullBack and mapForward are inverses', () => {
    const criticalChord = Chords.create(
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
      const newPullback = previousPullback.map(poly => Laminations.pullBack(poly, branches))
        .reduce((acc, leaves) => [...acc, ...leaves])
      const mappedForward = Laminations.mapForward(newPullback)
      expect(mappedForward.map(displayPolygon)).toEqual(previousPullback.map(displayPolygon))
      previousPullback = newPullback
    }
  })

  test('binary rabbit lamination', () => {
    const criticalChord = Chords.create(
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
    const pullbackGenerator = Laminations.iterates([startingTriangle], branches)
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
    const criticalA = Chords.create(
      ternary("_01"), // 1/8
      ternary("2_10") // 19/24
    )
    const criticalB = Chords.create(
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
      Chords.create(
        ternary("_01"), // 1/8
        ternary("_21") // 7/8
      ),
      Chords.create(
        ternary("_10"), // 3/8
        ternary("_12") // 5/8
      )
    ].map(Polygons.fromChord)

    const laminations = []
    const pullbackGenerator = Laminations.iterates(firstLeaves, branches)
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
  })

  test('point in multiple branches', () => {
    const topRight = Chords.create(
      quaternary('_01'),
      quaternary('1_10')
    )
    const topLeft = Chords.create(
      quaternary('1_10'),
      quaternary('2_10')
    )
    const bottomRight = Chords.create(
      quaternary('0_03'),
      quaternary('_30')
    )
    const diameter = Chords.create(
      quaternary('_01'),
      quaternary('2_10')
    )


    // _01 is contained within the first and fourth branches.
    const branches = buildBranches([
      {
        chord: topRight,
        endpoints: [topRight.lower]
      },
      {
        chord: topLeft,
        endpoints: [topLeft.lower]
      },
      {
        chord: bottomRight,
        endpoints: [bottomRight.lower]
      },
      {
        chord: diameter,
        endpoints: [diameter.lower],
        flip: true,
      },
    ])

    const leaf = Polygons.fromChord(Chords.create(
      quaternary('_03'),
      quaternary('_10')
    ))

    const siblings = Laminations.pullBack(leaf, branches).map(Polygons.toString).sort()
    expect(siblings).toEqual([
      '0_03, 3_10',
      '1_10, 2_03',
      // one of the two following chords will lack _01 if a point can't exist in multiple branches
      '_01, 1_03',
      '_01, _30',
    ])

  })

  test('no empty polygons', () => {
    const chordA = Chords.create(quintic('_1'), quintic('2_1'))
    const chordB = Chords.create(quintic('_2'), quintic('2_2'))
    const chordC = Chords.create(quintic('2_2'), quintic('3_2'))
    const chordD = Chords.create(quintic('3_2'), quintic('0_2'))
    const chordE = Chords.create(quintic('0_2'), quintic('_2'))


    const branches = buildBranches([
      {
        chord: chordA,
        endpoints: [chordA.upper]
      },
      {
        chord: chordB,
        endpoints: [chordB.upper]
      },
      {
        chord: chordC,
        endpoints: [chordC.upper]
      },
      {
        chord: chordD,
        endpoints: [chordD.upper]
      },
      {
        chord: chordE,
        endpoints: [chordE.upper]
      },
    ])

    const leafA = Polygons.fromChord(Chords.create(
      quintic('_1'),
      quintic('_2')
    ))
    const leafB = newPolygon([quintic('_1')])

    const siblings = Laminations.pullBack(leafB, branches)
    expect(siblings.every(leaf => leaf.points.count() > 0)).toBe(true)
  })

})