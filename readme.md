# Sebait

Generator puisi pendek berbahasa Indonesia. Tiap bait bisa dibagikan lewat tautan, ditulis sendiri, disimpan, atau diekspor jadi kartu story PNG.

Dibuat dengan **Flask** dan **Tailwind CSS** (token warna ala *shadcn/ui*).

## Fitur

- **Bait acak:** tombol *Lain*, tautan `/?b=<id>` stabil untuk dibagikan.
- **Tulis sendiri:** `/tulis`, bait dikodekan ke URL (tanpa database).
- **Tersimpan:** favorit disimpan di peramban (`localStorage`).
- **Kartu story:** unduh PNG, rasio 9:16 / 4:5 / 1:1.
- **Tema:** `embun`, `senja`, `lumut`, `tanah`; masing-masing terang & gelap.
- **Mode fokus:** layar penuh, hanya di beranda dan halaman story.

## Menjalankan

Prasyarat: Python 3.10+ dan Node.js.

```bash
python -m venv venv
venv\Scripts\activate            # Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
npm install
```

Build CSS (terminal terpisah, biarkan jalan saat pengembangan):

```bash
npx @tailwindcss/cli -i static/input.css -o static/output.css --watch
```

Jalankan aplikasi, lalu buka `http://127.0.0.1:5000`:

```bash
python app.py
```

Terminal menampilkan jumlah bait yang dimuat dari `bait/`. Jika kosong, server berhenti.

## Struktur

```text
puisi/
├── app.py
├── requirements.txt
├── package.json
├── bait/                 # koleksi bait (.txt)
├── static/
│   ├── input.css         # sumber Tailwind
│   ├── output.css        # hasil build
│   ├── app.css           # variabel tema
│   └── *.js              # theme, palet, fav, story
└── templates/
```

## Menambah Bait

Buat `bait/nama.txt` (UTF-8):

```text
# Judul Koleksi

Baris pertama.
Baris kedua.

Bait berikutnya.
Baris kedua.
— Penulis
```

- Baris kosong memisahkan bait.
- `# Judul` = sumber yang tampil di bawah puisi; `— Penulis` menggantikannya untuk bait itu.
- Berkas berawalan `_` diabaikan.
- Restart server setelah mengubah `bait/`.
- Ubah isi atau urutan bait mengubah id `?b=` bait itu.


## Lisensi

© 2026 Hanif Amar. All Rights Reserved.

Kode dan konten hanya untuk demonstrasi/portofolio. Dilarang menyalin, memodifikasi, atau mendistribusikan tanpa izin tertulis.