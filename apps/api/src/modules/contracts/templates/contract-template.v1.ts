import { text } from "stream/consumers";

export const ContractTemplateV1 = {
  templateVersion: 1,
  company: {
    brand: 'DUNIA GADAI',
    legalName: 'PT. SOLUSI GADAI KITA',
    ahu: '0095130.AH.01.01.2025',
    addressLine: 'Cokroatmojo 74. Parteker, Pamekasan',
    phone: '089503917722',
  },
  clauses: [
    {
      no: 1,
      text: 'Menyatakan barang tersebut milik pribadi dan tidak terpaut dengan tindak kejahatan.',
    },
    {
      no: 2,
      text: 'Menyatakan bahwa barang jaminan tersebut asli, bukan replika dan tidak tertanggung dengan pihak pembiayaan.',
    },
    {
      no: 3,
      text: 'Apabila terjadi kehilangan, kebakaran, serta bencana alam, maka pihak SGK akan mengganti senilai barang dan kondisi saat gadai setelah melakukan pelunasan atas pinjaman tersebut .',
    },
    {
      no: 4,
      text: "Apabila saya dengan sengaja ataupun tidak sengaja telah menghilangkan surat perjanjian ini maka saya tidak akan menuntut SGK, terhadap barang tersebut karena kesalahan saya"
    },
    {
      no: 5,
      text: "Menyatakan bahwa saya telah menyetujui nilai taksiran dan nilai pinjaman yang ditentukan oleh pihak SGK"
    },
    {
      no: 6,
      text: "Tingkat sewa modal SGK, adalah tenor 0-15 hari sewa modal 5%, tenor 16-30 hari sewa modal 10% "
    },
    {
      no: 7,
      text: "Pada saat jatuh tempo saya tidak dapat melunasi pinjaman saya kepada pihak SGK, maka saya akan memberikan kuasa penuh kepada SGK, untuk menjual barang tersebut guna untuk melunasi hutang beserta sewa modal yang timbul, apabila terdapat kelebihan setelah dikurangi hutang, pinjaman menjual, biaya transportasi serta biaya lain yang timbul akibat penjual tersebut maka cepat mengambilnya N+20 jatuh tempo hingga 1 tahun"
    },
    {
      no: 8,
      text: "Apabila terjadi sengketa atau aduan dikemudian hari akan diselesaikan secara musyawarah dan jika tidak terjadi kesepakatan maka akan diselesaikan melalui LAPS SJK (Lembaga Alternatif Penyelesaian Sengketa Sektor Jasa Keuangan)"
    },
    {
      no: 9,
      text: "Nasabah menyatakan tunduk dan patuh serta mengikuti segala peraturan yang berlaku di SGK, sejak surat perjanjian ini ditandatangani"
    },
    {
      no: 10,
      text: "Apabila pernyataan ini tidak benar, maka saya tidak akan melibatkan SGK, untuk urusan hukum apapun. Saya telah menerima uang sebesar ... Dan saya memnuhi peraturan yang berlaku"
    }
  ],
};
