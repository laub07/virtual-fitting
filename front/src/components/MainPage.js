import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./MainPage.css";


const productData = [
    {
        id: 1,
        name: "기본 티셔츠",
        image: "/top/short-tshirt/shirt.jpeg",
        category: "top",
    },
    {
        id: 2,
        name: "청바지",
        image: "/bottom/longpant/pants.jpeg",
        category: "bottom",
    },
    {
        id: 3,
        name: "후드티",
        image: "/top/hoodie/hoodie1.jpeg",
        category: "top",
    },
    {
        id: 4,
        name: "슬랙스",
        image: "/bottom/slacks/slacks1.jpeg",
        category: "bottom",
    },
    {
        id: 5,
        name: "자켓",
        image: "/outer/jacket/jacket1.jpeg",
        category: "outer",
    },
];

const MainPage = () => {
    const [wishlist, setWishlist] = useState([]);
    const [displayProducts, setDisplayProducts] = useState([]);

    useEffect(() => {
        const savedWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
        setWishlist(savedWishlist);

        const clickedProducts =
            JSON.parse(localStorage.getItem("clickedProducts")) || [];

        if (clickedProducts.length > 0) {
            setDisplayProducts(clickedProducts.slice(0, 3));
        } else {
            const shuffled = [...productData].sort(() => 0.5 - Math.random());
            setDisplayProducts(shuffled.slice(0, 3));
        }
    }, []);

    const toggleWishlist = (product) => {
        const isExist = wishlist.some((item) => item.id === product.id);

        let updatedWishlist;
        if (isExist) {
            updatedWishlist = wishlist.filter((item) => item.id !== product.id);
        } else {
            updatedWishlist = [...wishlist, product];
        }

        setWishlist(updatedWishlist);
        localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
    };

    const isWished = (id) => wishlist.some((item) => item.id === id);

    const handleProductClick = (product) => {
        const clickedProducts =
            JSON.parse(localStorage.getItem("clickedProducts")) || [];

        const updatedClickedProducts = [
            product,
            ...clickedProducts.filter((item) => item.id !== product.id),
        ];

        localStorage.setItem(
            "clickedProducts",
            JSON.stringify(updatedClickedProducts)
        );

        setDisplayProducts(updatedClickedProducts.slice(0, 3));
    };

    return (
        <div className="main-container">
            {/* Navbar */}
            <header className="navbar">
                <img src="/로고1.png" alt="로고1" />
                <div className="menu">
                    <Link to="/category">카테고리</Link>
                    <Link to="/recommend">추천</Link>
                    <Link to="/wishlist">찜</Link>
                    <Link to="/cart">장바구니</Link>
                    <Link to="/mypage">마이페이지</Link>
                </div>
            </header>

            {/* 메인 배너 */}
            <section className="banner">
                <h1>가상으로 미리 입어보세요</h1>
                <p>웹캠으로 나에게 딱 맞는 사이즈 찾기</p>
                <button className="fit-btn">가상 피팅 시작</button>
            </section>

            {/* 카테고리 */}
            <section className="category">
                <h2>카테고리</h2>
                <div className="category-list">
                    <Link to="/category/list/top" className="category-item">
                        상의
                    </Link>
                    <Link to="/category/list/bottom" className="category-item">
                        하의
                    </Link>
                    <Link to="/category/list/outer" className="category-item">
                        아우터
                    </Link>
                </div>
            </section>

            {/* 상품 리스트 */}
            <section className="products">
                <h2>인기 상품</h2>
                <div className="product-list">
                    {displayProducts.map((product) => (
                        <div
                            className="product-card"
                            key={product.id}
                            onClick={() => handleProductClick(product)}
                        >
                            <button
                                className="wishlist-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleWishlist(product);
                                }}
                            >
                                {isWished(product.id) ? "❤️" : "🤍"}
                            </button>

                            <img src={product.image} alt={product.name} />
                            <p>{product.name}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <p>© 2026 Virtual Fit Project</p>
            </footer>
        </div>
    );
};

export default MainPage;