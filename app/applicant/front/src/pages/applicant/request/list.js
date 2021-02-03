import React from 'react'
import { Alert, Button, Card, Table } from 'antd'
import { Redirect } from "react-router-dom";
import { Helmet } from 'react-helmet'
import { connect } from "react-redux";
import axios from 'axios';
import VCModal from "./vc-modal";

class ReceivedVC extends React.Component {
  state = {
    requests: [],
    currentRequest: {},
    isModalVisible: false,
    loading: false,
    sending: false
  }

  componentDidMount() {
    this.setState( { loading: true } );
    this.getRequests();
  }


  getRequests = async() => {
    try {
      const requests = await axios.get( `${process.env.REACT_APP_MAILBOX_URL}/vc/`, {
        headers: { signature: '' }
      } ).then( result => result.data );
      return this.setState( { requests, loading: false } )
    } catch( error ) {
      return this.setState( { error: 'Gathering Requests', loading: false } );
    }
  }

  showModal = request => {
    this.setState( {
      currentRequest: request,
      isModalVisible: true
    } )
  };

  hideModal = () => {
    this.setState( { isModalVisible: false } )
  }

  sendRequest = async request => {
    return axios.post( `${process.env.REACT_APP_API_URL}/register`, request, {
        headers: { signature: localStorage.getItem( 'signature' ) }
      } ).then( result => result.data );
  }

  render() {
    const { user } = this.props;
    const { currentRequest, isModalVisible, loading, sending, requests, error } = this.state;
    const columns = [
      {
        title: 'Subject',
        dataIndex: 'issuanceDate',
        key: 'issuanceDate',
        render: ( _, record ) => `${record.credentialSubject.givenName} ${record.credentialSubject.familyName}`,
      },
      {
        title: 'DID',
        dataIndex: 'issuer',
        key: 'issuer',
        render: ( text, record ) => (
          <a
            className="btn btn-sm btn-light"
            href={`https://mailbox.lacchain.net/#/did/resolve/${record.credentialSubject.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {record.credentialSubject.id}
          </a>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: ( _, record ) => {
          if( !record.credential ) {
            return (
              <span className="font-size-12 badge badge-default">
                Pending registration
              </span>
            );
          }
          if( record.credential && !record.credential.signature ) {
            return (
              <span className="font-size-12 badge badge-default">
                Pending Signature
              </span>
            );
          }
          return (
            <>
              <span className="font-size-12 badge badge-success">
                Signed
              </span>
              <span className="font-size-12 badge badge-warning ml-2">
                Issued
              </span>
            </>
          );
        }
      },
      {
        title: 'Action',
        key: 'action',
        render: ( _, item ) => (
          <span>
            <Button
              onClick={e => {
                this.showVCModal( item );
                e.preventDefault();
              }}
              className="btn btn-sm btn-primary mr-2"
            >
              <i className="fe fe-edit mr-2" />
              View
            </Button>
            {!item.credential &&
              <Button
                onClick={e => {
                  this.register( item );
                  e.preventDefault();
                }}
                className="btn btn-sm btn-warning mr-2"
                loading={sending /* && id === item.request.id */}
              >
                <i className="fe fe-edit mr-2" />
                Register
              </Button>
            }
            {item.credential && !item.credential.signature &&
              <Button
                onClick={e => {
                  this.sign( item );
                  e.preventDefault();
                }}
                className="btn btn-sm btn-success mr-2"
                loading={sending /* && id === item.request.id */}
              >
                <i className="fe fe-edit mr-2" />
                Sign
              </Button>
            }
          </span>
        ),
      },
    ]
    if( error ) {
      localStorage.removeItem( 'address' );
      localStorage.removeItem( 'signature' );
      return <Redirect to="/applicant/request" />
    }
    return (
      <div>
        <Helmet title="VC" />
        <VCModal visible={isModalVisible} vc={currentRequest} hide={this.hideVCModal} user={user} />
        <div className="cui__utils__heading">
          <strong>Certificates » Requests</strong>
        </div>
        {error &&
        <Alert message={error} type="error" className="mb-4" />
        }
        <Card className="card" loading={loading}>
          <div className="card-header card-header-flex">
            <div className="d-flex flex-column justify-content-center mr-auto">
              <h5 className="mb-0">Certificates Requests</h5>
            </div>
          </div>
          <div className="card-body">
            <div className="text-nowrap">
              <Table columns={columns} dataSource={requests} rowKey="id" />
            </div>
          </div>
        </Card>
      </div>
    )
  }
}

const mapStateToProps = ( { user } ) => ( { user } );

export default connect( mapStateToProps )( ReceivedVC )
