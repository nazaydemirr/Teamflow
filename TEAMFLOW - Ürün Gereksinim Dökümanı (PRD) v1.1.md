# **TEAMFLOW \- Ürün Gereksinim Dökümanı (PRD)**

**Hazırlayan:** Nazlıcan Aydemir

**Tarih:** 15 Nisan 2026

**Platform:** Web (Responsive \- Masaüstü, Tablet, Mobil)

**Teknoloji Önerisi:** Next.js / React \+ Tailwind CSS \+ Firebase

## **1\. ÜRÜN VİZYONU VE PROBLEM TANIMI**

### **1.1. Problem Tanımı**

Mühendislik öğrencileri, yarışma ve projeler için teknik yeteneklerine uygun ekip arkadaşı bulmakta zorlanmaktadır. Mevcut kanallar (WhatsApp, LinkedIn) web tabanlı hızlı bir "filtrele-eşleş-katıl" akışından yoksundur.

### **1.2. Çözüm Önerisi (Teamflow)**

Kullanıcıların yetenek bazlı profiller oluşturduğu, web tarayıcısı üzerinden herhangi bir yükleme yapmadan projeleri inceleyebildiği ve "Side-Panel" etkileşimiyle ana akıştan kopmadan ekiplere katılabildiği bir yetenek pazaryeri.

## **2\. KULLANICI HİKAYELERİ (USER STORIES)**

| ID | Persona | İstek (Requirement) | Amaç (Value) |
| :---- | :---- | :---- | :---- |
| **US.01** | Öğrenci | Web üzerinden hızlıca yeteneklerimi seçerek profil oluşturmak istiyorum. | Sistemde uzmanlık alanıma göre anında görünür olmak. |
| **US.02** | Öğrenci | Ana sayfada (Feed) yeteneklerime en uygun projeleri "Eşleşme Oranı" ile görmek istiyorum. | Manuel arama yapmadan bana en uygun fırsata odaklanmak. |
| **US.03** | Ekip Lideri | Başvuranların yetenek setlerini ve portfolyolarını web panelinde incelemek istiyorum. | Ekibime en uygun teknik profili seçmek. |
| **US.04** | Kullanıcı | Başvurum onaylandığında tarayıcı bildirimi veya e-posta ile haberdar olmak istiyorum. | Süreçten kopmamak ve aksiyon almak. |

## **3\. FONKSİYONEL GEREKSİNİMLER (FUNCTIONAL REQUIREMENTS)**

### **3.1. Web Tabanlı Onboarding & Auth**

* **G.01:** Kullanıcı, Google veya GitHub OAuth ile tarayıcı üzerinden giriş yapar.  
* **G.02:** Giriş sonrası zorunlu "Yetenek Seçim Modalı" açılır. Kategorize edilmiş (Frontend, Backend, AI vb.) yeteneklerden seçim yapılır.  
* **G.03:** Minimum 3 seçim yapılmadan "Akışa Geç" butonu aktif olmaz (Data Integrity).

### **3.2. Responsive Fırsat Akışı (Feed)**

* **G.04:** İlanlar "Match Score" algoritmasına göre ağırlıklı olarak listelenir.  
* **G.05:** Web deneyimi için "Grid View" veya "List View" seçenekleri sunulur.  
* **G.06:** Infinite Scroll (Sonsuz Kaydırma) ile veri çekimi yapılarak tarayıcı performansı korunur.

### **3.3. Side-Panel (Sağ Panel) Etkileşimi**

* **G.07:** Bir ilana tıklandığında yeni sayfa açılmaz; ekranın sağından (veya mobilde alttan) bir panel kayarak açılır.  
* **G.08:** Panel içerisinde proje detayları, mevcut ekipler, lider bilgileri ve "Kalan Kontenjan" dinamik olarak gösterilir.  
* **G.09:** "Katıl" butonu ile Firestore üzerinde bir application dokümanı tetiklenir.

## **4\. EKRAN TASARIM DETAYLARI (UI/UX SPEC)**

### **E1: Landing Page (Hero Section)**

* Profesyonel bir "Hero" alanı: "Ekibini Kur, Akışı Değiştir."  
* Modern ve minimalist "Google ile Giriş" butonu.

### **E2: Yetenek Seçim Arayüzü**

* Drag-and-drop veya çoklu seçim (Tag cloud) yapısı.  
* Dark Mode / Light Mode desteği.

### **E3: Ana Dashboard (Feed)**

* Sol Panel: Filtreler (Yarışma Tipi, Teknoloji, Tarih).  
* Orta Alan: İlan Kartları (Match % Badge ile).  
* Sağ Panel (Aktif): Seçili İlan Detayı ve Ekip Başvuru Alanı.

## **5\. VERİ MODELİ VE TEKNİK MİMARİ (DATA MODEL)**

### **5.1. Firestore Koleksiyon Yapısı**

* **Koleksiyon: users**  
  * uid: String, displayName: String, skills: Array\<String\>  
  * website\_url: String (Opsiyonel portfolyo linki)  
* **Koleksiyon: opportunities**  
  * opp\_id: String, title: String, tags: Array\<String\>, deadline: Timestamp  
* **Koleksiyon: teams**  
  * team\_id: String, opp\_id: String (FK), leader\_id: String, members: List\<uid\>

## **6\. KABUL KRİTERLERİ (ACCEPTANCE CRITERIA)**

### **AC.01: Web Eşleşme Skoru Doğruluğu**

* **Beklenen:** Kullanıcının profili ile ilandaki tags arasındaki kesişim kümesi (Intersection) anlık hesaplanmalı ve % olarak UI'da render edilmelidir.

### **AC.02: Responsive Davranış**

* **Beklenen:** Ekran genişliği 768px altına düştüğünde "Side-Panel", "Bottom-Sheet" (Alttan açılan panel) formuna dönmelidir.

### **AC.03: Başvuru Limit Kontrolü**

* **Beklenen:** Kullanıcı 3 aktif başvurudayken "Katıl" butonu disabled olmalı ve üzerine gelindiğinde (Tooltip) "Limit Dolu" uyarısı verilmelidir.

## **7\. BAŞARI METRİKLERİ (KPI)**

1. **Time to Hire:** Bir ekibin ilan açıldıktan sonra "Full" olma süresi (Web hızıyla \< 48 saat hedefi).  
2. **Web Traffic to Auth:** Landing page'e gelenlerin yüzde kaçı giriş yapıyor? (\> %20).  
3. **Skill Accuracy:** Başvuru yapanların yeteneklerinin ilana uyumu.

## **8\. KAPSAM DIŞI (OUT OF SCOPE)**

* Native Mobil Uygulamalar (iOS/Android mağaza sürümleri V1'de yok, sadece Web).  
* Gelişmiş Mesajlaşma Modülü (V2 planı).  
* Admin Dashboard (V1'de manuel veri yönetimi).