import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./CartPage.css";


function CartPage() {
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
        setCartItems(savedCart);
    }, []);

    const handleRemoveItem = (indexToRemove) => {
        const updatedCart = cartItems.filter((_, index) => index !== indexToRemove);
        setCartItems(updatedCart);
        localStorage.setItem("cart", JSON.stringify(updatedCart));
    };

    const totalPrice = cartItems.reduce((sum, item) => {
        return sum + Number(item.price || 0);
    }, 0);

    return (
        <div className="cart-container">
            <header className="cart-header">
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

            <section className="cart-section">
                <h1>장바구니</h1>

                {cartItems.length === 0 ? (
                    <div className="empty-cart">
                        <p>장바구니가 비어 있습니다.</p>
                        <Link to="/category" className="shop-link">상품 보러가기</Link>
                    </div>
                ) : (
                    <>
                        <div className="cart-list">
                            {cartItems.map((item, index) => (
                                <div className="cart-card" key={index}>
                                    {item.image && (
                                        <img src={item.image} alt={item.name} className="cart-image" />
                                    )}
                                    <div className="cart-info">
                                        <h3>{item.name}</h3>
                                        <p>{item.price}원</p>
                                    </div>
                                    <button
                                        className="remove-btn"
                                        onClick={() => handleRemoveItem(index)}
                                    >
                                        삭제
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="cart-summary">
                            <h3>주문 예상 금액</h3>
                            <p>{totalPrice.toLocaleString()}원</p>
                        </div>
                    </>
                )}
            </section>
            {/* Footer */}
            <footer className="footer">
                <p>© 2026 Virtual Fit Project</p>
            </footer>
        </div>
    );
}

export default CartPage;