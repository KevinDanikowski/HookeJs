//// Comparison section

var snowball = require('node-snowball');

function findSpaces(text) {
    /**
     * Takes a string as input, outputs indices of spaces in the string. Also, replaces all whitespace characters with spaces
     * and adds spaces at the beggining and start so it can be separated more easily in the getWords function
     * 
     * In: "Hello, my name is"
     * 
     * Out: [-1, 6, 9, 14, 17]
     */
    text = text.replace("\n", " ").replace("\t", " ").replace("\r", " ").replace(".", " ")
    var spaceIndices = [];
    var len = text.length;
    for (var i = 0; i < len; i++){
        if(text.charAt(i) == " "){
            spaceIndices.push(i);
        }
    }
    spaceIndices.unshift(-1);
    spaceIndices.push(text.length);
    return spaceIndices
};

function getWords(text, spaceIndices) {
    /**
     * Takes text and the output of the findSpaces function as inputs,
     * outputs list of words and list of their indices in the original string in formant [start, end]
     * 
     * In: "Hello, my name is", [-1, 6, 9, 14, 17]
     * 
     * Out: [   [ 'Hello,', 'my', 'name', 'is' ] ,
     * [[ 0, 6 ], [ 7, 9 ], [ 10, 14 ], [ 15, 17 ]]   ]
     */
    var words = [];
    var indicesList = [];
    var len = spaceIndices.length - 1; //One is substracted because the for loop uses two elements
    for (var i = 0; i < len; i++) {
        if (spaceIndices[i + 1] - spaceIndices[i] > 1) {    //Doesn't count two spaces in a row
            var wordStart = spaceIndices[i] + 1, wordEnd = spaceIndices[i+1];
            words.push(text.slice(wordStart, wordEnd));
            indicesList.push([wordStart, wordEnd]);
        };
    };
    return [words, indicesList]
};

function normalizeAndremoveStopWords(words, indicesList, language = "english"){
    /**
     * Leaves only allowed characters on each word and lowers it, and then removes the stopwords (from stopwords.json)
     * 
     * In: [ 'Hello,', 'my', 'name', 'is', 'jazz' ] ,  [[ 0, 6 ], [ 7, 9 ], [ 10, 14 ], [ 15, 17 ], [20,25]]
     * 
     * Out: [ [ 'jazz' ], [ [ 20, 25 ] ] ]
     * (only jazz is not a stopword)
     */
    var json = require('./stopwords.json');
    var stopwords = json[language];
    var regex = RegExp(json[language+"regex"][0], json[language+"regex"][1]); //All not allowed characters
    var newWords = [];
    var newIndicesList = [];
    var len = words.length;
    for (var i = 0; i < len; i++){
        words[i] = words[i].toLowerCase().replace(regex, "");
        if (!stopwords.includes(words[i])){
            newWords.push(words[i]);
            newIndicesList.push(indicesList[i]);
        };
    };
    return [newWords, newIndicesList]
};

function shingleAndStemmer(words, indicesList, shingleSize = 1, language = "english"){
    /**
     * Stems the words (turns to root form) and optionally shingles them
     * 
     * Read more:
     * https://en.wikipedia.org/wiki/Stemming
     * https://en.wikipedia.org/wiki/W-shingling
     * 
     * In: ["like", "jazz", "my", "jazzy", "feeling"] , [[1,2], [3,4], [5,6], [7,8], [9,10]] , 2 , "english"
     * 
     * Out: [ [  [ 'like', 'jazz' ],[ 'jazz', 'my' ],[ 'my', 'jazzi' ],[ 'jazzi', 'feel' ] ],
     * [ [ 1, 4 ], [ 3, 6 ], [ 5, 8 ], [ 7, 10 ] ]]
     */
    var words = snowball.stemword(words, language);
    var shingles = [];
    var shingledIndicesList = [];
    var len = words.length - shingleSize + 1;
    for(var i = 0; i < len; i++){
        shingles.push(words.slice(i, i+shingleSize));
        shingledIndicesList.push([ indicesList[i][0] , indicesList[i + shingleSize - 1][1] ])
    };
    return [shingles, shingledIndicesList]
};

function union(array1, array2){
    /**
     * Auxiliary function which unites two arrays, skipping duplicates
     * In: [1,2,4,5,7] , [3,4,5,6,7,8]
     * Out: [1,2,4,5,7,3,6,8]
     */
    var len = array2.length
    for(var i = 0; i < len; i++){
        if(!array1.includes(array2[i])){
            array1.push(array2[i])
        };
    };
    return array1
};

function arraysEqual(array1, array2){
    /**
     * Auxiliary function which checks if the elements of both arrays are equal. If they are not arrays just checks if they are equal
     * 
     * In: [1,2,3,4], [2,4,3,1]
     * Out: false
     * 
     * In: [1,2,3,4], [1,2,3,4]
     * Out: true
     * 
     * In: [[1]], [[1]]
     * Out: false // because they are different entities and this function isn't recursive
     * 
     * In: 4,
     */
    if(array1 == array2){
        return true
    }
    if(array1.length != array2.length){
        return false
    };
    var len = array1.length;
    for(var i = 0; i < len; i++){
        if(array1[i] != array2[i]){
            return false
        };
    };
    return true;
};

function findUnionAndCluster(shingles1, shingles2, maximumGap = 3, minimumClusterSize = 1, returnMatches = false){
    /**
     * Finds the points matching in both shingle sets, then finds the clusters in which they are close togather (a match)
     * 
     * In: [["a"],["b"],["c"],["d"]], [["x"],["c"],["d"],["y"]], 2, 1
     * Out: [ [ [ 2, 1 ], [ 3, 2 ] ] ]    //Meaning there was one cluster, consisting of the indices 2 and 3 ("b" and "c") of the first array, and
     *                                    //indices 1 and 2 of the second array (also "b" and "c")
     * 
     * The returnMatches argument return the matches without any cluster done to them
     */
    var matches = [];
    var len1 = shingles1.length;
    var len2 = shingles2.length;
    for(var i = 0; i < len1; i++){
        for(var j = 0; j < len2; j++){
            if(arraysEqual(shingles1[i], shingles2[j])){
                matches.push([i,j])
            };
        };
    };
    matches = [[0,0],[2,2],[1,1]];
    //clustering
    var clusters = [];
    var len = matches.length;
    for(var i = 0; i < len; i++){    // For every matching point
        var inCluster = null;           // By default it is not in any cluster (It is null instead of false because false = 0 and 0 is a possible index)
        var clustersLen = clusters.length;
        for(var j = 0; j < clustersLen; j++){ // For each existing cluster
            var currentClusterLen = clusters[j].length;
            for(var k = 0; k < currentClusterLen; k++){ // For each point in that cluster
                if (Math.max( Math.abs(matches[i][0] - clusters[j][k][0]), Math.abs(matches[i][1] - clusters[j][k][1]) ) <= maximumGap){
                // if Chebyshev distance is small enough to be in the same cluster https://en.wikipedia.org/wiki/Chebyshev_distance
                    if (inCluster == null){          // if it isn't in any cluster
                        clusters[j].push(matches[i]);      // Add it to the cluster
                        inCluster = j                      // Mark that it is in that cluster
                    } else if (inCluster != j){        // if it already is in a cluster and that cluster isn't the on it's in
                        clusters[inCluster] = union(clusters[inCluster], clusters[j]) // Make the cluster its in the union between both
                        clusters[j] = []                //Empty the other one (This with the last line merges both clusters)
                    };
                };
            };
        };
        if (inCluster == null){      // If after checking in al clusters it isn't in one
            clusters.push([matches[i]]) // Create a cluster with just itself
        }
    };
    //Removing all clusters smaller than the minimum distance
    var newClusters = [];
    var len = clusters.length;
    for (var i = 0; i < len; i++){
        if (clusters[i].length >= minimumClusterSize){
            newClusters.push(clusters[i])
        };
    };
    if(returnMatches){
        return [newClusters, matches]
    }
    return newClusters
};

function findClusterStartAndEnd(cluster){
    /**
     * Gets the beggining and end of both sources of a cluster in format [[startSource1, endSource1],[startSource2, endSource2]]
     * In: [[3,5],[4,5],[2,7]]
     * Out: [ [ 2, 4 ], [ 5, 7 ] ]
     */
    var len = cluster.length;
    var startSource1, endSource1, startSource2, endSource2;
    startSource1 = endSource1 = cluster[0][0];
    startSource2 = endSource2 = cluster[0][1];
    for(var i = 1; i < len; i++){
        if(cluster[i][0] < startSource1){
            startSource1 = cluster[i][0]
        }else if(cluster[i][0] > endSource1){
            endSource1 = cluster[i][0]
        };
        if(cluster[i][1] < startSource2){
            startSource2 = cluster[i][1]
        }else if(cluster[i][1] > endSource2){
            endSource2 = cluster[i][1]
        };
    };
    return [[startSource1, endSource1],[startSource2, endSource2]]
};

function findClusterStartAndEndRelativeToOriginalText(start, end, shingledIndicesList){
    /**
     * Returns the indices of mathes based on the original text.
     * In: 0,2, [[1,4],[5,7],[8,9],[12,15]]
     * Out: [1, 9]
     */
    return [shingledIndicesList[start][0], shingledIndicesList[end][1]]
};

//// Search section
const {google} = require('googleapis');
const customsearch = google.customsearch('v1');
const axios = require("axios");

function html2text(htmlCode){
    /**
     * Auxiliary function to convert html to plain text
     * 
     * Modified from EpokK @ https://stackoverflow.com/questions/15180173/convert-html-to-plain-text-in-js-without-browser-environment/15180206
     * 
     * In: "<html><head><title>Example Domain</title>..."
     * 
     * Out: 
     *Example Domain
     *
     *Example Domain
     *This domain is for use in illustrative examples in documents. You may use this
     *domain in literature without prior coordination or asking for permission.
     *
     *More information...
     */
    htmlCode = String(htmlCode)
    htmlCode = htmlCode.replace(/<style([\s\S]*?)<\/style>/gi, '');
    htmlCode = htmlCode.replace(/<script([\s\S]*?)<\/script>/gi, '');
    htmlCode = htmlCode.replace(/<[^>]+>/ig, ' ');
    return htmlCode
}

async function search(words, apikey=process.argv[2], engineid=process.argv[3]){
    /**
     * Splits input words into 32 word chunks and searches the with the google search api.
     * 
     * In: "Do I understand it correctly that anotherCall() will be called only when someCall() is completed? What is the most elegant way of calling them in parallel?".split(" ")
     * Out: [ ['https://stackoverflow.com/q/46466306', ... ], ['javascript - Call async/await functions in parallel - Stack Overflow', ... ]  ]
     */
    const limit = 32; //32 word limit on google search
    var searchQueries = [];
    var len = Math.ceil(words.length/limit);
    for(var i = 0; i < len; i++){
        searchQueries.push( words.slice(i*limit, (i+1)*limit).join(" ") )
    };
    var searches = [];
    for(var i = 0; i < searchQueries.length; i++){
        searches.push(customsearch.cse.list({cx: engineid, q: searchQueries[i], auth: apikey}).catch(function(){}))
    };
    results = await Promise.all(searches);
    var urls = [];
    var titles = [];
    for(var i = 0; i < results.length; i++){
        if(results[i].data.items != undefined){
            for (var j = 0; j < results[i].data.items.length; j++){
                if(!urls.includes(results[i].data.items[j].link)){
                    urls.push(results[i].data.items[j].link)
                    titles.push(results[i].data.items[j].title)
                };
            };
        };
    };
    return [urls, titles]
}

async function downloadWebsites(urls, justText = true){
    /**
     * Downloads text of the urls given, or returns html if justText is false.
     * 
     * In: ["http://example.com/", ...]
     * Out: ["Example Domain\n ...", ...]
     */
    var requests = [];
    for(var i = 0; i < urls.length; i++){
        requests.push(axios.get(urls[i]).catch(function(){}))
    };
    var responses = await Promise.all(requests);
    var htmls = [];

    for(var i = 0; i < responses.length; i++){
        if(responses[i] != undefined){
            htmls.push(responses[i].data)
        }else{
            htmls.push("")
        };
    };
    if(!justText){
        return htmls
    };
    var texts = []
    for(var i = 0; i < htmls.length; i++){
        texts.push(html2text(htmls[i]))
    };
    return texts
}

//// Use section

async function autoCitation(inputText, language="english", shingleSize = 2, apikey=process.argv[2], engineid=process.argv[3]){
    var [inputWords, inputIndicesList] = getWords(inputText, findSpaces(inputText));
    [inputWords, inputIndicesList] = normalizeAndremoveStopWords(inputWords, inputIndicesList, language="english");
    [inputShingles, inputShingledIndicesList] = shingleAndStemmer(inputWords, inputIndicesList, shingleSize, language);
    [comparedUrls, comparedTitles] = await search(inputWords, apikey, engineid).catch(function(){});
    var comparedTexts = await downloadWebsites(comparedUrls, true).catch(function(){});
    var comparedWords = comparedIndicesList = comparedShingles = comparedShingledIndicesList = [];
    for(var i = 0; i < comparedTexts.length; i++){
        [comparedWordsTemp, comparedIndicesListTemp] = getWords(comparedTexts[i], findSpaces(comparedTexts[i]));
        [comparedWordsTemp, comparedIndicesListTemp] = normalizeAndremoveStopWords(comparedWordsTemp, comparedIndicesListTemp, language);
        [comparedShinglesTemp, comparedShingledIndicesListTemp] = shingleAndStemmer(comparedWordsTemp, comparedIndicesListTemp, shingleSize, language)
    }
}

autoCitation("Example Domain This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission. More information...")