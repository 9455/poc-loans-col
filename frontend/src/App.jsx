import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import Home from './pages/Home';
import Positions from './pages/Positions';
import './App.css';

export default function App() {
    return (
        <BrowserRouter>
            <div className="app">
                <Header />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/positions" element={<Positions />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}
