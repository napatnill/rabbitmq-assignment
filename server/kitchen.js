#!/usr/bin/env node

var amqp = require('amqplib/callback_api');

var args = process.argv.slice(2);
if (args.length == 0) {
  console.log("Usage: kitchen.js [food1] [food2] ...");
  process.exit(1);
}

amqp.connect('amqp://localhost', function(error0, connection) {
  if (error0) throw error0;
  connection.createChannel(function(error1, channel) {
    if (error1) throw error1;
    var exchange = 'food_topic_exchange';
    channel.assertExchange(exchange, 'topic', { durable: false });

    args.forEach(function(food) {
      var queue = 'queue.order.' + food.toLowerCase().replace(/ /g, '_');
      var bindingKey = 'order.' + food.toLowerCase().replace(/ /g, '_');

      channel.assertQueue(queue, { durable: true }, function(error2, q) {
        if (error2) throw error2;
        console.log(' [*] Kitchen waiting for messages in %s. To exit press CTRL+C', q.queue);

        channel.bindQueue(q.queue, exchange, bindingKey);

        channel.consume(q.queue, function(msg) {
          console.log(" [x] Received %s: '%s'", msg.fields.routingKey, msg.content.toString());
          var order = JSON.parse(msg.content.toString());
          console.log("Kitchen is cooking: %s x%s", order.name, order.quantity);

          // Simulate cooking time
          setTimeout(function() {
            console.log("Kitchen finished cooking: %s x%s", order.name, order.quantity);
            channel.ack(msg);
          }, 1000);
        }, { noAck: false });
      });
    });
  });
});
