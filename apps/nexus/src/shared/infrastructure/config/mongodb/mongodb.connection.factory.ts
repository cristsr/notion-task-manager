import { ConfigService } from '@nestjs/config';
import { MongooseModuleFactoryOptions } from '@nestjs/mongoose';

export class MongodbConnectionFactory {
  static create() {
    return async (
      config: ConfigService,
    ): Promise<MongooseModuleFactoryOptions> => {
      return {
        uri: config.get('MONGO_DB_URI'),
        dbName: config.get('MONGO_DB_NAME'),
      };
    };
  }
}
