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

### 11) UI/UX, Takim Merkezi ve Premium Karanlık Tema Geliştirmeleri

- **Süper Koyu Mod (Premium Dark Mode):** 
  - Uygulama genelindeki arka plan rengi `html.dark` değişkenleri ile saf siyaha (`#000000`) çevrildi.
  - Sabit `bg-white` sınıfları yerine CSS `var(--surface)` kullanılarak açık/koyu modlar arası sorunsuz geçiş sağlandı.
  - Kart ve panellerin koyu modda uyumsuz olan kenarlıkları (`border-slate-200`) `dark:border-white/10` ile yumuşatıldı.
- **Karanlık Tema Kalıcılık ve Senkronizasyon Hata Giderimleri:**
  - `ThemeToggle` adında ortak bir bileşen (component) oluşturuldu ve tüm sayfalardaki (Profil, Feed, Lider Paneli) gezinme çubuklarına yerleştirildi.
  - Sayfa yenilendiğinde oluşan parlama (FOUC) hatası, `app/layout.tsx` içine yerleştirilen küçük bir yükleme-öncesi script ile çözüldü.
  - Aynı tarayıcıdaki farklı sekmeler (tabs) arası tema geçişi `StorageEvent` (localStorage dinleyicisi) ile canlı olarak senkronize edildi.
- **Yenilenmiş Takım Merkezi (Ekiplerim):**
  - Profil sayfasındaki `MyTeamsManager` bileşeni "Ekiplerim" ana çerçevesine alındı.
  - Akordeon (açılır-kapanır) mantığı eklendi ve varsayılan olarak tüm takımların kapalı tutulabilmesi sağlandı.
  - Takım detayları İkili Panel Layout'una geçirildi: Sol tarafta takım üyeleri (yalnızca lider manuel olarak Profile ID ile ekleyip çıkarabilir), sağ tarafta gerçek zamanlı `localStorage` tabanlı ekip sohbet odası konumlandırıldı.
- **Bildirim ve Başvuru Yönetimi (Silme İşlemleri):**
  - `lib/notifications.ts` içerisine `deleteNotification(id)` fonksiyonu eklendi.
  - `NotificationBell` (Bildirim Zili) menüsündeki her bir bildirim öğesinin yanına kırmızı 'X' (Sil) butonu eklendi.
  - Lider paneli `SwipeableApplicationRow` yapısındaki kaydırma özelliğine ek olarak, kullanım kolaylığı için satır sonuna görünür bir 'X' (Sil) butonu yerleştirildi.

### 12) Fırsat Akışı Arama ve Yetenek Görünüm Düzeltmeleri

- **Yetenek Etiketleri Renk Yönetimi (Koyu Mod Düzeltmesi):**
  - Tailwind v4'ün `@custom-variant` gereksiniminden doğan koyu mod hatalarını kökünden çözmek için, `SkillTagPicker` ve yetenek rozetleri tamamen CSS Değişkenlerine (`--skill-tag-bg`, `--skill-tag-border` vb.) taşındı.
  - Bu sayede seçili olmayan yetenek butonlarının içi beyaz/okunaksız kalma hatası, işletim sistemi temasından bağımsız olarak tamamen düzeltildi.
- **Fırsat Akışı Arama Çubuğu (Search Bar):**
  - Fırsat Akışı (`/feed`) sayfasına büyüteç ikonlu açılır kapanır bir arama çubuğu eklendi.
  - Aramalar eşzamanlı olarak Fırsat Başlığı, Şirket Adı ve Etiketlerde (Tags) filtreleme yapıyor.
  - Klasik `toLowerCase` yerine `toLocaleLowerCase('tr-TR')` kullanılarak büyük/küçük harf (case-insensitive) aramalarında yaşanan "I/ı", "İ/i" Türkçe karakter sorunları çözüldü. Boş şirket (`company: undefined`) alanlarında yaşanan çökme (crash) için güvenli (fallback) kontroller eklendi.

### 13) Yeni Modallar, Takım Detayları ve Backend Düzenlemeleri

- **Backend Dosya Yapısı:** `backend/api` altındaki dosyalar direkt olarak `backend/` ana dizinine taşınarak proje yapısı sadeleştirildi.
- **Fırsat ve Takım Oluşturma Modalları:**
  - Kullanıcıların yeni fırsat/ilan oluşturması için `CreateOpportunityModal` bileşeni eklendi.
  - Takım oluşturmak için `CreateTeamModal` bileşeni eklendi.
  - Yeni oluşturulan fırsatların `localStorage` (`teamflow_custom_opportunities`) kullanılarak tarayıcıda saklanması ve mevcut statik fırsatlarla (`OPPORTUNITIES`) dinamik olarak birleştirilmesi sağlandı.
- **Profil Önizleme (Lider Paneli):**
  - Liderlerin başvuranları daha hızlı değerlendirebilmesi için `ProfilePreviewModal` eklendi.
  - `/lider/basvurular` sayfasındaki tabloya tıklayarak başvuranın yeteneklerinin ve isminin hızlıca incelenebilmesi sağlandı.
- **Veri Modeli ve Demo Akışı İyileştirmeleri:**
  - `opportunities-data.ts` içindeki `Team` tipi detaylandırıldı (`description`, `membersMax`, `rolesNeeded`, `technologies`, `level`, `communication` gibi özellikler eklendi).
  - Profil sayfasında gösterilen başvuru demo verileri (örn: mock `score: 85`) zenginleştirilerek daha gerçekçi bir görünüm sunuldu. "Demo kullanici" etkileşimleri iyileştirildi.

### 14) PostgreSQL Veritabanı Geçişi ve SOA (Service-Oriented Architecture) Refaktörü

- **PostgreSQL Geçişi:**
  - Proje, Firestore (`firebase-admin`) altyapısından yerel PostgreSQL veritabanı altyapısına (`teamflow_db`) taşındı.
  - Bağımlılıklar güncellenerek `pg` ve `dotenv` modülleri projeye eklendi; `db.js` bağlantı modülü oluşturuldu.
  - Veritabanı tablolarını (Kullanıcılar, Fırsatlar, Takımlar, Başvurular, Mesajlar, Bildirimler vb.) `UUID` tipleriyle sıfırdan oluşturan `init-db.js` scripti yazılıp çalıştırıldı.
- **Backend Servis Odaklı Mimari (SOA) Refaktörü:**
  - Yaklaşık 1200 satırlık hantal `server.js` dosyası temizlenerek kod yönetilebilir ve ölçeklenebilir parçalara ayrıldı.
  - Yeni bir klasör mimarisi oluşturuldu: API uç noktaları için `routes/`, veritabanı ile konuşan iş mantıkları (business logic) için `services/`, JWT kontrolü için `middlewares/` ve yardımcı fonksiyonlar için `utils/`.
  - Tüm özellikler (Auth, Profile, Opportunity, Team, Application, Chat, Notification) kendi bağımsız `router` ve `service` dosyalarına başarıyla taşındı. Eski `server.js` yalnızca bu modülleri ayağa kaldıran 60 satırlık basit bir yönlendiriciye (entry point) dönüştürüldü.
- **YENİ: Takım İlerleme (Progress & Milestone) Takibi Sistemi:**
  - SOA geçişine ek olarak, takımların proje gelişimlerini takip edebilecekleri yeni bir özellik eklendi.
  - `init-db.js` güncellenerek `team_milestones` (Aşamalar) ve `team_tasks` (Görevler) adında 2 yeni SQL tablosu oluşturuldu.
  - `progress_service.js` ve `progress_routes.js` oluşturularak; aşama ekleme, görev ekleme ve bu görevlerin tamamlanma durumlarına göre takımın % kaç ilerlediğini dinamik hesaplayan bir backend modülü sisteme eklendi.

### 15) Kapsamlı Sistem QA (Kalite Güvencesi) ve Optimizasyonlar

- **Veritabanı Performans Optimizasyonları (PostgreSQL):**
  - Tablo büyümelerinde yaşanabilecek sorgu yavaşlamalarını önlemek için `init-db.js` içine stratejik indeksler (`CREATE INDEX`) eklendi.
  - `opportunities(author_id)`, `teams(opp_id, leader_id)`, `applications(opp_id, applicant_id)` gibi sık kullanılan foreign key'ler üzerinden arama performansları artırıldı.
- **Backend Güvenlik Yaması:**
  - `matchmaking_routes.js` üzerinden çalışan Yapay Zeka entegrasyonu dış dünyaya açıktı. Buraya `authMiddleware` eklenerek sadece geçerli JWT oturumu olan kullanıcıların yapay zekayı tetikleyebilmesi sağlandı.
- **Frontend State Senkronizasyonu (Cleanup):**
  - "Demo Modu" ile uygulamayı test eden kullanıcıların, kendi gerçek hesaplarına giriş (`/login`) yaptıklarında eski demo verilerinin (örn. `teamflow_demo_profile`, `teamflow_apps_frontend`) tarayıcıda kalarak uygulamayı bozması sorunu çözüldü. Gerçek login başarılı olduğunda tüm demo localStorage anahtarları temizleniyor.

### 16) Kullanıcı Deneyimi (UX) ve Arayüz Geliştirmeleri

- **İlan Detayları Açılır Penceresi (Modal):**
  - Profil sayfasındaki **Başvurularım** listesinde yer alan "Detaylar" butonunun davranışı değiştirildi.
  - Artık kullanıcıyı doğrudan `/feed` sayfasına atmak yerine, ilanın tam açıklamasını, lider bilgisini ve başvuru durumunu gösteren şık bir Modal (Pencere) açılıyor.
  - Başvuru onaylanmışsa, bu pencereden "Sohbete Git" butonuyla direkt Ekiplerim altındaki ilgili sohbet ekranına geçiş sağlanıyor.
- **Takım Kurucu Liderlik Akışı ("Senin Takımın" ve "Kaptanı Olduğum Takımlar"):**
  - Kullanıcı yeni bir takım ilan oluşturduğunda (CreateOpportunityModal) artık ilan sahibi olarak kendi profili atanıyor ve varsayılan olarak takımın lideri (1. kişi) olarak kaydediliyor.
  - Ekiplerim (MyTeamsManager) bölümüne **"Kaptanı Olduğum Takımlar"** adında özel bir hızlı erişim başlığı eklendi. Burada listelenen takım isimlerine tıklandığında sayfa otomatik olarak (smooth scroll) o akordeona kayıyor.
  - Fırsat Akışı'nda (Feed) kullanıcı kendi kurduğu bir ilanı gördüğünde "Takıma Katıl" butonu yerine yeşil renkli **"Senin Takımın"** butonu çıkıyor ve kendi takımına tekrar başvurması engellenerek direkt Profil sayfasına yönlendiriliyor.

### 17) Yapay Zeka Destekli Takım Eşleştirme (Matchmaking API)
- `backend/routes/matchmaking_routes.js` dosyası oluşturuldu/güncellendi.
- **OpenRouter (Gemma-4-31b-it)** entegrasyonu sağlandı ve test edildi.
- Kullanıcıların veri tabanındaki yeteneklerine (`skills`) göre arama yapılıp, adayları tek seferde otomatik davet etmek yerine **"Aday Listeleme ve Seçmeli Davet"** (Manuel Kontrol) modeline geçildi.
- Kullanıcıların listedeki adayların yeteneklerini ve **takım geçmişlerini** görüntüleyebileceği "Detay" modülü eklendi.
- Sadece seçilen ve onaylanan kişilere özel, yapay zeka tarafından (takım adını ve aranan yeteneği içeren) özgün davet metinleri oluşturulup yollanması sağlandı.

### 18) Frontend React Key Hatalarının Giderilmesi
- `frontend/src/app/feed/page.tsx` ve `frontend/src/app/profil/page.tsx` ile `frontend/src/components/MyTeamsManager.tsx` sayfalarında karşılaşılan "Encountered two children with the same key" hataları düzeltildi.
- Map döngülerindeki elemanlara eşsiz (unique) React key'leri (örn: `key={`${skill}-${index}`}`) atanarak arayüz çökmeleri engellendi.

### 19) Kullanıcı Arayüzü (UI) Bildirim Sistemi ve Takıma Katılım
- Sağ üst köşedeki **NotificationBell (Bildirim Zili)** bileşeni tamamen baştan kurgulalandı.
- Davet mesajlarının altına **"Daveti Kabul Et ve Takıma Katıl"** butonu eklendi.
- "Kabul Et" butonuna basıldığında çalışan **`POST /applications/accept-invite`** endpoint'i backend tarafında yazıldı. Bu endpoint kişiyi doğrudan takımın `team_members` listesine ve `applications` tablosuna 'Onaylandi' durumu ile işliyor.
- Gelen davet mesajlarının hemen yanına **"Detay"** butonu entegre edildi. Bu sayede davet eden takımın adı, proje ismi ve kurucusu daveti kabul etmeden önce incelenebilir hale geldi.
- Bildirimleri kalıcı olarak silebilmek için **"Sil" (Çöp Kutusu)** butonu eklendi.

### 20) Gelişmiş Demo Modu (İzole Edilmiş Simülasyon)
- "Demo Modu"nda bildirimlerin herkese ortak gitmesi (havuz problemi) çözüldü. Artık her demo profilinin (Frontend, Backend, Yapay Zeka Uzmanı) kendine ait **izole bir bildirim veritabanı** (`teamflow_demo_notifications_profileName`) bulunuyor.
- Eğer Frontend Uzmanıysanız ve Backend Uzmanı'nı takımınıza yapay zeka ile davet ederseniz, bu bildirim sizin ekranınıza düşmüyor; tam olarak hedef kişiye gidiyor. Onaylamak için onun hesabına girip denemeniz gerekiyor (gerçek kullanıcı simülasyonu sağlandı).
- Arama ekranında sahte/rastgele isimler yerine doğrudan diğer **Demo Profilleri** sahte yeteneklerle gösterilerek deneyimin bütünlüğü artırıldı.

### 21) Proje Yapılandırması ve Güvenlik (Çevre Değişkenleri)
- Projenin kök dizinine **`env-templates`** adında bir klasör oluşturuldu.
- Gerçek şifrelerin ve API anahtarlarının ifşa olmasını engellemek adına proje yapılandırması için referans teşkil eden `.env.example` klasörü oluşturularak içerisine `backend.env.example` ve `frontend.env.example` şablonları eklendi.
