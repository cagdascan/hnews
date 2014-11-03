#!/usr/bin/env node 

var celeri = require('celeri'),
		List = require('term-list'),
		exec = require('child_process').exec,
		moment = require('moment'),
		request = require('request'),
		list = new List({ marker: '\033[36m› \033[0m', markerLength: 2 }),
		topNews;

celeri.option({
  command: 'top',
  description: 'Fetches top results from hacker news',
}, function() {
	makeRequestTop();
  startList();
});

//parse the command line args
celeri.parse(process.argv);

function makeRequestTop () {
  request({
    method: 'GET',
    url: 'https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty'
  }, function (error, response, body) {
  	if (!error && response.statusCode == 200) {
  		topNews = JSON.parse(body);
  		for (var i = 0; i < 10 ; i++) {
  			(function (i) {
		  		makeRequestItem(i);
  			}(i));
	  	}
  	} else if (error) {
  		console.log('Error: ' + error);
  		process.exit(1);
  	}
  });
}

function makeRequestItem (i) {
  request({
    method: 'GET',
		url: 'https://hacker-news.firebaseio.com/v0/item/' + 
		      topNews[i] + '.json?print=pretty'
  }, function (error, response, body) {
  	if (!error && response.statusCode == 200) {
  		body = JSON.parse(body);

	  	// domain name
	  	var url = body.url;
	  	var matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
	  	var domain = matches && matches[1];

	  	// time ago
	  	var unixTime = body.time;
	  	var unixDate = moment.unix(unixTime);
	  	var timeAgo = unixDate.fromNow();

	  	// comment count
	  	var length;
	  	if (body.kids) {
	  		length = body.kids.length;
	  	} else {
	  		length = 0;
	  	}

			list.add(body.url, ':: ' + body.title + ' (' + domain + ')');
			list.add('https://news.ycombinator.com/item?id=' + 
				body.id, '   ' + body.score + ' points by ' + body.by + 
				' ' + timeAgo + ' | ' + length + ' comments\n');
  	} else if (error) {
  		console.log('Error: ' + error);
  		process.exit(1);
  	}
  });
}

function startList () {
	console.log('HACKER NEWS');
	var spinner = celeri.loading('fetching news ...');
	setTimeout(function () {
		spinner.done(true);

		list.start();

		list.on('keypress', function(key, item){
		  switch (key.name) {
		    case 'return':
		      exec('open ' + item);
		      list.stop();
		      break;
		  }
		});
	}, 5000);
}