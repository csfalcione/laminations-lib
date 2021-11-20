import { implies } from './util'

describe('implies', () => {

    it('is correct', () => {
        expect(implies(true, false)).toBe(false)
        expect(implies(false, false)).toBe(true)
        expect(implies(true, true)).toBe(true)
        expect(implies(false, true)).toBe(true)
    })
})
