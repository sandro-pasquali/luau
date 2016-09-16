'use strict';

var luau = require('../../luau.js');

module.exports = function(test, Promise) {

    return luau({
        folder : './scripts',
        port : 6379
    })
    .then(lua => {

        this.lua = lua;

        return lua
        .flush()
        .then(() => lua.run('setget', 1, 'helloworld', 'ARGV[1](first)'));
    })
    .then(val => {
        test.ok(val === 'ARGV[1](first)', `Correctly receiving first value`);

        return this.lua.run('setget', 1, 'helloworld', 'ARGV[1](second)');

    })
    .then(val => {
        test.ok(val === 'ARGV[1](second)', `Correctly receiving second value`);

        return this.lua.run('setget', 1, 'hello', 'hello there')
    })
    .then(val => {
        test.ok(val === 'hello there', `Correctly receiving value`);

        this.lua.flush();
    })
};