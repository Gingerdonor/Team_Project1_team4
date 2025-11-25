// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Selection from "./pages/Selection";
import Settings from "./pages/Settings"; // 👈 추가

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/select" element={<Selection />} />
        <Route path="/settings" element={<Settings />} /> {/* 👈 추가 */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
