const BASE_URL = "http://localhost:8080/api/wishlist";

// 찜 목록 조회
export const getWishlist = async (userId) => {
    const res = await fetch(`${BASE_URL}/${userId}`);
    if (!res.ok) throw new Error("찜 목록 조회 실패");
    return await res.json();
};

// 찜 추가
export const addWishlist = async (wishlistData) => {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(wishlistData),
    });

    if (!res.ok) throw new Error("찜 추가 실패");
};

// 찜 삭제
export const removeWishlist = async (userId, productId) => {
    const res = await fetch(
        `${BASE_URL}?userId=${userId}&productId=${productId}`,
        {
            method: "DELETE",
        }
    );

    if (!res.ok) throw new Error("찜 삭제 실패");
};