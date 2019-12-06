
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
        exactPart: number[],
        repeatingPart: number[]
    ) {
        let [newExact, newRepeating] = NaryFraction.simplify(exactPart, repeatingPart)

        if (arraysEqual(newRepeating, [base - 1])) {
            newRepeating = []
            newExact = incrementDigitSequence(base, newExact)
        }

        if (arraysEqual(newRepeating, [0])) {
            newRepeating = []
        }

        if (arraysEqual(newRepeating, [])) {
            newExact = removeTrailingZeroes(newExact)
        }

        this.base = base
        this.exactPart = newExact
        this.repeatingPart = newRepeating
    }

    public base: number
    public exactPart: number[]
    public repeatingPart: number[]

    public static new(
        base: number,
        exactPart: number[],
        repeatingPart: number[]): NaryFraction {
        return new NaryFraction(base, exactPart, repeatingPart)
    }

    public static factory(base: number) {
        return (exactPart: number[], repeatingPart: number[]): NaryFraction => {
            return new NaryFraction(base, exactPart, repeatingPart)
        }
    }

    public static parse(base: number, text: string): NaryFraction {
        let [exactText, repeatingText] = text.split('_')
        if (repeatingText == null) {
            repeatingText = ''
        }

        const digitSplitter = base < 10 ? '' : ','

        const exactPart = exactText.split(digitSplitter).map(x => parseInt(x))
        const repeatingPart = repeatingText.split(digitSplitter).map(x => parseInt(x))

        return new NaryFraction(base, exactPart, repeatingPart)
    }

    public static parseFactory(base: number) {
        return (text: string): NaryFraction => NaryFraction.parse(base, text)
    }

    public static simplify(exactPart: number[], repeatingPart: number[]): [number[], number[]] {
        repeatingPart = reduceCircularSequence(repeatingPart)
        const repeatingSuffixStart = findCircularRepeatingSuffix(exactPart, repeatingPart)
        const newExactPart = exactPart.slice(0, repeatingSuffixStart)

        const repeatingSuffixLen = exactPart.length - repeatingSuffixStart
        const newRepeatingPart = rotateRight(repeatingPart, repeatingSuffixLen % repeatingPart.length)

        return [newExactPart, newRepeatingPart]
    }

    public static compare(a: NaryFraction, b: NaryFraction): number {
        if (a.equals(b)) {
            return 0
        }

        if (a.lessThan(b)) {
            return -1
        }

        return 1
    }

    public static equals(a: NaryFraction, b: NaryFraction): boolean {
        return a.equals(b)
    }

    public static lessThan(a: NaryFraction, b: NaryFraction): boolean {
        return a.lessThan(b)
    }

    public static greaterThan(a: NaryFraction, b: NaryFraction): boolean {
        return a.greaterThan(b)
    }

    public static mapForward(fraction: NaryFraction): NaryFraction {
        return fraction.mapForward();
    }

    public static mapBackward(fraction: NaryFraction): NaryFraction[] {
        return fraction.mapBackward();
    }

    public static toNumber(fraction: NaryFraction): number {
        return fraction.toNumber()
    }

    public static toRational(fraction: NaryFraction): [number, number] {
        return fraction.toRational()
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

        const upperBound = 2 * Math.max(approxLen(this), approxLen(other))
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

    public greaterThan(other: NaryFraction) {
        return NaryFraction.compare(this, other) === 1
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

    public mapForward(): NaryFraction {
        return NaryFraction.new(
            this.base,
            this.exactPart.slice(1),
            rotateLeft(this.repeatingPart, this.exactPart.length > 0 ? 0 : 1)
        )
    }

    public mapBackward(): NaryFraction[] {
        const base = this.base
        const exact = this.exactPart
        let result = new Array(base)

        for (let i = 0; i < base; i++) {
            result[i] = NaryFraction.new(
                base,
                [i, ...exact],
                [...this.repeatingPart]
            )
        }
        return result
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

    public toString() {
        const joiner = this.base < 10 ? '' : ','
        return `${this.exactPart.join(joiner)}_${this.repeatingPart.join(joiner)}`
    }

    private repeatingDenominator(): number {
        const result = Math.pow(this.base, this.repeatingPart.length) - 1
        if (result === 0) {
            return 1
        }
        return result
    }

}


const mod = (a: number, b: number): number => ((a % b) + b) % b

/**
 * Finds the shortest-length contiguous subsequence w of 'sequence' such that
 * 'sequence' is some number of concatenations of w.
 * Ex:
 * [1, 1, 1] -> [1]
 * [1, 2, 3, 1, 2, 3] -> [1, 2, 3]
 * [1, 2, 3, 1, 2] -> [1, 2, 3, 1, 2]
 */
export const reduceCircularSequence = <T>(sequence: T[]): T[] => {
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

const isCircularOfWidth = <T>(sequence: T[], width: number): boolean => {
    return range(0, width)
        .every(startIdx => range(startIdx, sequence.length, width)
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
export const findCircularRepeatingSuffix = <T>(sequence: T[], repeating: T[]): number => {
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
const rotateRight = <T>(array: T[], offset: number): T[] => {
    const len = array.length
    const result = new Array<T>(len)

    for (let i = 0; i < len; i++) {
        result[mod(i + offset, len)] = array[i]
    }

    return result
}

const rotateLeft = <T>(array: T[], offset: number): T[] => {
    return rotateRight(array, -1 * offset)
}

const arraysEqual = <T>(a: T[], b: T[]): boolean => {
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

const range = (start: number, end: number, step: number = 1): number[] => {
    const result = []

    for (let num = start; num < end; num += step) {
        result.push(num)
    }

    return result
}


const valueFromDigits = (base: number, digits: number[]): number => {
    let sum = 0
    let place = 1
    for (let idx = digits.length - 1; idx >= 0; idx--) {
        sum += digits[idx] * place
        place *= base
    }

    return sum
}

const incrementDigitSequence = (base: number, digits: number[]): number[] => {
    const copy = [...digits]
    let carry = 1
    let idx = digits.length - 1

    while (idx >= 0 && carry !== 0) {
        copy[idx]++
        carry--
        if (copy[idx] === base) {
            copy[idx] = 0
            carry++
        }
        idx--
    }

    return copy
}

const removeTrailingZeroes = (array: number[]): number[] => {
    let idx = array.length - 1

    while (idx >= 0 && array[idx] === 0) {
        idx--
    }

    return array.slice(0, idx + 1)
}

const greatestCommonDivisor = (b: number, a: number): number => {
    if (a === 0) {
        return b
    }

    return greatestCommonDivisor(a, mod(b, a))
}
