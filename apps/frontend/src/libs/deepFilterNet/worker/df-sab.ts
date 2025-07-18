/*
  Simple lock-free ring buffer over SharedArrayBuffer.
  Layout:
  [ head | tail | ...data (Float32) ]
  head, tail – Int32 (byte indexes of start/end)
*/
const CTRL_WORDS = 2; // head, tail
export class SabRing {
  readonly frameBytes: number;
  readonly capacityFrames: number;
  readonly sab: SharedArrayBuffer;
  private ctrl: Int32Array;
  private data: Float32Array;

  constructor(frameLen: number, capacityFrames: number) {
    this.frameBytes = frameLen * 4;
    this.capacityFrames = capacityFrames;
    const bytes = (CTRL_WORDS * 4) + this.frameBytes * capacityFrames;
    this.sab = new SharedArrayBuffer(bytes);
    this.ctrl = new Int32Array(this.sab, 0, CTRL_WORDS);
    this.data = new Float32Array(this.sab, CTRL_WORDS * 4);
  }

  static fromExisting(sab: SharedArrayBuffer, frameLen: number): SabRing {
    const rb = Object.create(SabRing.prototype);
    rb.sab = sab;
    rb.ctrl = new Int32Array(sab, 0, CTRL_WORDS);
    rb.data = new Float32Array(sab, CTRL_WORDS * 4);
    rb.frameBytes = frameLen * 4;
    rb.capacityFrames = (sab.byteLength - CTRL_WORDS * 4) / rb.frameBytes;
    return rb;
  }

  push(frame: Float32Array): boolean {
    if (frame.length * 4 !== this.frameBytes) return false;
    const head = Atomics.load(this.ctrl, 0);
    const tail = Atomics.load(this.ctrl, 1);
    const nextTail = (tail + 1) % this.capacityFrames;
    if (nextTail === head) return false; // full
    this.data.set(frame, tail * (this.frameBytes / 4));
    Atomics.store(this.ctrl, 1, nextTail);
    Atomics.notify(this.ctrl, 1, 1);
    return true;
  }

  pop(target: Float32Array): boolean {
    const head = Atomics.load(this.ctrl, 0);
    const tail = Atomics.load(this.ctrl, 1);
    if (head === tail) return false; // empty
    target.set(this.data.subarray(head * (this.frameBytes / 4), (head + 1) * (this.frameBytes / 4)));
    Atomics.store(this.ctrl, 0, (head + 1) % this.capacityFrames);
    return true;
  }

  waitForData() {
    // ждём дольше, чем длительность одного аудиокадра (10 мс @48 kHz)
    Atomics.wait(this.ctrl, 1, Atomics.load(this.ctrl, 1), 15);
  }

  size(): number {
    const head = Atomics.load(this.ctrl, 0);
    const tail = Atomics.load(this.ctrl, 1);
    return tail >= head ? tail - head : this.capacityFrames - head + tail;
  }

  isFull(): boolean {
    return this.size() === this.capacityFrames - 1;
  }
} 