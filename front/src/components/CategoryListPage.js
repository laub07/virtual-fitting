import React from "react";
import { Link, useParams } from "react-router-dom";
import "./CategoryListPage.css";

const productData = {
    top: [
        {
            id: 1,
            name: "기본 티셔츠",
            price: 19900,
            image: "shirt.jpeg"
        },
        {
            id: 2,
            name: "오버핏 셔츠",
            price: 29900,
            image: "shirt.jpeg"
        },
        {
            id: 3,
            name: "맨투맨",
            price: 35900,
            image: "shirt.jpeg"
        },
        {
            id: 4,
            name: "후드티",
            price: 39900,
            image: "shirt.jpeg"
        }
    ],
    bottom: [
        {
            id: 5,
            name: "청바지",
            price: 45900,
            image: "pants.jpeg"
        },
        {
            id: 6,
            name: "슬랙스",
            price: 42900,
            image: "pants.jpeg"
        },
        {
            id: 7,
            name: "반바지",
            price: 25900,
            image: "pants.jpeg"
        },
        {
            id: 8,
            name: "스커트",
            price: 31900,
            image: "pants.jpeg"
        }
    ],
    outer: [
        {
            id: 9,
            name: "자켓",
            price: 69900,
            image: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQtnjvaBpTNnHPUxOVDdVgIsoTOCt09Twp81dj5pk5c1whJ_CMzgjA4JaCtzGkiyTqtNA1sQGQqMLGJnDA56AzPj7C9AoR3G_Lbvw_TbBVCvS2h4b5EXI57koeQEKdfWU8ShPPO9w&usqp=CAc"
        },
        {
            id: 10,
            name: "코트",
            price: 99000,
            image: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQtnjvaBpTNnHPUxOVDdVgIsoTOCt09Twp81dj5pk5c1whJ_CMzgjA4JaCtzGkiyTqtNA1sQGQqMLGJnDA56AzPj7C9AoR3G_Lbvw_TbBVCvS2h4b5EXI57koeQEKdfWU8ShPPO9w&usqp=CAc"
        },
        {
            id: 11,
            name: "가디건",
            price: 49900,
            image: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQtnjvaBpTNnHPUxOVDdVgIsoTOCt09Twp81dj5pk5c1whJ_CMzgjA4JaCtzGkiyTqtNA1sQGQqMLGJnDA56AzPj7C9AoR3G_Lbvw_TbBVCvS2h4b5EXI57koeQEKdfWU8ShPPO9w&usqp=CAc"
        },
        {
            id: 12,
            name: "패딩",
            price: 129000,
            image: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQtnjvaBpTNnHPUxOVDdVgIsoTOCt09Twp81dj5pk5c1whJ_CMzgjA4JaCtzGkiyTqtNA1sQGQqMLGJnDA56AzPj7C9AoR3G_Lbvw_TbBVCvS2h4b5EXI57koeQEKdfWU8ShPPO9w&usqp=CAc"
        }
    ]
};

const titleMap = {
    top: "상의",
    bottom: "하의",
    outer: "아우터"
};

function CategoryListPage() {
    const { type } = useParams();
    const products = productData[type] || [];

    const addToCart = (product) => {
        const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
        const updatedCart = [...savedCart, product];
        localStorage.setItem("cart", JSON.stringify(updatedCart));
        alert("장바구니에 담았습니다.");
    };

    return (
        <div className="category-list-container">
            <header className="navbar">
                <h2 className="logo">
                    <Link to="/" className="logo-link">Fit on X</Link>
                </h2>
                <div className="menu">
                    <Link to="/category">카테고리</Link>
                    <span>추천</span>
                    <Link to="/wishlist">찜</Link>
                    <Link to="/cart">장바구니</Link>
                    <Link to="/mypage">마이페이지</Link>
                </div>
            </header>

            <section className="category-list-header">
                <h1>{titleMap[type]} 상품 목록</h1>
                <p>원하는 상품을 확인하고 장바구니에 담아보세요</p>
            </section>

            <section className="product-grid">
                {products.map((product) => (
                    <div className="product-card" key={product.id}>
                        <img
                            src={product.image}
                            alt={product.name}
                            className="product-image"
                        />
                        <h3>{product.name}</h3>
                        <p>{product.price.toLocaleString()}원</p>

                        <button
                            className="cart-btn"
                            onClick={() => addToCart(product)}
                        >
                            장바구니 담기
                        </button>
                    </div>
                ))}
            </section>

            <footer className="footer">
                <p>© 2026 Virtual Fit Project</p>
            </footer>
        </div>
    );
}

export default CategoryListPage;