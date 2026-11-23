import React, { useEffect, useMemo, useState } from "react";
import "./RecommendPage.css";
import Header from "./Header";
const API = "http://localhost:8080";
const cities = [
  ["서울", 37.5665, 126.978], ["평택", 36.9921, 127.1129],
  ["인천", 37.4563, 126.7052], ["수원", 37.2636, 127.0286],
  ["대전", 36.3504, 127.3845], ["대구", 35.8714, 128.6014],
  ["광주", 35.1595, 126.8526], ["부산", 35.1796, 129.0756],
  ["제주", 33.4996, 126.5312]
];
function weatherLabel(code) {
  if (code === 0) return ["☀️", "맑음"];
  if ([1, 2].includes(code)) return ["🌤️", "대체로 맑음"];
  if (code === 3) return ["☁️", "흐림"];
  if ([45, 48].includes(code)) return ["🌫️", "안개"];
  if ([71, 73, 75, 77, 85, 86].includes(code)) return ["❄️", "눈"];
  if ([95, 96, 99].includes(code)) return ["⛈️", "천둥"];
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return ["🌧️", "비"];
  return ["🌡️", "날씨 정보"];
}
function imageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return "/" + String(path).replace(/^\/+/, "");
}
function detectCategory(name = "", categoryValue = "") {
  const value = `${categoryValue} ${name}`.toLowerCase();
  if (/하의|바지|팬츠|청바지|슬랙스|스커트|치마|반바지|pants|bottom|jeans|trouser|skirt/.test(value)) return "하의";
  if (/아우터|코트|패딩|점퍼|자켓|재킷|가디건|outer|coat|jacket|cardigan/.test(value)) return "아우터";
  if (/상의|티셔츠|셔츠|블라우스|맨투맨|니트|top|shirt|blouse|sweater/.test(value)) return "상의";
  return "미분류";
}
function normalizeWardrobe(item) {
  const clothingId = item.clothingId ?? item.clothing_id ?? item.id;
  return {
    id: `wardrobe-${clothingId}`,
    clothingId,
    productId: null,
    clothingName: item.clothingName ?? item.clothing_name ?? item.name ?? "내 옷",
    category: detectCategory(
      item.clothingName ?? item.clothing_name ?? item.name ?? "",
      item.category ?? item.categoryName ?? item.clothingCategory ?? item.clothing_category ?? ""
    ),
    color: item.color || "",
    season: item.season ?? item.seasonType ?? item.season_type ?? "",
    material: item.material ?? item.fabric ?? "",
    description: item.description ?? item.clothingDescription ?? "",
    imagePath: item.imagePath ?? item.image_path ?? item.imageUrl ?? item.image_url ?? item.image ?? "",
    source: "wardrobe"
  };
}
// 찜/장바구니 응답은 DTO 또는 Entity 형태일 수 있어 필드명을 모두 대응합니다.
function unwrapProduct(entry) {
  return entry?.product ?? entry?.productDto ?? entry?.productInfo ?? entry;
}
function getProductId(entry) {
  const product = unwrapProduct(entry);
  return entry?.productId ?? entry?.product_id ?? entry?.product?.productId ??
    entry?.product?.product_id ?? entry?.productID ?? product?.productId ?? product?.product_id ??
    product?.id ?? null;
}
function normalizeProduct(entry, source) {
  const item = unwrapProduct(entry) || {};
  const productId = getProductId(entry);
  const productName = item.productName ?? item.product_name ?? item.name ?? item.title ??
    entry?.productName ?? entry?.product_name ?? "상품명 확인 필요";
  const categoryValue = item.category ?? item.categoryName ?? item.productCategory ??
    item.type ?? entry?.category ?? entry?.categoryName ?? "";
  const imagePath = item.imageUrl ?? item.image_url ?? item.productImageUrl ?? item.product_image_url ??
    item.productImage ?? item.product_image ?? item.imagePath ?? item.image_path ?? item.image ??
    entry?.imageUrl ?? entry?.image_url ?? entry?.productImage ?? entry?.product_image ?? "";
  return {
    id: `product-${productId}`,
    clothingId: null,
    productId,
    clothingName: productName,
    category: detectCategory(productName, categoryValue),
    season: item.season ?? item.seasonType ?? item.season_type ?? "",
    material: item.material ?? item.fabric ?? "",
    description: item.description ?? item.productDescription ?? item.product_description ?? "",
    imagePath,
    source
  };
}
function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.wishlist)) return payload.wishlist;
  if (Array.isArray(payload?.cartItems)) return payload.cartItems;
  return null;
}
function getItemDescription(item) {
  return [
    item.clothingName,
    item.category,
    item.color,
    item.season,
    item.material,
    item.description,
    item.productDescription
  ].filter(Boolean).join(" ").toLowerCase();
}
// 날씨에 맞지 않는 의류는 점수만 낮추는 것이 아니라 추천 후보에서 제외합니다.
function isSuitableForWeather(item, temperature) {
  const text = getItemDescription(item);
  const isBottom = item.category === "하의";
  const isTop = ["상의", "아우터"].includes(item.category);
  if (!isTop && !isBottom) return false;
  const summerKeywords = /반팔|반소매|민소매|나시|슬리브리스|탱크탑|여름|린넨|시어서커|메쉬|시스루|얇은|얇은옷|이너|속옷|냉감|쿨링|summer|sleeveless|tank\s?top|linen|mesh|sheer|thin|innerwear|cooling/;
  const shortBottomKeywords = /반바지|숏팬츠|핫팬츠|미니스커트|shorts|hot\s?pants/;
  const heavyWinterKeywords = /롱패딩|패딩|두꺼운|헤비|기모|양털|플리스|후리스|두툼|울코트|겨울용|방한|발열|heavy|puffer|fleece|thick|thermal|winter/;
  const extremeWinterKeywords = /롱패딩|패딩|두꺼운|헤비|양털|플리스|후리스|두툼|방한|발열|heavy|puffer|fleece|thick|thermal/;
  // 영하: 상의는 일반 이너/맨투맨/긴팔을 전부 제외하고
  // 보온용 아우터(패딩·코트·파카·다운 등)만 추천합니다.
  // 내 옷장, 찜, 장바구니 모두 동일한 기준을 적용합니다.
  if (temperature < 0) {
    if (isTop) {
      const winterOuterwearKeywords =
        /아우터|롱패딩|숏패딩|패딩|다운재킷|다운자켓|다운점퍼|코트|파카|파르카|방한점퍼|겨울점퍼|두꺼운점퍼|헤비아우터|puffer|down\s?jacket|winter\s?coat|parka|outerwear|heavy\s?coat/;
      return item.category === "아우터" && winterOuterwearKeywords.test(text);
    }
    if (isBottom) {
      // 영하에는 반바지·얇은 여름 하의를 제외합니다.
      if (summerKeywords.test(text) || shortBottomKeywords.test(text)) return false;
      if (/얇은|여름|린넨|냉감|쿨링|반바지|숏팬츠|shorts/.test(text)) return false;
      return true;
    }
    return false;
  }
  // 한겨울(0\~5도): 여름옷·얇은 이너·반바지 등은 내 옷장/쇼핑몰 구분 없이 제외
  if (temperature <= 5) {
    if (summerKeywords.test(text)) return false;
    if (isBottom && shortBottomKeywords.test(text)) return false;
    return true;
  }
  // 추운 날(5도 초과\~10도): 반팔·민소매·얇은 이너·여름 소재 제외
  if (temperature <= 10) {
    if (summerKeywords.test(text)) return false;
    if (isBottom && shortBottomKeywords.test(text)) return false;
    return true;
  }
  // 쌀쌀한 날(10도 초과\~15도): 민소매·여름옷·반바지 제외
  if (temperature <= 15) {
    if (/민소매|나시|슬리브리스|탱크탑|여름|린넨|냉감|쿨링|sleeveless|tank\s?top|linen|cooling/.test(text)) return false;
    if (isBottom && shortBottomKeywords.test(text)) return false;
    return true;
  }
  // 선선한 날(15도 초과\~20도): 한겨울용 두꺼운 옷은 제외
  if (temperature <= 20) {
    if (extremeWinterKeywords.test(text)) return false;
    return true;
  }
  // 따뜻한 날(20도 초과\~25도): 패딩·두꺼운 겨울옷은 제외
  if (temperature <= 25) {
    if (heavyWinterKeywords.test(text)) return false;
    return true;
  }
  // 더운 날(25도 초과): 겨울용 아우터·기모·두꺼운 니트 등 제외
  if (heavyWinterKeywords.test(text)) return false;
  if (isTop && /코트|패딩|점퍼|목폴라|터틀넥|두꺼운니트|울니트|coat|jacket/.test(text)) return false;
  if (isBottom && /기모바지|기모팬츠|융털|겨울슬랙스|fleece[- ]?lined/.test(text)) return false;
  return true;
}
function getClothingScore(item, temperature) {
  const name = getItemDescription(item);
  let score = 1;
  if (temperature >= 28) {
    if (/반팔|민소매|나시|반바지|린넨|여름|cooling/.test(name)) score += 8;
    if (/긴팔|맨투맨|니트|패딩|코트|기모/.test(name)) score -= 5;
  } else if (temperature >= 20) {
    if (/반팔|셔츠|블라우스|청바지|얇은|긴팔/.test(name)) score += 6;
    if (/패딩|코트|기모|플리스|후리스/.test(name)) score -= 4;
  } else if (temperature >= 12) {
    if (/긴팔|맨투맨|청바지|니트|가디건|블라우스/.test(name)) score += 7;
    if (/반바지|민소매|나시/.test(name)) score -= 5;
  } else {
    if (/긴팔|맨투맨|니트|패딩|코트|기모|청바지|울|플리스|후리스/.test(name)) score += 7;
    if (/반팔|반바지|민소매|나시|얇은|이너|여름|린넨/.test(name)) score -= 5;
  }
  return score;
}
function recommendOutfits(items, temperature, includeShop) {
  // 출처와 관계없이 현재 체감온도에 부적합한 옷은 먼저 제외합니다.
  const suitableItems = items.filter(item => isSuitableForWeather(item, temperature));
  const tops = suitableItems.filter(item => ["상의", "아우터"].includes(item.category));
  const bottoms = suitableItems.filter(item => item.category === "하의");
  if (!tops.length || !bottoms.length) return [];
  const pairs = [];
  for (const top of tops) {
    for (const bottom of bottoms) {
      pairs.push({
        top, bottom,
        score: getClothingScore(top, temperature) + getClothingScore(bottom, temperature),
        hasShop: top.source !== "wardrobe" || bottom.source !== "wardrobe"
      });
    }
  }
  pairs.sort((a, b) => b.score - a.score);
  const selected = [];
  const used = new Set();
  function add(pair) {
    if (!pair || selected.length >= 6) return;
    const key = `${pair.top.id}|${pair.bottom.id}`;
    if (!used.has(key)) {
      used.add(key);
      selected.push(pair);
    }
  }
  if (includeShop) {
    pairs.filter(pair => pair.hasShop).slice(0, 3).forEach(add);
    pairs.filter(pair => !pair.hasShop).slice(0, 2).forEach(add);
  }
  pairs.forEach(add);
  return selected.map((pair, index) => ({
    ...pair,
    title: index === 0 ? "오늘의 맞춤 추천" : `추천 코디 ${index + 1}`,
    description: temperature < 10
      ? "추운 날씨에 적합한 보온성 있는 옷을 골랐어요."
      : temperature < 17
      ? "쌀쌀한 날씨에 어울리는 코디예요."
      : temperature >= 28
      ? "더운 날씨에 가볍게 입기 좋은 코디예요."
      : "현재 체감온도를 기준으로 추천했어요."
  }));
}
async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const data = await response.json();
  const list = extractList(data);
  if (!Array.isArray(list)) throw new Error(`${url}: 목록 응답 형식이 예상과 달라요. 개발자도구 Network에서 응답을 확인해 주세요.`);
  return list;
}
export default function RecommendPage() {
  const [city, setCity] = useState("서울");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [wardrobe, setWardrobe] = useState([]);
  const [shopItems, setShopItems] = useState([]);
  const [includeShop, setIncludeShop] = useState(false);
  const [wardrobeError, setWardrobeError] = useState("");
  const [shopError, setShopError] = useState("");
  const [shopLoading, setShopLoading] = useState(false);
  const [shopRefresh, setShopRefresh] = useState(0);
  const [index, setIndex] = useState(0);
  const [fittingStarting, setFittingStarting] = useState(false);
  const userId = sessionStorage.getItem("userId") || "1";
  useEffect(() => {
    let active = true;
    fetchJson(`${API}/api/wardrobe`)
      .then(data => {
        if (!active) return;
        setWardrobe(data.map(normalizeWardrobe));
        setWardrobeError("");
      })
      .catch(err => {
        console.error("옷장 조회 실패:", err);
        if (active) setWardrobeError("내 옷장을 불러오지 못했어요.");
      });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!includeShop) {
      setShopItems([]);
      setShopError("");
      setShopLoading(false);
      return;
    }
    let active = true;
    setShopLoading(true);
    setShopError("");
    async function loadShopItems() {
      const endpoints = [
        { name: "찜", url: `${API}/api/wishlist/${userId}`, source: "wishlist" },
        { name: "장바구니", url: `${API}/api/cart/${userId}`, source: "cart" }
      ];
      const results = await Promise.allSettled(
        endpoints.map(endpoint => fetchJson(endpoint.url))
      );
      const entries = [];
      const errors = [];
      results.forEach((result, index) => {
        const endpoint = endpoints[index];
        if (result.status === "fulfilled") {
          result.value.forEach(item => entries.push({ item, source: endpoint.source }));
          console.log(`[추천 코디] ${endpoint.name} API 응답:`, result.value);
        } else {
          console.error(`[추천 코디] ${endpoint.name} 조회 실패:`, result.reason);
          errors.push(endpoint.name);
        }
      });
      // productId가 숫자/문자열 또는 product 객체 안에 있는 경우 모두 처리
      const byId = new Map();
      for (const entry of entries) {
        const rawId = getProductId(entry.item);
        if (rawId === null || rawId === undefined || String(rawId).trim() === "") {
          console.warn("[추천 코디] productId를 찾지 못한 응답:", entry.item);
          continue;
        }
        const id = String(rawId);
        if (!byId.has(id)) byId.set(id, entry);
      }
      const loaded = await Promise.all([...byId.entries()].map(async ([productId, entry]) => {
        let normalized = normalizeProduct(entry.item, entry.source);
        // 찜/장바구니 응답에 상품명, 이미지 또는 카테고리가 없으면 상품 상세 API로 보완
        if (!normalized.clothingName || normalized.clothingName === "상품명 확인 필요" ||
            !normalized.imagePath || normalized.category === "미분류") {
          try {
            const response = await fetch(`${API}/api/products/${productId}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const detail = await response.json();
            normalized = normalizeProduct(
              { ...entry.item, product: { ...unwrapProduct(entry.item), ...detail, productId } },
              entry.source
            );
          } catch (err) {
            console.error(`[추천 코디] 상품 ${productId} 상세 조회 실패:`, err);
          }
        }
        if (!normalized.imagePath) {
          console.warn(`[추천 코디] 상품 ${productId} 이미지 경로 없음`, entry.item);
          return null;
        }
        if (normalized.category === "미분류") {
          console.warn(`[추천 코디] 상품 ${productId} 카테고리 분류 실패`, entry.item);
          return null;
        }
        return normalized;
      }));
      if (!active) return;
      const unique = loaded.filter(Boolean);
      setShopItems(unique);
      setShopError(errors.length ? `${errors.join("·")} 목록을 불러오지 못했어요.` : "");
      setShopLoading(false);
      console.log("[추천 코디] 최종 쇼핑몰 상품:", unique);
      console.log("[추천 코디] 찜/장바구니 원본 응답 수:", entries.length, "정상 상품 수:", unique.length);
    }
    loadShopItems().catch(err => {
      console.error("[추천 코디] 쇼핑몰 상품 처리 실패:", err);
      if (active) {
        setShopItems([]);
        setShopError("쇼핑몰 상품을 불러오지 못했어요. 서버와 API 응답을 확인해 주세요.");
        setShopLoading(false);
      }
    });
    return () => { active = false; };
  }, [includeShop, userId, shopRefresh]);
  // 다른 탭에서 찜/장바구니를 추가한 뒤 추천 페이지로 돌아오면 다시 조회
  useEffect(() => {
    if (!includeShop) return;
    const refreshOnFocus = () => setShopRefresh(value => value + 1);
    window.addEventListener("focus", refreshOnFocus);
    const refreshOnVisible = () => {
      if (document.visibilityState === "visible") refreshOnFocus();
    };
    document.addEventListener("visibilitychange", refreshOnVisible);
    // 체크박스가 켜져 있는 동안 새 찜/장바구니 상품을 주기적으로 다시 조회
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setShopRefresh(value => value + 1);
      }
    }, 15000);
    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnVisible);
      window.clearInterval(intervalId);
    };
  }, [includeShop]);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);
    setLoading(true);
    setError("");
    setWeather(null);
    setIndex(0);
    const [, latitude, longitude] = cities.find(c => c[0] === city);
    const params = new URLSearchParams({
      latitude, longitude,
      current: "temperature_2m,apparent_temperature,weather_code,precipitation,wind_speed_10m",
      daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
      timezone: "Asia/Seoul", forecast_days: "1", wind_speed_unit: "ms"
    });
    async function loadWeather() {
      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
          signal: controller.signal
        });
        if (!response.ok) throw new Error("날씨 조회 실패");
        const data = await response.json();
        if (!Number.isFinite(data.current?.temperature_2m)) throw new Error("잘못된 날씨 데이터");
        if (active) setWeather(data);
      } catch (err) {
        console.error("날씨 조회 실패:", err);
        if (active && (err.name !== "AbortError" || timedOut)) setError("날씨를 불러오지 못했어요.");
      } finally {
        clearTimeout(timer);
        if (active) setLoading(false);
      }
    }
    loadWeather();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [city, retry]);
  const current = weather?.current;
  const daily = weather?.daily;
  const allItems = useMemo(
    () => includeShop ? [...wardrobe, ...shopItems] : wardrobe,
    [wardrobe, shopItems, includeShop]
  );
  const outfits = useMemo(
    () => current ? recommendOutfits(allItems, current.apparent_temperature, includeShop) : [],
    [allItems, current, includeShop]
  );
  const outfit = outfits[index] || null;
  const [icon, condition] = current ? weatherLabel(current.weather_code) : ["", ""];
  // 추천된 상의·하의 정보를 Spring Boot에 전달해 Python main.py를 실행합니다.
  const handleTryOn = async () => {
    if (!outfit) {
      alert("추천된 코디가 없어요.");
      return;
    }
    if (fittingStarting) return;
    // 화면 표시용 imageUrl()이 아닌 DB에 저장된 원본 경로를 전달합니다.
    const topImagePath = outfit.top.imagePath;
    const bottomImagePath = outfit.bottom.imagePath;
    if (typeof topImagePath !== "string" || !topImagePath.trim() ||
        typeof bottomImagePath !== "string" || !bottomImagePath.trim()) {
      alert("추천 코디의 상의 또는 하의 이미지 경로가 없어요.");
      return;
    }
    try {
      setFittingStarting(true);
      const response = await fetch(`${API}/api/fitting/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topImagePath,
          bottomImagePath,
          topName: outfit.top.clothingName || "상의",
          bottomName: outfit.bottom.clothingName || "하의"
        })
      });
      const message = await response.text();
      if (!response.ok) {
        throw new Error(message || "가상피팅 실행에 실패했습니다.");
      }
      alert(message || "추천 코디로 가상피팅 웹캠을 실행했습니다.");
    } catch (error) {
      console.error("가상피팅 실행 실패:", error);
      alert(error.message || "가상피팅 실행에 실패했습니다.");
    } finally {
      setFittingStarting(false);
    }
  };
  return (
    <div className="wr-page">
      <Header />
      <main className="wr-main">
        <div className="wr-heading">
          <span>WEATHER &amp; OUTFIT</span>
          <h1>오늘 날씨엔, 이렇게 입어요</h1>
          <p>내 옷장과 쇼핑몰 관심 상품으로 날씨에 맞는 코디를 추천해드려요.</p>
        </div>
        <section className="wr-panel">
          <div className="wr-location-row">
            <label htmlFor="wr-city">지역 선택</label>
            <select id="wr-city" value={city} onChange={e => setCity(e.target.value)}>
              {cities.map(([name]) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          {loading && <p className="wr-state">{city} 날씨를 불러오는 중이에요…</p>}
          {error && (
            <div className="wr-state" role="alert">
              <p>{error}</p>
              <button onClick={() => setRetry(v => v + 1)}>다시 시도</button>
            </div>
          )}
          {weather && (
            <>
              <div className="wr-weather">
                <div>
                  <p className="wr-eyebrow">{city} 현재 날씨</p>
                  <div className="wr-temp"><span aria-hidden="true">{icon}</span>{Math.round(current.temperature_2m)}<small>°C</small></div>
                  <p>{condition} · 체감 {Math.round(current.apparent_temperature)}°C</p>
                </div>
                <div className="wr-stats">
                  <p>오늘 최저 / 최고 <strong>{Math.round(daily.temperature_2m_min[0])}° / {Math.round(daily.temperature_2m_max[0])}°</strong></p>
                  <p>오늘 최대 강수확률 <strong>{daily.precipitation_probability_max?.[0] ?? "—"}%</strong></p>
                  <p>현재 풍속 <strong>{current.wind_speed_10m ?? "—"} m/s</strong></p>
                </div>
              </div>
              <div className="wr-scale">
                <span style={{ left: `${Math.max(0, Math.min(100, ((current.temperature_2m + 10) / 45) * 100))}%` }} />
              </div>
              <div className="wr-scale-label"><span>추워요</span><span>선선해요</span><span>더워요</span></div>
              <div className="wr-tip">
                오늘의 체감기온을 기준으로 코디를 골랐어요.
                {daily.temperature_2m_max[0] - daily.temperature_2m_min[0] >= 10 && " 일교차가 크니 겉옷을 챙겨주세요."}
              </div>
              <section className="wr-outfits">
                <div className="wr-section-title">
                  <div><p className="wr-eyebrow">TODAY’S PICK</p><h2>내 옷장 맞춤 추천</h2></div>
                  <span>{outfits.length ? `${index + 1} / ${outfits.length}` : "0 / 0"}</span>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", margin: "20px auto", border: "1px solid #ddd4c9", borderRadius: "14px", background: "#faf8f5", maxWidth: "520px", cursor: "pointer" }}>
                  <input type="checkbox" checked={includeShop} onChange={e => { setIncludeShop(e.target.checked); setIndex(0); }} style={{ width: "20px", height: "20px", accentColor: "#8b7963" }} />
                  <span>
                    <strong>쇼핑몰 찜·장바구니 상품도 함께 추천</strong>
                    <small style={{ display: "block", marginTop: "5px", color: "#777" }}>선택하면 내 옷장과 쇼핑몰 옷을 조합해요.</small>
                  </span>
                </label>
                {wardrobeError && <p className="wr-state">{wardrobeError}</p>}
                {shopLoading && <p className="wr-state">쇼핑몰 상품을 불러오는 중이에요…</p>}
                {shopError && <p className="wr-state" role="alert">{shopError}</p>}
                {outfit ? (
                  <div className="wr-carousel">
                    <button aria-label="이전 코디" onClick={() => setIndex(i => (i - 1 + outfits.length) % outfits.length)}>‹</button>
                    <article className="wr-outfit" aria-live="polite">
                      <div className="wr-art" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                        {[outfit.top, outfit.bottom].map(item => (
                          <div key={item.id} style={{ width: "100%", maxWidth: "270px", padding: "12px", borderRadius: "14px", background: "#fff", textAlign: "center" }}>
                            <img src={imageUrl(item.imagePath)} alt={item.clothingName} style={{ width: "100%", height: "190px", objectFit: "contain" }} />
                            <p style={{ margin: "8px 0 0" }}>{item.clothingName}</p>
                            <small style={{ color: "#8b7963" }}>
                              {item.source === "wardrobe" ? "내 옷장" : item.source === "wishlist" ? "쇼핑몰 찜" : "쇼핑몰 장바구니"}
                            </small>
                          </div>
                        ))}
                      </div>
                      <h3>{outfit.title}</h3>
                      <p>{outfit.description}</p>
                      <button
                        type="button"
                        onClick={handleTryOn}
                        disabled={fittingStarting}
                        style={{ marginTop: "18px", padding: "14px 24px", background: fittingStarting ? "#b8ad9f" : "#8b7963", color: "#fff", border: "none", borderRadius: "12px", cursor: fittingStarting ? "wait" : "pointer", fontSize: "15px", fontWeight: "bold" }}
                      >
                        {fittingStarting ? "가상피팅 실행 중..." : "이 코디 가상피팅하기"}
                      </button>
                    </article>
                    <button aria-label="다음 코디" onClick={() => setIndex(i => (i + 1) % outfits.length)}>›</button>
                  </div>
                ) : (
                  <p className="wr-state">추천할 상의와 하의 조합이 없어요.</p>
                )}
              </section>
              <p className="wr-source">
                날씨 기준: {current.time.replace("T", " ")} (한국시간) ·{" "}
                <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather data by Open-Meteo</a>
              </p>
            </>
          )}
        </section>
      </main>
      <footer className="wr-footer">© 2026 Virtual Fit Project</footer>
    </div>
  );
}
