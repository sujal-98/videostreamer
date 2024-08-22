import axios from 'axios'
axios.defaults.withCredentials = true;

export const setCurrentUser = () => dispatch => {
  axios
    .get("http://localhost:1000/auth/current_user")
    .then(res => {
      console.log(res.data);
      dispatch({
        type: "SET_CURRENT_USER",
        payload: res.data
      });
    })
    .catch(err => {
      console.log(err.response);
    });
};
export const logout = () => dispatch => {
  axios
    .get('http://localhost:1000/auth/logout')
    .then(() => {
      dispatch({
        type: 'LOGOUT_USER',
      });
    })
    .catch(err => {
      console.log(err.response);
    });
};