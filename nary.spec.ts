import {NaryFraction, findCircularRepeatingSuffix} from './nary'


describe('nary tests', () => {

    it('supports nontrivial equals', () => {
        const ternary = NaryFraction.factory(3)

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

    it('simplifies fractions', () => {
        const f = NaryFraction.simplify

        expect( f([1], [0, 2, 1]) ).toEqual([ [], [1, 0, 2] ])

        expect( f(   [3, 1, 1, 0, 2, 1, 0, 2, 1], [0, 2, 1]) )
          .toEqual([ [3, 1],                      [1, 0, 2]] )
    })


})

describe('findCircularRepeatingSuffix() tests', () => {
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
