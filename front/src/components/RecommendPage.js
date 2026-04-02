import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./RecommendPage.css";

const todayRecommendData = [
    {
        id: 1,
        name: "오버핏 맨투맨",
        image: "shirt.jpeg",
        reason: "오늘의 인기 스타일",
    },
    {
        id: 2,
        name: "데일리 청바지",
        image: "pants.jpeg",
        reason: "많이 찾는 기본 아이템",
    },
    {
        id: 3,
        name: "기본 후드티",
        image: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQtnjvaBpTNnHPUxOVDdVgIsoTOCt09Twp81dj5pk5c1whJ_CMzgjA4JaCtzGkiyTqtNA1sQGQqMLGJnDA56AzPj7C9AoR3G_Lbvw_TbBVCvS2h4b5EXI57koeQEKdfWU8ShPPO9w&usqp=CAc",
        reason: "편하게 입기 좋은 상품",
    },
];

const topRecommendData = [
    {
        id: 4,
        name: "베이직 셔츠",
        image: "shirt.jpeg",
        reason: "상의 카테고리 추천",
    },
    {
        id: 5,
        name: "루즈핏 티셔츠",
        image: "shirt.jpeg",
        reason: "데일리룩 추천",
    },
    {
        id: 6,
        name: "기본 맨투맨",
        image: "shirt.jpeg",
        reason: "무난하게 코디 가능",
    },
];

const bottomRecommendData = [
    {
        id: 7,
        name: "와이드 슬랙스",
        image: "pants.jpeg",
        reason: "하의 인기 추천",
    },
    {
        id: 8,
        name: "스트레이트 청바지",
        image: "pants.jpeg",
        reason: "편한 핏 추천",
    },
    {
        id: 9,
        name: "코튼 팬츠",
        image: "pants.jpeg",
        reason: "활용도 높은 하의",
    },
];

const similarRecommendData = [
    {
        id: 10,
        name: "캐주얼 후드집업",
        image: "shirt.jpeg",
        reason: "찜한 상품과 비슷한 스타일",
    },
    {
        id: 11,
        name: "심플 자켓",
        image: "shirt.jpeg",
        reason: "선호 스타일 기반 추천",
    },
    {
        id: 12,
        name: "기본 조거팬츠",
        image: "pants.jpeg",
        reason: "함께 코디하기 좋은 상품",
    },
];

const RecommendPage = () => {
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

    const renderProductSection = (title, subtitle, data) => (
        <section className="recommend-section">
            <div className="section-header">
                <h2>{title}</h2>
                <p>{subtitle}</p>
            </div>

            <div className="recommend-product-list">
                {data.map((product) => (
                    <div className="recommend-product-card" key={product.id}>
                        <button
                            className="wishlist-btn"
                            onClick={() => toggleWishlist(product)}
                        >
                            {isWished(product.id) ? "❤️" : "🤍"}
                        </button>

                        <img src={product.image} alt={product.name} />
                        <p className="product-name">{product.name}</p>
                        <p className="recommend-reason">{product.reason}</p>
                    </div>
                ))}
            </div>
        </section>
    );

    return (
        <div className="recommend-container">
            {/* Navbar */}
            <header className="navbar">
                <h2 className="logo">
                    <Link to="/" className="logo-link">
                        <img src="/로고1.png" alt="Fit on X 로고" className="logo-img" />
                    </Link>
                </h2>
                <div className="menu">
                    <Link to="/category">카테고리</Link>
                    <Link to="/recommend">추천</Link>
                    <Link to="/wishlist">찜</Link>
                    <Link to="/cart">장바구니</Link>
                    <Link to="/mypage">마이페이지</Link>
                </div>
            </header>

            {/* Banner */}
            <section className="recommend-banner">
                <h1>당신을 위한 추천</h1>
                <p>취향과 관심 상품을 바탕으로 추천해드려요</p>
            </section>

            {renderProductSection(
                "오늘의 추천",
                "지금 가장 잘 어울리는 아이템이에요",
                todayRecommendData
            )}

            {renderProductSection(
                "상의 추천",
                "자주 찾는 상의 스타일을 모아봤어요",
                topRecommendData
            )}

            {renderProductSection(
                "하의 추천",
                "코디하기 쉬운 하의를 추천해드려요",
                bottomRecommendData
            )}

            {renderProductSection(
                "찜한 상품과 비슷한 상품",
                "관심 있어 할 만한 비슷한 스타일이에요",
                similarRecommendData
            )}

            {/* Footer */}
            <footer className="footer">
                <p>© 2026 Virtual Fit Project</p>
            </footer>
        </div>
    );
};

export default RecommendPage;