import React from "react";
import { Link } from "react-router-dom";
import "./Header.css";

function readSessionValue(key) {
    const value = sessionStorage.getItem(key)?.trim();
    return value && value !== "null" && value !== "undefined" ? value : null;
}

export default function Header() {
    const isLoggedIn = Boolean(
        readSessionValue("Authorization") || readSessionValue("userId")
    );
    const username = isLoggedIn ? readSessionValue("Username") : null;

    function handleLogout() {
        sessionStorage.removeItem("Authorization");
        sessionStorage.removeItem("Role");
        sessionStorage.removeItem("userId");
        sessionStorage.removeItem("Username");
        window.location.href = "/";
    }

    return (
        <header className="shop-header">
            <Link to="/" className="shop-header__logo">
                <img src="/로고1.png" alt="Fit on X 홈" />
            </Link>

            <nav className="shop-header__menu" aria-label="주 메뉴">
                <Link to="/category">카테고리</Link>
                <Link to="/recommend">추천</Link>
                <Link to="/wishlist">찜</Link>
                <Link to="/cart">장바구니</Link>
                <Link to="/mypage">마이페이지</Link>

                {isLoggedIn ? (
                    <>
                        <strong>{username ? `${username}님` : "회원"}</strong>
                        <button
                            type="button"
                            className="shop-header__logout"
                            onClick={handleLogout}
                        >
                            로그아웃
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login">로그인</Link>
                        <Link to="/signup">회원가입</Link>
                    </>
                )}
            </nav>
        </header>
    );
}