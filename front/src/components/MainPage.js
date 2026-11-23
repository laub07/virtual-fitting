
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import "./MainPage.css";

const products = [
    { id: 1, name: "기본 티셔츠", image: "/top/short-tshirt/shirt.jpeg", category: "top" },
    { id: 2, name: "청바지", image: "/bottom/longpant/pants.jpeg", category: "bottom" },
    { id: 3, name: "후드티", image: "/top/hoodie/hoodie1.jpeg", category: "top" },
    { id: 4, name: "슬랙스", image: "/bottom/slacks/slacks1.jpeg", category: "bottom" },
    { id: 5, name: "자켓", image: "/outer/jacket/jacket1.jpeg", category: "outer" },
];

const categories = [
    { name: "TOP", sub: "상의", path: "top", image: "/top/sweatshirt/ss3.webp" },
    { name: "BOTTOM", sub: "하의", path: "bottom", image: "/bottom/longpant/pants1.webp" },
    { name: "OUTER", sub: "아우터", path: "outer", image: "/outer/downjacket/d2.png" },
];

const readStorage = (key) => {
    try {
        const data = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
};

const MainPage = () => {
    const [wishlist, setWishlist] = useState([]);
    const [displayProducts, setDisplayProducts] = useState([]);

    useEffect(() => {
        setWishlist(readStorage("wishlist"));

        const clicked = readStorage("clickedProducts");
        setDisplayProducts(
            clicked.length ? clicked.slice(0, 3) : products.slice(0, 3)
        );
    }, []);

    const toggleWishlist = (product) => {
        const updated = wishlist.some(p => p.id === product.id)
            ? wishlist.filter(p => p.id !== product.id)
            : [...wishlist, product];

        setWishlist(updated);
        localStorage.setItem("wishlist", JSON.stringify(updated));
    };

    const handleProductClick = (product) => {
        const clicked = readStorage("clickedProducts");
        const updated = [
            product,
            ...clicked.filter(p => p.id !== product.id)
        ].slice(0, 20);

        localStorage.setItem("clickedProducts", JSON.stringify(updated));
        localStorage.setItem("recentlyViewed", JSON.stringify(updated));
        setDisplayProducts(updated.slice(0, 3));
    };

    const startVirtualFitting = async () => {
        try {
            const response = await fetch(
                "http://localhost:8080/api/fitting/start",
                { method: "POST" }
            );

            if (!response.ok) throw new Error("서버 오류");
            alert(await response.text());
        } catch (error) {
            console.error(error);
            alert("가상 피팅 실행 실패");
        }
    };

    return (
        <div className="main-container">
            <Header />

            {/* 메인 배너 */}
            <section className="main-hero">
                <div className="hero-content">
                    <span className="hero-tag">WEAR IT · VIRTUAL FITTING</span>
                    <h1>
                        FIND YOUR STYLE,
                        <br />
                        WEAR YOUR WAY.
                    </h1>
                    <p>
                        나에게 어울리는 스타일을 발견하고
                        <br />
                        가상으로 먼저 입어보세요.
                    </p>
                    <button onClick={startVirtualFitting}>
                        가상 피팅 시작 →
                    </button>
                </div>
            </section>

            {/* 카테고리 */}
            <section className="main-section">
                <div className="section-title">
                    <span>SHOP BY CATEGORY</span>
                    <h2>어떤 스타일을 찾으세요?</h2>
                </div>

                <div className="main-category-grid">
                    {categories.map(category => (
                        <Link
                            to={`/category/list/${category.path}`}
                            className="main-category-card"
                            key={category.path}
                        >
                            <img src={category.image} alt={category.sub} />
                            <div className="category-overlay">
                                <h3>{category.name}</h3>
                                <p>{category.sub} 보러가기 →</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* 가상 피팅 소개 */}
            <section className="main-fitting-banner">
                <span>SMART FASHION EXPERIENCE</span>
                <h2>입어보지 않아도, 미리 경험하는 스타일</h2>
                <p>WEAR IT의 가상 피팅 기술로 새로운 쇼핑을 경험해 보세요.</p>
            </section>

            <footer className="main-footer">
                © 2026 WEAR IT · Virtual Fitting Project
            </footer>
        </div>
    );
};

export default MainPage;