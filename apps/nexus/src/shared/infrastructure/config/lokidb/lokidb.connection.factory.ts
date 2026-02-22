import { ConfigService } from '@nestjs/config';
import { LokidbConnection } from './lokidb.connection';
import { FSStorage } from '@lokidb/fs-storage';

export class LokidbConnectionFactory {
  static create() {
    return async (config: ConfigService) => {
      const lokidbName = config.get('LOKI_DB_NAME');

      const connection = new LokidbConnection(lokidbName, {
        serializationMethod: 'pretty',
      });

      await connection.initializePersistence({
        adapter: new FSStorage(),
        autoload: true,
        autosave: true,
        autosaveInterval: 4000,
      });

      return connection;
    };
  }
}
