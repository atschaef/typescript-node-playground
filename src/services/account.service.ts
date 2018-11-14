import * as accountDb from '../database/account.db'
import { NotFoundError, InternalError, ConflictError } from '../utils/error.utils'
import { CreateAccount } from '../types/app.types'
import { createAuthToken } from '../utils/auth.utils'

export const createAccount = async (createAccount: CreateAccount) => {
  try {
    const account = await accountDb.createAccount(createAccount)
    const token = createAuthToken(account.id, account.credentialId)

    return { token, account }
  } catch (err) {
    if (err.code === '23505') {
      throw new ConflictError('This username is already in use.')
    }

    throw new InternalError('Oops, something went wrong creating your account. Please try again later.')
  }
}

export const getAccount = async (accountId: string) => {
  const account = await accountDb.account(accountId)

  if (!account) {
    throw new NotFoundError('Oops, we could not find the account you requested.')
  }

  return account
}
