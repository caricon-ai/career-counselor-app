import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Scenario from "./pages/Scenario";
import RolePlay from "./pages/RolePlay";
import Result from "./pages/Result";
import Transcript from "./pages/Transcript";
import Header from "./components/Header";

export default function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scenario" element={<Scenario />} />
        <Route path="/roleplay" element={<RolePlay />} />
        <Route path="/result" element={<Result />} />
        <Route path="/transcript" element={<Transcript />} />
      </Routes>
    </BrowserRouter>
  );
}
