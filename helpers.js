const matchPostProcess = (rawText) => {
  let text = rawText
  text.replace(/\s+/g, ' ')
  text.replace(/ ./g, '.')
  return text
}

const formatSourceOutput = (source) => {
  const { source: sourceLink, matches, text, title } = source
  const formattedMatches = []
  matches.forEach(
    ({
      cluster,
      source: sourceLink,
      sourceTitle,
      inputShingleEnd,
      inputShingleStart,
      comparedShingleEnd,
      comparedShingleStart,
      inputStart,
      inputEnd,
      comparedStart,
      comparedEnd,
      score,
    }) => {
      formattedMatches.push({
        inputStart,
        inputEnd,
        matchText: matchPostProcess(text.substring(comparedStart, comparedEnd)),
        score,
      })
    }
  )

  return {
    source: sourceLink,
    title,
    matches: formattedMatches,
  }
}

const formatResultsOutput = (inputText, sources) => {
  const usefulSources = sources.filter(({ matches }) => Array.isArray(matches) && matches.length > 0)
  return {
    inputText,
    sources: usefulSources.map(formatSourceOutput),
  }
}

module.exports = {
  matchPostProcess,
  formatResultsOutput,
}
