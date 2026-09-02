# Changelog

## 2.3.2 (2026-09-02)

- Adds a "Signed responses" section to the README: the action result's `data` carries `sig`, `kid`, and since 2026-09-01 the ML-DSA-65 post-quantum companion `pqSig`/`pqKid` (with `pqJwt` beside `jwt`); the JWKS holds five entries over two keys; `insumer-verify` 1.8.1+ reports five verdicts.
- Enhances the chain summary to 32 EVM chains (38 total), naming Robinhood Chain.
