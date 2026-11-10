from pathlib import Path

from PIL import Image


WIKI_DIR = Path(__file__).resolve().parent
LOGO = Path("logo.png")


def main() -> None:
    converted = 0

    for png_path in WIKI_DIR.rglob("*"):
        if not png_path.is_file() or png_path.suffix.casefold() != ".png":
            continue
        if png_path.relative_to(WIKI_DIR).as_posix().casefold() == LOGO.as_posix():
            continue

        webp_path = png_path.with_suffix(".webp")
        with Image.open(png_path) as image:
            image.save(webp_path, "WEBP", quality=90, method=6)

        png_path.unlink()
        print(f"{png_path.relative_to(WIKI_DIR)} -> {webp_path.relative_to(WIKI_DIR)}")
        converted += 1

    print(f"Convertidas: {converted}")


if __name__ == "__main__":
    main()
