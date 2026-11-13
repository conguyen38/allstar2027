/*
 * Chuyển trang kiểu vuốt ngang, hai hướng khác nhau để dễ phân biệt:
 *  - Bấm tab/link trong site: trang mới trượt vào từ trái sang.
 *  - Bấm Back/Forward của trình duyệt (traverse): trang mới trượt vào từ phải sang.
 * Hướng được gắn vào view transition dưới dạng "type"; animation nằm trong global.css.
 */
type Nav = { navigationType?: string };

// Trang cũ: biết mình đang đi tới đâu
window.addEventListener('pageswap', (e: any) => {
  if (!e.viewTransition) return;
  // Trang chọn chương trình đã có màn chuyển trang riêng (trang đích trượt lên). Nếu để thêm hiệu ứng vuốt ngang
  // thì người dùng thấy hai hiệu ứng nối nhau, giống như trang cũ hiện ra rồi mới tải trang mới.
  if (document.documentElement.classList.contains('pt-leaving')) {
    e.viewTransition.skipTransition();
    return;
  }
  const kind = (e.activation as Nav | null)?.navigationType;
  e.viewTransition.types?.add(kind === 'traverse' ? 'back' : 'tab');
});

// Trang mới: biết mình đến bằng cách nào
window.addEventListener('pagereveal', (e: any) => {
  if (!e.viewTransition) return;
  const kind = ((window as any).navigation?.activation as Nav | undefined)?.navigationType;
  e.viewTransition.types?.add(kind === 'traverse' ? 'back' : 'tab');
});
