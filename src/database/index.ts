import massive from 'massive'
import monitor from 'pg-monitor'
import { config } from '../../config'

let database: massive.Database

export const getDb = async () => {
  if (!database) {
    database = await massive(config.DATABASE_URL)
  }

  if (config.DATABASE_DEBUG && !monitor.isAttached()) {
    monitor.attach(database.driverConfig)
  }

  return database
}
