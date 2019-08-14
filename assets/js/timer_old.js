class Timer {
    constructor(props, options) {
        Timer.nextID = (Timer.nextID === undefined)? 0 : ++Timer.nextID;

        this.id = Timer.nextID;
        this.h = 0;
        this.m = 0;
        this.s = 0;

        this.withH = false;
        this.withM = true;
        this.withS = true;

        if (props) {
            if (props.h) this.h = (props.h > 0)? props.h : -props.h;
            if (props.m) this.m = (props.m > 0)? props.m : -props.m;
            if (props.s) this.s = (props.s > 0)? props.s : -props.s;
        }

        if (options) {
            if (options.withH !== undefined) this.withH = !!options.withH;
            if (options.withM !== undefined) this.withM = !!options.withM;
            if (options.withS !== undefined) this.withS = !!options.withS;
        }

        this.initialProps = { h: this.h, m: this.m, s: this.s };

        this.val = 0;
        this.str = '';

        this.timerchange = new CustomEvent('timerchange', {
            bubbles: true,
            cancelable: true,
            detail: this
        });

        this.timerstop = new CustomEvent('timerstop', {
            bubbles: true,
            cancelable: true,
            detail: this
        });

        this.setVal();
        this.setProps();
        this.setStr();
    }

    start() {
        this.timeout = setTimeout(() => {
            if (this.val > 0) {
                this.dec();
                this.start();
            }
        }, 1000);

        if (this.val <= 0) this.stop();
    }

    stop() {
        document.dispatchEvent(this.timerstop);
        clearTimeout(this.timeout);
        this.reset();
    }

    reset() {
        this.h = this.initialProps.h;
        this.m = this.initialProps.m;
        this.s = this.initialProps.s;

        this.setVal();
        this.setProps();
        this.setStr();
    }

    dec() {
        document.dispatchEvent(this.timerchange);

        this.setVal();
        this.val--;
        this.setProps();
        this.setStr();
    }

    setVal() {
        this.val = (this.h * 3600) + (this.m * 60) + this.s;
    }

    setProps() {
        this.h = ~~(this.val / 3600);
        this.m = ~~(this.val / 60) % 60;
        this.s = this.val % 60;

        if (this.h >= 24) {
            this.h = 24;
            this.m = 0;
            this.s = 0;
            this.setVal();
        }
    }

    setStr() {
        this.str = '';

        let h = this.h.toString().padStart(2, '0');
        let m = this.m.toString().padStart(2, '0');
        let s = this.s.toString().padStart(2, '0');

        if (this.withH) this.str = `${h}:`;
        if (this.withM) this.str += `${m}:`;
        if (this.withS) this.str += `${s}`;
    }
}