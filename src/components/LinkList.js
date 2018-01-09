import React, { Component } from 'react'
import Link from './Link'

import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

export const ALL_LINKS_QUERY = gql`
  query AllLinksQuery {
    allLinks {
      id
      createdAt
      url
      description
      postedBy {
        id
        name
      }
      votes {
        id
        user {
          id
        }
      }
    }
  }
`

class LinkList extends Component {
  render () {
    // 1
    if (this.props.data && this.props.data.loading) {
      return <div>Loading</div>
    }

    // 2
    if (this.props.data && this.props.data.error) {
      return <div>Error</div>
    }

    const linksToRender = this.props.data.allLinks

    return (
      <div>
        { [].concat(linksToRender)
          .sort((a, b) => a.votes.length < b.votes.length)
          .map((link, index) => {
            return <Link key={link.id} index={index} link={link} updateStoreAfterVote={this._updateCacheAfterVote}/>
          })}
      </div>
    )
  }

  _updateCacheAfterVote = (store, createVote, linkId) => {
    const data = store.readQuery({ query: ALL_LINKS_QUERY })

    const votedLink = data.allLinks.find(link => link.id === linkId)
    votedLink.votes = createVote.link.votes

    store.writeQuery({query: ALL_LINKS_QUERY, data})
  }

  _subscribeToNewLinks = () => {
    this.props.data.subscribeToMore({
      document: gql`
        subscription {
          Link(filter: {
            mutation_in: [CREATED]
          }) {
            node {
              id
              url
              description
              createdAt
              postedBy {
                id
                name
              }
              votes {
                id
                user {
                  id
                }
              }
            }
          }
        }
      `,
      updateQuery: (previous, { subscriptionData }) => {
        console.log(subscriptionData)
        const newAllLinks = [
          ...previous.allLinks,
          subscriptionData.data.Link.node
        ]

        const result = {
          ...previous,
          allLinks: newAllLinks
        }

        return result
      }
    })
  }

  _subscribeToNewVotes = () => {
    this.props.data.subscribeToMore({
      document: gql`
        subscription {
          Vote(filter: {
            mutation_in: [CREATED]
          }) {
            node {
              id
              link {
                id
                url
                description
                createdAt
                postedBy {
                  id
                  name
                }
                votes {
                  id
                  user {
                    id
                  }
                }
              }
              user {
                id
              }
            }
          }
        }
      `,
      updateQuery: (previous, { subscriptionData }) => {
        const votedLinkIndex = previous.allLinks.findIndex(
          link => link.id === subscriptionData.data.Vote.node.link.id
        )

        const link = subscriptionData.data.Vote.node.link

        const allLinks = previous.allLinks.slice()
        allLinks[votedLinkIndex] = link
        const result = {
          ...previous,
          allLinks
        }

        return result
      }
    })
  }

  componentDidMount() {
    this._subscribeToNewLinks()
    this._subscribeToNewVotes()
  }
}

export default graphql(ALL_LINKS_QUERY)(LinkList)
