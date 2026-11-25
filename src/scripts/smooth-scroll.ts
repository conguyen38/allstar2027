import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/*
 * Lenis cuộn mượt, chạy chung nhịp với GSAP ticker (một vòng requestAnimationFrame duy nhất)
 * và báo vị trí cuộn cho ScrollTrigger mỗi khung hình. Các script khác lấy instance qua window.__lenis.
 */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduceMotion) {
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({
    duration: 1.1,
    anchors: { offset: -80 }, // chừa chỗ cho header cố định (h-20)
  });
  (window as any).__lenis = lenis;

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Menu mobile và popup đăng nhập khóa cuộn bằng body.style.overflow = 'hidden'.
  // Trong lúc hero đang chạy hiệu ứng mở (html.hero-lock) cũng khóa cuộn.
  const syncLock = () => {
    const introLocked = document.documentElement.classList.contains('hero-lock');
    if (document.body.style.overflow === 'hidden' || introLocked) lenis.stop();
    else lenis.start();
  };
  new MutationObserver(syncLock).observe(document.body, { attributes: true, attributeFilter: ['style'] });
  new MutationObserver(syncLock).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  syncLock();
}
