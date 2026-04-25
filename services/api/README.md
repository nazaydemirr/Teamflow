# TEAMFLOW API (MVP bootstrap)

Bu dizin, `plan.md` içindeki **A.3 Backend kurulumu (ilk adım)** için oluşturulmuş minimum backend iskeletidir.

Backend, iOS + web için ortak tüketilecek şekilde **HTTP API** olarak tasarlanır.

## Çalıştırma

PowerShell:

```bash
cd "C:\Users\Nazlıcan\Desktop\flowup 1. hafta\services\api"
$env:Path = "C:\Program Files\nodejs;" + $env:Path
npm install
node server.js
```

## Endpointler

- `GET /health`
  - 200: `{ "ok": true }`
- `GET /me`
  - 401: token yok/yanlış
  - 200: `{ "uid": "...", "skills": [] }` (şimdilik stub response; US.01’de Firestore’dan dönecek)

## Env

- `PORT` (opsiyonel, default `8080`)
- `GOOGLE_APPLICATION_CREDENTIALS` (opsiyonel, dev ortamında Firebase Admin için)

