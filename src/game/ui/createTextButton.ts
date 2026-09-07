import Phaser from "phaser";

export interface TextButtonOptions {
  fontSize?: number;
  color?: string;
  hoverColor?: string;
  backgroundColor?: string;
  hoverBackgroundColor?: string;
  paddingX?: number;
  paddingY?: number;
}

const DEFAULTS: Required<TextButtonOptions> = {
  fontSize: 32,
  color: "#fff3df",
  hoverColor: "#ffffff",
  backgroundColor: "#36204f",
  hoverBackgroundColor: "#5b367b",
  paddingX: 28,
  paddingY: 14,
};

/**
 * Creates a clearly button-like, pointer-interactive text object.
 *
 * Shared helper only; this is intentionally not a generalized UI framework.
 */
export function createTextButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  options: TextButtonOptions = {},
): Phaser.GameObjects.Text {
  const opts = { ...DEFAULTS, ...options };

  const button = scene.add
    .text(x, y, label, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: `${opts.fontSize}px`,
      color: opts.color,
      padding: { x: opts.paddingX, y: opts.paddingY },
      align: "center",
      fontStyle: "bold",
      shadow: { offsetX: 0, offsetY: 2, color: "#150d2e", blur: 2, fill: true },
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

  const plate = scene.add.graphics();
  const drawPlate = (hover: boolean): void => {
    const width = button.width + 12, height = button.height + 2;
    const fill = Phaser.Display.Color.HexStringToColor(hover ? opts.hoverBackgroundColor : opts.backgroundColor).color;
    plate.clear();
    plate.fillStyle(0x050919, 0.6).fillRoundedRect(x - width / 2, y - height / 2 + 5, width, height, 16);
    plate.fillStyle(fill, 0.96).fillRoundedRect(x - width / 2, y - height / 2, width, height, 16);
    plate.lineStyle(2, hover ? 0xf7c17c : 0x9d7bb9, 0.9).strokeRoundedRect(x - width / 2, y - height / 2, width, height, 16);
    plate.lineStyle(1, 0xf2d7ff, 0.25).lineBetween(x - width / 2 + 17, y - height / 2 + 3, x + width / 2 - 17, y - height / 2 + 3);
  };
  drawPlate(false);
  scene.children.moveBelow(plate, button);
  button.once(Phaser.GameObjects.Events.DESTROY, () => plate.destroy());

  button.on(Phaser.Input.Events.POINTER_OVER, () => {
    button.setColor(opts.hoverColor);
    drawPlate(true);
  });

  button.on(Phaser.Input.Events.POINTER_OUT, () => {
    button.setColor(opts.color);
    drawPlate(false);
  });

  button.on(Phaser.Input.Events.POINTER_UP, onClick);

  return button;
}
