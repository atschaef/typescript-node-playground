import bcrypt from 'bcrypt'
import * as credentialDb from '../database/credential.db'
import * as accountDb from '../database/account.db'
import { UnauthorizedError, BadRequestError } from '../utils/error.utils'
import { Credential } from '../types/app.types'
import { createAuthToken } from '../utils/auth.utils'

export const login = async ({ username, password }: Credential) => {
  try {
    const credential = await credentialDb.credential(username)

    await validatePassword(password, credential.password!)

    const account = await accountDb.account(credential.accountId)

    const token = createAuthToken(account.id, account.credentialId)
    return { token, account }
  } catch (err) {
    throw new BadRequestError('Unknown username or password.', err)
  }
}

// export const decodeAuthToken = (token: string, options?: VerifyOptions) => {
//   try {
//     return jwt.verify(token, config.TOKEN_SECRET, options) as AuthToken
//   } catch (err) {
//     throw new UnauthorizedError('Invalid authentication token.', err)
//   }
// }

// export const refreshUserAuthToken = async (oldToken: string) => {
//   // FIXME: determine way to revoke token (e.g. store hash pass/cred update timestamp (unix) in token, reject if pass changes)
//   const { userCredentialId, userId } = decodeAuthToken(oldToken, { maxAge, ignoreExpiration: true })

//   return { token: await getAuthToken(userCredentialId, userId) }
// }

async function validatePassword(password: string, dbPassword: string) {
  const success = await bcrypt.compare(password, dbPassword)

  if (!success) {
    throw new UnauthorizedError('Invalid credentials provided.')
  }
}
