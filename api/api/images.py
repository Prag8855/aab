from PIL import Image, ImageDraw, ImageFont


def wrap_text(text: str, font, max_width: int):
    words = text.split()
    lines = [[]]
    for word in words:
        line_width = font.getbbox(" ".join(lines[-1] + [word]))[2]
        if line_width <= max_width:
            lines[-1].append(word)
        elif font.getbbox(word)[2] > max_width:
            raise Exception("Word too long")
        else:
            lines.append([word, ])

    return "\n".join(" ".join(line) for line in lines)


def text_height(text: str, font, line_spacing: int):
    ascent, descent = font.getmetrics()
    lines = text.split('\n')
    return sum([
        font.getmask(line).getbbox()[3] + descent
        for line in lines
    ]) + (len(lines) - 1) * line_spacing


def text_width(text: str, font):
    return max(font.getmask(line).getbox()[2] for line in text.split('\n'))


def make_cover_image(text: str) -> Image:
    padding = 50
    line_spacing = 25
    image_size = (1200, 630)
    logo_size = (70, 70)
    logo_position = (720, image_size[1] - logo_size[1] - 30)

    image = Image.new("RGB", image_size, (218, 81, 61))
    imgdraw = ImageDraw.Draw(image)

    # Place logo
    logo = Image.open('assets/logo.png')
    logo.thumbnail(logo_size)
    image.paste(logo, logo_position)

    # Wrap the main text to fit available space
    font_size = 100
    while True:
        title_font = ImageFont.truetype("assets/libre-franklin.ttf", font_size)
        try:
            wrapped_title = wrap_text(text, title_font, image.size[0] - 2 * padding)
        except:
            font_size -= 3
        else:
            if len(wrapped_title.split('\n')) > 4:
                font_size -= 3
            else:
                break

    # Vertically align the text
    title_height = text_height(wrapped_title, title_font, line_spacing)
    content_offset = max(padding, (550 - title_height) // 2)

    imgdraw.multiline_text(
        (padding, content_offset), wrapped_title,
        font=title_font, fill=(255, 255, 255), spacing=line_spacing
    )

    logo_font = ImageFont.truetype("assets/libre-franklin.ttf", 50)
    imgdraw.multiline_text(
        (logo_position[0] + 60, logo_position[1] + 1), "All About Berlin",
        font=logo_font, fill=(255, 255, 255)
    )

    return image
