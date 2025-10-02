import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http'
import '@fastify/view'

declare module 'fastify' {
  interface FastifyReply {
    view(template: string, data: object): Promise<string>
  }
}

export interface InertiaResponse {
  component: string
  props: Record<string, unknown>
  url: string
  version: number | string
  viewData?: Record<string, any>
}

export interface RequestData {
  method: string
  url: string
  headers: IncomingHttpHeaders
  originalUrl?: string
}

export interface ResponseData {
  statusCode: number
  headers: OutgoingHttpHeaders
  data: string | null
  isInertia: boolean
  viewData?: Record<string, any>
}

export interface LazyFunction extends Function {
  _lazy?: boolean
}

export type ResponseHandler<T> = (
  data: {
    statusCode: number
    headers: OutgoingHttpHeaders
    data: string | null
    isInertia: boolean
  },
  options?: T
) => void | string | null | Promise<void | string | null>
