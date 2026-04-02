import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./MyPage.css";

function MyPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [topSize, setTopSize] = useState("");
    const [bottomSize, setBottomSize] = useState("");

    useEffect(() => {
        const token = sessionStorage.getItem("Authorization");
        setIsLoggedIn(!!token);

        const savedTop = localStorage.getItem("topSize");
        const savedBottom = localStorage.getItem("bottomSize");

        if (savedTop) setTopSize(savedTop);
        if (savedBottom) setBottomSize(savedBottom);
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem("Authorization");
        sessionStorage.removeItem("Role");
        setIsLoggedIn(false);
        window.location.href = "/";
    };
    const handleSaveSize = () => {
        localStorage.setItem("topSize", topSize);
        localStorage.setItem("bottomSize", bottomSize);
        setIsEditing(false);
    };

    return (
        <div className="mypage-container">
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

            <section className="mypage-hero">
                <p>내 정보와 쇼핑 활동을 한눈에 확인해보세요</p>
            </section>

            <section className="mypage-content">
                <div className="profile-card">
                    {!isLoggedIn ? (
                        <>
                            <h2>회원이라면 누구나 무료배송</h2>
                            <p className="login-desc">
                                지금 가입하고 <span>최대 30% 할인 쿠폰</span> 혜택을 받아보세요
                            </p>

                            <div className="profile-buttons">
                                <Link to="/register" className="signup-btn-link">회원가입</Link>
                                <Link to="/login" className="login-btn-link">로그인</Link>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="profile-buttons">
                                <button className="logout-btn" onClick={handleLogout}>
                                    로그아웃
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className="info-grid">
                    <div className="info-card">
                        <h3>찜한 상품</h3>
                        <p>내가 저장한 상품을 확인할 수 있어요.</p>
                        <Link to="/wishlist" className="card-link">바로가기</Link>
                    </div>

                    <div className="info-card">
                        <h3>최근 본 상품</h3>
                        <p>최근에 둘러본 상품 내역을 볼 수 있어요.</p>
                        <button className="card-btn">확인하기</button>
                    </div>

                    <div className="info-card">
                        <h3>장바구니</h3>
                        <p>담아둔 상품을 확인할 수 있어요.</p>
                        <Link to="/cart" className="card-link">보러가기</Link>
                    </div>

                    <div className="info-card">
                        <h3>내 사이즈 정보</h3>

                        {!isEditing ? (
                            <>
                                <p>
                                    상의 {topSize || "미설정"} / 하의 {bottomSize || "미설정"}
                                </p>
                                <button
                                    type="button"
                                    className="card-btn"
                                    onClick={() => setIsEditing(true)}
                                >
                                    수정하기
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="size-inputs">
                                    <input
                                        type="text"
                                        placeholder="상의 (예: M)"
                                        value={topSize}
                                        onChange={(e) => setTopSize(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="하의 (예: 25)"
                                        value={bottomSize}
                                        onChange={(e) => setBottomSize(e.target.value)}
                                    />
                                </div>

                                <button
                                    type="button"
                                    className="card-btn"
                                    onClick={handleSaveSize}
                                >
                                    저장
                                </button>
                            </>
                        )}
                    </div>

                    <div className="info-card">
                        <h3>가상 피팅 기록</h3>
                        <p>최근 피팅한 상품과 추천 사이즈를 볼 수 있어요.</p>
                        <button className="card-btn">보러가기</button>
                    </div>
                </div>
            </section>

            <section className="help-section">
                <h2>고객 지원</h2>
                <div className="help-list">
                    <div className="help-item">고객센터</div>
                    <div className="help-item">공지사항</div>
                    <div className="help-item">개인정보처리방침</div>
                    <div className="help-item">서비스 이용약관</div>
                </div>
            </section>
            <footer className="footer">
                <p>© 2026 Virtual Fit Project</p>
            </footer>
        </div>

    );
};

export default MyPage;