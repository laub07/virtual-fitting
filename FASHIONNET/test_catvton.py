
from pathlib import Path
from gradio_client import Client, handle_file

CATVTON_URL = "https://a02ce4f0b6bf7a2755.gradio.live/"

# 테스트용 이미지 경로
person_path = Path("person.jpg")
cloth_path = Path("clothes/test.png")

if not person_path.is_file():
    raise FileNotFoundError(f"사람 사진이 없어요: {person_path}")

if not cloth_path.is_file():
    raise FileNotFoundError(f"옷 사진이 없어요: {cloth_path}")

print("CatVTON 서버 연결 중...")
client = Client(CATVTON_URL)

print("AI 가상 피팅 생성 중...")

result = client.predict(
    person_image={
        "background": handle_file(str(person_path.resolve())),
        "layers": [],
        "composite": None
    },
    cloth_image=handle_file(str(cloth_path.resolve())),
    cloth_type="upper",
    num_inference_steps=30,
    guidance_scale=2.5,
    seed=42,
    show_type="result only",
    api_name="/submit_function"
)

print("CatVTON 응답:", result)
