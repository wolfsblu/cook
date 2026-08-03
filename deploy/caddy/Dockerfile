# Stock Caddy has no HTTP cache, so build one that does.
#
# Without a cache in front of it, imgproxy re-reads and re-encodes the source
# image on every request. It is stateless by design and its own documentation
# expects a caching layer in front. That layer is the entire reason the NAS
# stops being touched.
FROM caddy:2-builder AS builder

# The Badger storage backend is a separate module from the cache handler.
# Without it Caddy still starts and reports a valid config, but silently falls
# back to an in-memory store that its own logs call "for development purpose"
# and that loses everything on restart.
RUN xcaddy build \
	--with github.com/caddyserver/cache-handler \
	--with github.com/darkweak/storages/badger/caddy

FROM caddy:2-alpine

COPY --from=builder /usr/bin/caddy /usr/bin/caddy
