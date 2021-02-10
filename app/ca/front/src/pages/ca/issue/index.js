import React from 'react'
import axios from 'axios';
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { Alert, Button, DatePicker, Form, Upload, Switch, Steps } from "antd";
import { Helmet } from "react-helmet";
import { CloudDownloadOutlined, UploadOutlined } from "@ant-design/icons";

const { Step } = Steps;

const mapStateToProps = ( { user } ) => ( {
  user,
  role: user.role,
} );

class IssueCertificate extends React.Component {

  state = {
    error: null,
    current: 0,
    fileList: {},
    loading: false,
    result: {}
  };

  readFile = file => new Promise( resolve => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      resolve(e .target.result );
    };
    reader.readAsText( file );
  } );

  send = async values => {
    const { fileList } = this.state;
    const { did, dns, expires } = values;
    const x509 = await this.readFile( fileList.x509[0] );
    const pqcsr = await this.readFile( fileList.pqcsr[0] );
    const ethcsr = await this.readFile( fileList.ethcsr[0] );

    axios.post(`/api`, {
      x509, pqcsr, ethcsr,
      did, dns, expires
    }).then( result => result.data ).then( result => {
      if( result.error ) {
        this.setState( { error: result.error } );
      } else {
        this.setState( { result, current: 2 } );
      }
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

  render() {
    const { current, fileList, result, loading, error } = this.state;

    const upload = name => ({
      onRemove: () => {
        this.setState(state => {
          const newFileList = { ...state.fileList };
          newFileList[name] = [];
          return {
            fileList: newFileList,
          };
        });
      },
      beforeUpload: file => {
        this.setState(state => {
          const newFileList = { ...state.fileList };
          newFileList[name] = [file];
          return {
            fileList: newFileList
          }
        });
        return false;
      },
      fileList: fileList[name],
    })

    return (
      <div>
        <Helmet title="PQ Cert CA" />
        <div className="cui__utils__heading">
          <strong>CA Certificates Issuance</strong>
        </div>
        <Steps
          type="navigation"
          current={current}
          className="site-navigation-steps m-3"
        >
          <Step
            title="Applicant CSR"
            status={current === 0 ? "process" : "wait"}
          />
          <Step
            title="Certificates"
            status={current === 1 ? "process" : "wait"}
          />
        </Steps>
        <div className="card overflow-hidden">
          <div className="card-body">
            {current === 0 &&
              <Form
                layout="vertical"
                onFinish={values => this.send( values )}
              >
                {error &&
                <Alert message={error} type="error" className="mb-4" />
                }
                <h6 className="mb-4">
                  <strong>Applicant Certificates</strong>
                </h6>
                <div className="row">
                  <div className="col-md-4">
                    <Form.Item
                      name="crt"
                      label="X.509 Certificate"
                      rules={[{ required: true, message: 'Please select the traditional X.509 CRT' }]}
                    >
                      <Upload name="x509" {...upload('x509')}>
                        <Button icon={<UploadOutlined />}>Click to upload</Button>
                      </Upload>
                    </Form.Item>
                  </div>
                  <div className="col-md-4">
                    <Form.Item
                      name="pqcsr"
                      label="Post-Quantum CSR"
                      rules={[{ required: true, message: 'Please select the post-quantum CSR' }]}
                    >
                      <Upload name="pqcsr" {...upload('pqcsr')}>
                        <Button icon={<UploadOutlined />}>Click to upload</Button>
                      </Upload>
                    </Form.Item>
                  </div>
                  <div className="col-md-4">
                    <Form.Item
                      name="ethcsr"
                      label="Ethereum CSR"
                      rules={[{ required: true, message: 'Please select the ethereum CSR' }]}
                    >
                      <Upload name="ethcsr" {...upload('ethcsr')}>
                        <Button icon={<UploadOutlined />}>Click to upload</Button>
                      </Upload>
                    </Form.Item>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-4">
                    <Form.Item
                      name="did"
                      label="Generate a DID"
                    >
                      <Switch defaultChecked />
                    </Form.Item>
                  </div>
                  <div className="col-md-4">
                    <Form.Item
                      name="dns"
                      label="Register in LACChain DNS"
                    >
                      <Switch defaultChecked />
                    </Form.Item>
                  </div>
                  <div className="col-md-4">
                    <Form.Item
                      name="expires"
                      label="Expiration date"
                      rules={[{ required: true, message: 'Please specify the expiration date' }]}
                    >
                      <DatePicker placeholder="Expiration date" className="width-100p" />
                    </Form.Item>
                  </div>
                </div>
                <div className="col-12 border-top pt-4 text-center">
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<CloudDownloadOutlined />}
                    loading={loading}
                    disabled={fileList.length <= 0}
                  >
                    Issue Certificate
                  </Button>
                </div>
              </Form>
            }
            {current === 1 &&
            <Form
              layout="vertical"
            >
              <h6 className="mb-4">
                <strong>Certificate</strong>
              </h6>
              <div className="row pb-5">
                <div className="col-md-12">
                  <div className="row">
                    <div className="col-12 border-top pt-4 text-center">
                      <pre style={{ textAlign: 'left' }}>
                        <strong>Generated DID: </strong> {result.did} <br />
                        <strong>Public Key: </strong> {result.publicKeyHex}
                      </pre>
                      <pre style={{maxHeight: '200px', overflow: 'auto'}}>{result.crt}</pre>
                      <Button
                        type="primary"
                        htmlType="submit"
                        onClick={() => this.download(result.crt, 'applicant.crt')}
                        icon={<CloudDownloadOutlined />}
                        loading={loading}
                      >
                        Applicant CRT
                      </Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        onClick={() => this.download(result.publicKeyHex, 'public_key.txt')}
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
              <div className="row">
                <div className="col-12 border-top pt-4 text-center">
                  <Form.Item>
                    <Button type="default" htmlType="cancel" className="mr-3" onClick={() => this.setState( { current: 1 } )}>
                      Issue a new certificate {loading}
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

export default withRouter( connect( mapStateToProps )( IssueCertificate ) )
