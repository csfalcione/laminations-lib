import { NaryFraction } from "./nary"
import { Chord } from './chord'
import { BranchRegion, chord, point, or, and, none, not } from './branch-region'


describe('BranchRegion', () => {
  const quintary = NaryFraction.parseFactory(5)

  const pointA = quintary('_003')
  const pointB = quintary('_033')
  const pointC = quintary('1_330')
  const pointD = quintary('_200')
  const pointE = quintary('3_002')
  const pointF = quintary('_303')
  const pointG = quintary('_330')
  const pointH = quintary('4_303')

  const chordA = Chord.new(pointA, pointF)
  const chordB = Chord.new(pointB, pointC)
  const chordC = Chord.new(pointD, pointE)
  const chordD = Chord.new(pointG, pointH)

  it('supports simple branch regions', () => {
    const branchB = BranchRegion.new(
      or(
        chord(chordB),
        point(pointC)
      )
    )

    expect(branchB.contains(pointB)).toBe(false)
    expect(branchB.contains(pointC)).toBe(true)
    expect(branchB.contains(quintary('_034'))).toBe(true)
    expect(branchB.contains(pointD)).toBe(false)
    
  })

  it('defines nested regions', () => {
    const childBranch = BranchRegion.simple(chordD, pointH)

    const parentBranch = BranchRegion.simple(chordA, pointA)
    .without(childBranch)

    expect(childBranch.contains(quintary('_331'))).toBe(true)
    expect(childBranch.contains(pointG)).toBe(false)
    expect(childBranch.contains(pointH)).toBe(true)
    expect(childBranch.contains(pointA)).toBe(false)
    expect(childBranch.contains(pointB)).toBe(false)

    expect(parentBranch.contains(quintary('_331'))).toBe(false)
    expect(parentBranch.contains(pointG)).toBe(true)
    expect(parentBranch.contains(pointH)).toBe(false)
    expect(parentBranch.contains(pointA)).toBe(true)
    expect(parentBranch.contains(pointB)).toBe(false)

  })
})