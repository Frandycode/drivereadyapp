/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  Observable,
  split,
  from,
  ApolloLink,
  gql,
} from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'
import { onError } from '@apollo/client/link/error'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const WS_URL  = import.meta.env.VITE_WS_URL  || 'ws://localhost:8000'

// ── In-memory access token (never touches localStorage) ───────────────────────
let _accessToken: string | null = null
let _refreshTimer: ReturnType<typeof setTimeout> | null = null

function _scheduleProactiveRefresh(token: string) {
  if (_refreshTimer) clearTimeout(_refreshTimer)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const msUntilExpiry = payload.exp * 1000 - Date.now()
    const refreshIn = msUntilExpiry - 60_000 // 60 s before expiry
    if (refreshIn > 0) {
      _refreshTimer = setTimeout(() => refreshAccessToken(), refreshIn)
    }
  } catch {
    // malformed token — skip scheduling
  }
}

export const setAuthToken = (token: string) => {
  _accessToken = token
  _scheduleProactiveRefresh(token)
}

export const clearAuthToken = () => {
  _accessToken = null
  if (_refreshTimer) { clearTimeout(_refreshTimer); _refreshTimer = null }
  apolloClient.clearStore()
}

export const getAuthToken = (): string | null => _accessToken

// ── Auth link — attaches JWT to every request ─────────────────────────────────
const authLink = new ApolloLink((operation, forward) => {
  const stateCode = import.meta.env.VITE_STATE_CODE || 'ok'

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      ...(_accessToken ? { Authorization: `Bearer ${_accessToken}` } : {}),
      'X-State-Code': stateCode,
    },
  }))
  return forward(operation)
})

// ── Error link — intercepts 401s and retries after a silent token refresh ────
let _refreshing: Promise<boolean> | null = null

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  const isUnauthenticated = graphQLErrors?.some(
    (e) => e.extensions?.code === 'UNAUTHENTICATED' || e.message === 'Not authenticated'
  )

  if (isUnauthenticated) {
    if (!_refreshing) {
      _refreshing = refreshAccessToken().finally(() => { _refreshing = null })
    }
    return new Observable((observer) => {
      _refreshing!.then((ok) => {
        if (!ok) { observer.error(new Error('Session expired')); return }
        const subscriber = {
          next: observer.next.bind(observer),
          error: observer.error.bind(observer),
          complete: observer.complete.bind(observer),
        }
        forward(operation).subscribe(subscriber)
      })
    })
  }

  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`[GraphQL error] ${message}`, { locations, path })
    })
  }
  if (networkError) console.error('[Network error]', networkError)
})

// ── HTTP link — credentials:include sends the refresh token cookie ─────────────
const httpLink = new HttpLink({
  uri: `${API_URL}/graphql`,
  credentials: 'include',
})

// ── WebSocket link (subscriptions only) ──────────────────────────────────────
const wsLink = new GraphQLWsLink(
  createClient({
    url: `${WS_URL}/graphql`,
    connectionParams: () => (_accessToken ? { Authorization: `Bearer ${_accessToken}` } : {}),
    shouldRetry: () => true,
    retryAttempts: 5,
  })
)

// ── Route: queries/mutations → HTTP, subscriptions → WS ──────────────────────
const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query)
    return def.kind === 'OperationDefinition' && def.operation === 'subscription'
  },
  wsLink,
  from([authLink, errorLink, httpLink])
)

// ── Apollo Client ─────────────────────────────────────────────────────────────
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          questions: {
            merge: false,
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: { errorPolicy: 'all' },
    query:      { errorPolicy: 'all' },
  },
})

// ── Refresh token helper ──────────────────────────────────────────────────────
const REFRESH_MUTATION = gql`
  mutation RefreshAccessToken {
    refreshAccessToken
  }
`

export async function refreshAccessToken(): Promise<boolean> {
  try {
    const { data } = await apolloClient.mutate<{ refreshAccessToken: string }>({
      mutation: REFRESH_MUTATION,
    })
    const token = data?.refreshAccessToken
    if (token) {
      setAuthToken(token)
      return true
    }
    return false
  } catch {
    return false
  }
}
