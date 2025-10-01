# Inertianest

Inertia.js adapters for Express and Fastify in NestJS applications.

## Installation

```bash
npm install inertianest
```

## Setup

### With Express

```typescript
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { join } from 'path';
import { readFileSync } from 'fs';
import { Request, Response, NextFunction } from 'express';

interface ViteManifestEntry {
  file: string;
  src?: string;
  isEntry?: boolean;
  css?: string[];
  imports?: string[];
}

type ViteManifest = Record<string, ViteManifestEntry>;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Setup view engine (example with ejs)
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');

  // Load manifest.json ke locals supaya bisa dipakai di semua ejs
  const manifestPath = join(
    __dirname,
    '..',
    'public',
    '.vite',
    'manifest.json',
  );

  const manifest = JSON.parse(
    readFileSync(manifestPath, 'utf-8'),
  ) as ViteManifest;
  const entry = manifest['main.js'];

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.viteEntry = entry;
    next();
  });

  await app.listen(3000);
}
```

example `home.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { HomeController } from './home.controller';
import { InertiaModule } from 'inertianest';

@Module({
  imports: [
    InertiaModule.register({
      adapter: 'express',
      view: 'app', // Your base view file name
      version: '1.0',
    }),
  ],
  controllers: [HomeController],
})
export class HomeModule {}
```

### With Fastify

```typescript
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { join } from 'path';
import fastifyView from '@fastify/view';
import ejs from 'ejs';
import { AppModule } from './app.module';

interface ViteManifestEntry {
  file: string;
  src?: string;
  isEntry?: boolean;
  css?: string[];
  imports?: string[];
}

type ViteManifest = Record<string, ViteManifestEntry>;

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  // Register view engine
  await app.register(fastifyView, {
    engine: {
      ejs: ejs,
    },
    root: join(__dirname, '..', 'views')
  });

  // Load manifest.json ke locals supaya bisa dipakai di semua ejs
  const manifestPath = join(
    __dirname,
    '..',
    'public',
    '.vite',
    'manifest.json',
  );

  const manifest = JSON.parse(
    readFileSync(manifestPath, 'utf-8'),
  ) as ViteManifest;
  const entry = manifest['main.js'];

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.viteEntry = entry;
    next();
  });

  await app.listen(3000);
}
```

## Usage

### In your controllers

```typescript
import { Controller, Get } from '@nestjs/common';
import { Render } from 'inertianest';

@Controller()
export class AppController {
  @Get()
  @Render('Home')  // Name of your Inertia component
  index() {
    return {
      title: 'Welcome',
      description: 'This is an Inertia-powered page'
    };
  }
}
```

### Base View Template

For Express (views/app.ejs):
```html
<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <!-- Your assets here -->

    <% if (process.env.NODE_ENV==='development' ) { %>
        <!-- Scripts for development -->
        <script type="module" src="http://localhost:5173/@vite/client"></script>
        <script type="module" src="http://localhost:5173/main.js"></script>
    <% } else { %>
        <!-- Assets for production taken from generated manifest file -->
        <% if (viteEntry.css) { %>
            <link rel="stylesheet" href="/<%= viteEntry.css[0] %>">
        <% } %>
        <script type="module" src="/<%= viteEntry.file %>"></script>
    <% } %>
</head>

<body>
    <div id="app" data-page='<%- inertiaData %>'></div>
    <!-- Your app scripts here -->
</body>

</html>
```

For Fastify (views/app.ejs):
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <!-- Your assets here -->

    <% if (process.env.NODE_ENV==='development' ) { %>
        <!-- Scripts for development -->
        <script type="module" src="http://localhost:5173/@vite/client"></script>
        <script type="module" src="http://localhost:5173/main.js"></script>
    <% } else { %>
        <!-- Assets for production taken from generated manifest file -->
        <% if (viteEntry.css) { %>
            <link rel="stylesheet" href="/<%= viteEntry.css[0] %>">
        <% } %>
        <script type="module" src="/<%= viteEntry.file %>"></script>
    <% } %>
</head>
<body>
    <div id="app" data-page='<%= inertiaData %>'></div>
    <!-- Your app scripts here -->
</body>
</html>
```

## Flash Messages

You can use the `@Flash()` decorator to set flash messages:

```typescript
import { Controller, Post } from '@nestjs/common';
import { Flash } from 'inertianest';

@Controller()
export class AppController {
  @Post('submit')
  @Flash({ message: 'Data saved successfully!' })
  @Render('Result')
  submit() {
    return { success: true };
  }
}
```

## Build

```json
"build": "nest build && cd client && vite build",
"dev": "NODE_ENV=development concurrently \"npm:start:debug\" \"npm:start:client\" -c \"blue,green\" -k",
"start:client": "cd client && vite",
```

## Depedencies

if use vue

```json
    "@inertiajs/inertia",
    "@inertiajs/progress",
    "@inertiajs/vue3",
    "concurrently",
    "ejs",
    // "laravel-vite-plugin",
    "vue",
    "unplugin-auto-import",
    "unplugin-icons",
    "unplugin-vue-components",
    "vite",
    "vite-svg-loader",
    "@vitejs/plugin-vue",
```

### Vue Setup

create `client/main.js`

```js
import { createApp, h } from 'vue';
import { InertiaProgress } from '@inertiajs/progress';
import { createInertiaApp } from '@inertiajs/vue3';
// import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

// Initialize progress bar
InertiaProgress.init();

// Create Inertia app
createInertiaApp({
  title: (title) => `${title} - Example`,
  
  resolve: name => {
    const pages = import.meta.glob('./pages/**/*.vue', { eager: true })
    return pages[`./pages/${name}.vue`]
  },
  // resolve: (name) => resolvePageComponent(`./pages/${name}.vue`, import.meta.glob('./pages/**/*.vue')),

  setup({ el, App, props, plugin }) {
    createApp({ render: () => h(App, props) })
      .use(plugin)
      .mount(el)
  },
});
```

create `client/vite.config.js`

```js
import { resolve } from 'path';
import Vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import Components from 'unplugin-vue-components/vite';
import { HeadlessUiResolver } from 'unplugin-vue-components/resolvers';
import SvgLoader from 'vite-svg-loader';

export default () => ({
  publicDir: 'fake_dir_so_nothing_gets_copied',
  build: {
    manifest: true,
    outDir: resolve(__dirname, '../public'),
    rollupOptions: {
      input: './main.js',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
  plugins: [
    Vue({}),

    AutoImport({
      imports: [
        'vue',
        {
          '@inertiajs/inertia': ['Inertia'],
          '@inertiajs/vue3': ['usePage', 'useForm'],
        },
      ],
      dts: false,
    }),

    // https://github.com/antfu/unplugin-vue-components
    Components({
      dirs: ['components', 'layouts'],
      dts: false,
      resolvers: [
        IconsResolver({
          componentPrefix: '',
        }),
        HeadlessUiResolver(),
        (name) => {
          if (['Head', 'Link'].includes(name)) {
            return {
              from: '@inertiajs/vue3',
              name: name,
            };
          }
        },
      ],
    }),

    Icons(),

    SvgLoader(),
  ],
});
```

create `client/layouts/Main.vue`

```vue
<script>

</script>

<template>
    <main>
        <slot />
    </main>
</template>
```

create `client/pages/Home.vue`

```vue
<script setup>
import Main from '@/layouts/Main.vue';
defineProps({
  title: String,
  description: String,
});
</script>

<template>
  <Main>
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>
  </Main>
</template>
```

---

## Security

If you've found a bug regarding security, please mail [labkita.my.id@gmail.com](mailto:labkita.my.id@gmail.com) instead of
using the issue tracker.

## License

The MIT License (MIT). Please see [License File](license.md) for more information.