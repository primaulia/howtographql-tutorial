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
        { linksToRender.map(link => {
          return <Link key={link.id} link={link} />
        })}
      </div>
    )
  }
}

export default graphql(ALL_LINKS_QUERY)(LinkList)
