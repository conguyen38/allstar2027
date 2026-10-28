import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduceMotion) {
  const lenis = new Lenis({
    duration: 1.1,
    anchors: { offset: -80 }, // chừa chỗ cho header cố định (h-20)
  });

  const raf = (time: number) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  // Menu mobile và popup đăng nhập khóa cuộn bằng body.style.overflow = 'hidden'.
  const syncLock = () => {
    if (document.body.style.overflow === 'hidden') lenis.stop();
    else lenis.start();
  };
  new MutationObserver(syncLock).observe(document.body, { attributes: true, attributeFilter: ['style'] });
}
