# Contributing to Khmer Moon Calendar

Thank you for helping preserve Khmer time and tradition.

- **Bugs and date corrections:** open an issue. For a wrong date, include the date, the expected lunar date or holiday, and a **source** (an official announcement or a printed almanac).
- **Code:** see the developer guide in [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for setup, code style, testing rules and how to update holiday data.
- **Translations:** edit `frontend/src/messages/km.json` and `en.json` together.

Before opening a pull request:

```bash
make lint
make test
```

Never commit `.env` files, credentials or unverified holiday dates presented as official.
