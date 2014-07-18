#!/bin/env node

//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var request = require('request');
var cheerio = require('cheerio');

/**
 *  Define the sample application.
 */
var SampleApp = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };

        /*self.routes['/asciimo'] = function(req, res) {
            var link = "http://i.imgur.com/kmbjB.png";
            res.send("<html><body><img src='" + link + "'></body></html>");
        };

        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html') );
        };*/

		//example: /bookmarks/WA/Seattle?YelpUserId=XXX
		self.routes['/bookmarks/:state/:city'] = function(req, res){

			var state = req.params.state;
			var city = req.params.city;
			var yelpUserId = req.query.YelpUserId;
			
			GetPublicYelpBookmarks(yelpUserId, city, state, function(yelpBookmarks){
				sys.puts(yelpBookmarks.length + " Yelp bookmarks found for " + yelpUserId + " in " + city + ", " + state);
				res.json(yelpBookmarks);
			});

			function GetPublicYelpBookmarks(userId, city, state, onBookmarksCollected){
				var url = 'http://yelp.com/user_details_bookmarks?userid=' + userId + '&cc=US&city=' +  city + '&state=' + state;
				request({
					url:url,
					method: 'GET',
					headers:{
						'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 5_0 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9A334 Safari/7534.48.3'
					}}, function(err, response, html){

					if (err){
						res.send(err + html);
						return;
					}
					
					if (response.statusCode != 200){
						res.send(html);
						return;
						res.json({
							requestUrl: url,
							responseCode: response.statusCode
						});
						return;
					}
					
					var bookmarks = new Array();
					var $ = cheerio.load(html);
					$bizInfo = $(".book_biz_info");
					$bizInfo.each(function(i, bizInfo){
						var bizTitle = $(bizInfo).find("h3 a").text();
						var bizAddress = $(bizInfo).find("address").html();
						var splitXpr = /<br>/;
						var bizAddressLines = bizAddress.split(splitXpr);

						var validLines = []
						for (var i =0; i < bizAddressLines.length; i++){
							var addressLine = bizAddressLines[i].trim();
							if (addressLine.length < 1) {
								continue;
							}						
							validLines.push(addressLine);
						}

						var address = "";
						for (var i =0; i < validLines.length - 1; i++){
							address += validLines[i] + " ";
						}

						var bizStreetAddress = address.trim();

						//TODO: include link to reviews and rating
						//TODO: filter by neighborhood (i.e Downtown+)
						var bookmark = {
							title: bizTitle,
							streetAddress: bizStreetAddress
						};

						bookmarks.push(bookmark);
					});

					onBookmarksCollected(bookmarks);
				});
			}

		};		
		
    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express.createServer();

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();