# All About Berlin

This repo contains the templates and content used to render [allaboutberlin.com](https://allaboutberlin.com). All About Berlin is built on top of [Ursus](https://github.com/all-about-berlin/ursus/), a static site generator.

## How to build

This repository contains a file called `ursus_config.py`. This tells Ursus how to build this website.

1. Install Ursus (`pip install ursus-ssg`).
2. From this repository's root directory (`cd path/to/this/repo`):
    1. Install extra Python packages (`pip install -r ./requirements.txt`).
    2. Build the website (`ursus`)
    3. Serve the website on port 80 with `ursus -s`.
    4. Visit `http://localhost` to see the website.

Ursus can rebuild the website when you change the content (`ursus -w` or `--watch`) and rebuild only the parts that change (`ursus -f` or `--fast`). When I work on the website, I usually call `cd path/to/this/repo && ursus -wfs`.

## Notes for contributors

Before you contribute to this website, please note that...

- **This is a commercial website**  
    All About Berlin is a business. Your unpaid work benefits Berliners, but it also benefits a business. You might prefer to work on non-profit community projects.
- **This is a copyrighted project**  
    I own the copyright to this repository, including your contributions to it. The open source parts of All About Berlin are in separate repositories. You might prefer to work on something that you keep.
- **I am the [BDFL](https://www.urbandictionary.com/define.php?term=BDFL)**  
    I might make decisions that you do not agree with, and not give you a chance to object. I might also reject your contributions or alter them beyond recognition. I aim to be as nice as possible about it. Let's talk about your ideas *before* you put a lot of work into them.

If you are okay with this, then I would be honoured to receive your contributions.

## Utilities

Call `ursus lint` to lint the content for style errors.