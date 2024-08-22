import './App.css';
import Main from './pages/main';
import Login from './pages/login';
import { Provider } from 'react-redux';
import store from './redux/store';
import { BrowserRouter as Router,Routes,Route } from 'react-router-dom';

function App() {
  return (
    <div className="App">
          <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Router>
      </Provider>
    </div>
  );
}

export default App;
