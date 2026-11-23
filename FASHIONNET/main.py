
import os
import argparse
import hashlib
import cv2
import numpy as np
import mediapipe as mp
import tempfile
import threading
import time
import requests
from urllib.parse import urljoin, urlparse

from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
from gradio_client import Client, handle_file


# ==========================================
# 1. 기본 설정
# ==========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CATVTON_API_URL = os.environ.get(
    "CATVTON_API_URL",
    "https://3ba81d93fbfba65628.gradio.live"
).strip().rstrip("/")

# 쇼핑몰 API / 이미지 서버 (필요하면 환경변수로 변경)
SHOP_API_BASE = os.environ.get("SHOP_API_BASE", "http://localhost:8080").rstrip("/")
SHOP_IMAGE_BASE = os.environ.get("SHOP_IMAGE_BASE", "http://localhost:3000").rstrip("/")
SHOP_USER_ID = os.environ.get("SHOP_USER_ID", "1")

MY_CLOSET_DIR = r"C:\dev\virtual-fitting\front\public\uploads\clothes"
CLOTHES_DIR = MY_CLOSET_DIR
RESULT_DIR = os.path.join(BASE_DIR, "ai_results")
CAPTURE_DIR = os.path.join(BASE_DIR, "captures")
CUTOUT_CACHE_DIR = os.path.join(BASE_DIR, "cutout_cache")

os.makedirs(RESULT_DIR, exist_ok=True)
os.makedirs(CAPTURE_DIR, exist_ok=True)
os.makedirs(CUTOUT_CACHE_DIR, exist_ok=True)

ai_state = {
    "running": False,
    "result": None,
    "error": None,
    "stage": "",
    "started_at": None,
}

ai_lock = threading.Lock()


# ==========================================
# 2. 한글 출력 함수
# ==========================================

def put_text_korean(
    frame,
    text,
    position,
    font_size=20,
    color=(0, 0, 0)
):
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    pil_image = Image.fromarray(rgb)

    draw = ImageDraw.Draw(pil_image)

    try:
        font = ImageFont.truetype(
            "C:/Windows/Fonts/malgun.ttf",
            font_size
        )
    except OSError:
        font = ImageFont.load_default()

    draw.text(
        position,
        text,
        font=font,
        fill=color
    )

    return cv2.cvtColor(
        np.array(pil_image),
        cv2.COLOR_RGB2BGR
    )


# ==========================================
# 3. 버튼 그리기
# ==========================================

def draw_button(
    frame,
    box,
    text,
    background=(245, 245, 245),
    text_color=(50, 50, 50),
    selected=False
):
    """부드러운 모서리, 은은한 그림자, 중앙 정렬을 적용한 버튼."""
    x1, y1, x2, y2 = map(int, box)
    h, w = frame.shape[:2]
    x1, x2 = max(0, x1), min(w - 1, x2)
    y1, y2 = max(0, y1), min(h - 1, y2)
    if x2 <= x1 or y2 <= y1:
        return frame

    radius = max(6, min(14, (y2 - y1) // 4))

    def rounded_rect(img, rect, color, thickness=-1, r=radius):
        ax1, ay1, ax2, ay2 = rect
        r = max(2, min(r, (ax2-ax1)//2, (ay2-ay1)//2))
        if thickness < 0:
            cv2.rectangle(img, (ax1+r, ay1), (ax2-r, ay2), color, -1, cv2.LINE_AA)
            cv2.rectangle(img, (ax1, ay1+r), (ax2, ay2-r), color, -1, cv2.LINE_AA)
            for cx, cy in ((ax1+r, ay1+r), (ax2-r, ay1+r), (ax1+r, ay2-r), (ax2-r, ay2-r)):
                cv2.circle(img, (cx, cy), r, color, -1, cv2.LINE_AA)
        else:
            # 테두리는 안쪽에 그려 모서리 밖으로 번지지 않게 함
            for t in range(thickness):
                rr = max(2, r-t)
                cv2.line(img, (ax1+rr, ay1+t), (ax2-rr, ay1+t), color, 1, cv2.LINE_AA)
                cv2.line(img, (ax1+rr, ay2-t), (ax2-rr, ay2-t), color, 1, cv2.LINE_AA)
                cv2.line(img, (ax1+t, ay1+rr), (ax1+t, ay2-rr), color, 1, cv2.LINE_AA)
                cv2.line(img, (ax2-t, ay1+rr), (ax2-t, ay2-rr), color, 1, cv2.LINE_AA)
                for cx, cy in ((ax1+r, ay1+r), (ax2-r, ay1+r), (ax1+r, ay2-r), (ax2-r, ay2-r)):
                    cv2.ellipse(img, (cx, cy), (rr, rr), 0, 0, 360, color, 1, cv2.LINE_AA)

    # 은은한 아래쪽 그림자
    shadow = frame.copy()
    rounded_rect(shadow, (x1, min(y2, y1+4), x2, y2), (185, 185, 185), -1, radius)
    frame = cv2.addWeighted(shadow, 0.22, frame, 0.78, 0)

    fill = (222, 235, 255) if selected else tuple(int(v) for v in background)
    border = (190, 105, 45) if selected else (218, 218, 218)
    rounded_rect(frame, (x1, y1, x2, y2), fill, -1, radius)
    rounded_rect(frame, (x1, y1, x2, y2), border, 2 if selected else 1, radius)

    # 한글 폰트로 버튼 텍스트를 중앙 정렬
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    pil_image = Image.fromarray(rgb)
    draw = ImageDraw.Draw(pil_image)
    try:
        font_size = 17 if (y2-y1) >= 42 else 14
        font = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", font_size)
    except OSError:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), str(text), font=font)
    tw, th = bbox[2]-bbox[0], bbox[3]-bbox[1]
    tx = x1 + max(5, ((x2-x1)-tw)//2) - bbox[0]
    ty = y1 + max(2, ((y2-y1)-th)//2) - bbox[1]
    draw.text((tx, ty), str(text), font=font, fill=tuple(int(c) for c in text_color))
    return cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)


def in_box(x, y, box):
    x1, y1, x2, y2 = box
    return x1 <= x <= x2 and y1 <= y <= y2


def in_box_expanded(x, y, box, margin=18):
    """손가락 좌표 오차를 보완하기 위해 버튼 선택 영역을 넓혀 판정합니다."""
    x1, y1, x2, y2 = box
    return (x1 - margin) <= x <= (x2 + margin) and (y1 - margin) <= y <= (y2 + margin)


# ==========================================
# 4. 투명 PNG 이미지 합성
# ==========================================

def overlay_png(
    background,
    overlay,
    x,
    y,
    width,
    height
):
    if overlay is None:
        return background

    if width <= 0 or height <= 0:
        return background

    overlay = cv2.resize(
        overlay,
        (width, height),
        interpolation=cv2.INTER_LINEAR
    )

    bg_h, bg_w = background.shape[:2]

    x1 = max(0, x)
    y1 = max(0, y)

    x2 = min(bg_w, x + width)
    y2 = min(bg_h, y + height)

    if x1 >= x2 or y1 >= y2:
        return background

    ox1 = x1 - x
    oy1 = y1 - y

    ox2 = ox1 + (x2 - x1)
    oy2 = oy1 + (y2 - y1)

    cropped = overlay[oy1:oy2, ox1:ox2]

    if cropped.ndim == 2:
        cropped = cv2.cvtColor(
            cropped,
            cv2.COLOR_GRAY2BGR
        )

    roi = background[y1:y2, x1:x2]

    if cropped.shape[2] == 4:
        alpha = (
            cropped[:, :, 3:4].astype(np.float32)
            / 255.0
        )

        foreground = (
            cropped[:, :, :3].astype(np.float32)
        )

        blended = (
            foreground * alpha
            + roi.astype(np.float32) * (1 - alpha)
        )

        background[y1:y2, x1:x2] = (
            blended.astype(np.uint8)
        )

    else:
        background[y1:y2, x1:x2] = cropped[:, :, :3]

    return background


# ==========================================
# 5. 의상 이미지 변환
# ==========================================

def prepare_cloth_image(cloth_image):
    """
    투명 배경 RGBA 의상을
    흰색 배경의 BGR 이미지로 변환
    """

    if cloth_image is None:
        raise RuntimeError(
            "의상 이미지가 없습니다."
        )

    if cloth_image.ndim == 2:
        return cv2.cvtColor(
            cloth_image,
            cv2.COLOR_GRAY2BGR
        )

    if cloth_image.shape[2] == 4:
        alpha = (
            cloth_image[:, :, 3:4].astype(np.float32)
            / 255.0
        )

        bgr = (
            cloth_image[:, :, :3].astype(np.float32)
        )

        white_background = np.full_like(
            bgr,
            255.0
        )

        result = (
            bgr * alpha
            + white_background * (1.0 - alpha)
        )

        return result.astype(np.uint8)

    return cloth_image[:, :, :3].copy()


# ==========================================
# 6. CatVTON AI 피팅 생성
# ==========================================

def _catvton_once(client, person_frame, cloth_image, cloth_type, temp_dir):
    """CatVTON 단일 부위 추론. 현재 Colab의 /submit_function 규격 사용."""
    cloth_image = prepare_cloth_image(cloth_image)
    person_path = os.path.join(temp_dir, f"person_{cloth_type}.jpg")
    cloth_path = os.path.join(temp_dir, f"cloth_{cloth_type}.jpg")
    for path, image in ((person_path, person_frame), (cloth_path, cloth_image)):
        ok, buffer = cv2.imencode(".jpg", image)
        if not ok:
            raise RuntimeError(f"{cloth_type} 이미지 인코딩 실패")
        with open(path, "wb") as f:
            f.write(buffer.tobytes())

    person_input = {
        "background": handle_file(person_path),
        "layers": [],
        "composite": None,
    }
    # 서버별 API 인자 이름 차이를 확인할 수 있도록 호출 직전 기록합니다.
    print(f"[CatVTON] 요청 전송: {cloth_type} / 의상 크기: {cloth_image.shape}", flush=True)
    # submit()가 반환되면 요청이 서버에 접수된 상태입니다.
    # 업로드 완료의 정확한 시각은 Gradio가 별도로 알려주지 않습니다.
    job = client.submit(
        person_image=person_input,
        cloth_image=handle_file(cloth_path),
        cloth_type=cloth_type,
        num_inference_steps=30,
        guidance_scale=2.5,
        seed=7777,
        show_type="result only",
        api_name="/submit_function",
    )
    _set_ai_stage(("상의" if cloth_type == "upper" else "하의") + " 피팅 중...")
    result = job.result()
    result_path = result
    if isinstance(result_path, (tuple, list)) and result_path:
        result_path = result_path[0]
    if isinstance(result_path, dict):
        result_path = result_path.get("path") or result_path.get("name") or result_path.get("image") or result_path.get("value")
    if not isinstance(result_path, str):
        raise RuntimeError(f"CatVTON 응답 형식 확인 필요: {str(result)[:300]}")
    image = cv2.imread(result_path, cv2.IMREAD_COLOR) if isinstance(result_path, str) else None
    if image is None:
        raise RuntimeError(f"CatVTON 결과를 읽지 못했습니다: {result_path}")
    return image


def _set_ai_stage(stage):
    """웹캠 화면에 표시할 CatVTON 진행 단계를 안전하게 갱신합니다."""
    with ai_lock:
        ai_state["stage"] = stage
    print(f"[CatVTON 진행] {stage}", flush=True)


def generate_catvton(person_frame, upper_image, lower_image):
    """선택한 상의/하의를 순차 합성하며 현재 진행 단계를 공유합니다."""
    try:
        if upper_image is None and lower_image is None:
            raise RuntimeError("상의 또는 하의를 선택해 주세요.")
        _set_ai_stage("이미지 전송 준비 중...  |  잠시 기다려 주세요")
        client = None
        _set_ai_stage("CatVTON 서버 연결 중...")
        client = Client(CATVTON_API_URL)
        with tempfile.TemporaryDirectory() as temp_dir:
            result_image = person_frame[:, :, :3].copy()
            total_steps = sum(img is not None for img in (upper_image, lower_image))
            completed_steps = 0
            for cloth_type, cloth_image in (("upper", upper_image), ("lower", lower_image)):
                if cloth_image is None:
                    continue
                label = "상의" if cloth_type == "upper" else "하의"
                _set_ai_stage(f"{label} 이미지 전송 중...  |  잠시 기다려 주세요")
                result_image = _catvton_once(
                    client, result_image, cloth_image, cloth_type, temp_dir
                )
                completed_steps += 1
                _set_ai_stage(f"{label} 변환 완료 ({completed_steps}/{total_steps})")

        _set_ai_stage("최종 결과 저장 중")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        filename = os.path.join(RESULT_DIR, f"catvton_full_{timestamp}.png")
        if not cv2.imwrite(filename, result_image):
            raise RuntimeError("결과 이미지 저장 실패")
        with ai_lock:
            ai_state["result"] = result_image
            ai_state["stage"] = "피팅 완료"
        print("[CatVTON] 최종 결과 저장:", filename, flush=True)
    except Exception as exc:
        import traceback
        traceback.print_exc()
        with ai_lock:
            ai_state["error"] = str(exc)
            ai_state["stage"] = "피팅 실패"
        print("[CatVTON] 오류:", exc, flush=True)
    finally:
        with ai_lock:
            ai_state["running"] = False
            ai_state["started_at"] = None


# ==========================================
# ==========================================
# 7. 의상 데이터 불러오기
# ==========================================

def is_bottom_item(name, image_url="", category=""):
    """상품명, 경로, 카테고리로 하의 여부를 판별한다."""
    value = f"{name} {image_url} {category}".lower().replace("\\", "/")
    words = ("bottom", "pants", "jeans", "skirt", "trouser", "slacks", "denim",
             "바지", "팬츠", "청바지", "슬랙스", "치마", "스커트", "하의")
    return any(word in value for word in words)


def load_clothes():
    """front/public/uploads/clothes에 저장된 내 옷장 이미지를 읽는다."""
    items = []
    if not os.path.isdir(MY_CLOSET_DIR):
        print(f"[내 옷장] 폴더를 찾지 못했습니다: {MY_CLOSET_DIR}", flush=True)
        return items
    extensions = (".png", ".jpg", ".jpeg", ".webp", ".bmp")
    for root, _, files in os.walk(MY_CLOSET_DIR):
        for name in sorted(files):
            if not name.lower().endswith(extensions):
                continue
            path = os.path.join(root, name)
            # Windows 한글 파일명도 처리
            try:
                raw = np.fromfile(path, dtype=np.uint8)
                image = cv2.imdecode(raw, cv2.IMREAD_UNCHANGED)
            except Exception as exc:
                print(f"[내 옷장] 이미지 읽기 실패: {path} / {exc}", flush=True)
                continue
            if image is None:
                print(f"[내 옷장] 지원되지 않는 이미지: {path}", flush=True)
                continue
            rel = os.path.relpath(path, MY_CLOSET_DIR)
            items.append({
                "name": os.path.splitext(name)[0],
                "img": make_overlay_image(image),
                "ai_img": image,
                "filename": path,
                "product_id": "my:" + rel.replace("\\", "/"),
                "is_bottom": is_bottom_item(name, rel),
            })
    print(f"[내 옷장] {len(items)}개 이미지 준비: {MY_CLOSET_DIR}", flush=True)
    return items


# ==========================================
# 7-1. 쇼핑몰 찜 / 장바구니 API 연동
# ==========================================

def fetch_shop_list(kind):
    """Spring Boot에서 현재 사용자의 상품 목록을 조회한다."""
    url = f"{SHOP_API_BASE}/api/{kind}/{SHOP_USER_ID}"
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        if not isinstance(data, list):
            raise ValueError("상품 목록 응답이 배열이 아닙니다.")
        print(f"[쇼핑몰] {kind} 조회: {len(data)}개")
        return data
    except (requests.RequestException, ValueError) as exc:
        print(f"[쇼핑몰] {kind} 조회 실패: {exc}")
        return None


def download_shop_image(image_url):
    """쇼핑몰 이미지 URL을 Spring/React 양쪽에서 시도한다."""
    if not image_url or not isinstance(image_url, str):
        return None
    image_url = image_url.strip().replace("\\", "/")
    if image_url.startswith(("http://", "https://")):
        candidates = [image_url]
    else:
        rel = image_url.lstrip("/")
        candidates = [urljoin(base + "/", rel) for base in (SHOP_API_BASE, SHOP_IMAGE_BASE)]
    for url in dict.fromkeys(candidates):
        try:
            response = requests.get(url, timeout=6)
            response.raise_for_status()
            image = cv2.imdecode(np.frombuffer(response.content, np.uint8), cv2.IMREAD_UNCHANGED)
            if image is not None:
                return image
            print(f"[쇼핑몰] 이미지 디코딩 실패: {url}", flush=True)
        except (requests.RequestException, ValueError) as exc:
            print(f"[쇼핑몰] 이미지 요청 실패 ({url}): {exc}", flush=True)
    return None


_cutout_session = None


def make_overlay_image(image):
    """AI 배경 제거로 실시간 AR 오버레이용 BGRA 이미지를 만듭니다.

    이미 투명도가 있는 이미지는 그대로 사용하고, 원본은 CatVTON 입력용으로
    별도 유지합니다. 같은 이미지의 반복 추론을 막기 위해 결과를 캐시합니다.
    """
    global _cutout_session

    if image.ndim == 2:
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    if image.ndim == 3 and image.shape[2] == 4:
        # 이미 투명 배경을 가진 상품 이미지는 원래 알파 채널을 보존합니다.
        if np.any(image[:, :, 3] < 250):
            return image.copy()
        image = cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)

    ok, encoded = cv2.imencode('.png', image)
    if not ok:
        raise RuntimeError('배경 제거용 이미지 인코딩 실패')
    raw = encoded.tobytes()
    digest = hashlib.sha256(raw).hexdigest()
    cached_path = os.path.join(CUTOUT_CACHE_DIR, digest + '.png')

    if os.path.isfile(cached_path):
        cached = cv2.imread(cached_path, cv2.IMREAD_UNCHANGED)
        if cached is not None and cached.ndim == 3 and cached.shape[2] == 4:
            print('[누끼] 캐시 사용:', digest[:10])
            return cached

    try:
        from rembg import remove, new_session
        if _cutout_session is None:
            print('[누끼] AI 모델 준비 중... (첫 실행은 다운로드로 오래 걸릴 수 있습니다)')
            _cutout_session = new_session('u2net')

        # rembg는 PNG 바이트를 받아 알파 채널이 있는 PNG를 반환합니다.
        cutout_bytes = remove(raw, session=_cutout_session)
        result = cv2.imdecode(
            np.frombuffer(cutout_bytes, np.uint8),
            cv2.IMREAD_UNCHANGED
        )
        if result is None or result.ndim != 3 or result.shape[2] != 4:
            raise RuntimeError('AI 배경 제거 결과가 투명 이미지가 아닙니다')

        cv2.imwrite(cached_path, result)
        print('[누끼] AI 배경 제거 완료:', digest[:10])
        return result
    except Exception as exc:
        print('[누끼] AI 배경 제거 실패:', exc)
        print('[누끼] 해당 상품은 원본 이미지로 표시됩니다.')
        return cv2.cvtColor(image, cv2.COLOR_BGR2BGRA)


def load_shop_clothes(local_clothes):
    """내 옷장 + 찜 + 장바구니를 통합하고, 각 탭의 인덱스를 반환한다."""
    clothes = list(local_clothes)
    my_indices = list(range(len(local_clothes)))
    wishlist_indices, cart_indices = [], []
    product_index = {str(item["product_id"]): i for i, item in enumerate(clothes)}

    for kind, indices in (("wishlist", wishlist_indices), ("cart", cart_indices)):
        rows = fetch_shop_list(kind)
        if rows is None:
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            # Cart/Wishlist 응답이 {product:{...}} 또는 {productId:...}인 경우 모두 처리
            product = row.get("product") if isinstance(row.get("product"), dict) else {}
            product_id = row.get("productId") or row.get("product_id") or product.get("productId") or product.get("product_id") or product.get("id")
            if product_id is None:
                print(f"[쇼핑몰] {kind} 상품 ID 누락: {str(row)[:180]}", flush=True)
                continue
            product_key = "shop:" + str(product_id)
            if product_key in product_index:
                idx = product_index[product_key]
            else:
                image_url = (row.get("imageUrl") or row.get("image_url") or row.get("image")
                             or product.get("imageUrl") or product.get("image_url") or product.get("image"))
                image = download_shop_image(image_url)
                if image is None:
                    print(f"[쇼핑몰] {kind} 상품 {product_id} 이미지 없음: {image_url}", flush=True)
                    continue
                name = str(row.get("productName") or row.get("product_name") or product.get("productName") or product.get("product_name") or product.get("name") or f"상품 {product_id}")
                category = str(row.get("category") or product.get("category") or "")
                idx = len(clothes)
                clothes.append({
                    "name": name,
                    "img": make_overlay_image(image),
                    "ai_img": image,
                    "filename": str(image_url),
                    "product_id": product_key,
                    "is_bottom": is_bottom_item(name, image_url, category),
                })
                product_index[product_key] = idx
            if idx not in indices:
                indices.append(idx)
    print(f"[옷장] 내 옷장 {len(my_indices)}개 / 찜 {len(wishlist_indices)}개 / 장바구니 {len(cart_indices)}개", flush=True)
    return clothes, my_indices, wishlist_indices, cart_indices


# ==========================================
# 7-2. 날씨 추천 코디를 웹캠 시작 시 자동 선택
# ==========================================

def read_image_path(image_path):
    """React에서 전달된 로컬 경로 또는 웹 이미지 주소를 OpenCV 이미지로 읽습니다."""
    if not image_path:
        return None

    value = str(image_path).strip().replace("\\", "/")
    if not value:
        return None

    # 완전한 URL은 HTTP로 가져옵니다.
    if value.startswith(("http://", "https://")):
        return download_shop_image(value)

    # Windows 절대 경로 또는 현재 파일 기준 절대 경로
    local_candidates = [value]
    if not os.path.isabs(value):
        local_candidates.append(os.path.join(BASE_DIR, value))
        local_candidates.append(os.path.join(BASE_DIR, "..", "front", "public", value.lstrip("/")))
        local_candidates.append(os.path.join(BASE_DIR, "..", "front", "public", "uploads", "clothes", value.lstrip("/")))

    for candidate in local_candidates:
        if os.path.isfile(candidate):
            try:
                raw = np.fromfile(candidate, dtype=np.uint8)
                image = cv2.imdecode(raw, cv2.IMREAD_UNCHANGED)
                if image is not None:
                    return image
            except Exception as exc:
                print(f"[추천 코디] 로컬 이미지 읽기 실패: {candidate} / {exc}", flush=True)

    # React public 경로(/uploads/...) 또는 상대 URL은 프론트 서버에서 읽습니다.
    web_path = value if value.startswith("/") else "/" + value.lstrip("/")
    image = download_shop_image(web_path)
    if image is not None:
        return image

    print(f"[추천 코디] 이미지 경로를 읽지 못했습니다: {image_path}", flush=True)
    return None


def append_recommended_cloth(clothes, image_path, display_name, is_bottom):
    """전달받은 추천 의류를 clothes에 추가하고 해당 인덱스를 반환합니다."""
    image = read_image_path(image_path)
    if image is None:
        raise RuntimeError(
            f"추천 {'하의' if is_bottom else '상의'} 이미지를 불러오지 못했습니다: {image_path}"
        )

    index = len(clothes)
    clothes.append({
        "name": display_name or ("추천 하의" if is_bottom else "추천 상의"),
        "img": make_overlay_image(image),
        "ai_img": image,
        "filename": str(image_path),
        "product_id": "recommend:" + str(index),
        "is_bottom": bool(is_bottom),
    })
    print(
        f"[날씨 추천] {'하의' if is_bottom else '상의'} 자동 선택: {clothes[index]['name']}",
        flush=True
    )
    return index


# ==========================================
# 8. 옷장 UI
# ==========================================

def draw_closet(
    frame,
    clothes,
    selected_index,
    closet_page,
    wishlist,
    cart,
    my_closet,
    list_page=0
):

    h, w = frame.shape[:2]

    panel_x1 = 20
    panel_y1 = 90

    panel_x2 = min(w - 20, 600)
    panel_y2 = h - 105

    if panel_y2 <= panel_y1:
        return frame, []

    overlay = frame.copy()

    cv2.rectangle(
        overlay,
        (panel_x1, panel_y1),
        (panel_x2, panel_y2),
        (250, 250, 250),
        -1
    )

    frame = cv2.addWeighted(
        overlay,
        0.93,
        frame,
        0.07,
        0
    )

    clickable = []

    if closet_page is None:

        frame = put_text_korean(
            frame,
            "MY CLOSET",
            (panel_x1 + 20, panel_y1 + 20),
            23,
            (50, 50, 50)
        )

        menu_items = [
            ("my", "내 옷장", (235, 250, 235)),
            ("wishlist", "♥ 찜한 상품", (245, 225, 240)),
            ("cart", "장바구니", (235, 245, 250)),
        ]
        for i, (action, title, bg) in enumerate(menu_items):
            rect = (panel_x1 + 20, panel_y1 + 65 + i * 70,
                    panel_x2 - 20, panel_y1 + 120 + i * 70)
            frame = draw_button(frame, rect, title, bg)
            clickable.append((action, rect))

    else:

        back_box = (
            panel_x1 + 15,
            panel_y1 + 15,
            panel_x1 + 105,
            panel_y1 + 60
        )

        frame = draw_button(
            frame,
            back_box,
            "< 뒤로"
        )

        clickable.append(
            ("back", back_box)
        )

        title = {"my": "내 옷장", "wishlist": "♥ 찜한 상품", "cart": "장바구니"}.get(closet_page, "옷장")
        frame = put_text_korean(frame, title, (panel_x1 + 125, panel_y1 + 25), 21, (60, 60, 60))
        indices = {"my": my_closet, "wishlist": wishlist, "cart": cart}.get(closet_page, [])
        # 화면 크기에 맞춰 페이지를 나눠 하의 등 뒤쪽 상품도 표시
        content_y = panel_y1 + 85
        content_w = panel_x2 - panel_x1 - 40
        card_h = 135
        card_gap = 10
        cols = 3
        available_h = max(0, panel_y2 - content_y - 45)
        rows_per_page = max(1, available_h // (card_h + 10))
        per_page = cols * rows_per_page
        max_page = max(0, (len(indices) - 1) // per_page)
        list_page = max(0, min(list_page, max_page))
        page_indices = indices[list_page * per_page:(list_page + 1) * per_page]
        if max_page > 0:
            prev_box = (panel_x1 + 25, panel_y2 - 37, panel_x1 + 135, panel_y2 - 3)
            next_box = (panel_x2 - 135, panel_y2 - 37, panel_x2 - 25, panel_y2 - 3)
            frame = draw_button(frame, prev_box, "이전", (240, 240, 240))
            frame = draw_button(frame, next_box, "다음", (240, 240, 240))
            frame = put_text_korean(frame, f"{list_page + 1}/{max_page + 1}",
                                    (panel_x1 + 245, panel_y2 - 29), 16, (60, 60, 60))
            clickable.extend([("page_prev", prev_box), ("page_next", next_box)])

        if not indices:

            frame = put_text_korean(
                frame,
                "담긴 상품이 없습니다.",
                (panel_x1 + 30, panel_y1 + 110),
                18,
                (100, 100, 100)
            )

        else:

            content_y = panel_y1 + 85
            content_w = panel_x2 - panel_x1 - 40

            cols = min(3, len(indices))
            card_gap = 10

            card_w = max(
                40,
                (content_w - card_gap * (cols - 1)) // cols
            )

            card_h = 135

            for order, index in enumerate(page_indices):

                if index >= len(clothes):
                    continue

                col = order % cols
                row = order // cols

                x1 = (
                    panel_x1 + 20
                    + col * (card_w + card_gap)
                )

                y1 = (
                    content_y
                    + row * (card_h + 10)
                )

                x2 = x1 + card_w
                y2 = y1 + card_h

                if y2 > panel_y2:
                    continue

                item = clothes[index]

                selected = (
                    index == selected_index
                )

                frame = draw_button(
                    frame,
                    (x1, y1, x2, y2),
                    "",
                    (255, 255, 255),
                    selected=selected
                )

                image = item["img"]

                ih, iw = image.shape[:2]

                scale = min(
                    (card_w - 20) / iw,
                    85 / ih
                )

                thumb_w = max(
                    1,
                    int(iw * scale)
                )

                thumb_h = max(
                    1,
                    int(ih * scale)
                )

                tx = x1 + (card_w - thumb_w) // 2
                ty = y1 + 45

                frame = overlay_png(
                    frame,
                    image,
                    tx,
                    ty,
                    thumb_w,
                    thumb_h
                )

                clickable.append(
                    (f"item:{index}", (x1, y1, x2, y2))
                )

    return frame, clickable


# ==========================================
# 9. 메인 가상 피팅
# ==========================================

def run_virtual_fitting(top_image_path=None, bottom_image_path=None, top_name=None, bottom_name=None):

    print("가상 피팅 프로그램 시작", flush=True)
    print("[안내] AI 가상피팅: 스페이스바", flush=True)

    local_clothes = load_clothes()
    clothes, my_closet, wishlist, cart = load_shop_clothes(local_clothes)
    if not clothes:
        print("[안내] 내 옷장/찜/장바구니에 읽을 수 있는 이미지가 없습니다. r 키로 다시 불러오세요.", flush=True)
        blank = np.zeros((160, 120, 4), dtype=np.uint8)
        clothes = [{"name": "의상 없음", "img": blank, "ai_img": blank,
                    "filename": "none", "product_id": "none", "is_bottom": False}]
        my_closet, wishlist, cart = [], [], []

    current_idx = 0
    # 일반 실행은 빈 화면으로 시작하고, 날씨 추천 실행일 때만 전달받은 옷을 자동 선택합니다.
    selected_upper_idx = None
    selected_lower_idx = None

    try:
        if top_image_path:
            selected_upper_idx = append_recommended_cloth(
                clothes, top_image_path, top_name, is_bottom=False
            )
        if bottom_image_path:
            selected_lower_idx = append_recommended_cloth(
                clothes, bottom_image_path, bottom_name, is_bottom=True
            )
        if selected_upper_idx is not None or selected_lower_idx is not None:
            print("[날씨 추천] 추천 코디가 웹캠에 자동으로 선택되었습니다.", flush=True)
    except Exception as exc:
        print("[날씨 추천] 자동 선택 실패:", exc, flush=True)
        print("[안내] 옷장에서 직접 의상을 선택할 수 있습니다.", flush=True)
        selected_upper_idx = None
        selected_lower_idx = None
    print("[안내] 옷장에서 상의와 하의를 각각 선택하세요. 선택한 두 의상이 유지됩니다.")
    print("[안내] 스페이스바: 5초 후 CatVTON 상의→하의 순차 피팅")
    print("[안내] 내 옷장/찜/장바구니를 다시 불러오려면 r 키를 누르세요.")

    is_closet_open = False
    closet_page = None
    closet_list_page = 0

    last_hover_target = None
    # 핀치 상태 안정화: 손 떨림으로 인한 인식 누락을 줄입니다.
    was_pinching = False
    gesture_armed = True
    pinch_state = False
    pinch_on_count = 0
    pinch_off_count = 0
    last_gesture_action_time = 0.0
    GESTURE_COOLDOWN = 0.38

    capture_count = 1
    ok_gesture_started = None
    ok_gesture_latched = False
    ok_gesture_release_count = 0
    OK_HOLD_SECONDS = 0.65
    # Pose 안내는 0.5초 이상 같은 상태일 때 갱신해 화면 깜빡임을 줄임
    pose_hint = "카메라 앞에 서 주세요."
    pose_hint_candidate = None
    pose_hint_since = 0.0
    pose_ready = False
    capture_feedback_until = 0.0
    capture_feedback_text = ""

    # 스페이스바 5초 카운트다운 (웹캠 화면은 계속 갱신)
    ai_countdown_deadline = None
    ai_countdown_upper = None
    ai_countdown_lower = None
    ai_countdown_name = None

    # ======================================
    # MediaPipe 설정
    # ======================================

    mp_pose = mp.solutions.pose
    mp_hands = mp.solutions.hands

    pose = mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

    # ======================================
    # 웹캠 실행
    # ======================================

    # Windows에서는 DirectShow 우선 사용, 실패하면 기본 백엔드로 재시도
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    if not cap.isOpened():
        cap.release()
        cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    if not cap.isOpened():
        print("[오류] 카메라를 열 수 없습니다.")
        hands.close()
        pose.close()
        return

    print("[성공] 웹캠 연결 완료")
    window_name = "AR Virtual Fitting NUI"
    # 실제 프레임(640x480)과 창 좌표를 일치시켜 마우스 버튼 오인식을 방지합니다.
    cv2.namedWindow(window_name, cv2.WINDOW_AUTOSIZE)
    mouse_events = []

    def on_mouse(event, x, y, flags, userdata):
        if event == cv2.EVENT_LBUTTONDOWN:
            mouse_events.append((x, y))

    cv2.setMouseCallback(window_name, on_mouse)
    print("[안내] 종료하려면 q를 누르세요.")

    try:

        while True:

            ret, frame = cap.read()

            if not ret:
                print("[오류] 웹캠 프레임 읽기 실패")
                break

            if frame is None or frame.size == 0:
                print("[오류] 카메라 프레임이 비어 있습니다.")
                break
            frame = cv2.flip(frame, 1)

            h, w = frame.shape[:2]

            # AI 피팅에는 합성 전 원본을 사용
            original_frame = frame.copy()

            rgb = cv2.cvtColor(
                original_frame,
                cv2.COLOR_BGR2RGB
            )

            current_item = clothes[current_idx]
            current_cloth = current_item["img"]
            current_ai_cloth = current_item.get("ai_img", current_cloth)

            # ==================================
            # 10. MediaPipe Pose
            # ==================================

            pose_result = pose.process(rgb)
            # 얼굴/무릎/거리 확인 (MediaPipe 좌표 기반의 보조 안내)
            pose_candidate = "카메라 앞에 서 주세요."
            if pose_result.pose_landmarks:
                lm = pose_result.pose_landmarks.landmark
                def visible(part, margin=0.035, confidence=0.50):
                    pt = lm[part]
                    return (pt.visibility >= confidence and margin <= pt.x <= 1-margin
                            and margin <= pt.y <= 1-margin)
                nose = mp_pose.PoseLandmark.NOSE
                leye = mp_pose.PoseLandmark.LEFT_EYE
                reye = mp_pose.PoseLandmark.RIGHT_EYE
                lknee = mp_pose.PoseLandmark.LEFT_KNEE
                rknee = mp_pose.PoseLandmark.RIGHT_KNEE
                lsh = mp_pose.PoseLandmark.LEFT_SHOULDER
                rsh = mp_pose.PoseLandmark.RIGHT_SHOULDER
                lhip = mp_pose.PoseLandmark.LEFT_HIP
                rhip = mp_pose.PoseLandmark.RIGHT_HIP
                face_ok = visible(nose) and (visible(leye) or visible(reye))
                # 무릎 전체가 보이지 않아도 허벅지 윗부분이 충분히 보이면 허용
                # MediaPipe의 무릎 좌표가 화면 밖이어도 엉덩이 아래쪽 공간을 확인
                knees_ok = (visible(lknee, 0.015, 0.30) or visible(rknee, 0.015, 0.30))
                thigh_space = max(0.0, 1.0 - max(lm[lhip].y, lm[rhip].y))
                lower_body_ok = knees_ok or (thigh_space >= 0.12)
                shoulder_ok = visible(lsh) and visible(rsh)
                hip_ok = visible(lhip) and visible(rhip)
                if not face_ok:
                    pose_candidate = "얼굴이 보이지 않아요. 카메라를 확인해 주세요."
                elif not lower_body_ok or not hip_ok:
                    pose_candidate = "다리가 잘 보이지 않아요. 조금만 뒤로 이동해 주세요."
                elif not shoulder_ok:
                    pose_candidate = "상체가 잘 보이도록 자세를 조정해 주세요."
                else:
                    # 화면에서 인물 크기가 너무 작을 때만 전진 권고
                    shoulder_span = abs(lm[lsh].x - lm[rsh].x)
                    body_span = max(lm[lhip].y, lm[rhip].y) - lm[nose].y
                    if shoulder_span < 0.10 or body_span < 0.24:
                        pose_candidate = "카메라와 너무 멀어요. 조금만 앞으로 와 주세요."
                    else:
                        pose_candidate = "촬영 준비 완료! 현재 자세를 유지해 주세요."
            now_pose = time.monotonic()
            if pose_candidate != pose_hint_candidate:
                pose_hint_candidate = pose_candidate
                pose_hint_since = now_pose
            if now_pose - pose_hint_since >= 0.5:
                pose_hint = pose_candidate
            pose_ready = (pose_candidate == "촬영 준비 완료! 현재 자세를 유지해 주세요.")

            if pose_result.pose_landmarks:

                landmarks = pose_result.pose_landmarks.landmark

                left_shoulder = landmarks[
                    mp_pose.PoseLandmark.LEFT_SHOULDER
                ]

                right_shoulder = landmarks[
                    mp_pose.PoseLandmark.RIGHT_SHOULDER
                ]

                left_hip = landmarks[
                    mp_pose.PoseLandmark.LEFT_HIP
                ]

                right_hip = landmarks[
                    mp_pose.PoseLandmark.RIGHT_HIP
                ]

                ls = np.array([
                    int(left_shoulder.x * w),
                    int(left_shoulder.y * h)
                ])

                rs = np.array([
                    int(right_shoulder.x * w),
                    int(right_shoulder.y * h)
                ])

                lh = np.array([
                    int(left_hip.x * w),
                    int(left_hip.y * h)
                ])

                rh = np.array([
                    int(right_hip.x * w),
                    int(right_hip.y * h)
                ])

                shoulder_center = (ls + rs) // 2
                hip_center = (lh + rh) // 2

                shoulder_width = np.linalg.norm(
                    ls - rs
                )

                torso_height = np.linalg.norm(
                    hip_center - shoulder_center
                )

                cloth_width = int(
                    shoulder_width * 2.5
                )

                cloth_height = int(
                    torso_height * 1.8
                )

                cloth_x = int(
                    shoulder_center[0]
                    - cloth_width / 2
                )

                cloth_y = int(
                    shoulder_center[1]
                    - torso_height * 0.45
                )

                if selected_upper_idx is not None:
                    frame = overlay_png(
                        frame, clothes[selected_upper_idx]["img"],
                        cloth_x, cloth_y, cloth_width, cloth_height
                    )

                if selected_lower_idx is not None:
                    # 하의 오버레이는 엉덩이 위치를 기준으로 한 단순 근사치.
                    # 실제 다리 포즈 추적/분할을 적용한 결과는 아님.
                    lower_width = int(shoulder_width * 2.1)
                    lower_height = int(torso_height * 2.5)
                    lower_x = int(hip_center[0] - lower_width / 2)
                    lower_y = int(hip_center[1] - torso_height * 0.10)
                    frame = overlay_png(
                        frame, clothes[selected_lower_idx]["img"],
                        lower_x, lower_y, lower_width, lower_height
                    )

            capture_requested_by_gesture = False

            # ==================================
            # 11. 손 인식
            # ==================================

            hands_result = hands.process(rgb)

            finger_tip = None
            thumb_tip = None
            raw_pinch = False
            ok_gesture = False

            if hands_result.multi_hand_landmarks:
                hand = hands_result.multi_hand_landmarks[0]

                index = hand.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP]
                thumb = hand.landmark[mp_hands.HandLandmark.THUMB_TIP]
                index_mcp = hand.landmark[mp_hands.HandLandmark.INDEX_FINGER_MCP]
                pinky_mcp = hand.landmark[mp_hands.HandLandmark.PINKY_MCP]

                finger_tip = (int(index.x * w), int(index.y * h))
                thumb_tip = (int(thumb.x * w), int(thumb.y * h))

                # 고정 픽셀 대신 손바닥 너비에 비례해 핀치를 판정합니다.
                # 카메라와의 거리가 달라져도 인식 감도가 크게 변하지 않습니다.
                pinch_distance = np.linalg.norm(
                    np.array([index.x - thumb.x, index.y - thumb.y])
                )
                palm_width = np.linalg.norm(
                    np.array([index_mcp.x - pinky_mcp.x,
                              index_mcp.y - pinky_mcp.y])
                )
                pinch_ratio = pinch_distance / max(palm_width, 0.001)

                # OK 사인: 엄지·검지로 원을 만들고 나머지 세 손가락을 폅니다.
                # 단순 핀치(메뉴 선택)와 구분하기 위해 손가락 세 개의 펼침을 요구합니다.
                lm = hand.landmark
                def extended(tip, pip, mcp):
                    wrist = lm[mp_hands.HandLandmark.WRIST]
                    def dist(a, b):
                        return np.hypot(a.x - b.x, a.y - b.y)
                    return dist(lm[tip], wrist) > dist(lm[pip], wrist) * 1.12 and dist(lm[tip], lm[mcp]) > dist(lm[pip], lm[mcp])
                three_extended = all((
                    extended(mp_hands.HandLandmark.MIDDLE_FINGER_TIP, mp_hands.HandLandmark.MIDDLE_FINGER_PIP, mp_hands.HandLandmark.MIDDLE_FINGER_MCP),
                    extended(mp_hands.HandLandmark.RING_FINGER_TIP, mp_hands.HandLandmark.RING_FINGER_PIP, mp_hands.HandLandmark.RING_FINGER_MCP),
                    extended(mp_hands.HandLandmark.PINKY_TIP, mp_hands.HandLandmark.PINKY_PIP, mp_hands.HandLandmark.PINKY_MCP),
                ))
                ok_gesture = pinch_ratio < 0.43 and three_extended

                # 시작 기준을 조금 넉넉하게, 유지 기준은 더 넉넉하게 설정합니다.
                start_threshold = 0.46
                release_threshold = 0.62
                raw_pinch = pinch_ratio < (
                    release_threshold if pinch_state else start_threshold
                )

                # 손가락이 실제로 가까워진 상태가 2프레임 유지될 때만 활성화.
                if raw_pinch:
                    pinch_on_count += 1
                    pinch_off_count = 0
                    if pinch_on_count >= 2:
                        pinch_state = True
                else:
                    pinch_off_count += 1
                    pinch_on_count = 0
                    if pinch_off_count >= 2:
                        pinch_state = False
            else:
                pinch_on_count = 0
                pinch_off_count += 1
                if pinch_off_count >= 2:
                    pinch_state = False

            # OK 사인은 화면 어디서든 캡처하며, 버튼 핀치와 동시에 처리하지 않습니다.
            pinch = pinch_state and not ok_gesture
            if ok_gesture:
                ok_gesture_release_count = 0
                if ok_gesture_started is None:
                    ok_gesture_started = time.monotonic()
                if (not ok_gesture_latched and
                        time.monotonic() - ok_gesture_started >= OK_HOLD_SECONDS):
                    # UI가 없는 원본 화면이 아니라, AR 옷이 합성된 프레임을 저장합니다.
                    capture_requested_by_gesture = True
                    ok_gesture_latched = True
                    gesture_armed = False
            else:
                ok_gesture_started = None
                ok_gesture_release_count += 1
                if ok_gesture_release_count >= 5:
                    ok_gesture_latched = False

            # 손가락 끝과 엄지 끝을 표시해 인식 위치를 확인할 수 있게 합니다.
            if finger_tip:
                cv2.circle(frame, finger_tip, 9, (0, 255, 255), -1)
                if thumb_tip:
                    cv2.circle(frame, thumb_tip, 6, (255, 180, 0), -1)

            # ==================================
            # 12. UI 버튼 위치
            # ==================================

            closet_btn = (
                20, 20, 150, 70
            )

            capture_btn = None  # 손 OK 사인으로 캡처


            prev_btn = (
                20,
                h // 2 - 25,
                80,
                h // 2 + 25
            )

            next_btn = (
                w - 80,
                h // 2 - 25,
                w - 20,
                h // 2 + 25
            )

            frame = draw_button(
                frame,
                closet_btn,
                "CLOSET",
                (255, 240, 230)
            )

            # 캡처 버튼은 제거하고 손 OK 사인 안내만 표시합니다.


            if not is_closet_open:

                frame = draw_button(
                    frame,
                    prev_btn,
                    "< "
                )

                frame = draw_button(
                    frame,
                    next_btn,
                    " >"
                )

            # ==================================
            # 13. 옷장 UI
            # ==================================

            closet_clickable = []

            if is_closet_open:

                frame, closet_clickable = draw_closet(
                    frame,
                    clothes,
                    current_idx,
                    closet_page,
                    wishlist,
                    cart,
                    my_closet,
                    closet_list_page
                )

            # ==================================
            # 14. 손가락 버튼 선택
            # ==================================

            hover_target = None

            if finger_tip:

                fx, fy = finger_tip

                if in_box(fx, fy, closet_btn):
                    hover_target = "CLOSET"


                elif not is_closet_open:

                    if in_box(fx, fy, prev_btn):
                        hover_target = "PREV"

                    elif in_box(fx, fy, next_btn):
                        hover_target = "NEXT"

                else:

                    for name, box in closet_clickable:

                        if in_box(fx, fy, box):
                            hover_target = name
                            break

                cv2.circle(
                    frame,
                    finger_tip,
                    9,
                    (0, 255, 255),
                    -1
                )

            # ==================================
            # 15-16. 버튼 및 옷장 선택 (단일 처리)
            # ==================================

            # 중요: 이전 코드에서는 일반 버튼 처리에서 쿨다운 시간을 먼저 갱신한 뒤
            # 옷장 메뉴 처리에서도 같은 쿨다운을 검사해, 옷장 메뉴 선택이 막혔습니다.
            # 화면 상태에 따라 한 곳에서만 처리하고, 실제 동작했을 때만 쿨다운을 갱신합니다.
            # 핀치를 시작한 뒤 버튼으로 이동해도 선택되도록 하되,
            # 한 번 선택하면 손가락을 뗄 때까지 재선택을 잠급니다.
            # 화면 전환 후 같은 위치의 의류가 연속 선택되는 것도 방지합니다.
            if not pinch:
                gesture_armed = True

            action_ready = (
                hover_target is not None
                and pinch
                and gesture_armed
                and (not was_pinching or hover_target != last_hover_target)
                and (time.time() - last_gesture_action_time) >= GESTURE_COOLDOWN
            )

            if action_ready:
                action_done = False

                if is_closet_open:
                    # 옷장 화면에서는 옷장 내부 항목만 처리합니다.
                    if hover_target == "CLOSET":
                        is_closet_open = False
                        closet_page = None
                        print("[옷장] 닫힘", flush=True)
                        action_done = True

                    elif hover_target == "my":
                        closet_page = "my"
                        closet_list_page = 0
                        print("[옷장] 내 옷장 열기", flush=True)
                        action_done = True

                    elif hover_target == "wishlist":
                        closet_page = "wishlist"
                        closet_list_page = 0
                        print("[옷장] 찜 목록 열기", flush=True)
                        action_done = True

                    elif hover_target == "cart":
                        closet_page = "cart"
                        closet_list_page = 0
                        print("[옷장] 장바구니 열기", flush=True)
                        action_done = True

                    elif hover_target == "page_prev":
                        closet_list_page = max(0, closet_list_page - 1)
                        action_done = True

                    elif hover_target == "page_next":
                        closet_list_page += 1
                        action_done = True

                    elif hover_target == "back":
                        closet_page = None
                        action_done = True

                    elif hover_target.startswith("item:"):
                        try:
                            selected = int(hover_target.split(":", 1)[1])
                            if 0 <= selected < len(clothes):
                                current_idx = selected
                                if clothes[selected].get("is_bottom", False):
                                    selected_lower_idx = selected
                                    print("[옷장] 하의 선택:", clothes[selected]["name"], flush=True)
                                else:
                                    selected_upper_idx = selected
                                    print("[옷장] 상의 선택:", clothes[selected]["name"], flush=True)

                                is_closet_open = False
                                closet_page = None
                                action_done = True
                        except (ValueError, IndexError):
                            print("[옷장] 잘못된 의류 선택 항목:", hover_target, flush=True)

                else:
                    # 옷장이 닫혀 있을 때는 바깥쪽 버튼만 처리합니다.
                    if hover_target == "CLOSET":
                        is_closet_open = True
                        closet_page = None
                        closet_list_page = 0
                        print("[옷장] 열림", flush=True)
                        action_done = True

                    elif hover_target == "CAPTURE":
                        filename = os.path.join(
                            CAPTURE_DIR,
                            f"capture_{capture_count}.png"
                        )
                        if cv2.imwrite(filename, frame):
                            print("[캡처] 저장:", filename, flush=True)
                            capture_count += 1
                            capture_feedback_text = "화면 캡처 완료!"
                            capture_feedback_until = time.monotonic() + 2.0
                        action_done = True

                    elif hover_target == "PREV" and clothes:
                        current_idx = (current_idx - 1) % len(clothes)
                        if clothes[current_idx].get("is_bottom", False):
                            selected_lower_idx = current_idx
                        else:
                            selected_upper_idx = current_idx
                        print("[의상]", clothes[current_idx]["name"], flush=True)
                        action_done = True

                    elif hover_target == "NEXT" and clothes:
                        current_idx = (current_idx + 1) % len(clothes)
                        if clothes[current_idx].get("is_bottom", False):
                            selected_lower_idx = current_idx
                        else:
                            selected_upper_idx = current_idx
                        print("[의상]", clothes[current_idx]["name"], flush=True)
                        action_done = True

                # 실제 동작한 경우에만 쿨다운을 시작합니다.
                if action_done:
                    last_gesture_action_time = time.time()
                    gesture_armed = False

            last_hover_target = hover_target
            last_pinched_target = hover_target if (pinch and hover_target is not None) else None
            was_pinching = pinch

            # ==================================
            # 17. AI 생성 상태 확인
            # ==================================

            with ai_lock:

                ai_running = ai_state["running"]
                result_image = ai_state["result"]
                error_message = ai_state["error"]
                ai_stage = ai_state.get("stage", "")
                ai_started_at = ai_state.get("started_at")

                ai_state["result"] = None
                ai_state["error"] = None

            if ai_running:
                elapsed = max(0, int(time.monotonic() - ai_started_at)) if ai_started_at else 0
                elapsed_text = f"{elapsed // 60:02d}:{elapsed % 60:02d}"

                # 불투명 흰색, 작은 직사각형 안내창
                card_w = min(460, w - 28)
                card_h = 100
                px1 = (w - card_w) // 2
                py1 = 14
                px2, py2 = px1 + card_w, py1 + card_h
                cv2.rectangle(frame, (px1, py1), (px2, py2), (255, 255, 255), -1)
                cv2.rectangle(frame, (px1, py1), (px2, py2), (224, 224, 224), 1)

                raw_stage = ai_stage or "AI 피팅 준비 중..."
                if "상의" in raw_stage and "피팅 중" in raw_stage:
                    title = "상의 피팅 중..."
                    estimate = "상의 피팅 약 1분 소요"
                elif "하의" in raw_stage and "피팅 중" in raw_stage:
                    title = "하의 피팅 중..."
                    estimate = "하의 피팅 약 1분 소요"
                elif "전송" in raw_stage:
                    title = "이미지 전송 중..."
                    estimate = "상의·하의 각각 약 1분 소요"
                elif "연결" in raw_stage:
                    title = "AI 서버 연결 중..."
                    estimate = "상의·하의 각각 약 1분 소요"
                else:
                    title = raw_stage.split("  |  ")[0]
                    estimate = "상의·하의 각각 약 1분 소요"

                frame = put_text_korean(
                    frame, title, (px1 + 16, py1 + 10), 19, (35, 35, 35)
                )
                frame = put_text_korean(
                    frame, "촬영이 완료되었어요! 편하게 기다려 주세요.",
                    (px1 + 16, py1 + 40), 15, (80, 80, 80)
                )
                frame = put_text_korean(
                    frame, estimate, (px1 + 16, py1 + 74), 12, (125, 125, 125)
                )
                frame = put_text_korean(
                    frame, elapsed_text, (px2 - 64, py1 + 76), 12, (125, 125, 125)
                )

            if result_image is not None:
                cv2.imshow("CatVTON AI Result", result_image)
                print("[CatVTON] 결과 창 표시 완료", flush=True)
                capture_feedback_text = "AI 가상피팅 완료!"
                capture_feedback_until = time.monotonic() + 3.0

            if error_message is not None:
                print("[AI 피팅 오류]", error_message, flush=True)
                capture_feedback_text = "AI 피팅에 실패했습니다. 로그를 확인해 주세요."
                capture_feedback_until = time.monotonic() + 4.0

            # ==================================
            # 18. 현재 의상 정보
            # ==================================

            frame = put_text_korean(
                frame,
                "상의: " + (clothes[selected_upper_idx]["name"] if selected_upper_idx is not None else "미선택")
                + " | 하의: " + (clothes[selected_lower_idx]["name"] if selected_lower_idx is not None else "미선택"),
                (max(10, w // 2 - 220), h - 112),
                17,
                (255, 255, 255)
            )

            # ==================================
            # 스페이스바 카운트다운 처리
            # ==================================
            if ai_countdown_deadline is not None:
                remaining = ai_countdown_deadline - time.monotonic()

                if remaining > 0:
                    seconds = int(np.ceil(remaining))
                    frame = put_text_korean(
                        frame,
                        f"AI 피팅 촬영까지 {seconds}초",
                        (max(15, w // 2 - 130), max(75, h // 4)),
                        27,
                        (255, 255, 255)
                    )
                else:
                    # 자세 안내는 참고용이며, 스페이스바 촬영을 차단하지 않습니다.
                    # 화면에 UI/옷을 합성하기 전의 현재 웹캠 프레임 사용
                    person_image = original_frame.copy()
                    upper_image = ai_countdown_upper
                    lower_image = ai_countdown_lower
                    selected_name = ai_countdown_name
                    ai_countdown_deadline = None
                    ai_countdown_upper = None
                    ai_countdown_lower = None
                    ai_countdown_name = None

                    with ai_lock:
                        if not ai_state["running"]:
                            ai_state["running"] = True
                            ai_state["result"] = None
                            ai_state["error"] = None
                            ai_state["stage"] = "CatVTON 서버 연결 준비 중"
                            ai_state["started_at"] = time.monotonic()
                            start_ai = True
                        else:
                            start_ai = False

                    if start_ai:
                        print("[CatVTON] 5초 카운트다운 완료, AI 피팅 실행")
                        print("[CatVTON] 선택한 옷:", selected_name)
                        threading.Thread(
                            target=generate_catvton,
                            args=(person_image, upper_image, lower_image),
                            daemon=True
                        ).start()
                    else:
                        print("[CatVTON] 이미 생성 중이므로 촬영을 취소합니다.")

            # ==================================
            # 19. 웹캠 화면 표시
            # ==================================

            # 손 OK 사인: AR 오버레이가 올라간 프레임 저장 (상태 안내 패널 제외)
            if capture_requested_by_gesture:
                filename = os.path.join(CAPTURE_DIR, f"capture_{capture_count}.png")
                if cv2.imwrite(filename, frame):
                    print("[OK 사인 캡처] 저장:", filename, flush=True)
                    capture_count += 1
                    capture_feedback_text = "화면 캡처 완료!"
                    capture_feedback_until = time.monotonic() + 2.5
                else:
                    capture_feedback_text = "캡처 저장 실패"
                    capture_feedback_until = time.monotonic() + 2.5

            # AI 촬영 위치 안내: 하단 중앙의 작은 불투명 흰색 바
            if not ai_running and not pose_ready and pose_hint != "촬영 준비 완료! 현재 자세를 유지해 주세요.":
                hint_w = min(530, w - 24)
                hx = (w - hint_w) // 2
                hy = max(120, h - 153)
                cv2.rectangle(frame, (hx, hy), (hx + hint_w, hy + 46), (255, 255, 255), -1)
                cv2.rectangle(frame, (hx, hy), (hx + hint_w, hy + 46), (222, 222, 222), 1)
                frame = put_text_korean(frame, pose_hint, (hx + 12, hy + 11), 15, (55, 55, 55))

            # 우측 상단 안내 (옷장 메뉴가 열려 있어도 손 캡처 가능)
            if not ai_running:
                frame = put_text_korean(frame, "OK 손모양 0.7초 → 캡처",
                                        (max(10, w - 280), 18), 16, (255, 255, 255))

            # 캡처 성공 메시지는 웹캠 화면 중앙에 2초간 표시합니다.
            if time.monotonic() < capture_feedback_until:
                toast_w, toast_h = min(390, w - 30), 64
                tx1 = (w - toast_w) // 2
                ty1 = max(90, h // 2 - toast_h // 2)
                cv2.rectangle(frame, (tx1, ty1), (tx1 + toast_w, ty1 + toast_h), (35, 75, 45), -1)
                cv2.rectangle(frame, (tx1, ty1), (tx1 + toast_w, ty1 + toast_h), (150, 240, 170), 2)
                frame = put_text_korean(frame, capture_feedback_text,
                                        (tx1 + 24, ty1 + 17), 24, (255, 255, 255))

            cv2.imshow(window_name, frame)
            key = cv2.waitKey(1) & 0xFF
            if key not in (255,):
                print(f"[키보드] key={key}", flush=True)

            # 마우스 좌표는 창 내부의 영상 좌표를 사용합니다.
            while mouse_events:
                mx, my = mouse_events.pop(0)
                if False:  # 캡처 버튼 제거 (OK 사인 또는 C 키 사용)
                    filename = os.path.join(CAPTURE_DIR, f"capture_{capture_count}.png")
                    if cv2.imwrite(filename, frame):
                        print("[캡처] 저장:", filename, flush=True)
                        capture_count += 1
                        capture_feedback_text = "화면 캡처 완료!"
                        capture_feedback_until = time.monotonic() + 2.0
                elif in_box(mx, my, closet_btn):
                    is_closet_open = not is_closet_open
                    closet_page = None
                elif is_closet_open:
                    for name, rect in closet_clickable:
                        if in_box(mx, my, rect):
                            if name == "my":
                                closet_page = "my"
                                closet_list_page = 0
                            elif name == "wishlist":
                                closet_page = "wishlist"
                                closet_list_page = 0
                            elif name == "cart":
                                closet_page = "cart"
                                closet_list_page = 0
                            elif name == "page_prev":
                                closet_list_page = max(0, closet_list_page - 1)
                            elif name == "page_next":
                                closet_list_page += 1
                            elif name == "back":
                                closet_page = None
                            elif name.startswith("item:"):
                                selected = int(name.split(":")[1])
                                current_idx = selected
                                if clothes[selected].get("is_bottom", False):
                                    selected_lower_idx = selected
                                else:
                                    selected_upper_idx = selected
                                is_closet_open = False
                                closet_page = None
                            break
                elif in_box(mx, my, prev_btn) or in_box(mx, my, next_btn):
                    direction = -1 if in_box(mx, my, prev_btn) else 1
                    current_idx = (current_idx + direction) % len(clothes)
                    if clothes[current_idx].get("is_bottom", False):
                        selected_lower_idx = current_idx
                    else:
                        selected_upper_idx = current_idx

            if key in (ord("c"), ord("C")):
                filename = os.path.join(CAPTURE_DIR, f"capture_{capture_count}.png")
                if cv2.imwrite(filename, frame):
                    print("[키보드 캡처] 저장:", filename, flush=True)
                    capture_count += 1
                    capture_feedback_text = "화면 캡처 완료!"
                    capture_feedback_until = time.monotonic() + 2.5

            # 스페이스바로만 5초 후 현재 웹캠 프레임을 촬영
            if key == ord(" "):
                print("[입력] CatVTON 실행 요청 수신", flush=True)
                with ai_lock:
                    already_running = ai_state["running"]

                if already_running:
                    print("[CatVTON] 이미 생성 중입니다.")
                elif ai_countdown_deadline is not None:
                    print("[CatVTON] 카운트다운이 이미 진행 중입니다.")
                elif (selected_upper_idx is None and selected_lower_idx is None) or not any(
                    item.get("product_id") != "none" for item in clothes
                ):
                    print("[안내] 내 옷장/찜/장바구니에서 상의 또는 하의를 선택해 주세요.")
                else:
                    # 자세 인식 결과와 무관하게 5초 카운트다운을 시작합니다.
                    ai_countdown_deadline = time.monotonic() + 5.0
                    ai_countdown_upper = (clothes[selected_upper_idx].get("ai_img", clothes[selected_upper_idx]["img"]).copy()
                                          if selected_upper_idx is not None else None)
                    ai_countdown_lower = (clothes[selected_lower_idx].get("ai_img", clothes[selected_lower_idx]["img"]).copy()
                                          if selected_lower_idx is not None else None)
                    upper_name = clothes[selected_upper_idx]["name"] if selected_upper_idx is not None else "미선택"
                    lower_name = clothes[selected_lower_idx]["name"] if selected_lower_idx is not None else "미선택"
                    ai_countdown_name = f"상의={upper_name} / 하의={lower_name}"
                    print(f"[CatVTON] 선택 상의: {upper_name} / 선택 하의: {lower_name}", flush=True)
                    print("[CatVTON] 5초 뒤 촬영합니다. 상의→하의 순서로 합성합니다!", flush=True)

            if key == ord("r"):
                print("[입력] 내 옷장 / 찜 / 장바구니 새로고침", flush=True)
                upper_key = clothes[selected_upper_idx].get("product_id") if selected_upper_idx is not None else None
                lower_key = clothes[selected_lower_idx].get("product_id") if selected_lower_idx is not None else None
                selected_key = clothes[current_idx].get("product_id")
                refreshed_local = load_clothes()
                new_clothes, new_my, new_wishlist, new_cart = load_shop_clothes(refreshed_local)
                if new_clothes:
                    clothes, my_closet, wishlist, cart = new_clothes, new_my, new_wishlist, new_cart
                    current_idx = next((i for i, item in enumerate(clothes) if item.get("product_id") == selected_key), 0)
                    selected_upper_idx = next((i for i, item in enumerate(clothes) if item.get("product_id") == upper_key), None)
                    selected_lower_idx = next((i for i, item in enumerate(clothes) if item.get("product_id") == lower_key), None)
                    closet_list_page = 0
                    print("[옷장] 새로고침 완료", flush=True)
                else:
                    print("[옷장] 새 상품이 없어 기존 목록을 유지합니다.", flush=True)

            if key in (ord("q"), 27):
                break
            try:
                if cv2.getWindowProperty(window_name, cv2.WND_PROP_VISIBLE) < 1:
                    print("[안내] 창이 닫혀 종료합니다.")
                    break
            except cv2.error:
                break

    finally:

        cap.release()
        hands.close()
        pose.close()
        try:
            cv2.destroyAllWindows()
        except cv2.error as exc:
            print("[안내] 창 정리 중 OpenCV 오류:", exc)

        print("[프로그램] 종료 완료")


# ==========================================
# 20. 프로그램 시작
# ==========================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="fitonx 가상 피팅 시스템")
    parser.add_argument("--top", default=None, help="날씨 추천 상의 이미지 경로 또는 URL")
    parser.add_argument("--bottom", default=None, help="날씨 추천 하의 이미지 경로 또는 URL")
    parser.add_argument("--top-name", default=None, help="날씨 추천 상의 이름")
    parser.add_argument("--bottom-name", default=None, help="날씨 추천 하의 이름")
    args = parser.parse_args()

    print("===================================")
    print("fitonx 가상 피팅 시스템")
    print("CatVTON Gradio API 연동 버전")
    print("===================================")
    print("실행 파일:", os.path.abspath(__file__))
    print("CatVTON URL:", CATVTON_API_URL)

    if args.top or args.bottom:
        print("[날씨 추천] 전달받은 코디로 웹캠을 시작합니다.", flush=True)
    run_virtual_fitting(args.top, args.bottom, args.top_name, args.bottom_name)
