# Teamflow - Teknoloji Yığını ve Mimari Kararlar (Tech Stack)

Bu doküman, Teamflow projesinde kullanılan temel teknolojileri, mimari seçimlerin arkasındaki teknik gerekçeleri ve geliştirme süreci boyunca Yapay Zeka (AI) destekli araçların projeye entegrasyonunu detaylandırmaktadır.

## 1. Kullanılan Teknolojiler

### Frontend (İstemci Tarafı)
- **Çatı (Framework):** React.js ve Next.js (App Router)
- **Dil:** TypeScript
- **Stillendirme:** Tailwind CSS ve CSS Değişkenleri
- **State Yönetimi:** React Context ve Local Storage (Demo oturumları için)

### Backend (Sunucu Tarafı)
- **Çalışma Ortamı:** Node.js
- **Çatı:** Express.js
- **Veritabanı:** PostgreSQL (pg modülü ile)
- **Kimlik Doğrulama:** JWT (JSON Web Tokens) tabanlı yetkilendirme
- **API Belgelendirme:** Swagger (JSDoc entegrasyonu ile)

### Yapay Zeka (AI Core)
- **Dil Modeli API'si:** OpenRouter API
- **Kullanılan Model:** `google/gemma-4-31b-it:free` (Takım arkadaşı eşleştirme ve otomatik davet metinleri oluşturma için)

---

## 2. Servis Seçimlerinin Gerekçeleri

### Neden Next.js?
Teamflow, etkileşimi yüksek bir platform olduğu için istemci tarafında hızlı bir deneyim ve bileşen bazlı mimari sunan React tercih edilmiştir. Next.js, App Router yapısı sayesinde dosya bazlı yönlendirme (file-based routing) kolaylığı sağlaması ve modern web standartlarına uyumu sebebiyle temel çatı olarak kullanılmıştır.

### Neden PostgreSQL?
Platformda kullanıcılar, takımlar, başvurular, bildirimler ve yetenekler arası çok yönlü ve kuralcı ilişkiler bulunmaktadır (Örn: Liderlik limitleri, aktif başvuru kotaları). Bu karmaşık ilişkileri veri bütünlüğünden ödün vermeden güvenli bir şekilde yönetebilmek için güçlü bir ilişkisel veritabanı olan PostgreSQL tercih edilmiştir.

### Neden Tailwind CSS?
Tasarım standartlarını hızlı bir şekilde uygulayabilmek ve modern UI/UX beklentilerini karşılayan (koyu tema uyumlu, interaktif) arayüzler çıkarabilmek için Tailwind CSS seçilmiştir. CSS değişkenleriyle desteklenerek projenin kendi renk temasına uyarlanmıştır.

### Neden OpenRouter & Gemma AI?
Kullanıcılara otomatik davet mesajı oluşturma aşamasında esnek ve hızlı bir yapay zeka modeline ihtiyaç duyulmuştur. OpenRouter, tek bir API üzerinden sayısız modele erişim sağlar. `google/gemma-4-31b-it:free` modeli, hızlı yanıt süreleri ve başarılı Türkçe dil kavrama yeteneği sayesinde "Takım Kurma Asistanı" rolünde kullanılmıştır.

---

## 3. Geliştirme Sürecinde AI (Yapay Zeka) Kullanımı

Teamflow projesinin inşa edilmesi ve özelliklerinin genişletilmesi sürecinde Yapay Zeka (Antigravity IDE ajanları) aktif bir 'Pair Programmer' (Eşli Programcı) olarak rol almıştır.

### AI'ın Geliştirme Sürecine Katkıları:
1. **Mimari Kurulum:** Frontend ve Backend klasör yapılarının planlanması, veritabanı SQL şemalarının (kullanıcılar, bildirimler, başvurular vb.) ve API uç noktalarının oluşturulması AI yönlendirmeleriyle yapılmıştır.
2. **Algoritmik Hata Ayıklama (Debugging):** Geliştirme esnasında karşılaşılan karmaşık limit sorunları (örneğin; "3 takım üyeliği" kuralının lider olunan takımlarla çakışması veya demo modunda iptal edilen başvuruların sayılmaya devam etmesi) AI ajanının kod mantığını analiz edip nokta atışı düzeltmeler yapmasıyla çözülmüştür.
3. **Akıllı Veri Üretimi (Mock Data):** Sistemin tasarımsal olarak test edilebilmesi için gerekli olan demo oturum senaryoları (Frontend/Backend/AI rolleri), örnek ilanlar ve takım bilgileri AI tarafından kurgulanıp kodlanmıştır.
4. **Platform İçi AI Modülü:** Uygulama içerisindeki `Matchmaking` sisteminin komut mühendisliği (prompt engineering) kısımları kodlanmış, yapay zekanın uygulama içinde de bir "özellik" olarak yer alması sağlanmıştır.

Yapay zeka, Teamflow'da sadece bir yan araç değil, hem geliştirme hem de ürünün kendi özellikleri boyutunda projenin belkemiğini oluşturan bir bileşen olmuştur.
