#!/usr/bin/env node

var amqp = require('amqplib/callback_api');

// Get the binding key from the command-line arguments
var args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage: node kitchen.js <binding_key>");
  console.log('Example: node kitchen.js "*.fried.*"');
  process.exit(1);
}

var bindingKey = args[0];
var queueName;

// Generate queue name from binding key
// Remove wildcards '*' and '#', and any leading or trailing dots
var queueNameSegments = bindingKey.split('.').filter(function(segment) {
  return segment !== '*' && segment !== '#';
});

// Handle the case where all segments are wildcards
if (queueNameSegments.length === 0) {
  queueName = 'queue.all';
} else {
  queueName = 'queue.' + queueNameSegments.join('.');
}

amqp.connect('amqp://localhost', function(error0, connection) {
  if (error0) throw error0;

  connection.createChannel(function(error1, channel) {
    if (error1) throw error1;
    var exchange = 'food_topic_exchange';

    channel.assertExchange(exchange, 'topic', { durable: false });

    // Declare a durable queue with the generated name
    var queueOptions = { durable: true };

    channel.assertQueue(queueName, queueOptions, function(error2, q) {
      if (error2) throw error2;

      console.log(' [*] Kitchen waiting for messages matching "%s" in queue "%s". To exit press CTRL+C', bindingKey, q.queue);

      channel.bindQueue(q.queue, exchange, bindingKey);

      channel.consume(
        q.queue,
        function(msg) {
          console.log(" [x] Received %s: '%s'", msg.fields.routingKey, msg.content.toString());
          var order = JSON.parse(msg.content.toString());
          console.log('Kitchen is cooking: %s x%s', order.name, order.quantity);

          // Simulate cooking time
          setTimeout(function() {
            console.log('Kitchen finished cooking: %s x%s', order.name, order.quantity);
            channel.ack(msg);
          }, 1000);
        },
        { noAck: false }
      );
    });
  });
});
