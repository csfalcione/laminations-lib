import { List } from 'immutable'
import { Result, Ok, Err } from 'pratica'


export const id = x => x;

export const cache = <T>(func: () => T) => (): T => {
    let result: T = null

    if (result == null) {
        result = func()
    }

    return result
}

export const withCachedToString = <T>(toString: (T) => string, item: T): T => {
    return { ...item, toString: cache(() => toString(item)) } as T
}

// ex: ([1,2,3], 1) -> [3,1,2]
export const rotateRight = <T>(list: List<T>, offset: number): List<T> => {
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

export const rotateLeft = <T>(list: List<T>, offset: number): List<T> => {
    if (offset === 1) {
        return list.withMutations(copy => {
            const first = copy.first<T>()
            if (first == null) return
            copy.shift().push(first)
        })
    }
    return rotateRight(list, -1 * offset)
}

export const mod = (a: number, b: number): number => ((a % b) + b) % b

export const greatestCommonDivisor = (b: number, a: number): number => {
    if (a === 0) {
        return b
    }

    return greatestCommonDivisor(a, mod(b, a))
}

export const integer_pow = (base: number, exponent: number): number => {
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


export const xor = (a: boolean, b: boolean): boolean => a ? !b : b

export const implies = (a: boolean, b: boolean): boolean => !a || b

export const unwrap = <T, E>(result: Result<T, E>): T => {
    return result.cata({
        Ok: id,
        Err: () => { throw new Error(`Cannot unwrap an Err: ${result.inspect()}`) },
    })
}

export const unwrapErr = <T, E>(result: Result<T, E>): E => {
    return result.cata({
        Ok: () => { throw new Error(`Cannot unwrapErr an Ok: ${result.inspect()}`) },
        Err: id,
    })
}
