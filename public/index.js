$(function() {
    // Get handle to the chat div 
    var $chatWindow = $('#messages');

    // Our interface to the Chat service
    var chatClient;

    // The server will assign the client a random username
	// - store that value here
	// @TODO - change this read user name from system
    var username;

    // Helper function to print info messages to the chat window
    function print(infoMessage, asHtml) {
        var $msg = $('<div class="info">');
        if (asHtml) {
            $msg.html(infoMessage);
        } else {
            $msg.text(infoMessage);
        }
        $chatWindow.append($msg);
    }

    // Helper function to print chat message to the chat window
    function printMessage(fromUser, message) {
        var $user = $('<span class="username">').text(fromUser + ':');
        if (fromUser === username) {
            $user.addClass('me');
        }
        var $message = $('<span class="message">').html(message);
        var $container = $('<div class="message-container">');
        $container.append($user).append($message);
        $chatWindow.append($container);
        $chatWindow.scrollTop($chatWindow[0].scrollHeight);
    }

    // Alert the user they have been assigned a random username
    print('Logging in...');

    // Get an access token for the current user, passing a username (identity)
    $.getJSON('/token', {
        username: 'agent'
    }, function(data) {
        // Alert the user they have been assigned a random username
        var userid = data.identity;
		var token = data.usertoken;
        print('Hello ' 
            + '<span style="font-weight:bold;">' + userid + '</span>', true);
		localStorage.setItem('_USERNAME', userid); //save user id on device
		localStorage.setItem('_TOKEN', token); //save token on device
    });

    // Send a new message to the general channel
    var $input = $('#chat-input');
    $input.on('keydown', function(e) {
        if (e.keyCode == 13) {

			var userid = localStorage.getItem('_USERNAME');
			var token = localStorage.getItem('_TOKEN');
			
			var userinput = $input.val();
            printMessage(userid, userinput);
            $input.val('');
			
			$.post('/webhook', {
				username: userid,
				usertoken: token,
				input: userinput
			}, function(data) {
				// Success callback
				responseStr = data.resp;
				printMessage("Bot", responseStr);

			});
        }
    });
});