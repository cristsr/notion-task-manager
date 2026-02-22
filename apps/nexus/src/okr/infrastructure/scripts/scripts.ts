import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../../../app.module';
import { Settings } from 'luxon';
import { OkrTaskUpdate } from '@okr/infrastructure/scripts/index';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const config = app.get<any>(ConfigService);

  Settings.defaultZone = config.get('TIME_ZONE');

  const service = app.get(OkrTaskUpdate);

  service.execute();
}

bootstrap();
