export function buildCandidatePaths(
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  baseTokens: `0x${string}`[],
) {
  const paths = [
    [tokenIn, tokenOut],
    ...baseTokens
      .filter((base) => base !== tokenIn && base !== tokenOut)
      .map((base) => [tokenIn, base, tokenOut]),
  ]

  const seen = new Set<string>()

  return paths.filter((path) => {
    const key = path.join("-").toLowerCase()

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}
