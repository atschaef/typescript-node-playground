import { get, flow, isEqual, defaultTo, isEmpty } from 'lodash/fp'
import { skip } from 'graphql-resolvers'
import axios from 'axios'
import { isUUID } from 'validator'
import jwt from 'jsonwebtoken'

import { UnauthorizedError, UnavailableForLegalReasons, ExternalError } from './error.utils'
import { AuthToken, GraphQLInfo, GraphQLContext } from '../types/app.types'
import { config, Environment } from '../../config'

type MaybeAuthenticatedContext = Pick<GraphQLContext, Exclude<keyof GraphQLContext, 'token'>> & {
  token: Partial<AuthToken>
}

export const verifyAuthorization = (token?: string) => {
  if (!token || isEmpty(token)) {
    throw new UnauthorizedError('No authorization token was found.')
  }

  try {
    jwt.verify(defaultTo('', token), config.TOKEN_SECRET!, { algorithms: ['HS256'] })
  } catch (err) {
    throw new UnauthorizedError('Your session has expired.')
  }
}

export const isAuthenticated = (_: {}, __: {}, { token, rawToken }: MaybeAuthenticatedContext) => {
  verifyAuthorization(rawToken)

  if (!token.accountId || !isUUID(token.accountId)) {
    throw new UnauthorizedError('Your session has expired.')
  }

  return skip
}

/* istanbul ignore next */
export const hasCredentials = (_: {}, __: {}, { token, rawToken }: MaybeAuthenticatedContext) => {
  verifyAuthorization(rawToken)

  if (!token.credentialId || !isUUID(token.credentialId)) {
    throw new UnauthorizedError('Your session has expired.')
  }

  return skip
}

/* istanbul ignore next */
export const getFieldNode = (queryName: string, info: GraphQLInfo) => {
  return info.fieldNodes.filter(
    flow(
      get('name.value'),
      isEqual(queryName),
    ),
  )
}

export const blockEU = async (_: {}, __: {}, { ip }: MaybeAuthenticatedContext) => {
  let result

  /* istanbul ignore next */
  if (config.ENV === Environment.Development) {
    return skip
  }

  try {
    const sanitizedIP = ip.replace(/.*\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/, '$1')
    result = await axios.get<{ continent_code: string }>(
      `http://api.ipaddress.com/iptocountry?format=json&ip=${sanitizedIP}`,
    )
  } catch (err) {
    throw new ExternalError('A data provider seems to be down right now. Try again later.')
  }

  if (result.data.continent_code === 'EU') {
    throw new UnavailableForLegalReasons(
      'Unfortunately EU members aren’t allowed to use our app until we become GDPR compliant.',
    )
  }

  return skip
}
