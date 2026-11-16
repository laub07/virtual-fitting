
import requests
import cv2
import numpy as np

url = "http://localhost:3000/bottom/longpant/pants1.webp"

response = requests.get(url, timeout=10)
response.raise_for_status()

image_array = np.frombuffer(response.content, np.uint8)
image = cv2.imdecode(image_array, cv2.IMREAD_UNCHANGED)

if image is None:
    print("이미지 변환 실패")
else:
    print("쇼핑몰 이미지 불러오기 성공!")
    print("이미지 크기:", image.shape)

    cv2.imshow("Shop Image Test", image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
