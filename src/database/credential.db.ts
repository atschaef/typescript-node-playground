import { getDb } from '.'
import { Credential } from '../types/app.types'

type AccountCredentials = Credential & { accountId: string }

export const credential = async (username: string) => {
  const db = await getDb()

  const [credential]: Array<AccountCredentials> = await db.query(
    `
    SELECT
      account.id AS "accountId",
      credential.id,
      credential.password
    FROM credential
      LEFT OUTER JOIN account ON credential.id = account.credential_id
    WHERE username = LOWER(\${username})
    LIMIT 1;`,
    { username } as any,
  )

  return credential
}
