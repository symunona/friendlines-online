(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports', 'json!lib/analyze/emotions.json'], factory);
    } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        // CommonJS
        factory(exports, require('q', 'emotions.json'));
    } else {
        // Browser globals
        factory((root.commonJsStrict = {}), root.b);
    }
}(this, function(exports, emotions) {


    // var emotions = require('./emotions.json');


    for (var emotion in emotions) {
        switch (emotion) {
            case 'happy':
            case 'sad':
                emotions[emotion] = emotions[emotion].split('  ');
                break;
            default:
                emotions[emotion] = emotions[emotion].split(' ');
        }
    }

    /**
     * Analyzes the input data, finding and merging 
     * main usernames, removing group messages,
     * and adding message mood data.
     * 
     */
    exports.analyze = function(jsonRaw) {
        var userNames = exports.getUserNamesFromMessages(jsonRaw);

        jsonRaw.parsingMetaData.mainUserNames = userNames;
        // console.log('Found user names: ');
        // console.log(userNames);

        // console.log('Merging usernames in messages');
        exports.mergeMainUser(jsonRaw, userNames);

        // console.log('Eliminating not interesting group messages. (the ones not addressed and not sent by the analyzed user)');
        exports.removeGroupMessages(jsonRaw);

        // console.log('Analyzing message emoticons');
        exports.emotions(jsonRaw);
        return jsonRaw;
    };



    /** 
     * Extends messageData with the emoticon counts
     * of each emotion.  
     */
    exports.emotions = function(messageData) {

        for (var i = 0; i < messageData.messages.length; i++) {
            var message = messageData.messages[i];
            for (var emotion in emotions) {

                var emoticons = emotions[emotion];
                for (var emoticonIndex = 0; emoticonIndex < emoticons.length; emoticonIndex++) {
                    if (message.message.indexOf(emoticons[emoticonIndex]) > -1) {

                        /* Only add key, if emotion found to reduce JSON size */
                        if (!message[emotion]) message[emotion] = 0;
                        message[emotion]++;
                    }
                }
            }
        }
    };

    /** 
     * Extract year, month and day fields, to be more easily accessible
     * at conversion.  
     */
    // exports.extractDates = function(messageData) {

    //     for (var i = 0; i < messageData.messages.length; i++) {
    //         var message = messageData.messages[i];
    //         message.year = moment(message.sendDate, 'year');
    //         message.month = moment(message.sendDate, 'month');
    //         message.day = moment(message.sendDate, 'day');
    //     }
    // };


    /**
     * Replaces the user ID's in messages using
     * the names of the main user.
     * If the user changed his/her name in time
     * the parser created a different username for each name
     * with a different ID. Here we merge the ones to the 
     * first found userId, leaving the name.
     */
    exports.mergeMainUser = function(messageData, mainUserNames) {
        console.log('Merge main user: ', mainUserNames);
        var firstUserId = messageData.parsingMetaData.userMap[mainUserNames[0]];
        messageData.parsingMetaData.mainUserId = firstUserId;

        /* We have the names, look up the IDs for them. */
        var userIdsToMerge = [];
        for (var userIndex = 1; userIndex < mainUserNames.length; userIndex++) {
            userIdsToMerge.push(messageData.parsingMetaData.userMap[mainUserNames[userIndex]]);
        }
        messageData.parsingMetaData.mainUserIds = userIdsToMerge;
        /* Finally, replace all the message fromUserId and toUserId of the new 
            unified ID: the firstUserId */
        for (var messageIndex = 0; messageIndex < messageData.messages.length; messageIndex++) {
            var message = messageData.messages[messageIndex];
            for (var i = 0; i < userIdsToMerge.length; i++) {
                var userIdToReplace = userIdsToMerge[i];
                if (message.fromUserId == userIdToReplace) {
                    message.fromUserId = firstUserId;
                }
                if (message.toUserId == userIdToReplace) {
                    message.toUserId = firstUserId;
                }
            }
        }
    };

    /**
     * Removes the messages not transferred between the main user
     * and someone else, to reduce size.
     */
    exports.removeGroupMessages = function(messageData) {
        var mainUserId = messageData.parsingMetaData.mainUserId;
        var filteredMessages = [];
        for (var messageIndex = 0; messageIndex < messageData.messages.length; messageIndex++) {
            var message = messageData.messages[messageIndex];
            if (message.fromUserId == mainUserId ||
                message.toUserId == mainUserId) {
                message.isInbound = (message.toUserId == mainUserId);
                message.userId = message.isInbound ? message.fromUserId : message.toUserId;
                filteredMessages.push(message);
            }
        }
        messageData.messages = filteredMessages;
    };

    /** 
     * Gets the main username by guessing.
     * @returns {string} the usernames of the main user 
     * */
    exports.getUserNamesFromMessages = function(messageData) {
        var threadsWithTwoRecipiants = [];
        var threadRecepiants = messageData.parsingMetaData.threadRecipiants;
        var oneMustBeAUser = {};
        var userNames = [];
        var userNameMap = {};
        /* 
        We are taking the one on one conversations
        and assume, one of the recipiant has to be the user.
        We counted the occurrences in the recipiants in 
        parsingMetaData.userCounts
        of each thread. Every time two name arises we take 
        the one which had more messages.
        */
        for (var threadKey in threadRecepiants) {

            /* The list contains the  */
            var threadPeople = threadRecepiants[threadKey];
            if (threadPeople.length == 2) {

                var whichUserIsMoreLikelyToBe =
                    messageData.parsingMetaData.userCounts[threadPeople[0]] >
                    messageData.parsingMetaData.userCounts[threadPeople[1]] ? 0 : 1;
                /* If neither of the users are in the main user map, one has to be selected. */
                if (!userNameMap[threadPeople[whichUserIsMoreLikelyToBe]]) {
                    console.log('Main username: ', threadPeople[whichUserIsMoreLikelyToBe], ' Because of thread ', threadKey);
                }
                userNameMap[threadPeople[whichUserIsMoreLikelyToBe]] = true;
            }
        }
        for (var userName in userNameMap) {
            userNames.push(userName);
        }
        return userNames;
    };
}));