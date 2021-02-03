import { all, takeEvery, put, call } from 'redux-saga/effects'
import { notification } from 'antd'
import { history } from 'index'
import {login, logout} from 'services/blockchain.service'
import actions from './actions'

export function* LOGIN({ payload }) {
  const { username, password } = payload;
  yield put({
    type: 'user/SET_STATE',
    payload: {
      loading: true
    },
  })
  const result = yield call( login, username, password )
  if ( result ) {
    localStorage.setItem( 'username', username );
    localStorage.setItem( 'token', result.token );
    localStorage.setItem( 'address', result.address );

    yield put({
      type: 'user/LOAD_CURRENT_ACCOUNT',
    });
    yield history.push('/')
    notification.success({
      message: 'Logged In',
      description: 'You have successfully logged in',
    });
  } else {
    yield put({
      type: 'user/SET_STATE',
      payload: {
        authorized: false,
        loading: false
      }
    })
    notification.error({
      message: 'Error',
      description: 'Invalid credentials',
    });
  }
}

export function* LOAD_CURRENT_ACCOUNT() {
  const username = localStorage.getItem( 'username' );
  const token = localStorage.getItem( 'token' );
  const address = localStorage.getItem( 'address' );
  yield put({
    type: 'user/SET_STATE',
    payload: {
      username,
      token,
      address,
      authorized: true,
      loading: false
    }
  })
}

export function* LOGOUT() {
  localStorage.removeItem( 'username' );
  localStorage.removeItem( 'token' );
  localStorage.removeItem( 'address' );
  yield call( logout )
  yield put({
    type: 'user/SET_STATE',
    payload: {
      username: '',
      token: '',
      address: '',
      authorized: false,
      loading: false
    },
  })
}

export default function* rootSaga() {
  yield all([
    takeEvery(actions.LOGIN, LOGIN),
    takeEvery(actions.LOAD_CURRENT_ACCOUNT, LOAD_CURRENT_ACCOUNT),
    takeEvery(actions.LOGOUT, LOGOUT),
    LOAD_CURRENT_ACCOUNT(),
  ])
}
