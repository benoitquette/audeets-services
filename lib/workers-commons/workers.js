import path from 'path';
import fs from 'fs';
import log from './../logger.js';
import utilities from './../utilities.js';
import rabbit from './rabbit-node.js';

const taskSchemaName = 'task.schema.json';

/**
 * Publishes a task to the 'store' exchange.
 *
 * @param {string} nodeUrl the URL of the rabbitmq node
 * @param {Object} task the task to publish.
 * @param {function} callback called to pass on errors
 * @private
 */
function _publishStoreTask(nodeUrl, task, callback) {
  rabbit.publish(nodeUrl, 'store', '', task, callback);
}

/**
 * Publishes a task to the 'audit' exchange.
 *
 * @param {string} nodeUrl the URL of the rabbitmq node
 * @param {Object} task the task to publish
 * @param {function} callback called to pass on errors
 */
function publishAuditTask(nodeUrl, task, callback) {
  rabbit.publish(nodeUrl, 'audit', '', task, callback);
}

/**
 * Delegates a task to a worker. The worker is dynamically created and the
 * process() is then invoked. If the worker provides an output, the methods
 * forwards it for storage.
 *
 * The worker is created via the parameter name. It loads the module
 * 'index.javascripts' in the directory 'lib/{name}'.
 *
 * @param {string} nodeUrl the URL to the rabbit-mq
 * @param {string} name the name of the worker. Used to load the module, and
 * also to extract the audit category.
 * @param {Object} task the task to execute
 * @param {Object} channel the rabbit-mq channel to use
 * @param {string} message the rabbit-mq message the task originated from. Used
 * for acking.
 * @param {function} callback called to pass on errors
 * @return {*} nothing really...
 * @private
 */
function _processTask(nodeUrl, name, task, channel, message, callback) {
  const dirname = new URL('.', import.meta.url).pathname;
  const modulePath = path.join(dirname, '..', name, 'index.js');
  import(modulePath)
    .then((worker) =>
      worker.process(process.env, task, (err, results) => {
        if (err) {
          return callback(err);
        }
        // if the task produces some results/output, then we publish the results
        // to the storage exchange. Before sending them, we add the category to
        // the results.
        if (results) {
          const newResults = results;
          newResults.category = name.split('-')[1];
          // TODO add results schema validation
          _publishStoreTask(nodeUrl, newResults, callback);
        }
        // finally, we ack the message, regardless of the type of task
        return channel.ack(message);
      })
    )
    .catch((e) => callback(e));
}

/**
 * Creates a consumer instance bound to a named queue.
 *
 * @param {string} nodeUrl the URL to the rabbit-mq
 * @param {string} name the name of the queue to bind to
 * @param {function} callback called to pass on errors
 */
function createWorker(nodeUrl, name, callback) {
  rabbit.consume(nodeUrl, name, (err, channel, message) => {
    if (err) {
      log.error(err);
      channel.ack(message);
      return callback(err);
    } else {
      const task = JSON.parse(message.content);
      const dirname = new URL('.', import.meta.url).pathname;
      let schemaPath = path.join(dirname, '..', name, taskSchemaName);
      try {
        fs.statSync(schemaPath);
      } catch (e) {
        // if a schema file is not defined for the worker, we use the
        // default one
        schemaPath = path.join(dirname, taskSchemaName);
      }
      return utilities.validateJson(task, schemaPath, (err2) => {
        if (err2) {
          log.error(err2);
          return channel.ack(message);
        }
        log.info(`Received validated task ${JSON.stringify(task)}`);
        return _processTask(nodeUrl, name, task, channel, message, (err3) => {
          log.error(err3);
          return channel.ack(message);
        });
      });
    }
  });
}

export { createWorker, publishAuditTask };
