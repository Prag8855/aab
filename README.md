# All About Berlin

This repo contains the templates and content used to render [allaboutberlin.com](https://allaboutberlin.com). All About Berlin is built on top of [Ursus](https://github.com/all-about-berlin/ursus/), a static site generator.

## How to build

This project uses [mise](https://mise.jdx.dev/) to simplify dev tasks. It's optional.

Run `mise setup` or `pip3 install -r requirements-dev.txt` to install local dependencies.

### Docker

Run `mise dev` or `docker compose up --build -d` directly.

This will build and start the project inside docker containers. The website is served at `https://localhost`. The frontend/backend are reloaded on changes.

In production, run `docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d`. The production configuration is slightly stricter. It disables debugging and reloading on changes.

### Standalone

Run `mise site` or `ursus --watch --fast --serve -c ./frontend/ursus_config.py` to run just the frontend. This is much faster than running docker, and it's enough for frontend development and content changes.

## How to test

Run `pytest tests` from the project root. The server must run at `http://localhost` for the tests to pass.

To update the snapshots used for snapshot testing, run `pytest tests --update-snapshots`.

## How to lint

Run `mise lint` to run the project's various linters.

## Notes for contributors

Before you contribute to this website, please note that...

- **This is a commercial website**  
    All About Berlin is a business. Your unpaid work benefits Berliners, but it also benefits a business. You might prefer to work on non-profit community projects.
- **This is a copyrighted project**  
    I own the copyright to this repository, including your contributions to it. The open source parts of All About Berlin are in separate repositories. You might prefer to work on something that you keep.
- **I am the [BDFL](https://www.urbandictionary.com/define.php?term=BDFL)**  
    I might make decisions that you do not agree with, and not give you a chance to object. I might also reject your contributions or alter them beyond recognition. I aim to be as nice as possible about it. Let's talk about your ideas *before* you put a lot of work into them.

If you are okay with this, then I would be honoured to receive your contributions.
