import './App.css';
import Main from './pages/main';
import Login from './pages/login';
import { Provider } from 'react-redux';
import store from './redux/store';
import { BrowserRouter as Router,Routes,Route } from 'react-router-dom';
import Global from './pages/global';
import GlobalViewer from './pages/GlobalViewer';
import Lobby from './pages/Lobby';
import Meeting from './pages/Meeting';

function App() {
  return (
    <div className="App">
      <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/login" element={<Login />} />
          <Route path="/global" element={<Global />} />
          <Route path="/globalviewer" element={<GlobalViewer />} />
          <Route path="/meetinglobby" element={<Lobby />} />
          <Route path="/meeting" element={ <Meeting /> } />
        </Routes>
      </Router>
      </Provider>
    </div>
  );
}

export default App;
