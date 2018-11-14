import { getDb } from '.'
import { CreateAccount, Account } from '../types/app.types'

const accountFields = `
  account.id,
  credential.username,
  account.first_name    AS "firstName",
  account.last_name     AS "lastName",
  account.credential_id AS "credentialId"
`

export const account = async (accountId: string) => {
  const db = await getDb()

  const [account]: Array<Account> = await db.query(
    `
    SELECT ${accountFields}
    FROM account
      INNER JOIN credential ON account.credential_id = credential.id
    WHERE account.id = \${accountId}
    LIMIT 1;`,
    { accountId } as any,
  )

  return account
}

export const createAccount = async (createAccount: CreateAccount) => {
  const db = await getDb()

  const [account]: Array<Account> = await db.query(
    `
    WITH new_account AS (
      INSERT INTO credential (username, password) VALUES (LOWER(\${username}), \${password})
      RETURNING credential.id
    )
    INSERT INTO account (first_name, last_name, credential_id) VALUES (\${firstName}, \${lastName}, (SELECT new_account.id FROM new_account));
    
    SELECT ${accountFields}
    FROM account
      INNER JOIN credential ON account.credential_id = credential.id
    WHERE credential.username = LOWER(\${username})
    LIMIT 1;`,
    { ...createAccount } as any,
  )

  return account
}
