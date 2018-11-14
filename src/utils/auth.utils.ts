import jwt from 'jsonwebtoken'
import { config } from '../../config'

export const createAuthToken = (accountId: string, credentialId: string) => {
  return jwt.sign({ accountId, credentialId }, config.TOKEN_SECRET, { expiresIn: config.TOKEN_EXPIRES_IN })
}
