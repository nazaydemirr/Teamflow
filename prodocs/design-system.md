# **🌊 teamflow Tasarım Sistemi**

**FlowDS**, modern bir kariyer platformu için geliştirilmiş; esnek, erişilebilir ve mobil öncelikli bir tasarım sistemidir. Bu doküman, arayüz tasarımında tutarlılığı sağlamak için kullanılan temel bileşenleri ve kuralları içerir.

## **🎨 01 Renk Sistemi (Colors)**

Renk paleti, marka kimliğini temsil eden ana renkler ile kullanıcıya geri bildirim veren anlamsal renklerden oluşur.

### **Temel Renkler (Core Colors)**


| Renk Adı       | Hex    | Kullanım Alanı                                |
| -------------- | ------ | --------------------------------------------- |
| **Flow Blue**  | 2563EB | Birincil eylemler, butonlar ve marka vurgusu. |
| **Soft Slate** | F8FAFC | Sayfa arkaplanları ve kart yüzeyleri.         |
| **Text Navy**  | 1E293B | Ana metin ve başlıklar.                       |
| **Text Slate** | 64748B | İkincil metinler ve yardımcı açıklamalar.     |


### **Anlamsal Renkler (Semantic Colors)**

- **Match Green (22C55E):** %70-100 eşleşme skorları ve başarılı işlemler.  
- **Alert Amber (F59E0B):** %40-69 eşleşme ve dikkat gerektiren uyarılar.  
- **Error Red (EF4444):** Kritik hatalar ve reddedilen başvurular.

### **Renk Skalaları (CSS Variables)**

Sistemde kullanılan bazı ana ölçekler:

- **Blue Ramp:** 50 (EFF6FF)  900 (1E3A8A)  
- **Slate Ramp:** 50 (F8FAFC)  900 (0F172A)

## **✏️ 02 Tipografi (Typography)**

Sistemde hiyerarşi ve okunabilirliği dengeleyen iki ana font ailesi kullanılmaktadır.

### **1 Display Font: Fraunces**

Başlıklar ve hero bölümlerinde ekspressif bir hava katmak için kullanılır.

- **Display XL:** 48px / 300 / 1.05  
- **Heading 1:** 36px / 300 / 1.15  
- **Heading 2:** 28px / 300 / 1.20

### **2 Body Font: DM Sans**

Okunabilirlik gerektiren gövde metinleri, formlar ve etiketler için kullanılır.

- **Body MD:** 15px / 400 / 1.6 (Standart içerik)  
- **Body SM:** 13px / 400 / 1.6 (Meta bilgiler)  
- **Label:** 12px / 600 (Form etiketleri ve küçük başlıklar)  
- **Caption:** 11px / 400 (Zaman damgaları)

## **📐 03 Boşluk ve Izgara (Spacing & Grid)**

Sistem **4px tabanlı** bir boşluk ölçeği kullanır.

### **Boşluk Ölçeği**

- -space-1: 4px  
- -space-2: 8px  
- -space-4: 16px (Standart)  
- -space-6: 24px  
- -space-10: 40px  
- -space-16: 64px

### **Izgara Sistemi**

- **Mobil:** 4 Kolon (≤ 640px) | Gutter: 16px  
- **Tablet:** 8 Kolon (641px  1024px) | Gutter: 24px  
- **Masaüstü:** 12 Kolon (≥ 1025px) | Gutter: 32px

## **🧩 04 UI Bileşenleri (Components)**

### **Butonlar (Buttons)**

- **Varyantlar:** Primary, Secondary, Outline, Ghost, Danger, Success.  
- **Radius:** md (10px) veya lg (16px).  
- **Etkileşim:** active durumunda scale(0.97) efekti uygulanır.

### **Badges & Etiketler**

- **Durum:** Açık pozisyon (Mavi), Aktif (Yeşil), Kapalı (Kırmızı).  
- **Match Score:** Eşleşme oranını görselleştiren ikonlu rozetler.  
- **Skills:** Kullanıcı yeteneklerini gösteren kompakt "pill" tasarımı.

### **Kartlar (Cards)**

- **İş Kartı:** Hover durumunda yukarı doğru kayma ve shadow-lg gölge efekti.  
- **Profil Kartı:** Kullanıcı istatistiklerini ve avatarını merkeze alan yapı.

### **Formlar**

- **Input:** 1.5px kalınlığında border, focus durumunda mavi gölge (ring).  
- **Validation:** Başarı durumunda yeşil, hata durumunda kırmızı çerçeve ve açıklama metni.

## **⚡ 05 Hareket (Motion)**

Kullanıcı deneyimini güçlendiren akıcı geçiş değerleri.

### **Easing Eğrileri**

- **Spring Out:** cubic-bezier(0.16, 1, 0.3, 1 (Varsayılan eylemler)  
- **Ease Out:** cubic-bezier(0, 0, 0.2, 1

### **Süre Değerleri**

- **120ms (Hızlı):** Hover, focus efektleri.  
- **200ms (Standart):** Buton ve kart geçişleri.  
- **350ms (Yavaş):** Modallar ve büyük sayfa geçişleri.

## **💻 Teknik Uygulama (CSS Variables)**

:root {  
  / Core /  
  -flow-blue: 2563EB;  
  -text-navy: 1E293B;  

  / Fonts /  
  -font-display: 'Fraunces', serif;  
  -font-body: 'DM Sans', sans-serif;  

  / Radii /  
  -radius-md: 10px;  
  -radius-lg: 16px;  

  / Motion /  
  -duration: 200ms;  
  -ease: cubic-bezier(0.16, 1, 0.3, 1);  
}  