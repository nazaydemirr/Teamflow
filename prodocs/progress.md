# Progress Log — Teamflow (Current)

Bu dosya, chat içinde bugune kadar yapilan kod degisikliklerini ve teknik kararlarini guncel olarak ozetler.

---

## Guncel teknik yaklasim

- **Web stack:** Next.js App Router (`apps/web`) + Tailwind v4.
- **Tasarim sistemi uyumu:** `design-system.md` baz alinarak renk tokenlari, radius, motion ve tipografi CSS variable olarak kullaniliyor.
- **Auth stratejisi (gecici + kalici):**
  - Kalici hedef: Firebase Auth (Google / Email-Password) + Firestore profil verisi.
  - Gecici calisan yol: Firebase env eksik oldugunda demo form girisi ile profile erisim.
- **Profil verisi:** Firestore `users/{uid}` dokumani okunuyor; alan yoksa sayfa bossa-gorunum (empty state) ile aciliyor, otomatik mock data basilmiyor.

---

## Tamamlanan degisiklikler

### 1) Login sayfasi yeniden yazildi (`apps/web/src/app/page.tsx`)

- Bootstrap test ekrani kaldirildi, urun login UI eklendi:
  - E-posta/Kullanici adi
  - Sifre
  - Beni hatirla
  - Sifremi unuttum
  - Kaydol
  - Google ve GitHub social butonlari
  - Form validasyon + hata mesajlari
- Basarili login akisi `/profil` yonlendirmesi ile calisiyor.
- Varsayilan demo credential eklendi:
  - `demo@teamflow.com`
  - `demo123`
- Form login su an kontrollu demo modunda:
  - Sadece demo credential ile gecis izni var.
- Google login icin:
  - `signInWithPopup`
  - popup engellenirse `signInWithRedirect` fallback
  - auth hata kodlarini ekranda gosteren hata yonetimi
- Firebase env eksikse login sayfasi eksik degiskenleri acik yazar.

### 2) Profil sayfasi eklendi ve dinamiklestirildi (`apps/web/src/app/profil/page.tsx`)

- Yeni route: `/profil`
- Layout:
  - Header/nav
  - Kullanici ozeti
  - Yetenekler
  - Basvurular
  - Ekipler
  - Son aktivite
- Firebase Auth + Firestore baglantisi eklendi:
  - `onAuthStateChanged` ile session takibi
  - `users/{uid}` dokumanindan profil alanlari okunuyor
- Guvenlik/dayaniklilik:
  - Loading ekrani
  - `user?.` optional chaining kullanimi
  - `photoURL` yoksa varsayilan avatar (initials)
  - giris yoksa login yonlendirmesi
- Demo erisim:
  - `teamflow_demo_auth` localStorage flag ile demo form girisinden sonra profile erisim
  - demo flag okunmadan redirect calismamasi icin race-condition fix uygulandi (`isDemoSessionChecked`)
- Onemli urun karari:
  - Profilde otomatik mock icerik kaldirildi.
  - Veri yoksa "henuz secim yapilmadi" empty-state mesajlari gosteriliyor.

### 3) Firebase client katmani guncellendi

- `apps/web/src/lib/firebase.ts`
  - `auth` yanina `db` (`getFirestore`) export edildi.

### 4) Global stil ve tipografi guncellendi

- `apps/web/src/app/globals.css`
  - Flow tokenlari (`--flow-blue`, `--text-navy`, `--text-slate`, `--error-red`, radius/motion) eklendi.
- `apps/web/src/app/layout.tsx`
  - Fontlar `DM Sans` + `Fraunces` yapildi.
  - metadata Teamflow login odakli guncellendi.

### 5) Env ornek dosyasi

- `apps/web/.env.local.example` eklendi/guncellendi:
  - `NEXT_PUBLIC_API_BASE_URL`
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`

### 6) Feed API — imlecbazli sayfalama (`services/api/server.js`)

- `GET /opportunities` eklendi; plan.md ile uyumlu sozlesme:
  - Istek: `?limit=` (varsayilan 4, ust sinir 20), `?cursor=` (bir sonraki kayit dizini; bos ise bastan).
  - Yanit: `{ items: [...], nextCursor: string | null }`.
- Feed icin ornek ilan datasi sabit dizide (`OPPORTUNITIES`, 12 kayit MVP) tutuluyor; ileride Firestore ile degistirilebilir.

### 7) Feed — sonsuz kaydirma hook’u (`apps/web/src/hooks/useOpportunitiesFeed.ts`)

- `apiGet` ile `/opportunities` cagrisi; `nextCursor` ile sayfa sayfa birlestirme.
- Scroll yaklasik `%80` veya viewport kisa ise otomatik `loadMore`; `fetchLockedRef` ile cift istek onleme (`isLoading`/kilit).
- Durumlar: `initialLoading`, `loadingMore`, `loadError`, `retry`.

### 8) Feed sayfasi — filtre paneli (`apps/web/src/app/feed/page.tsx`)

- Masaustu (`lg`): sol sticky filtre kolonu.
- Mobil (`<768px`): "Filtrele" ile acilan bottom-sheet (`z-40`); mevcut filtre UX korunuyor.
- **Kategoriler (yarisma tipi):** TEKNOFEST, Hackathon, Bitirme Projesi, Staj — checkbox.
- **Teknoloji:** coklu secim `<select multiple>` (React, Python, AI, Next.js, Node.js, Firebase).
- **Tarih hizli filtreleri:** Son 1 hafta, Bu ay, Deadline yaklasanlar.
- **Temizle** butonu tum filtre state’ini sifirlar.
- Filtre mantigi istemci tarafinda (`inferCategory`, deadline parse); kart listesi filtrelenmis veri ile render edilir.

### 9) Feed sayfasi — side-panel, URL ve kart gorunumu (`apps/web/src/app/feed/page.tsx`)

- **`selectedOppId`:** `useLayoutEffect` ile `searchParams.get("oppId")` ile senkron; kart tiklamada ayrica `setSelectedOppId` + `router.push('/feed?oppId=...')` (geri tusuyla kapanabilir ek history).
- Panel kapatma / gecersiz `oppId` temizligi: `router.replace('/feed')`; Escape ve backdrop ile kapatma.
- **Responsive (AC.02):** `md` (>=768px) sabit saga kayan cekmece (`translate-x` + transition); `<768px` detay icin ayri bottom-sheet + karartma (`z-[45]`, filter sheet ustunde).
- Icerik: `OpportunitySidePanelBody` ortak bilesen; ucuncu kolon yerine overlay modeli; ana grid **`lg:grid-cols-[240px_1fr]`** (filtre + aks).
- `useSearchParams` icin ust seviye **`Suspense`** + **`FeedSkeletonHeader`** fallback.
- Tasarim: kart listesi **`gap-6`**, kartlarda **`shadow-md`** (hover golge korunuyor).

---

## Alinan teknik kararlar (ozet)

- **UI once gercek akis:** login ve profil ekranlari once urun akisina gore kuruldu, test/bootstrap ekranlari kaldirildi.
- **Fail-safe auth UX:** Firebase eksikliginde hata kodu/eksik env alanlarini net gosteren mesajlar eklendi.
- **Empty-state odakli profil:** kullanici secimleri gelmeden sistemin ornek veri doldurmasi engellendi.
- **Null-safe erisim standardi:** Auth user verilerinde optional chaining ve fallback avatar zorunlu hale getirildi.
- **Kademeli gecis karari:** Google login calisana kadar demo giris korunuyor; uretimde kapatilabilir.
- **Feed veri katmani:** liste `NEXT_PUBLIC_API_BASE_URL` (`apiGet`) uzerinden cekilir; feed deneyimi icin API’nin `/opportunities` endpoint’inin ayakta olmasi beklenir.
- **Deep link davranisi:** `?oppId=` tam listede (`opportunities`) cozumlunur; filtreler karti gizlese bile paylasilan link ile detay paneli acilabilir.
- **Gecmis yonetimi:** kart secimi `push`, panel kapatma / gecersiz id `replace` ile dengelenerek geri tus deneyimi ve adres cubugu tutarliligi korunuyor.

---

## Dogrulama durumu

- Son degisiklikler boyunca `apps/web` icinde tekrarli olarak `npm run lint` calistirildi.
- Feed degisiklikleri sonrasi `npx tsc --noEmit` (web) ile tip kontrolu yapildi.
- Guncel durumda lint hatasi bulunmuyor.

---

## Guncel blokajlar / riskler

- Google login icin yerel ortamda Firebase env alanlari hala eksik olabilir (`.env.local` zorunlu).
- Firebase Console tarafinda su ayarlar dogru olmali:
  - Authentication > Sign-in method > Google: Enabled
  - Authentication > Settings > Authorized domains: `localhost`
- Demo login acik oldugu icin bu gecici davranisin production oncesi kapatilmasi gerekecek.

---

## Sonraki adimlar

- Profilde kullanicinin secim yapabilecegi gercek form/modallerin eklenmesi (yetenek, ekip, basvuru tercihi).
- Firestore write akisi: `updateDoc/setDoc` ile profil duzenleme.
- Form logini demo moddan cikarip gercek Firebase `signInWithEmailAndPassword` akisina tasima.
- `/opportunities` API’nin Firestore + `cursor` ile uretim modeline baglanmasi; filtreler icin opsiyonel `query` parametreleri ve URL’de filtre kaliciligi.

### 10) PRD v1.1 kapsami — web MVP tamamlama (ozet)

- **Landing (PRD E1):** `/` kahraman blok + “Ekibini kur…” metni; Google / GitHub girisleri; popup engeli icin `getRedirectResult` ile redirect tamamlama; giris sonrasi onboarding veya `/feed`.
- **Onboarding / yetenek (G.02–G.03):** `/onboarding` sayfasi (`SkillTagPicker`, kategorize etiketler); minimum 3 yetenek ile “Akisa gec”; `localStorage` + (Firebase varsa) `users.skills` `setDoc` merge.
- **Feed (G.04–G.06, AC.01):** `intersectionMatchPercent` ile liste ve panelde yeniden hesaplanan eslesme; filtre sonrasi sirali liste; onboarding kapisı (`teamflow_user_skills_v1` < 3 ise `oppId` koruyarak onboarding return URL).
- **Side-panel katilim (G.08–G.09, AC.03):** `teamflow_applications_v1` uzerinden basvuru; 3 aktif basvuru (Beklemede+Onaylandi) iken Katil kapali + `title` ile “Limit Dolu”; bildirim `Notification` ile (PRD US.04 parcasi, izin ile).
- **Lider paneli (US.03 MVP):** `/lider/basvurular` tablo gorunumu; basvuru onay/red + onay bildirimi.
- **Profil:** `skillList[]` Firestore uyumu + modal ile yetenek duzenleme; `teamflow-theme` ile `html.dark`; `/feed`, lider route linkleri.
- **Placeholder rotalar:** `/register`, `/forgot-password`.

**Yeni / guncellenen dosyalar (web):**
`src/lib/skills-catalog.ts`, `match-score.ts`, `user-skills.ts`, `applications.ts`, `src/hooks/useUserSkills.ts`, `useApplications.ts`, `components/SkillTagPicker.tsx`, `app/onboarding/page.tsx`, `app/lider/basvurular/page.tsx`, `app/register/page.tsx`, `app/forgot-password/page.tsx`, `app/page.tsx`, `app/profil/page.tsx`, `app/feed/page.tsx`, `globals.css`, `layout.tsx`.

**Sinir:** Gercek e-posta/Katil yazimi Firestore’a production API ile baglaninca kalici backend dogrulanir; MVP’de katilim ve lider aksiyonlari tarayicide saklanır.

