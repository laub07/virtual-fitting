import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./WishList.css";
import { getWishlist, removeWishlist } from "../api/user/wishlistApi";
import Header from "./Header";

const WishList = () => {
    const userId = Number(sessionStorage.getItem("userId"));
    const hasUserId = Number.isSafeInteger(userId) && userId > 0;

    const [wishlist, setWishlist] = useState([]);
    const [isLoading, setIsLoading] = useState(hasUserId);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        if (!hasUserId) return;

        let active = true;
        setIsLoading(true);
        setLoadError("");

        async function loadWishlist() {
            try {
                const data = await getWishlist(userId);
                console.log("찜 목록 첫 항목", data[0]);

                if (!Array.isArray(data)) {
                    throw new Error("찜 목록 응답이 배열이 아닙니다.");
                }

                if (active) setWishlist(data);
            } catch (error) {
                console.error("찜 목록 조회 실패", error);
                if (active) setLoadError("찜 목록을 불러오지 못했습니다.");
            } finally {
                if (active) setIsLoading(false);
            }
        }

        loadWishlist();

        return () => {
            active = false;
        };
    }, [hasUserId, userId]);

    const handleRemoveWishlist = async (productId) => {
        try {
            await removeWishlist(userId, productId);
            setWishlist((prev) =>
                prev.filter((item) => item.productId !== productId)
            );
        } catch (error) {
            console.error("찜 삭제 실패", error);
            alert("찜 삭제에 실패했습니다.");
        }
    };

    return (
        <div className="wishlist-container">
            <Header />

            <section className="wishlist-section">
                <h1>찜한 상품</h1>

                {!hasUserId ? (
                    <p className="empty-text">
                        찜 목록을 보려면 <Link to="/login">로그인</Link>해 주세요.
                    </p>
                ) : isLoading ? (
                    <p className="empty-text" role="status">
                        찜 목록을 불러오는 중입니다.
                    </p>
                ) : loadError ? (
                    <p className="empty-text" role="alert">{loadError}</p>
                ) : wishlist.length === 0 ? (
                    <p className="empty-text">찜한 상품이 없습니다.</p>
                ) : (
                    <div className="wishlist-list">
                        {wishlist.map((product) => (
                            <div className="wishlist-card" key={product.productId}>
                                <img src={product.image} alt={product.productName} />
                                <p>{product.productName}</p>
                                <button
                                    type="button"
                                    className="wishlist-btn"
                                    aria-label={`${product.productName} 찜 해제`}
                                    onClick={() => handleRemoveWishlist(product.productId)}
                                >
                                    ❤️
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <footer className="footer">
                <p>© 2026 Virtual Fit Project</p>
            </footer>
        </div>
    );
};

export default WishList;