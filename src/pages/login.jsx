import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { setCurrentUser, logout } from '../actions/authAction';

function App({ user, isAuthenticated, setCurrentUser, logout }) {
  useEffect(() => {
    setCurrentUser();
  }, [setCurrentUser]);

  const handleLogin = () => {
    window.location.href = 'http://localhost:4000/api/auth/google';
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="App">
      <h1>MERN Google Auth</h1>
      {isAuthenticated ? (
        <div>
          <h2>Welcome, {user?.displayName}</h2>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Login with Google</button>
      )}
    </div>
  );
}

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated,
  user: state.auth.user,
});

export default connect(mapStateToProps, { setCurrentUser, logout })(App);
