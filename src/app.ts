import { Hono } from 'hono'
import { timeout } from 'hono/timeout'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { showRoutes } from 'hono/dev'
import { env } from 'hono/adapter'
import { bodyLimit } from 'hono/body-limit'
import { cache } from 'hono/cache'
import { __DEV__ } from './env'
import { loggerMiddleware } from './middlewares/logger'
import { errorhandler, notFoundHandler } from './middlewares/error'
import { Bindings } from './types'
import routes from './routes'

const app = new Hono<{ Bindings: Bindings }>()
app.use(loggerMiddleware)
app.use((c, next) => {
    const TIMEOUT = parseInt(env(c).TIMEOUT) || 60000
    return timeout(TIMEOUT)(c, next)
})
app.use((c, next) => {
    const MAX_BODY_SIZE = parseInt(env(c).MAX_BODY_SIZE) || 100 * 1024 * 1024 // 默认 100MB
    return bodyLimit({ maxSize: MAX_BODY_SIZE })(c, next)
})
app.use((c, next) => {
    const CACHE_MAX_AGE = parseInt(env(c).CACHE_MAX_AGE) || 300 // 默认 5 分钟缓存
    return cache({
        cacheName: 'rsshub-cache',
        cacheControl: `max-age=${CACHE_MAX_AGE}`,
    })(c, next)
})

app.use(cors())
app.use(secureHeaders())

app.onError(errorhandler)
app.notFound(notFoundHandler)

// app.all('/', (c) => c.json({
//     message: 'Hello Hono!',
// }))

// app.all('/runtime', (c) => c.json({
//     runtime: getRuntimeKey(),
// }))

app.route('/', routes)

if (__DEV__) {
    showRoutes(app, {
        verbose: true,
    })
}

export default app
