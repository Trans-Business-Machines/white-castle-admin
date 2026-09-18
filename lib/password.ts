/**
 * Generates a temporary password that satisfies `passwordSchema`
 * (upper, lower, digit, special, ≥ 8 chars). Ambiguous glyphs such as
 * `O/0` and `l/1/I` are left out because staff will type it by hand.
 */
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ"
const LOWER = "abcdefghijkmnpqrstuvwxyz"
const DIGITS = "23456789"
const SPECIAL = "!@#$%&*?"
const ALL = UPPER + LOWER + DIGITS + SPECIAL

function pick(chars: string, random: Uint32Array, index: number) {
  return chars[random[index]! % chars.length]!
}

export function generatePassword(length = 12) {
  const size = Math.max(length, 8)
  const random = new Uint32Array(size * 2)
  crypto.getRandomValues(random)

  // Guarantee one of each class, then fill the rest from the full set.
  const chars = [
    pick(UPPER, random, 0),
    pick(LOWER, random, 1),
    pick(DIGITS, random, 2),
    pick(SPECIAL, random, 3),
  ]
  for (let i = chars.length; i < size; i += 1) {
    chars.push(pick(ALL, random, i))
  }

  // Fisher–Yates shuffle so the guaranteed characters aren't always first.
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = random[size + i]! % (i + 1)
    ;[chars[i], chars[j]] = [chars[j]!, chars[i]!]
  }

  return chars.join("")
}
