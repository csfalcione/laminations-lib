import { Fractions, Fraction } from "./fractions"
import { Chords } from './chords'
import { Laminations } from './lamination'
import { Polygon, Polygons } from './polygons'
import { makeBranchSpec, maybeAddFinalBranch, buildBranches, TreeNode } from './branch-builder'
import { BranchRegion } from './branch-region'
import { List } from 'immutable'

const takeIterations = (firstLeaves: Polygon[], branches: BranchRegion[], n: number) => {
    const laminations = []
    const pullbackGenerator = Laminations.iterates(firstLeaves, branches)
    for (let i = 0; i < n; i++) {
        const leaves = pullbackGenerator.next().value
        laminations.push(leaves.map(leaf => `${leaf}`).sort())
    }
    return laminations
}

const newPolygon = (points: Fraction[]) => Polygons.create(List(points))

describe('branch-builder', () => {
    const ternary = Fractions.parseFactory(3)
    const quintary = Fractions.parseFactory(5)

    it('works for simple laminations', () => {
        const criticalA = Chords.create(
            ternary('_01'), // 1/8
            ternary('2_10') // 19/24
        )
        const criticalB = Chords.create(
            ternary('0_21'), // 7/24
            ternary('_12') // 5/8
        )

        const firstSpec = makeBranchSpec(criticalA, criticalA.lower)
        const secondSpec = makeBranchSpec(criticalB, criticalB.upper)

        const specs = [firstSpec, secondSpec]
        for (let spec of specs) {
            expect(spec).toBeTruthy()
        }
        const branches = maybeAddFinalBranch(3, buildBranches(specs))

        const firstLeaves = [
            Chords.create(
                ternary('_01'), // 1/8
                ternary('_21') // 7/8
            ),
            Chords.create(
                ternary('_10'), // 3/8
                ternary('_12') // 5/8
            )
        ].map(Polygons.fromChord)

        const lamination = takeIterations(firstLeaves, branches, 2)

        expect(lamination).toEqual([
            [
                '_01, _21',
                '_10, _12',
            ],
            [
                '0_01, 2_21',
                '0_12, 2_10',
                '0_21, 2_01',
                '1_10, 1_12',
                '_01, _21',
                '_10, _12',
            ]
        ])
    })

    it('doesnt break for polygons with an all-critical triangle', () => {
        const pointA = ternary('_001')
        const pointB = ternary('1_010')
        const pointC = ternary('2_010')

        const criticalA = Chords.create(pointA, pointB)
        const criticalB = Chords.create(pointB, pointC)
        const criticalC = Chords.create(pointC, pointA)

        const specs = [
            makeBranchSpec(criticalA, pointA),
            makeBranchSpec(criticalB, pointB),
            makeBranchSpec(criticalC, pointC)
        ]
        const branches = maybeAddFinalBranch(3, buildBranches(specs))

        const startingTriangle = newPolygon([
            ternary('_001'),
            ternary('_010'),
            ternary('_100'),
        ])

        const lamination = takeIterations([startingTriangle], branches, 2)

        expect(lamination).toEqual([
            ['_001, _010, _100'],
            [
                '0_001, 2_010, 2_100',
                '1_010, 1_100, 2_001',
                '_001, _010, _100',
            ]
        ])
    })

    it('works for laminations with nested regions', () => {
        const pointA = quintary('0_033')
        const pointB = quintary('_033')
        const pointC = quintary('1_330')
        const pointD = quintary('_200')
        const pointE = quintary('3_002')
        const pointF = quintary('_303')
        const pointG = quintary('_330')
        const pointH = quintary('4_303')

        const criticalA = Chords.create(pointA, pointF)
        const criticalB = Chords.create(pointB, pointC)
        const criticalC = Chords.create(pointD, pointE)
        const criticalD = Chords.create(pointG, pointH)

        const initialLeaves = [
            newPolygon([
                pointB,
                pointD,
                quintary('_300')
            ]),
            newPolygon([
                quintary('_020'),
                quintary('_030'),
                pointF
            ]),
            newPolygon([
                quintary('_002'),
                quintary('_003'),
                pointG
            ])
        ]

        const specs = [
            makeBranchSpec(criticalB, pointC),
            makeBranchSpec(criticalC, pointE),
            makeBranchSpec(criticalD, pointH),
            makeBranchSpec(criticalA, pointA),
        ]

        const branches = maybeAddFinalBranch(5, buildBranches(specs))

        const lamination = takeIterations(initialLeaves, branches, 2)

        expect(lamination).toEqual([
            [
                '_002, _003, _330',
                '_020, _030, _303',
                '_033, _200, _300',
            ],
            [
                '0_002, 0_003, 4_330',
                '0_033, 3_200, 3_300',
                '0_303, 3_020, 3_030',
                '1_002, 1_003, 1_330',
                '1_020, 1_030, 1_303',
                '1_033, 1_200, 1_300',
                '2_003, 2_330, 3_002',
                '2_020, 2_030, 2_303',
                '2_033, 2_200, 2_300',
                '3_330, 4_002, 4_003',
                '4_020, 4_030, 4_303',
                '4_033, 4_200, 4_300',
                '_002, _003, _330',
                '_020, _030, _303',
                '_033, _200, _300',
            ]
        ])

    })

})

describe('TreeNode::contains()', () => {
    const quaternary = Fractions.parseFactory(4)

    test('one is strictly in the interior of the other', () => {
        const diameter = Chords.create(
            quaternary('_01'),
            quaternary('2_10')
        )
        const smaller = Chords.create(
            quaternary('0_03'),
            quaternary('_30')
        )

        const diameterNode = TreeNode.new({
            chord: diameter,
            endpoints: [diameter.lower],
            flip: true,
        })
        const smallerNode = TreeNode.new({
            chord: smaller,
            endpoints: [smaller.lower],
        })

        expect(diameterNode.contains(smallerNode)).toBe(true)
        expect(smallerNode.contains(diameterNode)).toBe(false)

    })

    test('shared boundary: both open', () => {
        const bigger = Chords.create(quaternary('_'), quaternary('_12'))
        const smaller = Chords.create(quaternary('_'), quaternary('_11'))

        const biggerNode = TreeNode.new({
            chord: bigger,
            endpoints: []
        })
        const smallerNode = TreeNode.new({
            chord: smaller,
            endpoints: []
        })

        expect(biggerNode.contains(smallerNode)).toBe(true)
        expect(smallerNode.contains(biggerNode)).toBe(false)
    })

    test('shared boundary: both closed', () => {
        const bigger = Chords.create(quaternary('_'), quaternary('_12'))
        const smaller = Chords.create(quaternary('_'), quaternary('_11'))

        const biggerNode = TreeNode.new({
            chord: bigger,
            endpoints: [bigger.lower]
        })
        const smallerNode = TreeNode.new({
            chord: smaller,
            endpoints: [smaller.lower]
        })

        expect(biggerNode.contains(smallerNode)).toBe(true)
        expect(smallerNode.contains(biggerNode)).toBe(false)
    })

    test('shared boundary: bigger closed', () => {
        const bigger = Chords.create(quaternary('_'), quaternary('_12'))
        const smaller = Chords.create(quaternary('_'), quaternary('_11'))

        const biggerNode = TreeNode.new({
            chord: bigger,
            endpoints: [bigger.lower]
        })
        const smallerNode = TreeNode.new({
            chord: smaller,
            endpoints: []
        })

        expect(biggerNode.contains(smallerNode)).toBe(true)
        expect(smallerNode.contains(biggerNode)).toBe(false)
    })

    test('shared boundary: smaller closed', () => {
        const bigger = Chords.create(quaternary('_'), quaternary('_12'))
        const smaller = Chords.create(quaternary('_'), quaternary('_11'))

        const biggerNode = TreeNode.new({
            chord: bigger,
            endpoints: []
        })
        const smallerNode = TreeNode.new({
            chord: smaller,
            endpoints: [smaller.lower]
        })

        expect(biggerNode.contains(smallerNode)).toBe(false)
        expect(smallerNode.contains(biggerNode)).toBe(false)
    })

    test('complicated example', () => {
        const zero = quaternary('_')
        const quarter = quaternary('1')
        const half = quaternary('2')
        const three_quarters = quaternary('3')

        const first_quarter = TreeNode.new({
            chord: Chords.create(zero, quarter),
            endpoints: [quarter],
        })
        const first_half = TreeNode.new({
            chord: Chords.create(zero, half),
            endpoints: [half],
        })
        const second_half = TreeNode.new({
            chord: Chords.create(zero, half),
            endpoints: [half],
            flip: true,
        })
        const fourth_quarter = TreeNode.new({
            chord: Chords.create(zero, three_quarters),
            endpoints: [three_quarters],
        })

        expect(first_half.contains(first_quarter)).toBe(true)
        expect(second_half.contains(fourth_quarter)).toBe(true)
        expect(first_half.contains(second_half)).toBe(false)
        expect(second_half.contains(first_half)).toBe(false)
    })
})
