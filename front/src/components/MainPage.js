import React from "react";
import "./MainPage.css";

const MainPage = () => {
    return (
        <div className="main-container">

            {/* 🔹 Navbar */}
            <header className="navbar">
                <h2 className="logo">Fit on X</h2>
                <div className="menu">
                    <span>카테고리</span>
                    <span>추천</span>
                    <span>찜</span>
                    <span>마이페이지</span>
                </div>
            </header>

            {/* 🔹 메인 배너 */}
            <section className="banner">
                <h1>가상으로 미리 입어보세요</h1>
                <p>웹캠으로 나에게 딱 맞는 사이즈 찾기</p>
                <button className="fit-btn">가상 피팅 시작</button>
            </section>

            {/* 🔹 카테고리 */}
            <section className="category">
                <h2>카테고리</h2>
                <div className="category-list">
                    <div className="category-item">상의</div>
                    <div className="category-item">하의</div>
                    <div className="category-item">아우터</div>
                </div>
            </section>

            {/* 🔹 상품 리스트 */}
            <section className="products">
                <h2>인기 상품</h2>
                <div className="product-list">
                    <div className="product-card">
                        <img src="shirt.jpeg" alt="티셔츠" />
                        <p>기본 티셔츠</p>
                    </div>
                    <div className="product-card">
                        <img src="pants.jpeg" alt="바지" />
                        <p>청바지</p>
                    </div>
                    <div className="product-card">
                        <img src="https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQtnjvaBpTNnHPUxOVDdVgIsoTOCt09Twp81dj5pk5c1whJ_CMzgjA4JaCtzGkiyTqtNA1sQGQqMLGJnDA56AzPj7C9AoR3G_Lbvw_TbBVCvS2h4b5EXI57koeQEKdfWU8ShPPO9w&usqp=CAc" alt="옷" />
                        <p>후드티</p>
                    </div>
                </div>
            </section>

            {/* 🔹 Footer */}
            <footer className="footer">
                <p>© 2026 Virtual Fit Project</p>
            </footer>

        </div>
    );
};

export default MainPage;