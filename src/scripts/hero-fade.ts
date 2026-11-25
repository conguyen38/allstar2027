/*
 * Hero trang home: ghim hero lại khi cuộn, nền + logo mờ dần về màu nền trang,
 * hết quãng mờ thì hero nhả ra và nội dung bên dưới trượt lên.
 * Chạy theo vị trí cuộn (Lenis cập nhật scrollY mỗi khung hình nên rất mượt).
 */
const pin = document.querySelector<HTMLElement>('[data-hero-pin]');
const sticky = pin?.querySelector<HTMLElement>('[data-hero-sticky]');
const logo = pin?.querySelector<HTMLElement>('[data-hero-logo]');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (pin && sticky && !reduceMotion) {
  pin.setAttribute('data-hero-fx', '');

  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  const smooth = (t: number) => t * t * (3 - 2 * t);

  const update = () => {
    const runway = pin.offsetHeight - sticky.offsetHeight;
    if (runway <= 0) return;
    // Hero dính ở top = chiều cao header (5rem); tiến độ 0 → 1 trong quãng "runway".
    const headerH = parseFloat(getComputedStyle(sticky).top) || 0;
    const scrolled = headerH - pin.getBoundingClientRect().top;
    const p = clamp(scrolled / runway);
    // Mờ tranh để lộ cùng một nền lá cọ phía sau banner và các bảng.
    sticky.style.setProperty('--scene-opacity', String(1 - smooth(clamp(p / 0.85))));
    if (logo) {
      // Giữ logo tại chỗ, bắt đầu mờ sau khi tranh đã mờ bớt.
      const out = smooth(clamp((p - 0.45) / 0.45));
      logo.style.opacity = String(1 - out);
    }
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}
