import axios from 'axios';

export async function login( username, password ) {
  try {
    return await axios.post( `${process.env.REACT_APP_API_URL}/auth`, { username, password } )
      .then( result => result.data );
  } catch( e ) {
    return false;
  }
}

export async function logout() {
  return true
}
