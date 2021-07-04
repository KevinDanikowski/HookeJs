/* INSTRUCTIONS 
  run `node mytest.js` to log the sources. For other languages, add the enviornmental variable `LANG`, for example:

  `LANG=es node mytest.js`
*/
const hooke = require(".")
const lang = "pt"
// NOTE: ERR_TLS_CERT_ALTNAME_INVALID https://stackoverflow.com/questions/14262986/node-js-hostname-ip-doesnt-match-certificates-altnames
let testParams = {
	language: "english",
	text:
		"Sherlock Holmes (/ˈʃɜːrlɒk ˈhoʊmz/ or /-ˈhoʊlmz/) is a fictional private detective created by British author Sir Arthur Conan Doyle. Referring to himself as a consulting detective in the stories, Holmes is known for his proficiency with observation, deduction, forensic science, and logical reasoning that borders on the fantastic, which he employs when investigating cases for a wide variety of clients, including Scotland Yard. Sherlock Holmes (/ˈʃɜːrlɒk ˈhoʊmz/ or /-ˈhoʊlmz/) is a fictional private detective created by British author Sir Arthur Conan Doyle. Referring to himself as a consulting detective in the stories, Holmes is known for his proficiency with observation, deduction, forensic science, and logical reasoning that borders on the fantastic, which he employs when investigating cases for a wide variety of clients, including Scotland Yard."
}
let expectedMatch = "https://en.wikipedia.org/wiki/Sherlock_Holmes"
if (lang === "es") {
	testParams = {
		language: "spanish",
		text:
			"Sherlock Holmes (pronunciado en inglés /ˈʃɜːlɒk həʊmz/) es un detective privado de ficción creado en 1887 por el escritor británico Sir Arthur Conan Doyle. Es un personaje inglés de finales del siglo XIX que destaca por su inteligencia, su hábil uso de la observación y el razonamiento deductivo para resolver casos difíciles."
	}
	expectedMatch = "https://es.wikipedia.org/wiki/Sherlock_Holmes"
} else if (lang === "pt") {
	testParams = {
		language: "portuguese",
		text: `Sherlock Holmes é um personagem de ficção da literatura britânica criado pelo médico e escritor Sir Arthur Conan Doyle.[1] Holmes é um investigador do final do século XIX e início do século XX. Sua primeira aparição foi em 1887 na revista Beeton's Christmas Annual[2] na história Um Estudo em Vermelho.`
	}
	expectedMatch = "https://pt.wikipedia.org/wiki/Sherlock_Holmes"
}

hooke
	.match(testParams)
	.then((sources) => {
		const hasPlagiarismSource = sources.some(({source}) =>
			source.includes(expectedMatch)
		)
		console.info(
			`Sherlock Holmes Test: ${hasPlagiarismSource ? "PASSED" : "FAILED"}`
		)
		sources.forEach((source) => {
			console.log("link", source.source)
		})
	})
	.catch(console.log)
