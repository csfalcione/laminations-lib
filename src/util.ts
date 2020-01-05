
export const cache = <T>(func: () => T) => (): T => {
    let result: T = null

    if (result == null) {
        result = func()
    }

    return result
}
