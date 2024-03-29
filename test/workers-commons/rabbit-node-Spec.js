/* eslint-disable import/no-named-as-default-member */
import amqp from 'amqplib/callback_api.js';
import sinon from 'sinon';
import esmock from 'esmock';
import { expect } from '../chai.js';
import { connect, resetMock } from './amqplib-mock.js';

amqp.connect = connect;

var exchange1 = {
  exchange: 'ex1',
  type: 'topic',
  options: {}
};
var exchange2 = {
  exchange: 'ex2',
  type: 'fanout',
  options: {}
};
var queue1 = {
  queue: 'q1'
};
const routingKey = 'routing.key';

var node = await esmock('../../lib/workers-commons/rabbit-node.js', {
  '../../lib/workers-commons/rabbit-config.js': {
    getQueueBinding: function (name, callback) {
      switch (name) {
        case queue1.queue:
          return callback(null, exchange1, queue1, routingKey);
        default:
          return callback('unknown queue from mock', null, null, null);
      }
    },
    getExchange: function (name) {
      switch (name) {
        case exchange1.exchange:
          return exchange1;
        case exchange2.exchange:
          return exchange2;
        default:
      }
      return null;
    }
  }
});

describe('rabbit-node', function () {
  this.beforeEach(() => resetMock());
  describe('#consume()', function () {
    it('should return the message that has been published', function () {
      const content = 'test';
      const spy = sinon.spy();
      node.consume('', queue1.queue, spy);
      connect('', (err, conn) => {
        conn.createChannel((err, channel) => {
          channel.publish(exchange1.exchange, routingKey, content, null, (err) => {
            console.log(err);
          });
        });
      });
      const err = spy.args[0][0];
      const channel = spy.args[0][1];
      const message = spy.args[0][2];
      expect(err).to.equal(null);
      expect(channel).to.exist;
      expect(channel).to.not.be.undefined;
      expect(message.content).to.equal(content);
    });
    it('should not consume message when published to an unknown exchange', function () {
      const spy = sinon.spy();
      node.consume('', queue1.queue, spy);
      connect('', (err, conn) => {
        conn.createChannel((err, channel) => {
          channel.publish('ddddd', routingKey, 'test', null, (err) => {
            console.log(err);
          });
        });
      });
      expect(spy.called).to.equal(false);
    });
    it('should return an error when trying to consume messages from an unknown queue', function () {
      const spy = sinon.spy();
      node.consume('', 'qdqsdsq', spy);
      expect(spy.called).to.equal(true);
    });
    it('should not consume a message when published to an unknown route', function () {
      const spy = sinon.spy();
      node.consume('', queue1.queue, spy);
      connect('', (err, conn) => {
        conn.createChannel((err, channel) => {
          channel.publish(exchange1.exchange, 'dddd', 'test', null, (err) => {
            console.log(err);
          });
        });
      });
      expect(spy.called).to.equal(false);
    });
  });
  describe('#publish()', function () {
    it('should return a channel and no error', function () {
      const content = 'test';
      const spy = sinon.spy();
      node.consume('', queue1.queue, spy);
      node.publish('', exchange1.exchange, routingKey, content);
      const err = spy.args[0][0];
      const channel = spy.args[0][1];
      const message = spy.args[0][2];
      expect(err).to.equal(null);
      expect(channel).to.exist;
      expect(channel).to.not.be.undefined;
      console.log(spy.args[0]);
      expect(message.content.toString()).to.equal(Buffer.from(JSON.stringify(content)).toString());
    });
    it('should not consume a message when published to an unknown exchange', function () {
      const spy = sinon.spy();
      node.consume('', queue1.queue, spy);
      node.publish('', 'ddddd', routingKey, 'test', () => {});
      expect(spy.called).to.equal(false);
    });
    it('should not consume a message when published to an unknown route', function () {
      const spy = sinon.spy();
      node.consume('', queue1.queue, spy);
      node.publish('', exchange1.exchange, 'dddd', 'test');
      expect(spy.called).to.equal(false);
    });
  });
});
