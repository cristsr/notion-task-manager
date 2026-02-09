import { Global, Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationModule } from './notification/notification.module';
import { TaskModule } from './daily/task.module';
import { SharedModule } from './shared/shared.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    HttpModule.register({
      global: true,
    }),
    ScheduleModule.forRoot(),
    SharedModule,
    TaskModule,
    NotificationModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        always: true,
      }),
    },
  ],
  exports: [],
})
export class AppModule {}
