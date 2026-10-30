import { Route, Routes } from "react-router";
import Home from "./pages/Home";
import Timeline from "./pages/Timeline";

function App() {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="/timeline" element={<Timeline />} />
    </Routes>
  );
}

export default App;
