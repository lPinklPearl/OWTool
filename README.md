# OW Strategy Board

เครื่องมือวางแผนกลยุทธ์สำหรับเกม **Overwatch 2** — วาดเส้น, วางฮีโร่, และแชร์แผนให้ทีมได้ในคลิกเดียว

> สร้างโดย **1PinkAP**

---

## ฟีเจอร์หลัก

- **วาดบนแผนที่** — เส้น, ลูกศร, วงกลม, สี่เหลี่ยม, และ Marker (enemy/ally/note)
- **วางฮีโร่** — ลากฮีโร่จาก panel ลงบนแผนที่ แยกทีม ally/enemy
- **หลายแผนที่** — รองรับแผนที่ทุกแผนที่ใน Overwatch 2
- **Layers** — เปิด/ปิด layer ของ Drawing, Heroes, Notes ได้อิสระ
- **Fog of War** — ซ่อนส่วนที่ยังไม่ได้วางแผน
- **Animation** — สร้างหลาย Step เพื่อวาง plan แบบเป็นขั้นตอน
- **Export/Import** — บันทึก/โหลด plan เป็น JSON หรือ Export เป็นรูปภาพ
- **Share Link** — สร้าง URL สำหรับแชร์ plan ให้ทีม

---

## การติดตั้งและรัน

### ความต้องการของระบบ

- Node.js 18+
- npm หรือ yarn

### ขั้นตอน

```bash
# ติดตั้ง dependencies
npm install

# รันในโหมด development
npm run dev

# Build สำหรับ production
npm run build

# Preview build
npm run preview
```

---

## Tech Stack

| เทคโนโลยี | การใช้งาน |
|---|---|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| Tailwind CSS | Styling |
| Konva / react-konva | Canvas Rendering |
| Lucide React | Icons |

---

## โครงสร้างโปรเจกต์

```
OWTool/
├── src/
│   ├── components/
│   │   ├── MapCanvas.tsx      # Canvas หลักสำหรับวาด
│   │   ├── Toolbar.tsx        # แถบเครื่องมือ
│   │   ├── HeroPanel.tsx      # Panel เลือกฮีโร่
│   │   ├── LayersPanel.tsx    # ควบคุม Layers
│   │   ├── MapSelector.tsx    # เลือกแผนที่
│   │   ├── ExportPanel.tsx    # Export/Import/Share
│   │   └── TimelinePanel.tsx  # Timeline Steps
│   ├── App.tsx                # Root component
│   └── main.tsx
├── hero_pic/                  # รูปฮีโร่ทั้งหมด
├── map_pic/                   # รูปแผนที่ทั้งหมด
└── package.json
```

---

## License

MIT License — ใช้งานได้อย่างอิสระ

---

*สร้างโดย **1PinkAP***
