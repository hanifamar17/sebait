# Sebait

Aplikasi web generator puisi pendek berbahasa Indonesia. Setiap kali halaman dimuat, sistem akan menampilkan satu bait secara acak dari koleksi teks yang tersedia. Tampilan aplikasi dilengkapi dengan perubahan dinamis pada warna latar belakang dan aksen. Bait yang ditampilkan dapat diekspor menjadi kartu cerita (*story card*) berrasio 9:16 dan diunduh dalam format PNG.

Dikembangkan menggunakan **Flask** dan **Tailwind CSS**, serta menerapkan sistem token warna berbasis *shadcn/ui*.

---

## Fitur Utama

- **Bait Acak & Tautan Langsung:** Menampilkan puisi secara acak yang dapat dibagikan melalui URL spesifik.
- **Mode Fokus:** Tampilan layar penuh (*fullscreen*) dengan menyembunyikan elemen kontrol untuk memudahkan dokumentasi visual/tangkapan layar.
- **Sistem Tema Warna:** Memiliki empat palet warna (`embun`, `senja`, `lumut`, `tanah`), masing-masing mendukung mode terang (*light mode*) dan gelap (*dark mode*).
- **Ekspor Kartu Story:** Mengonversi tampilan bait puisi menjadi gambar format PNG berukuran 9:16.

---

## Petunjuk Pengoperasian

### Prasyarat
- Python 3.10 atau versi yang lebih baru.

### Langkah Instalasi dan Pengoperasian

1. Buat dan aktifkan lingkungan virtual (*virtual environment*):
   ```bash
   python -m venv venv
   source venv/bin/activate       # Pengguna Windows: venv\Scripts\activate
   ```

2. Pasang dependensi yang dibutuhkan:
   ```bash
   pip install -r requirements.txt
   ```

3. Jalankan aplikasi:
   ```bash
   python app.py
   ```

4. Akses aplikasi melalui peramban web pada alamat: `http://127.0.0.1:5000`

> **Catatan:** Pada saat aplikasi dinyalakan, terminal akan menampilkan jumlah bait yang berhasil dimuat dari direktori `bait/`. Jika direktori `bait/` tidak berisi berkas teks, server akan menghentikan proses secara otomatis.

---

## Struktur Proyek

```text
puisi/
├── app.py
├── requirements.txt
├── bait/                 
│   ├── hujan.txt
│   ├── malam.txt
│   └── jalan-pulang.txt
├── static/
│   ├── app.css
│   ├── theme.js
│   └── story.js
└── templates/
    ├── base.html
    ├── index.html
    ├── puisi.html
    ├── _poem.html
    └── _button.html
```

Untuk menambahkan halaman baru, lakukan ekstensi pada templat `base.html` dan definisikan isi pada blok `content`.

---

## Menambahkan Koleksi Bait Baru

Tambahkan berkas berformat `.txt` ke dalam direktori `bait/` dengan struktur format berikut:

```text
# Judul Koleksi

Baris pertama puisi.
Baris kedua puisi.

Bait berikutnya terdiri dari baris pertama.
Baris kedua.
Baris ketiga.
```

**Ketentuan Format:**
- Gunakan baris kosong untuk memisahkan antarbait.
- Baris yang diawali dengan `# Judul` akan digunakan sebagai nama sumber yang ditampilkan di bawah puisi.
- Apabila terdapat baris penulisan spesifik seperti `— Nama Penulis` di dalam bait, atribut sumber secara khusus akan menggantikan judul utama koleksi.
- Berkas yang diawali dengan karakter garis bawah (`_`) akan diabaikan oleh sistem.
- Pastikan berkas disimpan menggunakan enkoding **UTF-8**.
- Lakukan pemuatan ulang (*restart*) server setelah menambahkan atau mengubah berkas dalam direktori `bait/`.

---

## Catatan Lingkungan Produksi

1. **Tailwind CSS:** Saat ini Tailwind CSS dihubungkan menggunakan CDN untuk keperluan pengembangan (*development*). Untuk lingkungan produksi (*production*), disarankan melakukan kompilasi CSS menggunakan Tailwind CLI.
2. **Server Web:** Perintah `python app.py` menjalankan server dalam mode *debug*. Gunakan WSGI server seperti **Gunicorn** untuk kebutuhan deployment produksi.
3. **Konektivitas:** Pengubahan tipe huruf (*font*) dan styling Tailwind memerlukan koneksi internet aktif. Tampilan tanpa koneksi internet akan beralih (*fallback*) ke font bawaan (*Georgia*) dengan styling terbatas.

---

## Lisensi

## Hak Cipta & Lisensi

© 2026 Hanif Amar. Hak Cipta Dilindungi Undang-Undang (*All Rights Reserved*).

Kode sumber dan konten dalam repositori ini disediakan hanya untuk keperluan demonstrasi/portofolio. Anda tidak diperkenankan untuk menyalin, memodifikasi, mendistribusikan, atau menggunakan kode ini tanpa izin tertulis dari pemilik hak cipta.