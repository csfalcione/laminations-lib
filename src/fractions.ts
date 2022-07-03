import { List, Repeat, Range } from 'immutable'
import { Result, Ok, Err } from 'pratica'
import { integer_pow, greatestCommonDivisor, rotateRight, rotateLeft, withCachedToString, unwrap, unwrapErr, id } from './util'


/**
 * A module for manipulating fractions on the interval [0, 1) represented as a sequence of exact
 * digits followed by a sequence of repeating digits.
 * For example:
 * - In base 3 (ternary), 0.1 (one third) would be represented by
 *   `parseUnsafe(3, "1_")`
 * - In base 2 (binary), 0.101101101... (five sevenths) would be represented by
 *   `parseUnsafe(2, "_101")` and 0.1_101101101... (twelve fourteenths)
 *   would be represented by `parseUnsafe(2, "1_101")`
 */

export interface Fraction {
    base: number,
    exactPart: List<number>,
    repeatingPart: List<number>,
}

type Rational = [number, number]

const create = (base: number, exactPart: List<number>, repeatingPart: List<number>): Fraction => {
    let [newExact, newRepeating] = simplify(exactPart, repeatingPart)

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

    return withCachedToString(toString, {
        base,
        exactPart: newExact,
        repeatingPart: newRepeating,
    })
}

const fromArrays = (base: number, exactPart: number[], repeatingPart: number[]): Fraction => create(base, List(exactPart), List(repeatingPart))

const fromArraysFactory = (base: number) => (exactPart: number[], repeatingPart: number[]): Fraction => fromArrays(base, exactPart, repeatingPart)

const simplify = (exactPart: List<number>, repeatingPart: List<number>): [List<number>, List<number>] => {
    repeatingPart = reduceCircularSequence(repeatingPart)
    const repeatingSuffixStart = findCircularRepeatingSuffix(exactPart, repeatingPart)
    const newExactPart = exactPart.slice(0, repeatingSuffixStart)

    const repeatingSuffixLen = exactPart.size - repeatingSuffixStart
    const newRepeatingPart = rotateRight(repeatingPart, repeatingSuffixLen % repeatingPart.size)

    return [newExactPart, newRepeatingPart]
}

const parse = (base: number, text: string): Result<Fraction, string> => {
    let [exactText, repeatingText] = text.split('_')
    if (repeatingText == null) {
        repeatingText = ''
    }

    const digitSplitter = base < 10 ? '' : ','

    const parseDigit = (digit: string) => {
        if (digit.length == 0) { return Err("digits cannot be empty") }
        const int = parseInt(digit)
        if (isNaN(int)) { return Err(`${digit} is not an integer`) }
        return Ok(int)
    };

    const combineParseResults = (results: Result<number, string>[]): Result<number[], string[]> => {
        let errors = results.filter(result => result.isErr())
        if (errors.length > 1) {
            return Err(errors.map(unwrapErr))
        }
        return Ok(results.map(unwrap))
    }

    const exactPart = combineParseResults(exactText.split(digitSplitter)
        .filter(digit => digit.length > 0)
        .map(parseDigit))
    const repeatingPart = combineParseResults(repeatingText.split(digitSplitter)
        .filter(digit => digit.length > 0)
        .map(parseDigit))

    return exactPart.cata({
        Ok: exact => repeatingPart.cata({
            Ok: repeating => Ok(create(base, List(exact), List(repeating))),
            Err: id,
        }),
        Err: exactErrs => repeatingPart.cata({
            Ok: _ => exactErrs,
            Err: repeatingErrs => [...exactErrs, ...repeatingErrs],
        }),
    })
}

const parseFactory = (base: number) => (text: string): Result<Fraction, string> => parse(base, text)

const parseUnsafe = (base: number, text: string): Fraction => {
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

    return create(base, exactPart, repeatingPart)
}

const parseUnsafeFactory = (base: number) => (text: string): Fraction => parseUnsafe(base, text)

const mapForward = (fraction: Fraction): Fraction => create(
    fraction.base,
    fraction.exactPart.slice(1),
    rotateLeft(fraction.repeatingPart, exactLength(fraction) > 0 ? 0 : 1)
)

const mapBackward = (fraction: Fraction): List<Fraction> =>
    Range(0, fraction.base).map(newDigit => create(
        fraction.base,
        fraction.exactPart.unshift(newDigit),
        fraction.repeatingPart
    )).toList()

const compare = (a: Fraction, b: Fraction): number => {
    if (equals(a, b)) {
        return 0
    }

    if (lessThan(a, b)) {
        return -1
    }

    return 1
}

const equals = (a: Fraction, b: Fraction): boolean => {
    if (a.base !== b.base) {
        const [aNum, aDenom] = toRational(a)
        const [bNum, bDenom] = toRational(b)
        return aNum === bNum && aDenom === bDenom
    }

    return a.exactPart.equals(b.exactPart) && a.repeatingPart.equals(b.repeatingPart)
}

const lessThan = (a: Fraction, b: Fraction): boolean => {
    if (a.base !== b.base) {
        return equals(a, b) === false && toNumber(a) < toNumber(b)
    }

    const upperBound = 2 * Math.max(length(a), length(b))
    for (let idx = 0; idx < upperBound; idx++) {
        const thisDigit = digitAt(a, idx)
        const otherDigit = digitAt(b, idx)
        if (thisDigit === otherDigit) {
            continue
        }
        return thisDigit < otherDigit
    }

    return false
}

const greaterThan = (a: Fraction, b: Fraction) => {
    return compare(a, b) === 1
}

const exactLength = (fraction: Fraction): number => fraction.exactPart.size

const repeatingLength = (fraction: Fraction): number => fraction.repeatingPart.size

const length = (fraction: Fraction): number => exactLength(fraction) + repeatingLength(fraction)

const digitAt = (fraction: Fraction, idx: number): number => {
    const exactLen = exactLength(fraction)
    const repeatingLen = repeatingLength(fraction)

    if (idx < exactLen) {
        return fraction.exactPart.get(idx)
    }

    if (repeatingLen === 0) {
        return 0
    }

    return fraction.repeatingPart.get((idx - exactLen) % repeatingLen)
}

const toNumber = (fraction: Fraction): number => {
    return numerator(fraction) / denominator(fraction)
}

const toRational = (fraction: Fraction): Rational => {
    const num = numerator(fraction)
    const denom = denominator(fraction)
    const gcd = greatestCommonDivisor(num, denom) | 0
    return [(num / gcd) | 0, (denom / gcd) | 0]
}


const numerator = (fraction: Fraction): number => {
    const d = fraction.base
    return repeatingDenominator(fraction) * valueFromDigits(d, fraction.exactPart)
        + valueFromDigits(d, fraction.repeatingPart)
}

const denominator = (fraction: Fraction): number => {
    return repeatingDenominator(fraction) * integer_pow(fraction.base, exactLength(fraction))
}

const repeatingDenominator = (fraction: Fraction): number => {
    const result = integer_pow(fraction.base, repeatingLength(fraction)) - 1
    if (result === 0) {
        return 1
    }
    return result
}

const toString = (fraction: Fraction) => {
    const joiner = fraction.base < 10 ? '' : ','
    return `${fraction.exactPart.join(joiner)}_${fraction.repeatingPart.join(joiner)}`
}


/**
 * Finds the shortest-length contiguous subsequence w of 'sequence' such that
 * 'sequence' is some number of concatenations of w.
 * Ex:
 * [1, 1, 1] -> [1]
 * [1, 2, 3, 1, 2, 3] -> [1, 2, 3]
 * [1, 2, 3, 1, 2] -> [1, 2, 3, 1, 2]
 */
const reduceCircularSequence = <T>(sequence: List<T>): List<T> => {
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

const makeKMPFailureTable = <T>(sequence: List<T>): List<number> => {
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
const findNaturalSuffixStart = (sequence: List<number>): number => {
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
const findCircularRepeatingSuffix = <T>(sequence: List<T>, repeating: List<T>): number => {
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


const valueFromDigits = (base: number, digit: List<number>): number => {
    let sum = 0
    let place = 1
    for (let idx = digit.size - 1; idx >= 0; idx--) {
        sum += digit.get(idx) * place
        place *= base
    }

    return sum | 0
}

const incrementDigitSequence = (base: number, digit: List<number>): List<number> => {
    return digit.withMutations(copy => {
        let carry = 1
        let idx = digit.size - 1

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

export const Fractions = {
    create,
    fromArrays,
    fromArraysFactory,
    simplify,
    parse,
    parseFactory,
    parseUnsafe,
    parseUnsafeFactory,
    mapForward,
    mapBackward,
    compare,
    equals,
    lessThan,
    greaterThan,
    digitAt,
    exactLength,
    repeatingLength,
    length,
    toNumber,
    toRational,
    numerator,
    denominator,
    repeatingDenominator,
    toString,
    reduceCircularSequence,
    makeKMPFailureTable,
    findNaturalSuffixStart,
    findCircularRepeatingSuffix,
    valueFromDigits,
    incrementDigitSequence,
    removeTrailingZeroes,
}
