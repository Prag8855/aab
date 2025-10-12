# All About Berlin

This repo contains the templates and content used to render [allaboutberlin.com](https://allaboutberlin.com). All About Berlin is built on top of [Ursus](https://github.com/all-about-berlin/ursus/), a static site generator.

## How to build

This project uses [mise](https://mise.jdx.dev/) to simplify dev tasks. It's optional.

Run `mise install` to install required tools.

Then run `mise setup` to install local dependencies, set up commit hooks, etc.

### Docker

Run `mise dev` to start docker, build the images, and start the project.

This will build and start the project inside docker containers. The website is served at `https://localhost`. The frontend/backend are reloaded on changes.

In production, run `docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d`. The production configuration is slightly stricter. It disables debugging and reloading on changes. `mise` is not used in production.

### Standalone

Run `mise site` to only run the frontend. This is much faster than running docker, and it's enough for frontend development and content changes.

## How to test

Run `mise test`. It will run all available tests.

Run `mise test-ui` to only run the UI tests. Run `mise test-ui --update-snapshots` to generate new visual testing snapshots if the UI has changed.

Run `mise test-api` to only run the backend and API tests.

There are frontend unit tests. You can see them at `https://localhost/tests/unit`. These are included in the UI tests.

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
