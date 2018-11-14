import request from 'supertest'
import { expect } from 'chai'
import { createSandbox, SinonStub } from 'sinon'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import { config } from '../../config'
import app from '../../app'
import { PingResult } from '../../src/types/app.types'

describe('-- Ping API --', () => {
  it('should return a 200', () =>
    request(app)
      .get('/ping')
      .expect(200)
      .expect(({ body }: { body: PingResult }) => {
        expect(body.version).to.equal(process.env.VERSION)
        expect(body.message).to.equal('pong')
        expect(body.uptime).to.be.a('string')
        expect(body.runningSince)
          .to.be.a('string')
          .and.to.have.length(24)
      }))
})

describe('-- Not Found Route --', () => {
  it('should return a 404', () =>
    request(app)
      .get('/not/a/route')
      .expect(404, {
        errors: [
          {
            message: 'Could not find the requested route.',
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
              exception: {
                code: 404,
                msg: 'Could not find the requested route.',
                name: 'NotFound',
              },
            },
          },
        ],
      }))
})

describe('-- Authentication --', () => {
  const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

  it('should reject if the token exists, but is not valid', () =>
    request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: 'query { me { firstName } }' })
      .expect(200, {
        data: { me: null },
        errors: [
          {
            locations: [{ column: 9, line: 1 }],
            message: 'Your session has expired.',
            path: ['me'],
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
              exception: {
                code: 401,
                msg: 'Your session has expired.',
                name: 'Unauthorized',
              },
            },
          },
        ],
      }))

  it('should reject if the token exists, but has no accountId', () => {
    const token = jwt.sign({}, config.TOKEN_SECRET, { expiresIn: config.TOKEN_EXPIRES_IN })

    return request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({
        query: 'query { me { firstName } }',
      })
      .expect(200, {
        data: { me: null },
        errors: [
          {
            locations: [{ column: 9, line: 1 }],
            message: 'Your session has expired.',
            path: ['me'],
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
              exception: {
                code: 401,
                msg: 'Your session has expired.',
                name: 'Unauthorized',
              },
            },
          },
        ],
      })
  })
})

describe('-- Block EU --', () => {
  const testSandbox = createSandbox()
  const credentials = { password: `no no no danger's my middle name`, username: 'austin.powers@example.com' }
  let getIPLocation: SinonStub

  before(() => {
    getIPLocation = testSandbox.stub(axios, 'get')
  })

  afterEach(() => {
    testSandbox.resetHistory()
  })

  after(() => {
    testSandbox.restore()
  })

  it('should return an error if the user is in the EU', () => {
    getIPLocation.resolves({ data: { continent_code: 'EU' } })

    return request(app)
      .post('/graphql')
      .send({
        query: `query($credentials: Credentials) { login(credentials: $credentials) { token } }`,
        variables: { credentials },
      })
      .expect(200, {
        data: { login: null },
        errors: [
          {
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
              exception: {
                code: 451,
                msg: 'Unfortunately EU members aren’t allowed to use our app until we become GDPR compliant.',
                name: 'UnavailableForLegalReasons',
              },
            },
            locations: [{ column: 36, line: 1 }],
            message: 'Unfortunately EU members aren’t allowed to use our app until we become GDPR compliant.',
            path: ['login'],
          },
        ],
      })
  })

  it('should return an error if the IP geolocation call fails', () => {
    getIPLocation.throws()

    return request(app)
      .post('/graphql')
      .send({
        query: `query($credentials: Credentials) { login(credentials: $credentials) { token } }`,
        variables: { credentials },
      })
      .expect(200, {
        data: { login: null },
        errors: [
          {
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
              exception: {
                code: 502,
                msg: 'A data provider seems to be down right now. Try again later.',
                name: 'ExternalError',
              },
            },
            locations: [{ column: 36, line: 1 }],
            message: 'A data provider seems to be down right now. Try again later.',
            path: ['login'],
          },
        ],
      })
  })
})
