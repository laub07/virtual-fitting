import React from "react";
import { Link } from "react-router-dom";
import "./CategoryPage.css";

const categories = [
    {
        id: 1,
        name: "상의",
        image: "shirt.jpeg",
        items: ["티셔츠", "셔츠", "맨투맨", "후드티"]
    },
    {
        id: 2,
        name: "하의",
        image: "pants.jpeg",
        items: ["청바지", "슬랙스", "반바지", "스커트"]
    },
    {
        id: 3,
        name: "아우터",
        image: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQtnjvaBpTNnHPUxOVDdVgIsoTOCt09Twp81dj5pk5c1whJ_CMzgjA4JaCtzGkiyTqtNA1sQGQqMLGJnDA56AzPj7C9AoR3G_Lbvw_TbBVCvS2h4b5EXI57koeQEKdfWU8ShPPO9w&usqp=CAc",
        items: ["자켓", "코트", "가디건", "패딩"]
    }
];

const CategoryPage = () => {
    return (
        <div className="category-page-container">
            {/* 상단바 */}
            <header className="navbar">
                <h2 className="logo">
                    <Link to="/" className="logo-link">Fit on X</Link>
                </h2>
                <div className="menu">
                    <Link to="/category">카테고리</Link>
                    <span>추천</span>
                    <Link to="/wishlist">찜</Link>
                    <Link to="/mypage">마이페이지</Link>
                </div>
            </header>

            {/* 제목 */}
            <section className="category-header">
                <h1>카테고리</h1>
                <p>원하는 의류 카테고리를 선택해 보세요</p>
            </section>

            {/* 카테고리 카드 */}
            <section className="category-grid">
                {categories.map((category) => (
                    <div className="category-card" key={category.id}>
                        <img src={category.image} alt={category.name} className="category-image" />
                        <h3>{category.name}</h3>
                        <div className="sub-items">
                            {category.items.map((item, index) => (
                                <span key={index} className="sub-item">{item}</span>
                            ))}
                        </div>
                        <button className="view-btn">보러가기</button>
                    </div>
                ))}
            </section>

            {/* 푸터 */}
            <footer className="footer">
                <p>© 2026 Virtual Fit Project</p>
            </footer>
        </div>
    );
};

export default CategoryPage;