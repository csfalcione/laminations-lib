import { Chords } from "./chords"
import { Fractions } from "./fractions"

describe('Chords', () => {
  const binary = Fractions.parseUnsafeFactory(2)

  const zero = binary("_")
  const oneSeventh = binary("_001")
  const threeFourteenths = binary("0_011")
  const twoSevenths = binary("_010")
  const oneHalf = binary("1_")
  const elevenFourteenths = binary("1_100")
  const sixSevenths = binary("_110")

  const zero_twoSevenths = Chords.create(zero, twoSevenths)
  const zero_oneHalf = Chords.create(zero, oneHalf)
  const oneSeventh_twoSevenths = Chords.create(oneSeventh, twoSevenths)
  const threeFourteenths_oneHalf = Chords.create(threeFourteenths, oneHalf)
  const twoSevenths_elevenFourteenths = Chords.create(twoSevenths, elevenFourteenths)
  const twoSevenths_sixSevenths = Chords.create(twoSevenths, sixSevenths)

  it('determines whether a point is on the boundary of a Chords', () => {
    const onBoundary = Chords.onBoundary

    const chord = Chords.create(oneSeventh, twoSevenths)
    expect(onBoundary(chord, threeFourteenths)).toBe(false)
    expect(onBoundary(chord, oneSeventh)).toBe(true)
    expect(onBoundary(chord, twoSevenths)).toBe(true)
  })

  it('determines intersection of Chordss', () => {
    const intersects = Chords.intersects
    expect(intersects(zero_twoSevenths, oneSeventh_twoSevenths))
      .toBe(false)
    expect(intersects(zero_twoSevenths, threeFourteenths_oneHalf))
      .toBe(true)
    expect(intersects(oneSeventh_twoSevenths, threeFourteenths_oneHalf))
      .toBe(true)
    expect(intersects(threeFourteenths_oneHalf, twoSevenths_sixSevenths))
      .toBe(true)
    expect(intersects(zero_oneHalf, zero_twoSevenths))
      .toBe(false)
    expect(intersects(zero_oneHalf, zero_oneHalf))
      .toBe(false)
  })

  it('checks whether a point is contained', () => {
    const contains = Chords.contains

    expect(contains(zero_oneHalf, twoSevenths)).toBe(true)
    expect(contains(twoSevenths_sixSevenths, oneHalf)).toBe(false)
    expect(contains(twoSevenths_sixSevenths, zero)).toBe(true)
  })

  it('identifies diameters', () => {
    const isDiameter = Chords.isDiameter

    expect(isDiameter(zero_oneHalf)).toBe(true)
    expect(isDiameter(twoSevenths_elevenFourteenths)).toBe(true)
    expect(isDiameter(twoSevenths_sixSevenths)).toBe(false)
  })

})