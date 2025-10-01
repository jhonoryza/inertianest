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

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Setup view engine (example with ejs)
  app.setViewEngine('ejs');
  app.setBaseViewsDir(join(__dirname, '..', 'views'));

  // Import InertiaModule in your AppModule
  // @Module({
  //   imports: [
  //     InertiaModule.register({
  //       adapter: 'express',
  //       view: 'app', // Your base view file name
  //       version: '1.0'
  //     })
  //   ]
  // })

  await app.listen(3000);
}
```

### With Fastify

```typescript
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { join } from 'path';
import fastifyView from '@fastify/view';
import ejs from 'ejs';
import { AppModule } from './app.module';

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

  // Import InertiaModule in your AppModule
  // @Module({
  //   imports: [
  //     InertiaModule.register({
  //       adapter: 'fastify',
  //       view: 'app', // Your base view file name
  //       version: '1.0'
  //     })
  //   ]
  // })

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