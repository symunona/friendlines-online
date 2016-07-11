define([
    'knockout',
    'lib/user',
    'lib/utils/popup',
    'text!templates/word-cloud.html',
    'json!lib/utils/colors.json',
    'd3',
    'lib/utils/d3.layout.cloud'

], function(ko, user, popup, wordCloudTemplate, colors) {
    var wordCloud = {
        /**
         * Creates a popup and draws a wordcloud
         * of the given messages.          
         */
        openWordCloud: function(messages) {
            var wordList = countWords(messages);
            popup.open({
                threadId: false,
                colors: colors,
                messages: messages,
                words: wordList
            }, wordCloudTemplate);

            createWordCloud(wordList);
        }
    };

    return wordCloud;

    /**
     * Creates an array of word counts for each
     * word in a given message array.
     */

    function countWords(messages) {
        var wordMap = {};
        messages.map(function(message) {
            message.message.split(' ').filter(function(word) {
                /* Filter whitespace */
                return word;
            }).map(function(word) {
                wordMap[word.toLowerCase()] = wordMap[word.toLowerCase()] ? wordMap[word.toLowerCase()] + 1 : 1;
            });
        });
        var wordArray = [];
        Object.keys(wordMap).map(function(word) {
            wordArray.push({
                word: word,
                count: wordMap[word]
            });
        });

        return _.sortBy(wordArray, 'count').reverse();
    }

    function createWordCloud(words) {
        d3.layout.cloud().size([560, 450])
            .words(words)
            .rotate(0)
            .fontSize(function(d) {
                return d.count + 6;
            })
            .on("end", draw)
            .start();

    }

    function draw(words) {
        var color = d3.scale.linear()
            .domain([0, 1, 2, 3, 4, 5, 6, 10, 15, 20, 100])
            .range(["#ddd", "#ccc", "#bbb", "#aaa", "#999", "#888", "#777", "#666", "#555", "#444", "#333", "#222"]);

        d3.select('#wordcloud').append("svg")
            .attr("width", 580)
            .attr("height", 480)
            .attr("class", "wordcloud")
            .append("g")
            // without the transform, words words would get cutoff to the left and top, they would
            // appear outside of the SVG area
            .attr("transform", "translate(320,200)")
            .selectAll("text")
            .data(words)
            .enter().append('g')

        .append("text")
            .style("font-size", function(d) {
                return d.size + "px";
            })
            .style("fill", function(d, i) {
                return color(i);
            })
            .attr('class', 'word')
            .attr("transform", function(d) {
                return "translate(" + [d.x - 40, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) {
                return d.word;
            })
            .attr('title', function(d) {

                return d.count;
            })
            .append("svg:title").text(function(d) {
                return d.count;
            });

    }


});