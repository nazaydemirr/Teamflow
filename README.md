# Teamflow

Teamflow, yazılım geliştiricilerin, tasarımcıların ve diğer teknoloji profesyonellerinin yeteneklerine uygun projeler bulmasını ve proje yöneticilerinin doğru yeteneklere sahip takım arkadaşları aramasını sağlayan akıllı bir eşleştirme platformudur.

Kullanıcıların ekipler kurmasına, boş pozisyonlara yetenek (skill) bazlı arama yapmasına ve yapay zeka desteğiyle nokta atışı davetler göndermesine olanak tanır. 

## Öne Çıkan Özellikler

- **Akıllı Eşleştirme:** Becerilerinizi sisteme girerek (React, Node.js, Python vb.) tam da bu yetenekleri arayan projelere başvurabilirsiniz.
- **Esnek Takım Kurma:** Kendi takımınızı kurabilir, projenizin eksik pozisyonlarını ve bu pozisyonlar için aranan teknolojileri detaylıca belirleyebilirsiniz.
- **Yapay Zeka (AI) Destekli Davetler:** Eksik yeteneği arama çubuğuna yazdığınızda (Örn: "Express.js bilen Backend Uzmanı"), AI Core veritabanını tarar ve uygun adayları bulur. OpenRouter (Gemma) yapay zeka modeli aracılığıyla projenize özel, teşvik edici davet metinleri oluşturur ve adaylara bildirim olarak gönderir.
- **Adil Limit Yönetimi:** Kullanıcılar aynı anda en fazla 3 aktif takıma üye olabilir veya başvuru yapabilir. Ancak lider (kaptan) oldukları projeler bu kotadan muaftır.
- **Hızlı Deneyim (Demo Modu):** Sistemi hızlıca test edebilmeniz için tek tıkla giriş yapılabilen (Frontend, Backend ve AI) hazır demo profilleri sunar.

---

## Kurulum ve Çalıştırma (Deployment)

Proje, **Frontend (Next.js)** ve **Backend (Node.js/Express)** olmak üzere iki ayrı servis halinde çalışmaktadır.

### 1. Sistem Gereksinimleri
- Node.js (v18+)
- PostgreSQL (Veritabanı)
- OpenRouter API Anahtarı (Yapay zeka eşleştirme özelliklerinin tam performansta çalışması için gereklidir)

### 2. Veritabanının Hazırlanması
1. Bilgisayarınızda veya sunucunuzda PostgreSQL'i çalıştırın ve `teamflow_db` adında boş bir veritabanı oluşturun.
2. `backend` klasöründe yer alan `.env` dosyası içindeki `DB_NAME`, `DB_USER`, `DB_PASSWORD` ve `DATABASE_URL` bilgilerini kendinize göre düzenleyin.
3. (Eğer projenin kurulum senaryoları varsa) `schema.sql` gibi temel yapı dosyalarını veritabanınızda çalıştırarak tabloları oluşturun.

### 3. Backend Servisini Başlatma
Terminalde aşağıdaki komutları sırasıyla çalıştırın:
```bash
# 1. Backend klasörüne geçiş yapın
cd backend

# 2. Gerekli kütüphaneleri (bağımlılıkları) kurun
npm install

# 3. .env dosyanızın varlığından ve içeriğinden (Örn: OPENROUTER_API_KEY) emin olun.

# 4. Geliştirme (Dev) sunucusunu başlatın
npm run dev
```
Backend servisi başarıyla başladığında varsayılan olarak `http://localhost:8080` portunu dinleyecektir. Swagger API dökümantasyonuna erişmek için tarayıcıda `/api-docs` yoluna gidebilirsiniz.

### 4. Frontend İstemcisini Başlatma
Yeni bir terminal penceresinde aşağıdaki komutları çalıştırın:
```bash
# 1. Frontend klasörüne geçiş yapın
cd frontend

# 2. Gerekli kütüphaneleri (bağımlılıkları) kurun
npm install

# 3. Geliştirme (Dev) sunucusunu başlatın
npm run dev
```
Frontend arayüzü varsayılan olarak `http://localhost:3000` adresinde ayağa kalkacaktır. 

> **Canlıya Alma (Production):**
> Frontend projesini production için derlemek istediğinizde `npm build` komutunu kullanıp ardından `npm start` ile ayağa kaldırabilirsiniz. Backend için ise pm2 gibi süreç yöneticileri ile doğrudan `node index.js` komutunu çalıştırarak canlı ortama alabilirsiniz. Vercel, Railway veya Render gibi platformlar her iki servisin deployment'ı için iyi birer tercihtir.

## AWS Üzerinde Canlıya Alma (Production Deployment)

Teamflow projesini sanal bir AWS sunucusunda (EC2) canlıya almak için aşağıdaki adımları izleyebilirsiniz:

### 1. EC2 Sunucusunun Hazırlanması
- AWS yönetim panelinden bir **Ubuntu 22.04 LTS** (veya üzeri) EC2 instance'ı başlatın.
- **Security Group (Güvenlik Grubu)** ayarlarında internet erişimi için şu portlara izin verin:
  - `22` (SSH - Sunucuya güvenli bağlantı için)
  - `80` ve `443` (HTTP/HTTPS - Dışarıdan web erişimi için)

### 2. Gerekli Kurulumlar
Sunucunuza SSH ile bağlandıktan sonra temel bileşenleri (Node.js, npm ve PM2) kurun:
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```
*(Not: Veritabanı için AWS RDS PostgreSQL kullanmanız veya aynı EC2 üzerine `postgresql` kurmanız gereklidir.)*

### 3. Servislerin Başlatılması (PM2)
Projeyi sunucuya klonladıktan sonra her iki servisi de production modunda başlatın:

**Backend:**
```bash
cd teamflow/backend
npm install
# nano .env komutuyla veritabanı ve OPENROUTER_API_KEY ayarlarınızı yapılandırın.
pm2 start index.js --name "teamflow-backend"
```

**Frontend:**
```bash
cd ../frontend
npm install
npm run build
pm2 start npm --name "teamflow-frontend" -- start
```

### 4. Süreklilik ve Yönlendirme (Nginx)
- Servislerin sunucu yeniden başladığında da otomatik çalışması için: `pm2 startup` ve `pm2 save` komutlarını çalıştırın.
- Uygulamanıza bir alan adı (domain) üzerinden portsuz erişmek (80/443 portlarını 3000 ve 8080'e bağlamak) için sunucuya **Nginx** kurup _Reverse Proxy_ (Ters Vekil) yapılandırması yapmanız tavsiye edilir.
