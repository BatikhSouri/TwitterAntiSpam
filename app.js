// A simple script that looks for spammers on Twitter who use "spam models"

var http = require('http'),
	path = require('path'),
	twit = require('twit'),
	config = require('./config.js');

var spamModel = 'Former US Army Vet Who Fought Alongside Al-Qaeda in #Syria Linked to #CIA -';
var maxDistance = 2;

var client = new twit(config);

//Counts how many characters differ from one string to another
var strDistance = function(string1, string2){
	var diffCount = 0;
	//Count the length difference as different characters.
	var lengthDiff = Math.max(string1.length, string2.length) - Math.min(string1.length, string2.length);
	diffCount += lengthDiff;
	//Taken the possible string length diffrence into account, counting char differences with the shortest string as length reference
	var scanLength = Math.min(string1.length, string2.length);
	for (var i = 0; i < scanLength; i++){
		if (string1[i] != string2[i]){
			diffCount++;
		}
	}
	return diffCount;
};

var findHashtags = function(string){
	var hashtags = [];
	var hashtagsIndexes = [];
	var lastHashtagIndex = string.indexOf('#');
	// With this loop, we look for where hashtags start
	while (lastHashtagIndex != -1){
		hashtagsIndexes.push(lastHashtagIndex);
		lastHashtagIndex = string.indexOf('#', lastHashtagIndex + 1); //Just because :p
	}
	// With this loop, we look for the end of the hashtags. The hashtags are then pushed to the hashtags array
	for (var i = 0; i < hashtagsIndexes.length; i++){
		var actualIndex = hashtagsIndexes[i];
		var actualHashtag = "";
		var actualChar = string[actualIndex];
		do {
			actualHashtag += actualChar;
			actualIndex++;
			actualChar = string[actualIndex];
		} while(!(actualChar == '#' || actualChar == ' ' || actualChar == '-' || actualChar == '_' || actualChar == '|' || actualChar == '\\' || actualChar == '/' || actualChar == ':' || actualChar == ';'));
		hashtags.push(actualHashtag);
	}
	return hashtags;
};

var targetHashtags = findHashtags(spamModel).join(' ');
var stream = client.stream('statuses/filter', {track: targetHashtags});

stream.on('tweet', function(tweet){
	var tweetText = tweet.text;
	if (strDistance(tweetText, spamModel) <= maxDistance){
		var username = tweet.user.screen_name;
		client.post('users/report_spam', {screen_name: username}, function(err, reply){
			if (err){
				if (err.data.errors.code == 205){
					console.log('Rate limiting has been reached. Exiting');
					process.exit(0);
				} else {
					console.log('An error occured while reporting @' + username + ' for spam.\n' + JSON.stringify(err));
				}
			} else {
				console.log('@' + username + ' reported for spam');
			}
		});
	}
});
