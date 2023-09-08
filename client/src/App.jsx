import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import MeetingPage from "./components/MeetingPage";
import AppBar from "./components/AppBar";
import "./App.css";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

function App() {

  return (
    <div>
      <AppBar />
      <Router>

        <Routes>
          <Route path="/meeting/:roomId" element={<MeetingPage />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
