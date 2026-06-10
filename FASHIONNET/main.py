import cv2
import numpy as np
import mediapipe as mp
import time
import os


# =========================
# 1. PNG 합성 함수
# =========================
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

    if x >= bg_w or y >= bg_h:
        return background

    if x + width > bg_w:
        overlay = overlay[:, :bg_w - x]

    if y + height > bg_h:
        overlay = overlay[:bg_h - y, :]

    height, width = overlay.shape[:2]

    if width <= 0 or height <= 0:
        return background

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
# 2. 버튼 그리기
# =========================
def draw_button(frame, center, text, color):
    cv2.circle(frame, tuple(center), 40, color, -1)
    cv2.circle(frame, tuple(center), 43, (255, 255, 255), 2)

    text_size = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)[0]
    text_x = center[0] - text_size[0] // 2
    text_y = center[1] + text_size[1] // 2

    cv2.putText(frame, text, (text_x, text_y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)


# =========================
# 3. AR 가상 피팅 + NUI
# =========================
def run_virtual_fitting():
    cloth_paths = [
        "clothes/clothes1.png",
        "clothes/clothes2.png",
        "clothes/clothes3.png",
        "clothes/clothes4.png"
    ]

    cloth_list = []

    for path in cloth_paths:
        cloth = cv2.imread(path, cv2.IMREAD_UNCHANGED)

        if cloth is None:
            print("옷 이미지를 찾을 수 없습니다:", path)
        else:
            cloth_list.append(cloth)

    if len(cloth_list) == 0:
        print("사용 가능한 옷 이미지가 없습니다.")
        return

    cloth_index = 0
    last_button_time = 0
    capture_count = 1

    os.makedirs("captures", exist_ok=True)

    mp_pose = mp.solutions.pose

    pose = mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        enable_segmentation=False,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("웹캠을 열 수 없습니다.")
        return

    print("웹캠 실행 성공! q 키를 누르면 종료됩니다.")

    while True:
        ret, frame = cap.read()

        if not ret:
            print("프레임을 읽을 수 없습니다.")
            break

        frame = cv2.flip(frame, 1)
        h, w, _ = frame.shape

        left_btn = np.array([90, h // 2])
        right_btn = np.array([w - 90, h // 2])
        capture_btn = np.array([w - 90, 90])

        draw_button(frame, left_btn, "<", (255, 170, 0))
        draw_button(frame, right_btn, ">", (255, 170, 0))
        draw_button(frame, capture_btn, "CAM", (0, 180, 100))

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = pose.process(rgb)

        if result.pose_landmarks:
            landmarks = result.pose_landmarks.landmark

            left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
            right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER]
            left_hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP]
            right_hip = landmarks[mp_pose.PoseLandmark.RIGHT_HIP]
            right_wrist = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST]

            ls = np.array([int(left_shoulder.x * w), int(left_shoulder.y * h)])
            rs = np.array([int(right_shoulder.x * w), int(right_shoulder.y * h)])
            lh = np.array([int(left_hip.x * w), int(left_hip.y * h)])
            rh = np.array([int(right_hip.x * w), int(right_hip.y * h)])
            rw = np.array([int(right_wrist.x * w), int(right_wrist.y * h)])

            shoulder_center = (ls + rs) // 2
            hip_center = (lh + rh) // 2

            torso_height = int(np.linalg.norm(hip_center - shoulder_center))
            shoulder_width = int(np.linalg.norm(ls - rs))

            cloth_width = int(shoulder_width * 2.5)
            cloth_height = int(torso_height * 1.8)

            x = int(shoulder_center[0] - cloth_width / 2)
            y = int(shoulder_center[1] - torso_height * 0.45)

            current_cloth = cloth_list[cloth_index]
            frame = overlay_png(frame, current_cloth, x, y, cloth_width, cloth_height)

            now = time.time()

            if np.linalg.norm(rw - right_btn) < 55 and now - last_button_time > 1:
                cloth_index = (cloth_index + 1) % len(cloth_list)
                last_button_time = now
                print("다음 옷 선택")

            if np.linalg.norm(rw - left_btn) < 55 and now - last_button_time > 1:
                cloth_index = (cloth_index - 1) % len(cloth_list)
                last_button_time = now
                print("이전 옷 선택")

            if np.linalg.norm(rw - capture_btn) < 55 and now - last_button_time > 1:
                filename = f"captures/capture_{capture_count}.png"
                cv2.imwrite(filename, frame)
                capture_count += 1
                last_button_time = now
                print("사진 저장 완료:", filename)

            cv2.putText(frame, f"Cloth {cloth_index + 1}/{len(cloth_list)}",
                        (30, 40), cv2.FONT_HERSHEY_SIMPLEX,
                        1, (0, 255, 0), 2)

        cv2.imshow("AR Virtual Fitting NUI", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


# =========================
# 4. 실행
# =========================
if __name__ == "__main__":
    print("프로그램 시작")
    run_virtual_fitting()