# 🌍 World Dominion - Dünya Hakimiyeti Oyunu

**Dünyayı Ele Geçir, Tarih Yaz!**

World Dominion, oyuncuların dünya hakimiyeti için yarıştığı epik bir online multiplayer strateji oyunudur. Diplomasi, teknoloji ve savaş yoluyla imparatorluğunuzu büyütün ve dünyayı ele geçirin!

## 🚀 Özellikler

### 🎮 Oyun Mekaniği
- **Gerçek Zamanlı Multiplayer**: 50'ye kadar oyuncu aynı anda oynayabilir
- **Kaynak Yönetimi**: Altın, Üretim, Bilim ve Askeri güç sistemleri
- **Teknoloji Ağacı**: Barut'tan Elektrik'e kadar araştırma yapın
- **Diplomasi Sistemi**: İttifak kurun, ticaret yapın veya savaş ilan edin
- **Yapı İnşaatı**: Fabrika, Laboratuvar ve Kışla inşa edin
- **Dünya Sıralaması**: Güç puanınıza göre lider tablosunda yarışın

### 🌐 Teknik Özellikler
- **Modern Web Teknolojileri**: HTML5 Canvas, WebSocket, ES6+
- **Responsive Tasarım**: PC, tablet ve mobil uyumlu
- **Gerçek Zamanlı Chat**: Genel, İttifak ve Ticaret kanalları
- **Interaktif Dünya Haritası**: Zoom, pan, tıklanabilir bölgeler
- **Bildirim Sistemi**: Oyun içi bildirimler ve uyarılar

## 📁 Proje Yapısı

```
world-dominion-game/
├── public/                 # Frontend dosyları
│   ├── index.html         # Ana HTML dosyası
│   ├── css/
│   │   └── style.css      # Ana CSS stil dosyası
│   └── js/
│       ├── main.js        # Ana JavaScript
│       ├── game-engine.js # Oyun motoru
│       ├── world-map.js   # Dünya haritası
│       ├── diplomacy.js   # Diplomasi sistemi
│       └── chat.js        # Chat sistemi
├── server/
│   └── server.js          # Express + Socket.io server
├── package.json           # Node.js bağımlılıkları
└── README.md             # Bu dosya
```

## 🛠️ Kurulum

### Gereksinimler
- **Node.js** 14.0.0 veya üzeri
- **npm** 6.0.0 veya üzeri
- Modern web tarayıcısı (Chrome, Firefox, Safari, Edge)

### Adım 1: Bağımlılıkları Yükle
```bash
npm install
```

### Adım 2: Serveri Başlat
```bash
# Production modunda
npm start

# Development modunda (otomatik yeniden başlatma)
npm run dev
```

### Adım 3: Oyunu Oyna
Tarayıcınızda http://localhost:3000 adresine gidin ve oyunun tadını çıkarın!

## 🎯 Nasıl Oynanır

### Başlangıç
1. İmparatorluk adınızı girin
2. Ülkenizi seçin (10 farklı ülke mevcut)
3. "Oyuna Başla" butonuna tıklayın

### Temel Oyun Mekaniği
- **Kaynaklar**: Her 5 saniyede otomatik üretilir
- **Yapı İnşaatı**: Fabrika (altın), Lab (bilim), Kışla (askeri güç) inşa edin
- **Teknoloji**: Bilim puanlarınızla yeni teknolojiler araştırın
- **Diplomasi**: Diğer oyuncularla etkileşime geçin

### Zafer Şartları
- **Güç Puanı 10.000'e** ulaşan oyuncu dünyayı ele geçirir!

## ⌨️ Klavye Kısayolları

| Kısayol | Açıklama |
|---------|-----------|
| `T` | Teknoloji Ağacını Aç |
| `D` | Diplomasi Merkezini Aç |
| `M` | Harita Görünümünü Sıfırla |
| `Enter` | Chat'e Odaklan |
| `Esc` | Açık Pencereleri Kapat |
| `Space` | Oyunu Duraklat (yakında) |

## 💬 Chat Komutları

| Komut | Açıklama |
|-------|-----------|
| `/help` | Yardım mesajını göster |
| `/who` | Çevrimiçi oyuncuları listele |
| `/clear` | Chat geçmişini temizle |
| `/me [eylem]` | Eylem mesajı gönder |

## 🌟 Teknoloji Ağacı

### ⚔️ Askeri Teknolojiler
- **Barut** (50 🧪) → Askeri güç +15
- **Topçuluk** (100 🧪) → Askeri güç +25 (Barut gerekli)

### 🏭 Endüstriyel Teknolojiler  
- **Buhar Gücü** (75 🧪) → Üretim +20
- **Elektrik** (150 🧪) → Üretim +35, Bilim +10 (Buhar Gücü gerekli)

## 🏗️ Yapılar

| Yapı | Maliyet | Üretim |
|------|---------|---------|
| **Fabrika** | 500 💰 + 50 🏭 | +20 💰, +5 🏭 |
| **Laboratuvar** | 800 💰 + 30 🧪 | +8 🧪 |
| **Kışla** | 600 💰 + 25 ⚔️ | +3 ⚔️ |

## 🗺️ Dünya Haritası

Oyunda 10 büyük ülke bulunmaktadır:
- 🇹🇷 **Türkiye** (Ankara, İstanbul, İzmir)
- 🇺🇸 **Amerika** (Washington, New York, Los Angeles)  
- 🇷🇺 **Rusya** (Moskova, St. Petersburg, Vladivostok)
- 🇨🇳 **Çin** (Pekin, Şangay, Guangzhou)
- 🇩🇪 **Almanya** (Berlin, Hamburg, Munich)
- 🇫🇷 **Fransa** (Paris, Lyon, Marseille)
- 🇬🇧 **İngiltere** (Londra, Edinburgh)
- 🇯🇵 **Japonya** (Tokyo, Osaka)
- 🇮🇳 **Hindistan** (Yeni Delhi, Mumbai, Bangalore)
- 🇧🇷 **Brezilya** (Brasília, Rio de Janeiro, São Paulo)

## 🚀 API Endpoints

### GET Endpoints
- `GET /api/health` - Server durumu
- `GET /api/stats` - Global istatistikler
- `GET /api/leaderboard` - Lider tablosu
- `GET /api/rooms/:roomId` - Oyun odası bilgisi

### POST Endpoints
- `POST /api/rooms/join` - Oyun odasına katıl
- `POST /api/players/:playerId/save` - Oyuncu verilerini kaydet

## 🔌 Socket.io Events

### Client → Server
- `playerJoin` - Oyuncunun oyuna katılması
- `chatMessage` - Chat mesajı gönderme
- `gameStateUpdate` - Oyun durumu güncelleme
- `diplomacyAction` - Diplomasi eylemi
- `techResearch` - Teknoloji araştırması
- `buildStructure` - Yapı inşaatı

### Server → Client
- `playerJoined` - Yeni oyuncu bildirimi
- `playerLeft` - Oyuncu ayrılma bildirimi
- `chatMessage` - Chat mesajı
- `gameStateUpdate` - Oyun durumu güncelleme
- `diplomacyProposal` - Diplomasi teklifi
- `techResearchComplete` - Teknoloji tamamlandı
- `buildingComplete` - Yapı tamamlandı

## 🎨 Tasarım Özellikleri

- **Renk Paleti**: Koyu tema, altın vurgular
- **Font**: Orbitron (başlıklar), Exo 2 (metin)
- **Animasyonlar**: Fade, pulse, glow efektleri
- **Icons**: Font Awesome 6.0
- **Responsive**: Mobil, tablet, desktop uyumlu

## 🔧 Geliştirici Notları

### Performans Optimizasyonu
- Canvas animasyonları 60 FPS hedefler
- Socket.io mesajları throttle edilmiştir
- Bellekte oyuncu verisi Map yapısında saklanır
- Inactive oyuncular 30 dakika sonra temizlenir

### Güvenlik
- XSS koruması için input sanitization
- Socket.io CORS koruması
- Rate limiting (gelecek güncellemede)

### Scaling (Büyütme)
- Redis kullanarak çoklu server desteği (gelecek)
- Veritabanı entegrasyonu (MongoDB/PostgreSQL)
- Load balancing için Nginx

## 📈 Gelecek Özellikler

### 🎯 v1.1 (Yakında)
- [ ] Oyun duraklatma/devam ettirme
- [ ] Sesli efektler ve müzik
- [ ] Daha fazla teknoloji ve yapı
- [ ] Detaylı oyuncu istatistikleri

### 🎯 v1.2 (Orta Vadeli)
- [ ] Savaş mekaniği ve birim sistemi
- [ ] Ticaret sistemi (kaynak alışverişi)
- [ ] Şehir kuşatma ve işgal
- [ ] Haritada bölge kontrolü

### 🎯 v2.0 (Uzun Vadeli)
- [ ] Turnuva modu
- [ ] Guild (klan) sistemi
- [ ] Özel haritalar
- [ ] AI oyuncular

## 🐛 Bilinen Sorunlar

- Çok fazla oyuncu aynı anda chat yazarsa lag olabilir
- Mobil cihazlarda harita kontrolü bazen zorlaşabilir
- Safari'de WebSocket bağlantısı bazen gecikebilir

## 🤝 Katkıda Bulunma

1. Repository'yi fork edin
2. Feature branch oluşturun: `git checkout -b yeni-özellik`
3. Değişikliklerinizi commit edin: `git commit -m 'Yeni özellik eklendi'`
4. Branch'inizi push edin: `git push origin yeni-özellik`
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için LICENSE dosyasına bakın.

## 📞 İletişim

- **Email**: contact@worlddominion.game
- **GitHub**: https://github.com/your-username/world-dominion-game
- **Discord**: World Dominion Community

## 🎉 Teşekkürler

- Socket.io ekibine gerçek zamanlı iletişim için
- Font Awesome'a muhteşem ikonlar için
- Google Fonts'a güzel fontlar için
- Tüm beta test oyuncularına geri bildirimler için

---

**🌍 Dünyayı ele geçirmeye hazır mısınız? World Dominion'da görüşürüz! 🚀**
