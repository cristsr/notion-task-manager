import { Global, Module } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import {
  NotionClient,
  NotionClientFactory,
} from './infrastructure/config/notion';
import {
  LokidbConnection,
  LokidbConnectionFactory,
} from './infrastructure/config/lokidb';
import {
  HealthcheckController,
  NotionController,
} from './infrastructure/adapters/http';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import {
  MongodbConnection,
  MongodbConnectionFactory,
} from './infrastructure/config/mongodb';
import { Connection } from 'mongoose';
import { APP_GUARD } from '@nestjs/core';
import { BasicAuthGuard } from './infrastructure/guards';
import { EventEmitterPort } from './application/ports';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { I18nFactory, I18nService } from './infrastructure/config/i18n';

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      global: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: MongodbConnectionFactory.create(),
      inject: [ConfigService],
    }),
  ],
  controllers: [HealthcheckController, NotionController],
  providers: [
    {
      provide: Cache,
      useExisting: CACHE_MANAGER,
    },
    {
      provide: EventEmitterPort,
      useExisting: EventEmitter2,
    },
    {
      provide: NotionClient,
      useFactory: NotionClientFactory.getClient(),
      inject: [ConfigService],
    },
    {
      provide: LokidbConnection,
      useFactory: LokidbConnectionFactory.create(),
      inject: [ConfigService],
    },
    {
      provide: MongodbConnection,
      useFactory: (conn: Connection) => conn,
      inject: [getConnectionToken()],
    },
    {
      provide: APP_GUARD,
      useClass: BasicAuthGuard,
    },
    {
      provide: I18nService,
      useFactory: I18nFactory.create(),
      inject: [ConfigService],
    },
  ],
  exports: [NotionClient, Cache, LokidbConnection, I18nService],
})
export class SharedModule {}
