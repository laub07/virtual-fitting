import React, { useState } from "react";
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainPage from './components/MainPage';
import LoginPage from './components/LoginPage';
import CategoryPage from './components/CategoryPage';
import WishList from './components/WishList';
import MyPage from './components/MyPage';
import CartPage from "./components/CartPage";
import CategoryListPage from "./components/CategoryListPage";
import RecommendPage from "./components/RecommendPage";
import SignupPage from "./components/SignupPage";

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
                <Route path="/cart" element={<CartPage />} />
                <Route path="/category/list/:type" element={<CategoryListPage />} />
                <Route path="/recommend" element={<RecommendPage />} />
                <Route path="/register" element={<SignupPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;