import Phaser from "phaser";
import { ART_SOURCES } from "../config/artManifest";
import { prepareArt } from "../art/prepareArt";

export class BootScene extends Phaser.Scene {
  private failed = false;
  private status!: Phaser.GameObjects.Text;

  constructor() { super("BootScene"); }

  preload(): void {
    this.failed = false;
    this.add.text(640, 285, "PEDRO", { fontFamily: "Trebuchet MS, sans-serif", fontSize: "52px", fontStyle: "bold", color: "#fff1dd" }).setOrigin(0.5);
    this.status = this.add.text(640, 354, "Preparando la aventura…", { fontFamily: "Trebuchet MS, sans-serif", fontSize: "20px", color: "#c5b7e7" }).setOrigin(0.5);
    this.add.rectangle(640, 402, 320, 4, 0x302549);
    const progress = this.add.rectangle(480, 402, 0, 4, 0xd9a3ff).setOrigin(0, 0.5);
    this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => { progress.setSize(320 * value, 4); });
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, () => {
      this.failed = true;
      this.status.setText("No pudimos cargar el arte. Recargá para reintentar.");
    });
    for (const source of ART_SOURCES) this.load.image(source.key, `${import.meta.env.BASE_URL}${source.path}`);
  }

  create(): void {
    if (this.failed) return;
    try {
      prepareArt(this);
      this.scene.start("MenuScene");
    } catch (error) {
      console.error("Art preparation failed", error);
      this.status.setText("No pudimos preparar el arte. Recargá para reintentar.");
    }
  }
}
