# AllStar Club – Project History & Task Memory
> Last updated: 2026-03-26 (Session 3) | Project: `/Users/tiez/Downloads/allstar-v2`

---

## Project Overview

**AllStar Club** là một web app single-page (thuần HTML + Tailwind CSS CDN) dành cho chương trình thưởng điểm U-Point của OneHousing, năm 2026. Không có build step — deploy trực tiếp file HTML lên static host.

### Tech Stack
- **Tailwind CSS** via CDN: `https://cdn.tailwindcss.com?plugins=forms,container-queries`
- **Dark mode**: `class="dark"` trên `<html>`
- **Fonts**: Space Grotesk (headline), Manrope (body), Plus Jakarta Sans (label) — via Google Fonts
- **Icons**: Material Symbols Outlined (Google Fonts)
- **Colors**: Primary `#ffd16c` (gold), Secondary `#00e3fd` (cyan), Tertiary `#ff7168` (red/orange)
- **No framework, no bundler** — mọi JS đều vanilla, inline trong file HTML

---

## File Map (4 files, tất cả trong `/Users/tiez/Downloads/allstar-v2/`)

| File | Trang | Kích thước |
|---|---|---|
| `index.html` | Trang chủ (hero, milestone table, FAQ, scoring section) | ~369KB |
| `tong-quan-chuong-trinh.html` | Tổng quan chương trình (hero 2-col + 3 white cards) | ~32KB |
| `the-le.html` | Thể lệ (sidebar nav + white card content + tables) | ~42KB |
| `leaderboard-prm-mien-bac.html` | BXH PRM Miền Bắc (top 3 podium + leaderboard table) | ~39KB |

> ⚠️ `leaderboard-prm-mien-nam.html` chưa được tạo — các nav link đang trỏ về `#`

---

## All Tasks Completed (2026-03-24)

### 1. `index.html` — Responsive Mobile Optimization
- Thêm hamburger button + mobile drawer menu (overlay + slide)
- Hero height: `h-[921px]` → `min-h-[600px] md:h-[921px]`
- Logo: `w-64` → `w-44`
- Milestone table: bọc trong `overflow-x-auto` + `min-w-[420px]` để scroll ngang trên mobile
- Cell padding: `px-12 py-6` → `px-4 md:px-12 py-4 md:py-6`
- Nav: thêm `px-4 md:px-8`

### 2. `index.html` — FAQ Interactive
- Thay thế FAQ tĩnh bằng hệ thống JS động: `faqData[]`, `switchFaq()`, `renderFaq()`, `updateButtons()`
- Click nút câu hỏi → fade transition cập nhật answer panel bên phải
- Support field `image` tùy chọn trong mỗi FAQ entry — render ảnh bên dưới text answer
- Test với: `https://i.ibb.co/xqn9Yncx/logo.png` trên câu hỏi Q4

### 3. `index.html` & all files — Footer Simplification
- Từ footer nhiều row phức tạp → 1 row duy nhất: logo + tên + copyright
- Height cực nhỏ (`py-4`), style: `bg-[#0a0e14] border-t border-white/5`
- Áp dụng đồng nhất cho tất cả file

### 4. `index.html` & all files — Email + Send Icons in Header
- Thêm 2 icon button vào góc phải header: `mail` và `send` (Material Symbols)
- `hidden sm:flex` — ẩn trên màn hình rất nhỏ để nhường chỗ hamburger
- Gold hover cho mail, cyan hover cho send

### 5. NEW: `tong-quan-chuong-trinh.html` (đổi tên từ `the-le-chuong-trinh.html`)
- **Hero**: Layout 2 cột (logo orbital rings bên trái, text bên phải)
- **Background hero**: CSS perspective grid + SVG city skyline + animated speed lines
- **Tiêu đề**: "TỔNG QUAN / CHƯƠNG TRÌNH"
- **3 Cards section**: Style white card khớp với "Cách thức ghi điểm" trong index.html
  - `bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl`
  - Dark pill badge: `bg-[#1e293b] text-white rounded-full`
  - Row items với `border-b border-gray-100`
- Nav + Footer copy chính xác từ `index.html`

### 6. NEW: `the-le.html` — Trang Thể Lệ Chi Tiết
- **Hero**: Background tối với neon rays SVG hội tụ về tâm + SVG city skyline
- **"ALLSTAR"** text cực lớn gradient gold/orange + blue tag "Thể lệ chương trình"
- **SVG Trophy** tự tạo: gradient vàng, floating + glow animation
- **Layout 2 cột**: Sidebar sticky 25% + Main content 75%
- **Sidebar**: Quick nav anchors (I–IV) + Quick stats card
- **Main content** style white card (khớp "Cách thức ghi điểm"):
  - Section I: Thời gian ghi nhận (01/02–31/12/2026) + 4-đợt chi trả table
  - Section II: Đối tượng (green card) + Ngoại trừ (red card)
  - Section III: 5 điều kiện numbered list + example box (5.67 tỷ → 5.6 U-Point)
  - Section IV: 80%/20% overview → Bảng 1 (lịch chi trả 4 quý) → Bảng 2 (20% H1 TH1/TH2/TH3) → Bảng 3 (20% H2 TH1/TH2/TH3)
  - TH3 rows: `bg-red-50` nổi bật với `border-l-4 border-red-500`
- **Sidebar active highlight** JS: scroll → auto highlight section tương ứng

### 7. NEW: `leaderboard-prm-mien-bac.html` — Bảng Xếp Hạng
- **Background**: Deep navy `#06091a` + multi-layer radial gradients
- **5 animated neon light trails** (CSS stroke-dashoffset animation)
- **Top 3 Podium**: Order hiển thị: 2nd · 1st · 3rd (classic podium)
  - Glassmorphism card: `glass-gold`, `glass-silver`, `glass-bronze`
  - Badge vàng/bạc/đồng overlay trên avatar tròn
  - `#1`: gold glow pulse + bouncing crown emoji
- **Leaderboard Table**: dark table, hover, rank 1-2-3 gradient text
- **Search**: live filter theo tên
- **Pagination**: smart với `…` ellipsis
- **"Tra cứu điểm" modal**: live search popup
- **Miền Bắc/Nam toggle**: styled, ready for future wiring
- **Avatar**: `ui-avatars.com` generated từ tên

### 8. Google Sheet Integration → CSV Method
- Đổi từ `gviz/tq?tqx=out:json` (JSONP) sang **published CSV URL**
- Biến: `CSV_URL = 'YOUR_PUBLISHED_CSV_URL'`
- `fetchData()` → `fetch(CSV_URL)` → `parseCSV(text)`
- `parseCSV()`: skip header row, parse columns, strip non-numeric chars
- `splitCSVLine()`: RFC 4180 compliant (handles quoted fields với commas)
- Fallback về MOCK_DATA nếu fetch lỗi hoặc URL chưa được set
- **Cách lấy CSV URL**: Google Sheet → File → Share → Publish to web → chọn tab → CSV → Publish → copy URL
- **Cấu trúc sheet**: Cột A=Tên, B=Chi nhánh, C=GMV Net (tỷ), D=U-Point

### 9. Active Nav Sync Across All Pages
- Thêm `data-nav` attribute vào tất cả nav links (desktop + mobile): 9 attrs/file
- Thêm CSS: `a.nav-active { color: #ffd16c !important; }`
- Thêm JS `setActiveNav()` vào tất cả 4 file:
  ```javascript
  var map = {
    'index.html': 'index',
    'tong-quan-chuong-trinh.html': 'tong-quan',
    'the-le.html': 'the-le',
    'leaderboard-prm-mien-bac.html': 'bxh',
    'leaderboard-prm-mien-nam.html': 'bxh',
  };
  ```
- Tự động gold highlight đúng nav item theo filename

### 10. File Rename + Internal Link Audit

- Đổi tên: `the-le-chuong-trinh.html` → `tong-quan-chuong-trinh.html`
- Cập nhật tất cả internal `href` từ `#` sang đúng filename
- `leaderboard-prm-mien-nam.html` chưa tồn tại → trỏ về `#` để tránh 404
- Audit result: ✓ 0 broken links

---

## Session 2 Tasks Completed (2026-03-24)

### 11. `index.html` — FAQ Content Replaced (8 câu hỏi thực tế)
- Xóa toàn bộ 4 câu hỏi placeholder cũ
- Thay bằng 8 câu hỏi thực tế của chương trình AllStar Club:
  1. Chương trình dành cho đối tượng nào? → LLTV Techcombank
  2. Giao dịch nào được tính điểm? → HBK / VBTT / HĐMB / Refer
  3. Quỹ thưởng & BXH tính như thế nào? → Riêng biệt theo miền, có thể tham gia cả 2
  4. Giá trị 1 điểm cá nhân là bao nhiêu? → Không cố định, cập nhật trên onehousing.club
  5. Công thức tính giá trị 1 điểm? → Render dạng fraction visual (HTML, không cần MathJax)
  6. Điểm Chi Nhánh & Vùng tính như thế nào? → Hệ số riêng, cập nhật theo giai đoạn
  7. Cấp quản lý TCB có hưởng quyền lợi không? → Có, theo gói cấp chi nhánh/vùng/miền
  8. Ví dụ minh họa → chỉ có ảnh, không có text body
- `renderFaq()` nâng cấp: dùng `innerHTML` (thay `textContent`) để render `<strong>` tags
- Thêm support `formula: true` → hiển thị khối công thức fraction có style riêng
- Thêm support entry chỉ có `image`, không có `body` text (FAQ 8)
- Image FAQ 8: `https://i.ibb.co/TDCdKvr8/Screenshot-2026-03-24-at-5-46-59.png`

### FAQ Data Structure (current)
```javascript
// Các field hỗ trợ trong mỗi faqData entry:
{
  title: "string",          // tiêu đề (hỗ trợ HTML)
  body: ["string", ...],    // mảng paragraph (hỗ trợ <strong> etc.)
  formula: true,            // optional — hiển thị khối công thức fraction
  image: "url"              // optional — hiển thị ảnh cuối answer
}
```

---

## Session 3 Tasks Completed (2026-03-26)

### 12. All files — Footer Logo + Text → Single Image
- Thay thế cụm `<img logo> + <span>AllStar Club</span>` trong footer của tất cả 4 file
- Dùng 1 `<img>` duy nhất: `https://w.ladicdn.com/s500x450/68918e1bdaf46f0011f17f65/group-20251121095100-xm60r.png`
- Class ảnh: `h-8 object-contain`
- Áp dụng đồng nhất: `index.html`, `tong-quan-chuong-trinh.html`, `the-le.html`, `leaderboard-prm-mien-bac.html`
- `index.html` quá lớn → không dùng Edit tool, thay bằng Python `str.replace()`

### 13. `index.html` — FAQ: Thêm 3 câu hỏi mới (Q9, Q10, Q11)
- Tổng FAQ tăng từ 8 → 11 câu hỏi
- Thêm 3 button (`switchFaq(8/9/10)`) vào `#faq-buttons`
- Thêm 3 entry vào `faqData[]`:
  - **Q9**: Rút quỹ thưởng bất kỳ lúc nào? → Chi trả theo kỳ (15/5, 15/8, 15/11, 15/2/2027) sau khi hoàn tất HĐMB
  - **Q10**: Xem số dư điểm ở đâu? → Leaderboard site + Telegram Bot; kèm sub-hỏi đáp chuyển chi nhánh (A→B ghi nhận theo từng giai đoạn)
  - **Q11**: Ráp căn thành công nhưng khách không ký HĐMB? → Điểm tạm tính, hệ thống thu hồi nếu không có HĐMB

### 14. `index.html` — Bảng Mốc Thưởng: Cập nhật dữ liệu
- Đổi tên cột "Tổng cộng" → "Tổng bonus"
- Cập nhật toàn bộ 7 giá trị cột Tổng bonus:

| Mốc | Bonus | Tổng bonus (cũ) | Tổng bonus (mới) |
|---|---|---|---|
| 10 | +5 | 15 | 5 |
| 18 | +8 | 26 | 13 |
| 32 | +12 | 44 | 25 |
| 80 | +40 | 120 | 65 |
| 150 | +32 | 182 | 97 |
| 320 | +68 | 388 | 165 |
| 680 | +138 | 818 | 303 |

- Dùng Python replace vì các giá trị cũ là duy nhất trong file → không có false positive

### 15. `index.html` — Header: Thêm nút "Tra cứu điểm của bạn"
- Thêm link button mới vào góc phải header, ngay sau icon `send`
- Icon: `search` (Material Symbols) + text "Tra cứu điểm của bạn"
- Style: `border border-white/10`, pill shape (`px-4 h-10 rounded-xl`), hover white
- `href="#"` (empty), `hidden sm:flex` (ẩn trên mobile)
- ⚠️ Chỉ mới thêm vào `index.html` — **chưa thêm vào 3 file còn lại** (bị gián đoạn giữa chừng)

---

## Key Design Patterns (để dùng lại)

### White Card Style (dùng trong tong-quan + the-le)
```html
<div class="bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
  <div class="bg-[#1e293b] text-white px-6 py-1 rounded-full text-sm font-bold tracking-widest uppercase mb-4">
    Badge Title
  </div>
  <div class="flex justify-between items-center border-b border-gray-100 py-2">
    <span class="text-gray-600 text-sm">Label</span>
    <span class="font-bold text-gray-800">Value</span>
  </div>
</div>
```

### Glassmorphism Card (dùng trong hero sections)
```css
background: rgba(255,255,255,0.04);
backdrop-filter: blur(16px);
border: 1px solid rgba(255,255,255,0.09);
```

### Nav Active System
```javascript
// Map filename → data-nav key, JS auto-applies .nav-active class
// CSS: a.nav-active { color: #ffd16c !important; }
```

### Mobile Menu Toggle
```javascript
function toggleMobileMenu() {
  document.getElementById('mobile-menu').classList.toggle('hidden');
  // + animate hamburger bars to X
}
```

### CSS Dropdown (desktop, no JS)
```css
.menu-item:hover .dropdown-menu { opacity: 1; visibility: visible; transform: translateY(0); }
.dropdown-menu { opacity: 0; visibility: hidden; transform: translateY(10px); transition: all 0.3s; }
```

---

## Pending / Next Steps

| Task | Status |
|---|---|
| `leaderboard-prm-mien-nam.html` | ❌ Chưa tạo |
| Kết nối CSV URL thật cho leaderboard | ⏳ Chờ sheet publish |
| Miền Bắc/Nam toggle wiring (2 CSV URLs) | ⏳ Chờ leaderboard nam |
| Responsive audit trên mobile thật | 📋 Nên test |
| SEO meta tags (og:title, og:image) | 📋 Optional |

---

## Common Pitfalls Encountered

1. **`index.html` quá lớn (~369KB)** — Read tool có thể timeout; dùng `sed -n 'LINE,LINEp'` hoặc `grep -n` để đọc từng phần
2. **Tailwind dynamic classes** — Khi JS toggle class, class phải tồn tại trong HTML trước (hoặc dùng CDN JIT mode đang được dùng)
3. **`the-le-chuong-trinh.html` đã đổi tên** — File cũ không còn tồn tại, tên mới là `tong-quan-chuong-trinh.html`
4. **CSV URL từ Google Sheet** — Phải dùng "Publish to web" (không phải share link thông thường); URL dạng `https://docs.google.com/spreadsheets/d/e/PUBLISHED_ID/pub?output=csv`
5. **Mobile nav trong leaderboard** có cấu trúc multiline khác các file còn lại — cần edit thủ công

---

## Session 4 Tasks Completed (2026-04-06)

### 16. Font Standardization — All 8 HTML files
- Replaced `font-['Space_Grotesk']` → `font-['Open_Sans']` across all 8 HTML files (prm + sih)
- **Why:** Nav bar and UI elements were using Space Grotesk inconsistently vs Open Sans body text
- Updated tech stack: fonts are now **Open Sans only** (dropped Space Grotesk, Manrope, Plus Jakarta Sans)

### 17. Remove Quick Stats Sidebar — the-le.html (prm + sih)
- Removed the "Tổng quan" quick stats card from the sidebar in `prm/the-le.html` and `sih/the-le.html`
- Note: Initially misunderstood as nav item — rolled back nav change via `git checkout` first

### 18. CSV Column Index Updates
- `prm/leaderboard-prm.html`: Name[0] → Area[1] → Branch[2] → **Score[3]** → latest_update[4]
- `sih/leaderboard-sih.html`: Name[0] → Team[1] → **Score[2]** → latest_update[3]
- **Why:** User reordered columns in Google Sheet source

### 19. Dark/Light Mode Toggle — prm pages
Added toggle button + light mode CSS + `localStorage` persistence to:
- `prm/leaderboard-prm-v2.html` (new duplicate — naming convention: `-v2` suffix)
- `prm/index.html`
- `prm/the-le.html`
- `prm/tong-quan-chuong-trinh.html`

#### Light mode CSS pattern used:
```css
/* Toggle button */
.theme-toggle { transition: all 0.2s; }
.theme-toggle:hover { transform: rotate(15deg); }

/* Key overrides */
html:not(.dark) body { background: #f0f4f8; color: #1a1a2e; }
html:not(.dark) nav { background: rgba(255,255,255,0.95) !important; ... }
html:not(.dark) [class*="text-secondary"] { color: #0369a1 !important; }   /* cyan → dark teal */
html:not(.dark) [class*="text-primary"] { color: #b45309 !important; }     /* gold → dark amber */
html:not(.dark) [class*="text-white"] { color: #1a1a2e !important; }
html:not(.dark) [class*="bg-\[#1e293b\]"] { color: #ffffff !important; }   /* keep white on dark labels */
html:not(.dark) [class*="text-on-background"] { color: #1a1a2e !important; }
html:not(.dark) [class*="text-on-surface-variant"] { color: #4b5563 !important; }
```

#### Toggle JS pattern:
```javascript
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark');
    document.getElementById('theme-icon').textContent = isDark ? 'light_mode' : 'dark_mode';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}
(function initTheme() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const useDark = saved ? saved === 'dark' : prefersDark;
    if (!useDark) document.documentElement.classList.remove('dark');
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = useDark ? 'light_mode' : 'dark_mode';
})();
```

#### Bug fixed:
Stray `}` at top of `<script>` block in `prm/the-le.html` caused silent JS syntax error breaking all JS.

### Commits (Session 4)
| Hash | Description |
|---|---|
| `5da3ecb` | Standardize font to Open Sans across all HTML files |
| `a17e6ad` | Remove Quick stats sidebar section from the-le pages |
| `418f0a3` | Update CSV column index mapping for both leaderboards |
| `6dd86a7` | Add dark/light mode toggle to prm pages |
| `7f84085` | Update leaderboard-prm, tong-quan, and sih/index |
