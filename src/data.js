const INITIAL_ENTRIES = [
  // PENITIPAN / TOP UP / MODAL (Positive)
  {
    id: "init_1",
    nominal: 1650000,
    keterangan: "ISHAN Ahmad",
    tanggal: "2026-06-30",
    tipe: "masuk", // 'masuk' = cash in / deposit
    kategori: "modal"
  },
  {
    id: "init_2",
    nominal: 1650000,
    keterangan: "ARVIN LPG",
    tanggal: "2026-06-30",
    tipe: "masuk",
    kategori: "modal"
  },
  {
    id: "init_3",
    nominal: 1650000,
    keterangan: "Faqih Rizal LPG",
    tanggal: "2026-07-03",
    tipe: "masuk",
    kategori: "modal"
  },
  {
    id: "init_4",
    nominal: 1650000,
    keterangan: "ASEP & PIAN LPG",
    tanggal: "2026-06-29",
    tipe: "masuk",
    kategori: "modal"
  },
  {
    id: "init_5",
    nominal: 1650000,
    keterangan: "LUBIS, ARVIN LPG",
    tanggal: "2026-06-19",
    tipe: "masuk",
    kategori: "modal"
  },
  {
    id: "init_6",
    nominal: 1650000,
    keterangan: "LPG Dika Fauzi",
    tanggal: "2026-07-04",
    tipe: "masuk",
    kategori: "modal"
  },
  {
    id: "init_7",
    nominal: 1180000,
    keterangan: "TF AMIRUDIN FAUZI",
    tanggal: "2026-06-10",
    tipe: "masuk",
    kategori: "transfer"
  },
  {
    id: "init_8",
    nominal: 8158000,
    keterangan: "INFAQ Jumat",
    tanggal: "2026-07-03",
    tipe: "masuk",
    kategori: "infaq"
  },

  // BEBAN / EXPENSES (Negative)
  {
    id: "init_9",
    nominal: 17000,
    keterangan: "Beli bateri Fauzi",
    tanggal: "2026-07-02",
    tipe: "keluar", // 'keluar' = cash out / expense
    kategori: "beban"
  },
  {
    id: "init_10",
    nominal: 38000,
    keterangan: "Beli pen/polpen",
    tanggal: "2026-06-26",
    tipe: "keluar",
    kategori: "beban"
  },
  {
    id: "init_11",
    nominal: 24000,
    keterangan: "Pemberian buku - Michael Br. Amirudin",
    tanggal: "2026-01-19",
    tipe: "keluar",
    kategori: "beban"
  },
  {
    id: "init_12",
    nominal: 280000,
    keterangan: "Bon tempat slip - Zidhan & Bp Udin",
    tanggal: "2026-01-28",
    tipe: "keluar",
    kategori: "beban"
  },
  {
    id: "init_13",
    nominal: 116300,
    keterangan: "Beli tinta + kertas stiker - Arvin & Bp Udin",
    tanggal: "2026-06-26",
    tipe: "keluar",
    kategori: "beban"
  },
  {
    id: "init_14",
    nominal: 138000,
    keterangan: "Bon HVS",
    tanggal: "2026-07-04", // Date not fully specified, default to early July
    tipe: "keluar",
    kategori: "beban"
  },
  {
    id: "init_15",
    nominal: 300000,
    keterangan: "Bon TRF ke Rek Yayasan - Futihah",
    tanggal: "2025-01-13",
    tipe: "keluar",
    kategori: "transfer"
  },
  {
    id: "init_16",
    nominal: 27047,
    keterangan: "Uang Rusak",
    tanggal: "2026-07-04",
    tipe: "keluar",
    kategori: "beban"
  },
  {
    id: "init_17",
    nominal: 100000,
    keterangan: "Dimasukan ke Rek BSI",
    tanggal: "2024-04-22",
    tipe: "keluar",
    kategori: "transfer"
  },

  // PENGAMBILAN / CASH OUT (Negative)
  {
    id: "init_18",
    nominal: 50000,
    keterangan: "Abdullah",
    tanggal: "2026-06-09",
    tipe: "keluar",
    kategori: "pengambilan"
  },
  {
    id: "init_19",
    nominal: 16000,
    keterangan: "SHIFT C - Tagih Asep, Arvin, Edho",
    tanggal: "2026-05-26",
    tipe: "keluar",
    kategori: "pengambilan"
  },
  {
    id: "init_20",
    nominal: 22000,
    keterangan: "Arba Mike",
    tanggal: "2026-06-25",
    tipe: "keluar",
    kategori: "pengambilan"
  },
  {
    id: "init_21",
    nominal: 20000,
    keterangan: "Abdullah, Ishan, Fauzi, Asep",
    tanggal: "2026-07-04",
    tipe: "keluar",
    kategori: "pengambilan"
  },
  {
    id: "init_22",
    nominal: 5000,
    keterangan: "Mboh REK",
    tanggal: "2026-07-04",
    tipe: "keluar",
    kategori: "pengambilan"
  },
  {
    id: "init_23",
    nominal: 72000,
    keterangan: "SHIFT B - Edho, Isnan, Arvin, Fauzi",
    tanggal: "2026-07-03",
    tipe: "keluar",
    kategori: "pengambilan"
  },
  {
    id: "init_24",
    nominal: 80000,
    keterangan: "Uang pecahan silang kurang - Shift B, C",
    tanggal: "2026-06-25",
    tipe: "keluar",
    kategori: "pengambilan"
  }
];

const INITIAL_SMARTCARD_BALANCE = 0;
