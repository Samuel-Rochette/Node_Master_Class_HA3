/*
 * CLI-related tasks
 *
 */

 // Dependencies
var readline = require('readline');
var util = require('util');
var debug = util.debuglog('cli');
var events = require('events');
class _events extends events{};
var e = new _events();
var _data = require('./data');
var helpers = require('./helpers');

// Instantiate the cli module object
var cli = {};

// Input handlers
e.on('exit',function(str){
  cli.responders.exit();
});

e.on('menu',function(str){
  cli.responders.menu();
});

e.on('list users',function(str){
  cli.responders.listUsers();
});

e.on('list orders',function(str){
  cli.responders.listOrders();
});

e.on('get user info',function(str){
  cli.responders.getUserInfo(str);
});

e.on('get order info',function(str){
  cli.responders.getOrderInfo(str);
});

// Responders object
cli.responders = {};

// Exit
cli.responders.exit = function(){
  process.exit(0);
};

cli.responders.menu = function(){
  _data.list('menu',function(err,itemNames){
    if(!err && itemNames && itemNames.length > 0){
      cli.verticalSpace();
      itemNames.forEach(function(itemName){
        _data.read('menu',itemName,function(err,itemData){
          if(!err && itemData){
            var line = 'Name: '+itemData.name+' Price: '+itemData.price;
            console.log(line);
            cli.verticalSpace();
          }
        });
      });
    }
  });
}

cli.responders.listUsers = function(){
  var yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
  _data.list('users',function(err,userIds){
    if(!err && userIds && userIds.length > 0){
      userIds.forEach(function(userId){
        _data.read('users',userId,function(err,userData){
          var dateCreated = new Date(userData.dateCreated)
          if(!err && userData && dateCreated > yesterday){
            var line = 'Name: '+ userData.firstName
              + ' ' + userData.lastName
              + ' Email: ' + userData.email
              + ' Address: ' + userData.address
              + ' Date: ' + userData.dateCreated;
            console.log(line);
          }
        });
      });
    }
  });
}

cli.responders.listOrders = function(){
  var yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
  _data.list('orders',function(err,orderIds){
    if(!err && orderIds && orderIds.length > 0){
      orderIds.forEach(function(orderId){
        _data.read('orders',orderId,function(err,orderData){
          var dateCreated = new Date(orderData.dateCreated)
          if(!err && orderData && dateCreated > yesterday){
            var line = 'ID: ' + orderData.id
              + ' Email: ' + orderData.email
              + ' Price: ' + orderData.totalPrice
            console.log(line);
          }
        });
      });
    }
  });
}

cli.responders.getUserInfo = function(str){
  var arr = str.split('--');
  var userId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
  if(userId){
    _data.read('users',userId,function(err, userData){
      if(!err && userData){
        delete userData.hashedPassword;

        cli.verticalSpace();
        console.dir(userData,{'colors' : true});
        cli.verticalSpace();
      }
    });
  }
}

cli.responders.getOrderInfo = function(str){
  var arr = str.split('--');
  var orderId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
  if(orderId){
    _data.read('orders',orderId,function(err, orderData){
      if(!err && orderData){
        delete orderData.hashedPassword;

        cli.verticalSpace();
        console.dir(orderData,{'colors' : true});
        cli.verticalSpace();
      }
    });
  }
}

// Create a vertical space
cli.verticalSpace = function(lines){
  lines = typeof(lines) == 'number' && lines > 0 ? lines : 1;
  for (i = 0; i < lines; i++) {
      console.log('');
  }
};

// Create a horizontal line across the screen
cli.horizontalLine = function(){

  // Get the available screen size
  var width = process.stdout.columns;

  // Put in enough dashes to go across the screen
  var line = '';
  for (i = 0; i < width; i++) {
      line+='-';
  }
  console.log(line);


};

// Create centered text on the screen
cli.centered = function(str){
  str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : '';

  // Get the available screen size
  var width = process.stdout.columns;

  // Calculate the left padding there should be
  var leftPadding = Math.floor((width - str.length) / 2);

  // Put in left padded spaces before the string itself
  var line = '';
  for (i = 0; i < leftPadding; i++) {
      line+=' ';
  }
  line+= str;
  console.log(line);
};

// Input processor
cli.processInput = function(str){
  str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : false;
  // Only process the input if the user actually wrote something, otherwise ignore it
  if(str){
    // Codify the unique strings that identify the different unique questions allowed be the asked
    var uniqueInputs = [
      'exit',
      'stats',
      'list users',
      'get user info',
      'list orders',
      'get order info',
      'menu'
    ];

    // Go through the possible inputs, emit event when a match is found
    var matchFound = false;
    var counter = 0;
    uniqueInputs.some(function(input){
      if(str.toLowerCase().indexOf(input) > -1){
        matchFound = true;
        // Emit event matching the unique input, and include the full string given
        e.emit(input,str);
        return true;
      }
    });

    // If no match is found, tell the user to try again
    if(!matchFound){
      console.log("Sorry, try again");
    }

  }
};

// Init script
cli.init = function(){

  // Send to console, in dark blue
  console.log('\x1b[34m%s\x1b[0m','The CLI is running');

  // Start the interface
  var _interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ''
  });

  // Create an initial prompt
  _interface.prompt();

  // Handle each line of input separately
  _interface.on('line', function(str){

    // Send to the input processor
    cli.processInput(str);

    // Re-initialize the prompt afterwards
    _interface.prompt();
  });

  // If the user stops the CLI, kill the associated process
  _interface.on('close', function(){
    process.exit(0);
  });

};

 // Export the module
 module.exports = cli;
