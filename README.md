Generate memes in Slack.

# Development environment

1. Start ngrok (`ngrok http 4390`).
2. Go to https://api.slack.com/apps.
3. Under Slash Comamnds, change request URL to the ngrok address.
4. Under OAuth and Permissions, change Redirect URL to the ngrok address.
5. Replace URL in .env with the ngrok address.
6. Run `yarn run start`.
7. Go to test slack channel.
