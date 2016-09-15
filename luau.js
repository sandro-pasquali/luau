'use strict';

let redis = require('redis');
let fs = require('fs');
let path = require('path');
let util = require('util');
let Promise = require('bluebird');

function Luau(opts) {

	opts = opts || {};

	let port = opts.port === void 0 ? 6379 : +opts.port;

	//	Your scripts should be in a folder, and their filenames should
	//	correspond to the command name you'd like used, eg:
	//		/scripts/fetchStats.lua
	//
	let folderpath = path.resolve(opts.folder || './scripts');

	let client = redis.createClient(port);
	let commandMap = {};

	//	Internal method that loads scripts, @see #run
	//
	function loadLuaScript(scriptPath, argHash) {
		return new Promise((resolve, reject) => {
			fs.readFile(scriptPath, {encoding:"utf8"}, (err, contents) => {

				if(err) {
					return reject(err);
				}

				client.script('load', contents.trim(), (err, sha) => {

					if(err) {
						return reject(err);
					}

					commandMap[argHash] = sha;

					resolve();
				})
			});
		});
	}

	this.login = password => {
		return new Promise((resolve, reject) => {
			client.auth(password, err => err ? reject(err) : resolve());
		})
	};

	//	Removes *all* loaded scripts from Redis script cache
	//
	this.flush = () => {
		commandMap = {};
		client.script("flush");
		return Promise.resolve();
	};

	//	Execute a lua script. If the script has not been previously registered
	//	by this object, it will be loaded and then run (ie. commands are
	//	lazy-bound)
	//
	//	@param	{String}	name	The name of a lua script, minus the .lua extension, that
	//								exists within the #folder path sent to constructor.
	//	@param	{Integer}	[keys]	The number of Redis keys passed to command.
	//	@param	{Args}		[...]	KEYS or ARGV values. eg:
	//									lua.run('hello', 1, 'somekey', 'some arg')
	//													 ^      ^          ^
	//										     The # of keys  ^        ARGV[1] <- note 1 based
	//														   KEYS[1]
	//	For info on why keys are passed this way, and more:
	//	@see http://redis.io/commands/eval
	//
	this.run = function(name, keys) {

		let argv = Array.prototype.slice.call(arguments);

		//	If no key slots are reserved, ensure 0 is set in redis arguments to #evalsha.
		//	Note: an argument list > 1 length that doesn't set #keys properly will error.
		//
		if(argv.length === 1) {
			argv.push(0);
		}

		//	As args are just going to be simple strings and numbers we can
		//	create a unique key by joining with a char not expected in input (ESC).
		//
		let argHash = argv.join("\x1B");
		let command = commandMap[argHash];

		return new Promise((resolve, reject) => {

			//	No command. Load the lua script, then call #run again with original arguments
			//	(script is now loaded, so we'll get a result, below), and resolve with that result.
			//
			if(!command) {
				return loadLuaScript(path.join(folderpath, name + '.lua'), argHash)
				.then(() => this.run.apply(this, argv).then(resolve));
			}

			//	#name is slot 0 of args; replace that alias with its sha reference
			//
			argv[0] = command;

			client.evalsha(argv, (err, val) => err ? reject(err) : resolve(val));
		})
	}
}

module.exports = opts => Promise.resolve(new Luau(opts || {}));


