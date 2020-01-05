import { List, Repeat } from 'immutable'
import { cache } from './util'

/**
 * A class for fractions on the interval [0, 1) represented as a sequence of exact
 * digits followed by a sequence of repeating digits.
 * For example:
 * - In base 3 (ternary), 0.1 (one third) would be represented by
 *   `NaryFraction.parse(3, "1_")`
 * - In base 2 (binary), 0.101101101... (five sevenths) would be represented by
 *   `NaryFraction.parse(2, "_101")` and 0.1_101101101... (twelve fourteenths)
 *   would be represented by `NaryFraction.parse(2, "1_101")`
 */
export class NaryFraction {

    constructor(
        base: number,
        exactPart: List<number>,
        repeatingPart: List<number>
    ) {
        let [newExact, newRepeating] = NaryFraction.simplify(exactPart, repeatingPart)

        if (newRepeating.size === 1 && newRepeating.first() === base - 1) {
            newRepeating = List()
            newExact = incrementDigitSequence(base, newExact)
        }

        if (newRepeating.size === 1 && newRepeating.first() === 0) {
            newRepeating = List()
        }

        if (newRepeating.size === 0) {
            newExact = removeTrailingZeroes(newExact)
        }

        this.base = base
        this.exactPart = newExact
        this.repeatingPart = newRepeating
    }

    public base: number
    public exactPart: List<number>
    public repeatingPart: List<number>

    public static new(
        base: number,
        exactPart: List<number>,
        repeatingPart: List<number>): NaryFraction {
        return new NaryFraction(base, exactPart, repeatingPart)
    }

    public static factory(base: number) {
        return (exactPart: number[], repeatingPart: number[]): NaryFraction => {
            return new NaryFraction(base, List(exactPart), List(repeatingPart))
        }
    }

    public static parse(base: number, text: string): NaryFraction {
        let [exactText, repeatingText] = text.split('_')
        if (repeatingText == null) {
            repeatingText = ''
        }

        const digitSplitter = base < 10 ? '' : ','

        const exactPart = List(exactText.split(digitSplitter))
            .filter(str => str.length > 0)
            .map(x => parseInt(x))
        const repeatingPart = List(repeatingText.split(digitSplitter))
            .filter(str => str.length > 0)
            .map(x => parseInt(x))

        return new NaryFraction(base, exactPart, repeatingPart)
    }

    public static parseFactory(base: number) {
        return (text: string): NaryFraction => NaryFraction.parse(base, text)
    }

    public static simplify(exactPart: List<number>, repeatingPart: List<number>): [List<number>, List<number>] {
        repeatingPart = reduceCircularSequence(repeatingPart)
        const repeatingSuffixStart = findCircularRepeatingSuffix(exactPart, repeatingPart)
        const newExactPart = exactPart.slice(0, repeatingSuffixStart)

        const repeatingSuffixLen = exactPart.size - repeatingSuffixStart
        const newRepeatingPart = rotateRight(repeatingPart, repeatingSuffixLen % repeatingPart.size)

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

        return this.exactPart.equals(other.exactPart) && this.repeatingPart.equals(other.repeatingPart)
    }

    public lessThan(other: NaryFraction): boolean {
        if (this.base !== other.base) {
            return this.equals(other) === false && this.toNumber() < other.toNumber()
        }
        const approxLen = (frac: NaryFraction) => frac.exactPart.size + frac.repeatingPart.size

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
        const exactLen = this.exactPart.size
        const repeatingLen = this.repeatingPart.size

        if (idx < exactLen) {
            return this.exactPart.get(idx)
        }

        if (repeatingLen === 0) {
            return 0
        }

        return this.repeatingPart.get((idx - exactLen) % repeatingLen)
    }

    public mapForward(): NaryFraction {
        return NaryFraction.new(
            this.base,
            this.exactPart.slice(1),
            rotateLeft(this.repeatingPart, this.exactPart.size > 0 ? 0 : 1)
        )
    }

    public mapBackward(): NaryFraction[] {
        const base = this.base
        const exact = this.exactPart
        let result = new Array(base)

        for (let i = 0; i < base; i++) {
            result[i] = NaryFraction.new(
                base,
                exact.unshift(i),
                this.repeatingPart
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
        const gcd = greatestCommonDivisor(num, denom) | 0
        return [(num / gcd) | 0, (denom / gcd) |  0]
    }


    public numerator: () => number = cache(() => {
        const d = this.base
        return this.repeatingDenominator() * valueFromDigits(d, this.exactPart)
            + valueFromDigits(d, this.repeatingPart)
    })

    public denominator: () => number  = cache(() => {
        return this.repeatingDenominator() * integer_pow(this.base, this.exactPart.size)
    })

    public toString: () => String = cache(() => {
        const joiner = this.base < 10 ? '' : ','
        return `${this.exactPart.join(joiner)}_${this.repeatingPart.join(joiner)}`
    })

    private repeatingDenominator(): number {
        const result = integer_pow(this.base, this.repeatingPart.size) - 1
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
export const reduceCircularSequence = <T>(sequence: List<T>): List<T> => {
    if (sequence.size === 0) {
        return sequence
    }

    let prefix_table = makeKMPFailureTable(List(sequence))
    let candidate_length = findNaturalSuffixStart(prefix_table) // exclusive

    if (sequence.size % candidate_length === 0) {
        return sequence.slice(0, candidate_length)
    }

    return sequence
}

export const makeKMPFailureTable = <T>(sequence: List<T>): List<number> => {
    // This is the failure function from the KMP algorithm.
    // table[i] is the length of the longest proper prefix of
    // sequence that is also a suffix of needle (up to i).

    return Repeat(0, sequence.size).toList().withMutations(table => {
        let prefixEnd = 0 // exclusive
        let cursor = 1
        // Key observation: a prefix/suffix match at i, j and a character
        // match at i+1, j+1 implies a prefix/suffix match at i+1/j+1.

        while (cursor < sequence.size) {
            const item = sequence.get(cursor)
            if (item == sequence.get(prefixEnd)) {
                // The order here matters. It could be written as
                // table[cursor++] = ++prefix_end, 
                // if one is spiteful of future readers.
                prefixEnd++
                table.set(cursor, prefixEnd)
                cursor++
                continue
            }
            if (prefixEnd === 0) {
                table.set(cursor, 0)
                cursor++
                continue
            }
            // 'Recursive' step: retry against the longest prefix/suffix
            // of the current prefix. Recall that the prefix described by
            // `prefix_end` is exclusive, so the last index of the prefix
            // is at (prefix_end - 1).
            prefixEnd = table.get(prefixEnd - 1)
        }
    })
}

// Finds the first index of a partial sequence of natural numbers.
// Ex: [1, 0, 1, 1, 2, 3, 4, 5] -> 3
// Ex: [1, 0, 1, 1] -> 3
// Ex: [1, 0, 1] -> 2
// Ex: [0, 2, 3, 2] -> 4
// Ex: [] -> 0
export const findNaturalSuffixStart = (sequence: List<number>): number => {
    if (sequence.size === 0) {
        return 0
    }
    const lastIndex = sequence.size - 1
    const last = sequence.get(lastIndex)

    if (last <= 0) {
        return sequence.size
    }

    for (let i = lastIndex; i > lastIndex - last; i--) {
        const target = last - (lastIndex - i)
        if (sequence.get(i) !== target) {
            break
        }
        if (target === 1) {
            return i
        }
    }

    return sequence.size
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
export const findCircularRepeatingSuffix = <T>(sequence: List<T>, repeating: List<T>): number => {
    const indexSequenceFromRight = idx => sequence.size - idx - 1
    const indexRepeatingFromRight = idx => repeating.size - (idx % repeating.size) - 1

    for (let cursor = 0; cursor < sequence.size; cursor++) {
        const sequenceIdx = indexSequenceFromRight(cursor)
        const repeatingIdx = indexRepeatingFromRight(cursor)
        if (sequence.get(sequenceIdx) !== repeating.get(repeatingIdx)) {
            return sequenceIdx + 1
        }
    }

    return 0
}

// ex: ([1,2,3], 1) -> [3,1,2]
const rotateRight = <T>(list: List<T>, offset: number): List<T> => {
    const len = list.size
    if (mod(offset, len) === 0) {
        return list
    }
    if (offset === 1) {
        return list.withMutations(copy => {
            const last = copy.last<T>()
            if (last == null) return
            copy.pop().unshift(last)
        })
    }

    return List<T>().setSize(len).withMutations(result => {
        for (let idx = 0; idx < len; idx++) {
            result.set(mod(idx + offset, len), list.get(idx))
        }
    })
}

const rotateLeft = <T>(list: List<T>, offset: number): List<T> => {
    if (offset === 1) {
        return list.withMutations(copy => {
            const first = copy.first<T>()
            if (first == null) return
            copy.shift().push(first)
        })
    }
    return rotateRight(list, -1 * offset)
}


const valueFromDigits = (base: number, digits: List<number>): number => {
    let sum = 0
    let place = 1
    for (let idx = digits.size - 1; idx >= 0; idx--) {
        sum += digits.get(idx) * place
        place *= base
    }

    return sum | 0
}

const incrementDigitSequence = (base: number, digits: List<number>): List<number> => {
    return digits.withMutations(copy => {
        let carry = 1
        let idx = digits.size - 1

        while (idx >= 0 && carry !== 0) {
            copy.update(idx, x => x + 1)
            carry--
            if (copy.get(idx) === base) {
                copy.set(idx, 0)
                carry++
            }
            idx--
        }
    })
}

const removeTrailingZeroes = (numbers: List<number>): List<number> => {
    let idx = numbers.size - 1

    while (idx >= 0 && numbers.get(idx) === 0) {
        idx--
    }

    return numbers.slice(0, idx + 1)
}

const greatestCommonDivisor = (b: number, a: number): number => {
    if (a === 0) {
        return b
    }

    return greatestCommonDivisor(a, mod(b, a))
}

const integer_pow = (base: number, exponent: number): number => {
    let result = 1
    if (exponent === 0) {
        return result
    }

    let exp = exponent
    let pow_i = base

    while (exp > 0) {
        if ((exp & 1) !== 0) {
            result *= pow_i
        }
        pow_i *= pow_i
        exp >>= 1
    }

    return result | 0
}
