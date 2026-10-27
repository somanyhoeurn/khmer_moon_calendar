# Third-party notices

## MomentKH

`backend/app/domain/calendar/chhankitek.py` is a Python port of the calculation
core of MomentKH (https://github.com/ThyrithSor/momentkh). The MIT license
requires this notice to be kept with the code. It is not shown in the website UI.

```
MIT License

Copyright (c) 2018 ThyrithSor

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Fonts

- **Battambang** (Google Fonts), SIL Open Font License 1.1. Khmer text. Self-hosted at build time by `next/font`.
- **Rubik** (Google Fonts), SIL Open Font License 1.1. Latin/English text. Self-hosted at build time by `next/font`.
- The seated-Buddha brand mark (`frontend/src/components/branding/buddha-logo.tsx`, `frontend/src/app/icon.svg`, `frontend/public/brand/buddha-mark.svg`) is original artwork made for this project.

## Runtime dependencies

All npm and PyPI dependencies are MIT, BSD, Apache-2.0 or ISC licensed, except
**psycopg** (LGPL-3.0). This project uses psycopg as an unmodified, dynamically
imported library, which the LGPL permits for an MIT-licensed application.
