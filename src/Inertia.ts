import {
  RequestData,
  ResponseData,
  InertiaResponse,
  LazyFunction,
} from './types'
import { HEADERS, getObjectValue } from './utils'

interface InertiaConfig {
  view: string
  version: string | number
  manifest?: Record<string, any>
}

export abstract class Inertia {
  protected statusCode: number = 200
  protected sharedData: Record<string, unknown> = {}
  protected viewData: Record<string, any> = {}
  protected customHeaders: Record<string, string> = {}

  protected static config: InertiaConfig = {
    view: 'app',
    version: '1',
  }

  constructor(protected req: RequestData) {}

  static setConfig(config: InertiaConfig) {
    Inertia.config = {
      ...Inertia.config,
      ...config,
    }
  }

  static lazy<F extends LazyFunction>(fn: F): F {
    fn._lazy = true
    return fn
  }

  abstract render(
    component: string,
    props?: Record<string, any>,
    options?: { return: boolean }
  ): Promise<void | string | null>

  share(data: Record<string, unknown>) {
    this.sharedData = data
    return this
  }

  getShared(key: string, defaultValue?: unknown) {
    return this.sharedData[key] || defaultValue
  }

  flushShared() {
    this.sharedData = {}
    return this
  }

  setStatusCode(code: number) {
    this.statusCode = code
    return this
  }

  withViewData(key: string, value: any) {
    if (!this.viewData) {
      this.viewData = {}
    }
    this.viewData[key] = value
    return this
  }

  withError(errors: Record<string, string[]>) {
    return this.with('errors', errors)
  }

  withFlash(message: string | Record<string, any>) {
    if (typeof message === 'string') {
      return this.with('flash', { message })
    }
    return this.with('flash', message)
  }

  with(key: string, value: any) {
    if (!this.sharedData) {
      this.sharedData = {}
    }
    this.sharedData[key] = value
    return this
  }

  withHeaders(headers: Record<string, string>) {
    if (!this.customHeaders) {
      this.customHeaders = {}
    }
    this.customHeaders = { ...this.customHeaders, ...headers }
    return this
  }

  getHeader(name: string) {
    return getObjectValue(this.req.headers, name) as string
  }

  async getReponseData({
    component,
    props,
  }: {
    component: string
    props?: Record<string, any>
  }): Promise<ResponseData> {
    const isInertia = this.getHeader(HEADERS.INERTIA) === 'true'
    const partialData = this.getHeader(HEADERS.INERTIA_PARTIAL_DATA)
    const partialComponent = this.getHeader(
      HEADERS.INERTIA_PARTIAL_DATA_COMPONENT
    )
    const requestAssetVersion = this.getHeader(HEADERS.INERTIA_VERSION)

    const page: InertiaResponse = {
      version: Inertia.config.version,
      component,
      props: {},
      url: this.req.originalUrl || this.req.url,
    }

    const isGet = this.req.method === 'GET'
    const assetsChanged =
      requestAssetVersion && requestAssetVersion !== Inertia.config.version

    if (isInertia && isGet && assetsChanged) {
      return {
        statusCode: 409,
        headers: {
          [HEADERS.INERTIA_LOCATION]: this.req.url,
        },
        data: null,
        isInertia: true,
      }
    }

    const combinedProps: Record<string, any> = {
      ...this.sharedData,
      ...props,
    }
    const partialRequested = partialData && partialComponent === component

    const keys: string[] = partialRequested
      ? partialData.split(',').filter(Boolean)
      : Object.keys(combinedProps)

    for (const key of keys) {
      if (typeof combinedProps[key] === 'function') {
        if (!partialRequested && combinedProps[key]._lazy) continue

        page.props[key] = await combinedProps[key]()
      } else {
        page.props[key] = combinedProps[key]
      }
    }

    const data = JSON.stringify(page)

    return {
      statusCode: this.statusCode,
      headers: {
      ...isInertia
        ? {
            [HEADERS.CONTENT_TYPE]: 'application/json',
            [HEADERS.VARY]: 'accept',
            [HEADERS.INERTIA]: 'true',
          }
        : {
            [HEADERS.CONTENT_TYPE]: 'text/html; charset=utf-8',
          },
      ...this.customHeaders,
    },
      data,
      isInertia,
      viewData: this.viewData,
    }
  }
}
