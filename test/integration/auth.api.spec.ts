import request from 'supertest'
import { expect } from 'chai'
import { createSandbox } from 'sinon'
import jwt from 'jsonwebtoken'
import { pick, keys } from 'lodash/fp'

import app from '../../app'
import { Account, AuthToken } from '../../src/types/app.types'
import { password } from '../data/seed_data'
import { SeedAccounts, SeedData } from '../data/test.types'
import { AccountFields } from '../data/graphql.data'
import { seedDatabase } from '../test_utils'

describe('-- Auth API --', () => {
  const testSandbox = createSandbox()
  // const error = new Error('Oops')

  let accounts: SeedAccounts

  before(async () => {
    ;({ accounts } = (await seedDatabase()) as SeedData)
  })

  afterEach(() => {
    testSandbox.resetHistory()
  })

  after(() => {
    testSandbox.restore()
  })

  describe('MUTATION login', () => {
    const fields = `{ token account { ${AccountFields} } }`

    it('should return a token if successful login with case-insensitive email', () =>
      request(app)
        .post('/graphql')
        .send({
          query: `query($credentials: Credentials) { login(credentials: $credentials) ${fields} }`,
          variables: {
            credentials: {
              password,
              username: accounts.Malcolm.username,
            },
          },
        })
        .expect(({ body }: any) => {
          expect(pick(['data.login.account'], body)).to.deep.equal({
            data: {
              login: {
                account: pick<Account, keyof Account>(
                  ['id', 'username', 'firstName', 'lastName', 'credentialId'],
                  accounts.Malcolm,
                ),
              },
            },
          })

          const payload = jwt.decode(body.data.login.token) as AuthToken
          expect(keys(payload)).to.have.members(['iat', 'exp', 'credentialId', 'accountId'])
          expect(pick<AuthToken, keyof AuthToken>(['accountId', 'credentialId'], payload)).to.deep.equal({
            accountId: accounts.Malcolm.id,
            credentialId: accounts.Malcolm.credentialId,
          })
        })
        .expect(200))

    it('should return an error if the account doesn’t exit', () =>
      request(app)
        .post('/graphql')
        .send({
          query: `query($credentials: Credentials) { login(credentials: $credentials) ${fields} }`,
          variables: {
            credentials: {
              password,
              username: 'cayde6@example.com',
            },
          },
        })
        .expect(200, {
          data: { login: null },
          errors: [
            {
              extensions: {
                code: 'INTERNAL_SERVER_ERROR',
                exception: {
                  code: 400,
                  msg: 'Unknown username or password.',
                  name: 'BadRequest',
                },
              },
              locations: [{ column: 36, line: 1 }],
              message: 'Unknown username or password.',
              path: ['login'],
            },
          ],
        }))

    it('should return an error if an invalid password is provided', () =>
      request(app)
        .post('/graphql')
        .send({
          query: `query($credentials: Credentials) { login(credentials: $credentials) ${fields} }`,
          variables: {
            credentials: {
              password: 'bad password ah!',
              username: accounts.Malcolm.username,
            },
          },
        })
        .expect(200, {
          data: { login: null },
          errors: [
            {
              extensions: {
                code: 'INTERNAL_SERVER_ERROR',
                exception: {
                  code: 400,
                  msg: 'Unknown username or password.',
                  name: 'BadRequest',
                },
              },
              locations: [{ column: 36, line: 1 }],
              message: 'Unknown username or password.',
              path: ['login'],
            },
          ],
        }))
  })
})
