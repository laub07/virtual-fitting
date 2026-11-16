
import os
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
    "https://9ef423be0c9cab37fd.gradio.live"
).rstrip("/")

# 쇼핑몰 API / 이미지 서버 (필요하면 환경변수로 변경)
SHOP_API_BASE = os.environ.get("SHOP_API_BASE", "http://localhost:8080").rstrip("/")
SHOP_IMAGE_BASE = os.environ.get("SHOP_IMAGE_BASE", "http://localhost:3000").rstrip("/")
SHOP_USER_ID = os.environ.get("SHOP_USER_ID", "1")

CLOTHES_DIR = os.path.join(BASE_DIR, "clothes")
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
    x1, y1, x2, y2 = box

    cv2.rectangle(
        frame,
        (x1, y1),
        (x2, y2),
        background,
        -1
    )

    border = (
        (255, 120, 50)
        if selected
        else (180, 180, 180)
    )

    cv2.rectangle(
        frame,
        (x1, y1),
        (x2, y2),
        border,
        2
    )

    frame = put_text_korean(
        frame,
        text,
        (x1 + 10, y1 + 12),
        17,
        text_color
    )

    return frame


def in_box(x, y, box):
    x1, y1, x2, y2 = box

    return (
        x1 <= x <= x2
        and y1 <= y <= y2
    )


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
        "composite": handle_file(person_path),
    }
    result = client.predict(
        person_image=person_input,
        cloth_image=handle_file(cloth_path),
        cloth_type=cloth_type,
        num_inference_steps=30,
        guidance_scale=2.5,
        seed=7777,
        show_type="result only",
        api_name="/submit_function",
    )
    result_path = result.get("path") if isinstance(result, dict) else result
    if isinstance(result_path, (tuple, list)) and result_path:
        result_path = result_path[0]
    if not isinstance(result_path, str):
        raise RuntimeError(f"CatVTON 응답 형식 확인 필요: {str(result)[:300]}")
    image = cv2.imread(result_path, cv2.IMREAD_COLOR)
    if image is None:
        raise RuntimeError(f"CatVTON 결과를 읽지 못했습니다: {result_path}")
    return image


def generate_catvton(person_frame, upper_image, lower_image):
    """선택한 상의/하의를 순차 합성. 두 번째 추론이 첫 번째 결과를 변경할 수 있음."""
    try:
        if upper_image is None and lower_image is None:
            raise RuntimeError("상의 또는 하의를 선택해 주세요.")
        print("[CatVTON] 상·하의 순차 피팅 시작")
        client = Client(CATVTON_API_URL)
        with tempfile.TemporaryDirectory() as temp_dir:
            result_image = person_frame[:, :, :3].copy()
            for cloth_type, cloth_image in (("upper", upper_image), ("lower", lower_image)):
                if cloth_image is None:
                    continue
                print(f"[CatVTON] {cloth_type} 피팅 요청 중...")
                result_image = _catvton_once(
                    client, result_image, cloth_image, cloth_type, temp_dir
                )
                print(f"[CatVTON] {cloth_type} 피팅 완료")

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        filename = os.path.join(RESULT_DIR, f"catvton_full_{timestamp}.png")
        if not cv2.imwrite(filename, result_image):
            raise RuntimeError("결과 이미지 저장 실패")
        with ai_lock:
            ai_state["result"] = result_image
        print("[CatVTON] 최종 결과 저장:", filename)
    except Exception as exc:
        import traceback
        traceback.print_exc()
        with ai_lock:
            ai_state["error"] = str(exc)
        print("[CatVTON] 오류:", exc)
    finally:
        with ai_lock:
            ai_state["running"] = False


# ==========================================
# ==========================================
# 7. 의상 데이터 불러오기
# ==========================================

def load_clothes():
    """과거 테스트용 의상은 불러오지 않습니다. 쇼핑몰 상품만 사용합니다."""
    return []


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
    """상대 이미지 주소를 React 서버 주소로 변환한 후 OpenCV로 읽는다."""
    if not image_url or not isinstance(image_url, str):
        return None
    if image_url.startswith("http://") or image_url.startswith("https://"):
        url = image_url
    else:
        url = urljoin(SHOP_IMAGE_BASE + "/", image_url.lstrip("/"))
    try:
        # 로컬 쇼핑몰 이미지 서버 또는 설정된 원격 이미지 URL만 사용
        response = requests.get(url, timeout=6)
        response.raise_for_status()
        image = cv2.imdecode(np.frombuffer(response.content, np.uint8), cv2.IMREAD_UNCHANGED)
        if image is None:
            raise ValueError("이미지 디코딩 실패")
        return image
    except (requests.RequestException, ValueError) as exc:
        print(f"[쇼핑몰] 이미지 로드 실패 ({url}): {exc}")
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
    """쇼핑몰의 실제 찜/장바구니 상품만 불러온다.

    wishlist/cart는 draw_closet이 요구하는 clothes의 인덱스 목록으로 반환한다.
    API가 실패하면 해당 목록은 비어 있게 된다(가짜 목록으로 대체하지 않음).
    """
    clothes = []  # 기존 테스트용 로컬 의상은 사용하지 않음
    wishlist_indices, cart_indices = [], []
    product_index = {}

    for kind, indices in (("wishlist", wishlist_indices), ("cart", cart_indices)):
        rows = fetch_shop_list(kind)
        if rows is None:
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            product_id = row.get("productId")
            if product_id is None:
                continue
            product_key = str(product_id)
            if product_key in product_index:
                idx = product_index[product_key]
            else:
                image_url = row.get("imageUrl") or row.get("image")
                image = download_shop_image(image_url)
                if image is None:
                    continue
                path = urlparse(str(image_url)).path.lower()
                is_bottom = "/bottom/" in path or any(word in str(row.get("productName", "")) for word in ("바지", "팬츠", "스커트", "치마"))
                idx = len(clothes)
                clothes.append({
                    "name": str(row.get("productName") or f"상품 {product_id}"),
                    "img": make_overlay_image(image),
                    "ai_img": image,  # CatVTON에는 배경 제거 전 원본 전달
                    "filename": f"shop_{product_key}",
                    "product_id": product_key,
                    "is_bottom": is_bottom,
                })
                product_index[product_key] = idx
            if idx not in indices:
                indices.append(idx)

    print(f"[쇼핑몰] 찜 {len(wishlist_indices)}개, 장바구니 {len(cart_indices)}개 이미지 준비 완료")
    return clothes, wishlist_indices, cart_indices


# ==========================================
# 8. 옷장 UI
# ==========================================

def draw_closet(
    frame,
    clothes,
    selected_index,
    closet_page,
    wishlist,
    cart
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

        wish_box = (
            panel_x1 + 20,
            panel_y1 + 75,
            panel_x2 - 20,
            panel_y1 + 130
        )

        cart_box = (
            panel_x1 + 20,
            panel_y1 + 150,
            panel_x2 - 20,
            panel_y1 + 205
        )

        frame = draw_button(
            frame,
            wish_box,
            "♥ 찜한 상품",
            (245, 225, 240)
        )

        frame = draw_button(
            frame,
            cart_box,
            "장바구니",
            (235, 245, 250)
        )

        clickable.append(
            ("wishlist", wish_box)
        )

        clickable.append(
            ("cart", cart_box)
        )

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

        title = (
            "♥ 찜한 상품"
            if closet_page == "wishlist"
            else "장바구니"
        )

        frame = put_text_korean(
            frame,
            title,
            (panel_x1 + 125, panel_y1 + 25),
            21,
            (60, 60, 60)
        )

        indices = (
            wishlist
            if closet_page == "wishlist"
            else cart
        )

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

            for order, index in enumerate(indices):

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
                    item["name"],
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

def run_virtual_fitting():

    print("가상 피팅 프로그램 시작")

    local_clothes = load_clothes()
    clothes, wishlist, cart = load_shop_clothes(local_clothes)

    if not clothes:
        print("[오류] 쇼핑몰 찜/장바구니에서 불러온 의상이 없습니다.")
        return

    current_idx = 0
    selected_upper_idx = next((i for i, item in enumerate(clothes) if not item.get("is_bottom", False)), None)
    selected_lower_idx = None
    print("[안내] 옷장에서 상의와 하의를 각각 선택하세요. 선택한 두 의상이 유지됩니다.")
    print("[안내] 스페이스바: 5초 후 CatVTON 상의→하의 순차 피팅")
    print("[안내] 쇼핑몰 찜/장바구니를 다시 불러오려면 r 키를 누르세요.")

    is_closet_open = False
    closet_page = None

    last_hover_target = None
    was_pinching = False

    capture_count = 1

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

    cap = cv2.VideoCapture(
        0,
        cv2.CAP_DSHOW
    )

    if not cap.isOpened():
        cap.release()
        cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("[오류] 카메라를 열 수 없습니다.")
        hands.close()
        pose.close()
        return

    print("[성공] 웹캠 연결 완료")
    print("[안내] 종료하려면 q를 누르세요.")

    try:

        while True:

            ret, frame = cap.read()

            if not ret:
                print("[오류] 웹캠 프레임 읽기 실패")
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

            # ==================================
            # 11. 손 인식
            # ==================================

            hands_result = hands.process(rgb)

            finger_tip = None
            thumb_tip = None

            if hands_result.multi_hand_landmarks:

                hand = (
                    hands_result.multi_hand_landmarks[0]
                )

                index = hand.landmark[
                    mp_hands.HandLandmark.INDEX_FINGER_TIP
                ]

                thumb = hand.landmark[
                    mp_hands.HandLandmark.THUMB_TIP
                ]

                finger_tip = (
                    int(index.x * w),
                    int(index.y * h)
                )

                thumb_tip = (
                    int(thumb.x * w),
                    int(thumb.y * h)
                )

            pinch = False

            if finger_tip and thumb_tip:

                distance = np.linalg.norm(
                    np.array(finger_tip)
                    - np.array(thumb_tip)
                )

                pinch = distance < 35

            # ==================================
            # 12. UI 버튼 위치
            # ==================================

            closet_btn = (
                20, 20, 150, 70
            )

            capture_btn = (
                20, h - 80, 175, h - 25
            )


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

            frame = draw_button(
                frame,
                capture_btn,
                "화면 캡처",
                (230, 255, 230)
            )


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
                    cart
                )

            # ==================================
            # 14. 손가락 버튼 선택
            # ==================================

            hover_target = None

            if finger_tip:

                fx, fy = finger_tip

                if in_box(fx, fy, closet_btn):
                    hover_target = "CLOSET"

                elif in_box(fx, fy, capture_btn):
                    hover_target = "CAPTURE"


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
            # 15. 일반 버튼 처리
            # ==================================

            # 손가락이 버튼에 새로 들어왔을 때만 실행
            if (
                hover_target is not None
                and hover_target != last_hover_target
            ):

                if hover_target == "CLOSET":

                    is_closet_open = not is_closet_open
                    closet_page = None

                    print(
                        "[옷장] 열림"
                        if is_closet_open
                        else "[옷장] 닫힘"
                    )

                elif hover_target == "CAPTURE":

                    filename = os.path.join(
                        CAPTURE_DIR,
                        f"capture_{capture_count}.png"
                    )

                    if cv2.imwrite(filename, frame):
                        print("[캡처] 저장:", filename)
                        capture_count += 1


                elif hover_target == "PREV":

                    current_idx = (
                        current_idx - 1
                    ) % len(clothes)

                    if clothes[current_idx].get("is_bottom", False):
                        selected_lower_idx = current_idx
                    else:
                        selected_upper_idx = current_idx
                    print(
                        "[의상]",
                        clothes[current_idx]["name"]
                    )

                elif hover_target == "NEXT":

                    current_idx = (
                        current_idx + 1
                    ) % len(clothes)

                    if clothes[current_idx].get("is_bottom", False):
                        selected_lower_idx = current_idx
                    else:
                        selected_upper_idx = current_idx
                    print(
                        "[의상]",
                        clothes[current_idx]["name"]
                    )

            # ==================================
            # 16. 옷장 내부 선택
            # ==================================

            if (
                is_closet_open
                and hover_target is not None
                and pinch
                and not was_pinching
            ):

                if hover_target == "wishlist":

                    closet_page = "wishlist"

                elif hover_target == "cart":

                    closet_page = "cart"

                elif hover_target == "back":

                    closet_page = None

                elif hover_target.startswith("item:"):

                    selected = int(
                        hover_target.split(":")[1]
                    )

                    current_idx = selected
                    if clothes[selected].get("is_bottom", False):
                        selected_lower_idx = selected
                        print("[옷장] 하의 선택:", clothes[selected]["name"])
                    else:
                        selected_upper_idx = selected
                        print("[옷장] 상의 선택:", clothes[selected]["name"])

                    print(
                        "[옷장] 의상 선택:",
                        clothes[current_idx]["name"]
                    )

                    is_closet_open = False
                    closet_page = None

            last_hover_target = hover_target
            was_pinching = pinch

            # ==================================
            # 17. AI 생성 상태 확인
            # ==================================

            with ai_lock:

                ai_running = ai_state["running"]
                result_image = ai_state["result"]
                error_message = ai_state["error"]

                ai_state["result"] = None
                ai_state["error"] = None

            if ai_running:

                frame = put_text_korean(
                    frame,
                    "AI 피팅 생성 중...",
                    (w // 2 - 100, 25),
                    20,
                    (255, 255, 255)
                )

            if result_image is not None:

                cv2.imshow(
                    "CatVTON AI Result",
                    result_image
                )

                print(
                    "[CatVTON] 결과 창 표시 완료"
                )

            if error_message is not None:

                print(
                    "[AI 피팅 오류]",
                    error_message
                )

            # ==================================
            # 18. 현재 의상 정보
            # ==================================

            frame = put_text_korean(
                frame,
                "상의: " + (clothes[selected_upper_idx]["name"] if selected_upper_idx is not None else "미선택")
                + " | 하의: " + (clothes[selected_lower_idx]["name"] if selected_lower_idx is not None else "미선택"),
                (w // 2 - 110, h - 65),
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

            cv2.imshow(
                "AR Virtual Fitting NUI",
                frame
            )

            key = cv2.waitKey(1) & 0xFF

            # 스페이스바를 누르면 5초 후 현재 웹캠 프레임으로 AI 피팅
            if key == ord(" "):
                with ai_lock:
                    already_running = ai_state["running"]

                if already_running:
                    print("[CatVTON] 이미 생성 중입니다.")
                elif ai_countdown_deadline is not None:
                    print("[CatVTON] 카운트다운이 이미 진행 중입니다.")
                elif selected_upper_idx is None and selected_lower_idx is None:
                    print("[안내] 옷장에서 상의 또는 하의를 선택해 주세요.")
                else:
                    ai_countdown_deadline = time.monotonic() + 5.0
                    ai_countdown_upper = (clothes[selected_upper_idx].get("ai_img", clothes[selected_upper_idx]["img"]).copy()
                                          if selected_upper_idx is not None else None)
                    ai_countdown_lower = (clothes[selected_lower_idx].get("ai_img", clothes[selected_lower_idx]["img"]).copy()
                                          if selected_lower_idx is not None else None)
                    ai_countdown_name = "상의+하의"
                    print("[CatVTON] 5초 뒤 촬영합니다. 상의→하의 순서로 합성합니다!")

            if key == ord("r"):
                upper_key = clothes[selected_upper_idx].get("product_id") if selected_upper_idx is not None else None
                lower_key = clothes[selected_lower_idx].get("product_id") if selected_lower_idx is not None else None
                selected_key = clothes[current_idx].get("product_id")
                clothes, wishlist, cart = load_shop_clothes(local_clothes)
                if clothes:
                    current_idx = next(
                        (i for i, item in enumerate(clothes) if item.get("product_id") == selected_key),
                        min(current_idx, len(clothes) - 1)
                    ) if selected_key is not None else min(current_idx, len(clothes) - 1)
                else:
                    clothes = list(local_clothes)
                    current_idx = 0
                if upper_key is not None:
                    selected_upper_idx = next((i for i, item in enumerate(clothes) if item.get("product_id") == upper_key), None)
                elif selected_upper_idx is not None and selected_upper_idx >= len(local_clothes):
                    selected_upper_idx = None
                if lower_key is not None:
                    selected_lower_idx = next((i for i, item in enumerate(clothes) if item.get("product_id") == lower_key), None)
                elif selected_lower_idx is not None and selected_lower_idx >= len(local_clothes):
                    selected_lower_idx = None
                print("[쇼핑몰] 새로고침 완료")

            if key == ord("q"):
                break

    finally:

        cap.release()
        hands.close()
        pose.close()
        cv2.destroyAllWindows()

        print("[프로그램] 종료 완료")


# ==========================================
# 20. 프로그램 시작
# ==========================================

if __name__ == "__main__":

    print("===================================")
    print("fitonx 가상 피팅 시스템")
    print("CatVTON Gradio API 연동 버전")
    print("===================================")

    print("실행 파일:", os.path.abspath(__file__))
    print("CatVTON URL:", CATVTON_API_URL)

    run_virtual_fitting()
