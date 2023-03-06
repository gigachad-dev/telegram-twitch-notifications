interface ParseMatch {
  command: string | undefined
  matches: string[]
}

export function parseMatch(match: string): ParseMatch {
  const matches = match.split(' ').filter(Boolean)
  const command = matches.shift()

  return {
    command,
    matches
  }
}
