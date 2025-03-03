import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import CreateClient from "./pages/CreateClient";
import UploadImages from "./pages/UploadImages";
import SearchEvent from "./pages/SearchEvent";
import ChooseImages from "./pages/ChooseImages";
import ClientStatus from "./pages/ClientStatus";
import Header from "./components/Header"; // מייבאים את הכותרת




function App() {
    return (
        <Router>
            {/* ✅ הוספת ה-Header הקבוע */}
            <Header />

            {/* תוכן הדפים */}
            <div className="main-container">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/create-client" element={<CreateClient />} />
                    {/* <Route path="/upload-images" element={<UploadImages />} /> */}
                    <Route path="/upload-images/:clientId" element={<UploadImages />} />

                    <Route path="/SearchEvent" element={<SearchEvent />} />
                    <Route path="/choose-images/:id" element={<ChooseImages />} />
                    <Route path="/order-status/:id" element={<ClientStatus />} />
                    
                </Routes>
            </div>
        </Router>
    );
}

export default App;
