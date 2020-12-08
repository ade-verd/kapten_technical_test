import React, { Component } from 'react';
import request from 'superagent';

const urlForRider = (id) =>
  `http://localhost:8000/api/rider/loyalty/${id}`;

class Rider extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  async componentDidMount() {
    request
      .get(urlForRider(this.props.id))
      .then(res => {
        this.setState({
          rider: res.body
        });
      }, (err) => {
        this.setState({
          error: err.toString()
        });
      });
  }

  render() {
    if (this.state.error) {
      return <p>{this.state.error}</p>;
    }
    if (!this.state.rider) {
      return <p>Loading...</p>;
    }
    return (
      <div>
        <p>Id: {this.state.rider._id}</p>
        <p>Name: {this.state.rider.name}</p>
        <p>Loyalty Status: {this.state.rider.status}</p>
      </div>
    );
  }
}

export default Rider;

