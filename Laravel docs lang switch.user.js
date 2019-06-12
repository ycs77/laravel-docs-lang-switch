// ==UserScript==
// @name         快速切換 Laravel 文檔語言
// @namespace    https://github.com/ycs77
// @version      1.2
// @description  安裝此外掛後，Laravel 文檔中將自動出現語言切換的按鈕，可以輕鬆切換英文和中文。
// @author       Lucas Yang
// @match        https://laravel.com/docs/*
// @match        https://laravel.tw/docs/*
// @match        https://learnku.com/*
// @require      https://unpkg.com/compare-versions@3.4.0/index.js
// @license      MIT
// ==/UserScript==

;(function () {
    'use strict';

    let d = document;

    function LaravelLang(lang) {
        this.url = window.location.href;
        this.master_version = '5.9';
        this.langs = {
            en: {
                title: 'English',
                prefix: 'https://laravel.com/docs/',
                master_version: 'master',
                min_version: '4.2'
            },
            zh_tw: {
                title: '繁體中文',
                prefix: 'https://laravel.tw/docs/',
                master_version: '5.3',
                min_version: '4.2'
            },
            zh_cn: {
                title: '简体中文',
                prefix: 'https://learnku.com/docs/laravel/',
                master_version: '5.8',
                min_version: '5.1'
            }
        };

        this.lang = lang;
        this.title = this.langs[this.lang].title;
        this.prefix = this.langs[this.lang].prefix;

        // Version
        const version = this.url.match(/(master|\d+\.\d+)/);
        if (version) {
            this.version = version[0];
        }

        // Section
        const section = this.url.match(new RegExp('(?<=' + this.version + '\\\/)[A-Za-z-]+'));
        if (section) {
            this.section = section[0];
        }
    }

    LaravelLang.prototype.getLangs = function () {
        const self = this;
        let langs = [];
        for (const lang of Object.keys(this.langs)) {
            let lang_data = self.langs[lang];
            let self_lang_data = self.langs[self.lang];
            let self_version = self.version;
            let lang_version = lang_data.master_version;
            let min_version = lang_data.min_version;
            if (self_version === 'master') {
                self_version = self_lang_data.master_version;
                if (self_version === 'master') {
                    self_version = self.master_version;
                }
            }
            if (lang_version === 'master') {
                lang_version = self.master_version;
            }
            if (
                window.compareVersions(lang_version, self_version) >= 0 &&
                window.compareVersions(min_version, self_version) <= 0
            ) {
                langs.push(lang_data);
            }
        }
        return langs;
    }

    LaravelLang.prototype.parseUrl = function (lang) {
        let version = this.version;
        if (version === 'master') {
            version = lang.master_version;
        }
        return lang.prefix + version + (this.section ? '/' + this.section : '');
    }

    LaravelLang.prototype.createBs4Dropdown = function (selector) {
        const self = this;

        let switcher = d.querySelector(selector);

        let dropdown = d.createElement('div');
        dropdown.classList.add('dropdown', 'dropdown-lang');
        dropdown.style.marginLeft = '10px';
        switcher.appendChild(dropdown);

        let btn = d.createElement('button');
        let btn_caret = d.createElement('span');
        btn.id = 'dropdownMenuLang';
        btn.classList.add('btn', 'dropdown-toggle');
        btn.setAttribute('type', 'button');
        btn.dataset.toggle = 'dropdown';
        btn.setAttribute('aria-expanded', 'false');
        btn_caret.classList.add('caret');
        btn.appendChild(document.createTextNode(this.title));
        btn.appendChild(btn_caret);
        dropdown.appendChild(btn);

        let list = d.createElement('ul');
        list.classList.add('dropdown-menu');
        list.setAttribute('role', 'menu');
        list.setAttribute('aria-labelledby', 'dropdownMenuLang');
        this.getLangs().forEach(function (lang) {
            let li = d.createElement('li');
            let a = d.createElement('a');
            li.appendChild(a);
            li.setAttribute('role', 'presentation');
            a.href = self.parseUrl(lang);
            a.setAttribute('role', 'menuitem');
            a.setAttribute('tabindex', '-1');
            a.appendChild(d.createTextNode(lang.title));
            list.appendChild(li);
        });
        dropdown.appendChild(list);
    }

    LaravelLang.prototype.createLkDropdown = function (selector, isHome) {
        const self = this;

        let oldDropdown = d.querySelector(selector);
        if (!oldDropdown) return;

        let dropdown = d.createElement('div');
        if (isHome) {
            dropdown.classList.add('ui', 'dropdown', 'simple', 'green', 'basic', 'label');
        } else {
            dropdown.classList.add('ui', 'dropdown', 'simple', 'basic', 'label');
        }
        dropdown.style.marginLeft = '10px';
        oldDropdown.parentNode.appendChild(dropdown);

        let text = d.createElement('div');
        let icon = d.createElement('i');
        text.classList.add('text');
        text.appendChild(d.createTextNode(this.title));
        icon.classList.add('dropdown', 'icon');
        dropdown.appendChild(text);
        dropdown.appendChild(icon);

        let list = d.createElement('div');
        list.classList.add('menu');
        this.getLangs().forEach(function (lang) {
            let a = d.createElement('a');
            a.href = self.parseUrl(lang);
            a.classList.add('item');
            a.appendChild(d.createTextNode(lang.title));
            list.appendChild(a);
        });
        dropdown.appendChild(list);

        for (let menu of dropdown.parentNode.querySelectorAll('.menu')) {
            menu.setAttribute('style', 'width: auto !important; height: auto !important;');
        }
    }

    if (location.hostname === 'laravel.com') {
        /* English */
        const lr_en = new LaravelLang('en');
        lr_en.createBs4Dropdown('.docs nav.main .switcher');

    } else if (location.hostname === 'laravel.tw') {
        /* 繁體中文 */
        const lr_zh_tw = new LaravelLang('zh_tw');
        lr_zh_tw.createBs4Dropdown('.docs nav.main .switcher');

    } else if (location.hostname === 'learnku.com') {
        /* 简体中文 */
        const run = function () {
            if (location.href.match('https://learnku.com/docs/laravel/')) {
                const lr_zh_cn = new LaravelLang('zh_cn');
                lr_zh_cn.createLkDropdown('.book .ui.dropdown', true);
                lr_zh_cn.createLkDropdown('.book-main-column .extra-padding > h1 .ui.dropdown', false);
            }
        };

        run();
        if ($) $(document).on('pjax:end', run);
    }

})();
