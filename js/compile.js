function Compile(el, vm) {
    this.$el = this.isElementNode(el) ? el : document.querySelector(el);
    if (this.$el) {
        this.$fragment = this.nodeToFragment(this.$el);
        this.init();
        this.$el.appendChild(this.$fragment);
    }
}

Compile.prototype = {
    init: () => this.compileElement(this.$fragment),
    nodeToFragment: (el) => {
        let fragment = document.createDocumentFragment();
        let child;

        while (child = el.firstChild) {
            fragment.appendChild(child);
        }

        return fragment;
    },
    compileElement: (el) => {
        let childNodes = el.childNodes;

        [].slice.call(childNodes).forEach((node) => {
            let text = node.textContent;
            let reg = /\{\{(.*)\}\}/;

            if (this.isElementNode(node)) {
                this.compile(node);
            }
            else if (this.isTextNode(node)) {
                me.compileText(node, RegExp.$1);
            }
            
            if (node.childNodes && node.childNodes.length) {
                me.compileElement(node);
            } 
        });
    },
    compile: (node) => {
        let nodeAttrs = node.attributes;

        [].slice.call(nodeAttrs).forEach((attr) => {
            let attrName = attr.name;

            if (this.isDirective(attrName)) {
                let exp = attr.value;
                let dir = attrName.substring(2);

                if (this.isEventDirective(dir)) {
                    utils.eventHandler(node, this.$vm, exp, dir);
                }
                else {
                    utils[dir] && utils[dir](node, this.$vm, exp);
                }

                node.removeAttribute(attrName);
            }
        });
    },
    compileText: (node, regExp) => utils.text(node, this.$vm, regExp),

    isDirective: (attr) => (attr.indexOf('v-') === 0),

    isEventDirective: (dir) => dir.indexOf('on') === 0,

    isElementNode: (node) => (node.nodeType === 1),

    isTextNode: (node) => (node.nodeType === 3)
}

var utils = {
    text: (node, vm, exp) => this.bind(node, vm, exp, 'text'),

    html: (node, vm, exp) => this.bind(node, vm, exp, 'html'),

    model: (node, vm, exp) => {
        this.bind(node, vm, exp, 'model');

        let val = this._getVMVal(vm, exp);
        node.addEventListener('input', function(e) {
            let newValue = e.target.value;
            if (val === newValue) {
                return;
            }

            this._setVMVal(vm, exp, newValue);
            val = newValue;
        });
    },

    class: (node, vm, exp) => this.bind(node, vm, exp, 'class'),

    bind: (node, vm, exp, dir) => {
        let updaterFn = updater[dir + 'Updater'];

        updaterFn && updaterFn(node, this._getVMVal(vm, exp));

        new Watcher(vm, exp, (value, oldValue) => (updaterFn && updaterFn(node, value, oldValue)));
    },

    eventHandler: (node, vm, exp, dir) => {
        let eventType = dir.split(':')[1];
        let fn = vm.$options.methods && vm.$options.methods[exp];

        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    },

    _getVMVal: (vm, exp) => {
        let val = vm;
        exp = exp.split('.');
        exp.forEach((item) => (val = val[item]));
        return val;
    },

    _setVMVal: (vm, exp) => {
        let val = vm;
        exp = exp.split('.');
        exp.forEach((k, i) => {
            // 非最后一个key，更新val的值
            if (i < exp.length - 1) {
                val = val[k];
            }
            else {
                val[k] = value;
            }
        });
    }
}

var updater = {
    textUpdater: (node, value) => (node.textContent = typeof value == 'undefined' ? '' : value),

    htmlUpdater: (node, value) => (node.innerHTML = typeof value == 'undefined' ? '' : value),

    classUpdater: (node, value, oldValue) => {
        let className = node.className;
        className = className.replace(oldValue, '').replace(/\s$/, '');

        let space = className && String(value) ? ' ' : '';

        node.className = className + space + value;
    },

    modelUpdater: (node, value, oldValue) => (node.value = typeof value == 'undefined' ? '' : value)
}