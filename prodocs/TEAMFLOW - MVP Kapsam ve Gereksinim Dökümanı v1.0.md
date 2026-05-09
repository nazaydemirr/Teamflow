# **TEAMFLOW \- MVP Kapsam ve Gereksinim Dökümanı v1.0**

**Proje Adı:** Teamflow

**Doküman Sahibi:** Nazlıcan Aydemir 

**Tarih:** 15 Nisan 2026

## **1\. ÜRÜNÜN AMACI VE KAPSAMI**

Teamflow MVP'sinin temel amacı; mühendislik öğrencilerinin karmaşık süreçlerle uğraşmadan, teknik yeteneklerine en uygun projeleri/yarışmaları bulmalarını ve tek tıkla ekiplere dahil olmalarını sağlamaktır. 2\. FONKSİYONEL ÖZELLİKLER (DETAYLI)

### **2.1. Kimlik Doğrulama ve Kullanıcı Profili**

* **Google OAuth Entegrasyonu:** Kullanıcılar sadece Google hesapları ile giriş yapabilir.  
* **İlk Giriş Kontrolü:** Sistem, kullanıcının isFirstLogin değerini kontrol eder; eğer true ise zorunlu Onboarding ekranına yönlendirir.  
* **Profil Verisi:** Auth üzerinden alınan displayName, email ve photoURL otomatik olarak users koleksiyonuna kaydedilir.

### **2.2. Zorunlu Onboarding (Yetenek Seçimi)**

* **Kategorizasyon:** Yetenekler 5 ana başlıkta sunulur: Frontend, Backend, AI/ML, Mobile, Cyber Security.  
* **Seçim Mantığı:** Kullanıcı en az 3 yetenek seçmek zorundadır. Seçimler chips yapısında UI'da gösterilir.  
* **Kısıt:** 3 yetenek seçilmeden "Teamflow'u Keşfet" butonu aktif (disabled) hale gelmez.

### **2.3. Dinamik Fırsat Akışı (Feed) & Eşleşme**

* **V1 Eşleşme Algoritması:** Kullanıcı yetenekleri ile ilanın requiredTags listesi karşılaştırılır. Kesişim kümesi oranına göre bir Match Score (%) üretilir.  
* **Sıralama Mantığı:** İlanlar en yüksek skordan en düşüğe göre listelenir.  
* **İlan Kartı Detayları:**  
  * Başlık ve Kısa Açıklama (Max 150 karakter).  
  * Kategori İkonu (Yarışma, Proje, Staj).  
  * Match Score Badge (Örn: "%85 Uyumlu").  
  * Son Başvuru Tarihi (Deadline).

### **2.4. Side-Drawer Deneyimi (İlan & Ekip Detay)**

* **Aksiyon:** İlan kartına tıklandığında ekranın sağından 600px genişliğinde (responsive: mobilde tam ekran) bir panel açılır.  
* **İçerik:** İlanın tam açıklaması ve o ilana bağlı aktif ekiplerin listesi.  
* **Ekip Kartları:**  
  * Liderin Adı ve Fotoğrafı.  
  * Kapasite Durumu (Örn: "3/5 Dolu").  
  * Mevcut Üyelerin Yetenek İkonları.

### **2.5. Katılım Mekanizması (Apply Logic)**

* **Başvuru Sınırı:** Bir kullanıcı aynı anda en fazla 3 aktif (bekleyen) başvuruya sahip olabilir.  
* **Katıl Butonu:** Tıklandığında Pending durumuna geçer.  
* **Onay Süreci:** V1'de liderin onaylaması manuel bir süreçtir ancak teknik altyapı statü değişikliğini (Accepted/Rejected) destekler.

## **3\. TEKNİK GEREKSİNİMLER VE KISITLAR**

### **3.1. Veri Tabanı Tasarımı (Firestore)**

* **Doküman Boyutu:** Her bir kullanıcı ve ilan dokümanı 1MB sınırını aşmayacak şekilde optimize edilecektir.  
* **Real-time Updates:** Ekip doluluk oranları Snapshot dinleyicileri ile anlık güncellenecektir.

### **3.2. Performans (NFR)**

* **Initial Load:** Ana sayfa yüklenme süresi 1.5s altında olmalıdır.  
* **Resim Optimizasyonu:** Kullanıcı avatarları CDN üzerinden optimize edilerek çekilecektir.

## **4\. KAPSAM DIŞI (OUT-OF-SCOPE) \- V2'YE ERTELENENLER**

| Özellik | Neden Ertelendi? | Alternatif Çözüm |
| :---- | :---- | :---- |
| **Uygulama İçi Chat** | Karmaşık Socket yönetimi gerektirir. | Kabul sonrası liderin WhatsApp/LinkedIn linki gösterilecek. |
| **Gelişmiş Profil Düzenleme** | MVP için kritik değil. | İlk onboarding'deki veriler kullanılacak. |
| **Push Bildirimleri** | Tarayıcı izinleri ve maliyet. | Uygulama içi bildirim çubuğu (Status bar). |
| **İlan Oluşturma (User)** | İçerik kalitesini korumak için. | V1'de ilanlar sadece Admin tarafından girilecek. |

## **5\. KABUL KRİTERLERİ (ACCEPTANCE CRITERIA)**

* **AC.1:** Kullanıcı Google ile başarılı giriş yaptıktan sonra yetenek seçmeden ana sayfayı göremiyor olmalı.  
* **AC.2:** Eşleşme skoru %0 olan ilanlar listenin en sonunda yer almalı.  
* **AC.3:** Kontenjanı dolu olan bir ekibin "Katıl" butonu otomatik olarak deaktif olmalı.

## **6\. RİSKLER VE ÖNLEMLER**

* **Risk:** Kullanıcıların alakasız yetenekler seçmesi.  
* **Önlem:** V1'de "Custom Skill" ekleme kapalı olacak, sadece hazır listeden seçim yapılacak.  
* **Risk:** Aynı anda son kontenjana iki başvuru gelmesi.  
* **Önlem:** Firebase Transaction kullanılarak veri tutarlılığı sağlanacak.