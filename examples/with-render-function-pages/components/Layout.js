import React, { Component } from 'react'
import Link from 'next/link'

const linkStyle = {
  marginRight: 10
}

export default class Layout extends Component {
  constructor (props) {
    super(props)

    this.state = {
      counter: 0
    }
  }

  render () {
    return (
      <div>
        <header>
          <Link href='/'><a style={linkStyle}>Home</a></Link>
          <Link href='/about'><a style={linkStyle}>About</a></Link>
          <button onClick={() => {
            this.setState({
              counter: this.state.counter + 1
            })
          }}>
            Count: {this.state.counter}
          </button>
        </header>

        <div>
          {this.props.children}
        </div>
      </div>
    )
  }
}
