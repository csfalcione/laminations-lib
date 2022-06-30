import { Fractions } from './fractions'
import { List } from 'immutable'

const equals = Fractions.equals

describe('NaryFraction', () => {
  const binary = Fractions.parseUnsafeFactory(2)
  const ternary = Fractions.parseUnsafeFactory(3)
  const quaternary = Fractions.parseUnsafeFactory(4)
  const decimal = Fractions.parseUnsafeFactory(10)
  const dozenal = Fractions.parseUnsafeFactory(12)

  it('supports string interpolation', () => {
    const num = ternary('_102')
    expect(`${num}`).toBe('_102')
  })

  it('supports nontrivial equals', () => {

    const a1 = ternary('_102')
    const a2 = ternary('1_021')
    const a3 = ternary('10_210')
    const a4 = ternary('102_102')
    const a5 = ternary('1021_021')
    const b = ternary('2_1')

    const c1 = ternary('1_')
    const c2 = decimal('_3')

    const d1 = ternary('_0')
    const d2 = binary('00_')
    const d3 = decimal('_9')
    const d4 = binary('_1')

    const e1 = decimal('4_')
    const e2 = decimal('3_9')
    const e3 = decimal('3,9_9')

    const f1 = ternary('100_')
    const f2 = ternary('1_')
    const f3 = ternary('100_00')

    const g1 = ternary('2_')
    const g2 = binary('_10')

    expect(equals(a1, a2)).toBe(true)
    expect(equals(a1, a3)).toBe(true)
    expect(equals(a1, a4)).toBe(true)
    expect(equals(a1, a5)).toBe(true)

    expect(equals(a1, b)).toBe(false)

    expect(equals(c1, c2)).toBe(true)

    expect(equals(d1, d2)).toBe(true)
    expect(equals(d1, d3)).toBe(true)
    expect(equals(d1, d4)).toBe(true)
    expect(equals(d2, d4)).toBe(true)

    expect(equals(e1, e2)).toBe(true)
    expect(equals(e1, e3)).toBe(true)

    expect(equals(f1, f2)).toBe(true)
    expect(equals(f1, f3)).toBe(true)

    expect(equals(g1, g2)).toBe(true)

  })

  it('supports less-than', () => {
    const lessThan = Fractions.lessThan

    const a = ternary('102_')
    const b = ternary('_102')

    expect(lessThan(a, b)).toBe(true)
    expect(lessThan(b, a)).toBe(false)

    expect(lessThan(a, a)).toBe(false)
    expect(lessThan(b, b)).toBe(false)
  })

  it('supports indexing', () => {
    const digitAt = Fractions.digitAt

    const a = ternary('102_')
    const b = ternary('10_102')

    expect(digitAt(a, 0)).toBe(1)
    expect(digitAt(a, 2)).toBe(2)
    expect(digitAt(a, 3)).toBe(0)

    expect(digitAt(b, 1)).toBe(0)
    expect(digitAt(b, 2)).toBe(1)
    expect(digitAt(b, 19)).toBe(2)
  })

  it('simplifies fractions', () => {
    const f = (x, y) => Fractions.simplify(List(x), List(y)).map(list => list.toArray())

    expect(f([1], [0, 2, 1])).toEqual([[], [1, 0, 2]])
    expect(f([], [3, 3, 3])).toEqual([[], [3]])

    expect(f([3, 1, 1, 0, 2, 1, 0, 2, 1], [0, 2, 1]))
      .toEqual([[3, 1], [1, 0, 2]])
    expect(f([3, 1, 1, 0, 2, 1, 0, 2, 1], [0, 2, 1, 0, 2, 1]))
      .toEqual([[3, 1], [1, 0, 2]])
  })

  it('converts to rational numbers', () => {
    const toRational = Fractions.toRational

    expect(toRational(ternary('1_'))).toEqual([1, 3])

    expect(toRational(decimal('_3'))).toEqual([1, 3])

    expect(toRational(binary('1_101'))).toEqual([6, 7])

    expect(toRational(quaternary('31_102'))).toEqual([93, 112])

    expect(toRational(ternary('_'))).toEqual([0, 1])

    expect(toRational(ternary('2_'))).toEqual([2, 3])

    expect(toRational(binary('_10'))).toEqual([2, 3])
  })

  it('supports a forward map', () => {
    const mapForward = Fractions.mapForward

    expect(equals(
      mapForward(ternary('_')),
      ternary('_')
    )).toBe(true)

    expect(equals(
      mapForward(ternary('_012')),
      ternary('_120')
    )).toBe(true)


    expect(equals(
      mapForward(ternary('1_12')),
      ternary('_12')
    )).toBe(true)

    expect(equals(
      mapForward(ternary('12_')),
      mapForward(binary('_01'))
    )).toBe(true)
  })

  it('supports a backwards map', () => {
    expect(Fractions.mapBackward(ternary('_01')).map(Fractions.toString).toArray())
      .toEqual([
        '0_01',
        '_10',
        '2_01'
      ])
  })

  it('supports parsing string input', () => {
    const rawTernary = Fractions.fromArraysFactory(3)
    const rawDozenal = Fractions.fromArraysFactory(12)

    expect(equals(ternary('100'), rawTernary([1, 0, 0], []))).toBe(true)

    expect(equals(ternary('100_'), rawTernary([1, 0, 0], []))).toBe(true)
    expect(equals(ternary('_100'), rawTernary([], [1, 0, 0]))).toBe(true)
    expect(equals(ternary('1_100'), rawTernary([1], [1, 0, 0]))).toBe(true)

    expect(equals(dozenal('_3'), rawDozenal([], [3]))).toBe(true)
    expect(equals(dozenal('11,9,2'), rawDozenal([11, 9, 2], []))).toBe(true)
    expect(equals(dozenal('11,9,2_'), rawDozenal([11, 9, 2], []))).toBe(true)
    expect(equals(dozenal('_11,9,2'), rawDozenal([], [11, 9, 2]))).toBe(true)
    expect(equals(dozenal('11_11,9,2'), rawDozenal([11], [11, 9, 2]))).toBe(true)
  })

})

describe('findCircularRepeatingSuffix', () => {
  const f = (x, y) => Fractions.findCircularRepeatingSuffix(List(x), List(y))

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
  const f = x => Fractions.reduceCircularSequence(List(x)).toArray()
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
  const f = Fractions.makeKMPFailureTable
  it('works', () => {
    expect(f(List([1, 2, 1, 1, 2, 1, 1, 2, 1]))).toEqual(List([0, 0, 1, 1, 2, 3, 4, 5, 6]))
  })
})

describe('findNaturalSuffixStart', () => {
  const f = Fractions.findNaturalSuffixStart
  it('works', () => {
    expect(f(List([1, 0, 1, 1, 2, 3, 4, 5]))).toEqual(3)
    expect(f(List([1, 0, 1, 1]))).toEqual(3)
    expect(f(List([1, 0, 1]))).toEqual(2)
    expect(f(List([0, 2, 3, 2]))).toEqual(4)
    expect(f(List([]))).toEqual(0)
  })
})
