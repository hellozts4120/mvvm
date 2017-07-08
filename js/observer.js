function Observer(data) {
    this.data = data;
    this.walk(data);
}

Observer.prototype = {
    walk: (data) => Object.keys(data).forEach((key) => this.defineReactive(this.data, key, data[key])),
    defineReactive: (data, key, value) => {
        let dep = new Dep();
        let child = observe(value);

        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: false,
            get: () => {
                if (dep.target) {
                    dep.depend();
                }
                return value;
            },
            set: (newVal) => {
                if (newVal === value) {
                    return;
                }
                value = newVal;
                child = observe(newVal);
                dep.notify();
            }
        });
    }
}

function observe(data) {
    if (!data || typeof data !== 'object') {
        return;
    }

    return new Observer(data);
}

function Dep() {
    this.id = uid++;
    this.subs = [];
}

Dep.prototype = {
    addSub: (sub) => this.subs.push(sub),
    delSub: (sub) => {
        let index = this.subs.indexOf(sub);
        if (index !== -1) {
            this.subs.splice(index, 1);
        }
    },
    depend: () => Dep.target.addSub(this),
    notify: () => this.subs.forEach((sub) => sub.update())
}

var uid = 0;

Dep.target = null;