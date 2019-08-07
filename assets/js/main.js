const rand = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const qs = (selector) => {
    return document.querySelector(selector);
}

const qsAll = (selector) => {
    return document.querySelectorAll(selector);
}

const getStyle = (element, style) => {
    let s = getComputedStyle(element)[style];
    return (!isNaN(parseInt(s)))? parseInt(s) : s;
}

class Game {
    constructor() {
        this.time = 0;
        this.players = [];
        this.objects = [];

        this.gamemode = 1;

        this.numPlayers = 1;

        this.keys = new Set();

        this.binds();
    }

    binds() {
        document.addEventListener('keydown', (e) => {
            this.keys.add(e.keyCode);
        });

        document.addEventListener('keyup', (e) => {
            this.keys.delete(e.keyCode);
        });


        qsAll('.players-selector input').forEach((radio) => {
            radio.addEventListener('click', (e) => {
                let value = +e.target.value

                if (value === 1) {
                    qs('.two-player-form').classList.remove('enable');
                    qs('.one-player-form').classList.add('enable');
                    this.numPlayers = value;
                }

                if (value === 2) {
                    qs('.one-player-form').classList.remove('enable');
                    qs('.two-player-form').classList.add('enable');
                    this.numPlayers = value;
                }
            });
        });

        qsAll('.start-button').forEach((button) => {
            button.addEventListener('click', (e) => {
                e.preventDefault();

                if (this.checkNicknames())
                    this.start();
                else
                    alert('Допустима длинна для "Имя игрока" от 3 до 16 символов');

            });
        });
    }

    start() {
        qs('.start').classList.remove('enable');
        qs('.field').classList.add('enable');
        qs('.stats').classList.add('enable');

        this.spawnPlayers();

        this.spawnEnemy();

        this.loop();
    }

    getTimer() {

    }

    setTimer() {

    }

    loop() {
        requestAnimationFrame(() => {
            this.objects.forEach((object) => object.update());
            this.checkCollision();
            this.loop();
        });
    }

    spawnEnemy(gamemode = this.gamemode) {
        if (gamemode === 1) {
            let timeout = setTimeout(() => {
                this.objects.push(new Enemy(this));
                this.spawnEnemy();
            }, rand(2000, 4000));
        }
    }

    spawnPlayers() {
        if (this.numPlayers === 1) {
            this.players.push(new Player_1(this, qs('#nickname').value));
            this.objects.push(this.players[0]);
            this.setNicknames();
        }

        if (this.numPlayers === 2) {
            this.players.push(new Player_1(this, qs('#nickname-1').value));
            this.objects.push(this.players[0]);
            this.players.push(new Player_2(this, qs('#nickname-2').value));
            this.objects.push(this.players[1]);
            this.setNicknames();
        }
    }

    setNicknames() {
        if (this.numPlayers === 1) {
            qs('.stats__player-1 .name').innerText = this.players[0].nickname;
        }

        if (this.numPlayers === 2) {
            qs('.stats__player-2').classList.add('enable');

            qs('.stats__player-1 .name').innerText = this.players[0].nickname;
            qs('.stats__player-2 .name').innerText = this.players[1].nickname;
        }
    }

    checkNicknames(from = 3, to = 16) {
        if (this.numPlayers === 1) {
            let nn = qs('#nickname').value;

            return (nn.length >= from && nn.length <= to);
        }

        if (this.numPlayers === 2) {
            let nn1 = qs('#nickname-1').value;
            let nn2 = qs('#nickname-2').value;

            return (nn1.length >= from && nn1.length <= to) &&
                   (nn2.length >= from && nn2.length <= to);
        }
    }

    checkCollision() {
        this.objects.forEach((objA) => {
            this.objects.forEach((objB) => {
                let nameA = objA.constructor.name.toLowerCase();
                let nameB = objB.constructor.name.toLowerCase();

                if (this.isCollision(objA, objB)) {
                    if ((nameA === 'playerbullet') && (nameB === 'enemy')) {
                        objA.remove();
                        objB.remove();
                    }
                }
            });
        });
    }

    isCollision(objA, objB) {
        let a = {
            x1: objA.x,
            y1: objA.y,
            x2: objA.x + objA.width,
            y2: objA.y + objA.height
        }

        let b = {
            x1: objB.x,
            y1: objB.y,
            x2: objB.x + objB.width,
            y2: objB.y + objB.height
        }

        return !( (a.x2 < b.x1) || (a.x1 > b.x2) ||
                  (a.y2 < b.y1) || (a.y1 > b.y2) );
    }
}

const game = new Game();

class Drawable {
    constructor(game) {
        this.game = game;

        this.el = {};

        this.width = 0;
        this.height = 0;
        this.x = 0;
        this.y = 0;

        this.offset = {
            x: 0,
            y: 0
        }
    }

    draw() {
        this.el = document.createElement('div');
        this.el.classList.add('draw', `${this.constructor.name.toLowerCase()}`);
        qs('.field').appendChild(this.el);
    }

    update() {
        this.updateCords();

        this.el.style.top = `${this.y}px`;
        this.el.style.left = `${this.x}px`;
    }

    updateCords() {
        this.x += this.offset.x;
        this.y += this.offset.y;
    }

    remove() {
        this.el.remove();
        let index = this.game.objects.indexOf(this);
        this.game.objects.splice(index, 1);
    }
}

class Weapon extends Drawable {
    constructor(player, params, shoot) {
        super(player.game);

        this.name = 'Обычный выстрел';
        this.damage = 2;
        this.mp = 0;
        this.cd = 0;

        this.offset = {
            x: 8,
            y: 0
        }

        if (params) {
            if (params.name) this.name = params.name;
            if (params.damage) this.damage = params.damage;
            if (params.mp) this.mp = params.mp;
            if (params.cd) this.cd = params.cd;
            if (params.offset){
                if (params.offset.x) this.offset.x = params.offset.x;
                if (params.offset.y) this.offset.y = params.offset.y;
            }
        }

        this.shoot = () => {
            this.shooted = true;
            this.game.objects.push(new PlayerBullet(player.game, player));
        }

        if (shoot) this.shoot = shoot;

        this.shooted = false;
    }
}

class Player extends Drawable {
    constructor(game, nickname) {
        super(game);

        this.weapons = [
            new Weapon(this, {
                name: 'Обычный выстрел'
            }),

            new Weapon(this, {
                name: 'Тройной выстрел',
                damage: 4,
                mp: 6,
                cd: 3
            }, () => {
                this.weapon.shooted = true;

                let params = {
                    width: 20,
                    height: 10,
                    image: 'pbullet-1.png'
                }

                this.weapon.offset.y = 0;
                this.game.objects.push(new PlayerBullet(this.game, this, params));
                this.weapon.offset.y = this.weapon.offset.x / 2;
                this.game.objects.push(new PlayerBullet(this.game, this, params));
                this.weapon.offset.y = -this.weapon.offset.y;
                this.game.objects.push(new PlayerBullet(this.game, this, params));
            }),

            new Weapon(this, {
                name: 'Усиленный выстрел',
                damage: 6,
                mp: 8,
                cd: 5
            }, () => {
                this.weapon.shooted = true;

                let params = {
                    width: 20,
                    height: 30,
                    image: 'pbullet-2.png'
                }

                this.game.objects.push(new PlayerBullet(this.game, this, params));
            })
        ];

        this.weapon = this.weapons[0];

        this.nickname = nickname;

        this.width = 140;
        this.height = 40;

        this.stats = {
            hp: 100,
            mp: 50,
            score: 0,
        };

        this.speed = 10;
    }

    checkKeys() {}

    checkCords() {
        let maxw = getStyle(qs('.field'), 'width') - this.width;
        let maxh = getStyle(qs('.field'), 'height') - this.height;

        if (this.x > maxw) this.x = maxw;
        if (this.y > maxh) this.y = maxh;
        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;
    }

    updateCords() {
        this.checkKeys();
        super.updateCords();
        this.checkCords();
    }

    draw() {
        super.draw();
        this.width = getStyle(this.el, 'width');
        this.height = getStyle(this.el, 'height');
    }

    remove() {
        super.remove();
        let index = this.game.players.indexOf(this);
        this.game.players.splice(index, 1);
    }
}

class Player_1 extends Player {
    constructor(game, nickname) {
        super(game, nickname);

        if (this.game.numPlayers === 1) {
            this.x = 5;
            this.y = (getStyle(qs('.field'), 'height') / 2) - this.height;
        }

        if (this.game.numPlayers === 2) {
            this.x = 5;
            this.y = (getStyle(qs('.field'), 'height') / 4) + this.height;
        }

        this.draw();
    }

    checkKeys() {
        let keys = this.game.keys;

        this.offset.x = 0;
        this.offset.y = 0;

        if (keys.has(87))
            this.offset.y = -this.speed;

        if (keys.has(83))
            this.offset.y = this.speed;

        if (keys.has(65))
            this.offset.x = -this.speed;

        if (keys.has(68))
            this.offset.x = this.speed;

        if (keys.has(32) && !this.weapon.shooted)
            this.weapon.shoot();
        else if (!keys.has(32))
            this.weapon.shooted = false;

        if (keys.has(49)) {
            this.weapon = this.weapons[0];
        }

        if (keys.has(50)) {
            this.weapon = this.weapons[1];
        }

        if (keys.has(51)) {
            this.weapon = this.weapons[2];
        }
    }
}

class Player_2 extends Player {
    constructor(game, nickname) {
        super(game, nickname);

        this.x = 5;
        this.y = (getStyle(qs('.field'), 'height')  / 4) * 2 + this.height;

        this.draw();
    }

    checkKeys() {
        let keys = this.game.keys;

        this.offset.x = 0;
        this.offset.y = 0;

        if (keys.has(38))
            this.offset.y = -this.speed;

        if (keys.has(40))
            this.offset.y = this.speed;

        if (keys.has(37))
            this.offset.x = -this.speed;

        if (keys.has(39))
            this.offset.x = this.speed;

        if (keys.has(16) && !this.weapon.shooted)
            this.weapon.shoot();
        else if (!keys.has(16))
            this.weapon.shooted = false;

        if (keys.has(35)) {
            this.weapon = this.weapons[0];
        }

        if (keys.has(40)) {
            this.weapon = this.weapons[1];
        }

        if (keys.has(34)) {
            this.weapon = this.weapons[2];
        }
    }
}

class Enemy extends Drawable {
    constructor(game, params) {
        super(game);

        this.weapons = [
            new Weapon(this, {
                name: 'Обычный выстрел',
                cd: 1,
                offset: {
                    x: -8
                }
            }, () => {
                let params = {
                    width: 20,
                    height: 10,
                    image: 'ebullet-1.png'
                }

                this.game.objects.push(new EnemyBullet(this.game, this, params));
                this.weapon.timeoutShoot = setTimeout(() => this.weapon.shoot(), 600);
            }),

            new Weapon(this, {
                name: 'Тройной выстрел',
                damage: 4,
                mp: 6,
                cd: 3,
                offset: {
                    x: - 8
                }
            }, () => {
                let params = {
                    width: 20,
                    height: 10,
                    image: 'ebullet-1.png'
                }

                this.weapon.offset.y = 0;
                this.game.objects.push(new EnemyBullet(this.game, this, params));
                this.weapon.offset.y = this.weapon.offset.x / 2;
                this.game.objects.push(new EnemyBullet(this.game, this, params));
                this.weapon.offset.y = -this.weapon.offset.y;
                this.game.objects.push(new EnemyBullet(this.game, this, params));

                this.weapon.timeoutShoot = setTimeout(() => this.weapon.shoot(), 1800);
            }),

            new Weapon(this, {
                name: 'Усиленный выстрел',
                damage: 6,
                mp: 8,
                cd: 5,
                offset: {
                    x: -8
                }
            }, () => {
                let params = {
                    width: 20,
                    height: 30,
                    image: 'еbullet-2.png'
                }

                this.game.objects.push(new EnemyBullet(this.game, this, params));

                this.weapon.timeoutShoot = setTimeout(() => this.weapon.shoot(), 3000);
            })
        ];

        this.weapon = this.weapons[0];

        this.name = 'ИЛ-2 Штурмовик';

        this.width = 140;
        this.height = 40;

        this.x = getStyle(qs('.field'), 'width');
        this.y = rand(0 + this.width, getStyle(qs('.field'),'height') - this.width);

        this.image = 'enemy.png';

        this.speed = 4;

        this.stats = {
            hp: 100,
            mp: 50
        }

        if (params) {
            if (params.x) this.x = params.x;
            if (params.y) this.y = params.y;

            if (params.image) this.image = params.image;
            if (params.width) this.width = params.width;
            if (params.height) this.height = params.height;

            if (params.speed) this.speed = params.speed;

            if (params.stats) {
                if (params.stats.hp) this.stats.hp = params.stats.hp;
                if (params.stats.mp) this.stats.mp = params.stats.mp;
            }
        }

        this.offset.x = -this.speed;

        this.draw();

        this.el.style.width = `${this.width}px`;
        this.el.style.height = `${this.height}px`;
        this.el.style.backgroundImage = `url('./assets/images/${this.image}')`;

        this.weapon.shoot();
    }

    checkCords() {
        let maxw = getStyle(qs('.field'), 'width');

        if (this.x + this.width < 0) {
            if (this.game.gamemode === 1) this.remove();
            if (this.game.gamemode === 2) this.x = maxw;
        }
    }

    updateCords() {
        super.updateCords();
        this.checkCords();
    }

    remove() {
        clearTimeout(this.weapon.timeoutShoot);
        super.remove();
    }
}

class Bullet extends Drawable {
    constructor(game) {
        super(game);

        this.width = 20;
        this.height = 10;

        this.image = 'pbullet-1.png';
    }

    checkCords() {
        let maxw = getStyle(qs('.field'), 'width') - this.width;
        let maxh = getStyle(qs('.field'), 'height') - this.height;

        if (this.x > maxw || this.x < 0 ||
            this.y > maxh || this.y < 0) this.remove();
    }

    updateCords() {
        super.updateCords();
        this.checkCords();
    }
}

class PlayerBullet extends Bullet {
    constructor(game, player, params) {
        super(game);

        this.player = player;
        this.weapon = player.weapon;

        if (params) {
            if (params.width) this.width = params.width;
            if (params.height) this.height = params.height;
            if (params.image) this.image = params.image;
        }

        this.x = player.x + player.width;
        this.y = player.y + (player.height - this.height) / 2 + 2;


        this.offset.x = this.weapon.offset.x;
        this.offset.y = this.weapon.offset.y;

        this.draw();

        this.el.style.width = `${this.width}px`;
        this.el.style.height = `${this.height}px`;
        this.el.style.backgroundImage = `url('./assets/images/${this.image}')`;
    }
}

class EnemyBullet extends Bullet {
    constructor(game, enemy, params) {
        super(game);

        this.enemy = enemy;
        this.weapon = enemy.weapon;

        if (params) {
            if (params.width) this.width = params.width;
            if (params.height) this.height = params.height;
            if (params.image) this.image = params.image;
        }

        this.x = enemy.x - this.width;
        this.y = enemy.y + (enemy.height - this.height) / 2 + 2;


        this.offset.x = this.weapon.offset.x;
        this.offset.y = this.weapon.offset.y;

        this.draw();

        this.el.style.width = `${this.width}px`;
        this.el.style.height = `${this.height}px`;
        this.el.style.backgroundImage = `url('./assets/images/${this.image}')`;
    }
}
