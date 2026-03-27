import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./WishList.css";

const WishList = () => {
    const [wishlist, setWishlist] = useState([]);

    useEffect(() => {
        const savedWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
        setWishlist(savedWishlist);
    }, []);

    const removeFromWishlist = (id) => {
        const updatedWishlist = wishlist.filter((item) => item.id !== id);
        setWishlist(updatedWishlist);
        localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
    };

    return (
        <div className="wishlist-container">
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

            <section className="wishlist-section">
                <h1>찜한 상품</h1>

                {wishlist.length === 0 ? (
                    <p className="empty-text">찜한 상품이 없습니다.</p>
                ) : (
                    <div className="wishlist-list">
                        {wishlist.map((product) => (
                            <div className="wishlist-card" key={product.id}>
                                <img src={product.image} alt={product.name} />
                                <p>{product.name}</p>
                                <button
                                    className="wishlist-btn"
                                    onClick={() => removeFromWishlist(product.id)}
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