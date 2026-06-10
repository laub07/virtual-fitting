import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./CartPage.css";

function CartPage() {
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        const userId = sessionStorage.getItem("userId");

        if (!userId) {
            setCartItems([]);
            return;
        }

        fetch(`http://localhost:8080/api/cart/${userId}`)
            .then((res) => res.json())
            .then((data) => {
                console.log("장바구니 조회:", data);
                setCartItems(Array.isArray(data) ? data : []);
            })
            .catch((err) => {
                console.error("장바구니 조회 실패:", err);
                setCartItems([]);
            });
    }, []);

    const handleRemoveItem = (cartId) => {
        fetch(`http://localhost:8080/api/cart/${cartId}`, {
            method: "DELETE",
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error("장바구니 삭제 실패");
                }

                setCartItems(cartItems.filter((item) => item.cartId !== cartId));
            })
            .catch((err) => {
                console.error("장바구니 삭제 실패:", err);
                alert("장바구니 삭제 중 오류가 발생했습니다.");
            });
    };

    const increaseQty = (index) => {
        const updated = [...cartItems];
        updated[index].quantity = Number(updated[index].quantity || 1) + 1;
        setCartItems(updated);
    };

    const decreaseQty = (index) => {
        const updated = [...cartItems];

        if (Number(updated[index].quantity || 1) > 1) {
            updated[index].quantity = Number(updated[index].quantity) - 1;
            setCartItems(updated);
        }
    };

    const totalPrice = cartItems.reduce((sum, item) => {
        return sum + Number(item.price || 0) * Number(item.quantity || 1);
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
                            {cartItems.map((item, index) => (
                                <div className="cart-card" key={item.cartId}>
                                    {item.imageUrl && (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.productName}
                                            className="cart-image"
                                        />
                                    )}

                                    <div className="cart-info">
                                        <h3>{item.productName}</h3>
                                        <p>{Number(item.price || 0).toLocaleString()}원</p>
                                    </div>

                                    <div className="item-actions">
                                        <div className="quantity-box">
                                            <button onClick={() => decreaseQty(index)}>-</button>
                                            <span>{item.quantity || 1}</span>
                                            <button onClick={() => increaseQty(index)}>+</button>
                                        </div>

                                        <button
                                            className="remove-btn"
                                            onClick={() => handleRemoveItem(item.cartId)}
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