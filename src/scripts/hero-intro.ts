/*
 * Hiệu ứng mở của hero (học theo trang rockstargames.com/VI):
 *  1. Các mảnh tranh nền xuất hiện lần lượt.
 *  2. Sau đó từng lớp phía trên mới lên: wordmark trước, nhãn chương trình sau (so le nhau).
 *  3. Xong hiệu ứng mở thì mở khóa cuộn.
 * html.hero-intro (đặt bởi script inline trong SunsetBanner) giữ các lớp ở trạng thái ẩn từ khung hình đầu tiên;
 * html.hero-lock khóa cuộn cho tới khi hiệu ứng mở chạy xong.
 */
import { gsap } from 'gsap';

const root = document.documentElement;
const pin = document.querySelector<HTMLElement>('[data-hero-pin]');
const cover = pin?.querySelector<HTMLElement>('[data-hero-sticky]');
const scene = cover?.querySelector<HTMLElement>('.club-scene');
const pieces = cover?.querySelectorAll<HTMLElement>('.hero-piece');
const piecesLayer = cover?.querySelector<HTMLElement>('.hero-pieces');
const wordmark = cover?.querySelector<HTMLElement>('.program-logo');
const tag = cover?.querySelector<HTMLElement>('.club-caption h1');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const finish = () => {
  root.classList.remove('hero-intro', 'hero-lock');
  (window as any).__heroIntroStarted = true;
};

if (!pin || !cover || !scene || reduceMotion || !root.classList.contains('hero-intro')) {
  // Không phát hiệu ứng mở khi vào từ tab khác hoặc bật giảm chuyển động.
  (window as any).__heroIntroStarted = true;
  root.classList.remove('hero-intro', 'hero-lock');
} else {
  (window as any).__heroIntroStarted = true;

  // Đợi tranh nền tải xong để không phóng/mờ khi ảnh chưa có.
  const start = () => {
    const tl = gsap.timeline({ defaults: { overwrite: 'auto' }, onComplete: finish });

    // Các mảnh dùng chung artwork và khung crop, nên ghép lại khít ở mọi kích thước.
    if (piecesLayer && pieces?.length) {
      gsap.set(scene, { autoAlpha: 0 });
      gsap.set(piecesLayer, { visibility: 'visible' });
      gsap.set(pieces, { opacity: 0, scale: 1.04 });
      tl.to(pieces, { opacity: 1, scale: 1, duration: .65, stagger: .12, ease: 'power2.out' }, 0)
        .set(scene, { clearProps: 'opacity,visibility' }, 1.35)
        .set(piecesLayer, { visibility: 'hidden' }, 1.35);
    }

    // Lớp 2: wordmark, rồi nhãn chương trình
    if (wordmark) {
      tl.fromTo(wordmark, { opacity: 0, y: 36, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power3.out', clearProps: 'transform,opacity' }, 1.15);
    }
    if (tag) {
      tl.fromTo(tag, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', clearProps: 'transform,opacity' }, 1.6);
    }

    // GSAP đã đặt trạng thái đầu (inline) cho các lớp nên gỡ class ẩn ngay; khóa cuộn giữ đến khi xong.
    root.classList.remove('hero-intro');
  };

  const img = scene as HTMLImageElement;
  if (img.complete && img.naturalWidth) {
    // Đã có ảnh (cache): đợi 1 khung hình cho trình duyệt dựng xong rồi chạy.
    requestAnimationFrame(start);
  } else {
    let started = false;
    const go = () => { if (!started) { started = true; start(); } };
    img.addEventListener('load', go, { once: true });
    img.addEventListener('error', go, { once: true });
    setTimeout(go, 3500);
  }
}
