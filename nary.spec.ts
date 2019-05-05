import {NaryFraction, findCircularRepeatingSuffix, reduceCircularSequence} from './nary'


describe('NaryFraction', () => {
    const binary = NaryFraction.factory(2)
    const ternary = NaryFraction.factory(3)
    const quaternary = NaryFraction.factory(4)

    it('supports nontrivial equals', () => {

        const a1 = ternary([], [1, 0, 2])
        const a2 = ternary([1], [0, 2, 1])
        const a3 = ternary([1, 0], [2, 1, 0])
        const a4 = ternary([1, 0, 2], [1, 0, 2])
        const a5 = ternary([1, 0, 2, 1], [0, 2, 1])
        const b  = ternary([2], [1])

        expect(a1.equals(a2)).toBe(true)
        expect(a1.equals(a3)).toBe(true)
        expect(a1.equals(a4)).toBe(true)
        expect(a1.equals(a5)).toBe(true)

        expect(a1.equals(b)).toBe(false)

    })

    it('supports less-than', () => {
        const a = ternary([1, 0, 2], [])
        const b = ternary([], [1, 0, 2])

        expect(a.lessThan(b)).toBe(true)
        expect(b.lessThan(a)).toBe(false)

        expect(a.lessThan(a)).toBe(false)
        expect(b.lessThan(b)).toBe(false)
    })

    it('supports indexing', () => {
        const a = ternary([1, 0, 2], [])
        const b = ternary([1, 0], [1, 0, 2])

        expect(a.digitAt(0)).toBe(1)
        expect(a.digitAt(2)).toBe(2)
        expect(a.digitAt(3)).toBe(0)

        expect(b.digitAt(1)).toBe(0)
        expect(b.digitAt(2)).toBe(1)
        expect(b.digitAt(19)).toBe(2)
    })

    it('simplifies fractions', () => {
        const f = NaryFraction.simplify

        expect( f([1], [0, 2, 1]) ).toEqual([ [], [1, 0, 2] ])
        expect( f([], [3, 3, 3]) ).toEqual([ [], [3] ])

        expect( f(   [3, 1, 1, 0, 2, 1, 0, 2, 1], [0, 2, 1]) )
          .toEqual([ [3, 1],                      [1, 0, 2]] )
        expect( f(   [3, 1, 1, 0, 2, 1, 0, 2, 1], [0, 2, 1, 0, 2, 1]) )
          .toEqual([ [3, 1],                      [1, 0, 2]] )
    })

    it('converts to rational numbers', () => {
        expect( ternary([1], []).toRational() )
          .toEqual([1, 3])

        expect( binary([1], [1, 0, 1]).toRational())
          .toEqual([6, 7])

        expect( quaternary([3, 1], [1, 0, 2]).toRational() )
          .toEqual([837, 1008])
    })


})

describe('findCircularRepeatingSuffix()', () => {
    const f = findCircularRepeatingSuffix

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

describe('reduceCircularSequence()', () => {
    const f = reduceCircularSequence
    it('works', () => {
        expect(f([3, 3, 3])).toEqual([3])
        expect(f([1, 2, 3])).toEqual([1, 2, 3])
        expect(f([1, 2, 3, 1, 2, 3])).toEqual([1, 2, 3])
    })
})
