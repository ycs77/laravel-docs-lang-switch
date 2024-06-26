// ==UserScript==
// @name         快速切換 Laravel 文檔語言
// @namespace    https://github.com/ycs77
// @version      3.0
// @description  安裝此外掛後，Laravel 文檔中將自動出現語言切換的按鈕，可以輕鬆切換英文和中文。
// @author       Lucas Yang
// @match        https://laravel.com/docs/*
// @match        https://laravel.tw/docs/*
// @match        https://learnku.com/*
// @icon         https://laravel.com/img/favicon/favicon.ico
// @require      https://unpkg.com/compare-versions@3.4.0/index.js
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  /**
   * @typedef Lang
   * @type {Object}
   * @property {string} title
   * @property {string} prefix
   * @property {string} master_version
   * @property {string} min_version
   */

  const d = document

  class LaravelLang {
    /**
     * @param {string} lang
     */
    constructor(lang) {
      /** @type {string} */
      this.lang = lang
      /** @type {string} */
      this.url = window.location.href
      /** @type {string} */
      this.master_version = '11.x'
      /** @type {Object.<string, Lang>} */
      this.langs = {
        en: {
          title: 'English',
          prefix: 'https://laravel.com/docs/',
          master_version: 'master',
          min_version: '4.2',
        },
        zh_tw: {
          title: '繁體中文',
          prefix: 'https://laravel.tw/docs/',
          master_version: '5.3',
          min_version: '4.2',
        },
        zh_cn: {
          title: '简体中文',
          prefix: 'https://learnku.com/docs/laravel/',
          master_version: '10.0',
          min_version: '5.1',
        }
      }

      /** @type {string} */
      this.title = this.langs[this.lang].title
      /** @type {string} */
      this.prefix = this.langs[this.lang].prefix

      // Version
      const version = this.url.match(/(master|\d+\.[\dx]+)/)
      if (version) {
        /** @type {string} */
        this.version = version[0]
      }

      // Section
      const section = this.url.match(new RegExp(`(?<=${this.version}\\\/)[A-Za-z-]+`))
      if (section) {
        /** @type {string} */
        this.section = section[0]
      }
    }

    getLangs() {
      /** @type {Lang[]} */
      const langs = []

      for (const lang of Object.keys(this.langs)) {
        const self_lang_data = this.langs[this.lang]
        let self_version = this.version

        const lang_data = this.langs[lang]
        let lang_version = lang_data.master_version
        const min_version = lang_data.min_version

        if (self_version === 'master') {
          self_version = self_lang_data.master_version
          if (self_version === 'master') {
            self_version = this.master_version
          }
        }

        if (lang_version === 'master') {
          lang_version = this.master_version
        }

        if (window.compareVersions(lang_version, self_version) >= 0 &&
          window.compareVersions(min_version, self_version) <= 0) {
          langs.push(lang_data)
        }
      }

      return langs
    }

    /**
     * @param {Lang} lang
     */
    parseUrl(lang) {
      let version = this.version
      if (version === 'master') {
        version = lang.master_version
      }
      return `${lang.prefix}${version}${this.section ? `/${this.section}` : ''}`
    }

    createLaravelSiteDropdown() {
      const actions = d.querySelector('#docsScreen > div > section > div > div')
      const firstChildInActions = actions.firstElementChild
      const originalVersionSwitcher = d.getElementById('version-switcher')

      const dropdown = d.createElement('div')
      dropdown.classList.add(...'w-full lg:w-40 lg:pl-12'.split(' '))
      firstChildInActions.after(dropdown)

      const input_group = d.createElement('div')
      dropdown.appendChild(input_group)

      const label = d.createElement('label')
      label.classList.add(...'text-gray-600 text-xs tracking-widest uppercase dark:text-gray-500'.split(' '))
      label.appendChild(d.createTextNode('Language'))
      input_group.appendChild(label)

      const custom_select = d.createElement('div')
      custom_select.classList.add(...'relative w-full bg-white transition-all duration-500 focus-within:border-gray-600 dark:bg-gray-800'.split(' '))
      input_group.appendChild(custom_select)

      const list = d.createElement('select')
      list.id = 'language-switcher'
      list.ariaLabel = 'Laravel docs language'
      list.classList.add(...originalVersionSwitcher.classList)
      this.getLangs().forEach(lang => {
        const option = d.createElement('option')
        option.value = this.parseUrl(lang)
        option.appendChild(d.createTextNode(lang.title))
        if (lang.title === this.title) {
          option.selected = true
        }
        list.appendChild(option)
      })
      list.addEventListener('change', function () {
        window.location = this.value
      })
      custom_select.appendChild(list)

      const arr_down = d.createElement('img')
      arr_down.classList.add(...originalVersionSwitcher.parentElement.children[1].classList)
      arr_down.src = '/img/icons/drop_arrow.min.svg'
      custom_select.appendChild(arr_down)

      const arr_down_dark = d.createElement('img')
      arr_down_dark.classList.add(...originalVersionSwitcher.parentElement.children[2].classList)
      arr_down_dark.src = '/img/icons/drop_arrow.dark.min.svg'
      custom_select.appendChild(arr_down_dark)

      // Add CSS
      if (!d.querySelector('#language_select_css')) {
        const language_select_css = d.createElement('style')
        language_select_css.id = 'language_select_css'
        language_select_css.textContent = `
          html #docs_search__language_arrow_dark, html.dark #docs_search__language_arrow {
            display: none
          }
        `
        d.head.appendChild(language_select_css)
      }
    }

    /**
     * @param {String} selector
     */
    createBs4Dropdown(selector) {
      const switcher = d.querySelector(selector)

      const dropdown = d.createElement('div')
      dropdown.classList.add('dropdown', 'dropdown-lang')
      dropdown.style.marginLeft = '10px'
      switcher.appendChild(dropdown)

      const btn = d.createElement('button')
      const btn_caret = d.createElement('span')
      btn.id = 'dropdownMenuLang'
      btn.classList.add('btn', 'dropdown-toggle')
      btn.setAttribute('type', 'button')
      btn.dataset.toggle = 'dropdown'
      btn.setAttribute('aria-expanded', 'false')
      btn_caret.classList.add('caret')
      btn.appendChild(document.createTextNode(this.title))
      btn.appendChild(btn_caret)
      dropdown.appendChild(btn)

      const list = d.createElement('ul')
      list.classList.add('dropdown-menu')
      list.setAttribute('role', 'menu')
      list.setAttribute('aria-labelledby', 'dropdownMenuLang')
      this.getLangs().forEach(lang => {
        const li = d.createElement('li')
        const a = d.createElement('a')
        li.appendChild(a)
        li.setAttribute('role', 'presentation')
        a.href = this.parseUrl(lang)
        a.setAttribute('role', 'menuitem')
        a.setAttribute('tabindex', '-1')
        a.appendChild(d.createTextNode(lang.title))
        list.appendChild(li)
      })
      dropdown.appendChild(list)
    }

    /**
     * @param {String} selector
     * @param {Boolean} isHome
     */
    createLkDropdown(selector, isHome) {
      const oldDropdown = d.querySelector(selector)
      if (!oldDropdown) return

      const dropdown = d.createElement('div')
      if (isHome) {
        dropdown.classList.add('ui', 'dropdown', 'simple', 'green', 'basic', 'label')
      } else {
        dropdown.classList.add('ui', 'dropdown', 'simple', 'basic', 'label')
      }
      dropdown.style.marginLeft = '10px'
      oldDropdown.parentNode.appendChild(dropdown)

      const text = d.createElement('div')
      const icon = d.createElement('i')
      text.classList.add('text')
      text.appendChild(d.createTextNode(this.title))
      icon.classList.add('dropdown', 'icon')
      dropdown.appendChild(text)
      dropdown.appendChild(icon)

      const list = d.createElement('div')
      list.classList.add('menu')
      this.getLangs().forEach(lang => {
        const a = d.createElement('a')
        a.href = this.parseUrl(lang)
        a.classList.add('item')
        a.appendChild(d.createTextNode(lang.title))
        list.appendChild(a)
      })
      dropdown.appendChild(list)

      for (const menu of dropdown.parentNode.querySelectorAll('.menu')) {
        menu.setAttribute('style', 'width: auto !important; height: auto !important;')
      }
    }
  }

  if (location.hostname === 'laravel.com') {
    /* English */
    const lr_en = new LaravelLang('en')
    lr_en.createLaravelSiteDropdown()
  }

  else if (location.hostname === 'laravel.tw') {
    /* 繁體中文 */
    const lr_zh_tw = new LaravelLang('zh_tw')
    lr_zh_tw.createBs4Dropdown('.docs nav.main .switcher')
  }

  else if (location.hostname === 'learnku.com') {
    /* 简体中文 */
    const run = () => {
      if (location.href.match('https://learnku.com/docs/laravel/')) {
        const lr_zh_cn = new LaravelLang('zh_cn')
        lr_zh_cn.createLkDropdown('.book .ui.dropdown', true)
        lr_zh_cn.createLkDropdown('.book-main-column .extra-padding > h1 .ui.dropdown', false)
      }
    }
    run()
    // eslint-disable-next-line no-undef
    if ($) $(document).on('pjax:end', run)
  }

})();
