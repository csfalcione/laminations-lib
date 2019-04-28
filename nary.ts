
/**
 * A class for fractions on the interval [0, 1) represented as a sequence of exact
 * digits followed by a sequence of repeating digits.
 * For example:
 * - In base 3 (ternary), 0.1 (one third) would be represented by
 *   `new NaryFraction(3, [1], [])`
 * - In base 2 (binary), 0.101101101... (five sevenths) would be represented by
 *   `new NaryFraction(2, [], [1,0,1])` and 0.1_101101101... (twelve fourteenths)
 *   would be represented by `new NaryFraction(2, [1], [1,0,1])`
 */
export class NaryFraction {

    constructor(
        base: number,
        exactPart: Array<number>,
        repeatingPart: Array<number>
    ) {
        const [newExact, newRepeating] = NaryFraction.simplify(exactPart, repeatingPart)

        this.base = base
        this.exactPart = newExact
        this.repeatingPart = newRepeating
    }

    public base: number
    public exactPart: Array<number>
    public repeatingPart: Array<number>

    public static new(
            base: number,
            exactPart: Array<number>,
            repeatingPart: Array<number>): NaryFraction {
        return new NaryFraction(base, exactPart, repeatingPart)
    }

    public static factory(base: number) {
        return (exactPart: Array<number>, repeatingPart: Array<number>): NaryFraction => {
            return new NaryFraction(base, exactPart, repeatingPart)
        }
    }

    public static simplify(exactPart: Array<number>, repeatingPart: Array<number>): [Array<number>, Array<number>] {
        const repeatingSuffixStart = findCircularRepeatingSuffix(exactPart, repeatingPart)
        const newExactPart = exactPart.slice(0, repeatingSuffixStart)

        const repeatingSuffixLen = exactPart.length - repeatingSuffixStart
        const newRepeatingPart = rotateRight(repeatingPart, repeatingSuffixLen % repeatingPart.length)

        return [newExactPart, newRepeatingPart]
    }


    public equals(other: NaryFraction): boolean {
        return this.base === other.base
            && arraysEqual(this.exactPart, other.exactPart)
            && arraysEqual(this.repeatingPart, other.repeatingPart)
    }

    public lessThan(other: NaryFraction): boolean {
        if (this.base !== other.base) {
            return false
        }


    }

}

/**
 * Finds the smallest index i such that sequence.slice(i) is a suffix of 'repeating' followed by
 * some number of concatenations of 'repeating'. Returns sequence.length if no such suffix exists.
 * Ex:
 * ([1], [0,2,1]) -> 0
 * ([3,1,1], [0,2,1]) -> 2
 * ([3,1,1,0,2,1], [0,2,1]) -> 2
 * ([3,1,1,0,2,1,0,2,1], [0,2,1]) -> 2
 * ([3], [0,2,1]) -> 1
 * ([3], []) -> 1
 * ([], []) -> 0
 */
export const findCircularRepeatingSuffix = <T>(sequence: Array<T>, repeating: Array<T>): number => {
    const indexSequenceFromRight = idx => sequence.length - idx - 1
    const indexRepeatingFromRight = idx => repeating.length - (idx % repeating.length) - 1

    for (let cursor = 0; cursor < sequence.length; cursor++) {
        const sequenceIdx = indexSequenceFromRight(cursor)
        const repeatingIdx = indexRepeatingFromRight(cursor)
        if (sequence[sequenceIdx] !== repeating[repeatingIdx]) {
            return sequenceIdx + 1
        }
    }

    return 0
}

// ex: ([1,2,3], 1) -> [3,1,2]
const rotateRight = <T>(array: Array<T>, offset: number): Array<T> => {
    const len = array.length
    const result = new Array<T>(len)

    for (let i = 0; i < len; i++) {
        result[ (i + offset) % len ] = array[i]
    }

    return result
}

const arraysEqual = <T>(a: Array<T>, b: Array<T>): boolean => {
    if (a.length !== b.length) {
        return false
    }

    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false
        }
    }

    return true
}
