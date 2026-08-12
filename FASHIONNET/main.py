import cv2
import numpy as np
import mediapipe as mp
import time
import os
from PIL import ImageFont, ImageDraw, Image

# =========================
# 1. 한글 출력 & PNG 합성 함수
# =========================
def put_text_korean(img, text, position, font_size=20, color=(0, 0, 0)):
    """OpenCV 이미지에 텍스트 렌더링"""
    img_pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(img_pil)
    try:
        font = ImageFont.truetype("malgun.ttf", font_size)
    except:
        font = ImageFont.load_default()
    draw.text(position, text, font=font, fill=color)
    return cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR)

def draw_rounded_rect(img, pt1, pt2, color, radius=15, thickness=-1):
    """둥근 모서리 사각형을 그리는 함수"""
    x1, y1 = pt1
    x2, y2 = pt2
    
    cv2.rectangle(img, (x1 + radius, y1), (x2 - radius, y2), color, thickness)
    cv2.rectangle(img, (x1, y1 + radius), (x2, y2 - radius), color, thickness)
    
    cv2.circle(img, (x1 + radius, y1 + radius), radius, color, thickness)
    cv2.circle(img, (x2 - radius, y1 + radius), radius, color, thickness)
    cv2.circle(img, (x1 + radius, y2 - radius), radius, color, thickness)
    cv2.circle(img, (x2 - radius, y2 - radius), radius, color, thickness)

def overlay_png(background, overlay, x, y, width, height):
    if overlay is None or width <= 0 or height <= 0:
        return background

    overlay = cv2.resize(overlay, (width, height))
    bg_h, bg_w = background.shape[:2]

    if x < 0:
        overlay = overlay[:, -x:]
        x = 0
    if y < 0:
        overlay = overlay[-y:, :]
        y = 0

    height, width = overlay.shape[:2]
    if x >= bg_w or y >= bg_h or width <= 0 or height <= 0:
        return background

    if x + width > bg_w: overlay = overlay[:, :bg_w - x]
    if y + height > bg_h: overlay = overlay[:bg_h - y, :]
    height, width = overlay.shape[:2]

    if overlay.shape[2] == 3:
        alpha = np.ones((height, width), dtype=np.float32)
        overlay_rgb = overlay
    else:
        overlay_rgb = overlay[:, :, :3]
        alpha = overlay[:, :, 3] / 255.0

    roi = background[y:y + height, x:x + width]
    for c in range(3):
        roi[:, :, c] = roi[:, :, c] * (1 - alpha) + overlay_rgb[:, :, c] * alpha
    background[y:y + height, x:x + width] = roi
    return background


# =========================
# 2. UI 그리기 함수
# =========================
def draw_ui(frame, is_closet_open, wish_list, cart_list):
    h, w, _ = frame.shape

    # 1. 상단 버튼 영역 (CLOSET, CAM)
    closet_btn_box = (25, 25, 145, 75)
    cam_btn_box = (w - 145, 25, w - 25, 75)

    # 2. 하단 이동 버튼 영역 (<, >)
    prev_btn_box = (45, h - 85, 105, h - 35)
    next_btn_box = (w - 105, h - 85, w - 45, h - 35)

    # 버튼 그리기
    draw_rounded_rect(frame, (closet_btn_box[0], closet_btn_box[1]), (closet_btn_box[2], closet_btn_box[3]), (255, 240, 230), radius=15)
    frame = put_text_korean(frame, "[CLOSET]", (closet_btn_box[0] + 15, closet_btn_box[1] + 15), 16, (180, 80, 50))

    draw_rounded_rect(frame, (cam_btn_box[0], cam_btn_box[1]), (cam_btn_box[2], cam_btn_box[3]), (230, 255, 230), radius=15)
    frame = put_text_korean(frame, "[CAM]", (cam_btn_box[0] + 25, cam_btn_box[1] + 15), 16, (30, 150, 60))

    draw_rounded_rect(frame, (prev_btn_box[0], prev_btn_box[1]), (prev_btn_box[2], prev_btn_box[3]), (240, 240, 240), radius=12)
    frame = put_text_korean(frame, "<", (prev_btn_box[0] + 20, prev_btn_box[1] + 8), 24, (50, 50, 50))

    draw_rounded_rect(frame, (next_btn_box[0], next_btn_box[1]), (next_btn_box[2], next_btn_box[3]), (240, 240, 240), radius=12)
    frame = put_text_korean(frame, ">", (next_btn_box[0] + 20, next_btn_box[1] + 8), 24, (50, 50, 50))

    item_boxes = []

    # 3. 옷장 카드 패널 (Wishlist & Cart 목록)
    if is_closet_open:
        panel_x1, panel_y1, panel_x2, panel_y2 = 30, 85, 280, h - 95
        
        overlay = frame.copy()
        draw_rounded_rect(overlay, (panel_x1, panel_y1), (panel_x2, panel_y2), (255, 255, 255), radius=20)
        cv2.addWeighted(overlay, 0.88, frame, 0.12, 0, frame)
        draw_rounded_rect(frame, (panel_x1, panel_y1), (panel_x2, panel_y2), (200, 200, 200), radius=20, thickness=2)

        curr_y = panel_y1 + 20
        
        # Wishlist 카테고리
        frame = put_text_korean(frame, "♥ Wishlist", (panel_x1 + 20, curr_y), 18, (220, 60, 80))
        curr_y += 35

        for item in wish_list:
            bx1, by1, bx2, by2 = panel_x1 + 15, curr_y, panel_x2 - 15, curr_y + 40
            draw_rounded_rect(frame, (bx1, by1), (bx2, by2), (245, 245, 250), radius=10)
            frame = put_text_korean(frame, f"  {item['name']}", (bx1 + 10, by1 + 8), 15, (40, 40, 40))
            item_boxes.append(('item', item, bx1, by1, bx2, by2))
            curr_y += 48

        # 구분선
        cv2.line(frame, (panel_x1 + 15, curr_y), (panel_x2 - 15, curr_y), (220, 220, 220), 1)
        curr_y += 15

        # Cart 카테고리
        frame = put_text_korean(frame, "🛒 Cart", (panel_x1 + 20, curr_y), 18, (50, 120, 220))
        curr_y += 35

        for item in cart_list:
            bx1, by1, bx2, by2 = panel_x1 + 15, curr_y, panel_x2 - 15, curr_y + 40
            draw_rounded_rect(frame, (bx1, by1), (bx2, by2), (245, 245, 250), radius=10)
            frame = put_text_korean(frame, f"  {item['name']}", (bx1 + 10, by1 + 8), 15, (40, 40, 40))
            item_boxes.append(('item', item, bx1, by1, bx2, by2))
            curr_y += 48

    return frame, closet_btn_box, cam_btn_box, prev_btn_box, next_btn_box, item_boxes


# =========================
# 3. 메인 가상 피팅 및 NUI
# =========================
def run_virtual_fitting():
    wish_list = [
        {"name": "후드티", "img": cv2.imread("clothes/clothes1.png", cv2.IMREAD_UNCHANGED)},
        {"name": "니트", "img": cv2.imread("clothes/clothes2.png", cv2.IMREAD_UNCHANGED)}
    ]
    cart_list = [
        {"name": "청바지", "img": cv2.imread("clothes/clothes3.png", cv2.IMREAD_UNCHANGED)},
        {"name": "자켓", "img": cv2.imread("clothes/clothes4.png", cv2.IMREAD_UNCHANGED)}
    ]
    
    all_clothes = wish_list + cart_list
    current_idx = 0
    current_cloth = all_clothes[current_idx]["img"]

    is_closet_open = False
    
    # ★ 단발성 터치 트리거를 위한 터치 상태 플래그
    is_touching = False

    capture_count = 1
    os.makedirs("captures", exist_ok=True)

    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

    cap = cv2.VideoCapture(0)

    while True:
        ret, frame = cap.read()
        if not ret: break

        frame = cv2.flip(frame, 1)
        h, w, _ = frame.shape

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # 1. Pose 분석 (의상 피팅)
        pose_result = pose.process(rgb)
        if pose_result.pose_landmarks and current_cloth is not None:
            landmarks = pose_result.pose_landmarks.landmark
            ls = np.array([int(landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].x * w), int(landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].y * h)])
            rs = np.array([int(landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].x * w), int(landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].y * h)])
            lh = np.array([int(landmarks[mp_pose.PoseLandmark.LEFT_HIP].x * w), int(landmarks[mp_pose.PoseLandmark.LEFT_HIP].y * h)])
            rh = np.array([int(landmarks[mp_pose.PoseLandmark.RIGHT_HIP].x * w), int(landmarks[mp_pose.PoseLandmark.RIGHT_HIP].y * h)])

            shoulder_center = (ls + rs) // 2
            hip_center = (lh + rh) // 2
            torso_height = int(np.linalg.norm(hip_center - shoulder_center))
            shoulder_width = int(np.linalg.norm(ls - rs))

            cloth_width = int(shoulder_width * 2.5)
            cloth_height = int(torso_height * 1.8)
            x = int(shoulder_center[0] - cloth_width / 2)
            y = int(shoulder_center[1] - torso_height * 0.45)

            frame = overlay_png(frame, current_cloth, x, y, cloth_width, cloth_height)

        # 2. 검지 손가락 끝 좌표 추적
        finger_tip = None
        hands_result = hands.process(rgb)
        if hands_result.multi_hand_landmarks:
            for hand_landmarks in hands_result.multi_hand_landmarks:
                index_tip = hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP]
                finger_tip = np.array([int(index_tip.x * w), int(index_tip.y * h)])

        # 3. UI 렌더링
        frame, closet_btn, cam_btn, prev_btn, next_btn, item_boxes = draw_ui(
            frame, is_closet_open, wish_list, cart_list
        )

        # 4. (핵심) 버튼을 손으로 '터치하는 순간' 1회만 동작하도록 수정
        current_hover_target = None

        if finger_tip is not None:
            rx, ry = finger_tip[0], finger_tip[1]

            # 📁 CLOSET 버튼 영역
            if closet_btn[0] <= rx <= closet_btn[2] and closet_btn[1] <= ry <= closet_btn[3]:
                current_hover_target = "CLOSET"

            # 📷 CAM 버튼 영역
            elif cam_btn[0] <= rx <= cam_btn[2] and cam_btn[1] <= ry <= cam_btn[3]:
                current_hover_target = "CAM"

            # < 버튼 영역
            elif prev_btn[0] <= rx <= prev_btn[2] and prev_btn[1] <= ry <= prev_btn[3]:
                current_hover_target = "PREV"

            # > 버튼 영역
            elif next_btn[0] <= rx <= next_btn[2] and next_btn[1] <= ry <= next_btn[3]:
                current_hover_target = "NEXT"

            # 옷장 내부 항목 영역
            elif is_closet_open:
                for target_type, item, x1, y1, x2, y2 in item_boxes:
                    if x1 <= rx <= x2 and y1 <= ry <= y2:
                        current_hover_target = ("ITEM", item)
                        break

        # 버튼에 새로 닿았을 때만 동작 실행 (손을 대고 있어도 무한 실행 안 됨)
        if current_hover_target is not None:
            if not is_touching:
                is_touching = True  # 터치 중 상태로 변경

                if current_hover_target == "CLOSET":
                    is_closet_open = not is_closet_open  # 손을 대면 옷장이 켜진 채 유지됨
                    print("옷장 상태 전환:", is_closet_open)

                elif current_hover_target == "CAM":
                    filename = f"captures/capture_{capture_count}.png"
                    cv2.imwrite(filename, frame)
                    capture_count += 1
                    print("사진 저장 완료:", filename)

                elif current_hover_target == "PREV":
                    current_idx = (current_idx - 1) % len(all_clothes)
                    current_cloth = all_clothes[current_idx]["img"]

                elif current_hover_target == "NEXT":
                    current_idx = (current_idx + 1) % len(all_clothes)
                    current_cloth = all_clothes[current_idx]["img"]

                elif isinstance(current_hover_target, tuple) and current_hover_target[0] == "ITEM":
                    current_cloth = current_hover_target[1]["img"]
                    is_closet_open = False  # 옷을 선택하면 옷장을 자동으로 닫아줌
                    print(f"의상 선택 완료 및 착용: {current_hover_target[1]['name']}")
        else:
            # 손이 어떤 버튼 영역도 안 짚고 있으면 터치 상태 해제
            is_touching = False

        # 검지 손가락 끝 포인터 시각화
        if finger_tip is not None:
            pointer_color = (0, 255, 100) if is_touching else (0, 255, 255)
            cv2.circle(frame, tuple(finger_tip), 7, pointer_color, -1)
            cv2.circle(frame, tuple(finger_tip), 11, (255, 255, 255), 2)

        cv2.imshow("AR Virtual Fitting NUI", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    run_virtual_fitting()