import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor, Logger } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { InertiaExpress } from "./InertiaExpress";
import { InertiaFastify } from "./InertiaFastify";

const REFLECTOR = "Reflector";

@Injectable()
export class InertiaInterceptor implements NestInterceptor {

  constructor(
    @Inject(REFLECTOR) protected readonly reflector: any,
    @Inject("INERTIA_ADAPTER") private readonly adapter: "express" | "fastify",
    @Inject("INERTIA_CONFIG") private readonly config: any,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();

    const component = this.reflector.get("inertia", context.getHandler());


    if (!component) {
      return next.handle();
    }

    // Setup inertia instance if not exists
    if (!res.inertia) {
      if (this.adapter === "express") {
        const inertia = new InertiaExpress(req, res);
        InertiaExpress.setConfig(this.config);
        res.inertia = inertia;
      } else {
        const inertia = new InertiaFastify(req, res);
        InertiaFastify.setConfig(this.config);
        res.inertia = inertia;
      }
    }

    return next.handle().pipe(
      map((data) => {

        // Try direct props first
        if (!data.hasOwnProperty('props')) {
          return res.inertia.render(component, data, { return: true });
        }

        // Handle structured format
        const { props = {}, viewData, flash, statusCode } = data;
        
        if (viewData) {
          Object.entries(viewData).forEach(([key, value]) => {
            res.inertia.withViewData(key, value);
          });
        }

        if (flash) {
          res.inertia.withFlash(flash);
        }

        if (statusCode) {
          res.inertia.setStatusCode(statusCode);
        }

        const result = res.inertia.render(component, props, { return: true });
        return result;
      }),
    );
  }
}
