
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import "./MyPage.css";

const readSession = (key) => {
    const value = sessionStorage.getItem(key)?.trim();
    return value && !["null", "undefined"].includes(value) ? value : null;
};

const infoCards = [
    {
        title: "찜한 상품",
        description: "내가 저장한 상품을 확인할 수 있어요.",
        path: "/wishlist",
        button: "바로가기"
    },
    {
        title: "추천 상품",
        description: "날씨 별 추천 내역을 볼 수 있어요.",
        path: "/recommend",
        button: "보러가기"
    },
    {
        title: "장바구니",
        description: "담아둔 상품을 확인할 수 있어요.",
        path: "/cart",
        button: "보러가기"
    }
];

function MyPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(
        () => Boolean(readSession("Authorization") || readSession("userId"))
    );

    const username = isLoggedIn ? readSession("Username") : null;
    const [isEditing, setIsEditing] = useState(false);
    const [topSize, setTopSize] = useState("");
    const [bottomSize, setBottomSize] = useState("");

    useEffect(() => {
        if (!isLoggedIn) return;

        setTopSize(localStorage.getItem("topSize") || "");
        setBottomSize(localStorage.getItem("bottomSize") || "");
    }, [isLoggedIn]);

    // 로그아웃
    const handleLogout = () => {
        ["Authorization", "Role", "userId", "Username"].forEach(
            (key) => sessionStorage.removeItem(key)
        );

        setIsLoggedIn(false);
        window.location.href = "/";
    };

    // 사이즈 저장
    const handleSaveSize = () => {
        localStorage.setItem("topSize", topSize);
        localStorage.setItem("bottomSize", bottomSize);
        setIsEditing(false);
    };

    // 가상 피팅 실행
    const startVirtualFitting = async () => {
        try {
            const response = await fetch(
                "http://localhost:8080/api/fitting/start",
                { method: "POST" }
            );

            if (!response.ok) throw new Error("가상 피팅 실행 오류");

            alert(await response.text());
        } catch (error) {
            console.error(error);
            alert("가상 피팅 실행 실패");
        }
    };

    return (
        <div className="mypage-container">
            <Header />

            <section className="mypage-hero">
                <p>내 정보와 쇼핑 활동을 한눈에 확인해보세요</p>
            </section>

            <section className="mypage-content">

                {/* 회원 정보 */}
                <div className="profile-card">
                    <span className="membership-badge">
                        {isLoggedIn ? "회원" : "비회원"}
                    </span>

                    {isLoggedIn ? (
                        <>
                            <h2>
                                {username
                                    ? `${username}님, 반가워요!`
                                    : "반가워요!"}
                            </h2>

                            <p className="login-desc">
                                내 사이즈와 쇼핑 활동을 확인해보세요.
                            </p>

                            <div className="profile-buttons">
                                <button
                                    type="button"
                                    className="logout-btn"
                                    onClick={handleLogout}>
                                    로그아웃
                                </button>
                            </div>

                            {/* 나만의 가상 피팅 */}
                            <div className="mypage-fitting">
                                <div className="mypage-fitting-title">
                                    <span><h3>👕</h3></span>
                                    <h3>나만의 가상 피팅</h3>
                                </div>

                                <p>
                                    마음에 드는 옷을 가상으로
                                    입어보세요.
                                </p>

                                <button
                                    type="button"
                                    className="mypage-fitting-btn"
                                    onClick={startVirtualFitting}
                                >
                                    피팅 시작하기 →
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h2>WearIt! Wear IT!</h2>

                            <p className="login-desc">
                                지금 가입하고{" "}
                                <span>가상피팅</span>{" "}
                                체험을 해보세요 !
                            </p>

                            <div className="profile-buttons">
                                <Link
                                    to="/signup"
                                    className="signup-btn-link"
                                >
                                    회원가입
                                </Link>

                                <Link
                                    to="/login"
                                    className="login-btn-link"
                                >
                                    로그인
                                </Link>
                            </div>
                        </>
                    )}
                </div>

                {/* 쇼핑 정보 */}
                <div className="info-grid">
                    {infoCards.map((card) => (
                        <div className="info-card" key={card.path}>
                            <h3>{card.title}</h3>
                            <p>{card.description}</p>
                            <Link to={card.path} className="card-link">
                                {card.button}
                            </Link>
                        </div>
                    ))}

                    {/* 내 사이즈 정보 */}
                    <div className="info-card">
                        <h3>내 사이즈 정보</h3>

                        {!isLoggedIn ? (
                            <>
                                <p>
                                    로그인 후 내 사이즈를 확인하고
                                    수정할 수 있어요.
                                </p>
                                <Link to="/login" className="card-link">
                                    로그인하기
                                </Link>
                            </>
                        ) : isEditing ? (
                            <>
                                <div className="size-inputs">
                                    <input
                                        type="text"
                                        aria-label="상의 사이즈"
                                        placeholder="상의 (예: M)"
                                        value={topSize}
                                        onChange={(e) =>
                                            setTopSize(e.target.value)
                                        }
                                    />
                                    <input
                                        type="text"
                                        aria-label="하의 사이즈"
                                        placeholder="하의 (예: 25)"
                                        value={bottomSize}
                                        onChange={(e) =>
                                            setBottomSize(e.target.value)
                                        }
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
                        ) : (
                            <>
                                <p>
                                    상의 {topSize || "미설정"} /
                                    하의 {bottomSize || "미설정"}
                                </p>

                                <button
                                    type="button"
                                    className="card-btn"
                                    onClick={() => setIsEditing(true)}
                                >
                                    수정하기
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* 고객 지원 */}
            <section className="help-section">
                <h2>고객 지원</h2>
                <div className="help-list">
                    {[
                        "고객센터",
                        "공지사항",
                        "개인정보처리방침",
                        "서비스 이용약관"
                    ].map((item) => (
                        <div className="help-item" key={item}>
                            {item}
                        </div>
                    ))}
                </div>
            </section>

            <footer className="footer">
                <p>© 2026 Virtual Fit Project</p>
            </footer>
        </div>
    );
}

export default MyPage;