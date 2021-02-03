import React from 'react'
import { connect } from 'react-redux'
import { Radio, Tooltip } from 'antd'
import style from '../style.module.scss'

const mapStateToProps = ({ user, settings, dispatch }) => ({
  dispatch,
  user,
  authProvider: settings.authProvider,
  logo: settings.logo,
})

const Login = ({ dispatch, authProvider }) => {

  const changeAuthProvider = value => {
    dispatch({
      type: 'settings/CHANGE_SETTING',
      payload: {
        setting: 'authProvider',
        value,
      },
    })
  }

  return (
    <div>
      <div className="text-center mb-5">
        <h1 className="mb-5 px-3">
          <strong><img src="/resources/images/logo.png" alt="LACChain" height="50" /></strong>
        </h1>
      </div>
      <div className={`card ${style.container}`}>
        <div className="text-dark font-size-24 mb-3">
          <strong>Sign in to your account</strong>
        </div>
        <div className="mb-4">
          <Radio.Group
            onChange={e => {
                            changeAuthProvider(e.target.value);
                            window.location.reload();
                          }}
            value={authProvider}
          >
            <Tooltip title="Using Metamask Plugin">
              <Radio disabled={!window.ethereum} value="metamask">
                Metamask
              </Radio>
            </Tooltip>
          </Radio.Group>
        </div>
      </div>
    </div>
  )
}

export default connect(mapStateToProps)(Login)
