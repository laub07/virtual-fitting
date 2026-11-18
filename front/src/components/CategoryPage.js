import React from "react";
import { Link } from "react-router-dom";
import "./CategoryPage.css";
import Header from "./Header";

const categories = [
    {
        name: "상의",
        path: "top",
        image: "/top/knit/k4.webp",
        subCategories: ["반팔 티셔츠", "긴팔 티셔츠", "셔츠", "블라우스", "니트", "후드"],
    },
    {
        name: "하의",
        path: "bottom",
        image: "/bottom/longpant/pants.png",
        subCategories: ["긴바지", "슬랙스", "반바지"],
    },
    {
        name: "아우터",
        path: "outer",
        image: "/outer/coat/c1.webp",
        subCategories: ["자켓", "코트", "가디건", "패딩"],
    },
];

const CategoryPage = () => (
    <div className="category-page-container">
        <Header />

        <section className="category-header">
            <h1>카테고리</h1>
            <p>원하는 의류 카테고리를 선택해 보세요</p>
        </section>

        <section className="category-grid">
            {categories.map(({ name, path, image, subCategories }) => (
                <div className="category-card" key={path}>
                    <img src={image} alt={name} className="category-image" />
                    <h3>{name}</h3>

                    <div className="sub-items">
                        {subCategories.map((label) => (
                            <span key={label} className="sub-item">{label}</span>
                        ))}
                    </div>

                    <Link to={`/category/list/${path}`} className="view-btn">
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

export default CategoryPage;