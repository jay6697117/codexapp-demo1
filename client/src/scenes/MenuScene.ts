import Phaser from 'phaser';
import { networkManager } from '../network';
import { RoomListUI, RoomInfo } from '../ui/RoomListUI';
import { TextureGenerator } from '../utils/TextureGenerator';

const CHARACTERS = [
  { id: 'char_punk', name: 'CYBER PUNK' },
  { id: 'char_doge', name: 'DOGE COIN' },
  { id: 'char_chad', name: 'GIGA CHAD' },
  { id: 'char_original', name: 'normie' },
];

export class MenuScene extends Phaser.Scene {
  private connectingText?: Phaser.GameObjects.Text;
  private roomListUI!: RoomListUI;
  private selectedCharIndex: number = 0;
  private charPreview!: Phaser.GameObjects.Sprite;
  private charNameText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    TextureGenerator.createTextures(this);

    const { width, height } = this.cameras.main;

    // 标题
    const title = this.add.text(width / 2, 100, 'PUMPVILLE', {
      fontFamily: '"Press Start 2P"',
      fontSize: '48px',
      color: '#00ff00',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // 副标题
    const subtitle = this.add.text(width / 2, 160, 'Social . Explore . Play', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#888888',
    });
    subtitle.setOrigin(0.5);

    // 单人游戏按钮 (保留用于调试 Arena)
    const singlePlayerButton = this.add.text(width / 2, height / 2 - 40, '[ PRACTICE ARENA ]', {
      fontSize: '24px',
      color: '#ffffff',
      padding: { x: 20, y: 10 },
    });
    singlePlayerButton.setOrigin(0.5);
    singlePlayerButton.setInteractive({ useHandCursor: true });
    this.addHoverEffect(singlePlayerButton);
    singlePlayerButton.on('pointerdown', () => {
      this.scene.start('GameScene', { multiplayer: false });
    });

    // 多人游戏按钮 -> ENTER VILLAGE
    const multiPlayerButton = this.add.text(width / 2, height / 2 + 40, '[ ENTER VILLAGE ]', {
      fontSize: '32px',
      color: '#00ff00', // Neon Green
      padding: { x: 20, y: 10 },
      fontStyle: 'bold'
    });
    multiPlayerButton.setOrigin(0.5);
    multiPlayerButton.setInteractive({ useHandCursor: true });
    this.addHoverEffect(multiPlayerButton, 0x00ff00);
    multiPlayerButton.on('pointerdown', () => {
      this.enterVillageHub();
    });

    // Character Selector
    this.createCharacterSelector(width, height);

    // 版本号
    this.add.text(10, height - 30, 'v0.4.0 (Avatar Update)', {
      fontSize: '14px',
      color: '#444444',
    });
  }

  private addHoverEffect(textObj: Phaser.GameObjects.Text, color = 0xffffff) {
      textObj.on('pointerover', () => {
        textObj.setScale(1.1);
      });
      textObj.on('pointerout', () => {
        textObj.setScale(1.0);
      });
  }

  private enterVillageHub() {
    // 直接进入 VillageScene，由它负责网络连接
    // 我们生成一个随机名字传过去
    const randomName = 'Villager_' + Math.floor(Math.random() * 1000);
    this.scene.start('VillageScene', {
        name: randomName,
        character: CHARACTERS[this.selectedCharIndex].id
    });
  }

  private createCharacterSelector(width: number, height: number) {
      const y = height / 2 - 120;

      this.add.text(width / 2, y - 50, 'SELECT AVATAR', {
          fontFamily: '"Press Start 2P"',
          fontSize: '16px',
          color: '#00ff41'
      }).setOrigin(0.5);

      // Prev Button
      const prevBtn = this.add.text(width / 2 - 80, y, '<', {
          fontSize: '32px', color: '#ffffff', fontStyle: 'bold'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      prevBtn.on('pointerdown', () => this.changeCharacter(-1));

      // Next Button
      const nextBtn = this.add.text(width / 2 + 80, y, '>', {
          fontSize: '32px', color: '#ffffff', fontStyle: 'bold'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      nextBtn.on('pointerdown', () => this.changeCharacter(1));

      // Name
      this.charNameText = this.add.text(width / 2, y + 40, '', {
        fontFamily: 'monospace', fontSize: '16px', color: '#00ffff'
      }).setOrigin(0.5);

      // Preview Sprite (Scale up)
      this.charPreview = this.add.sprite(width / 2, y, CHARACTERS[0].id).setScale(2);

      this.updateCharacterDisplay();
  }

  private changeCharacter(delta: number) {
      this.selectedCharIndex += delta;
      if (this.selectedCharIndex < 0) this.selectedCharIndex = CHARACTERS.length - 1;
      if (this.selectedCharIndex >= CHARACTERS.length) this.selectedCharIndex = 0;
      this.updateCharacterDisplay();
  }

  private updateCharacterDisplay() {
      const char = CHARACTERS[this.selectedCharIndex];
      this.charPreview.setTexture(char.id);
      this.charNameText.setText(char.name);
  }
}
