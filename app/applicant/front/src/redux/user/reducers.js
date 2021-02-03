import actions from './actions'

const initialState = {
  network: 0,
  username: '',
  address: '',
  authorized: false,
  loading: false,
  token: null
}

export default function userReducer(state = initialState, action) {
  switch (action.type) {
    case actions.SET_STATE:
      return { ...state, ...action.payload }
    default:
      return state
  }
}
