import type {
  CfProperties,
  D1Database,
  ExecutionContext,
  Request,
} from '@cloudflare/workers-types'

declare module 'h3' {
  interface H3EventContext {
    cf: CfProperties
    cloudflare: {
      request: Request
      env: {
        D1: D1Database
      }
      context: ExecutionContext
    }
  }
}
