// One place for all input: keyboard and on-screen touch buttons feed the same actions.
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  KeyZ: 'punchL', KeyJ: 'punchL',
  KeyX: 'punchR', KeyK: 'punchR',
  Enter: 'star', Space: 'star',
  Escape: 'pause', KeyP: 'pause',
  KeyC: 'stance', ShiftLeft: 'stance', ShiftRight: 'stance',
  KeyM: 'mute',
};

class Controls {
  constructor() {
    this.down = new Set();
    this.pressed = new Set();
    this.onFirstInput = null;
  }

  attach() {
    window.addEventListener('keydown', (e) => {
      const a = KEYMAP[e.code];
      if (!a) return;
      e.preventDefault();
      if (!e.repeat) this.press(a);
    });
    window.addEventListener('keyup', (e) => {
      const a = KEYMAP[e.code];
      if (a) this.release(a);
    });
    window.addEventListener('blur', () => this.down.clear());

    const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (isTouch) document.body.classList.add('touch');
    document.querySelectorAll('#pad button').forEach((btn) => {
      const a = btn.dataset.action;
      const on = (e) => { e.preventDefault(); btn.classList.add('on'); this.press(a); };
      const off = (e) => { e.preventDefault(); btn.classList.remove('on'); this.release(a); };
      btn.addEventListener('pointerdown', on);
      btn.addEventListener('pointerup', off);
      btn.addEventListener('pointercancel', off);
      btn.addEventListener('pointerleave', off);
    });
    return isTouch;
  }

  press(a) {
    if (this.onFirstInput) { this.onFirstInput(); }
    if (!this.down.has(a)) this.pressed.add(a);
    this.down.add(a);
  }

  release(a) { this.down.delete(a); }
  isDown(a) { return this.down.has(a); }
  justDown(a) { return this.pressed.has(a); }
  // "Confirm" on menus is any punch or the star button.
  confirm() { return this.pressed.has('punchL') || this.pressed.has('punchR') || this.pressed.has('star'); }
  endFrame() { this.pressed.clear(); }
}

export const controls = new Controls();
