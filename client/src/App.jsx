import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import MeetingPage from "./components/MeetingPage";

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/meeting/:roomId" element={<MeetingPage />} />
      </Routes>
    </Router>
  )
}

export default App
