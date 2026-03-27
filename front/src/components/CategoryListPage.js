import React from "react";
import { Link, useParams } from "react-router-dom";
import "./CategoryListPage.css";


const categories = [
    {
        id: 1,
        name: "상의",
        path: "top",
        image: "/top/short-tshirt/shirttop.jpeg",
        subCategories: [
            {
                name: "반팔 티셔츠",
                key: "short-tshirt",
                items: [
                    { id: "top-short-1", name: "흰색 반팔티", image: "/top/short-tshirt/shirt.jpeg", price: 16000 },
                    { id: "top-short-2", name: "레글런 반팔티", image: "/top/short-tshirt/short1.webp", price: 17000 },
                    { id: "top-short-3", name: "검정 반팔티", image: "/top/short-tshirt/short2.webp", price: 18000 },
                    { id: "top-short-4", name: "레이어드 반팔티", image: "/top/short-tshirt/short3.webp", price: 19000 },
                    { id: "top-short-5", name: "프릴 반팔티", image: "/top/short-tshirt/short4.webp", price: 20000 }
                ]
            },
            {
                name: "긴팔 티셔츠",
                key: "long-tshirt",
                items: [
                    { id: "top-long-1", name: "스트라이프 티", image: "/top/long-tshirt/long1.webp", price: 22000 },
                    { id: "top-long-2", name: "레이어드 긴팔 티", image: "/top/long-tshirt/long.webp", price: 24000 },
                    { id: "top-long-3", name: "기본 긴팔 티", image: "/top/long-tshirt/long2.webp", price: 23000 },
                    { id: "top-long-4", name: "기본 긴팔 티", image: "/top/long-tshirt/long3.webp", price: 25000 },
                    { id: "top-long-5", name: "기본 긴팔 티", image: "/top/long-tshirt/long4.webp", price: 26000 }
                ]
            },
            {
                name: "셔츠",
                key: "shirt",
                items: [
                    { id: "top-shirt-1", name: "체크무늬 셔츠", image: "/top/shirt/s.webp", price: 29000 },
                    { id: "top-shirt-2", name: "화이트 셔츠", image: "/top/shirt/s1.webp", price: 30000 },
                    { id: "top-shirt-3", name: "화이트 셔츠", image: "/top/shirt/s2.webp", price: 31000 },
                    { id: "top-shirt-4", name: "데님 셔츠", image: "/top/shirt/s3.webp", price: 32000 },
                    { id: "top-shirt-5", name: "검정 셔츠", image: "/top/shirt/s4.webp", price: 33000 }
                ]
            },
            {
                name: "블라우스",
                key: "blouse",
                items: [
                    { id: "top-blouse-1", name: "흰색 블라우스", image: "/top/blouse/bl.webp", price: 28000 },
                    { id: "top-blouse-2", name: "회색 블라우스", image: "/top/blouse/bl1.webp", price: 29000 },
                    { id: "top-blouse-3", name: "기본 블라우스", image: "/top/blouse/bl2.webp", price: 30000 },
                    { id: "top-blouse-4", name: "검정 블라우스", image: "/top/blouse/bl3.webp", price: 31000 },
                    { id: "top-blouse-5", name: "레이스 블라우스", image: "/top/blouse/bl4.webp", price: 32000 }
                ]
            },
            {
                name: "맨투맨",
                key: "sweatshirt",
                items: [
                    { id: "top-sweatshirt-1", name: "기본 맨투맨", image: "/top/sweatshirt/ss.webp", price: 27000 },
                    { id: "top-sweatshirt-2", name: "로고 맨투맨", image: "/top/sweatshirt/ss1.webp", price: 28000 },
                    { id: "top-sweatshirt-3", name: "기본 맨투맨", image: "/top/sweatshirt/ss2.webp", price: 29000 },
                    { id: "top-sweatshirt-4", name: "로고 맨투맨", image: "/top/sweatshirt/ss3.webp", price: 30000 },
                    { id: "top-sweatshirt-5", name: "로고 맨투맨", image: "/top/sweatshirt/ss4.webp", price: 31000 }
                ]
            },
            {
                name: "니트",
                key: "knit",
                items: [
                    { id: "top-knit-1", name: "베이직 니트", image: "/top/knit/k.jpeg", price: 34000 },
                    { id: "top-knit-2", name: "베이직 니트", image: "/top/knit/k1.webp", price: 35000 },
                    { id: "top-knit-3", name: "베이직 니트", image: "/top/knit/k2.webp", price: 36000 },
                    { id: "top-knit-4", name: "베이직 니트", image: "/top/knit/k3.webp", price: 37000 },
                    { id: "top-knit-5", name: "베이직 니트", image: "/top/knit/k4.webp", price: 38000 }
                ]
            },
            {
                name: "후드",
                key: "hoodie",
                items: [
                    { id: "top-hoodie-1", name: "기본 후드티", image: "/top/hoodie/h.webp", price: 33000 },
                    { id: "top-hoodie-2", name: "기본 후드티", image: "/top/hoodie/h1.webp", price: 34000 },
                    { id: "top-hoodie-3", name: "기본 후드티", image: "/top/hoodie/h2.webp", price: 35000 },
                    { id: "top-hoodie-4", name: "기본 후드티", image: "/top/hoodie/h3.webp", price: 36000 },
                    { id: "top-hoodie-5", name: "기본 후드티", image: "/top/hoodie/h4.webp", price: 37000 }
                ]
            }
        ]
    },
    {
        id: 2,
        name: "하의",
        path: "bottom",
        image: "/bottom/slacks/slacks1.jpeg",
        subCategories: [
            {
                name: "긴바지",
                key: "longpant",
                items: [
                    { id: "bottom-longpant-1", name: "기본 긴바지", image: "/bottom/longpant/pants.webp", price: 32000 },
                    { id: "bottom-longpant-2", name: "기본 긴바지", image: "/bottom/longpant/pants1.webp", price: 33000 },
                    { id: "bottom-longpant-3", name: "기본 긴바지", image: "/bottom/longpant/pants2.webp", price: 34000 },
                    { id: "bottom-longpant-4", name: "기본 긴바지", image: "/bottom/longpant/pants3.webp", price: 35000 },
                    { id: "bottom-longpant-5", name: "기본 긴바지", image: "/bottom/longpant/pants4.webp", price: 36000 }
                ]
            },
            {
                name: "슬랙스",
                key: "slacks",
                items: [
                    { id: "bottom-slacks-1", name: "와이드 슬랙스", image: "/bottom/slacks/sl.webp", price: 39000 },
                    { id: "bottom-slacks-2", name: "와이드 슬랙스", image: "/bottom/slacks/sl1.webp", price: 40000 },
                    { id: "bottom-slacks-3", name: "와이드 슬랙스", image: "/bottom/slacks/sl2.webp", price: 41000 },
                    { id: "bottom-slacks-4", name: "와이드 슬랙스", image: "/bottom/slacks/sl3.webp", price: 42000 },
                    { id: "bottom-slacks-5", name: "와이드 슬랙스", image: "/bottom/slacks/sl4.webp", price: 43000 }
                ]
            },
            {
                name: "반바지",
                key: "shortpant",
                items: [
                    { id: "bottom-shortpant-1", name: "기본 반바지", image: "/bottom/shortpant/sp.webp", price: 22000 },
                    { id: "bottom-shortpant-2", name: "기본 반바지", image: "/bottom/shortpant/sp1.webp", price: 23000 },
                    { id: "bottom-shortpant-3", name: "기본 반바지", image: "/bottom/shortpant/sp2.webp", price: 24000 },
                    { id: "bottom-shortpant-4", name: "기본 반바지", image: "/bottom/shortpant/sp3.webp", price: 25000 },
                    { id: "bottom-shortpant-5", name: "기본 반바지", image: "/bottom/shortpant/sp4.webp", price: 26000 }
                ]
            }
        ]
    },
    {
        id: 3,
        name: "아우터",
        path: "outer",
        image: "/outer/jacket/jacket1.jpeg",
        subCategories: [
            {
                name: "자켓",
                key: "jacket",
                items: [
                    { id: "outer-jacket-1", name: "기본 자켓", image: "/outer/jacket/j.webp", price: 55000 },
                    { id: "outer-jacket-2", name: "기본 자켓", image: "/outer/jacket/j1.webp", price: 56000 },
                    { id: "outer-jacket-3", name: "기본 자켓", image: "/outer/jacket/j2.webp", price: 57000 },
                    { id: "outer-jacket-4", name: "기본 자켓", image: "/outer/jacket/j3.webp", price: 58000 },
                    { id: "outer-jacket-5", name: "기본 자켓", image: "/outer/jacket/j4.webp", price: 59000 }
                ]
            },
            {
                name: "코트",
                key: "coat",
                items: [
                    { id: "outer-coat-1", name: "롱 코트", image: "/outer/coat/c.webp", price: 69000 },
                    { id: "outer-coat-2", name: "롱 코트", image: "/outer/coat/c1.webp", price: 70000 },
                    { id: "outer-coat-3", name: "롱 코트", image: "/outer/coat/c2.webp", price: 71000 },
                    { id: "outer-coat-4", name: "롱 코트", image: "/outer/coat/c3.webp", price: 72000 },
                    { id: "outer-coat-5", name: "롱 코트", image: "/outer/coat/c4.webp", price: 73000 }
                ]
            },
            {
                name: "가디건",
                key: "cardigan",
                items: [
                    { id: "outer-cardigan-1", name: "니트 가디건", image: "/outer/cardigan/ca.webp", price: 42000 },
                    { id: "outer-cardigan-2", name: "니트 가디건", image: "/outer/cardigan/ca1.webp", price: 43000 },
                    { id: "outer-cardigan-3", name: "니트 가디건", image: "/outer/cardigan/ca2.webp", price: 44000 },
                    { id: "outer-cardigan-4", name: "니트 가디건", image: "/outer/cardigan/ca3.webp", price: 45000 },
                    { id: "outer-cardigan-5", name: "니트 가디건", image: "/outer/cardigan/ca4.webp", price: 46000 }
                ]
            },
            {
                name: "패딩",
                key: "downjacket",
                items: [
                    { id: "outer-downjacket-1", name: "숏 패딩", image: "/outer/downjacket/d.webp", price: 79000 },
                    { id: "outer-downjacket-2", name: "숏 패딩", image: "/outer/downjacket/d1.webp", price: 80000 },
                    { id: "outer-downjacket-3", name: "숏 패딩", image: "/outer/downjacket/d2.webp", price: 81000 },
                    { id: "outer-downjacket-4", name: "숏 패딩", image: "/outer/downjacket/d3.webp", price: 82000 },
                    { id: "outer-downjacket-5", name: "숏 패딩", image: "/outer/downjacket/d4.webp", price: 83000 }
                ]
            }
        ]
    }
];

const CategoryListPage = () => {
    const { type } = useParams();

    const [wishlist, setWishlist] = React.useState([]);
    const [cart, setCart] = React.useState([]);

    React.useEffect(() => {
        const savedWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
        const savedCart = JSON.parse(localStorage.getItem("cart")) || [];

        setWishlist(savedWishlist);
        setCart(savedCart);
    }, []);

    const selectedCategory = categories.find(
        (category) => category.path === type
    );

    const toggleWishlist = (product) => {
        const isExist = wishlist.some((item) => item.id === product.id);

        let updatedWishlist;
        if (isExist) {
            updatedWishlist = wishlist.filter((item) => item.id !== product.id);
        } else {
            updatedWishlist = [...wishlist, product];
        }

        setWishlist(updatedWishlist);
        localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
    };

    const isWished = (id) => wishlist.some((item) => item.id === id);

    const toggleCart = (product) => {
        const isExist = cart.some((item) => item.id === product.id);

        let updatedCart;
        if (isExist) {
            updatedCart = cart.filter((item) => item.id !== product.id);
        } else {
            updatedCart = [...cart, product];
        }

        setCart(updatedCart);
        localStorage.setItem("cart", JSON.stringify(updatedCart));
    };

    const isInCart = (id) => cart.some((item) => item.id === id);



    if (!selectedCategory) {
        return (
            <div className="category-list-container">
                <h2>카테고리를 찾을 수 없습니다.</h2>
                <Link to="/category" className="back-btn">카테고리로 돌아가기</Link>
            </div>
        );
    }

    return (
        <div className="category-list-container">
            <header className="navbar">
                <h2 className="logo">
                    <Link to="/" className="logo-link">Fit on X</Link>
                </h2>
                <div className="menu">
                    <Link to="/category">카테고리</Link>
                    <Link to="/recommend">추천</Link>
                    <Link to="/wishlist">찜</Link>
                    <Link to="/cart">장바구니</Link>
                    <Link to="/mypage">마이페이지</Link>
                </div>
            </header>

            <section className="category-list-header">
                <h1>{selectedCategory.name}</h1>
                <p>{selectedCategory.name} 카테고리의 상품을 확인해보세요</p>
            </section>

            {selectedCategory.subCategories.map((subCategory) => (
                <section className="sub-category-section" key={subCategory.key}>
                    <h2>{subCategory.name}</h2>

                    <div className="product-grid">
                        {subCategory.items.map((item) => (
                            <div className="product-card" key={item.id}>
                                <button
                                    className="wishlist-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleWishlist(item);
                                    }}
                                >
                                    {isWished(item.id) ? "❤️" : "🤍"}
                                </button>

                                <button
                                    className="cart-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleCart(item);
                                    }}
                                >
                                    {isInCart(item.id) ? "🛒" : "🛍️"}
                                </button>

                                <img src={item.image} alt={item.name} className="product-image" />
                                <p className="product-name">{item.name}</p>
                                <p className="product-price">{item.price.toLocaleString()}원</p>
                            </div>
                        ))}
                    </div>
                </section>
            ))}

            <div className="back-area">
                <Link to="/category" className="back-btn">카테고리 메인으로 돌아가기</Link>
            </div>

            <footer className="footer">
                <p>© 2026 Virtual Fit Project</p>
            </footer>
        </div>
    );
};

export default CategoryListPage;