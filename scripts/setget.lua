local key = KEYS[1]
redis.call("set", key, ARGV[1])
return redis.call("get", key)