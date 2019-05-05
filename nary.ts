
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
        repeatingPart = reduceCircularSequence(repeatingPart)
        const repeatingSuffixStart = findCircularRepeatingSuffix(exactPart, repeatingPart)
        const newExactPart = exactPart.slice(0, repeatingSuffixStart)

        const repeatingSuffixLen = exactPart.length - repeatingSuffixStart
        const newRepeatingPart = rotateRight(repeatingPart, repeatingSuffixLen % repeatingPart.length)

        return [newExactPart, newRepeatingPart]
    }


    public equals(other: NaryFraction): boolean {
        if (this.base !== other.base) {
            const [thisNum, thisDenom] = this.toRational()
            const [otherNum, otherDenom] = other.toRational()
            return thisNum === otherNum && thisDenom === otherDenom
        }

        return arraysEqual(this.exactPart, other.exactPart)
            && arraysEqual(this.repeatingPart, other.repeatingPart)
    }

    public lessThan(other: NaryFraction): boolean {
        if (this.base !== other.base) {
            return this.equals(other) === false && this.toNumber() < other.toNumber()
        }
        const approxLen = frac => frac.exactPart.length + frac.repeatingPart.length

        const upperBound = 2 * Math.max( approxLen(this), approxLen(other) )
        for (let idx = 0; idx < upperBound; idx++) {
            const thisDigit = this.digitAt(idx)
            const otherDigit = other.digitAt(idx)
            if (thisDigit === otherDigit) {
                continue
            }
            return thisDigit < otherDigit
        }

        return false
    }

    public digitAt(idx: number): number {
        const exactLen = this.exactPart.length
        const repeatingLen = this.repeatingPart.length

        if (idx < exactLen) {
            return this.exactPart[idx]
        }

        if (repeatingLen === 0) {
            return 0
        }

        return this.repeatingPart[(idx - exactLen) % repeatingLen]
    }

    public toNumber(): number {
        return this.numerator() / this.denominator()
    }

    public toRational(): [number, number] {
        const num = this.numerator()
        const denom = this.denominator()
        const gcd = greatestCommonDivisor(num, denom)
        return [Math.round(num / gcd), Math.round(denom / gcd)]
    }


    public numerator(): number {
        const d = this.base
        return this.repeatingDenominator() * valueFromDigits(d, this.exactPart)
            + valueFromDigits(d, this.repeatingPart)
    }

    public denominator(): number {
        return this.repeatingDenominator() * Math.pow(this.base, this.exactPart.length)
    }

    private repeatingDenominator(): number {
        const result = Math.pow(this.base, this.repeatingPart.length) - 1
        if (result === 0) {
            return 1
        }
        return result
    }

}


/**
 * Finds the shortest-length contiguous subsequence w of 'sequence' such that
 * 'sequence' is some number of concatenations of w.
 * Ex:
 * [1, 1, 1] -> [1]
 * [1, 2, 3, 1, 2, 3] -> [1, 2, 3]
 * [1, 2, 3, 1, 2] -> [1, 2, 3, 1, 2]
 */
export const reduceCircularSequence = <T>(sequence: Array<T>): Array<T> => {
    for (let width = 1; width <= sequence.length / 2; width++) {
        if (sequence.length % width !== 0) {
            continue
        }
        if (isCircularOfWidth(sequence, width)) {
            return sequence.slice(0, width)
        }
    }

    return sequence
}

const isCircularOfWidth = <T>(sequence: Array<T>, width: number): boolean => {
    return range(0, width)
        .every( startIdx => range(startIdx, sequence.length, width)
                .map(idx => sequence[idx])
                .every(val => val === sequence[startIdx])
        )
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

const range = (start: number, end: number, step: number = 1): Array<number> => {
    const result = []

    for (let num = start; num < end; num += step) {
        result.push(num)
    }

    return result
}


const valueFromDigits = (base: number, digits: Array<number>): number => {
    let sum = 0
    let place = 1
    for (let idx = digits.length - 1; idx >= 0; idx--) {
        sum += digits[idx] * place
        place *= base
    }

    return sum
}

const greatestCommonDivisor = (b: number, a: number): number => {
    if (a === 0) {
        return b
    }

    return greatestCommonDivisor(a, b % a)
}
