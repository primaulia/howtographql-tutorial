import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './components/App'
import registerServiceWorker from './registerServiceWorker'

import { ApolloProvider } from 'react-apollo'
import { ApolloClient } from 'apollo-client'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'

import { BrowserRouter } from 'react-router-dom'

import { GC_AUTH_TOKEN } from './constants'
import { ApolloLink, split } from 'apollo-client-preset'
import { WebSocketLink } from 'apollo-link-ws'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { getMainDefinition } from 'apollo-utilities'

const httpLink = new HttpLink({ uri: 'https://api.graph.cool/simple/v1/cjb7mfc7u051601175med44jt'})

const middlewareAuthLink = new ApolloLink((operation, next) => {
  const token = localStorage.getItem(GC_AUTH_TOKEN)
  const authorizationHeader = token ? `Bearer ${token}` : null

  operation.setContext({
    headers: {
      authorization: authorizationHeader
    }
  })

  return next(operation)
})

const httpLinkWithAuthToken = middlewareAuthLink.concat(httpLink)

const GRAPHQL_ENDPOINT = "wss://subscriptions.graph.cool/v1/cjb7mfc7u051601175med44jt"
const wsClient = new SubscriptionClient(GRAPHQL_ENDPOINT, {
  reconnect: true,
  timeout: 30000,
  connectionParams: {
    authToken: localStorage.getItem(GC_AUTH_TOKEN),
  }
})

const wsLink = new WebSocketLink(wsClient)

const link = split(
  ({query}) => {
    const { kind, operation } = getMainDefinition(query)
    return kind === 'OperationDefinition' && operation === 'subscription'
  },
  wsLink,
  httpLinkWithAuthToken
)

const client = new ApolloClient({
  link,
  cache: new InMemoryCache()
})

ReactDOM.render(
  <BrowserRouter>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById('root')
)
registerServiceWorker()
