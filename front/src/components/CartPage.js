import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./CartPage.css";

function CartPage() {
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        fetch("http://localhost:8080/api/cart")
            .then(res => res.json())
            .then(data => setCartItems(data))
            .catch(err => console.error(err));
    }, []);

    const handleRemoveItem = (id) => {
        fetch(`http://localhost:8080/api/cart/${id}`, {
            method: "DELETE",
        })
            .then(() => {
                const updatedCart = cartItems.filter(item => item.id !== id);
                setCartItems(updatedCart);
            })
            .catch(err => console.error(err));
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
                        <Link to="/category" className="shop-link">
                            상품 보러가기
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="cart-list">
                            {cartItems.map((item) => (
                                <div className="cart-card" key={item.id}>
                                    {item.image && (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="cart-image"
                                        />
                                    )}

                                    <div className="cart-info">
                                        <h3>{item.name}</h3>
                                        <p>{Number(item.price).toLocaleString()}원</p>
                                    </div>

                                    <button
                                        className="remove-btn"
                                        onClick={() => handleRemoveItem(item.id)}
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

            <footer className="footer">
                <p>© 2026 Virtual Fit Project</p>
            </footer>
        </div>
    );
}

export default CartPage;