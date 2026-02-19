## A. Product Overview

### Problem Statement

Banyak web Al-Quran terasa berat di mobile, tampilan tidak konsisten, dan fitur dasar seperti bookmark, last read, search, serta audio sering lambat atau tidak stabil. Kita butuh **Alquran Web App** yang **full gratis**, **mobile-first**, **rapi**, **cepat**, dan **bisa di-install sebagai PWA**, dengan **MVP fokus baca** tanpa login.

### Target Users / Personas

* **U1: Pembaca Harian (Mobile-first)**: baca cepat, lanjut dari terakhir, night mode.
* **U2: Pembaca Target Ayat**: sering lompat surah/ayat, butuh navigasi cepat dan search.
* **U3: Pendengar Murottal**: butuh audio ayat per ayat, auto-next, hemat kuota.
* **U4: Pengguna Low-end Device**: sensitif terhadap load time, butuh UX ringan.

### Goals & Success Metrics (KPIs)

* **Performance**

  * First load (cold) <= **3 detik** pada jaringan mobile.
  * Lighthouse **>= 95** (Performance, Accessibility, Best Practices, SEO).
* **Engagement**

  * 7-day returning users (indikatif) meningkat via “last read” dan bookmark.
* **Reliability**

  * Error rate request API < 1% per sesi (client-side).
* **PWA adoption**

  * Install rate (opt-in) dari prompt install.

> Sumber data: **Al Quran Cloud API** untuk teks dan audio edition, base `https://api.alquran.cloud/v1/` dan default edition `quran-uthmani` jika tidak ditentukan. ([alquran.cloud][1])

---

## B. Scope

### In Scope (MVP)

* Baca Al-Quran **per surah** dan **per ayat**.
* Navigasi cepat: daftar surah, jump to ayah, next/prev ayah, scroll-to-ayah.
* Search (minimal): cari kata kunci dan tampilkan hasil ayat.
* Bookmark ayat.
* Last read (posisi terakhir).
* Pengaturan: font size, night mode.
* Audio playback (jika tersedia via edition audio atau CDN).
* PWA installable: manifest + service worker + caching strategis.
* Penyimpanan preferensi **lokal** (IndexedDB/localStorage), tanpa login.

### Out of Scope (MVP)

* Login, sinkronisasi cloud, multi-device.
* Tafsir, multi-terjemahan kompleks, highlight tajwid lanjutan.
* Komunitas, catatan, share, komentar.
* Backend admin panel dan analytics server-side.

### Phase 2 / Future Enhancements

* Google Login untuk sinkronisasi bookmark, last read, setting.
* Multi-terjemahan, tafsir, transliterasi, parallel view.
* Mode offline lengkap (download paket surah, audio).
* Juz, halaman (604), hizb, manzil, sajda list.
* Advanced audio: playlist, surah-level streaming, speed control.
* Admin dashboard, moderation konten (jika ada konten tambahan), A/B experimentation.

---

## C. User Roles & Permissions

### Roles

* **R1: Anonymous Reader (MVP)**: semua fitur baca dan personalisasi lokal.
* **R2: Signed-in User (Phase 2)**: sama seperti R1 + sinkronisasi.
* **R3: Admin (Phase 2)**: konfigurasi default edition, monitoring, audit/analytics.

### Permission Matrix (feature x role)

| Feature                     | R1 Anonymous (MVP) | R2 Signed-in (P2) | R3 Admin (P2) |
| --------------------------- | -----------------: | ----------------: | ------------: |
| Baca Surah/Ayat             |                  ✅ |                 ✅ |             ✅ |
| Search                      |                  ✅ |                 ✅ |             ✅ |
| Bookmark                    |          ✅ (lokal) |          ✅ (sync) |             ✅ |
| Last Read                   |          ✅ (lokal) |          ✅ (sync) |             ✅ |
| Font Size, Night Mode       |          ✅ (lokal) |          ✅ (sync) |             ✅ |
| Audio Playback              |                  ✅ |                 ✅ |             ✅ |
| PWA Install                 |                  ✅ |                 ✅ |             ✅ |
| Konfigurasi default edition |                  ❌ |                 ❌ |             ✅ |
| Analytics dashboard         |                  ❌ |                 ❌ |             ✅ |
| Audit log server-side       |                  ❌ |      ✅ (view own) |  ✅ (view all) |

### Audit Trail Guidance (minimal, MVP)

* **Client-side audit log (lokal)** untuk debugging dan QA:

  * Event penting: `bookmark_add/remove`, `last_read_update`, `preference_change`, `audio_play/pause`, `search_execute`.
  * Disimpan di IndexedDB dengan TTL (misal 7 hari) dan bisa dihapus dari Settings.
* **Phase 2**: audit log server-side per user + admin access.

---

## D. User Journeys

### Flow 1: Buka app dan lanjut baca terakhir

1. User buka URL atau PWA icon.
2. App load cepat, render app shell.
3. App baca `lastRead`, tampilkan CTA “Lanjutkan”.
4. User tap, langsung scroll ke ayat terakhir.

### Flow 2: Pilih Surah dan baca ayat

1. User buka daftar surah.
2. Pilih surah.
3. Ayat tampil rapi, bisa next/prev dan jump ayah.

### Flow 3: Search kata kunci

1. User input keyword.
2. App panggil endpoint search.
3. Hasil tampil: surah, nomor ayat, cuplikan.
4. Tap hasil membuka surah dan fokus ke ayat.

### Flow 4: Bookmark ayat

1. User tap ikon bookmark pada ayat.
2. App simpan bookmark lokal.
3. Bookmark list bisa dibuka dan navigate balik.

### Flow 5: Audio ayat

1. User tap play pada ayat.
2. Audio streaming, bisa pause, next/prev ayat.
3. Auto-advance ke ayat berikutnya bila enabled.

### Flow 6: Night mode dan font size

1. User buka settings.
2. Toggle night mode, atur font size.
3. Setting persisten lokal dan apply real-time.

---

## E. Functional Requirements (by module)

### Module E1. Data Sources & API Orchestration

**Description**: Ambil data surah/ayah/search/audio dari Al Quran Cloud API, dengan strategi request minim dan caching.

**Key endpoints (referensi)**

* List surah: `GET /surah` ([alquran.cloud][1])
* Surah detail: `GET /surah/{surah}/{edition}` atau multi-edition `GET /surah/{surah}/editions/{edition1},{edition2}` ([alquran.cloud][1])
* Ayah detail: `GET /ayah/{reference}/{edition}` (reference bisa `2:255` atau nomor global) ([alquran.cloud][1])
* Search: `GET /search/{keyword}/{surah|all}/{edition|language}` ([alquran.cloud][1])
* Audio CDN by ayah (fallback): `https://cdn.islamic.network/quran/audio/{bitrate}/{edition}/{number}.mp3` ([alquran.cloud][2])

**User Stories**

* **PRD-001**: Sebagai user, saya bisa melihat daftar surah agar bisa memilih surah untuk dibaca.
* **PRD-002**: Sebagai user, saya bisa membuka surah dan melihat semua ayat dengan teks yang konsisten.
* **PRD-003**: Sebagai user, saya bisa membuka surah dengan data multi-edition (teks + audio) agar request lebih sedikit.

**Requirements**

* Must

  * Gunakan `Accept-Encoding: gzip` (atau zstd jika feasible) untuk efisiensi payload. ([alquran.cloud][1])
  * Default edition teks: `quran-uthmani` (konsisten dengan API default). ([alquran.cloud][1])
  * Default audio edition (asumsi): `ar.alafasy`, dapat diubah via config (Phase 2). ([alquran.cloud][2])
* Should

  * Multi-edition endpoint untuk surah agar text + audio bisa didapat dalam 1 call.
* Could

  * Prefetch surah berikutnya saat user mendekati akhir surah (berbasis heuristik).

**Validation Rules**

* Surah number 1–114, ayah in-surah sesuai metadata API.
* Keyword search minimal 2 karakter (untuk menghindari spam request).

**Error States**

* API timeout, 5xx, atau offline.
* CORS issue (fallback: switch base domain API alternatif yang disediakan Al Quran Cloud). ([alquran.cloud][1])
* Audio edition tidak mengembalikan URL.

**Acceptance Criteria**

* Given user membuka halaman Surah List, When app memanggil `GET /surah`, Then daftar 114 surah tampil dengan nama dan nomor.
* Given user memilih surah 114, When app memanggil endpoint surah, Then ayat tampil lengkap dan urut.
* Given API gagal (timeout), When user membuka surah, Then tampil error state dengan opsi retry dan tetap menjaga app shell usable.

---

### Module E2. Reader Experience (Surah & Ayah View)

**Description**: Tampilan baca yang rapi, mobile-first, fokus keterbacaan, minimal distraksi.

**User Stories**

* **PRD-004**: Sebagai user, saya bisa baca ayat dengan layout yang nyaman di layar kecil.
* **PRD-005**: Sebagai user, saya bisa lompat ke ayat tertentu (jump to ayah).
* **PRD-006**: Sebagai user, saya bisa next/prev ayat secara cepat.

**Requirements**

* Must

  * Ayat tampil dengan nomor ayat yang jelas.
  * Jump to ayah: input numerik, auto-scroll ke ayat target.
  * State URL shareable (tanpa login): `/surah/{n}#ayah={k}` (atau setara) agar deep link.
* Should

  * Sticky mini-bar: Surah name, ayah position, tombol jump dan audio.
* Could

  * Mode “focus reading” (hide header saat scroll).

**Validation Rules**

* Input jump ayah harus 1..jumlah ayat surah.
* Deep link yang invalid fallback ke ayat 1.

**Error States**

* Ayah target tidak ditemukan (data belum loaded atau mismatch).

**Acceptance Criteria**

* Given user di Surah view, When user memasukkan ayah “10” dan submit, Then app scroll ke ayah 10 dan menyorot ayah tersebut.
* Given user tap Next, When ayah saat ini bukan ayah terakhir, Then fokus pindah ke ayah berikutnya.
* Given user berada di ayah terakhir, When tap Next, Then tampil toast “Sudah ayat terakhir” dan tidak crash.

---

### Module E3. Search

**Description**: Pencarian ayat berbasis keyword via endpoint search.

**User Stories**

* **PRD-007**: Sebagai user, saya bisa search kata kunci di seluruh Quran agar cepat menemukan ayat.
* **PRD-008**: Sebagai user, saya bisa tap hasil search untuk membuka ayat terkait.

**Requirements**

* Must

  * Gunakan endpoint `GET /search/{keyword}/all/{edition|language}`. ([alquran.cloud][1])
  * Tampilkan hasil: surah, nomor ayat, snippet singkat (truncate).
  * Tap hasil -> buka surah dan fokus ke ayat.
* Should

  * Debounce input (misal 300 ms) dan batasi request paralel.
* Could

  * Toggle scope: “Semua” vs “Surah ini”.

**Validation Rules**

* Keyword minimal 2 char.
* Rate limit client-side: max 1 request per 500 ms.

**Error States**

* Hasil kosong.
* API search gagal.

**Acceptance Criteria**

* Given user mengetik keyword valid, When app memanggil endpoint search, Then hasil muncul maksimal 2 detik pada koneksi normal.
* Given hasil kosong, When search selesai, Then tampil state “Tidak ditemukan” plus saran ubah keyword.
* Given user tap satu hasil, When navigasi dilakukan, Then surah terbuka dan ayat target tersorot.

---

### Module E4. Bookmarks & Last Read (Local Persistence)

**Description**: Simpan bookmark dan posisi baca terakhir secara lokal.

**User Stories**

* **PRD-009**: Sebagai user, saya bisa bookmark ayat agar bisa kembali lagi.
* **PRD-010**: Sebagai user, saya bisa melihat daftar bookmark.
* **PRD-011**: Sebagai user, aplikasi mengingat last read otomatis.

**Requirements**

* Must

  * Bookmark add/remove per ayat.
  * Bookmark list: sort by latest added.
  * Last read update saat user scroll melewati threshold (misal ayat aktif berubah).
  * Storage: IndexedDB untuk bookmark, lastRead, audit log, cache metadata. localStorage untuk preferences ringan.
* Should

  * Export/Import lokal (Phase 2 lebih cocok, tapi bisa dipertimbangkan).
* Could

  * Tag bookmark (Phase 2).

**Validation Rules**

* Tidak boleh duplicate bookmark untuk surah+ayah yang sama.
* LastRead harus menyimpan `surahNumber`, `ayahNumber`, `timestamp`.

**Error States**

* Storage quota penuh.
* IndexedDB gagal (private mode tertentu).

**Acceptance Criteria**

* Given user menekan bookmark pada ayah, When disimpan, Then ikon berubah state dan entry muncul di bookmark list.
* Given user menghapus bookmark, When confirm, Then entry hilang dan state ayah kembali normal.
* Given user menutup app lalu membuka lagi, When app load, Then CTA “Lanjutkan” mengarah ke posisi last read terakhir.

---

### Module E5. Preferences (Font Size, Night Mode)

**Description**: Personalisasi tampilan baca yang persisten lokal.

**User Stories**

* **PRD-012**: Sebagai user, saya bisa mengubah ukuran font agar nyaman.
* **PRD-013**: Sebagai user, saya bisa mengaktifkan night mode.

**Requirements**

* Must

  * Font size memiliki range terdefinisi (misal 3 level atau slider dengan min/max).
  * Night mode mengubah background, teks, dan kontras sesuai aksesibilitas.
  * Preferensi tersimpan lokal dan ter-apply saat load.
* Should

  * Mengikuti preferensi OS (`prefers-color-scheme`) sebagai default awal.
* Could

  * Font family pilihan (Phase 2).

**Validation Rules**

* Simpan hanya nilai dalam range yang diizinkan.

**Error States**

* localStorage tidak tersedia.

**Acceptance Criteria**

* Given user mengubah font size, When kembali ke surah, Then ukuran font tetap konsisten.
* Given user toggle night mode, When refresh, Then mode tetap sama seperti terakhir.

---

### Module E6. Audio Playback

**Description**: Playback audio per ayat, dengan fallback CDN jika perlu.

**User Stories**

* **PRD-014**: Sebagai user, saya bisa memutar audio ayat yang sedang dibaca.
* **PRD-015**: Sebagai user, saya bisa pause/resume, next/prev ayat.
* **PRD-016**: Sebagai user, audio bisa auto-advance ke ayat berikutnya.

**Requirements**

* Must

  * Mengambil audio dari edition audio (contoh `ar.alafasy`) via endpoint surah/ayah. ([alquran.cloud][1])
  * Fallback ke CDN by-ayah URL jika response audio tidak ada. ([alquran.cloud][2])
  * Handle pembatasan autoplay browser (user gesture wajib).
* Should

  * Buffering indicator.
  * Simpan state audio terakhir (opsional) untuk resume per sesi.
* Could

  * Surah-level audio via CDN `audio-surah` (Phase 2 atau optional). ([alquran.cloud][2])

**Validation Rules**

* Bitrate default 128, fallback 64 jika koneksi lambat (heuristik).

**Error States**

* Audio 404 atau edition tidak tersedia.
* Network drop di tengah playback.

**Acceptance Criteria**

* Given user tap Play pada ayah, When audio tersedia, Then audio mulai dalam <= 1.5 detik (koneksi normal) dan UI berubah ke state playing.
* Given audio selesai, When auto-advance aktif dan bukan ayah terakhir, Then otomatis pindah dan memutar ayah berikutnya.
* Given audio gagal load, When retry, Then app mencoba bitrate lebih rendah atau fallback URL, dan jika tetap gagal tampil error yang actionable.

---

### Module E7. PWA, Caching, dan Performance Budget

**Description**: PWA installable, caching cerdas untuk speed dan resilience.

**User Stories**

* **PRD-017**: Sebagai user, saya bisa install app ke homescreen.
* **PRD-018**: Sebagai user, kunjungan kedua terasa jauh lebih cepat karena caching.
* **PRD-019**: Sebagai user, app tetap bisa dibuka saat offline (minimal app shell + data terakhir).

**Requirements**

* Must

  * Web App Manifest (name, icons, start_url, display standalone).
  * Service Worker dengan strategi:

    * App shell: cache-first.
    * API response surah yang pernah dibuka: stale-while-revalidate.
    * Asset static: immutable caching.
  * Performance budgets (target internal):

    * LCP <= 2.5s pada device mid-range.
    * Total JS initial bundle ditekan (code splitting, lazy load audio module).
* Should

  * Preconnect ke `api.alquran.cloud` dan `cdn.islamic.network`.
* Could

  * “Download for offline” per surah (Phase 2).

**Validation Rules**

* Cache eviction policy: LRU, batas ukuran (misal max 50 surah tersimpan).

**Error States**

* Service worker gagal register.
* Cache storage quota penuh.

**Acceptance Criteria**

* Given user membuka app di mobile browser, When memilih “Add to Home Screen”, Then app berjalan mode standalone dan icon/branding benar.
* Given user sudah pernah membuka surah, When membuka lagi, Then render konten terjadi lebih cepat dibanding cold load.
* Given user offline, When membuka app, Then app shell tetap tampil dan menampilkan pesan offline yang jelas, serta memungkinkan membuka surah yang sudah tercache.

---

### Module E8. Observability, Diagnostics, dan Audit (Minimal)

**Description**: Minimal instrumentation untuk memastikan SLA performance dan debugging.

**User Stories**

* **PRD-020**: Sebagai QA/engineer, saya bisa melihat halaman diagnostics untuk cek cache, versi, dan error terakhir.
* **PRD-021**: Sebagai user, saya bisa menghapus cache dan data lokal dari settings.

**Requirements**

* Must

  * Diagnostics screen (opsional hidden toggle) menampilkan:

    * App version, build hash
    * Cache size (approx)
    * Last API fetch time
    * Last 20 audit events (lokal)
    * Error log ringkas (tanpa data sensitif)
  * Tombol “Reset data lokal” (hapus IndexedDB + localStorage terpilih + cache).
* Should

  * Capture web vitals (CLS, LCP) ke log lokal.
* Could

  * Export diagnostics JSON untuk bug report (Phase 2).

**Acceptance Criteria**

* Given user menekan “Reset data lokal”, When confirm, Then semua bookmark, last read, preferences kembali default dan app restart ke state bersih.
* Given terjadi error API, When membuka diagnostics, Then entry error muncul dengan timestamp.

---

## F. Data Model (high level)

### Entities (IndexedDB kecuali disebut lain)

| Entity                      | Key Fields                                               | Relationships        | Constraints                        |
| --------------------------- | -------------------------------------------------------- | -------------------- | ---------------------------------- |
| `SurahMeta`                 | `surahNumber`, `name`, `englishName`, `ayahCount`        | none                 | unique `surahNumber`               |
| `AyahRef`                   | `surahNumber`, `ayahNumber`, `globalAyahNumber`          | belongs to SurahMeta | unique `(surahNumber, ayahNumber)` |
| `Bookmark`                  | `id`, `surahNumber`, `ayahNumber`, `createdAt`, `note?`  | references AyahRef   | unique `(surahNumber, ayahNumber)` |
| `LastRead`                  | `id=singleton`, `surahNumber`, `ayahNumber`, `updatedAt` | references AyahRef   | singleton                          |
| `Preference` (localStorage) | `nightMode`, `fontScale`, `audioAutoAdvance`             | none                 | validated range                    |
| `CacheIndex`                | `cacheKey`, `type`, `updatedAt`, `sizeApprox`            | none                 | unique `cacheKey`                  |
| `AuditEvent`                | `id`, `eventName`, `payload`, `timestamp`                | none                 | TTL 7 hari                         |

### Audit Log Entities

* MVP: `AuditEvent` lokal saja.
* Phase 2: tambah `ServerAuditEvent(userId, eventName, payload, ts, ipHash)`.

---

## G. Reporting & Dashboard

### MVP (tanpa backend)

* **Diagnostics dashboard (in-app)** untuk QA dan monitoring ringan:

  * Cache hit rate indikatif (approx dari log).
  * Error counts per sesi.
  * Web vitals snapshot.

### Phase 2

* Admin dashboard:

  * DAU/WAU, retention, install rate PWA.
  * Search success rate (hasil ditemukan vs tidak).
  * Audio play success rate.
  * Error rate per endpoint, latensi median.

---

## H. Non-Functional Requirements

### Security

* Tidak ada login di MVP, tetapi tetap:

  * CSP dasar untuk mencegah XSS.
  * Sanitasi input search (client-side) sebelum request.
  * Tidak menyimpan data sensitif user.
* Session: N/A (MVP).
* Encryption: tidak wajib untuk storage lokal, namun hindari menyimpan PII.

### Performance

* First load <= 3 detik (mobile network).
* Lighthouse >= 95.
* Teknik:

  * Code splitting, lazy load audio module.
  * Gunakan `Accept-Encoding` kompresi. ([alquran.cloud][1])
  * Caching service worker dan HTTP caching headers.
  * Minimal font loading, gunakan fallback system font, font Arab optimized.

### Reliability/Backup

* Tanpa backend, backup N/A.
* Recovery: tombol reset data lokal.
* Fallback base domain API alternatif jika primary bermasalah. ([alquran.cloud][1])

### Logging/Monitoring

* Client-side error log ringkas + audit event lokal.
* Phase 2: central logging (Sentry atau setara) dengan consent.

### Compliance

* Pastikan lisensi dan Terms API dipatuhi (Phase 2: tampilkan attribution dan link Terms jika diminta).

---

## I. Analytics & Events (recommended)

### Event List (MVP, lokal dulu)

* `app_open`
* `surah_open` {surahNumber}
* `ayah_focus` {surahNumber, ayahNumber}
* `search_execute` {keywordLength, scope}
* `search_result_open` {surahNumber, ayahNumber}
* `bookmark_add/remove` {surahNumber, ayahNumber}
* `last_read_update` {surahNumber, ayahNumber}
* `preference_change` {key, value}
* `audio_play/pause/end/error` {surahNumber, ayahNumber, bitrate}

### Funnel contoh

`app_open` -> `surah_open` -> `ayah_focus` -> `bookmark_add` atau `audio_play`

---

## J. Risks & Mitigations

| Risk                                | Impact                          | Mitigation                                                                                                     |
| ----------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| API down/latensi tinggi             | App unusable, gagal SLA 3 detik | Cache agresif, fallback base domain, retry dengan backoff, tampil offline-friendly state. ([alquran.cloud][1]) |
| Audio edition tidak lengkap/berubah | Playback gagal                  | Fallback CDN by-ayah, fallback bitrate, graceful error. ([alquran.cloud][2])                                   |
| Storage quota terbatas              | Cache/bookmark gagal simpan     | LRU eviction, batas cache, pesan “storage penuh”, reset tools                                                  |
| Autoplay diblok browser             | UX audio rusak                  | Wajib user gesture, UI jelas, simpan preference auto-advance saja                                              |
| Bundle membengkak                   | Lighthouse turun                | Performance budget, dependency audit, build analyzer, lazy load                                                |
| Search lambat untuk keyword umum    | UX buruk                        | Debounce, pagination (jika API support via response chunking, jika tidak, batasi render dan virtual list)      |

---

## K. Milestones / Release Plan

### Milestone 1: Foundation + App Shell (MVP core)

* Setup project, routing, design system minimal.
* Surah list + surah reader basic.
* Local preferences (font, night mode).
* IndexedDB setup (bookmark, last read skeleton).

### Milestone 2: Navigation + Search + Persistence

* Jump to ayah, next/prev.
* Bookmark CRUD + list.
* Last read update reliable.
* Search end-to-end via endpoint search. ([alquran.cloud][1])

### Milestone 3: Audio + PWA + Performance Hardening

* Audio playback per ayah, auto-advance, fallback CDN. ([alquran.cloud][2])
* PWA manifest + service worker caching strategy.
* Lighthouse tuning sampai >= 95, first load <= 3 detik.

---