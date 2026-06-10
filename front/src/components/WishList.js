import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./WishList.css";
import { getWishlist, removeWishlist } from "../api/user/wishlistApi";

const WishList = () => {
    const [wishlist, setWishlist] = useState([]);

    const userId = 1; // 임시 로그인 사용자 ID

    useEffect(() => {
        getWishlist(userId)
            .then((data) => setWishlist(data))
            .catch((err) => console.error(err));
    }, []);

    const handleRemoveWishlist = async (productId) => {
        try {
            await removeWishlist(userId, productId);

            setWishlist((prev) =>
                prev.filter((item) => item.productId !== productId)
            );
        } catch (err) {
            console.error(err);
            alert("찜 삭제에 실패했습니다.");
        }
    };

    return (
        <div className="wishlist-container">
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

            <section className="wishlist-section">
                <h1>찜한 상품</h1>

                {wishlist.length === 0 ? (
                    <p className="empty-text">찜한 상품이 없습니다.</p>
                ) : (
                    <div className="wishlist-list">
                        {wishlist.map((product) => (
                            <div className="wishlist-card" key={product.productId}>
                                <img src={product.image} alt={product.productName} />
                                <p>{product.productName}</p>

                                <button
                                    className="wishlist-btn"
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