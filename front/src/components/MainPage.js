import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./MainPage.css";

const productData = [
    {
        id: 1,
        name: "기본 티셔츠",
        image: "shirt.jpeg",
    },
    {
        id: 2,
        name: "청바지",
        image: "pants.jpeg",
    },
    {
        id: 3,
        name: "후드티",
        image: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQtnjvaBpTNnHPUxOVDdVgIsoTOCt09Twp81dj5pk5c1whJ_CMzgjA4JaCtzGkiyTqtNA1sQGQqMLGJnDA56AzPj7C9AoR3G_Lbvw_TbBVCvS2h4b5EXI57koeQEKdfWU8ShPPO9w&usqp=CAc",
    },
];

const MainPage = () => {
    const [wishlist, setWishlist] = useState([]);

    useEffect(() => {
        const savedWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
        setWishlist(savedWishlist);
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

    return (
        <div className="main-container">

            {/* Navbar */}
            <header className="navbar">
                <h2 className="logo">Fit on X</h2>
                <div className="menu">
                    <Link to="/category">카테고리</Link>
                    <span>추천</span>
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
                    <div className="category-item">상의</div>
                    <div className="category-item">하의</div>
                    <div className="category-item">아우터</div>
                </div>
            </section>

            {/* 상품 리스트 */}
            <section className="products">
                <h2>인기 상품</h2>
                <div className="product-list">
                    {productData.map((product) => (
                        <div className="product-card" key={product.id}>
                            <button
                                className="wishlist-btn"
                                onClick={() => toggleWishlist(product)}
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