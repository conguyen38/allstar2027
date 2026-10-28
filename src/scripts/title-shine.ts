/*
 * Mọi tiêu đề kiểu arena (h1/h2.font-arena) đều có vệt sáng chạy qua một lần
 * khi lọt vào màn hình. CSS nằm ở .title-shine trong global.css.
 */
const titles = document.querySelectorAll<HTMLElement>('h1.font-arena, h2.font-arena');

const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('shine-go');
        io!.unobserve(e.target);
      });
    }, { threshold: 0.4 })
  : null;

titles.forEach((el) => {
  el.classList.add('title-shine');
  if (io) io.observe(el);
  else el.classList.add('shine-go');
});
