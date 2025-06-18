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
import FileShare from './pages/fileShare';
import Meeting2 from './pages/Meeting2';
import YouTubeWatchParty from './pages/watchParty';
import { SocketProvider } from './contest/socketContext';

function App() {
  return (
    <div className="App">
      <Provider store={store}>
      <SocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/login" element={<Login />} />
          <Route path="/global" element={<Global />} />
          <Route path="/globalviewer" element={<GlobalViewer />} />
          <Route path="/meetinglobby" element={    
          <Lobby />   
} />
          <Route path="/meeting/:id" element={  <Meeting2 />  
 } />
 <Route path="/watchparty" element={ <YouTubeWatchParty /> } />
          <Route path="/fileShare" element={ <FileShare /> } />

        </Routes>
      </Router>
      </SocketProvider>
      </Provider>
    </div>
  );
}

export default App;
