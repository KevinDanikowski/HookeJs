const hooke = require(".")

// NOTE: ERR_TLS_CERT_ALTNAME_INVALID https://stackoverflow.com/questions/14262986/node-js-hostname-ip-doesnt-match-certificates-altnames
hooke
	.match({
		text:
			"Sherlock Holmes (/ˈʃɜːrlɒk ˈhoʊmz/ or /-ˈhoʊlmz/) is a fictional private detective created by British author Sir Arthur Conan Doyle. Referring to himself as a consulting detective in the stories, Holmes is known for his proficiency with observation, deduction, forensic science, and logical reasoning that borders on the fantastic, which he employs when investigating cases for a wide variety of clients, including Scotland Yard. Sherlock Holmes (/ˈʃɜːrlɒk ˈhoʊmz/ or /-ˈhoʊlmz/) is a fictional private detective created by British author Sir Arthur Conan Doyle. Referring to himself as a consulting detective in the stories, Holmes is known for his proficiency with observation, deduction, forensic science, and logical reasoning that borders on the fantastic, which he employs when investigating cases for a wide variety of clients, including Scotland Yard."
	})
	.then((sources) => {
		sources.forEach((source) => {
			console.log("link", source.source)
		})
	})
	.catch(console.log)
