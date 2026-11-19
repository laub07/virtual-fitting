
import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import MainPage from "./components/MainPage";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import CategoryPage from "./components/CategoryPage";
import CategoryListPage from "./components/CategoryListPage";
import WishList from "./components/WishList";
import MyPage from "./components/MyPage";
import CartPage from "./components/CartPage";
import RecommendPage from "./components/RecommendPage";

function App() {
    const [, setToken] = useState(() =>
        sessionStorage.getItem("Authorization")
    );

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/login" element={<LoginPage setToken={setToken} />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/category" element={<CategoryPage />} />
                <Route path="/category/list/:type" element={<CategoryListPage />} />
                <Route path="/wishlist" element={<WishList />} />
                <Route path="/mypage" element={<MyPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/recommend" element={<RecommendPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
