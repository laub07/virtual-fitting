import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./RecommendPage.css";

const cities = [
    ["서울",37.5665,126.978],["평택",36.9921,127.1129],["인천",37.4563,126.7052],
    ["수원",37.2636,127.0286],["대전",36.3504,127.3845],["대구",35.8714,128.6014],
    ["광주",35.1595,126.8526],["부산",35.1796,129.0756],["제주",33.4996,126.5312]
];
// 프로젝트용 예시 규칙입니다. 개인의 추위 민감도에 따라 조절하세요.
export function getOutfits(t) {
    if(t >= 28) return [["가볍고 시원하게","반팔 티셔츠","린넨 반바지"],["통기성 좋은 데일리룩","린넨 셔츠","얇은 와이드 팬츠"]];
    if(t >= 23) return [["산뜻한 데일리룩","반팔 티셔츠","코튼 팬츠"],["가벼운 외출","얇은 셔츠","린넨 팬츠"]];
    if(t >= 20) return [["가볍게 걸치는 하루","긴팔 티셔츠","청바지"],["실내외 모두 편하게","반팔 + 얇은 가디건","슬랙스"]];
    if(t >= 17) return [["포근한 캐주얼","맨투맨","청바지"],["차분한 데일리룩","얇은 니트","슬랙스"]];
    if(t >= 12) return [["겉옷을 챙겨요","셔츠 + 가디건","청바지"],["단정한 외출룩","니트 + 재킷","슬랙스"]];
    if(t >= 9) return [["따뜻하게 레이어드","니트 + 트렌치코트","긴바지"],["편안한 캐주얼","맨투맨 + 점퍼","청바지"]];
    if(t >= 5) return [["온기를 더한 하루","니트 + 울 코트","도톰한 팬츠"],["따뜻한 외출 준비","기모 상의 + 패딩","기모 바지"]];
    return [["든든한 겨울 코디","보온 이너 + 패딩","기모 바지"],["추위에 대비해요","니트 + 두꺼운 코트","보온 팬츠"]];
}
function weatherLabel(code) {
    if(code === 0) return ["☀️","맑음"];
    if([1,2].includes(code)) return ["🌤️","대체로 맑음"];
    if(code === 3) return ["☁️","흐림"];
    if([45,48].includes(code)) return ["🌫️","안개"];
    if([71,73,75,77,85,86].includes(code)) return ["❄️","눈"];
    if([95,96,99].includes(code)) return ["⛈️","천둥"];
    if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) return ["🌧️","비"];
    return ["🌡️","날씨 정보"];
}
function OutfitArt({index}) {
    const colors = index % 2 ? ["#78856d","#d1bca2"] : ["#c4a58a","#596b80"];
    return <svg viewBox="0 0 280 310" role="img" aria-label="상의와 긴바지 예시 일러스트">
        <ellipse cx="140" cy="284" rx="82" ry="10" fill="#e6dfd5"/>
        <path d="M106 29 L74 44 34 95 66 120 88 94 88 164 192 164 192 94 214 120 246 95 206 44 174 29 Q140 57 106 29Z" fill={colors[0]} stroke="#ffffff" strokeWidth="3"/>
        <path d="M108 30 Q140 72 172 30" fill="none" stroke="#ffffff" strokeWidth="3"/>
        <path d="M92 177 H188 L199 274 H151 L140 210 129 274 H81Z" fill={colors[1]} stroke="#ffffff" strokeWidth="3"/>
        <path d="M96 187 H184 M140 188 V207" fill="none" stroke="#ffffff" strokeOpacity=".5" strokeWidth="2"/>
    </svg>;
}
export default function RecommendPage() {
    const [city,setCity] = useState("서울");
    const [weather,setWeather] = useState(null);
    const [loading,setLoading] = useState(true);
    const [error,setError] = useState("");
    const [retry,setRetry] = useState(0);
    const [index,setIndex] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        let active = true;
        let timedOut = false;
        const timer = setTimeout(() => { timedOut = true; controller.abort(); },15000);
        setLoading(true); setError(""); setWeather(null); setIndex(0);
        const [,latitude,longitude] = cities.find(c => c[0] === city);
        const params = new URLSearchParams({ latitude,longitude,
            current:"temperature_2m,apparent_temperature,weather_code,precipitation,wind_speed_10m",
            daily:"temperature_2m_max,temperature_2m_min,precipitation_probability_max",
            timezone:"Asia/Seoul",forecast_days:"1",wind_speed_unit:"ms" });
        async function load() {
            try {
                const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`,{signal:controller.signal});
                if(!response.ok) throw new Error("weather request failed");
                const data = await response.json();
                if(!Number.isFinite(data.current?.temperature_2m) || !Number.isFinite(data.current?.apparent_temperature) || !Number.isFinite(data.daily?.temperature_2m_max?.[0]) || !Number.isFinite(data.daily?.temperature_2m_min?.[0])) throw new Error("invalid weather response");
                if(active) setWeather(data);
            } catch(e) {
                if(active && (e.name !== "AbortError" || timedOut)) setError("날씨를 불러오지 못했어요. 인터넷 연결을 확인하고 다시 시도해주세요.");
            } finally { clearTimeout(timer); if(active) setLoading(false); }
        }
        load();
        return () => {active = false; clearTimeout(timer); controller.abort();};
    },[city,retry]);
    const current = weather?.current;
    const daily = weather?.daily;
    const outfits = current ? getOutfits(current.apparent_temperature) : [];
    const outfit = outfits[index];
    const [icon,condition] = current ? weatherLabel(current.weather_code) : ["",""];
    const rain = current && ([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(current.weather_code) || current.precipitation > 0);
    const snow = current && [71,73,75,77,85,86].includes(current.weather_code);
    return <div className="wr-page">
        <header className="wr-nav"><Link to="/" aria-label="메인 페이지"><img src="/로고1.png" alt="Fit on X"/></Link><nav aria-label="주 메뉴">
            <Link to="/category">카테고리</Link><Link to="/recommend" aria-current="page">추천</Link><Link to="/wishlist">찜</Link><Link to="/cart">장바구니</Link><Link to="/mypage">마이페이지</Link>
        </nav></header>
        <main className="wr-main"><div className="wr-heading"><span>WEATHER & OUTFIT</span><h1>오늘 날씨엔, 이렇게 입어요</h1><p>지역을 고르면 날씨에 맞는 코디를 추천해드려요.</p></div>
            <section className="wr-panel" aria-labelledby="wr-location"><div className="wr-location-row"><label id="wr-location" htmlFor="wr-city">지역 선택</label><select id="wr-city" value={city} onChange={e=>setCity(e.target.value)}>{cities.map(([name])=><option key={name}>{name}</option>)}</select></div>
                {loading && <p className="wr-state" role="status">{city} 날씨를 불러오는 중이에요…</p>}
                {error && <div className="wr-state" role="alert"><p>{error}</p><button onClick={()=>setRetry(v=>v+1)}>다시 시도</button></div>}
                {weather && <><div className="wr-weather"><div><p className="wr-eyebrow">{city} 현재 날씨</p><div className="wr-temp"><span aria-hidden="true">{icon}</span>{Math.round(current.temperature_2m)}<small>°C</small></div><p>{condition} · 체감 {Math.round(current.apparent_temperature)}°C</p></div><div className="wr-stats"><p>오늘 최저 / 최고 <strong>{Math.round(daily.temperature_2m_min[0])}° / {Math.round(daily.temperature_2m_max[0])}°</strong></p><p>오늘 최대 강수확률 <strong>{daily.precipitation_probability_max?.[0] ?? "—"}%</strong></p><p>현재 풍속 <strong>{current.wind_speed_10m ?? "—"} m/s</strong></p></div></div>
                    <div className="wr-scale" aria-label={`현재 기온 ${Math.round(current.temperature_2m)}도`}><span style={{left:`${Math.max(0,Math.min(100,(current.temperature_2m+10)/45*100))}%`}}/></div><div className="wr-scale-label"><span>추워요</span><span>선선해요</span><span>더워요</span></div>
                    <div className="wr-tip">{snow ? "❄️ 눈이 내려요. 미끄럼을 줄이는 신발과 따뜻한 겉옷을 챙겨요." : rain ? "☂️ 비가 내려요. 우산과 물에 강한 신발을 챙겨요." : daily.precipitation_probability_max?.[0] >= 50 ? "☂️ 오늘 비 예보가 있어요. 작은 우산을 챙겨요." : "오늘의 체감기온을 기준으로 코디를 골랐어요."}{daily.temperature_2m_max[0]-daily.temperature_2m_min[0] >= 10 && " 일교차가 커요. 벗기 쉬운 겉옷도 준비해요."}{current.wind_speed_10m >= 5 && " 바람이 강해요. 바람을 막는 겉옷을 고려해요."}</div>
                    <section className="wr-outfits" aria-labelledby="wr-outfit-title"><div className="wr-section-title"><div><p className="wr-eyebrow">TODAY’S PICK</p><h2 id="wr-outfit-title">오늘의 추천 의류</h2></div><span>{index+1} / {outfits.length}</span></div>
                        <div className="wr-carousel"><button aria-label="이전 코디" onClick={()=>setIndex(i=>(i-1+outfits.length)%outfits.length)}>‹</button><article className="wr-outfit" aria-live="polite"><div className="wr-art"><OutfitArt index={index}/><span>예시 코디</span></div><h3>{outfit[0]}</h3><p>{outfit[1]}<br/>{outfit[2]}</p></article><button aria-label="다음 코디" onClick={()=>setIndex(i=>(i+1)%outfits.length)}>›</button></div>
                        <p className="wr-note">기온에 따른 예시 추천이며 옷장·상품 DB와는 아직 연결되지 않았어요.<br/>그림은 공통 예시이며, 실제 추천 품목은 위 이름을 확인해주세요.</p>
                    </section><p className="wr-source">날씨 기준: {current.time.replace("T"," ")} (한국시간) · <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather data by Open-Meteo</a></p></>}
            </section>
        </main><footer className="wr-footer">© 2026 Virtual Fit Project</footer>
    </div>;
}
