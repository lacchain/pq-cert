import React  from "react";
import { Button, Modal, Tabs } from "antd";
import moment from "moment";

const { TabPane } = Tabs

const VCModal = ( {vc, visible, hide, user} ) => {
  const response = vc && vc.credential ? {
    ...vc.credential.credential,
    proof: [{
      id: vc.issuer,
      type: "EcdsaSecp256k1Signature2019",
      proofPurpose: "assertionMethod",
      verificationMethod: process.env.REACT_APP_DIPLOMA_CLAIMS_VERIFIER,
      proofValue: vc.proof
    }]
  }: {};
  const rawRequest = JSON.stringify({...vc, credential: undefined, hash: undefined}, null, 2);
  const rawResponse = JSON.stringify(response, null, 2);
  return (
    <Modal
      width="600px"
      visible={visible}
      onCancel={hide}
      footer={[
        <Button key="submit" type="primary" onClick={hide}>
          Ok
        </Button>
      ]}
    >
      <div>
        <div className="pb-4 mb-4 border-bottom">
          <a href="" className="text-dark font-size-18">
            Verifiable Credential Request
          </a>
          <div className="font-size-12">
            <b>Subject:</b>
            <a
              className="btn btn-sm btn-light"
              href={`https://mailbox.lacchain.net/#/did/resolve/${vc.credentialSubject ? vc.credentialSubject.id : ''}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {vc.credentialSubject ? vc.credentialSubject.id : ''}
            </a>
          </div>
        </div>
        <div className="pb-3 mb-2 border-bottom">
          <div className="row pb-2">
            <div className="col-6">
              <span className="font-weight-bold mb-2">Types:</span> CertificateCredential
            </div>
            <div className="col-6">
              <span className="font-weight-bold mb-2">Status:</span>
              { vc.proofs && vc.proofs.length === 0 &&
                <span className="font-size-12 badge badge-default ml-3">
                  Pending Signatures
                </span>
              }
              { vc.proofs && vc.proofs.length < 2 && vc.proofs.find( s => s.user && s.user.address.endsWith(user.address) ) &&
                <span className="font-size-12 badge badge-warning ml-3">
                  Pending One Signature
                </span>
              }
              { vc.proofs && vc.proofs.length < 2 && !vc.proofs.find( s => s.user && s.user.address.endsWith(user.address) ) &&
                <span className="font-size-12 badge badge-warning ml-3">
                  Pending Your Signature
                </span>
              }
              { vc.proofs && vc.proofs.length === 2 &&
                <>
                  <span className="font-size-12 badge badge-success ml-3">
                    Signed
                  </span>
                  <span className="font-size-12 badge badge-warning ml-2">
                    Issued
                  </span>
                </>
              }
            </div>
          </div>
          <div className="row pb-2">
            <div className="col-6">
              <span className="font-weight-bold mb-2">Request Date:</span>  {vc.request ? moment(vc.request.issuanceDate).format('DD/MM/YYYY HH:mm:ss') : ''}
            </div>
            <div className="col-6">
              <span className="font-weight-bold mb-2">Issuance Date:</span> {vc.response ? moment(vc.response.issuanceDate).format('DD/MM/YYYY HH:mm:ss') : ''}
            </div>
          </div>
        </div>
        <Tabs defaultActiveKey="1" animated className="kit-tabs-bold">
          <TabPane
            tab={
              <span>
                <i className="fa fa-code mr-1" />
                Request VC
              </span>
            }
            key="1"
          >
            <pre>
              {rawRequest}
            </pre>
          </TabPane>
          { vc.proofs && vc.proofs.length > 0 ?
            <TabPane
              tab={
                <span>
                  <i className="fa fa-pencil mr-1" />
                  Signatures
                </span>
              }
              key="2"
            >
              <ul>
                {(vc.proofs||[]).map(s =>
                  <li key={s.user.address}>
                    <pre>did:ethr:lacchain:{s.user.address}</pre>
                  </li>)}
              </ul>
            </TabPane> : ''
          }
          { rawResponse ?
            <TabPane
              tab={
                <span>
                  <i className="fa fa-code mr-1" />
                  Response VC
                </span>
              }
              key="3"
            >
              <pre style={{maxHeight: '400px', overflow: 'auto'}}>
                {rawResponse}
              </pre>
            </TabPane> : ''
            }
        </Tabs>
      </div>
    </Modal>
  )
}

export default VCModal;
