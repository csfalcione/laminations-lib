
# laminations-lib
A collection of libraries for manipulating mathematical laminations.

## Testing
Run tests with
```
npm run test
```


## `nary.ts`
NaryFraction is a class for representing fractions on the interval [0, 1) as a sequence of exact digits followed by a sequence of repeating digits.

In base 3 (ternary), 0.1 (one third) would be represented by `new NaryFraction(3, [1], [])`.
In base 2 (binary), 0.101101101... (five sevenths) would be represented by `new NaryFraction(2, [], [1,0,1])` and 0.1101101101... (twelve fourteenths) would be represented by `new NaryFraction(2, [1], [1,0,1])`.

### Simplifications
Upon construction, NaryFractions will be simplified according to the following rules.

#### redundant exact suffix
If the suffix of any exact part could be represented by the repeating part, then the exact part will be shortened and repeating part rotated accordingly. For example:
```
([1], [1,0,1]) -> ([], [1,1,0])
([3,0,2], [1,0,2]) -> ([3], [0,2,1])
```

#### over-specified repeating part
If the repeating part of a fraction is itself repeated, then it will be shortend to the smallest-length equivalent. For example:
```
[1,0,1,1,0,1] -> [1,0,1]
[3,3,3] -> [3]
```

#### repeating `d-1` in base `d`
If the repeating part of a fraction in base `d` is `[d-1]`, then the exact part will be appropriately incremented. For example, in base 3:
```
([], [2]) -> ([], []) // one -> zero
([2, 1], [2]) -> ([2, 2], []) // eight-ninths
```

#### trailing zeroes
If there is no repeating part of a fraction, any trailing zeroes of the exact part will be removed. For example:
```
([1,0,0], []) -> ([1], [])
```
Also, any repeating part of only zeroes will be removed. For example:
```
([1], [0]) -> ([1], [])
```

