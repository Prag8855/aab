# Deployment to production

Deployments are triggered by a GitHub webhook. It requires `webhook` to be installed and running.

The webhook runs at `https://allaboutberlin.com:9000/hooks/deploy`.

## Setup

1. Clone this repository
1. Create a `.env` file in your project root. Use `.env.example` as a template.
2. Run `setup.sh`.
