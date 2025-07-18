class SabRing {
  constructor(sab, frameLen) {
    this.frameLen = frameLen;
    this.ctrl = new Int32Array(sab, 0, 2);
    this.data = new Float32Array(sab, 8);
    this.capacity = (sab.byteLength - 8) / (frameLen * 4);
  }
  push(frame) {
    const head = Atomics.load(this.ctrl, 0);
    const tail = Atomics.load(this.ctrl, 1);
    const next = (tail + 1) % this.capacity;
    if (next === head) return false;
    this.data.set(frame, tail * this.frameLen);
    Atomics.store(this.ctrl, 1, next);
    return true;
  }
  pop(target) {
    const head = Atomics.load(this.ctrl, 0);
    const tail = Atomics.load(this.ctrl, 1);
    if (head === tail) return false;
    target.set(this.data.subarray(head * this.frameLen, (head + 1) * this.frameLen));
    Atomics.store(this.ctrl, 0, (head + 1) % this.capacity);
    return true;
  }

  size() {
    const head = Atomics.load(this.ctrl, 0);
    const tail = Atomics.load(this.ctrl, 1);
    return tail >= head ? tail - head : this.capacity - head + tail;
  }
}

class DFSabProcessor extends AudioWorkletProcessor {
  constructor(opts) {
    super();
    const { sabIn, sabOut, frameLen } = opts.processorOptions;
    this.frameLen = frameLen;
    this.inRing = new SabRing(sabIn, frameLen);
    this.outRing = new SabRing(sabOut, frameLen);
    this.tmpIn = new Float32Array(frameLen);
    this.tmpOut = new Float32Array(frameLen);
    // write pointer for collecting input samples into tmpIn
    this.writePos = 0;
    // read pointer inside tmpOut when streaming processed frame to output
    this.readPos = frameLen; // force initial pop on first process()
    this.prevTail = 0; // last sample of previous frame

    // stats
    this.stats = {
      framesIn: 0,
      framesOut: 0,
      underflow: 0,
      overflow: 0,
    };
    this.lastLog = currentTime;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || input.length === 0 || output.length === 0) {
      return true;
    }

    const chIn = input[0];
    // We'll write first channel then optionally copy to others
    const chOut0 = output[0];

    let idx = 0;
    while (idx < chIn.length) {
      const remaining = this.frameLen - this.writePos;
      const toCopy = Math.min(remaining, chIn.length - idx);
      this.tmpIn.set(chIn.subarray(idx, idx + toCopy), this.writePos);
      this.writePos += toCopy;
      idx += toCopy;
      if (this.writePos === this.frameLen) {
        if (!this.inRing.push(this.tmpIn)) {
          this.stats.overflow++;
          if (this.stats.overflow % 10 === 0) {
            console.warn('[DF-Worklet] OVERFLOW', this.stats.overflow, 'inRing size', this.inRing.size());
          }
        }
        this.writePos = 0;
      }
    }

    // ---------------- Output side ----------------
    const blockLen = chOut0.length; // 128 samples @48 kHz
    let outIdx = 0;

    while (outIdx < blockLen) {
      // если исчерпали текущий кадр – берём следующий
      if (this.readPos === this.frameLen) {
        if (this.outRing.pop(this.tmpOut)) {
          // smooth boundary between frames
          const headDiff = Math.abs(this.tmpOut[0] - this.prevTail);
          if (headDiff > 0.1) {
            const FADE = 32;
            for (let i = 0; i < FADE && i < this.tmpOut.length; i++) {
              const t = i / FADE;
              this.tmpOut[i] = this.prevTail * (1 - t) + this.tmpOut[i] * t;
            }
          }
          this.prevTail = this.tmpOut[this.tmpOut.length - 1];
          this.readPos = 0;
        } else {
          // обработанных данных нет – пасс-тру остатка
          this.stats.underflow++;
          if (this.stats.underflow % 10 === 0) {
            console.warn('[DF-Worklet] UNDERFLOW', this.stats.underflow, 'outRing size', this.outRing.size());
          }
          chOut0.set(chIn.subarray(outIdx), outIdx);
          break;
        }
      }

      const copy = Math.min(this.frameLen - this.readPos, blockLen - outIdx);
      chOut0.set(this.tmpOut.subarray(this.readPos, this.readPos + copy), outIdx);

      this.readPos += copy;
      outIdx      += copy;
    }

    // Если осталось незаполненное место (редко) – копируем сырой сигнал
    if (outIdx < blockLen) {
      chOut0.set(chIn.subarray(outIdx), outIdx);
    }

    // if node outputs more than 1 channel, copy mono data to the rest
    for (let ch = 1; ch < output.length; ch++) {
      output[ch].set(output[0]);
    }

    // stats update
    this.stats.framesIn += chIn.length;
    this.stats.framesOut += chOut0.length;
    if (currentTime - this.lastLog > 1000) {
      console.log('[DF-Worklet] inRing', this.inRing.size(),
        'outRing', this.outRing.size(),
        'overflow', this.stats.overflow,
        'underflow', this.stats.underflow,
        'writePos', this.writePos,
        'readPos', this.readPos,
        'framesIn', this.stats.framesIn,
        'framesOut', this.stats.framesOut);
      this.lastLog = currentTime;
    }

    return true;
  }
}

registerProcessor('deepfilter-sab', DFSabProcessor); 