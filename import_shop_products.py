
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "front/src/components/CategoryListPage.js"
PUBLIC = ROOT / "front/public"
OUTPUT = ROOT / "insert_shop_products.sql"

text = SOURCE.read_text(encoding="utf-8")

pattern = re.compile(
    r'\{\s*id:\s*"([^"]+)",\s*'
    r'name:\s*"([^"]+)",\s*'
    r'image:\s*"([^"]+)",\s*'
    r'price:\s*(\d+)\s*\}'
)

products = pattern.findall(text)

if len(products) != 70:
    raise RuntimeError(
        f"예상 상품 70개, 실제 {len(products)}개. "
        "CategoryListPage.js의 상품 형식을 확인하세요."
    )

def quote(value):
    return "'" + value.replace("'", "''") + "'"

lines = [
    "USE fitting;",
    "",
    "-- product와 size가 비어 있는 상태에서 실행하세요.",
    "START TRANSACTION;",
    "",
]

seen = set()

for number, (code, name, image, price) in enumerate(
    products, start=1
):
    if code in seen:
        raise RuntimeError(f"중복 상품 코드: {code}")
    seen.add(code)

    image_file = PUBLIC / image.lstrip("/")

    if not image_file.is_file():
        raise FileNotFoundError(
            f"상품 이미지가 없습니다: {image_file}"
        )

    if code.startswith("top-"):
        category_id = 1
    elif code.startswith("bottom-"):
        category_id = 2
    elif code.startswith("outer-"):
        category_id = 3
    else:
        raise ValueError(f"알 수 없는 카테고리: {code}")

    lines.append(
        "INSERT INTO product "
        "(product_id, category_id, product_name, "
        "price, stock, description, image_url) "
        f"VALUES ({number}, {category_id}, "
        f"{quote(name)}, {price}, 100, "
        f"{quote(name)}, {quote(image)});"
    )

    lines.append(
        "INSERT INTO size "
        "(size_id, product_id, size_name, stock) "
        f"VALUES ({number}, {number}, 'FREE', 100);"
    )

lines.extend([
    "",
    "SELECT COUNT(*) AS product_count FROM product;",
    "SELECT COUNT(*) AS size_count FROM size;",
    "",
    "-- 결과 확인 후 별도로 COMMIT 또는 ROLLBACK 하세요.",
])

OUTPUT.write_text("\n".join(lines), encoding="utf-8")

print("SQL 생성 성공!")
print(f"상품 개수: {len(products)}")
print(f"생성된 파일: {OUTPUT}")
