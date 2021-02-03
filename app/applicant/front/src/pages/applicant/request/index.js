import React from 'react'
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { Alert, Button, Form, Input, Steps, Switch } from "antd";
import { Helmet } from "react-helmet";
import { UserAddOutlined, MailOutlined, BankOutlined, ExpandOutlined, CloudDownloadOutlined } from "@ant-design/icons";
import PerfectScrollbar from "react-perfect-scrollbar";
import SortableTree from "react-sortable-tree";
import axios from "axios";

const { TextArea } = Input;
const { Step } = Steps;

const mapStateToProps = ( { user } ) => ( {
  user,
  role: user.role,
} );

class SendRequest extends React.Component {

  state = {
    current: 0,
    autoEthereum: true,
    quantum: true,
    loading: false,
    setup: false,
    emails: [],
    keySegments: [],
    result: {
      ethereum: {},
      quantum: {}
    }
  };

  email = React.createRef()

  addEmail = () => {
    const { emails } = this.state;
    const { value } = this.email.current;
    this.setState({ emails: emails.concat( { value } ) });
    this.email.current.value = ''
  }

  send = async ( values ) => {
    const { quantum, autoEthereum } = this.state;
    axios.post(`/api`, {
      subject: `/C=${values.country}/L=${values.location}/ST=${values.state}/O=${values.org}/OU=${values.ou}/CN=${values.cn}/emailAddress=${values.email}`,
      auto: autoEthereum,
      quantum,
    }).then( result => result.data ).then( result => {
      this.setState({ loading: !result, result, current: 2 });
    } );
  }

  download = ( data, name ) => {
    const url = window.URL.createObjectURL( new Blob( [Buffer.from( data )] ) );
    const link = document.createElement( 'a' );
    link.href = url;
    link.setAttribute( 'download', name );
    document.body.appendChild( link );
    link.click();
  }

  requestSetup = async () => {
    const { emails } = this.state;
    const result = await axios.get( `/api/setup?emails=${emails.map(e => e.value).join(',')}` )
    this.setState( { keySegments: [result.data], setup: true } )
  }

  setup = async values => {
    const segments = [];
    for( let i = 1; i < Object.keys(values).length; i += 1 ){
      segments.push( values[`segment.${i}`] );
    }
    await axios.post( "/api/setup", { segments } )
    this.setState( { current: 1 } )
  }

  render() {
    const { current, setup, emails, keySegments, autoEthereum, quantum, loading, result, error } = this.state;

    return (
      <div>
        <Helmet title="PQ Cert Applicant" />
        <div className="cui__utils__heading">
          <strong>Certificate Signing Request</strong>
        </div>
        <Steps
          type="navigation"
          current={current}
          className="site-navigation-steps m-3"
        >
          <Step
            title="Setup"
            status={current === 0 ? "process" : "wait"}
          />
          <Step
            title="Applicant Information"
            status={current === 1 ? "process" : "wait"}
          />
          <Step
            title="Certificate Signing Requests"
            status={current === 2 ? "process" : "wait"}
          />
        </Steps>
        <div className="card overflow-hidden">
          <div className="card-body">
            {current === 0 && !setup &&
            <div>
              <h6 className="mb-4">
                <strong>Ironbridge Setup</strong>
              </h6>
              <div className="row">
                <div className="col-12">
                  <div className="row mb-3">
                    <div className="col-3">
                      <input
                        className="form-control"
                        placeholder="Email to send key segment"
                        type="text"
                        ref={this.email}
                      />
                    </div>
                    <div className="col-3">
                      <button
                        type="button"
                        className="btn btn-success btn-with-addon"
                        onClick={this.addEmail}
                      >
                        <span className="btn-addon">
                          <i className="btn-addon-icon fe fe-plus-circle" />
                        </span>
                        Add Email
                      </button>
                    </div>
                  </div>
                  <div>
                    <PerfectScrollbar>
                      <div className="height-200">
                        <SortableTree
                          treeData={emails}
                          onChange={keys => this.setState( { emails: keys })}
                          generateNodeProps={({ node: { value } }) => ({
                            title: (
                              <span><b>{value}</b></span>
                            )
                          })}
                        />
                      </div>
                    </PerfectScrollbar>
                  </div>
                  <div className="text-center">
                    <Button
                      type="button"
                      className="btn btn-warning ant-btn-lg"
                      onClick={() => this.requestSetup()}
                      icon={<ExpandOutlined />}
                      loading={loading}
                    >
                      Request Key Segments
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            }
            {current === 0 && setup &&
            <div>
              <h6 className="mb-4">
                <strong>Ironbridge Key Segments</strong>
              </h6>
              <Form
                layout="vertical"
                initialValues={{ 'segment.0': keySegments.length > 0 ? keySegments[0] : '' }}
                onFinish={values => this.setup( values )}
              >
                <div className="row">
                  <div className="col-12">
                    <Form.Item
                      name="segment.0"
                      label="First segment"
                    >
                      <TextArea rows="4" readOnly />
                    </Form.Item>
                    {emails.map( (email, index) =>
                      <Form.Item
                        key={email}
                        name={`segment.${index + 1}`}
                        label={`${email.value} segment`}
                        rules={[{ required: true, message: 'Please input the key segment' }]}
                      >
                        <TextArea rows="4" />
                      </Form.Item>
                    )}
                  </div>
                </div>
                <div className="row">
                  <div className="col-12 border-top pt-4 text-center">
                    <Form.Item>
                      <Button type="primary" htmlType="submit">
                        Next Step
                      </Button>
                    </Form.Item>
                  </div>
                </div>
              </Form>
            </div>
            }
            {current === 1 &&
              <Form
                layout="vertical"
                onFinish={values => this.send( values )}
              >
                {error &&
                <Alert message={error} type="warning" className="mb-4" />
                }
                <h6 className="mb-4">
                  <strong>Applicant Information</strong>
                </h6>
                <div className="row">
                  <div className="col-md-4">
                    <Form.Item
                      name="org"
                      label="Organization Name"
                      rules={[{ required: true, message: 'Please input the organization name' }]}
                    >
                      <Input addonBefore={<BankOutlined />} placeholder="Organization name" />
                    </Form.Item>
                  </div>
                  <div className="col-md-4">
                    <Form.Item
                      name="ou"
                      label="Organization Unit"
                      rules={[{ required: true, message: 'Please input the organization unit' }]}
                    >
                      <Input addonBefore={<UserAddOutlined />} placeholder="Organization unit" />
                    </Form.Item>
                  </div>
                  <div className="col-md-4">
                    <Form.Item
                      name="cn"
                      label="Common Name"
                      rules={[{ required: true, message: 'Please input the common name' }]}
                    >
                      <Input addonBefore={<UserAddOutlined />} placeholder="Domain name" />
                    </Form.Item>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-4">
                    <Form.Item
                      name="country"
                      label="Country"
                      rules={[{ required: true, message: 'Please input the country' }]}
                    >
                      <Input addonBefore={<ExpandOutlined />} placeholder="Country Code (Two Letter)" />
                    </Form.Item>
                  </div>
                  <div className="col-md-4">
                    <Form.Item
                      name="state"
                      label="State"
                      rules={[{ required: true, message: 'Please input the state' }]}
                    >
                      <Input addonBefore={<ExpandOutlined />} placeholder="State" />
                    </Form.Item>
                  </div>
                  <div className="col-md-4">
                    <Form.Item
                      name="location"
                      label="Location"
                      rules={[{ required: true, message: 'Please input the location' }]}
                    >
                      <Input addonBefore={<ExpandOutlined />} placeholder="Location" />
                    </Form.Item>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-4">
                    <Form.Item
                      name="email"
                      label="Email"
                      rules={[{ required: true, message: 'Please input the email' }]}
                    >
                      <Input addonBefore={<MailOutlined />} placeholder="Email" />
                    </Form.Item>
                  </div>
                  <div className="col-md-4">
                    <Form.Item
                      name="quantum"
                      label="Generate Post-Quantum CSR"
                    >
                      <Switch defaultChecked onChange={state => this.setState({ quantum: state })} />
                    </Form.Item>
                  </div>
                  <div className="col-md-4">
                    <Form.Item
                      name="algorithm"
                      label="Generate Automatic Ethereum Keys"
                    >
                      <Switch defaultChecked onChange={state => this.setState({ autoEthereum: state })} />
                    </Form.Item>
                  </div>
                </div>
                { !autoEthereum &&
                <div className="row">
                  <div className="col-md-6">
                    <Form.Item
                      name="publicKey"
                      label="Ethereum Public Key"
                      rules={[{ required: true, message: 'Please input the public key of Ethereum account' }]}
                    >
                      <Input addonBefore={<ExpandOutlined />} placeholder="Public Key Hex" />
                    </Form.Item>
                  </div>
                  <div className="col-md-6">
                    <Form.Item
                      name="privateKey"
                      label="Ethereum Private Key"
                      rules={[{ required: true, message: 'Please input the private key of Ethereum account' }]}
                    >
                      <Input addonBefore={<ExpandOutlined />} placeholder="Private Key Hex" />
                    </Form.Item>
                  </div>
                </div> }
                <div className="row">
                  <div className="col-12 border-top pt-4 text-center">
                    <Form.Item>
                      <Button type="secondary" className="mr-3" onClick={() => this.setState( { current: 0 } )}>
                        Previous Step {loading}
                      </Button>
                      <Button type="primary" htmlType="submit" className="btn-with-addon">
                        <span className="btn-addon">
                          <i className="btn-addon-icon fe fe-arrow-right" />
                        </span>
                        Next Step
                      </Button>
                    </Form.Item>
                  </div>
                </div>
              </Form>
            }
            {current === 2 &&
              <Form
                layout="vertical"
              >
                <h6 className="mb-4">
                  <strong>Certificate</strong>
                </h6>
                <p><strong>Ethereum</strong></p>
                <div className="row pb-5">
                  <div className="col-md-12">
                    <div className="row">
                      <div className="col-6 border-top pt-4 text-center">
                        {autoEthereum &&
                        <pre style={{ textAlign: 'left' }}>
                          <strong>Address: </strong> {result.ethereum.addr} <br />
                          <strong>Private Key: </strong> {result.ethereum.priv}
                        </pre>
                        }
                        <pre style={{maxHeight: '200px', overflow: 'auto'}}>{result.ethereum.key}</pre>
                        <Button
                          type="primary"
                          htmlType="submit"
                          onClick={() => this.download(result.ethereum.key, 'ethereum.key')}
                          icon={<CloudDownloadOutlined />}
                          loading={loading}
                        >
                          CSR Private Key
                        </Button>
                      </div>
                      <div className="col-6 border-top pt-4 text-center">
                        <pre style={{maxHeight: '200px', overflow: 'auto'}}>{result.ethereum.csr}</pre>
                        <Button
                          type="primary"
                          htmlType="submit"
                          onClick={() => this.download(result.ethereum.csr, 'ethereum.csr')}
                          icon={<CloudDownloadOutlined />}
                          loading={loading}
                        >
                          Certificate Signing Request
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                { quantum &&
                <>
                  <strong>Post-Quantum</strong>
                  <div className="row">
                    <div className="col-md-12">
                      <div className="row">
                        <div className="col-6 border-top pt-4 text-center">
                          <pre style={{maxHeight: '200px', overflow: 'auto'}}>{result.quantum.key}</pre>
                          <Button
                            type="primary"
                            htmlType="submit"
                            onClick={() => this.download(result.quantum.key, 'quantum.key')}
                            icon={<CloudDownloadOutlined />}
                            loading={loading}
                          >
                            CSR Private Key
                          </Button>
                        </div>
                        <div className="col-6 border-top pt-4 text-center">
                          <pre style={{maxHeight: '200px', overflow: 'auto'}}>{result.quantum.csr}</pre>
                          <Button
                            type="primary"
                            htmlType="submit"
                            onClick={() => this.download(result.quantum.csr, 'quantum.csr')}
                            icon={<CloudDownloadOutlined />}
                            loading={loading}
                          >
                            Certificate Signing Request
                          </Button>
                          <Button
                            type="primary"
                            htmlType="submit"
                            onClick={() => this.download(result.quantum.pub, 'quantum.pub')}
                            icon={<CloudDownloadOutlined />}
                            loading={loading}
                            style={{ marginLeft: '10px' }}
                          >
                            Public Key (Hex)
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </> }
                <div className="row">
                  <div className="col-12 border-top pt-4 text-center">
                    <Form.Item>
                      <Button type="default" htmlType="cancel" className="mr-3" onClick={() => this.setState( { current: 1 } )}>
                        Generate a new CSR {loading}
                      </Button>
                    </Form.Item>
                  </div>
                </div>
              </Form>
            }
          </div>
        </div>
      </div>
    )
  }
}

export default withRouter( connect( mapStateToProps )( SendRequest ) )
