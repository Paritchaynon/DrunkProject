# 🍻 Party Games Hub (วงเหล้า Edition)

เว็บแอปพลิเคชันสำหรับเล่นเกมในวงเหล้าและปาร์ตี้สุดมันส์ พัฒนาด้วย Modern Web Technologies (HTML5, Vanilla CSS3 Glassmorphism/Nightlife Dark Mode, Vanilla JavaScript) ใช้งานง่ายบนมือถือ ลื่นไหล ไม่มีโฆษณากวนใจ

---

## 🎮 รายชื่อเกมทั้งหมด (Available Games)

1. **🃏 I'M NOT DRUNK (ยังไม่เมา!) - การ์ดวงเหล้าวัดใจ (🔥 มาใหม่!)**
   - เกมเปิดการ์ดสุ่มภารกิจปาร์ตี้กว่า 60+ ใบ
   - มีเงื่อนไขชัดเจน: "ถ้าทำรอด! ถ้าไม่ทำดื่ม!" หรือ "ชี้เป้าสั่งคนอื่นดื่ม" / "ดื่มทุกคน" / "มินิเกมด่วน"
   - แอนิเมชันเปิดการ์ดแบบ 3D Flip Card พร้อมเสียง Sound FX จำลองและสถิติการดื่มสะสม
   - รองรับทั้งโหมดเล่นรวม และโหมดใส่ชื่อเพื่อนสลับตากันเปิด

2. **🎯 Truth or Dare (จริงหรือกล้า)**
   - เกมจริงหรือกล้า พร้อมระบบจัดลำดับผู้เล่น (Sortable)
   - ปรับระดับความเผ็ดร้อนได้ (เบา, ปานกลาง, แรง, แม่กำปอง Edition)
   - มีระบบจับเวลาทำภารกิจ

3. **🍻 Never Have I Ever (ฉันไม่เคย...)**
   - เกมฉันไม่เคย... ใครเคยทำสิ่งนั้นต้องดื่ม!
   - หมวดคำถามหลากหลาย สุ่มเปลี่ยนคำถามลื่นไหล

4. **🤔 Would You Rather (เลือกอย่างไหน)**
   - คำถาม 2 ทางเลือกสุดป่วง ไม่ตอบตามจริงหรือลังเลโดนปรับดื่ม 2 เท่า!

5. **🛠️ เกมที่อยู่ระหว่างการพัฒนา (Under Development)**
   - **Secret Guessing**: กำลังปรับปรุงระบบเซิร์ฟเวอร์ออนไลน์
   - **Party Charades**, **Word Chain**, **Speed Categories**: เตรียมพบกันเร็วๆ นี้

---

## 🚀 การ Deploy ขึ้น Vercel (Vercel Deployment Guide)

โปรเจกต์นี้ตั้งค่าโครงสร้างและไฟล์ `vercel.json` สำหรับ **Static Site Hosting** ไว้อย่างสมบูรณ์แบบ สามารถ Deploy ได้ง่ายๆ 2 วิธี:

### วิธีที่ 1: Deploy ผ่าน GitHub (แนะนำ สะดวกที่สุด)
1. Push โค้ดขึ้น GitHub Repository
2. เข้าสู่เว็บไซต์ [vercel.com](https://vercel.com) แล้วล็อกอิน
3. กด **"Add New..."** -> **"Project"**
4. เลือก Repository `DrunkProject`
5. ในส่วน **Framework Preset** ให้เลือก **Other** (หรือปล่อย Auto Detect)
6. ไม่ต้องตั้งค่า Build Command หรือ Output Directory (เนื่องจากเป็น Static HTML)
7. กด **Deploy** เว็บไซต์จะออนไลน์ทันที!

### วิธีที่ 2: Deploy ผ่าน Vercel CLI
```bash
# ติดตั้ง Vercel CLI (ถ้ายังไม่มี)
npm i -g vercel

# ทำการ Deploy
vercel --prod
```

---

## 📱 เทคโนโลยีที่ใช้ (Tech Stack)
- **HTML5 & Vanilla JavaScript**: เสถียร น้ำหนักเบา ไม่พึ่งพา Framework หนักๆ
- **Vanilla CSS3**: ดีไซน์ Nightlife Neon Glassmorphism, 3D CSS Transforms, Responsive Flexbox & Grid
- **Web Audio API**: สังเคราะห์เสียง Sound FX ภายในเครื่อง ไม่ต้องโหลดไฟล์เสียงภายนอก
- **SortableJS**: จัดลำดับรายชื่อผู้เล่นแบบ Drag & Drop

---
© 2025-2026 Paritchayanon Chaita • วงเหล้า Edition
