import bcrypt from 'bcrypt'
import { SeedCredentials, SeedAccounts } from './test.types'
import { createAuthToken } from '../../src/utils/auth.utils'

export const password = 'LunaTuna!1'

export const credentials = async () => {
  const passwordHash = await bcrypt.hash(password, 10)
  return [{ username: 'm.reynolds@example.com', password: passwordHash }]
}

export const accounts = (credentials: SeedCredentials) => {
  return [{ first_name: 'Malcolm', last_name: 'Reynolds', credential_id: credentials.Malcolm.id }]
}

export const tokens = (accounts: SeedAccounts) => {
  return {
    Malcolm: createAuthToken(accounts.Malcolm.id, accounts.Malcolm.credentialId),
  }
}
