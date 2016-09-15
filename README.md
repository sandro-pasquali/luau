Luau
====

Simplifies the loading and calling of Lua script in Redis. Allows you to call a script via a human-readable alias, rather than bothering with LOAD and EVALSHA in Redis.

Usage
-----

Luau uses the [Bluebird Promise library](https://github.com/petkaantonov/bluebird).

```
let luau = require('luau');

let instance = luau({
    folder : './scripts',
    port : 6379
})
.then(luaInstance => {
    // do something against #luaInstance
})
```

The following Lua script will set some key to some value, then return the set value:

```
local key = KEYS[1]
redis.call("set", key, ARGV[1])
return redis.call("get", key)
```

The file name of the script will be its command name. Let's name the above script `./scripts/setget.lua`. 

To run the above script:

```
var response = lua.run('setget', 1, 'keyname', 'somevalue');
```

The argument ordering for `run` follows the argument ordering for Redis `EVALSHA`. The difference is that you replace a SHA with your custom command name (the file name).

See
* [Redis EVAL](http://redis.io/commands/eval)
* [Redis EVALSHA](http://redis.io/commands/evalsha)

Loading of the script into Redis' script cache is done automatically for you. Just call `run` -- if the script does not exist it will be lazy loaded for you (and return the result).
