import massive from 'massive'
import { find } from 'lodash/fp'
import { getDb } from '../src/database/index'
import { log } from '../src/utils/log.utils'
import * as seedData from './data/seed_data'
import { SeedData } from './data/test.types'

let seededData: SeedData

const seedAccount = async (db: massive.Database) => {
  await db.withTransaction(async (tx) => {
    const credentialData = await seedData.credentials()
    const credentialResult = await tx.credential.insert(credentialData)

    const credentials = { Malcolm: find(['username', 'm.reynolds@example.com'], credentialResult) }

    const accountData = await seedData.accounts(credentials)
    return tx.account.insert(accountData)
  })

  const data = await db.query(`
    SELECT
      account.id,
      account.first_name    AS "firstName",
      account.last_name     AS "lastName",
      account.credential_id AS "credentialId",
      credential.username
    FROM account
      INNER JOIN credential ON account.credential_id = credential.id;
  `)

  return {
    Malcolm: { ...find(['username', 'm.reynolds@example.com'], data) },
  }
}

export const seedDatabase = async () => {
  if (seededData) {
    return seededData
  }

  const db = await getDb()
  await resetDatabase(db)
  const accounts = await seedAccount(db)
  log.info('Database seed complete')

  seededData = {
    accounts,
    tokens: seedData.tokens(accounts),
  }

  return seededData
}

async function resetDatabase(db: massive.Database) {
  return db.query(`
  DELETE FROM account;
  DELETE FROM credential;
  `)
}
