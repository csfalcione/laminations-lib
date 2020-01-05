import { NaryFraction, findCircularRepeatingSuffix, reduceCircularSequence, findNaturalSuffixStart, makeKMPFailureTable } from './nary'
import { List, Repeat } from 'immutable'


describe('NaryFraction', () => {
  const binary = NaryFraction.parseFactory(2)
  const ternary = NaryFraction.parseFactory(3)
  const quaternary = NaryFraction.parseFactory(4)
  const decimal = NaryFraction.parseFactory(10)
  const dozenal = NaryFraction.parseFactory(12)

  it('supports string interpolation', () => {
    const num = NaryFraction.parse(3, '_102')
    expect(`${num}`).toBe('_102')
  })

  it('supports nontrivial equals', () => {

    const a1 = ternary("_102")
    const a2 = ternary("1_021")
    const a3 = ternary("10_210")
    const a4 = ternary("102_102")
    const a5 = ternary("1021_021")
    const b = ternary("2_1")

    const c1 = ternary("1_")
    const c2 = decimal("_3")

    const d1 = ternary("_0")
    const d2 = binary("00_")
    const d3 = decimal("_9")
    const d4 = binary("_1")

    const e1 = decimal("4_")
    const e2 = decimal("3_9")
    const e3 = decimal("3,9_9")

    const f1 = ternary("100_")
    const f2 = ternary("1_")
    const f3 = ternary("100_00")

    const g1 = ternary("2_")
    const g2 = binary("_10")

    expect(a1.equals(a2)).toBe(true)
    expect(a1.equals(a3)).toBe(true)
    expect(a1.equals(a4)).toBe(true)
    expect(a1.equals(a5)).toBe(true)

    expect(a1.equals(b)).toBe(false)

    expect(c1.equals(c2)).toBe(true)

    expect(d1.equals(d2)).toBe(true)
    expect(d1.equals(d3)).toBe(true)
    expect(d1.equals(d4)).toBe(true)
    expect(d2.equals(d4)).toBe(true)

    expect(e1.equals(e2)).toBe(true)
    expect(e1.equals(e3)).toBe(true)

    expect(f1.equals(f2)).toBe(true)
    expect(f1.equals(f3)).toBe(true)

    expect(g1.equals(g2)).toBe(true)

  })

  it('supports less-than', () => {
    const a = ternary("102_")
    const b = ternary("_102")

    expect(a.lessThan(b)).toBe(true)
    expect(b.lessThan(a)).toBe(false)

    expect(a.lessThan(a)).toBe(false)
    expect(b.lessThan(b)).toBe(false)
  })

  it('supports indexing', () => {
    const a = ternary("102_")
    const b = ternary("10_102")

    expect(a.digitAt(0)).toBe(1)
    expect(a.digitAt(2)).toBe(2)
    expect(a.digitAt(3)).toBe(0)

    expect(b.digitAt(1)).toBe(0)
    expect(b.digitAt(2)).toBe(1)
    expect(b.digitAt(19)).toBe(2)
  })

  it('simplifies fractions', () => {
    const f = (x, y) => NaryFraction.simplify(List(x), List(y)).map(list => list.toArray())

    expect(f([1], [0, 2, 1])).toEqual([[], [1, 0, 2]])
    expect(f([], [3, 3, 3])).toEqual([[], [3]])

    expect(f([3, 1, 1, 0, 2, 1, 0, 2, 1], [0, 2, 1]))
      .toEqual([[3, 1], [1, 0, 2]])
    expect(f([3, 1, 1, 0, 2, 1, 0, 2, 1], [0, 2, 1, 0, 2, 1]))
      .toEqual([[3, 1], [1, 0, 2]])
  })

  it('converts to rational numbers', () => {
    expect(ternary("1_").toRational())
      .toEqual([1, 3])

    expect(decimal("_3").toRational())
      .toEqual([1, 3])

    expect(binary("1_101").toRational())
      .toEqual([6, 7])

    expect(quaternary("31_102").toRational())
      .toEqual([93, 112])

    expect(ternary("_").toRational())
      .toEqual([0, 1])

    expect(ternary("2_").toRational())
      .toEqual([2, 3])

    expect(binary("_10").toRational())
      .toEqual([2, 3])
  })

  it('supports a forward map', () => {
    expect(ternary("_").mapForward().equals(ternary("_"))).toBe(true)

    expect(ternary("_012").mapForward().equals(ternary("_120"))).toBe(true)

    expect(ternary("1_12").mapForward().equals(ternary("_12"))).toBe(true)

    expect(ternary("12_").mapForward().equals(binary("_01").mapForward())).toBe(true)
  })

  it('supports a backwards map', () => {
    expect(ternary("_01").mapBackward().map(point => point.toString()))
      .toEqual([
        "0_01",
        "_10",
        "2_01"
      ])
  })

  it('supports parsing string input', () => {
    const rawTernary = NaryFraction.factory(3)
    const rawDozenal = NaryFraction.factory(12)

    expect(ternary('100').equals(rawTernary([1, 0, 0], []))).toBe(true)
    expect(ternary('100_').equals(rawTernary([1, 0, 0], []))).toBe(true)
    expect(ternary('_100').equals(rawTernary([], [1, 0, 0]))).toBe(true)
    expect(ternary('1_100').equals(rawTernary([1], [1, 0, 0]))).toBe(true)
    
    expect(dozenal('_3').equals(rawDozenal([], [3]))).toBe(true)
    expect(dozenal('11,9,2').equals(rawDozenal([11, 9, 2], []))).toBe(true)
    expect(dozenal('11,9,2_').equals(rawDozenal([11, 9, 2], []))).toBe(true)
    expect(dozenal('_11,9,2').equals(rawDozenal([], [11, 9, 2]))).toBe(true)
    expect(dozenal('11_11,9,2').equals(rawDozenal([11], [11, 9, 2]))).toBe(true)
  })

})

describe('findCircularRepeatingSuffix', () => {
  const f = (x, y) => findCircularRepeatingSuffix(List(x), List(y))

  it('handles edge cases', () => {
    expect(f([3], [0, 2, 1])).toEqual(1)
    expect(f([3], [])).toEqual(1)
    expect(f([], [1, 2])).toEqual(0)
    expect(f([], [])).toEqual(0)
  })

  it('handles normal cases', () => {
    expect(f([1], [0, 2, 1])).toEqual(0)
    expect(f([3, 1, 1], [0, 2, 1])).toEqual(2)
    expect(f([3, 1, 1, 0, 2, 1], [0, 2, 1])).toEqual(2)
    expect(f([3, 1, 1, 0, 2, 1, 0, 2, 1], [0, 2, 1])).toEqual(2)
  })
})

describe('reduceCircularSequence', () => {
  const f = x => reduceCircularSequence(List(x)).toArray()
  it('works', () => {
    expect(f([])).toEqual([])
    expect(f([3, 3, 3])).toEqual([3])
    expect(f([1, 2, 3])).toEqual([1, 2, 3])
    expect(f([1, 2, 3, 1, 2, 3])).toEqual([1, 2, 3])
    expect(f([1, 2, 3, 1, 2, 3, 1, 2, 3])).toEqual([1, 2, 3])
    expect(f([1, 2, 3, 1, 2, 4, 1, 2, 3])).toEqual([1, 2, 3, 1, 2, 4, 1, 2, 3])
    expect(f([1, 2, 1, 1, 2, 1, 1, 2, 1])).toEqual([1, 2, 1])
    expect(f([1, 2, 1, 1, 2, 1, 1, 2])).toEqual([1, 2, 1, 1, 2, 1, 1, 2])
  })
})

describe('makeKMPFailureTable', () => {
  const f = makeKMPFailureTable
  it('works', () => {
    expect(f(List([1, 2, 1, 1, 2, 1, 1, 2, 1]))).toEqual(List([0, 0, 1, 1, 2, 3, 4, 5, 6]))
  })
})

describe('findNaturalSuffixStart', () => {
  const f = findNaturalSuffixStart
  it('works', () => {
    expect(f(List([1, 0, 1, 1, 2, 3, 4, 5]))).toEqual(3)
    expect(f(List([1, 0, 1, 1]))).toEqual(3)
    expect(f(List([1, 0, 1]))).toEqual(2)
    expect(f(List([0, 2, 3, 2]))).toEqual(4)
    expect(f(List([]))).toEqual(0)
  })
})
