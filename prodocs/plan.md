# **TEAMFLOW - Geliştirme Dökümanı v1.1**

**Kaynak:** TEAMFLOW - Ürün Gereksinim Dökümanı (PRD) v1.1 (15 Nisan 2026)  
**Hedef Platformlar:** Web (v1), Backend API (v1), iOS (ileriki fazlarda backend’i tüketir)  
**Prensip:** Frontend ve backend **ayrı** geliştirilir ve **ayrı deploy** edilir. Web, Firestore’a doğrudan erişmek yerine **Backend HTTP API** üzerinden çalışır.

---

## **A. LLM-uyumlu Execution Plan (Task Breakdown)**

Bu bölüm “plan.md”yi LLM’lerin doğrudan uygulayabileceği şekilde **sıralı**, **çıktı odaklı** ve **dosya/komut** referanslarıyla tanımlar.  
Hedef: Repo ilk kurulumundan başlayıp US.01–US.04’e kadar ilerlemek.

### **A.1. Repo yapısı (zorunlu: ayrı servis/dizin)**

- **Monorepo önerisi (tek repo, iki servis):**
  - `apps/web/` → Next.js + Tailwind frontend
  - `services/api/` → Node.js HTTP API (Firebase Admin + Firestore) *veya* `backend/functions/` → Firebase HTTP Functions
- **Neden:** iOS + web aynı API sözleşmesini tüketir; web Firestore’a direkt bağlanmaz.

**Çıktı (artifact) kriteri**
- `apps/web` ve `services/api` (veya `backend/functions`) dizinleri oluşmuş olmalı.
- Her servisin kendi `README`/run komutları olmalı.

---

### **A.2. Teknoloji seçimi (MVP için varsayılan)**

- **Frontend:** Next.js (React) + Tailwind
- **Backend:** Node.js HTTP API
  - Firebase Auth ID token doğrulama
  - Firebase Admin SDK ile Firestore erişimi
- **Not:** PRD “Cloud Functions” öneriyor; ancak “iOS da tüketsin + ayrı deploy” ihtiyacı için **bağımsız HTTP API** yaklaşımı daha taşınabilir. (İleride istenirse API, Cloud Run/Functions’a deploy edilebilir.)

---

### **A.3. Backend kurulumu (ilk adım)**

**Amaç:** iOS + web’in ortak kullanacağı API iskeleti.

**Task checklist**
- [ ] `services/api` altında Node.js projesi başlat (ör. Express/Fastify/Nest — MVP’de Express yeterli)
- [ ] `GET /health` endpoint’i: `200 { ok: true }`
- [ ] Firebase Admin entegrasyonu:
  - [ ] Firebase project/service account veya ADC (dev) ile bağlanma
  - [ ] ID token doğrulama middleware’i
- [ ] Standart hata formatı (`{ code, message, details? }`) ve request validation altyapısı
- [ ] CORS:
  - [ ] `apps/web` origin’ine izin (prod + dev)
- [ ] Env tanımı:
  - [ ] `PORT`
  - [ ] `FIREBASE_PROJECT_ID`
  - [ ] (ops.) `GOOGLE_APPLICATION_CREDENTIALS` veya secret mekanizması
- [ ] Lokal çalışma komutları:
  - [ ] `npm run dev` (veya eşdeğeri)
- [ ] Minimum smoke:
  - [ ] `/health` çalışıyor
  - [ ] Auth gerektiren endpoint 401 dönüyor (token yokken)

**Çıktı (artifact) kriteri**
- Backend lokalde ayağa kalkıyor.
- `/health` + auth middleware çalışıyor.

---

### **A.4. Frontend kurulumu (ikinci adım)**

**Amaç:** web uygulaması iskeleti + login + API client.

**Task checklist**
- [ ] `apps/web` altında Next.js projesi başlat
- [ ] Tailwind kurulumu + temel tasarım (Landing hero + login butonu)
- [ ] Firebase Web SDK ile OAuth (Google/GitHub):
  - [ ] Login sonrası Firebase **ID token** alınabiliyor
- [ ] API client:
  - [ ] `NEXT_PUBLIC_API_BASE_URL` ile backend’e istek
  - [ ] `Authorization: Bearer <token>` header otomatik ekleniyor
- [ ] Lokal çalışma komutu:
  - [ ] `npm run dev`
- [ ] Minimum smoke:
  - [ ] Login çalışıyor
  - [ ] `/health` çağrısı UI’dan yapılabiliyor (debug sayfası veya console)

**Çıktı (artifact) kriteri**
- Web lokalde ayağa kalkıyor, login oluyor, API’ya token ile istek atabiliyor.

---

### **A.5. Veri modeli & seed (MVP)**

**Amaç:** US’lerin çalışması için minimum Firestore şeması ve test verisi.

**Task checklist**
- [ ] Firestore koleksiyonları oluştur:
  - [ ] `users`
  - [ ] `opportunities`
  - [ ] `teams`
  - [ ] `applications`
- [ ] Seed yöntemi belirle (admin dashboard yok):
  - [ ] JSON seed + script (öneri) *veya* Firebase console manuel giriş (minimum)
- [ ] Minimum seed data:
  - [ ] 10 opportunity (tags dolu)
  - [ ] her opportunity için en az 1 team

**Çıktı (artifact) kriteri**
- Feed endpoint’i gerçek opportunity/team datası dönebiliyor.

---

### **A.6. US.01–US.04 uygulama sırası (önerilen)**

1. **US.01** (onboarding, skills) → feed’in ön koşulu  
2. **US.02** (feed + match score + infinite scroll)  
3. **US.03** (applications + leader decision)  
4. **US.04** (approve sonrası bildirim — MVP: e-posta)  

---

## **B. Done Definition (genel)**

Her story “Done” sayılması için aşağıdakileri sağlamalı:
- **API:** Endpoint(ler) dokümanda tanımlanan auth + error formatına uyuyor.
- **UI:** Responsive davranış (AC.02) ve temel UX akışı tamam.
- **Test:** Minimum senaryolar (story altında) manual smoke ile doğrulandı.
- **Observability (MVP):** En azından server log’larında hata kodu ve uid görünüyor.

---

## **0. Kapsam ve hedefler**

- **MVP hedefi:** Kullanıcı onboarding + feed (match score) + side-panel detay + başvuru + lider inceleme/onay + onay bildirimi (MVP’de e-posta).
- **Kapsam dışı:** Native iOS UI (bu doküman iOS’a hazırlanmak için API sözleşmesini netleştirir), gelişmiş mesajlaşma, admin dashboard (ilan/ekip seed manuel).

---

## **1. Mimari özet (Web + API ayrımı)**

### **1.1. Bileşenler**

- **Web Frontend (Next.js / React + Tailwind)**
  - Sorumluluk: UI/UX, responsive davranış (side-panel/bottom-sheet), view state, Firebase ile login olup **ID token** alma.
  - Veri erişimi: Tüm işlevler **HTTP API** ile.
- **Backend API (Firebase HTTP Cloud Functions)**
  - Sorumluluk: ID token doğrulama, yetkilendirme, veri doğrulama, iş kuralları (başvuru limiti vb.), Firestore erişimi, e-posta tetikleme.
- **Firebase**
  - **Auth:** Google/GitHub OAuth.
  - **Firestore:** veri saklama.
  - **Cloud Functions:** HTTP API + event-tetikli bildirim işleri (MVP: e-posta).

### **1.2. Deploy ayrımı**

- **Web deploy hedefi (ayrı):** Vercel / Netlify / Firebase Hosting
  - Konfig: `NEXT_PUBLIC_API_BASE_URL`
- **API deploy hedefi (ayrı):** Firebase Functions
  - Secret’lar: e-posta sağlayıcı anahtarları, domain/config vb.

---

## **2. API sözleşmesi (web + iOS ortak)**

### **2.1. Auth**

- **Header:** `Authorization: Bearer <Firebase_ID_Token>`
- Backend her request’te token’ı doğrular ve `uid` çıkarır.

### **2.2. Standart response / error**

- Başarılı:
  - `200/201` + JSON body
- Hata:
  - `4xx/5xx` + JSON:
    - `code`: string (örn. `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `LIMIT_REACHED`)
    - `message`: kullanıcıya/log’a uygun mesaj
    - `details?`: alan bazlı hata detayları

### **2.3. Pagination (infinite scroll uyumlu)**

- Cursor tabanlı:
  - Request: `?limit=20&cursor=<opaque>`
  - Response: `{ items: [...], nextCursor: string|null }`

### **2.4. Minimum endpoint seti (MVP)**

- **Profil**
  - `GET /me`
  - `PATCH /me` (skills, website_url)
- **Fırsatlar**
  - `GET /opportunities` (feed)
  - `GET /opportunities/:oppId` (detay)
- **Başvurular**
  - `POST /applications` (create)
  - `GET /applications` (kullanıcının başvuruları / liderin takım başvuruları)
  - `POST /applications/:applicationId/decision` (approve/reject)

---

## **3. Veri modeli (Firestore)**

PRD v1.1’de tanımlı koleksiyonlar: `users`, `opportunities`, `teams`. MVP için aşağıdaki ek koleksiyon önerilir.

### **3.1. `users`**

- `uid: string` (doc id)
- `displayName: string`
- `skills: string[]`
- `website_url?: string`
- `createdAt: timestamp`
- `updatedAt: timestamp`

### **3.2. `opportunities`**

- `opp_id: string` (doc id veya alan)
- `title: string`
- `tags: string[]`
- `deadline: timestamp`
- (opsiyonel) `type?: "competition"|"project"|"internship"`

### **3.3. `teams`**

- `team_id: string`
- `opp_id: string`
- `leader_id: string` (uid)
- `members: string[]` (uid list)
- (opsiyonel) `capacity: number`

### **3.4. `applications` (MVP için gerekli)**

- `application_id: string`
- `opp_id: string`
- `team_id: string`
- `applicant_id: string` (uid)
- `status: "pending"|"approved"|"rejected"|"cancelled"`
- `createdAt: timestamp`
- `updatedAt: timestamp`

### **3.5. İndeks / sorgu ihtiyaçları (özet)**

- `applications`:
  - `where(applicant_id==uid) + where(status in ["pending","approved"])` (aktif başvuru sayısı)
  - `where(team_id==teamId)` (lider ekranı)
- `opportunities`:
  - Feed sıralaması matchScore’a göre API’da yapılacağı için Firestore tarafında zorunlu bir “matchScore index” şart değil (API hesaplar).

---

## **4. Ortak UI/UX kuralları**

- **Responsive side-panel:** ≥768px sağ panel; <768px bottom-sheet. (PRD AC.02)
- **Dark/Light mode:** tasarım sistemi token’larıyla.
- **Erişilebilirlik:** modal/bottom-sheet focus trap, ESC kapatma, keyboard navigasyon.

---

## **5. User Story bazlı geliştirme planları**

### **US.01 — Profil oluşturma (Yetenek seçimi)**

**Persona:** Öğrenci  
**İstek:** Web üzerinden hızlıca yeteneklerimi seçerek profil oluşturmak istiyorum.  
**Amaç:** Uzmanlık alanıma göre görünür olmak.

#### **5.1.1. UI akışı**

- Landing → “Google/GitHub ile giriş”
- İlk giriş sonrası zorunlu **Yetenek Seçim Modalı** (PRD G.02)
  - Kategorize yetenek listesi (Frontend/Backend/AI vb.)
  - Çoklu seçim (tag/chips)
  - **Min 3 seçim** olmadan “Akışa Geç” disabled (PRD G.03)
- (Opsiyonel) Portfolyo linki alanı (website_url)

#### **5.1.2. API/Backend**

- `GET /me`
  - Kullanıcı yoksa: Auth claim’den `displayName` ile kullanıcı doc’u oluşturulabilir (first-seen provisioning) veya `PATCH /me` ile yaratılabilir.
- `PATCH /me`
  - Body: `{ skills: string[], website_url?: string }`
  - Validasyon:
    - `skills.length >= 3`
    - `skills` whitelist (MVP’de custom skill yok; v1.0 risk önlemiyle uyumlu)

#### **5.1.3. Veri & iş kuralları**

- `users/{uid}` doc’u oluştur / güncelle
- `skills` değiştiğinde `updatedAt` setlenir

#### **5.1.4. Edge-case’ler**

- Kullanıcı modalı kapatırsa: feed’e geçiş yok (blocking flow)
- Aynı skill tekrar seçilemez (dedupe)
- Token süresi dolarsa: 401 → yeniden login

#### **5.1.5. Acceptance check**

- PRD G.03: Min 3 seçim olmadan akışa geçiş yok.

#### **5.1.6. Test planı (minimum)**

- Login sonrası modal otomatik açılıyor mu?
- 0/1/2 skill seçiliyken CTA disabled mı?
- 3 skill seçince `PATCH /me` başarılı ve feed’e yönleniyor mu?

#### **5.1.7. Done checklist (LLM için)**

- [ ] Web: Login sonrası zorunlu skill modal açılıyor
- [ ] Web: Min 3 skill olmadan CTA disabled
- [ ] API: `PATCH /me` skills whitelist + min 3 validation yapıyor
- [ ] DB: `users/{uid}` güncelleniyor (`skills`, `updatedAt`)
- [ ] Smoke: logout/login sonrası skills kalıcı

---

### **US.02 — Feed’de eşleşme oranı ile fırsatları görmek**

**Persona:** Öğrenci  
**İstek:** Ana sayfada yeteneklerime en uygun projeleri “Eşleşme Oranı” ile görmek istiyorum.  
**Amaç:** Manuel arama yapmadan uygun fırsata odaklanmak.

#### **5.2.1. UI akışı**

- Dashboard / Feed ekranı (PRD E3)
  - Sol: filtre paneli (MVP: temel filtreler; ileri filtreler iterasyon)
  - Orta: kartlar (match % badge)
  - Üst: Grid/List toggle (PRD G.05)
  - Infinite scroll (PRD G.06)
- Kart tıklama → side-panel/bottom-sheet (US.02’den US.03’e/Apply akışına bağlanır)

#### **5.2.2. Match score hesabı (backend tek kaynak)**

- Input:
  - `userSkills: string[]` (users.skills)
  - `oppTags: string[]` (opportunities.tags)
- Çıktı: yüzde
  - Öneri: `match = round(100 * |intersection(userSkills, oppTags)| / |oppTags| )`
  - Eğer `oppTags` boşsa: `match=0`

#### **5.2.3. API/Backend**

- `GET /opportunities?limit&cursor&filters...`
  - Response item alanları:
    - `oppId, title, tags, deadline, matchScore`
- Sıralama:
  - `matchScore desc`, sonra `deadline asc` (tie-breaker öneri)

#### **5.2.4. Veri & iş kuralları**

- Kullanıcının `skills` yoksa:
  - 422 veya 200 + `matchScore=0` (MVP’de yönlendirme tercih edilir: “skills seçmeden feed yok”)

#### **5.2.5. Edge-case’ler**

- Çok hızlı scroll → aynı cursor’un tekrar çağrılması (frontend debouncing/locking)
- Deadline geçmiş ilanlar:
  - MVP’de liste dışı bırakma veya “closed” etiketi (karar: MVP’de liste dışı)

#### **5.2.6. Acceptance check**

- PRD AC.01: Intersection bazlı skor UI’da yüzde olarak render.

#### **5.2.7. Test planı (minimum)**

- Aynı kullanıcı için matchScore deterministik mi?
- Infinite scroll’da tekrar eden item var mı?
- Grid/List toggle görsel olarak doğru mu?

#### **5.2.8. Done checklist (LLM için)**

- [ ] API: `GET /opportunities` cursor pagination döndürüyor (`items`, `nextCursor`)
- [ ] API: matchScore hesaplanıyor ve sıralama `matchScore desc` ile geliyor
- [ ] Web: Grid/List toggle çalışıyor
- [ ] Web: Infinite scroll “double fetch” yapmıyor (lock/debounce)
- [ ] Web: Side-panel/bottom-sheet açılıyor (AC.02)

---

### **US.03 — Liderin başvuranları incelemesi**

**Persona:** Ekip Lideri  
**İstek:** Başvuranların yetenek setlerini ve portfolyolarını web panelinde incelemek istiyorum.  
**Amaç:** En uygun profili seçmek.

#### **5.3.1. UI akışı**

- Side-panel içinde “Ekipler” listesi + “Katıl” (PRD G.08–G.09)
- Lider rolü için ayrıca “Başvurular” görünümü:
  - Takıma gelen başvurular listesi
  - Başvuran detay: skills + website_url
  - Aksiyon: Approve / Reject

#### **5.3.2. API/Backend**

- `GET /applications?teamId=<teamId>&status=pending`
  - Yetkilendirme: token uid == team.leader_id
  - Response: applicant profili özetini de içerebilir (join):
    - `{ applicationId, applicant: { uid, displayName, skills, website_url }, createdAt }`
- `POST /applications/:applicationId/decision`
  - Body: `{ decision: "approve"|"reject" }`
  - Kurallar:
    - Sadece lider karar verebilir
    - Status sadece `pending -> approved/rejected`
    - Approve olunca:
      - `teams.members` güncellenir (capacity kontrolü)
      - Application status `approved`

#### **5.3.3. Veri & iş kuralları**

- **Kapasite/çakışma**:
  - Son kontenjan için yarış durumunda transaction gerekli (v1.0 risk önlemiyle uyumlu)
- Üye zaten ekibe dahilse tekrar approve edilemez.

#### **5.3.4. Edge-case’ler**

- Lider aynı başvuruya iki kez karar verirse → idempotent hata veya no-op
- Takım doluysa approve disabled + anlamlı hata kodu

#### **5.3.5. Test planı (minimum)**

- Lider olmayan kullanıcı `GET /applications?teamId=` çağırınca 403 alıyor mu?
- Approve → team.members artıyor mu?
- Capacity doluyken approve → doğru hata mı?

#### **5.3.6. Done checklist (LLM için)**

- [ ] API: `POST /applications` ile pending başvuru yaratılabiliyor
- [ ] API: Aktif başvuru limiti (3) enforce ediliyor (AC.03)
- [ ] API: Leader `GET /applications?teamId=...` pending liste görüyor, non-leader 403
- [ ] API: `decision=approve` → `applications.status=approved` + `teams.members` güncelleniyor (transaction)
- [ ] Web: “Katıl” butonu limit doluyken disabled + tooltip “Limit Dolu”

---

### **US.04 — Başvuru onayı bildirimi**

**Persona:** Kullanıcı  
**İstek:** Başvurum onaylandığında tarayıcı bildirimi veya e-posta ile haberdar olmak istiyorum.  
**Amaç:** Süreçten kopmamak ve aksiyon almak.

#### **5.4.1. MVP yaklaşımı**

- MVP’de **e-posta** (tarayıcı push izinleri ve kurulum maliyeti daha yüksek).
- Web notification/push: ileriki faz (opsiyonel).

#### **5.4.2. Tetikleyici**

- `POST /applications/:applicationId/decision` içinde decision=approve olduğunda:
  - E-posta gönder
  - (Opsiyonel) `notifications` doc’u yaz (in-app notification için)

#### **5.4.3. API/Backend**

- E-posta sağlayıcı entegrasyonu (SendGrid/Mailgun vb. – seçim implementasyon fazında)
- Şablon:
  - İlan adı, ekip adı, lider adı, aksiyon linki (web’e yönlendirme)

#### **5.4.4. Edge-case’ler**

- E-posta sağlayıcı hatası:
  - Başvuru onayı geri alınmaz; bildirim retry kuyruğu (MVP’de basit retry/log)
- Kullanıcı e-posta bilgisi yoksa:
  - Firebase Auth email claim’den alınır; yoksa notification skip + log

#### **5.4.5. Acceptance check**

- PRD US.04: Onay sonrası e-posta ile haberdar olma (MVP).

#### **5.4.6. Test planı (minimum)**

- Approve sonrası e-posta tetikleniyor mu? (dev/staging ortamında)
- E-posta başarısız olsa bile application status doğru mu kalıyor?

#### **5.4.7. Done checklist (LLM için)**

- [ ] Approve aksiyonu sonrası e-posta tetikleniyor (MVP)
- [ ] E-posta hatasında retry/log mevcut (minimum)
- [ ] Notification başarısız olsa bile application status bozulmuyor

---

## **6. PRD Acceptance kriterleri doğrulama matrisi (özet)**

- **AC.01 (Match score):** US.02’de backend intersection hesaplar, UI’da yüzde render edilir.
- **AC.02 (Responsive panel):** Ortak UI/UX kuralları + US.02/Side-panel akışı.
- **AC.03 (Başvuru limiti):**
  - Backend: aktif `pending` başvuru sayısı >=3 ise `POST /applications` reddedilir (`LIMIT_REACHED`)
  - Frontend: “Katıl” disabled + tooltip “Limit Dolu”

---

## **7. Minimum uçtan uca test senaryosu (smoke)**

1. Login (Google/GitHub) → skill modal (min 3) → feed
2. Feed’de match % görünür, grid/list değişir, infinite scroll çalışır
3. İlan seç → panel açılır → “Katıl” → application pending
4. Lider pending başvuruyu görür → approve
5. Başvuran e-posta bildirimi alır (MVP)

