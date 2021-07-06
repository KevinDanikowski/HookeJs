/* INSTRUCTIONS 
  run `node mytest.js` to log the sources. For other languages, add the enviornmental variable `LANG`, for example:

  `LANG=es node mytest.js`
*/
const hooke = require('.')
const testCases = require('./data/plagiarism-test-cases.json')
const defaultTest = testCases.english[0] // simple test for reference
const lang = 'portuguese'
const test = testCases[lang][0]
const testParams = { language: lang, text: test.text }
let expectedMatch = test.source

// NOTE: ERR_TLS_CERT_ALTNAME_INVALID https://stackoverflow.com/questions/14262986/node-js-hostname-ip-doesnt-match-certificates-altnames

hooke
  .match(testParams)
  .then((sources) => {
    const hasPlagiarismSource = sources.some(({ source }) => source.includes(expectedMatch))
    console.info(`Sherlock Holmes Test: ${hasPlagiarismSource ? 'PASSED' : 'FAILED'}`)
    sources.forEach((source) => {
      console.log('link', source.source)
    })
  })
  .catch(console.log)
