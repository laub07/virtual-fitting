import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./MyPage.css";
import Header from "./Header";

const membershipBadgeStyle = {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "20px",
    background: "#fceee5",
    color: "#714b36",
    fontSize: "14px",
    fontWeight: 700,
};

function readSessionValue(key) {
    const value = sessionStorage.getItem(key)?.trim();
    return value && value !== "null" && value !== "undefined" ? value : null;
}

function MyPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        return Boolean(
            readSessionValue("Authorization") || readSessionValue("userId")
        );
    });

    const username = isLoggedIn ? readSessionValue("Username") : null;
    const [isEditing, setIsEditing] = useState(false);
    const [topSize, setTopSize] = useState("");
    const [bottomSize, setBottomSize] = useState("");

    useEffect(() => {
        if (isLoggedIn) {
            setTopSize(localStorage.getItem("topSize") || "");
            setBottomSize(localStorage.getItem("bottomSize") || "");
        }
    }, [isLoggedIn]);

    const handleLogout = () => {
        sessionStorage.removeItem("Authorization");
        sessionStorage.removeItem("Role");
        sessionStorage.removeItem("userId");
        sessionStorage.removeItem("Username");
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
            <Header />
            <section className="mypage-hero">
                <p>내 정보와 쇼핑 활동을 한눈에 확인해보세요</p>
            </section>

            <section className="mypage-content">
                <div className="profile-card">
                    <span style={membershipBadgeStyle}>
                        {isLoggedIn ? "회원" : "비회원"}
                    </span>

                    {isLoggedIn ? (
                        <>
                            <h2>{username ? `${username}님, 반가워요!` : "반가워요!"}</h2>
                            <p className="login-desc">
                                내 사이즈와 쇼핑 활동을 확인해보세요.
                            </p>

                            <div className="profile-buttons">
                                <button
                                    type="button"
                                    className="logout-btn"
                                    onClick={handleLogout}
                                >
                                    로그아웃
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h2>회원이라면 누구나 무료배송</h2>
                            <p className="login-desc">
                                지금 가입하고 <span>최대 30% 할인 쿠폰</span>{" "}
                                혜택을 받아보세요
                            </p>

                            <div className="profile-buttons">
                                <Link to="/signup" className="signup-btn-link">
                                    회원가입
                                </Link>
                                <Link to="/login" className="login-btn-link">
                                    로그인
                                </Link>
                            </div>
                        </>
                    )}
                </div>

                <div className="info-grid">
                    <div className="info-card">
                        <h3>찜한 상품</h3>
                        <p>내가 저장한 상품을 확인할 수 있어요.</p>
                        <Link to="/wishlist" className="card-link">
                            바로가기
                        </Link>
                    </div>

                    <div className="info-card">
                        <h3>추천 상품</h3>
                        <p>날씨 별 추천 내역을 볼 수 있어요.</p>
                        <Link to="/recommend" className="card-link">
                            보러가기
                        </Link>
                    </div>

                    <div className="info-card">
                        <h3>장바구니</h3>
                        <p>담아둔 상품을 확인할 수 있어요.</p>
                        <Link to="/cart" className="card-link">
                            보러가기
                        </Link>
                    </div>

                    <div className="info-card">
                        <h3>내 사이즈 정보</h3>

                        {!isLoggedIn ? (
                            <>
                                <p>로그인 후 내 사이즈를 확인하고 수정할 수 있어요.</p>
                                <Link to="/login" className="card-link">
                                    로그인하기
                                </Link>
                            </>
                        ) : !isEditing ? (
                            <>
                                <p>
                                    상의 {topSize || "미설정"} / 하의{" "}
                                    {bottomSize || "미설정"}
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
                                        aria-label="상의 사이즈"
                                        placeholder="상의 (예: M)"
                                        value={topSize}
                                        onChange={(event) => setTopSize(event.target.value)}
                                    />
                                    <input
                                        type="text"
                                        aria-label="하의 사이즈"
                                        placeholder="하의 (예: 25)"
                                        value={bottomSize}
                                        onChange={(event) => setBottomSize(event.target.value)}
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
}

export default MyPage;