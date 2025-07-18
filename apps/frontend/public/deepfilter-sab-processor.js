// deepfilter-sab-processor.js – пакует 480 сэмплов без ресэмплинга
/* eslint-disable */
class SabRing {
  constructor(sab, frameLen) {
    this.len = frameLen;
    this.ctrl = new Int32Array(sab, 0, 2); // head, tail
    this.data = new Float32Array(sab, 8);
    this.cap = (sab.byteLength - 8) / (4 * frameLen);
  }
  push(frame) {
    const h = Atomics.load(this.ctrl, 0);
    const t = Atomics.load(this.ctrl, 1);
    const n = (t + 1) % this.cap;
    if (n === h) return false;
    this.data.set(frame, t * this.len);
    Atomics.store(this.ctrl, 1, n);
    Atomics.notify(this.ctrl, 1);
    return true;
  }
  pop(dst) {
    const h = Atomics.load(this.ctrl, 0);
    const t = Atomics.load(this.ctrl, 1);
    if (h === t) return false;
    dst.set(this.data.subarray(h * this.len, (h + 1) * this.len));
    Atomics.store(this.ctrl, 0, (h + 1) % this.cap);
    return true;
  }
}

class Packer {
  constructor(frameLen, pushCb) {
    this.len = frameLen;
    this.push = pushCb;
    this.buf = new Float32Array(frameLen);
    this.pos = 0;
    this.tail = new Float32Array(32);
    this.tailPos = 0;
  }
  feed(block) {
    let idx = 0;
    // 1. достраиваем предыдущий кадр хвостом
    if (this.tailPos) {
      const take = Math.min(this.len - this.pos, this.tailPos);
      this.buf.set(this.tail.subarray(0, take), this.pos);
      this.pos += take;
      this.tail.copyWithin(0, take, this.tailPos);
      this.tailPos -= take;
      if (this.pos === this.len) {
        this.push(this.buf);
        this.pos = 0;
      }
    }
    // 2. основной поток
    while (idx < block.length) {
      const take = Math.min(this.len - this.pos, block.length - idx);
      this.buf.set(block.subarray(idx, idx + take), this.pos);
      this.pos += take; idx += take;
      if (this.pos === this.len) {
        this.push(this.buf);
        this.pos = 0;
      }
    }
    // 3. хвост (<=32)
    if (idx < block.length) {
      const remain = block.length - idx;
      this.tail.set(block.subarray(idx), 0);
      this.tailPos = remain;
    }
  }
}

class Unpacker {
  constructor(frameLen, popCb) {
    this.len = frameLen;
    this.pop = popCb;
    this.src = new Float32Array(frameLen);
    this.readPos = frameLen; // force pop first time
  }
  pull(block) {
    let i = 0;
    while (i < block.length) {
      if (this.readPos === this.len) {
        if (!this.pop(this.src)) break;
        this.readPos = 0;
      }
      const take = Math.min(this.len - this.readPos, block.length - i);
      block.set(this.src.subarray(this.readPos, this.readPos + take), i);
      this.readPos += take; i += take;
    }
    if (i < block.length) block.fill(0, i); // fallback silence
  }
}

class DFSabProcessor extends AudioWorkletProcessor {
  constructor(opts) {
    super();
    const { sabIn, sabOut } = opts.processorOptions;
    this.packer = new Packer(480, (f) => this.inRing.push(f));
    this.inRing = new SabRing(sabIn, 480);
    this.unpacker = new Unpacker(480, (dst) => this.outRing.pop(dst));
    this.outRing = new SabRing(sabOut, 480);
  }
  process(inputs, outputs) {
    const inp = inputs[0][0];
    const out = outputs[0];
    if (!inp) return true;
    this.packer.feed(inp);
    this.unpacker.pull(out[0]);
    for (let c = 1; c < out.length; c++) out[c].set(out[0]);
    return true;
  }
}
registerProcessor('deepfilter-sab', DFSabProcessor);