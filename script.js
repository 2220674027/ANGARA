// ==================================
// ANGARA - Harita Sistemi
// ==================================
// ==================================
// ANGARA - Oyuncu Bilgileri
// ==================================

let oyunBasladi = false;
let secilenMahalle = null;
let oyuncuMahallesi = null;
// ==========================================
// ANGARA - FETİH SİSTEMİ
// ==========================================

// Oyuncunun kontrol ettiği mahalleler
let kontrolEdilenMahalleler = [];

let oyuncu = {
    altin: 1000,
    nufus: 5000,
    dost: 20,
    silah: 10,
    kontrolEdilenMahalle: 1
};
// Ankara merkez koordinatları
const ankaraKonum = [39.9334, 32.8597];

// Haritayı oluştur
const map = L.map("map", {
    center: ankaraKonum,
    zoom: 10,
    minZoom: 7,
    maxZoom: 18
});







// ==================================
// ANGARA - İlçe Sınırları
// ==================================
let ilceKatmani = null;
fetch("data/ankara_ilceler.geojson")
    .then(response => {
        if (!response.ok) {
            throw new Error("İlçe verisi yüklenemedi!");
        }
        return response.json();
    })
    .then(data => {

        const ilceler = ilceKatmani = L.geoJSON(data, {

    // Sadece ilçe sınırlarını göster
    filter: function(feature) {
        return feature.geometry &&
            (
                feature.geometry.type === "Polygon" ||
                feature.geometry.type === "MultiPolygon"
            );
    },

    style: {
        color: "#f59e0b",
        weight: 2,
        fillColor: "#f59e0b",
        fillOpacity: 0.12
    },

            onEachFeature: function(feature, layer) {

          

                const ilceAdi =
                    feature.properties?.name || "Bilinmeyen İlçe";

                layer.bindPopup(
                    `<b>🏙️ ${ilceAdi}</b><br>ANGARA`
                );

                layer.on("mouseover", function() {
                    this.setStyle({
                        fillOpacity: 0.35,
                        weight: 3
                    });
                });

                layer.on("mouseout", function() {
                    ilceler.resetStyle(this);
                });

            }

        }).addTo(map);

        map.fitBounds(ilceler.getBounds());

        console.log(
            "ANGARA: İlçe sınırları başarıyla yüklendi!"
        );

    })
    .catch(error => {
        console.error("ANGARA HATA:", error);
    });
    // ==================================
// ANGARA - Mahalle Sınırları
// ==================================

let mahalleKatmani;

fetch("data/ankara_mahalleler.geojson")
    .then(response => {
        if (!response.ok) {
            throw new Error("Mahalle verileri yüklenemedi!");
        }

        return response.json();
    })
    .then(data => {

        let mahalleSayisi = 0;

        mahalleKatmani = L.geoJSON(data, {

            // Yalnızca isimli poligonları göster
            filter: function(feature) {

                const geometry = feature.geometry;
                const properties = feature.properties || {};

                const isim = properties.name;

                return (
                    geometry &&
                    (
                        geometry.type === "Polygon" ||
                        geometry.type === "MultiPolygon"
                    ) &&
                    typeof isim === "string" &&
                    isim.trim() !== "" &&
                    /mahalle|mahallesi|mah\./i.test(isim)
                );
            },

            // Mahallelerin görünümü
            style: {
                color: "#64748b",
                weight: 1,
                fillColor: "#334155",
                fillOpacity: 0.25
            },

            onEachFeature: function(feature, layer) {

                mahalleSayisi++;

                const mahalleAdi = feature.properties.name;

                // Mahalleye tıklanınca bilgi göster
                // Mahalle seçme sistemi

layer.on("click", function() {

   if (oyunBasladi) {

    // Kendi mahallemize tıklarsak
    if (
        kontrolEdilenMahalleler.some(
            mahalle => mahalle.katman === layer
        )
    ) {

        // Saldırı panelini kapat
        saldiriPaneliniKapat();

        // Geliştirme panelini aç
        gelistirmePaneliniAc(layer);

    }

    // Yeşil komşu mahalleye tıklarsak
    else if (komsuMahalleler.includes(layer)) {

        // Saldırı panelini aç
        saldiriPaneliniAc(layer);

    }

    return;
}

    

    secilenMahalle = {
        ad: mahalleAdi,
        katman: layer
    };

    layer.bindPopup(`
        <div style="text-align:center; min-width:180px;">

            <h3>🏘️ ${mahalleAdi}</h3>

            <p>Bu mahalleden başlamak ister misin?</p>

            <button id="oyunaBaslaBtn"
                style="
                    background:#f59e0b;
                    color:#111827;
                    border:none;
                    padding:10px 15px;
                    border-radius:6px;
                    cursor:pointer;
                    font-weight:bold;
                ">
                🎮 OYUNA BAŞLA
            </button>

        </div>
    `).openPopup();

});

                // Fare mahalle üzerine gelince
                layer.on("mouseover", function() {

                    this.setStyle({
                        color: "#f59e0b",
                        weight: 2,
                        fillOpacity: 0.5
                    });

                });

                // Fare mahalleden ayrılınca
                layer.on("mouseout", function() {

                    // Kendi mahallemizin rengini koru
if (
    oyunBasladi &&
    kontrolEdilenMahalleler.some(
        mahalle => mahalle.katman === this
    )
) {

    // Bizim mahallelerimiz mavi
    this.setStyle({
        color: "#38bdf8",
        weight: 3,
        fillColor: "#0284c7",
        fillOpacity: 0.8
    });

} else if (
    oyunBasladi &&
    komsuMahalleler.includes(this)
) {

    // Komşu mahalleler yeşil
    this.setStyle({
        color: "#22c55e",
        weight: 2,
        fillColor: "#16a34a",
        fillOpacity: 0.5
    });

} else {

    // Diğer mahalleler normal
    mahalleKatmani.resetStyle(this);

}

                });

            }

        }).addTo(map);

        console.log(
            "ANGARA - Yüklenen mahalle sayısı:",
            mahalleSayisi
        );

    })
    .catch(error => {
        console.error("ANGARA MAHALLE HATASI:", error);
    });
    // ==================================
// ANGARA - Oyunu Başlat
// ==================================

map.on("popupopen", function(e) {

    const buton = e.popup.getElement()
        .querySelector("#oyunaBaslaBtn");

    if (!buton) return;

    buton.addEventListener("click", function() {

        if (!secilenMahalle || oyunBasladi) return;

        oyunBasladi = true;
        rastgeleOlaySisteminiBaslat();
        dusmanSaldiriSisteminiBaslat();

        oyuncuMahallesi = secilenMahalle;
        // Başlangıç mahallemizi kontrol listesine ekle
kontrolEdilenMahalleler.push(oyuncuMahallesi);

// Kontrol edilen mahalle sayısını güncelle
oyuncu.kontrolEdilenMahalle = kontrolEdilenMahalleler.length;

kaynaklariGuncelle();
// Başlangıç mahallemizin komşularını bul
komsuMahalleleriBul();

        // Oyuncunun mahallesini mavi yap
        oyuncuMahallesi.katman.setStyle({
            color: "#38bdf8",
            weight: 3,
            fillColor: "#0284c7",
            fillOpacity: 0.8
        });

        map.closePopup();

        alert(
            "🎮 ANGARA BAŞLADI!\n\n" +
            "🏘️ Mahalle: " + oyuncuMahallesi.ad + "\n" +
            "💰 Altın: " + oyuncu.altin + "\n" +
            "👥 Nüfus: " + oyuncu.nufus + "\n" +
            "🤝 Dost: " + oyuncu.dost + "\n" +
            "🔫 Silah: " + oyuncu.silah
        );

        console.log("ANGARA başladı:", oyuncuMahallesi.ad);

    });

});
// ==========================================
// ANGARA - EKONOMİ SİSTEMİ
// ==========================================

// Kaynak panelini güncelle
function kaynaklariGuncelle() {

    document.getElementById("altin").textContent =
        oyuncu.altin.toLocaleString("tr-TR");

    document.getElementById("nufus").textContent =
        oyuncu.nufus.toLocaleString("tr-TR");

    document.getElementById("dost").textContent =
        oyuncu.dost.toLocaleString("tr-TR");

    document.getElementById("silah").textContent =
        oyuncu.silah.toLocaleString("tr-TR");

    document.getElementById("mahalleSayisi").textContent =
        oyuncu.kontrolEdilenMahalle;
}

// ========================================
// ANGARA - ALTIN EKONOMİSİ
// ========================================

// Her saniye altın kazan
setInterval(function () {

    if (!oyunBasladi) return;

    // Başlangıç geliri: 10 altın
    // Her yeni mahallede gelir %20 artar
    const mahalleSayisi = oyuncu.kontrolEdilenMahalle;

    const altinGeliri =
        10 * Math.pow(1.20, mahalleSayisi - 1);

    oyuncu.altin += altinGeliri;

    kaynaklariGuncelle();

}, 1000);


// ========================================
// ANGARA - NÜFUS EKONOMİSİ
// ========================================

// Her saniye 1 nüfus kazan
setInterval(function () {

    if (!oyunBasladi) return;

    oyuncu.nufus += 1;

    kaynaklariGuncelle();

}, 1000);
// ==========================================
// ANGARA - HAREKETLİ ARABA SİSTEMİ
// ==========================================

let aktifArabalar = [];

// Araba oluştur
function arabaOlustur() {

    if (!oyunBasladi) return;

    // Haritanın görünen sınırlarını al
    const bounds = map.getBounds();

    const guney = bounds.getSouth();
    const kuzey = bounds.getNorth();
    const bati = bounds.getWest();
    const dogu = bounds.getEast();

    // Rastgele başlangıç konumu
    const enlem = guney + Math.random() * (kuzey - guney);

    const baslangic = L.latLng(enlem, bati);
    const bitis = L.latLng(enlem, dogu);

    // Araba simgesi
    const arabaIcon = L.divIcon({
        html: '<div class="angara-araba">🚗</div>',
        className: "",
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });

    const araba = L.marker(baslangic, {
        icon: arabaIcon,
        zIndexOffset: 1000
    }).addTo(map);

    aktifArabalar.push(araba);

    let ilerleme = 0;
    let patladi = false;

    // Arabayı hareket ettir
    const hareket = setInterval(function() {

        if (patladi) {
            clearInterval(hareket);
            return;
        }

        ilerleme += 0.005;

        const yeniEnlem =
            baslangic.lat +
            (bitis.lat - baslangic.lat) * ilerleme;

        const yeniBoylam =
            baslangic.lng +
            (bitis.lng - baslangic.lng) * ilerleme;

        araba.setLatLng([yeniEnlem, yeniBoylam]);

        if (ilerleme >= 1) {

            clearInterval(hareket);

            map.removeLayer(araba);

            aktifArabalar = aktifArabalar.filter(
                a => a !== araba
            );
        }

    }, 50);

    // Arabaya tıklanınca
    araba.on("click", function(e) {

        L.DomEvent.stopPropagation(e);

        if (patladi) return;

        patladi = true;

        clearInterval(hareket);

        // 300-500 arası rastgele altın
const odul =
    Math.floor(Math.random() * 201) + 300;

        oyuncu.altin += odul;

        kaynaklariGuncelle();

        const konum = araba.getLatLng();

        // Patlama efekti
        const patlamaIcon = L.divIcon({
            html: '<div class="angara-patlama">💥</div>',
            className: "",
            iconSize: [60, 60],
            iconAnchor: [30, 30]
        });

        araba.setIcon(patlamaIcon);

        // Ödül yazısı
        L.popup()
            .setLatLng(konum)
            .setContent(
                `<b>💥 ARAÇ PATLATILDI!</b><br>
                 💰 +${odul} Altın`
            )
            .openOn(map);

        // Patlama sonrası arabayı kaldır
        setTimeout(function() {

            if (map.hasLayer(araba)) {
                map.removeLayer(araba);
            }

            aktifArabalar = aktifArabalar.filter(
                a => a !== araba
            );

        }, 700);

    });

}


// Her 30 saniyede bir araba oluştur
setInterval(function() {

    if (!oyunBasladi) return;

    arabaOlustur();

}, 30000);
// ==========================================
// ANGARA - GELİŞTİRME PANELİ SİSTEMİ
// ==========================================

// Geliştirme panelini aç
function gelistirmePaneliniAc(katman = oyuncuMahallesi?.katman) {
    // Geliştirmek istediğimiz mahalleyi belirle
aktifMahalle = katman;

// Mahallenin bilgilerini al
const bilgi = mahalleBilgisiOlustur(aktifMahalle);

// Ekranda bu mahallenin savunma seviyesini göster
document.getElementById("savunmaSeviye").textContent =
    bilgi.savunmaSeviyesi;

    if (!oyunBasladi || !oyuncuMahallesi) {
        return;
    }

    // Mahalle adını panele yaz
    document.getElementById("aktifMahalleAdi").textContent =
    aktifMahalle.feature.properties.name;

    // Paneli göster
    document.getElementById("gelistirmePaneli").style.display =
        "block";
}


// Geliştirme panelini kapat
function gelistirmePaneliniKapat() {

    document.getElementById("gelistirmePaneli").style.display =
        "none";
}


// Kapatma butonuna basılınca
document.getElementById("panelKapat").addEventListener(
    "click",
    gelistirmePaneliniKapat
);


// ==========================================
// ANGARA - MAHALLE GELİŞTİRME SİSTEMİ
// ==========================================

// Başlangıç savunma seviyesi
let savunmaSeviyesi = 1;
// Geliştirme panelinde seçili olan mahalle
let aktifMahalle = null;
// ==========================================
// ANGARA - MAHALLE BİLGİ SİSTEMİ
// ==========================================

// Her mahallenin kendi bilgilerini saklayacağız
const mahalleBilgileri = new Map();

// Mahalleye ilk kez bilgi oluştur
function mahalleBilgisiOlustur(katman, baslangicMi = false) {

    // Daha önce oluşturulmuşsa tekrar oluşturma
    if (mahalleBilgileri.has(katman)) {
        return mahalleBilgileri.get(katman);
    }

    // Başlangıç mahallesi 5000 nüfuslu
    // Diğer mahalleler 1000–5000 nüfuslu
    const nufus = baslangicMi
        ? 5000
        : Math.floor(Math.random() * 4001) + 1000;

    const bilgi = {
        nufus: nufus,
        savunmaSeviyesi: 1
    };

    mahalleBilgileri.set(katman, bilgi);

    return bilgi;
}

// Savunma geliştirme maliyeti
let savunmaMaliyeti = 500;


// ==========================================
// SAVUNMA MERKEZİ GELİŞTİRME
// ==========================================

document.getElementById("savunmaGelistir").addEventListener(
    "click",
    function() {

        if (!oyunBasladi) return;
        // Geliştirilecek mahalleyi kontrol et
if (!aktifMahalle) return;

// Mahallenin bilgilerini al
const bilgi = mahalleBilgisiOlustur(aktifMahalle);

// Bu mahalleye özel geliştirme maliyeti
const maliyet = 500 + (bilgi.savunmaSeviyesi - 1) * 250;

        if (oyuncu.altin < maliyet) {
            alert("❌ Yeterli altının yok!");
            return;
        }

        // Altını azalt
        oyuncu.altin -= maliyet;

        // Savunma seviyesini artır
        bilgi.savunmaSeviyesi++;

        // Sonraki geliştirme maliyetini artır
        

        // Ekrandaki seviyeyi güncelle
        document.getElementById("savunmaSeviye").textContent =
            bilgi.savunmaSeviyesi;

        // Butondaki maliyeti güncelle
        // Bu mahallenin sonraki geliştirme maliyeti
const sonrakiMaliyet =
    500 + (bilgi.savunmaSeviyesi - 1) * 250;

document.getElementById("savunmaGelistir").textContent =
    `GELİŞTİR — ${sonrakiMaliyet} ALTIN`;

        kaynaklariGuncelle();

        alert("🛡️ Savunma merkezi geliştirildi!");

    }
);


// ==========================================
// DOST KAZANMA
// ==========================================

document.getElementById("dostKazan").addEventListener(
    "click",
    function() {

        if (!oyunBasladi) return;

        if (oyuncu.altin < 100) {
            alert("❌ Yeterli altının yok!");
            return;
        }

        oyuncu.altin -= 100;

        oyuncu.dost += 5;

        kaynaklariGuncelle();

        alert("🤝 Mahallene 5 yeni dost katıldı!");

    }
);


// ==========================================
// SİLAH SATIN ALMA
// ==========================================

document.getElementById("silahAl").addEventListener(
    "click",
    function() {

        if (!oyunBasladi) return;

        if (oyuncu.altin < 200) {
            alert("❌ Yeterli altının yok!");
            return;
        }

        oyuncu.altin -= 200;

        oyuncu.silah += 5;

        kaynaklariGuncelle();

        alert("🔫 5 yeni silah satın alındı!");

    }
);
// ==========================================
// ANGARA - KOMŞU MAHALLE TESPİT SİSTEMİ
// ==========================================

// Saldırılabilecek komşu mahalleler
let komsuMahalleler = [];

// Mahalleler komşu mu?
function mahallelerKomsuMu(katman1, katman2) {

    try {

        const geo1 = katman1.toGeoJSON();
        const geo2 = katman2.toGeoJSON();

        // Önce sınır kutularıyla hızlı kontrol
        if (!katman1.getBounds().intersects(katman2.getBounds())) {
            return false;
        }

        // Gerçek geometriler temas ediyor mu?
        // Mahallelerin sınır çizgilerini çıkar
const sinir1 = turf.polygonToLine(geo1);
const sinir2 = turf.polygonToLine(geo2);

// Sınırlar birbirine temas ediyor mu?
const kesisimler = turf.lineIntersect(sinir1, sinir2);

// Kesişim varsa komşu kabul et
return kesisimler.features.length > 0;

    } catch (hata) {

        console.error("Komşuluk kontrol hatası:", hata);
        return false;

    }
}


// Komşu mahalleleri bul
function komsuMahalleleriBul() {

    if (!oyunBasladi || !mahalleKatmani) return;

    komsuMahalleler = [];
    // Tamamen fethedilen ilçeleri belirle
const fethedilenIlceler = fethedilenIlceleriBul();

// İlçelerin renklerini güncelle
if (ilceKatmani) {

    ilceKatmani.eachLayer(function(ilce) {

        const bizimMi = fethedilenIlceler.includes(ilce);

        ilce.setStyle({
            color: bizimMi ? "#38bdf8" : "#f59e0b",
            fillColor: bizimMi ? "#0284c7" : "#f59e0b",
            weight: bizimMi ? 3 : 2,
            fillOpacity: bizimMi ? 0.35 : 0.12
        });

    });

}

    mahalleKatmani.eachLayer(function(katman) {

        // Kendi mahallemizi atla
        if (kontrolEdilenMahalleler.some(
            mahalle => mahalle.katman === katman
        )) {
            return;
        }

        const komsuMu = kontrolEdilenMahalleler.some(
    mahalle => mahallelerKomsuMu(
        mahalle.katman,
        katman
    )
) || fethedilenIlceler.some(
    ilce => mahallelerKomsuMu(
        ilce,
        katman
    )
);

        if (komsuMu) {

            komsuMahalleler.push(katman);

            // Komşuları yeşile boya
            katman.setStyle({
                color: "#22c55e",
                weight: 2,
                fillColor: "#16a34a",
                fillOpacity: 0.5
            });

        }

    });

    console.log(
        "🟢 Saldırılabilir komşu mahalle sayısı:",
        komsuMahalleler.length
    );

}
// ==========================================
// ANGARA - SALDIRI PANELİ SİSTEMİ
// ==========================================

// Seçilen saldırı hedefi
let saldiriHedefi = null;

// Mahallelerin savunma güçlerini sakla
const mahalleSavunmalari = new Map();

// Saldırı panelini aç
function saldiriPaneliniAc(katman) {

    if (!oyunBasladi) return;

    // Sadece komşu mahallelere saldırılabilir
    if (!komsuMahalleler.includes(katman)) return;

    saldiriHedefi = katman;

    // Mahalle adını al
    const mahalleAdi =
        katman.feature?.properties?.name || "Bilinmeyen Mahalle";

    // Savunma gücünü ilk kez oluştur
    if (!mahalleSavunmalari.has(katman)) {

        // Başlangıç mahallemizin merkezini bul
const baslangicMerkezi =
    oyuncuMahallesi.katman.getBounds().getCenter();

// Saldıracağımız mahallenin merkezini bul
const hedefMerkezi =
    katman.getBounds().getCenter();

// İki mahalle arasındaki mesafeyi kilometre olarak hesapla
const mesafeKm =
    map.distance(baslangicMerkezi, hedefMerkezi) / 1000;

// Mesafeye göre düşman savunması
let minimumSavunma;
let maksimumSavunma;

if (mesafeKm < 5) {
    minimumSavunma = 80;
    maksimumSavunma = 120;
} else if (mesafeKm < 15) {
    minimumSavunma = 120;
    maksimumSavunma = 180;
} else if (mesafeKm < 30) {
    minimumSavunma = 180;
    maksimumSavunma = 260;
} else if (mesafeKm < 60) {
    minimumSavunma = 260;
    maksimumSavunma = 380;
} else {
    minimumSavunma = 380;
    maksimumSavunma = 550;
}

// Belirlenen aralıkta rastgele savunma gücü
const savunma =
    Math.floor(
        Math.random() *
        (maksimumSavunma - minimumSavunma + 1)
    ) + minimumSavunma;

        mahalleSavunmalari.set(katman, savunma);
    }

    const dusmanGucu = mahalleSavunmalari.get(katman);

    // Geçici saldırı gücü formülümüz
    const bizimGucumuz =
        oyuncu.dost * 2 + oyuncu.silah;

    // Paneldeki bilgileri güncelle
    document.getElementById("hedefMahalleAdi").textContent =
        mahalleAdi;

    document.getElementById("dusmanSavunma").textContent =
        dusmanGucu;

    document.getElementById("saldiriDost").textContent =
        oyuncu.dost;

    document.getElementById("saldiriSilah").textContent =
        oyuncu.silah;

    document.getElementById("saldiriGucu").textContent =
        bizimGucumuz;

    // Geliştirme panelini kapat
    document.getElementById("gelistirmePaneli").style.display =
        "none";

    // Saldırı panelini aç
    document.getElementById("saldiriPaneli").style.display =
        "block";
}

// Saldırı panelini kapat
function saldiriPaneliniKapat() {

    document.getElementById("saldiriPaneli").style.display =
        "none";

    saldiriHedefi = null;
}

// Kapatma butonu
document.getElementById("saldiriPanelKapat").addEventListener(
    "click",
    saldiriPaneliniKapat
);
// ==========================================
// ANGARA - SALDIRI PANELİ KONUM DÜZELTMESİ
// ==========================================

// Saldırı panelini geliştirme panelinin dışına taşı
document.body.appendChild(
    document.getElementById("saldiriPaneli")
);
// ==========================================
// ANGARA - YENİLMEZ MAHALLE SİSTEMİ
// ==========================================

// Polatlı Şentepe Mahallesi'nin GeoJSON kimliği
const YENILMEZ_MAHALLE_ID = "relation/16005641";

// Mahalle yenilmez mi?
function mahalleYenilmezMi(katman) {

    if (!katman || !katman.feature) {
        return false;
    }

    const mahalleID = katman.feature.properties?.["@id"];

    return mahalleID === YENILMEZ_MAHALLE_ID;
}
// ==========================================
// ANGARA - GERÇEK MAHALLE FETİH SİSTEMİ
// ==========================================

document.getElementById("saldiriBaslat").addEventListener(
    "click",
    function() {

        if (!oyunBasladi || !saldiriHedefi) return;

        const hedef = saldiriHedefi;

        // Yenilmez mahalleye saldırı yasak
        if (mahalleYenilmezMi(hedef)) {
            alert("🛡️ POLATLI ŞENTEPE MAHALLESİ YENİLMEZDİR!");
            return;
        }

        // Hedef hâlâ komşumuz mu?
        if (!komsuMahalleler.includes(hedef)) {
            alert("❌ Bu mahalleye saldıramazsın!");
            return;
        }

        const saldiriGucu = oyuncu.dost * 2 + oyuncu.silah;
        const savunmaGucu = mahalleSavunmalari.get(hedef);

        if (saldiriGucu > savunmaGucu) {

           // Düşman gücüne göre savaş kaybı
let minKayip;
let maxKayip;

if (savunmaGucu < 120) {
    minKayip = 2;
    maxKayip = 5;
} else if (savunmaGucu < 180) {
    minKayip = 5;
    maxKayip = 9;
} else if (savunmaGucu < 260) {
    minKayip = 9;
    maxKayip = 15;
} else if (savunmaGucu < 380) {
    minKayip = 15;
    maxKayip = 25;
} else {
    minKayip = 25;
    maxKayip = 40;
}

const kayip = Math.min(
    oyuncu.dost,
    Math.floor(
        Math.random() * (maxKayip - minKayip + 1)
    ) + minKayip
);
            

            oyuncu.dost -= kayip;

            // Mahalleyi fethet
            kontrolEdilenMahalleler.push({
                ad: hedef.feature.properties.name,
                katman: hedef
            });
            // ==========================================
// FETHEDİLEN MAHALLENİN NÜFUSUNU KAZAN
// ==========================================

// Fethedilen mahallenin bilgilerini oluştur
const fethedilenBilgi = mahalleBilgisiOlustur(hedef);

// Mahallenin nüfusunu oyuncuya ekle
oyuncu.nufus += fethedilenBilgi.nufus;

console.log(
    "🏘️ Fethedilen mahalle:",
    hedef.feature.properties.name
);

console.log(
    "👥 Kazanılan nüfus:",
    fethedilenBilgi.nufus
);

console.log(
    "👥 Toplam nüfus:",
    oyuncu.nufus
);

            oyuncu.kontrolEdilenMahalle =
                kontrolEdilenMahalleler.length;

            // Fethedilen mahalleyi maviye boya
            hedef.setStyle({
                color: "#38bdf8",
                weight: 3,
                fillColor: "#0284c7",
                fillOpacity: 0.8
            });

            // Paneli kapat
            saldiriPaneliniKapat();

            // Yeni komşuları hesapla
            komsuMahalleleriBul();

            // Kaynakları güncelle
            kaynaklariGuncelle();
            komsuMahalleleriBul();

            alert(
                "🏆 MAHALLE FETHEDİLDİ!\n\n" +
                "🏘️ Mahalle: " +
                hedef.feature.properties.name +
                "\n🤝 Kaybedilen dost: " + kayip
            );

        } else {

            // Başarısız saldırı
            const kayip = Math.min(
                oyuncu.dost,
                Math.floor(Math.random() * 5) + 3
            );

            oyuncu.dost -= kayip;

            kaynaklariGuncelle();

            alert(
                "❌ SALDIRI BAŞARISIZ!\n\n" +
                "🤝 Kaybedilen dost: " + kayip
            );

        }

    }
);
// ========================================
// ANGARA - RASTGELE OLAY SİSTEMİ
// ========================================

function rastgeleOlayAc() {
    if (!oyunBasladi) return;

    const panel = document.getElementById("rastgeleOlayPaneli");

    if (!panel) {
        console.error("Rastgele olay paneli HTML'de bulunamadı!");
        return;
    }

    panel.style.display = "flex";
}



// Yürümeye devam et: Hiçbir şey kaybetme
document.getElementById("yurumeyeDevamEt")
    .addEventListener("click", function () {

        rastgeleOlayPaneli.style.display = "none";

    });



// Ona cevap ver: Altın ve dost kaybet
document.getElementById("onaCevapVer")
    .addEventListener("click", function () {

        const kaybedilenAltin = Math.min(oyuncu.altin, 200);
        const kaybedilenDost = Math.min(oyuncu.dost, 5);

        oyuncu.altin -= kaybedilenAltin;
        oyuncu.dost -= kaybedilenDost;

        kaynaklariGuncelle();

        document.getElementById("rastgeleOlayPaneli").style.display = "none";

        alert(
            "🗣️ Yabancıya cevap verdin!\n\n" +
            "💰 Kaybedilen altın: " + Math.floor(kaybedilenAltin) + "\n" +
            "🤝 Kaybedilen dost: " + kaybedilenDost
        );

    });


// ANGARA - 3 dakikalık rastgele olay sistemi
let rastgeleOlaySayaci = null;

function rastgeleOlaySisteminiBaslat() {

    if (rastgeleOlaySayaci !== null) return;

    rastgeleOlaySayaci = setInterval(function () {

        if (!oyunBasladi) return;

        const panel = document.getElementById("rastgeleOlayPaneli");

        if (!panel) return;

        if (panel.style.display === "flex") return;

        rastgeleOlayAc();

    }, 3 * 60 * 1000);
}
// ========================================
// ANGARA - DÜŞMAN SALDIRISI SİSTEMİ
// ========================================

let dusmanSaldiriSayaci = null;

function dusmanSaldiriSisteminiBaslat() {

    if (dusmanSaldiriSayaci !== null) return;

    dusmanSaldiriSayaci = setInterval(function () {

        if (!oyunBasladi) return;

        dusmanSaldirisiYap();

    }, 7 * 60 * 1000);
}
let dusmanSaldiriSayisi = 0;

function dusmanSaldirisiYap() {

    if (!oyunBasladi) return;
    if (kontrolEdilenMahalleler.length === 0) return;

    dusmanSaldiriSayisi++;

    // Rastgele mahalle seç
    const hedef = kontrolEdilenMahalleler[
        Math.floor(Math.random() * kontrolEdilenMahalleler.length)
    ];

    const bilgi = mahalleBilgisiOlustur(hedef.katman);

    // Mahallenin savunma gücü
    const savunmaGucu =
        Math.floor(bilgi.nufus / 100) +
        bilgi.savunmaSeviyesi * 25 +
        oyuncu.dost * 2 +
        oyuncu.silah;

    // Düşmanın saldırı gücü
    const dusmanGucu =
        Math.floor(Math.random() * 101) +
        100 +
        dusmanSaldiriSayisi * 25;

    if (savunmaGucu >= dusmanGucu) {

        alert(
            "🛡️ SAVUNMA BAŞARILI!\n\n" +
            "Saldırılan mahalle: " + hedef.ad + "\n" +
            "Savunma gücün: " + savunmaGucu + "\n" +
            "Düşman gücü: " + dusmanGucu + "\n\n" +
            "Mahalleni korumayı başardın!"
        );

    } else {

    // Mahalleyi kontrolümüzden çıkar
    const index = kontrolEdilenMahalleler.indexOf(hedef);

    if (index !== -1) {
        kontrolEdilenMahalleler.splice(index, 1);
    }

    // Mahalle sayısını güncelle
    oyuncu.kontrolEdilenMahalle =
        kontrolEdilenMahalleler.length;

    // Kaybedilen mahallenin nüfusunu düşür
    oyuncu.nufus = Math.max(
        0,
        oyuncu.nufus - bilgi.nufus
    );

    // Mahallenin rengini değiştir
    hedef.katman.setStyle({
        color: "#ef4444",
        fillColor: "#ef4444",
        fillOpacity: 0.5
    });

    // Kaynakları güncelle
    kaynaklariGuncelle();

    alert(
        "⚔️ SAVUNMA BAŞARISIZ!\n\n" +
        "Kaybedilen mahalle: " + hedef.ad + "\n" +
        "Kaybedilen nüfus: " + bilgi.nufus + "\n" +
        "Savunma gücün: " + savunmaGucu + "\n" +
        "Düşman gücü: " + dusmanGucu
    );

}

    }
    // Tamamen fethedilen ilçeleri belirle
function fethedilenIlceleriBul() {

    const fethedilenIlceler = [];

    if (!ilceKatmani || !mahalleKatmani) {
        return fethedilenIlceler;
    }

    ilceKatmani.eachLayer(function(ilce) {

        const ilceMahalleleri = [];

        mahalleKatmani.eachLayer(function(mahalle) {

            if (!ilce.getBounds().intersects(mahalle.getBounds())) return;

            const merkez = turf.pointOnFeature(mahalle.feature);

            if (turf.booleanPointInPolygon(merkez, ilce.feature)) {
                ilceMahalleleri.push(mahalle);
            }

        });

        const tamamenBizim =
            ilceMahalleleri.length > 0 &&
            ilceMahalleleri.every(mahalle =>
                kontrolEdilenMahalleler.some(
                    bizim => bizim.katman === mahalle
                )
            );

        if (tamamenBizim) {
            fethedilenIlceler.push(ilce);
        }

    });

    return fethedilenIlceler;
}
