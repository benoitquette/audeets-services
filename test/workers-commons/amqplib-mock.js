var exchanges = {};
var queues = {};

export function connect(url, options, connCallback) {
  if (!connCallback) {
    connCallback = options;
    options = {};
  }
  var createChannel = function (channelCallback) {
    var channel = {
      assertQueue: function (queue, qOptions, qCallback) {
        qCallback = qCallback || function () {};
        setIfUndef(queues, queue, {
          messages: [],
          subscribers: [],
          options: qOptions
        });
        qCallback(null, { queue });
      },

      assertExchange: function (exchange, exchType, exchOptions) {
        setIfUndef(exchanges, exchange, { bindings: [], options: exchOptions });
        //return exchCallback && exchCallback();
      },

      bindQueue: function (queue, exchange, key, args, bindCallback) {
        bindCallback = bindCallback || function () {};
        if (!exchanges[exchange]) return bindCallback('Bind to non-existing exchange ' + exchange);
        var re = '^' + key.replace('.', '\\.').replace('#', '(\\w|\\.)+').replace('*', '\\w+') + '$';
        exchanges[exchange].bindings.push({
          regex: new RegExp(re),
          queueName: queue
        });
        bindCallback();
      },

      publish: function (exchange, routingKey, content, props, pubCallback) {
        pubCallback = pubCallback || function () {};
        if (!exchanges[exchange]) return pubCallback('Publish to non-existing exchange ' + exchange);
        var bindings = exchanges[exchange].bindings;
        var matchingBindings = bindings.filter(function (b) {
          return b.regex.test(routingKey);
        });
        matchingBindings.forEach(function (binding) {
          var subscribers = queues[binding.queueName] ? queues[binding.queueName].subscribers : [];
          subscribers.forEach(function (sub) {
            var message = {
              fields: { routingKey: routingKey },
              properties: props,
              content: content
            };
            sub(message);
          });
        });
        return pubCallback && pubCallback();
      },

      consume: function (queue, handler) {
        queues[queue].subscribers.push(handler);
      },

      deleteQueue: function (queue) {
        setImmediate(function () {
          delete queues[queue];
        });
      },

      ack: function () {},
      nack: function () {},
      prefetch: function () {},
      on: function () {}
    };
    channelCallback(null, channel);
  };

  var connection = {
    createChannel: createChannel,
    createConfirmChannel: createChannel,
    on: function () {}
  };

  connCallback(null, connection);
}

export function resetMock() {
  setImmediate(function () {
    queues = {};
    exchanges = {};
  });
}

function setIfUndef(object, prop, value) {
  if (!object[prop]) {
    object[prop] = value;
  }
}
