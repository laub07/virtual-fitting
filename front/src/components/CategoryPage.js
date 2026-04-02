import React from "react";
import { Link } from "react-router-dom";
import "./CategoryPage.css";


const categories = [
    {
        id: 1,
        name: "상의",
        path: "top",
        image: "/top/short-tshirt/short4.webp",
        subCategories: [
            {
                name: "반팔 티셔츠",
                key: "short-tshirt",
                items: [
                    {
                        id: 1,
                        name: "기본 반팔 티",
                        image: "/top/short-tshirt/shirt.jpeg"
                    }
                ]
            },
            {
                name: "긴팔 티셔츠",
                key: "long-tshirt",
                items: [
                    {
                        id: 2,
                        name: "기본 긴팔 티",
                        image: "/top/long-tshirt/long1.jpeg"
                    }
                ]
            },
            {
                name: "셔츠",
                key: "shirt",
                items: [
                    {
                        id: 3,
                        name: "화이트 셔츠",
                        image: "/top/shirt/shirt1.jpeg"
                    }
                ]
            },
            {
                name: "블라우스",
                key: "blouse",
                items: [
                    {
                        id: 4,
                        name: "기본 블라우스",
                        image: "/top/blouse/blouse1.jpeg"
                    }
                ]
            },
            {
                name: "니트",
                key: "knit",
                items: [
                    {
                        id: 5,
                        name: "베이직 니트",
                        image: "/top/knit/knit1.jpeg"
                    }
                ]
            },
            {
                name: "후드",
                key: "hoodie",
                items: [
                    {
                        id: 6,
                        name: "기본 후드티",
                        image: "/top/hoodie/hoodie1.jpeg"
                    }
                ]
            }
        ]
    },
    {
        id: 2,
        name: "하의",
        path: "bottom",
        image: "/bottom/longpant/pants.webp",
        subCategories: [
            {
                name: "긴바지",
                key: "longpant",
                items: [
                    {
                        id: 1,
                        name: "기본 긴바지",
                        image: "/bottom/longpant/long1.jpeg"
                    }
                ]
            },
            {
                name: "슬랙스",
                key: "slacks",
                items: [
                    {
                        id: 2,
                        name: "와이드 슬랙스",
                        image: "/bottom/slacks/slacks1.jpeg"
                    }
                ]
            },
            {
                name: "반바지",
                key: "shortpant",
                items: [
                    {
                        id: 3,
                        name: "기본 반바지",
                        image: "/bottom/shortpant/short1.jpeg"
                    }
                ]
            }
        ]
    },
    {
        id: 3,
        name: "아우터",
        path: "outer",
        image: "/outer/jacket/j1.webp",
        subCategories: [
            {
                name: "자켓",
                key: "jacket",
                items: [
                    {
                        id: 1,
                        name: "기본 자켓",
                        image: "/outer/jacket/jacket1.jpeg"
                    }
                ]
            },
            {
                name: "코트",
                key: "coat",
                items: [
                    {
                        id: 2,
                        name: "롱 코트",
                        image: "/outer/coat/coat1.jpeg"
                    }
                ]
            },
            {
                name: "가디건",
                key: "cardigan",
                items: [
                    {
                        id: 3,
                        name: "니트 가디건",
                        image: "/outer/cardigan/cardigan1.jpeg"
                    }
                ]
            },
            {
                name: "패딩",
                key: "downjacket",
                items: [
                    {
                        id: 4,
                        name: "숏 패딩",
                        image: "/outer/downjacket/down1.jpeg"
                    }
                ]
            }
        ]
    }
];

const CategoryPage = () => {
    return (
        <div className="category-page-container">
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

            <section className="category-header">
                <h1>카테고리</h1>
                <p>원하는 의류 카테고리를 선택해 보세요</p>
            </section>

            <section className="category-grid">
                {categories.map((category) => (
                    <div className="category-card" key={category.id}>
                        <img
                            src={category.image}
                            alt={category.name}
                            className="category-image"
                        />
                        <h3>{category.name}</h3>

                        <div className="sub-items">
                            {category.subCategories.map((sub) => (
                                <span key={sub.key} className="sub-item">
                                    {sub.name}
                                </span>
                            ))}
                        </div>

                        <Link to={`/category/list/${category.path}`} className="view-btn">
                            보러가기
                        </Link>
                    </div>
                ))}
            </section>

            <footer className="footer">
                <p>© 2026 Virtual Fit Project</p>
            </footer>
        </div>
    );
};

export default CategoryPage;