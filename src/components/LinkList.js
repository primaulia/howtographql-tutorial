import React, { Component } from 'react'
import Link from './Link'

import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

import { LINKS_PER_PAGE } from '../constants'

export const ALL_LINKS_QUERY = gql`
  query AllLinksQuery($first: Int, $skip: Int, $orderBy: LinkOrderBy) {
    allLinks(first: $first, skip: $skip, orderBy: $orderBy) {
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
    },
    _allLinksMeta {
      count
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

    const isNewPage = this.props.location.pathname.includes('new')
    const linksToRender = this._getLinksToRender(isNewPage)
    const page = parseInt(this.props.match.params.page, 10)

    return (
      <div>
        <div>
          {linksToRender.map((link, index) => (
            <Link key={link.id} index={page ? (page - 1) * LINKS_PER_PAGE + index : index} updateStoreAfterVote={this._updateCacheAfterVote} link={link}/>
          ))}
        </div>
        { isNewPage &&
          <div className='flex ml4 mv3 gray'>
            <div className='pointer mr2' onClick={() => this._previousPage()}>Previous</div>
            <div className='pointer' onClick={() => this._nextPage()}>Next</div>
          </div>
        }
      </div>
    )
  }

  _nextPage = () => {
    const page = parseInt(this.props.match.params.page, 10)
    console.log('current page', page)
    if (page <= this.props.data._allLinksMeta.count / LINKS_PER_PAGE) {
      const nextPage = page + 1
      this.props.history.push(`/new/${nextPage}`)
    }
  }

  _previousPage = () => {
    const page = parseInt(this.props.match.params.page, 10)
    console.log('current page', page)
    if (page > 1) {
      const previousPage = page - 1
      this.props.history.push(`/new/${previousPage}`)
    }
  }

  _getLinksToRender = (isNewPage) => {
    if (isNewPage) {
      console.log('isNewPage', isNewPage)
      return this.props.data.allLinks
    }
    const rankedLinks = this.props.data.allLinks.slice()
    rankedLinks.sort((l1, l2) => l2.votes.length - l1.votes.length)
    return rankedLinks
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

export default graphql(ALL_LINKS_QUERY, {
  options: (ownProps) => {
    const page = parseInt(ownProps.match.params.page, 10)
    const isNewPage = ownProps.location.pathname.includes('new')
    const skip = isNewPage ? (page - 1) * LINKS_PER_PAGE : 0
    const first = isNewPage ? LINKS_PER_PAGE : 100
    const orderBy = isNewPage ? 'createdAt_DESC' : null
    return {
      variables: { first, skip, orderBy }
    }
  }
})(LinkList)
