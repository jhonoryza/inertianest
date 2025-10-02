import { FastifyRequest, FastifyReply } from 'fastify'
import { InertiaFastify } from './InertiaFastify'

declare module 'fastify' {
  interface FastifyReply {
    inertia: InertiaFastify
  }
}

export const inertia = (options?: {
  view?: string
  version?: string
  manifest?: any
}) => {
  const { view = 'app', version = '1', manifest } = options || {}

  InertiaFastify.setConfig({
    view,
    version,
    manifest,
  })

  return async (request: FastifyRequest, reply: FastifyReply) => {
    reply.inertia = new InertiaFastify(request, reply)
  }
}