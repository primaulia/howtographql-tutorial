import React, { Component } from 'react'
import Link from './Link'

import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

const ALL_LINKS_QUERY = gql`
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
        { linksToRender.map((link, index) => {
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
}

export default graphql(ALL_LINKS_QUERY)(LinkList)
