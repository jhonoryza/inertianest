import { APP_INTERCEPTOR } from '@nestjs/core'
import { DynamicModule, Module } from '@nestjs/common'
import { InertiaInterceptor } from './inertia.interceptor'
import { FlashInterceptor } from './flash.interceptor'

// inertia.module.ts
export interface InertiaModuleOptions {
  adapter: 'express' | 'fastify';
  view?: string;
  version?: string;
  manifest?: any;
}

@Module({})
export class InertiaModule {
  static register(options: InertiaModuleOptions): DynamicModule {
    const adapterProvider = {
      provide: 'INERTIA_ADAPTER',
      useValue: options.adapter
    };

    const configProvider = {
      provide: 'INERTIA_CONFIG',
      useValue: {
        view: options.view || 'app',
        version: options.version || '1',
        manifest: options.manifest
      }
    };

    return {
      module: InertiaModule,
      providers: [
        adapterProvider,
        configProvider,
        {
          provide: APP_INTERCEPTOR,
          useClass: InertiaInterceptor
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: FlashInterceptor
        }
      ],
      exports: [adapterProvider, configProvider]
    };
  }
}