# TeamFlow

Öğrencilerin yeteneklerine göre proje/yarışma/staj fırsatlarıyla eşleştiği, başvuru ve ekip lideri onay süreçlerini yöneten platform.

Kaynak: (https://teamflow-orcin.vercel.app/)

## Kapsam

**MVP hedefi:** Kullanıcı onboarding (yetenek seçimi) → Feed (eşleşme oranı ile) → Fırsat detayı (side-panel) → Başvuru → Lider inceleme/onay → Onay bildirimi (e-posta).

**Kapsam dışı (bu fazda):** Native iOS UI (API sözleşmesi iOS'a hazır olacak şekilde tasarlanmıştır), gelişmiş mesajlaşma, admin dashboard (ilan/ekip verisi manuel seed edilir).

## Mimari

Frontend ve backend **ayrı geliştirilir ve ayrı deploy edilir**. Web, Firestore'a doğrudan erişmez; her şey Backend HTTP API üzerinden yapılır. Böylece aynı API sözleşmesi ileride iOS istemcisi tarafından da tüketilebilir.

```
teamflow/
├── apps/
│   └── web/          # Next.js + Tailwind frontend
└── services/
    └── api/           # Node.js HTTP API (Firebase Admin + Firestore)
```

### Bileşenler

| Bileşen | Sorumluluk |
|---|---|
| **Web (Next.js + Tailwind)** | UI/UX, responsive davranış (side-panel/bottom-sheet), Firebase ile login ve ID token alma |
| **Backend API (Node.js)** | ID token doğrulama, yetkilendirme, veri doğrulama, iş kuralları, Firestore erişimi, e-posta tetikleme |
| **Firebase** | Auth (Google/GitHub OAuth), Firestore (veri), e-posta bildirimi tetikleyicileri |

### Deploy

- **Web:** Vercel / Netlify / Firebase Hosting (`NEXT_PUBLIC_API_BASE_URL` ile konfigüre edilir)
- **API:** Firebase Functions / Cloud Run (ileride)

## Teknoloji Yığını

- **Frontend:** Next.js (React), Tailwind CSS, Firebase Web SDK
- **Backend:** Node.js (Express/Fastify — MVP için Express önerilir), Firebase Admin SDK
- **Veritabanı:** Firestore
- **Auth:** Firebase Authentication (Google/GitHub OAuth)

## Kurulum

### Ön Koşullar

- Node.js (LTS)
- Bir Firebase projesi (Auth + Firestore aktif)

### Backend (`services/api`)

```bash
cd services/api
npm install
npm run dev
```

Gerekli ortam değişkenleri:

| Değişken | Açıklama |
|---|---|
| `PORT` | API'nin çalışacağı port |
| `FIREBASE_PROJECT_ID` | Firebase proje ID'si |
| `GOOGLE_APPLICATION_CREDENTIALS` | (opsiyonel) Service account credential yolu |

Smoke test:
- `GET /health` → `200 { ok: true }`
- Auth gerektiren bir endpoint token'sız çağrıldığında `401` dönmeli

### Frontend (`apps/web`)

```bash
cd apps/web
npm install
npm run dev
```

Gerekli ortam değişkenleri:

| Değişken | Açıklama |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API adresi |

Smoke test:
- Google/GitHub ile login çalışmalı
- Login sonrası `/health` çağrısı UI üzerinden (debug sayfası/console) yapılabilmeli

## Veri Modeli (Firestore)

### `users`
```
uid, displayName, skills[], website_url?, createdAt, updatedAt
```

### `opportunities`
```
opp_id, title, tags[], deadline, type? ("competition"|"project"|"internship")
```

### `teams`
```
team_id, opp_id, leader_id, members[], capacity?
```

### `applications`
```
application_id, opp_id, team_id, applicant_id,
status ("pending"|"approved"|"rejected"|"cancelled"),
createdAt, updatedAt
```

## API Sözleşmesi

Bu API hem web hem de ileride iOS istemcisi tarafından ortak kullanılacak şekilde tasarlanmıştır.

**Auth:** `Authorization: Bearer <Firebase_ID_Token>`

**Standart hata formatı:**
```json
{ "code": "VALIDATION_ERROR", "message": "...", "details": {} }
```

**Pagination (cursor tabanlı, infinite scroll uyumlu):**
```
GET /opportunities?limit=20&cursor=<opaque>
→ { "items": [...], "nextCursor": "string|null" }
```

### Endpoint'ler

| Metod | Endpoint | Açıklama |
|---|---|---|
| `GET` | `/health` | Servis sağlık kontrolü |
| `GET` | `/me` | Profil bilgisi getir |
| `PATCH` | `/me` | Profil güncelle (`skills`, `website_url`) |
| `GET` | `/opportunities` | Fırsat feed'i (match score ile sıralı) |
| `GET` | `/opportunities/:oppId` | Fırsat detayı |
| `POST` | `/applications` | Başvuru oluştur |
| `GET` | `/applications` | Kullanıcının/liderin başvurularını listele |
| `POST` | `/applications/:applicationId/decision` | Başvuruyu onayla/reddet |

## Eşleşme Oranı (Match Score) Hesabı

Backend tarafında tek kaynaktan hesaplanır:

```
match = round(100 * |intersection(userSkills, oppTags)| / |oppTags|)
```

`oppTags` boşsa `match = 0`. Feed sıralaması `matchScore desc`, eşitlik durumunda `deadline asc`.

## User Story'ler (Geliştirme Sırası)

1. **US.01 — Onboarding / Yetenek Seçimi:** İlk girişte zorunlu modal, minimum 3 yetenek seçilmeden akışa geçilemez (AC G.03).
2. **US.02 — Feed (Match Score):** Grid/List görünüm, infinite scroll, kart tıklanınca side-panel/bottom-sheet açılır (AC.01, AC.02).
3. **US.03 — Başvuru İnceleme ve Onay:** Ekip lideri başvuranların yetenek/portfolyo bilgisini inceler, approve/reject kararı verir. Aktif başvuru limiti: 3 (AC.03). Kapasite kontrolünde transaction kullanılır.
4. **US.04 — Onay Bildirimi:** MVP'de e-posta ile bildirim (tarayıcı push ileriki faz).

## Acceptance Kriterleri Doğrulama Matrisi

| Kriter | Açıklama | Karşılık |
|---|---|---|
| AC.01 | Match score | Backend intersection hesabı, UI'da yüzde olarak gösterim |
| AC.02 | Responsive panel | ≥768px sağ panel, <768px bottom-sheet |
| AC.03 | Başvuru limiti | Backend: 3 aktif başvuruda `LIMIT_REACHED`; Frontend: "Katıl" butonu disabled + tooltip |

## Ortak UI/UX Kuralları

- **Responsive side-panel:** ≥768px için sağ panel, <768px için bottom-sheet
- **Dark/Light mode:** Tasarım sistemi token'ları ile
- **Erişilebilirlik:** Modal/bottom-sheet için focus trap, ESC ile kapatma, klavye navigasyonu

## "Done" Tanımı

Bir story'nin tamamlanmış sayılması için:

- **API:** Endpoint(ler) dokümanda tanımlı auth + hata formatına uyuyor
- **UI:** Responsive davranış ve temel UX akışı tamam
- **Test:** Minimum senaryolar manuel smoke ile doğrulandı
- **Observability (MVP):** Server loglarında hata kodu ve `uid` görünüyor

## Uçtan Uca Smoke Test Senaryosu

1. Login (Google/GitHub) → zorunlu skill modal (min 3) → feed
2. Feed'de match % görünür, grid/list değişir, infinite scroll çalışır
3. İlan seç → panel açılır → "Katıl" → başvuru `pending` olur
4. Lider pending başvuruyu görür → approve eder
5. Başvuran e-posta bildirimi alır (MVP)

## Yol Haritası

- [ ] Repo iskeleti (`apps/web`, `services/api`)
- [ ] Backend: `/health` + auth middleware
- [ ] Frontend: Login + API client iskeleti
- [ ] Firestore koleksiyonları + seed data (10 opportunity, her biri için ≥1 team)
- [ ] US.01 → US.02 → US.03 → US.04 sırasıyla uygulama
- [ ] Native iOS istemcisi (ileriki faz)
