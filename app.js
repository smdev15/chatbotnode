var bodyParser = require('body-parser');
var request = require("request");
var cache  = require("memory-cache");
var express = require("express");
var RiveScript = require("rivescript");

const PORT = 5000;

// Configure proxy settings (credentials, host and port)
//@TODO - Get credentials from Windows

var app = express();
app.set('port', PORT);
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// Create the bot.
var bot = new RiveScript({ debug: false });
bot.loadDirectory("./bot/brain", success_handler, error_handler);

// All file loading operations are asynchronous - need handlers to catch when they've finished. 
// The success function is called only when ALL the files have finished loading. 
function success_handler (loadcount) {
	console.log("Load #" + loadcount + " completed!");

	// Now the replies must be sorted!
	bot.sortReplies();

    // And now we're free to get a reply from the brain! 
	var reply = bot.reply("local-user", "Hello, bot!");
    console.log("The bot says: " + reply);
}

// It's good to catch error - handle errors! 
function error_handler (loadcount, err) {
    console.log("Error loading batch #" + loadcount + ": " + err + "\n");
}

// Get Rates
var getRates = function(rateType, cb) {
	rateType = rateType.toUpperCase();
	console.log("rate type --> ", rateType);
	var link = "";
	if(!rateType) {
		link = "http://csd.rw.discoverfinancial.com/csd/bookmark_add.cfm?site_id=4187";
	} else if(rateType === 'AAA') {
		link = "http://csd.rw.discoverfinancial.com/csd/subcategory_display.cfm?site_id=4187&menuid=20964&node=30";
	} else if(rateType === 'AAII') {
		link = "http://csd.rw.discoverfinancial.com/csd/subcategory_display.cfm?site_id=4187&menuid=25669&node=30";
	} else if(rateType === 'BRANCH') {
		link = "http://csd.rw.discoverfinancial.com/csd/subcategory_display.cfm?site_id=4187&menuid=33181&node=30";
	} else if(rateType === 'BANK') {
		link = "http://csd.rw.discoverfinancial.com/csd/subcategory_display.cfm?site_id=4187&menuid=11540&node=30";
	} else {
		link = "http://csd.rw.discoverfinancial.com/csd/bookmark_add.cfm?site_id=4187";
	} 
	
	cb.call(this, null, "<a href='"+ link + "' target='_blank'>Click here</a> for " + rateType + " Rates");

};

// Rivescript Subroutine to check for rates
bot.setSubroutine("checkForRates", function(rs, args) {
  return new rs.Promise(function(resolve, reject) {
    getRates(args.join('+'), function(error, data){
      if(error) {
		console.log(error);
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
});


// Generate an Access Token for an application user - it generates a random username. 
app.get('/token', function(request, response) {
	var user = request.query.username; // $_GET["id"]
    console.log(user)

    // Assign the generated identity to the token
    identity = randomUsername(user);
	userid = identity;
	usertoken = identity.split('#')[1];


    // Serialize the token to a JWT string and include it in a JSON response
    response.send({
        identity: userid,
        token: usertoken
    });
});

function randomUsername(user) {
	var d = new Date();
	var randomnum = d.getTime();
	var useridentity = user+"#"+randomnum;
	return useridentity;
}

app.get("/", function(req, res){
    res.sendStatus(200);
});

// All callbacks are POST-ed. They will be sent to the same webhook. 
app.post('/webhook', function (req, res) {
	var data = req.body.input;
	var user = req.body.username;
	var token = req.body.usertoken;

	console.log("Webhook received user input... @", user, ": ", data);

	// Get a reply from the bot! 
    bot.replyAsync(user, data, this).then(function(reply){
        	console.log("The bot says: " + reply);
			res.send({resp: reply});
      }).catch(function(error) {
			//@TODO Handle error!!
			console.log(error);
      });
	
});

// Start server
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

module.exports = app;