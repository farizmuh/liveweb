# Esports Real-Time Scoreboard & OBS Overlay (MLBB Style)

Sistem scoreboard dan overlay broadcast turnamen esports profesional bernuansa Mobile Legends: Bang Bang (MLBB), dilengkapi sinkronisasi real-time berlatensi ultra-rendah (<10ms) via Socket.io, in-memory state caching, dan persistensi asinkron ke MySQL via Prisma ORM.

---

## 🎮 Fitur Utama

### 1. Backend & Real-Time Sync (Express.js + Socket.io + Prisma MySQL)
- **In-Memory Caching:** Saat server berjalan, pertandingan dengan `is_active = TRUE` dimuat langsung ke memori.
- **Sub-Millisecond Broadcast:** Setiap kali ada interaksi wasit (klik skor `+1`, swap tim, ganti format), data langsung di-emit via Socket.io ke OBS dalam hitungan milidetik.
- **Asynchronous Persistence:** Perubahan ditulis ke MySQL di latar belakang tanpa memblokir socket.
- **Crash & Restart Resilience:** Jika VPS mati lampu atau di-restart, state pertandingan terakhir tidak hilang dan otomatis dipulihkan saat server start.
- **Keamanan Akun:** Diproteksi JWT dan enkripsi Bcrypt dengan role akun (Superadmin & Referee).

### 2. Halaman Admin (Control Panel) - `/admin` atau `/admin.html`
- **Mobile-First Design:** Sangat nyaman dan ergonomis diakses melalui smartphone wasit / panitia turnamen di arena.
- **Kontrol Skor Cepat:** Tombol sentuh besar `[ +1 ]` dan `[ -1 ]` dengan auto-cap berdasarkan format.
- **Aturan BO Otomatis:**
  - **BO1:** Pemenang 1 poin (Max skor 1).
  - **BO3:** Pemenang 2 poin (Max skor 2).
  - **BO5:** Pemenang 3 poin (Max skor 3).
  - **BO7:** Pemenang 4 poin (Max skor 4).
- **Swap Side Instant (1-Klik):** Menukar seluruh data Tim Biru (kiri) ke Tim Merah (kanan) beserta skornya seketika.
- **Tombol Reset Skor:** Dilengkapi dialog modal konfirmasi pencegah klik tidak sengaja.
- **Database Preset Tim:** Dropdown untuk memilih tim yang sudah tersimpan atau input langsung nama dan tag baru.
- **Indikator Real-Time:** Status koneksi WebSocket (Online / Offline) dan status penyimpanan ke database MySQL.
- **Banner Sponsor & Running Ticker:** Pengaturan running text pengumuman dengan toggle ON/OFF live ke OBS.

### 3. Halaman Overlay OBS - `/overlay` atau `/overlay.html`
- **Dimensi:** 1920 x 1080 dengan latar belakang transparan (`background: transparent`).
- **Desain Khas Esports MLBB (MPL Style):**
  - Top-Bar Scoreboard bernuansa gelap metalik, border aksen emas (*gold trim*), sudut miring (*skewed banner*), aksen Tim Biru (kiri) vs Tim Merah (kanan).
  - **Indikator Titik Poin Gems:** Bentuk permata kristal (*glowing diamond gems*) untuk format BO1/BO3/BO5.
  - **Indikator "Match Point":** Badge menyala otomatis saat salah satu tim tinggal berjarak 1 kemenangan dari gelar juara.
  - **Selebrasi "MATCH WINNER":** Popup banner perayaan kemenangan lengkap dengan efek konfeti saat match berakhir.
  - **Sponsor Running Ticker:** Baris teks informasi berjalan di bawah scoreboard utama.

---

## 🚀 Panduan Instalasi & Menjalankan

### Persyaratan Sistem:
- **Node.js** v18+ atau v20+
- **MySQL Server** (XAMPP, Laragon, Docker, atau MySQL Server standalone)

### 1. Konfigurasi Database & Server
1. Buat database baru di MySQL bernama `esports_overlay`:
   ```sql
   CREATE DATABASE esports_overlay;
   ```
2. Salin dan sesuaikan file lingkungan di folder `server/`:
   ```bash
   cd server
   cp .env.example .env
   ```
   Pastikan koneksi database pada `DATABASE_URL` sudah sesuai, contoh:
   ```env
   DATABASE_URL="mysql://root:password_anda@localhost:3306/esports_overlay"
   PORT=3000
   JWT_SECRET="kunci-rahasia-esports-2026"
   CORS_ORIGIN="http://localhost:5173"
   ```

3. Jalankan migrasi dan seed data awal:
   ```bash
   # Masuk ke folder server
   cd server

   # Buat tabel di MySQL
   npx prisma db push

   # Isi data akun wasit default & preset tim MPL (ONIC, RRQ, EVOS, BTR, dll)
   npm run prisma:seed
   ```

### 2. Menjalankan Aplikasi

#### Mode Development:
Buka dua terminal:
- **Terminal 1 (Backend Server):**
  ```bash
  cd server
  npm run dev
  ```
  *(Server berjalan di `http://localhost:3000`)*

- **Terminal 2 (Frontend Vite):**
  ```bash
  cd client
  npm run dev
  ```
  *(Frontend berjalan di `http://localhost:5173`)*

#### Mode Production:
Build frontend dan jalankan langsung dari satu server Express:
```bash
# 1. Build client
cd client
npm run build

# 2. Build dan start server
cd ../server
npm run build
npm start
```
*(Aplikasi terpadu dapat diakses langsung pada port `http://localhost:3000`)*

---

## 🏟️ Fitur 4 Pertandingan Paralel (Multi-Court Stream Key)

Sistem ini mendukung hingga 4+ pertandingan yang berjalan **secara simultan/paralel** dan disiarkan langsung di 4 komputer OBS yang berbeda tanpa saling bentrok (*zero cross-talk*).

### 1. Format Kunci Pertandingan (Stream Key):
Masing-masing pertandingan memiliki secret key unik untuk URL Browser Source OBS:
- **Meja 1 (Court 1):** `http://localhost:3000/overlay?key=match-c1-8f3a9b`
- **Meja 2 (Court 2):** `http://localhost:3000/overlay?key=match-c2-7d2e4c`
- **Meja 3 (Court 3):** `http://localhost:3000/overlay?key=match-c3-5a1b9f`
- **Meja 4 (Court 4):** `http://localhost:3000/overlay?key=match-c4-3e9d8a`

> 💡 **Panduan Transparan:** Jika operator OBS membuka `/overlay` tanpa parameter key, layar akan menampilkan panduan transparan yang ramah untuk memasukkan key yang sesuai.

### 2. Akun Wasit & Superadmin:
- **Superadmin (Ketua Panitia):** `admin` / `admin123`
  - Memiliki **Dashboard Monitoring 4 Meja** sekaligus di satu layar: dapat memantau keempat skor secara live, mengubah skor meja mana pun secara sentral, atau membuka kontrol penuh per meja.
- **Wasit Meja 1:** `wasit1` / `wasit123` &rarr; Otomatis terhubung ke Court 1
- **Wasit Meja 2:** `wasit2` / `wasit123` &rarr; Otomatis terhubung ke Court 2
- **Wasit Meja 3:** `wasit3` / `wasit123` &rarr; Otomatis terhubung ke Court 3
- **Wasit Meja 4:** `wasit4` / `wasit123` &rarr; Otomatis terhubung ke Court 4

### 3. Dua Pilihan Gaya Overlay OBS:
Anda dapat memilih layout sesuai kebutuhan dan suasana siaran:
- **Top Overlay (Scoreboard Atas Kompak):**
  - URL: `http://localhost:3000/overlay?key=<MATCH-KEY>`
  - Resolusi OBS Browser Source: **Width: `1080`**, **Height: `150`**
  - Sangat mudah digeser dan disesuaikan posisinya di atas layar.
- **Bottom Overlay (Full-Width Footer 1920x200 - Penutup Layar Hitam HP):**
  - URL: `http://localhost:3000/overlay/bottom?key=<MATCH-KEY>`
  - Resolusi OBS Browser Source: **Width: `1920`**, **Height: `200`**
  - Dirancang khusus membentang penuh dari kiri ke kanan untuk **menutupi 100% area hitam di bawah layar game HP** yang tidak tertutup oleh tangkapan layar ponsel (aspect ratio 20:9 / 19.5:9).
  - Dilengkapi layout siaran 3-bagian (Kiri: Info Turnamen & Meja, Tengah: Scoreboard & Gems, Kanan: Sponsor & Hashtag turnamen, Atas: Running Ticker pembatas).

---

## 🎥 Cara Memasang di OBS Studio

1. Buka software **OBS Studio**.
2. Pada panel **Sources**, klik tombol `+` lalu pilih **Browser**.
3. Beri nama source (contoh: `Scoreboard MLBB`).
4. Atur ukuran Browser Source (Disesuaikan pas dengan ukuran komponen agar mudah digeser & diatur di layar OBS):
   - **URL:** `http://localhost:3000/overlay` (atau `http://IP-VPS-ANDA:3000/overlay`)
   - **Width:** `1080`
   - **Height:** `150`
   - Centang **"Shutdown source when not visible"** (opsional).
   - Centang **"Refresh browser when scene becomes active"** (opsional).
5. Klik **OK**. Bounding box hijau di OBS kini akan pas membungkus scoreboard tanpa menyisakan ruang kosong besar, sehingga Anda dapat dengan mudah menggeser, memperbesar/memperkecil, atau menempatkannya di mana saja pada layar siaran.

---

## 📱 Akses Admin Panel Panitia / Wasit (HP)

1. Buka browser di HP wasit / panitia.
2. Arahkan ke: `http://<IP-KOMPUTER-ATAU-VPS>:3000/admin`
3. Masuk dengan akun default:
   - **Username:** `admin`
   - **Password:** `admin123`
4. Wasit dapat langsung mengendalikan skor pertandingan secara live tanpa perlu menyentuh komputer OBS.

---

## 📁 Struktur Proyek

```plaintext
liveweb/
├── server/               # Express.js + Socket.io + Prisma ORM
│   ├── prisma/
│   │   ├── schema.prisma # Model User, Team, Match, Sponsor, Setting
│   │   └── seed.ts       # Seeding tim preset MLBB & akun wasit
│   ├── uploads/          # Folder file logo tim yang diunggah
│   └── src/
│       ├── services/     # In-memory match manager & async save
│       ├── controllers/  # Auth, Team CRUD, Match Controls, Sponsor
│       ├── sockets/      # Realtime Socket.io events
│       └── index.ts      # Server entry point
│
├── client/               # Vite + Vue 3 + Tailwind CSS + Pinia
│   ├── public/
│   │   ├── admin.html    # Entry/redirect route admin
│   │   └── overlay.html  # Entry/redirect route overlay
│   └── src/
│       ├── assets/styles/mlbb-theme.css # Efek gold trim, neon glow, metallic
│       ├── components/
│       │   ├── overlay/  # Scoreboard, Gems, Match Point, Winner celebration
│       │   └── admin/    # Touch Score Buttons, Swap Side, Team selector
│       ├── stores/       # Pinia matchStore, authStore, teamStore
│       └── views/        # AdminView, OverlayView, LoginView, MatchesView
└── README.md
```

