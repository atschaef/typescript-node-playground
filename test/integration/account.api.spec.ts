import request from 'supertest'
import { expect } from 'chai'
import { createSandbox } from 'sinon'
import jwt from 'jsonwebtoken'
import { pick, keys } from 'lodash/fp'
import { v4 } from 'uuid'
import app from '../../app'
import { getDb } from '../../src/database'
import { AuthToken, CreateAccount } from '../../src/types/app.types'
import { createAuthToken } from '../../src/utils/auth.utils'
import { AccountFields } from '../data/graphql.data'
import { SeedData, SeedAccounts, SeedTokens } from '../data/test.types'
import { seedDatabase } from '../test_utils'

describe('-- Account API --', () => {
  const testSandbox = createSandbox()
  const error = new Error('Oops')

  let accounts: SeedAccounts
  let tokens: SeedTokens

  before(async () => {
    ;({ accounts, tokens } = (await seedDatabase()) as SeedData)
  })

  afterEach(() => {
    testSandbox.resetHistory()
  })

  after(() => {
    testSandbox.restore()
  })

  describe('MUTATION createAccount', () => {
    const fields = `{ token account { ${AccountFields.replace('id', '').replace('credentialId', '')} } }`
    const account = {
      password: 'unbowed unbent unbroken',
      username: 'red.viper@unself.com',
      firstName: 'Oberyn',
      lastName: 'Martell',
    }

    it('should return a token if successful user creation with case-insensitive username', () =>
      request(app)
        .post('/graphql')
        .send({
          query: `mutation($account: CreateAccount!) { createAccount(account: $account) ${fields} }`,
          variables: { account: { ...account, username: account.username.toUpperCase() } },
        })
        .expect(({ body }: any) => {
          expect(pick(['data.createAccount.account'], body)).to.deep.equal({
            data: {
              createAccount: {
                account: pick<CreateAccount, keyof CreateAccount>(['username', 'firstName', 'lastName'], account),
              },
            },
          })

          const payload = jwt.decode(body.data.createAccount.token) as AuthToken
          expect(keys(payload)).to.have.members(['iat', 'exp', 'credentialId', 'accountId'])
        })
        .expect(200)
        .then(async () => {
          const db = await getDb()
          const count = await db.credential.destroy({ username: account.username })
          expect(count).to.have.length(1)
        }))

    it('should return error if username is already in use', () =>
      request(app)
        .post('/graphql')
        .send({
          query: `mutation($account: CreateAccount!) { createAccount(account: $account) ${fields} }`,
          variables: { account: { ...account, username: accounts.Malcolm.username } },
        })
        .expect(200, {
          data: { createAccount: null },
          errors: [
            {
              extensions: {
                code: 'INTERNAL_SERVER_ERROR',
                exception: {
                  code: 409,
                  msg: 'This username is already in use.',
                  name: 'Conflict',
                },
              },
              locations: [{ column: 38, line: 1 }],
              message: 'This username is already in use.',
              path: ['createAccount'],
            },
          ],
        }))

    it('should rollback creation and return an error if an unknown database error occurs', async () => {
      const db = await getDb()
      const query = testSandbox.stub(db, 'query').throws(error)

      return request(app)
        .post('/graphql')
        .send({
          query: `mutation($account: CreateAccount!) { createAccount(account: $account) ${fields} }`,
          variables: { account },
        })
        .expect(200, {
          data: { createAccount: null },
          errors: [
            {
              extensions: {
                code: 'INTERNAL_SERVER_ERROR',
                exception: {
                  code: 500,
                  msg: 'Oops, something went wrong creating your account. Please try again later.',
                  name: 'InternalError',
                },
              },
              locations: [{ column: 38, line: 1 }],
              message: 'Oops, something went wrong creating your account. Please try again later.',
              path: ['createAccount'],
            },
          ],
        })
        .then(async () => {
          query.restore()
          expect(await db.credential.find({ username: account.username })).to.have.length(0)
          expect(await db.account.find({ first_name: account.firstName })).to.have.length(0)
        })
        .catch((err) => {
          query.restore()
          throw err
        })
    })
  })

  describe('QUERY me', () => {
    const fields = `{ ${AccountFields} }`

    it('should return the currently logged in account', () =>
      request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${tokens.Malcolm}`)
        .send({
          query: `query { me ${fields} }`,
        })
        .expect(200, {
          data: { me: accounts.Malcolm },
        }))

    it('should return an error if account is not found', () =>
      request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${createAuthToken(v4(), v4())}`)
        .send({ query: `query { me ${fields} }` })
        .expect(200, {
          data: { me: null },
          errors: [
            {
              extensions: {
                code: 'INTERNAL_SERVER_ERROR',
                exception: {
                  code: 404,
                  msg: 'Oops, we could not find the account you requested.',
                  name: 'NotFound',
                },
              },
              locations: [{ column: 9, line: 1 }],
              message: 'Oops, we could not find the account you requested.',
              path: ['me'],
            },
          ],
        }))

    it('should return an error if there is no token', () =>
      request(app)
        .post('/graphql')
        .send({ query: `query { me ${fields} }` })
        .expect(200, {
          data: { me: null },
          errors: [
            {
              extensions: {
                code: 'INTERNAL_SERVER_ERROR',
                exception: {
                  code: 401,
                  msg: 'No authorization token was found.',
                  name: 'Unauthorized',
                },
              },
              locations: [{ column: 9, line: 1 }],
              message: 'No authorization token was found.',
              path: ['me'],
            },
          ],
        }))
  })
})
