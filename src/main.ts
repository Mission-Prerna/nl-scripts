import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  const config = new DocumentBuilder()
    .setTitle('NestJs Starter')
    .setDescription('Template for starter NestJs project')
    .setVersion('1.0')
    .addTag('template')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  await app.listen(3000);
}
bootstrap();
