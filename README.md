# 🎮 Esports Real-Time Scoreboard, Tournament Bracket & OBS Overlay (MLBB Style)

Sistem penyiaran (*broadcast*), papan skor (*scoreboard*), dan manajemen bagan turnamen (*tournament bracket*) profesional bertema **Mobile Legends: Bang Bang (MLBB)**. Dirancang khusus untuk turnamen komunitas, sekolah (SMP/SMA/SMK), maupun turnamen umum berskala besar (hingga 57+ tim) dengan sinkronisasi real-time berlatensi ultra-rendah (<10ms) via Socket.io.

---

## 🌟 Fitur Utama

### 1. Database Tim Preset, Asal Sekolah & Bulk Import Google Form (`/teams`)
- **Manajemen Tim Lengkap:** Tambah, edit, dan hapus tim beserta tag singkatan dan logo tim.
- **Asal Sekolah / Instansi (Opsional):** 
  - Cocok untuk turnamen antar-pelajar SMP, SMA, SMK, maupun instansi/kampus.
  - Tampil di kartu database tim, slot bagan turnamen, dan papan skor overlay.
  - **Ukuran Font Dinamis:** Pada overlay, nama instansi otomatis mengecil jika teks panjang (misal: `SMP NEGERI 1 KARANGANYAR SURAKARTA`) agar tidak terpotong dan layout tetap rapi.
- **Bulk Import dari Google Form / Spreadsheet:**
  - Copy-paste langsung baris/kolom pendaftaran dari Google Sheets hasil formulir pendaftaran Google Form.
  - **Deteksi 2 Kolom Otomatis:** Kolom 1 = Nama Tim, Kolom 2 = Asal Sekolah/Instansi.
  - **Auto-Generate Tag:** Singkatan tag (3–5 huruf kapital) otomatis dibuat dari inisial nama tim jika tidak disediakan.
  - **Anti-Duplikat Cerdas:** Tim yang sudah terdaftar di database otomatis dilewati tanpa menimbulkan error.
  - Mendukung upload file `.csv` atau `.txt` dan tabel live preview sebelum disimpan.
- **Kolom Pencarian Instan (Search Bar):** Mempermudah pencarian tim berdasarkan nama atau tag singkatan.

---

### 2. Sistem Bagan Turnamen Otomatis & Skala Besar (`/bracket` & `/overlay/bracket`)
- **Mendukung Hingga 57+ Tim:**
  - **Babak 1 (Play-in):** 50 tim (25 match).
  - **7 Tim Unggulan (BYE):** Otomatis langsung menunggu di babak utama *Round of 32*.
- **Tampilan OBS Adaptif Otomatis (Global Link Tanpa Ganti URL):**
  - Cukup gunakan 1 link global `http://localhost:3000/overlay/bracket` di OBS Browser Source.
  - **Saat Babak 1 Aktif:** Tampilan otomatis beralih ke **Mode Fokus Babak 1 (Grid 3 Kolom)** sehingga 57 tim muat rapi dalam 1 layar 1080p tanpa terpotong!
  - **Saat Babak 1 Selesai:** Tampilan otomatis bertransisi ke **Fase Playoffs (8 Besar)** menuju perebutan gelar juara.
- **Fitur Kontrol Bagan:** Acak susunan tim (*Random Shuffle*), finalisasi bagan (*Finalize*), kirim pertandingan ke meja wasit (*Assign to Court*), dan sinkronisasi skor live.

---

### 3. Dua Pilihan Gaya Scoreboard Overlay OBS
- **Top Overlay (Kompak Atas - 1080 x 150):**
  - URL: `http://localhost:3000/overlay?key=<MATCH-KEY>`
  - Papan skor kompak di bagian atas layar siaran, mudah digeser dan disesuaikan posisinya.
- **Bottom Overlay (Full-Width 1920 x 200 - Penutup Layar Hitam HP):**
  - URL: `http://localhost:3000/overlay/bottom?key=<MATCH-KEY>`
  - Dirancang khusus selebar 1920px untuk **menutupi 100% area hitam di bawah layar game HP** (aspek rasio 20:9 / 19.5:9).
  - Desain siaran 3-bagian: Info Turnamen & Babak (kiri), Scoreboard Jumbo & Crystal Gems (tengah), Sponsor & Tagar Resmi (kanan), dan Running Ticker Text (atas).
  - **Animasi Juara:** Pop-up perayaan *"MATCH WINNER"* dan ledakan konfeti (*canvas-confetti*) otomatis saat pertandingan selesai.

---

### 4. Sistem Siaran Paralel Multi-Meja (4+ Courts)
- Mendukung 4 meja pertandingan atau lebih yang berjalan simultan tanpa bentrok (*zero cross-talk*).
- **Format Stream Key Mandiri:**
  - Meja 1: `.../overlay/bottom?key=match-c1-8f3a9b`
  - Meja 2: `.../overlay/bottom?key=match-c2-7d2e4c`
  - Meja 3: `.../overlay/bottom?key=match-c3-5a1b9f`
  - Meja 4: `.../overlay/bottom?key=match-c4-3e9d8a`
- **Dashboard Superadmin:** Memantau dan mengendalikan semua meja pertandingan dari 1 layar.
- **Panel Wasit Spesifik:** Setiap wasit memiliki login sendiri yang otomatis terhubung ke meja tugasnya.
- **Status Meja Siap (Standby):** Saat pertandingan selesai, meja otomatis dikosongkan dan overlay menampilkan status *"MENUNGGU MATCH BERIKUTNYA • MEJA SIAP"*.

---

## 📋 Daftar Rute & URL Aplikasi

| Halaman | URL | Resolusi OBS | Keterangan |
|---|---|---|---|
| **Control Panel Wasit / Admin** | `/admin` | - | Dashboard kendali skor touch-friendly untuk wasit |
| **Database Tim Preset** | `/teams` | - | Kelola tim, asal sekolah, dan Bulk Import GForm |
| **Manajemen Bagan Turnamen** | `/bracket` | - | Atur bagan, acak tim, dan kirim match ke meja wasit |
| **OBS Scoreboard Atas** | `/overlay?key=<KEY>` | `1080 x 150` | Scoreboard atas transparan MLBB style |
| **OBS Scoreboard Bawah (Full)** | `/overlay/bottom?key=<KEY>`| `1920 x 200` | Penutup hitam layar HP full-width dengan nama sekolah |
| **OBS Bagan Turnamen (Global)** | `/overlay/bracket` | `1920 x 1080` | Bagan adaptif otomatis (3 Kolom $\to$ Playoffs 8 Besar) |

---

## 🚀 Panduan Instalasi Lokal (Localhost)

### Persyaratan Sistem:
* **Node.js** v18+ atau v20+
* **MySQL Server** (XAMPP, Laragon, atau MySQL standalone)

### 1. Setup Database
1. Buat database baru di MySQL dengan nama `esports_overlay`.
2. Buat file `.env` di folder `server/`:
   ```env
   PORT=3000
   DATABASE_URL="mysql://root:password_anda@localhost:3306/esports_overlay"
   JWT_SECRET="kunci-rahasia-esports-2026"
   CORS_ORIGIN="http://localhost:5173"
   ```
3. Update skema database:
   ```cmd
   cd server
   npx prisma db push
   npm run prisma:seed
   ```

### 2. Menjalankan Aplikasi
* **Mode Development (Dua Terminal):**
  * Terminal 1 (Server): `cd server && npm run dev`
  * Terminal 2 (Client): `cd client && npm run dev`
* **Mode Production Lokal (Satu Perintah):**
  * Jalankan file batch [update-all.bat](file:///d:/ngoding/liveweb/update-all.bat)
  * Akses langsung melalui: `http://localhost:3000`

---

## ⚡ File Batch Otomatis (Windows Shortcut)

Folder proyek sudah dilengkapi file `.bat` siap pakai tanpa perlu menghafal perintah terminal:

- **`update-client.bat`**: Mengompilasi frontend Vite ke folder `client/dist`.
- **`update-db.bat`**: Menjalankan `npx prisma db push` dan `prisma generate` untuk memperbarui tabel database lokal.
- **`update-all.bat`**: Menjalankan update skema database, kompilasi frontend, dan kompilasi backend server sekaligus.
- **`build-hosting.bat`**: Membundel seluruh aplikasi menjadi **`deploy_hosting.zip`** siap upload ke cPanel.

---

## 🌐 Panduan Upload ke Server Hosting (cPanel)

Paket hosting menggunakan **Phusion Passenger / LiteSpeed** yang dioptimalkan agar ringan (~25MB) dan tidak memerlukan build di server hosting:

1. **Buat File ZIP di Komputer:**
   Jalankan file [build-hosting.bat](file:///d:/ngoding/liveweb/build-hosting.bat) atau ketik `npm run build:hosting`. File `deploy_hosting.zip` akan otomatis terbuat.
2. **Update Database di phpMyAdmin Hosting:**
   Buka phpMyAdmin cPanel $\to$ pilih database turnamen $\to$ tab **SQL**, lalu jalankan:
   ```sql
   ALTER TABLE `Team` ADD COLUMN IF NOT EXISTS `institution` VARCHAR(191) NULL;
   ALTER TABLE `Match` ADD COLUMN IF NOT EXISTS `teamAInstitution` VARCHAR(191) NULL;
   ALTER TABLE `Match` ADD COLUMN IF NOT EXISTS `teamBInstitution` VARCHAR(191) NULL;
   ALTER TABLE `BracketMatch` ADD COLUMN IF NOT EXISTS `teamAInstitution` VARCHAR(191) NULL;
   ALTER TABLE `BracketMatch` ADD COLUMN IF NOT EXISTS `teamBInstitution` VARCHAR(191) NULL;
   ```
3. **Upload & Ekstrak di File Manager:**
   Upload file `deploy_hosting.zip` ke folder domain (contoh: `/home/ykxyeguk/live.smekid.my.id`) $\to$ klik kanan $\to$ **Extract**.
   *(File konfigurasi `.env` Anda yang lama tetap aman dan tidak akan tertimpa).*
4. **Restart Aplikasi:**
   Buka menu **Setup Node.js App** di cPanel $\to$ klik tombol **Restart**.
5. **Selesai!** Website dan overlay langsung aktif di domain Anda.

---

## 🔑 Akun Default

* **Superadmin (Ketua Panitia):** `admin` / `admin123`
* **Wasit Meja 1:** `wasit1` / `wasit123`
* **Wasit Meja 2:** `wasit2` / `wasit123`
* **Wasit Meja 3:** `wasit3` / `wasit123`
* **Wasit Meja 4:** `wasit4` / `wasit123`

---

## 📁 Struktur Direktori

```plaintext
liveweb/
├── server/               # Express.js + Socket.io + Prisma ORM
│   ├── prisma/
│   │   ├── schema.prisma # Model User, Team, Match, BracketMatch, Sponsor, Setting
│   │   └── seed.ts       # Seeder tim preset & akun wasit
│   ├── uploads/          # Direktori penyimpanan logo tim
│   └── src/
│       ├── services/     # In-memory matchState & bracketService
│       ├── controllers/  # teamController, matchController, bracketController
│       └── index.ts      # Server entry point
│
├── client/               # Vue 3 + Tailwind CSS + Pinia + Lucide Icons + Vite
│   └── src/
│       ├── components/   # ScoreController, MatchConfigForm, GemPoints, WinnerOverlay
│       ├── stores/       # useMatchStore, useTeamStore, useBracketStore, useAuthStore
│       └── views/        # TeamsView, AdminView, BottomOverlayView, OverlayView, BracketOverlayView
│
├── package-hosting.js    # Script otomatis bundler cPanel hosting
├── build-hosting.bat     # Shortcut pembuatan deploy_hosting.zip
├── update-all.bat        # Shortcut update DB & build client/server
├── update-client.bat     # Shortcut kompilasi frontend
├── update-db.bat         # Shortcut migrasi tabel Prisma
└── README.md
```
