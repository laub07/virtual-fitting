import React, { useState } from "react";
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainPage from './components/MainPage';
import LoginPage from './components/LoginPage';
import CategoryPage from './components/CategoryPage';
import WishList from './components/WishList';
import MyPage from './components/MyPage';

function App() {
    const [token, setToken] = useState(sessionStorage.getItem("Authorization"));

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/login" element={<LoginPage setToken={setToken} />} />
                <Route path="/category" element={<CategoryPage />} />
                <Route path="/wishlist" element={<WishList />} />
                <Route path="/mypage" element={<MyPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;