/** Pure pixel helpers also used by the asset integrity checks. */
export function keyGreenMatte(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const red = data[i], green = data[i + 1], blue = data[i + 2];
    const excess = green - Math.max(red, blue);
    if (excess > 28) {
      const coverage = 1 - Math.max(0, Math.min(1, (excess - 28) / 90));
      data[i + 3] = Math.round(data[i + 3] * coverage);
      data[i + 1] = Math.min(green, Math.max(red, blue));
    }
  }
}

export function opaqueBounds(data: Uint8ClampedArray, width: number, height: number) {
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 160) {
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
  }
  if (right < left) throw new Error("Empty character frame");
  return { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
}
