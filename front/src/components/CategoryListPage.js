
import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
    addWishlist,
    removeWishlist,
    getWishlist
} from "../api/user/wishlistApi";
import "./CategoryListPage.css";
import Header from "./Header";

const API = "http://localhost:8080";

// 기존 쇼핑몰 상품 70개
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
                    { id: "top-short-1", name: "흰색 반팔티", image: "/top/short-tshirt/shirt.jpg", price: 16000 },
                    { id: "top-short-2", name: "레글런 반팔티", image: "/top/short-tshirt/short1.webp", price: 17000 },
                    { id: "top-short-3", name: "검정 반팔티", image: "/top/short-tshirt/short2.jpg", price: 18000 },
                    { id: "top-short-4", name: "레이어드 반팔티", image: "/top/short-tshirt/short3.webp", price: 19000 },
                    { id: "top-short-5", name: "프릴 반팔티", image: "/top/short-tshirt/short4.webp", price: 20000 }
                ]
            },
            {
                name: "긴팔 티셔츠",
                key: "long-tshirt",
                items: [
                    { id: "top-long-1", name: "스트라이프 티", image: "/top/long-tshirt/long1.webp", price: 22000 },
                    { id: "top-long-2", name: "레이어드 긴팔 티", image: "/top/long-tshirt/long.jpeg", price: 24000 },
                    { id: "top-long-3", name: "기본 긴팔 티", image: "/top/long-tshirt/long2.jpg", price: 23000 },
                    { id: "top-long-4", name: "기본 긴팔 티", image: "/top/long-tshirt/long3.webp", price: 25000 },
                    { id: "top-long-5", name: "기본 긴팔 티", image: "/top/long-tshirt/long4.jpg", price: 26000 }
                ]
            },
            {
                name: "셔츠",
                key: "shirt",
                items: [
                    { id: "top-shirt-1", name: "체크무늬 셔츠", image: "/top/shirt/s.webp", price: 29000 },
                    { id: "top-shirt-2", name: "화이트 셔츠", image: "/top/shirt/s1.png", price: 30000 },
                    { id: "top-shirt-3", name: "화이트 셔츠", image: "/top/shirt/s2.webp", price: 31000 },
                    { id: "top-shirt-4", name: "데님 셔츠", image: "/top/shirt/s3.webp", price: 32000 },
                    { id: "top-shirt-5", name: "검정 셔츠", image: "/top/shirt/s4.png", price: 33000 }
                ]
            },
            {
                name: "블라우스",
                key: "blouse",
                items: [
                    { id: "top-blouse-1", name: "흰색 블라우스", image: "/top/blouse/bl.webp", price: 28000 },
                    { id: "top-blouse-2", name: "회색 블라우스", image: "/top/blouse/bl1.jpg", price: 29000 },
                    { id: "top-blouse-3", name: "기본 블라우스", image: "/top/blouse/bl2.jpeg", price: 30000 },
                    { id: "top-blouse-4", name: "검정 블라우스", image: "/top/blouse/bl3.webp", price: 31000 },
                    { id: "top-blouse-5", name: "레이스 블라우스", image: "/top/blouse/bl4.png", price: 32000 }
                ]
            },
            {
                name: "맨투맨",
                key: "sweatshirt",
                items: [
                    { id: "top-sweatshirt-1", name: "기본 맨투맨", image: "/top/sweatshirt/ss.webp", price: 27000 },
                    { id: "top-sweatshirt-2", name: "로고 맨투맨", image: "/top/sweatshirt/ss1.webp", price: 28000 },
                    { id: "top-sweatshirt-3", name: "기본 맨투맨", image: "/top/sweatshirt/ss2.png", price: 29000 },
                    { id: "top-sweatshirt-4", name: "로고 맨투맨", image: "/top/sweatshirt/ss3.webp", price: 30000 },
                    { id: "top-sweatshirt-5", name: "로고 맨투맨", image: "/top/sweatshirt/ss4.webp", price: 31000 }
                ]
            },
            {
                name: "니트",
                key: "knit",
                items: [
                    { id: "top-knit-1", name: "베이직 니트", image: "/top/knit/k.jpg", price: 34000 },
                    { id: "top-knit-2", name: "베이직 니트", image: "/top/knit/k1.jpg", price: 35000 },
                    { id: "top-knit-3", name: "베이직 니트", image: "/top/knit/k2.jpg", price: 36000 },
                    { id: "top-knit-4", name: "베이직 니트", image: "/top/knit/k3.webp", price: 37000 },
                    { id: "top-knit-5", name: "베이직 니트", image: "/top/knit/k4.webp", price: 38000 }
                ]
            },
            {
                name: "후드",
                key: "hoodie",
                items: [
                    { id: "top-hoodie-1", name: "기본 후드티", image: "/top/hoodie/h.jpg", price: 33000 },
                    { id: "top-hoodie-2", name: "기본 후드티", image: "/top/hoodie/h1.webp", price: 34000 },
                    { id: "top-hoodie-3", name: "기본 후드티", image: "/top/hoodie/h2.png", price: 35000 },
                    { id: "top-hoodie-4", name: "기본 후드티", image: "/top/hoodie/h3.jpg", price: 36000 },
                    { id: "top-hoodie-5", name: "기본 후드티", image: "/top/hoodie/h4.jpg", price: 37000 }
                ]
            }
        ]
    },
    {
        id: 2,
        name: "하의",
        path: "bottom",
        image: "/bottom/longpant/pants.png",
        subCategories: [
            {
                name: "긴바지",
                key: "longpant",
                items: [
                    { id: "bottom-longpant-1", name: "기본 긴바지", image: "/bottom/longpant/pants.png", price: 32000 },
                    { id: "bottom-longpant-2", name: "기본 긴바지", image: "/bottom/longpant/pants1.webp", price: 33000 },
                    { id: "bottom-longpant-3", name: "기본 긴바지", image: "/bottom/longpant/pants2.png", price: 34000 },
                    { id: "bottom-longpant-4", name: "기본 긴바지", image: "/bottom/longpant/pants3.png", price: 35000 },
                    { id: "bottom-longpant-5", name: "기본 긴바지", image: "/bottom/longpant/pants4.png", price: 36000 }
                ]
            },
            {
                name: "슬랙스",
                key: "slacks",
                items: [
                    { id: "bottom-slacks-1", name: "와이드 슬랙스", image: "/bottom/slacks/sl.png", price: 39000 },
                    { id: "bottom-slacks-2", name: "와이드 슬랙스", image: "/bottom/slacks/sl1.png", price: 40000 },
                    { id: "bottom-slacks-3", name: "와이드 슬랙스", image: "/bottom/slacks/sl2.png", price: 41000 },
                    { id: "bottom-slacks-4", name: "와이드 슬랙스", image: "/bottom/slacks/sl3.png", price: 42000 },
                    { id: "bottom-slacks-5", name: "와이드 슬랙스", image: "/bottom/slacks/sl4.png", price: 43000 }
                ]
            },
            {
                name: "반바지",
                key: "shortpant",
                items: [
                    { id: "bottom-shortpant-1", name: "기본 반바지", image: "/bottom/shortpant/sp.webp", price: 22000 },
                    { id: "bottom-shortpant-2", name: "기본 반바지", image: "/bottom/shortpant/sp1.png", price: 23000 },
                    { id: "bottom-shortpant-3", name: "기본 반바지", image: "/bottom/shortpant/sp2.png", price: 24000 },
                    { id: "bottom-shortpant-4", name: "기본 반바지", image: "/bottom/shortpant/sp3.png", price: 25000 },
                    { id: "bottom-shortpant-5", name: "기본 반바지", image: "/bottom/shortpant/sp4.png", price: 26000 }
                ]
            }
        ]
    },
    {
        id: 3,
        name: "아우터",
        path: "outer",
        image: "/outer/c1.webp",
        subCategories: [
            {
                name: "자켓",
                key: "jacket",
                items: [
                    { id: "outer-jacket-1", name: "기본 자켓", image: "/outer/jacket/j.png", price: 55000 },
                    { id: "outer-jacket-2", name: "기본 자켓", image: "/outer/jacket/j1.png", price: 56000 },
                    { id: "outer-jacket-3", name: "기본 자켓", image: "/outer/jacket/j2.webp", price: 57000 },
                    { id: "outer-jacket-4", name: "기본 자켓", image: "/outer/jacket/j3.webp", price: 58000 },
                    { id: "outer-jacket-5", name: "기본 자켓", image: "/outer/jacket/j4.png", price: 59000 }
                ]
            },
            {
                name: "코트",
                key: "coat",
                items: [
                    { id: "outer-coat-1", name: "롱 코트", image: "/outer/coat/c.webp", price: 69000 },
                    { id: "outer-coat-2", name: "롱 코트", image: "/outer/coat/c1.webp", price: 70000 },
                    { id: "outer-coat-3", name: "롱 코트", image: "/outer/coat/c2.png", price: 71000 },
                    { id: "outer-coat-4", name: "롱 코트", image: "/outer/coat/c3.png", price: 72000 },
                    { id: "outer-coat-5", name: "롱 코트", image: "/outer/coat/c4.png", price: 73000 }
                ]
            },
            {
                name: "가디건",
                key: "cardigan",
                items: [
                    { id: "outer-cardigan-1", name: "니트 가디건", image: "/outer/cardigan/ca.png", price: 42000 },
                    { id: "outer-cardigan-2", name: "니트 가디건", image: "/outer/cardigan/ca1.webp", price: 43000 },
                    { id: "outer-cardigan-3", name: "니트 가디건", image: "/outer/cardigan/ca2.webp", price: 44000 },
                    { id: "outer-cardigan-4", name: "니트 가디건", image: "/outer/cardigan/ca3.webp", price: 45000 },
                    { id: "outer-cardigan-5", name: "니트 가디건", image: "/outer/cardigan/ca4.png", price: 46000 }
                ]
            },
            {
                name: "패딩",
                key: "downjacket",
                items: [
                    { id: "outer-downjacket-1", name: "숏 패딩", image: "/outer/downjacket/d.webp", price: 79000 },
                    { id: "outer-downjacket-2", name: "숏 패딩", image: "/outer/downjacket/d1.webp", price: 80000 },
                    { id: "outer-downjacket-3", name: "숏 패딩", image: "/outer/downjacket/d2.png", price: 81000 },
                    { id: "outer-downjacket-4", name: "숏 패딩", image: "/outer/downjacket/d3.png", price: 82000 },
                    { id: "outer-downjacket-5", name: "숏 패딩", image: "/outer/downjacket/d4.webp", price: 83000 }
                ]
            }
        ]
    }
];

// DB 상품 ID를 명확하게 매핑
// 상의 1~35, 하의 36~50, 아우터 51~70
const allProducts = categories.flatMap(category =>
    category.subCategories.flatMap(sub =>
        sub.items
    )
);

const productIdMap = new Map(
    allProducts.map((product, index) => [
        product.id,
        index + 1
    ])
);

function getProductNumber(id) {
    const productNumber = productIdMap.get(id);

    if (!productNumber) {
        throw new Error(`상품 ID를 찾을 수 없습니다: ${id}`);
    }

    return productNumber;
}

// 비교할 때 이미지 경로의 앞쪽 슬래시를 통일
function normalizeImagePath(path) {
    if (!path) return "";

    return "/" + String(path)
        .replace(/^\/+/, "")
        .split("?")[0];
}

// DB에 실제 등록된 상품과 일치하는지 확인
async function verifyProduct(product, productNumber) {
    const response = await fetch(
        `${API}/api/products/${productNumber}`
    );

    if (!response.ok) {
        throw new Error(
            `상품 상세 조회 실패: ${response.status}`
        );
    }

    const dbProduct = await response.json();

    const selectedImage = normalizeImagePath(product.image);
    const dbImage = normalizeImagePath(dbProduct.imageUrl);

    console.log("========== 상품 ID 확인 ==========");
    console.log("화면에서 선택한 상품:", {
        상품명: product.name,
        상품코드: product.id,
        이미지: product.image,
        계산된DB번호: productNumber
    });
    console.log("DB에서 조회된 상품:", dbProduct);
    console.log("이미지 일치 여부:", selectedImage === dbImage);
    console.log("=================================");

    if (selectedImage !== dbImage) {
        throw new Error(
            `상품 정보 불일치!\n` +
            `선택한 옷: ${product.name}\n` +
            `선택 이미지: ${selectedImage}\n` +
            `DB 상품: ${dbProduct.productName}\n` +
            `DB 이미지: ${dbImage}`
        );
    }

    return dbProduct;
}

const CategoryListPage = () => {
    const { type } = useParams();
    const navigate = useNavigate();

    const [wishlist, setWishlist] = useState([]);
    const [cart, setCart] = useState([]);
    const [busyIds, setBusyIds] = useState([]);

    const userId = Number(
        sessionStorage.getItem("userId")
    );

    const hasUserId =
        Number.isSafeInteger(userId) && userId > 0;

    const selectedCategory = categories.find(
        category => category.path === type
    );

    useEffect(() => {
        if (!hasUserId) {
            setWishlist([]);
            setCart([]);
            return;
        }

        let active = true;

        async function loadLists() {
            try {
                const data = await getWishlist(userId);

                if (active) {
                    setWishlist(
                        Array.isArray(data) ? data : []
                    );
                }
            } catch (err) {
                console.error("찜 목록 조회 실패:", err);
            }

            try {
                const response = await fetch(
                    `${API}/api/cart/${userId}`
                );

                if (!response.ok) {
                    throw new Error(
                        `장바구니 조회 실패: ${response.status}`
                    );
                }

                const data = await response.json();

                if (active) {
                    setCart(
                        Array.isArray(data) ? data : []
                    );
                }
            } catch (err) {
                console.error("장바구니 조회 실패:", err);
            }
        }

        loadLists();

        return () => {
            active = false;
        };
    }, [userId, hasUserId]);

    const checkLogin = () => {
        if (!hasUserId) {
            alert("로그인 후 이용 가능합니다.");
            navigate("/login");
            return false;
        }

        return true;
    };

    const isWished = (id) => {
        const productNumber = getProductNumber(id);

        return wishlist.some(
            item =>
                Number(item.productId) === productNumber
        );
    };

    const isInCart = (id) => {
        const productNumber = getProductNumber(id);

        return cart.some(
            item =>
                Number(item.productId) === productNumber
        );
    };

    const toggleWishlist = async (product) => {
        if (!checkLogin()) return;

        const productNumber = getProductNumber(product.id);

        if (busyIds.includes(productNumber)) return;

        setBusyIds(prev => [...prev, productNumber]);

        try {
            // 찜 저장 전에 DB 상품 확인
            const dbProduct = await verifyProduct(
                product,
                productNumber
            );

            const isExist = wishlist.some(
                item =>
                    Number(item.productId) === productNumber
            );

            if (isExist) {
                console.log("찜 해제 요청:", {
                    userId,
                    productId: productNumber
                });

                await removeWishlist(
                    userId,
                    productNumber
                );
            } else {
                const payload = {
                    userId,
                    productId: productNumber
                };

                console.log("찜 추가 요청:", payload);

                await addWishlist(payload);
            }

            // 저장 후 서버의 실제 찜 목록으로 갱신
            const updated = await getWishlist(userId);

            if (!Array.isArray(updated)) {
                throw new Error(
                    "찜 목록 응답이 배열이 아닙니다."
                );
            }

            setWishlist(updated);

            console.log("찜 처리 후 서버 목록:", updated);

            const saved = updated.find(
                item =>
                    Number(item.productId) === productNumber
            );

            if (!isExist && saved) {
                console.log("찜 추가 성공:", {
                    선택한상품: product.name,
                    DB상품명: dbProduct.productName,
                    저장된상품: saved
                });
            }

        } catch (err) {
            console.error("찜 처리 실패:", err);
            alert(
                err.message ||
                "찜 처리 중 오류가 발생했습니다."
            );
        } finally {
            setBusyIds(prev =>
                prev.filter(id => id !== productNumber)
            );
        }
    };

    const toggleCart = async (product) => {
        if (!checkLogin()) return;

        const productNumber = getProductNumber(product.id);

        if (busyIds.includes(productNumber)) return;

        if (isInCart(product.id)) {
            alert("이미 장바구니에 담긴 상품입니다.");
            return;
        }

        setBusyIds(prev => [...prev, productNumber]);

        try {
            // 장바구니 저장 전에도 상품 일치 여부 확인
            await verifyProduct(
                product,
                productNumber
            );

            const cartData = {
                userId,
                productId: productNumber,
                sizeId: productNumber,
                quantity: 1
            };

            console.log("장바구니 추가 요청:", cartData);

            const response = await fetch(
                `${API}/api/cart`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(cartData)
                }
            );

            if (!response.ok) {
                throw new Error(
                    `장바구니 추가 실패: ${response.status}`
                );
            }

            // 실제 DB 목록으로 다시 갱신
            const listResponse = await fetch(
                `${API}/api/cart/${userId}`
            );

            if (!listResponse.ok) {
                throw new Error(
                    "장바구니 재조회 실패"
                );
            }

            const updated = await listResponse.json();

            setCart(
                Array.isArray(updated) ? updated : []
            );

            console.log(
                "장바구니 처리 후 서버 목록:",
                updated
            );

            alert("장바구니에 추가되었습니다!");

        } catch (err) {
            console.error("장바구니 처리 실패:", err);
            alert(
                err.message ||
                "장바구니 처리 중 오류가 발생했습니다."
            );
        } finally {
            setBusyIds(prev =>
                prev.filter(id => id !== productNumber)
            );
        }
    };

    if (!selectedCategory) {
        return (
            <div className="category-list-container">
                <Header />

                <h2>카테고리를 찾을 수 없습니다.</h2>

                <Link
                    to="/category"
                    className="back-btn"
                >
                    카테고리로 돌아가기
                </Link>
            </div>
        );
    }

    return (
        <div className="category-list-container">
            <Header />

            <section className="category-list-header">
                <h1>{selectedCategory.name}</h1>
                <p>
                    {selectedCategory.name} 카테고리의
                    상품을 확인해보세요
                </p>
            </section>

            {selectedCategory.subCategories.map(
                subCategory => (
                    <section
                        className="sub-category-section"
                        key={subCategory.key}
                    >
                        <h2>{subCategory.name}</h2>

                        <div className="product-grid">
                            {subCategory.items.map(item => {
                                const productNumber =
                                    getProductNumber(item.id);

                                const isBusy =
                                    busyIds.includes(productNumber);

                                return (
                                    <div
                                        className="product-card"
                                        key={item.id}
                                    >
                                        <button
                                            type="button"
                                            className="wishlist-btn"
                                            disabled={isBusy}
                                            aria-label={
                                                `${item.name} 찜`
                                            }
                                            onClick={e => {
                                                e.stopPropagation();
                                                toggleWishlist(item);
                                            }}
                                        >
                                            {isWished(item.id)
                                                ? "❤️"
                                                : "🤍"}
                                        </button>

                                        <button
                                            type="button"
                                            className="cart-btn"
                                            disabled={isBusy}
                                            aria-label={
                                                `${item.name} 장바구니`
                                            }
                                            onClick={e => {
                                                e.stopPropagation();
                                                toggleCart(item);
                                            }}
                                        >
                                            {isInCart(item.id)
                                                ? "🛒"
                                                : "🛍️"}
                                        </button>

                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="product-image"
                                        />

                                        <p className="product-name">
                                            {item.name}
                                        </p>

                                        <p className="product-price">
                                            {item.price.toLocaleString()}원
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )
            )}

            <div className="back-area">
                <Link
                    to="/category"
                    className="back-btn"
                >
                    카테고리 메인으로 돌아가기
                </Link>
            </div>

            <footer className="footer">
                <p>© 2026 Virtual Fit Project</p>
            </footer>
        </div>
    );
};

export default CategoryListPage;
