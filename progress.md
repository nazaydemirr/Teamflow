# Progress Log — Teamflow (Week 1)

Bu dosya, şimdiye kadar yaptıklarımızı “intentional compaction” formatında özetler: **yaklaşım**, **tamamlanan adımlar**, **doğrulamalar**, **şu an çözülen problem**.

---

## Approach (seçilen yol)

- **Monorepo + iki ayrı servis/dizin**
  - `services/api` → iOS + web tarafından ortak tüketilecek **HTTP API**
  - `apps/web` → Next.js web UI
- **Frontend, Firestore’a direkt bağlanmıyor.** Web sadece backend API üzerinden çalışacak.
- **Auth yaklaşımı**: Web’de Firebase Auth ile login → **Firebase ID Token** → backend `Authorization: Bearer <token>` ile doğrular.

---

## Done so far

### 1) Plan dokümantasyonu (LLM tüketimi için)

- `plan.md` güncellendi:
  - “LLM-uyumlu Execution Plan (Task Breakdown)” eklendi.
  - Backend kurulum (A.3) ve frontend kurulum (A.4) ilk iki adım olarak netleştirildi.
  - Story’lere “Done checklist” eklendi.

### 2) Backend — `services/api` (A.3)

- **Klasör oluşturuldu:** `services/api`
- **Node paket yöneticisi sorunu çözüldü:**
  - Başta `node` vardı ama `npm` PATH’te yoktu.
  - `winget install OpenJS.NodeJS.LTS` ile Node LTS kuruldu.
  - Terminal PATH güncellenmediği için komut çalıştırırken geçici olarak şu eklendi:
    - `C:\\Program Files\\nodejs`
- **Bağımlılıklar kuruldu:** `express`, `cors`, `zod`, `firebase-admin`, `nodemon`
- **API iskeleti yazıldı:** `services/api/server.js`
  - `GET /health` → `200 {"ok":true}`
  - `GET /me` → auth middleware (Firebase ID token doğrulama) ile korumalı
  - Standart hata formatı: `{ code, message, details? }`
  - CORS açık (MVP); ileride origin whitelist’e daraltılacak
- **Script’ler:** `npm run dev`, `npm start`
- **Doğrulama (smoke):**
  - `/health` çağrısı başarılı.
  - `/me` token yokken 401 dönüyor (beklenen).

> Not: Firebase Admin ile gerçek token doğrulaması için ADC veya `GOOGLE_APPLICATION_CREDENTIALS` gerekecek.

### 3) Frontend — `apps/web` (A.4)

- **Next.js app oluşturuldu:** `apps/web` (TS + Tailwind + ESLint, App Router, `src/` dizini)
- **Firebase Web SDK kuruldu:** `apps/web` içine `firebase`
- **Env örneği eklendi:** `apps/web/.env.local.example`
  - `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8080`)
  - Firebase web config alanları (`NEXT_PUBLIC_FIREBASE_*`)
- **Web bootstrap UI geliştirildi:**
  - `src/lib/env.ts` (env okuma + “Firebase configured mı?” kontrolü)
  - `src/lib/firebase.ts` (firebase init + auth export)
  - `src/lib/api.ts` (tokenlı GET istek helper’ı)
  - `src/app/page.tsx`
    - `/health` smoke çağrısı
    - Firebase config varsa Google ile login → token al
    - Token ile `/me` çağırma
- **Doğrulama:**
  - `npm run build` başarılı.
  - `npm run lint` ilk başta 2 hata verdi, düzeltildi; şu an lint temiz.
  - `npm run dev` ile `http://localhost:3000` Ready oldu.

---

## Current failure / current work

- **Süreçteki ana problem:** `npm`/`corepack` ilk başta PATH’te yoktu.
  - Çözüm: Node LTS kuruldu ama mevcut terminal oturumlarında PATH otomatik yenilenmedi.
  - Şu an “çalıştırırken” geçici PATH ekleyerek ilerliyoruz.
  - Kalıcı çözüm: Cursor/terminal yeniden başlatıldığında `npm`’nin direkt çalışması beklenir; gerekirse sistem PATH’e `C:\\Program Files\\nodejs` eklenmeli.

- **Bir sonraki bloklayıcı (beklenen):** Firebase Admin token doğrulaması ve Firestore erişimi için credential kurulumu (ADC veya service account).

---

## Next steps (immediate)

- `plan.md` A.5: Firestore koleksiyonları + seed (opportunities/teams/applications) hazırlamak.
- Auth/credentials: Backend’in gerçek ID token doğrulamasını ve `GET /me`’yi Firestore’dan döndürecek hale getirmek.

