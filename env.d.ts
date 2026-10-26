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
        // Lightspeed HQ's PublicEvents entrypoint; answer shapes in docs/event-signups.md.
        HQ: {
          getEvent: (slug: string) => Promise<unknown>
          signUp: (input: {
            sessionId: string
            name: string
            email: string
            website?: string
            turnstileToken?: string
            ip?: string
            origin: string
          }) => Promise<unknown>
          getSignup: (token: string) => Promise<unknown>
          cancel: (input: { token: string, origin: string }) => Promise<unknown>
          listEvents: () => Promise<unknown[]>
        }
      }
      context: ExecutionContext
    }
  }
}
