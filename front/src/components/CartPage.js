import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./CartPage.css";

function CartPage() {
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        const token = sessionStorage.getItem("Authorization");

        if (token) {
            const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
            setCartItems(savedCart);
        } else {
            setCartItems([]);
        }
    }, []);

    const handleRemoveItem = (indexToRemove) => {
        const updatedCart = cartItems.filter((_, index) => index !== indexToRemove);
        setCartItems(updatedCart);
        localStorage.setItem("cart", JSON.stringify(updatedCart));
    };

    const increaseQty = (index) => {
        const updated = [...cartItems];
        updated[index].quantity = (updated[index].quantity || 1) + 1;
        setCartItems(updated);
        localStorage.setItem("cart", JSON.stringify(updated));
    };

    const decreaseQty = (index) => {
        const updated = [...cartItems];

        if ((updated[index].quantity || 1) > 1) {
            updated[index].quantity -= 1;
            setCartItems(updated);
            localStorage.setItem("cart", JSON.stringify(updated));
        }
    };

    const totalPrice = cartItems.reduce((sum, item) => {
        return sum + (item.price * (item.quantity || 1));
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
                                    <img src={item.image} alt={item.name} className="cart-image" />

                                    <div className="cart-info">
                                        <h3>{item.name}</h3>
                                        <p>{item.price.toLocaleString()}원</p>
                                    </div>

                                    <div className="item-actions">
                                        <div className="quantity-box">
                                            <button onClick={() => decreaseQty(index)}>-</button>
                                            <span>{item.quantity || 1}</span>
                                            <button onClick={() => increaseQty(index)}>+</button>
                                        </div>

                                        <button
                                            className="remove-btn"
                                            onClick={() => handleRemoveItem(index)}
                                        >
                                            삭제
                                        </button>
                                    </div>
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

            <footer className="footer">
                <p>© 2026 Virtual Fit Project</p>
            </footer>
        </div>
    );
}

export default CartPage;