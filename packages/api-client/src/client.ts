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
  split,
  from,
  ApolloLink,
} from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'
import { onError } from '@apollo/client/link/error'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const WS_URL  = import.meta.env.VITE_WS_URL  || 'ws://localhost:8000'

// ── Auth link — attaches JWT to every request ─────────────────────────────────
const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem('driveready_token')
  const stateCode = import.meta.env.VITE_STATE_CODE || 'ok'

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'X-State-Code': stateCode,
    },
  }))
  return forward(operation)
})

// ── Error link — logs GraphQL and network errors ──────────────────────────────
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`[GraphQL error] ${message}`, { locations, path })
    })
  }
  if (networkError) {
    console.error('[Network error]', networkError)
  }
})

// ── HTTP link ─────────────────────────────────────────────────────────────────
const httpLink = new HttpLink({ uri: `${API_URL}/graphql` })

// ── WebSocket link (subscriptions only) ──────────────────────────────────────
const wsLink = new GraphQLWsLink(
  createClient({
    url: `${WS_URL}/graphql`,
    connectionParams: () => {
      const token = localStorage.getItem('driveready_token')
      return token ? { Authorization: `Bearer ${token}` } : {}
    },
    // Reconnect automatically on disconnect
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
          // Questions: merge by id, no duplicate fetching
          questions: {
            merge: false,  // always replace — sessions are fresh each time
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

// ── Token helpers ─────────────────────────────────────────────────────────────
export const setAuthToken = (token: string) => {
  localStorage.setItem('driveready_token', token)
}

export const clearAuthToken = () => {
  localStorage.removeItem('driveready_token')
  apolloClient.clearStore()
}

export const getAuthToken = (): string | null => {
  return localStorage.getItem('driveready_token')
}
