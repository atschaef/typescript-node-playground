import { Credential, Account } from '../../src/types/app.types'

export type SeedCredentials = {
  Malcolm: Credential
}

export type SeedAccounts = {
  Malcolm: Account
}
export type SeedTokens = {
  Malcolm: string
}

export type SeedData = {
  accounts: SeedAccounts
  tokens: SeedTokens
}
