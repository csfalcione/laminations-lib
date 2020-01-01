import { Chord } from "./chord"
import { NaryFraction } from "./nary"

describe('Chord', () => {
  const binary = NaryFraction.parseFactory(2)

  const zero = binary("_")
  const oneSeventh = binary("_001")
  const threeFourteenths = binary("0_011")
  const twoSevenths = binary("_010")
  const oneHalf = binary("1_")
  const elevenFourteenths = binary("1_100")
  const sixSevenths = binary("_110")

  const zero_twoSevenths = Chord.new(zero, twoSevenths)
  const zero_oneHalf = Chord.new(zero, oneHalf)
  const oneSeventh_twoSevenths = Chord.new(oneSeventh, twoSevenths)
  const threeFourteenths_oneHalf = Chord.new(threeFourteenths, oneHalf)
  const twoSevenths_elevenFourteenths = Chord.new(twoSevenths, elevenFourteenths)
  const twoSevenths_sixSevenths = Chord.new(twoSevenths, sixSevenths)

  it('determines whether a point is on the boundary of a chord', () => {
    const chord = Chord.new(oneSeventh, twoSevenths)
    expect(chord.onBoundary(threeFourteenths)).toBe(false)
    expect(chord.onBoundary(oneSeventh)).toBe(true)
    expect(chord.onBoundary(twoSevenths)).toBe(true)
  })

  it('determines intersection of chords', () => {
    expect(zero_twoSevenths.intersects(oneSeventh_twoSevenths))
      .toBe(false)
    expect(zero_twoSevenths.intersects(threeFourteenths_oneHalf))
      .toBe(true)
    expect(oneSeventh_twoSevenths.intersects(threeFourteenths_oneHalf))
      .toBe(true)
    expect(threeFourteenths_oneHalf.intersects(twoSevenths_sixSevenths))
      .toBe(true)
    expect(zero_oneHalf.intersects(zero_twoSevenths))
      .toBe(false)
    expect(zero_oneHalf.intersects(zero_oneHalf))
      .toBe(false)
  })

  it('checks whether a point is contained', () => {
    expect(zero_oneHalf.contains(twoSevenths)).toBe(true)
    expect(twoSevenths_sixSevenths.contains(oneHalf)).toBe(false)
    expect(twoSevenths_sixSevenths.contains(zero)).toBe(true)
  })

  it('identifies diameters', () => {
    expect(zero_oneHalf.isDiameter()).toBe(true)
    expect(twoSevenths_elevenFourteenths.isDiameter()).toBe(true)
    expect(twoSevenths_sixSevenths.isDiameter()).toBe(false)
  })

})