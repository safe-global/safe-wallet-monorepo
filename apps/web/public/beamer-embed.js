var $jscomp = $jscomp || {}
$jscomp.scope = {}
$jscomp.createTemplateTagFirstArg = function (a) {
  return (a.raw = a)
}
$jscomp.createTemplateTagFirstArgWithRaw = function (a, b) {
  a.raw = b
  return a
}
$jscomp.arrayIteratorImpl = function (a) {
  var b = 0
  return function () {
    return b < a.length ? { done: !1, value: a[b++] } : { done: !0 }
  }
}
$jscomp.arrayIterator = function (a) {
  return { next: $jscomp.arrayIteratorImpl(a) }
}
$jscomp.makeIterator = function (a) {
  var b = 'undefined' != typeof Symbol && Symbol.iterator && a[Symbol.iterator]
  return b ? b.call(a) : $jscomp.arrayIterator(a)
}
'undefined' === typeof window.Beamer && (window.Beamer = {})
var _BEAMER_DATE = '_BEAMER_DATE',
  _BEAMER_BOOSTED_ANNOUNCEMENT_DATE = '_BEAMER_BOOSTED_ANNOUNCEMENT_DATE',
  _BEAMER_FIRST_VISIT = '_BEAMER_FIRST_VISIT',
  _BEAMER_USER_ID = '_BEAMER_USER_ID',
  _BEAMER_SELECTOR_COLOR = '_BEAMER_SELECTOR_COLOR',
  _BEAMER_HEADER_COLOR = '_BEAMER_HEADER_COLOR',
  _BEAMER_TEST = '_BEAMER_TEST',
  _BEAMER_LAST_UPDATE = '_BEAMER_LAST_UPDATE',
  _BEAMER_SOUND_PLAYED = '_BEAMER_SOUND_PLAYED',
  _BEAMER_LAST_POST_SHOWN = '_BEAMER_LAST_POST_SHOWN',
  _BEAMER_LAST_PUSH_PROMPT_INTERACTION = '_BEAMER_LAST_PUSH_PROMPT_INTERACTION',
  _BEAMER_FILTER_BY_URL = '_BEAMER_FILTER_BY_URL',
  _BEAMER_URL = 'https://app.getbeamer.com/',
  _BEAMER_URL_BACK = 'https://backend.getbeamer.com/',
  _BEAMER_PUSH_URL = 'https://push.getbeamer.com/',
  _BEAMER_STATIC_URL = 'https://static.getbeamer.com/',
  _BEAMER_MASSIVE = !1,
  _BEAMER_IS_OPEN = !1,
  _BEAMER_PUSH_PROMPT_TYPE,
  _BEAMER_PUSH_PROMPT_LABEL,
  _BEAMER_PUSH_PROMPT_ACCEPT,
  _BEAMER_PUSH_PROMPT_REFUSE,
  _BEAMER_LOGO_URL,
  _BEAMER_SHOW_PUSH_PROMPT = !1,
  _BEAMER_CSS_LOADED = !1
Beamer.enabled = !0
Beamer.initialized = !1
Beamer.started = !1
Beamer.observing = !1
Beamer.observingUrl = !1
Beamer.elements = []
Beamer.notificationActive = !1
Beamer.notificationNumber = 0
Beamer.notificationColor
Beamer.removeOnHide = !1
Beamer.enableSoundNotification = !1
Beamer.enableFaviconNotification = !1
Beamer.isHashOpen = !1
Beamer.popperElements = []
Beamer.mouseInIframe = !1
Beamer.scrollX = 0
Beamer.scrollY = 0
Beamer.pushEnabled = !1
Beamer.pushRefused = !1
Beamer.reservedParameters =
  'alert auto_refresh bottom bounce button button_position callback counter delay display display_position embed filter filter_by_url force_button icon ignore_auto_open ignore_auto_open_mobile import_font language lazy left mobile multi_user notification_prompt notification_prompt_delay onclick onclose onopen onerror onClick onClose onOpen onError onNpsShow onNpsHide onNpsScore onNpsFeedback onInputFocus onInputBlur post_request product product_id right role selector show source standalone theme top user_email user_firstname user_id user_lastname nps_delay header_color standalone_logo first_visit_unread force_filter user_created_at v ignore_boosted_announcements hide_feedback logs user_token feedback_button feedback_button_position ideas_selector ideas_form_selector roadmap_selector'.split(
    ' ',
  )
Beamer.updatesMaxDelay = 12e4
Beamer.hasGoogleTrackingId = !1
Beamer.hasGA4TrackingId = !1
Beamer.visibilityObserverInitialized = !1
Beamer.windowVisible = !0
Beamer.windowVisibleBinds = []
Beamer.eventListeners = []
Beamer.enableHiddenTooltipObserver = !1
Beamer.enableTooltipAutoFlipControl = !1
Beamer.build = function () {
  if ('undefined' === typeof Beamer.built || !Beamer.built) {
    Beamer.built = !0
    var a = function (b) {
      if (10 < b)
        try {
          console.error('Failed to initialize Beamer: beamer_config is not defined')
        } catch (c) {}
      else if (
        (window.beamer_config &&
          'undefined' !== typeof beamer_config.product_id &&
          '' !== beamer_config.product_id.trim()) ||
        (window.beamer_config && 'undefined' !== typeof beamer_config.lazy && beamer_config.lazy)
      ) {
        if ('undefined' == typeof beamer_config.lazy || !beamer_config.lazy)
          if (void 0 != beamer_config.mobile && !beamer_config.mobile && Beamer.isMobile())
            try {
              console.log('Mobile version is disabled by configuration. (mobile:false).')
            } catch (c) {}
          else
            'number' == typeof beamer_config.delay && 0 < beamer_config.delay
              ? setTimeout(Beamer.init, beamer_config.delay)
              : Beamer.init()
      } else
        setTimeout(function () {
          a(++b)
        }, 1e3)
    }
    window.beamer_config && Beamer.isEmbedMode()
      ? a(0)
      : setTimeout(function () {
          a(0)
        }, 500)
  }
}
Beamer.init = function () {
  if (!Beamer.started) {
    Beamer.started = !0
    var a = function () {
        try {
          console.warn(
            "Seems your Beamer feed can't be accessed! Please contact our Support chat on https://getbeamer.com/",
          )
        } catch (g) {}
        var e = 'undefined' !== typeof beamer_config.onerror ? beamer_config.onerror : beamer_config.onError
        e && Beamer.isFunction(e) && e()
      },
      b = function (e, g) {
        Beamer.config = e
        Beamer.setParameters(e)
        'undefined' !== e.clearAllCookies && e.clearAllCookies && Beamer.clearAllCookies()
        'undefined' !== typeof e.topDomain && (Beamer.topDomain = e.topDomain)
        if (('undefined' !== typeof e.enabled && !e.enabled) || ('undefined' !== typeof e.limited && typeof e.limited))
          'undefined' !== typeof e.limited && typeof e.limited ? a() : (Beamer.enabled = !1)
        else {
          if ('undefined' !== typeof e.blocked && typeof e.blocked) return a()
          'undefined' !== typeof e.massive && !0 === e.massive && (_BEAMER_MASSIVE = !0)
          ;('undefined' !== typeof Beamer.binded && Beamer.binded) ||
            (Beamer.bindWindowEvents(), Beamer.bindEscape(), (Beamer.binded = !0))
          if (!beamer_config.selector || 0 > beamer_config.selector.indexOf('.beamerTrigger'))
            beamer_config.selector &&
            '' !== beamer_config.selector.trim() &&
            'element-id' !== beamer_config.selector.trim()
              ? (beamer_config.selector += ',.beamerTrigger')
              : ((beamer_config.selector = '.beamerTrigger'), (Beamer.noSelector = !0))
          if (!beamer_config.selector || 0 > beamer_config.selector.indexOf('a[href="#beamerTrigger"]'))
            beamer_config.selector &&
            '' !== beamer_config.selector.trim() &&
            'element-id' !== beamer_config.selector.trim()
              ? (beamer_config.selector += ',a[href="#beamerTrigger"]')
              : ((beamer_config.selector = 'a[href="#beamerTrigger"]'), (Beamer.noSelector = !0))
          Beamer.appendStyles()
          Beamer.appendAlert()
          Beamer.appendFeedbackButtons()
          Beamer.isInApp() && Beamer.appendPopperScript()
          try {
            var f = Beamer.getCookie(_BEAMER_FIRST_VISIT + '_' + beamer_config.product_id)
            if ('undefined' === typeof f || null === f || '' === f) f = new Date().toISOString()
            Beamer.setCookie(_BEAMER_FIRST_VISIT + '_' + beamer_config.product_id, f, 300)
          } catch (h) {}
        }
        if ('undefined' !== typeof e.enableNPS && e.enableNPS) {
          g = Beamer.getCookie(_BEAMER_USER_ID + '_' + beamer_config.product_id)
          if (null === g || '' === g) g = Beamer.uuidv4()
          Beamer.setCookie(_BEAMER_USER_ID + '_' + beamer_config.product_id, g, 300)
          'undefined' !== typeof e.showNPSDelay && (beamer_config.nps_delay = e.showNPSDelay)
          Beamer.shouldShowNPS(e.npsShowForUrls, e.npsHideForUrls) && Beamer.appendNPSScript()
        }
        'undefined' !== typeof e.enableHiddenTooltipObserver &&
          !0 === e.enableHiddenTooltipObserver &&
          (Beamer.enableHiddenTooltipObserver = !0)
        'undefined' !== typeof e.enableTooltipAutoFlipControl &&
          !0 === e.enableTooltipAutoFlipControl &&
          (Beamer.enableTooltipAutoFlipControl = !0)
      },
      c = encodeURIComponent(window.location.host)
    c = _BEAMER_URL_BACK + 'initialize?product=' + beamer_config.product_id + '&domain=' + c
    if (beamer_config.language) c += '&language=' + encodeURIComponent(beamer_config.language)
    else {
      var d = window.navigator.userLanguage || window.navigator.language
      d && 1 < d.length && ((d = d.substring(0, 2).toUpperCase()), (c += '&language=' + encodeURIComponent(d)))
    }
    if (
      ('undefined' !== typeof beamer_config.user_id && '' !== beamer_config.user_id) ||
      ('undefined' !== typeof beamer_config.user_email && '' !== beamer_config.user_email)
    )
      c += '&uid=true'
    Beamer.ajax(
      c,
      function (e) {
        try {
          e = JSON.parse(e)
          'undefined' !== typeof e.logs && (beamer_config.logs = e.logs)
          if ('undefined' === typeof beamer_config.logs || beamer_config.logs)
            if ('undefined' === typeof Beamer.initializationLogged || !Beamer.initializationLogged) {
              try {
                console.log('Initializing Beamer. [Update and engage users effortlessly - https://getbeamer.com]')
              } catch (g) {}
              Beamer.initializationLogged = !0
            }
          'undefined' !== typeof e.blockedUrls || 'undefined' !== typeof e.allowedUrls
            ? (('undefined' !== typeof Beamer.config && Beamer.config) || (Beamer.config = {}),
              'undefined' !== typeof e.blockedUrls && (Beamer.config.blockedUrls = e.blockedUrls),
              'undefined' !== typeof e.allowedUrls && (Beamer.config.allowedUrls = e.allowedUrls),
              Beamer.checkUrlAllowed(e)
                .then(
                  function () {
                    Beamer.enabled = !0
                    b(e)
                  },
                  function () {
                    Beamer.enabled = !1
                    'undefined' !== typeof e.listenUrlChanges && e.listenUrlChanges && (Beamer.started = !1)
                  },
                )
                .catch(function (g) {
                  Beamer.enabled = !1
                  'undefined' !== typeof e.listenUrlChanges && e.listenUrlChanges && (Beamer.started = !1)
                  Beamer.logError(g)
                }))
            : ((Beamer.enabled = !0), b(e))
          'undefined' !== typeof e.listenUrlChanges && e.listenUrlChanges && Beamer.initUrlObserver()
        } catch (g) {
          Beamer.logError(g)
        }
      },
      a,
    )
  }
}
Beamer.update = function (a) {
  if ('undefined' !== typeof a) {
    var b = !1
    'undefined' !== typeof a.onopen &&
      Beamer.isFunction(a.onopen) &&
      beamer_config.onopen !== a.onopen &&
      ((beamer_config.onopen = a.onopen), (b = !0))
    'undefined' !== typeof a.onclose &&
      Beamer.isFunction(a.onclose) &&
      beamer_config.onclose !== a.onclose &&
      ((beamer_config.onclose = a.onclose), (b = !0))
    'undefined' !== typeof a.onclick &&
      Beamer.isFunction(a.onclick) &&
      beamer_config.onclick !== a.onclick &&
      ((beamer_config.onclick = a.onclick), (b = !0))
    'undefined' !== typeof a.onerror &&
      Beamer.isFunction(a.onerror) &&
      beamer_config.onerror !== a.onerror &&
      ((beamer_config.onerror = a.onerror), (b = !0))
    'undefined' !== typeof a.onOpen &&
      Beamer.isFunction(a.onOpen) &&
      beamer_config.onOpen !== a.onOpen &&
      ((beamer_config.onOpen = a.onOpen), (b = !0))
    'undefined' !== typeof a.onClose &&
      Beamer.isFunction(a.onClose) &&
      beamer_config.onClose !== a.onClose &&
      ((beamer_config.onClose = a.onClose), (b = !0))
    'undefined' !== typeof a.onClick &&
      Beamer.isFunction(a.onClick) &&
      beamer_config.onClick !== a.onClick &&
      ((beamer_config.onClick = a.onClick), (b = !0))
    'undefined' !== typeof a.onError &&
      Beamer.isFunction(a.onError) &&
      beamer_config.onError !== a.onError &&
      ((beamer_config.onError = a.onError), (b = !0))
    'undefined' !== typeof a.onNpsShow &&
      Beamer.isFunction(a.onNpsShow) &&
      beamer_config.onNpsShow !== a.onNpsShow &&
      ((beamer_config.onNpsShow = a.onNpsShow), (b = !0))
    'undefined' !== typeof a.onNpsHide &&
      Beamer.isFunction(a.onNpsHide) &&
      beamer_config.onNpsHide !== a.onNpsHide &&
      ((beamer_config.onNpsHide = a.onNpsHide), (b = !0))
    'undefined' !== typeof a.onNpsScore &&
      Beamer.isFunction(a.onNpsScore) &&
      beamer_config.onNpsScore !== a.onNpsScore &&
      ((beamer_config.onNpsScore = a.onNpsScore), (b = !0))
    'undefined' !== typeof a.onNpsFeedback &&
      Beamer.isFunction(a.onNpsFeedback) &&
      beamer_config.onNpsFeedback !== a.onNpsFeedback &&
      ((beamer_config.onNpsFeedback = a.onNpsFeedback), (b = !0))
    'undefined' !== typeof a.onInputFocus &&
      Beamer.isFunction(a.onInputFocus) &&
      beamer_config.onInputFocus !== a.onInputFocus &&
      ((beamer_config.onInputFocus = a.onInputFocus), (b = !0))
    'undefined' !== typeof a.onInputBlur &&
      Beamer.isFunction(a.onInputBlur) &&
      beamer_config.onInputBlur !== a.onInputBlur &&
      ((beamer_config.onInputBlur = a.onInputBlur), (b = !0))
    'undefined' !== typeof a.filter_by_url &&
      beamer_config.filter_by_url !== a.filter_by_url &&
      ((beamer_config.filter_by_url = a.filter_by_url), (b = !0))
    'undefined' !== typeof a.filter &&
      beamer_config.filter !== a.filter &&
      ((beamer_config.filter = a.filter), (b = !0))
    'undefined' !== typeof a.force_filter &&
      beamer_config.force_filter !== a.force_filter &&
      ((beamer_config.force_filter = a.force_filter), (b = !0))
    'undefined' !== typeof a.language &&
      beamer_config.language !== a.language &&
      ((beamer_config.language = a.language), (b = !0))
    'undefined' !== typeof a.user_id &&
      beamer_config.user_id !== a.user_id &&
      ((beamer_config.user_id = a.user_id), (b = !0))
    'undefined' !== typeof a.user_token &&
      beamer_config.user_token !== a.user_token &&
      ((beamer_config.user_token = a.user_token), (b = !0))
    'undefined' !== typeof a.user_lastname &&
      beamer_config.user_lastname !== a.user_lastname &&
      ((beamer_config.user_lastname = a.user_lastname), (b = !0))
    'undefined' !== typeof a.user_firstname &&
      beamer_config.user_firstname !== a.user_firstname &&
      ((beamer_config.user_firstname = a.user_firstname), (b = !0))
    'undefined' !== typeof a.user_email &&
      beamer_config.user_email !== a.user_email &&
      ((beamer_config.user_email = a.user_email), (b = !0))
    'undefined' !== typeof a.alert && beamer_config.alert !== a.alert && ((beamer_config.alert = a.alert), (b = !0))
    'undefined' !== typeof a.counter &&
      beamer_config.counter !== a.counter &&
      ((beamer_config.counter = a.counter), (b = !0))
    'undefined' !== typeof a.standalone &&
      beamer_config.standalone !== a.standalone &&
      ((beamer_config.standalone = a.standalone), (b = !0))
    'undefined' !== typeof a.multi_user &&
      beamer_config.multi_user !== a.multi_user &&
      ((beamer_config.multi_user = a.multi_user), (b = !0))
    'undefined' !== typeof a.first_visit_unread &&
      beamer_config.first_visit_unread !== a.first_visit_unread &&
      ((beamer_config.first_visit_unread = a.first_visit_unread), (b = !0))
    'undefined' !== typeof a.force_button &&
      beamer_config.force_button !== a.force_button &&
      ((beamer_config.force_button = a.force_button), (b = !0))
    'undefined' !== typeof a.post_request &&
      beamer_config.post_request !== a.post_request &&
      ((beamer_config.post_request = a.post_request), (b = !0))
    'undefined' !== typeof a.callback &&
      Beamer.isFunction(a.callback) &&
      beamer_config.callback !== a.callback &&
      ((beamer_config.callback = a.callback), (b = !0))
    'undefined' !== typeof a.ignore_auto_open &&
      beamer_config.ignore_auto_open !== a.ignore_auto_open &&
      ((beamer_config.ignore_auto_open = a.ignore_auto_open), (b = !0))
    'undefined' !== typeof a.ignore_auto_open_mobile &&
      beamer_config.ignore_auto_open_mobile !== a.ignore_auto_open_mobile &&
      ((beamer_config.ignore_auto_open_mobile = a.ignore_auto_open_mobile), (b = !0))
    'undefined' !== typeof a.ignore_boosted_announcements &&
      beamer_config.ignore_boosted_announcements !== a.ignore_boosted_announcements &&
      ((beamer_config.ignore_boosted_announcements = a.ignore_boosted_announcements), (b = !0))
    'undefined' !== typeof a.hide_feedback &&
      beamer_config.hide_feedback !== a.hide_feedback &&
      ((beamer_config.hide_feedback = a.hide_feedback), (b = !0))
    'undefined' !== typeof a.bounce &&
      beamer_config.bounce !== a.bounce &&
      ((beamer_config.bounce = a.bounce), (b = !0))
    'undefined' !== typeof a.right && beamer_config.right !== a.right && ((beamer_config.right = a.right), (b = !0))
    'undefined' !== typeof a.top && beamer_config.top !== a.top && ((beamer_config.top = a.top), (b = !0))
    'undefined' !== typeof a.bottom &&
      beamer_config.bottom !== a.bottom &&
      ((beamer_config.bottom = a.bottom), (b = !0))
    'undefined' !== typeof a.left && beamer_config.left !== a.left && ((beamer_config.left = a.left), (b = !0))
    'undefined' !== typeof a.header_color &&
      beamer_config.header_color !== a.header_color &&
      ((beamer_config.header_color = a.header_color), (b = !0))
    'undefined' !== typeof a.standalone_logo &&
      beamer_config.standalone_logo !== a.standalone_logo &&
      ((beamer_config.standalone_logo = a.standalone_logo), (b = !0))
    'undefined' !== typeof a.theme && beamer_config.theme !== a.theme && ((beamer_config.theme = a.theme), (b = !0))
    for (var c in a)
      if (a.hasOwnProperty(c) && !(-1 < Beamer.reservedParameters.indexOf(c))) {
        var d = a[c]
        'undefined' === typeof d ||
          'object' === typeof d ||
          Beamer.isFunction(d) ||
          beamer_config[c] === d ||
          ((beamer_config[c] = d), (b = !0))
      }
    b && (Beamer.started ? Beamer.appendAlert(!0, !0) : Beamer.init())
  }
}
Beamer.updateUrl = function () {
  var a = function () {
    'undefined' !== typeof beamer_config.filter_by_url &&
      beamer_config.filter_by_url &&
      'undefined' !== typeof Beamer.fullUrl &&
      Beamer.appendAlert(!0, !0)
    'undefined' !== typeof Beamer.config &&
      'undefined' !== typeof Beamer.config.enableNPS &&
      Beamer.config.enableNPS &&
      Beamer.shouldShowNPS(Beamer.config.npsShowForUrls, Beamer.config.npsHideForUrls) &&
      Beamer.appendNPSScript()
  }
  encodeURIComponent(window.location.href) !== Beamer.fullUrl &&
    ('undefined' === typeof Beamer.config ||
    ('undefined' === typeof Beamer.config.blockedUrls && 'undefined' === typeof Beamer.config.allowedUrls)
      ? a()
      : Beamer.checkUrlAllowed(Beamer.config)
          .then(
            function () {
              Beamer.enabled ? a() : Beamer.init()
            },
            function () {
              Beamer.started && Beamer.destroy()
              Beamer.enabled = !1
            },
          )
          .catch(function (b) {
            Beamer.logError(b)
          }))
}
Beamer.destroy = function (a) {
  Beamer.remove(a)
}
Beamer.remove = function (a) {
  Beamer.hide()
  Beamer.hideNotificationPrompt()
  Beamer.closeLastPostTitle()
  Beamer.stopUpdatesListener()
  'undefined' !== typeof Beamer.closeAnnouncement && Beamer.closeAnnouncement()
  'undefined' !== typeof Beamer.hideNPS && Beamer.hideNPS()
  'undefined' !== typeof Beamer.notificationScriptTimeout &&
    (clearTimeout(Beamer.notificationScriptTimeout), delete Beamer.notificationScriptTimeout)
  'undefined' !== typeof Beamer.autoTimeout && (clearTimeout(Beamer.autoTimeout), delete Beamer.autoTimeout)
  setTimeout(function () {
    Beamer.removeIframe()
    Beamer.forEachElement('.beamer_icon, #beamerSelector', function (b) {
      b.parentNode.removeChild(b)
    })
    Beamer.removeFeedbackButtons()
    Beamer.removeAllEventListeners()
    Beamer.removeClass(beamer_config.selector, 'beamer_beamerSelector')
    Beamer.stopDomObserver()
    Beamer.started = !1
    Beamer.initialized = !1
    Beamer.elements = []
    Beamer.notificationActive = !1
    Beamer.notificationNumber = 0
    Beamer.notificationColor
    Beamer.removeOnHide = !1
    Beamer.enableSoundNotification = !1
    Beamer.enableFaviconNotification = !1
    Beamer.isHashOpen = !1
    Beamer.popperElements = []
    Beamer.mouseInIframe = !1
    Beamer.scrollX = 0
    Beamer.scrollY = 0
    Beamer.binded = !1
    delete Beamer.fullUrl
    'undefined' !== typeof a && a && (Beamer.clearProductStorage(), (window.beamer_config = {}))
  }, 50)
}
Beamer.hideLoader = function () {
  Beamer.addClass('beamerLoader', 'beamer_hideLoader')
  Beamer.forEachElement('beamerLoader', function (a) {
    setTimeout(function () {
      a && (a.style.display = 'none')
    }, 200)
  })
}
Beamer.show = function (a) {
  'undefined' === typeof Beamer.config.changelogEnabled || Beamer.config.changelogEnabled
    ? Beamer.showFeed(a, 'news')
    : 'undefined' !== typeof Beamer.config.ideasEnabled && Beamer.config.ideasEnabled
      ? Beamer.showFeed(a, 'ideas')
      : 'undefined' !== typeof Beamer.config.roadmapEnabled && Beamer.config.roadmapEnabled
        ? Beamer.showFeed(a, 'roadmap')
        : console.warn('No features enabled to show.')
}
Beamer.showChangelog = function (a) {
  Beamer.enabled && ((window._BEAMER_CHANGELOG_POST_ID = a), Beamer.show())
}
Beamer.showIdeas = function (a, b) {
  var c = 'ideas'
  'undefined' !== typeof a && a && (c += '?focus=true')
  Beamer.showFeed(b, c)
}
Beamer.showRoadmap = function (a, b) {
  var c = 'roadmap'
  'undefined' !== typeof a && a && (c += '?focus=true')
  Beamer.showFeed(b, c)
}
Beamer.showFeed = function (a, b) {
  if (Beamer.enabled) {
    Beamer.lastToggle = new Date().getTime()
    Beamer.closeLastPostTitle()
    Beamer.setCookie(_BEAMER_LAST_POST_SHOWN + '_' + beamer_config.product_id, null)
    var c = 'undefined' !== typeof beamer_config.onopen ? beamer_config.onopen : beamer_config.onOpen
    if (c && Beamer.isFunction(c)) {
      if (!1 === c()) return
    } else Beamer.defaultOnOpen()
    if ('undefined' !== typeof beamer_config.standalone && beamer_config.standalone)
      (window.open(Beamer.buildStandaloneUrl(), '_blank'),
        Beamer.setDateCookie(new Date().toISOString(), 300),
        Beamer.clearAlert())
    else {
      _BEAMER_IS_OPEN = !0
      var d = ''
      if ('undefined' != typeof beamer_config.display && 'popup' == beamer_config.display) {
        c = 'beamer_top'
        var e = 'beamer_right'
        if (a) {
          var g = a.clientY,
            f = 'innerHeight' in window ? window.innerHeight : document.documentElement.offsetHeight
          a.clientX <= ('innerWidth' in window ? window.innerWidth : document.documentElement.offsetWidth) / 2 &&
            (e = 'beamer_left')
          g > f / 2 && (c = 'beamer_bottom')
        }
        d = c + ' ' + e
      }
      var h = Beamer.isInApp() ? 'beamerNews' : 'beamerOverlay'
      if (null != document.getElementById(h)) {
        if (
          ('undefined' !== typeof Beamer.displayedFeedType && Beamer.displayedFeedType !== b) ||
          (window._BEAMER_CHANGELOG_POST_ID && 'news' === b)
        )
          ((Beamer.displayedFeedType = b), (document.getElementById('beamerNews').src = Beamer.buildFeedUrl(b)))
        if (Beamer.isInApp())
          if ('undefined' !== typeof a && a.target && Beamer.isElementVisible(a.target)) {
            var k = null
            Beamer.forEachElement(beamer_config.selector, function (l) {
              l.contains(a.target) && (k = l)
            })
            null !== k &&
              Beamer.forEachElement('beamerNews, beamerLoader', function (l) {
                Beamer.setPopperPosition(l, k)
                Beamer.updatePopper(k)
              })
          } else Beamer.updatePopper()
        Beamer.showElement(h)
        Beamer.removeClass(h, 'beamer_hide')
        Beamer.removeClass(h, 'beamer_hideable')
        setTimeout(function () {
          Beamer.addClass(h, d)
          Beamer.addClass(h, 'beamer_show')
        }, 50)
        setTimeout(function () {
          Beamer.addClass(h, 'beamer_hideable')
        }, 300)
        setTimeout(function () {
          Beamer.sendMessageToIframe('showPanel')
          Beamer.sendMessageToIframe('setRefUrl:' + JSON.stringify({ url: window.location.href }))
        }, 100)
      } else
        ((function (l) {
          if (!Beamer.initialized) {
            Beamer.displayedFeedType = b
            var n = Beamer.buildFeedUrl(b),
              u
            'undefined' == typeof beamer_config.display ||
            ('left' !== beamer_config.display && 'right' !== beamer_config.display && 'popup' !== beamer_config.display)
              ? Beamer.isInApp() && (u = 'popup inapp')
              : (u = beamer_config.display)
            u || (u = 'right')
            var t = "<div class='beamer_mock_header'",
              w =
                'undefined' !== typeof beamer_config.header_color
                  ? beamer_config.header_color
                  : Beamer.getFromStorage(_BEAMER_HEADER_COLOR)
            w && (t += ' style="background-color: ' + w + ';"')
            t += '></div>'
            'undefined' !== typeof Beamer.escapeHtml && (n = Beamer.escapeHtml(n))
            var v =
              "<div id='beamerLoader' class='beamer_beamer " + u + "'>" + t + '</div>' + Beamer.buildFeedIframe(n, u)
            Beamer.isInApp() ||
              (v =
                "<div id='beamerOverlay'><div class='iframeCointaner'><div id='beamerLoader' class='beamer_beamer " +
                u +
                "'>" +
                t +
                '</div>' +
                Beamer.buildFeedIframe(n, u) +
                '</div></div>')
            Beamer.isEmbedMode()
              ? Beamer.forEachElement(beamer_config.selector, function (m) {
                  Beamer.appendHtml(m, v)
                })
              : Beamer.appendHtml(document.body, v)
            Beamer.addClick('beamerOverlay', Beamer.hide)
          }
          _BEAMER_SHOW_PUSH_PROMPT &&
            'undefined' === typeof Beamer.pushDomain &&
            Beamer.forEachElement('beamerNews', function (m) {
              m.onload = Beamer.showNotificationPrompt(2e3)
            })
          Beamer.isInApp() &&
            !Beamer.isEmbedMode() &&
            Beamer.forEachElement('beamerNews, beamerLoader', function (m) {
              Beamer.forEachElement(beamer_config.selector, function (r) {
                Beamer.isElementVisible(r) && (Beamer.setPopperPosition(m, r), Beamer.initPopper(m, r))
              })
              if ('undefined' !== typeof l && l.target && Beamer.isElementVisible(l.target)) {
                var q = null
                Beamer.forEachElement(beamer_config.selector, function (r) {
                  r.contains(l.target) && (q = r)
                })
                null !== q && (Beamer.setPopperPosition(m, q), Beamer.updatePopper(q))
              }
              Beamer.removeEventListener(m, 'mouseenter', Beamer.mouseEnterHandler)
              Beamer.addEventListener(m, 'mouseenter', Beamer.mouseEnterHandler)
              Beamer.removeEventListener(m, 'mouseleave', Beamer.mouseLeaveHandler)
              Beamer.addEventListener(m, 'mouseleave', Beamer.mouseLeaveHandler)
            })
        })(a),
          Beamer.showElement(h),
          Beamer.removeClass(h, 'beamer_hide'),
          Beamer.removeClass(h, 'beamer_hideable'),
          (c = Beamer.isInApp() ? 250 : 50),
          setTimeout(function () {
            Beamer.addClass(h, d)
            Beamer.addClass(h, 'beamer_show')
          }, c),
          setTimeout(function () {
            Beamer.addClass(h, 'beamer_hideable')
          }, c + 250),
          Beamer.setDateCookie(new Date().toISOString(), 300),
          Beamer.clearAlert())
      Beamer.isEmbedMode() ||
        (Beamer.isInApp()
          ? (Beamer.isMobile() && Beamer.addClassBody('beamer_noscroll'),
            setTimeout(function () {
              Beamer.addEventListener(document, 'click', Beamer.hideOnDocumentClick)
              Beamer.addEventListener(document, 'scroll', Beamer.scrollHandler)
            }, 50))
          : Beamer.addClassBody('beamer_noscroll'),
        Beamer.isMobile() &&
          (Beamer.addClassBody('beamer_mobile'), Beamer.isAndroid() && Beamer.addClassBody('android')))
      Beamer.isFirefox() && Beamer.addClassBody('moz')
      Beamer.isWindows() && Beamer.addClassBody('win')
    }
    Beamer.enableSoundNotification && Beamer.setCookie(_BEAMER_SOUND_PLAYED + '_' + beamer_config.product_id, !1, 7)
  }
}
Beamer.hide = function () {
  window._BEAMER_CHANGELOG_POST_ID && Beamer.clearLoadedFeatures()
  Beamer.lastToggle = new Date().getTime()
  Beamer.sendMessageToIframe('hidePanel')
  Beamer.removeEventListener(document, 'click', Beamer.hideOnDocumentClick)
  Beamer.removeEventListener(document, 'scroll', Beamer.scrollHandler)
  setTimeout(function () {
    var a = 'undefined' !== typeof beamer_config.onclose ? beamer_config.onclose : beamer_config.onClose
    if (a && Beamer.isFunction(a)) {
      if (!1 === a()) return
    } else Beamer.defaultOnClose()
    _BEAMER_IS_OPEN = !1
    Beamer.isHashOpen = !1
    var b = Beamer.isInApp() ? 'beamerNews' : 'beamerOverlay'
    Beamer.removeClass(b, 'beamer_show')
    Beamer.removeClass(b, 'beamer_hideable')
    Beamer.removeClassBody('beamer_noscroll')
    Beamer.removeClassBody('beamer_mobile')
    Beamer.removeClassBody('android')
    Beamer.addClass(b, 'beamer_hide')
    Beamer.addClass(b, 'beamer_hideable')
    setTimeout(function () {
      Beamer.hideElement(b)
    }, 200)
    Beamer.removeOnHide &&
      setTimeout(function () {
        Beamer.removeIframe()
        Beamer.removeOnHide = !1
      }, 250)
  }, 10)
}
Beamer.clearLoadedFeatures = function () {
  window._BEAMER_CHANGELOG_POST_ID = null
  Beamer.removeIframe()
}
Beamer.buildFeedIframe = function (a, b) {
  return (
    '<iframe allowfullscreen src="' +
    a +
    "\" id='beamerNews' class='beamer_beamer " +
    b +
    "' data-powered-by='Newsfeed and changelog powered by Beamer. https://www.getbeamer.com' title='Beamer' aria-label='Beamer widget'></iframe>"
  )
}
Beamer.switchIframe = function (a) {
  if (
    !(
      'undefined' === typeof a ||
      '' === a.trim() ||
      0 !== a.toLowerCase().indexOf(_BEAMER_URL) ||
      -1 < a.toLowerCase().indexOf('javascript:')
    )
  ) {
    Beamer.sendMessageToIframe('switchingIframe')
    var b = Beamer.findElements('beamerNews')
    if (0 !== b.length) {
      b = b[0]
      var c = b.cloneNode()
      c.src = a
      c.className += ' beamer_cloned'
      var d = !1,
        e = function () {
          d ||
            ((d = !0),
            Beamer.addClass('.beamer_beamer', 'beamer_switching'),
            (b.style.opacity = '0 !important'),
            setTimeout(function () {
              b.parentNode.removeChild(b)
              Beamer.removeClass('.beamer_beamer', 'beamer_cloned')
              Beamer.removeClass('.beamer_beamer', 'beamer_switching')
            }, 100),
            Beamer.unbindWindowEvent('loaded', e))
        }
      c.onload = e
      Beamer.bindWindowEvent('loaded', e)
      b.className += ' beamer_original'
      b.parentNode.insertBefore(c, b.nextSibling)
      Beamer.isInApp() &&
        !Beamer.isEmbedMode() &&
        Beamer.forEachElement(beamer_config.selector, function (g) {
          Beamer.isElementVisible(g) && (Beamer.setPopperPosition(c, g), Beamer.initPopper(c, g))
        })
    }
  }
}
Beamer.toggle = function (a) {
  if (Beamer.isEmbedMode()) Beamer.show(a)
  else {
    var b = new Date().getTime()
    if ('undefined' === typeof Beamer.lastToggle || 200 < b - Beamer.lastToggle)
      _BEAMER_IS_OPEN ? Beamer.hide() : Beamer.show(a)
  }
}
Beamer.hideOnDocumentClick = function (a) {
  var b = !1
  Beamer.forEachElement('beamerNews, beamerPicture', function (c) {
    Beamer.forEachElement(beamer_config.selector, function (d) {
      if (c.contains(a.target) || d.contains(a.target)) b = !0
    })
  })
  b || Beamer.hide()
}
Beamer.addClass = function (a, b) {
  try {
    'string' === typeof a
      ? Beamer.forEachElement(a, function (c) {
          0 > c.className.indexOf(b) && (c.className += ' ' + b)
        })
      : 0 > a.className.indexOf(b) && (a.className += ' ' + b)
  } catch (c) {
    try {
      console.log('Element not found: ' + c.message)
    } catch (d) {}
  }
}
Beamer.addClick = function (a, b) {
  var c = function (e) {
      Beamer.removeEventListener(e, 'click', b)
      Beamer.addEventListener(e, 'click', b)
      var g = e.getAttribute('data-beamer-keypress')
      ;('undefined' !== typeof g && g) ||
        (Beamer.addEventListener(e, 'keypress', function (n) {
          n = 'which' in n ? n.which : n.keyCode
          ;(13 != n && 32 != n) || e.click()
        }),
        Beamer.addAttribute(e, 'data-beamer-keypress', 'true'))
      if ((g = e.querySelectorAll('a')) && 0 < g.length)
        for (var f = 0; f < g.length; f++) {
          var h = g[f]
          'undefined' === typeof h.hasAttribute || h.hasAttribute('data-wpel-link') || (h.href = d)
          var k = !1,
            l = function (n) {
              k = !0
              b(n)
              n.preventDefault && n.preventDefault()
              n.stopPropagation && n.stopPropagation()
              return !1
            }
          Beamer.removeEventListener(h, 'click', l)
          Beamer.addEventListener(h, 'click', l)
          try {
            'ontouchstart' in window &&
              ((l = function () {
                setTimeout(function () {
                  k || b()
                }, 200)
              }),
              Beamer.removeEventListener(h, 'ontouchstart', l),
              Beamer.addEventListener(h, 'ontouchstart', l))
          } catch (n) {}
        }
    },
    d = Beamer.buildStandaloneUrl()
  'string' == typeof a ? Beamer.forEachElement(a, c) : c(a)
}
Beamer.addEventListener = function (a, b, c) {
  a.addEventListener ? a.addEventListener(b, c, !1) : a.attachEvent ? a.attachEvent('on' + b, c) : (a['on' + b] = c)
  Beamer.eventListeners.push({ element: a, type: b, handler: c })
}
Beamer.removeEventListener = function (a, b, c) {
  try {
    for (var d = -1, e = 0; e < Beamer.eventListeners.length; e++) {
      var g = Beamer.eventListeners[e]
      if (g.element === a && g.type === b && g.handler === c) {
        d = e
        break
      }
    }
    ;-1 < d && Beamer.eventListeners.splice(d, 1)
  } catch (f) {}
  a.removeEventListener
    ? a.removeEventListener(b, c, !1)
    : a.detachEvent
      ? a.detachEvent('on' + b, c)
      : (a['on' + b] = null)
}
Beamer.removeAllEventListeners = function () {
  for (; 0 < Beamer.eventListeners.length; ) {
    var a = Beamer.eventListeners.pop()
    try {
      Beamer.removeEventListener(a.element, a.type, a.handler)
    } catch (b) {}
  }
}
Beamer.addAttribute = function (a, b, c) {
  try {
    a.setAttribute(b, c)
  } catch (d) {}
}
Beamer.removeHref = function (a) {
  var b = Beamer.buildStandaloneUrl(),
    c = function (d) {
      d.href && d.href != b && (d.removeAttribute('href'), Beamer.addClass(d, 'beamerTrigger'))
      try {
        var e = d.getElementsByTagName('a')
        if (e && 0 < e.length)
          for (d = 0; d < e.length; d++) {
            var g = e[d]
            g && g.href && g.href != b && g.removeAttribute('href')
          }
      } catch (f) {}
    }
  'string' === typeof a ? Beamer.forEachElement(a, c) : c(a)
}
Beamer.removeClass = function (a, b) {
  try {
    Beamer.forEachElement(a, function (c) {
      null != c && (c.className = c.className.replace(new RegExp('( |^)' + b + '( |$)', 'g'), ' ').trim())
    })
  } catch (c) {}
}
Beamer.addClassBody = function (a) {
  try {
    var b = document.getElementsByTagName('BODY')[0]
    0 > b.className.indexOf(a) && (b.className += ' ' + a)
    var c = document.getElementsByTagName('HTML')[0]
    0 > c.className.indexOf(a) && (c.className += ' ' + a)
  } catch (d) {}
}
Beamer.removeClassBody = function (a) {
  try {
    var b = document.getElementsByTagName('BODY')[0]
    null != b && b.className && (b.className = b.className.replace(new RegExp('( |^)' + a + '( |$)', 'g'), ' ').trim())
    var c = document.getElementsByTagName('HTML')[0]
    null != c && c.className && (c.className = c.className.replace(new RegExp('( |^)' + a + '( |$)', 'g'), ' ').trim())
  } catch (d) {}
}
Beamer.appendHtml = function (a, b) {
  var c = document.createElement('div')
  for (c.innerHTML = b; 0 < c.children.length; ) a.appendChild(c.children[0])
}
Beamer.appendHtmlElement = function (a, b) {
  a.appendChild(b)
}
Beamer.appendStyles = function (a) {
  var b = Beamer.isEmbedMode() ? 'beamerEmbedStyles' : 'beamerStyles',
    c = document.getElementById(b)
  c ||
    ((c = document.createElement('link')),
    (c.id = b),
    (c.type = 'text/css'),
    (c.rel = 'stylesheet'),
    Beamer.isEmbedMode()
      ? (c.href = _BEAMER_URL + 'styles/beamer-embed-nostyle.css?v=3')
      : (c.href = '/beamer-embed.css'),
    (c.onload = function () {
      _BEAMER_CSS_LOADED = !0
      Beamer.clearDisplayFromElement('.beamer_icon, .beamer_defaultBeamerSelector')
    }),
    document.head.appendChild(c))
  'undefined' !== typeof a && a && Beamer.appendFont()
}
Beamer.appendFont = function () {
  if (
    !(
      ('undefined' !== typeof Beamer.config &&
        'undefined' !== typeof Beamer.config.disableFontImport &&
        Beamer.config.disableFontImport) ||
      ('undefined' !== typeof beamer_config.import_font && !beamer_config.import_font)
    )
  ) {
    var a = document.getElementById('beamerFont')
    a ||
      ((a = document.createElement('link')),
      (a.id = 'beamerFont'),
      (a.type = 'text/css'),
      (a.rel = 'stylesheet'),
      (a.href = _BEAMER_URL + 'styles/beamer-embed-fonts.css'),
      document.head.appendChild(a))
  }
}
Beamer.appendIframe = function (a) {}
Beamer.removeIframe = function () {
  var a = Beamer.isInApp() ? 'beamerNews' : 'beamerOverlay'
  Beamer.forEachElement(a, function (b) {
    b.parentNode.removeChild(b)
  })
}
Beamer.appendPushScript = function (a) {
  if (!(Beamer.isSafari() || Beamer.isIE() || Beamer.isFacebookApp() || Beamer.isInstagramApp()))
    if ('undefined' !== typeof Beamer.pushDomain)
      (Beamer.pushDomain == window.location.host ||
        ('undefined' !== typeof Beamer.extendedPushDomain &&
          Beamer.extendedPushDomain &&
          window.location.host.endsWith('.' + Beamer.pushDomain))) &&
        Beamer.appendPushPermissionScript(a)
    else if (
      'undefined' !== typeof _BEAMER_PUSH_PROMPT_TYPE &&
      ('popup' == _BEAMER_PUSH_PROMPT_TYPE || 'sidebar' == _BEAMER_PUSH_PROMPT_TYPE)
    ) {
      var b = _BEAMER_PUSH_URL + 'embeddedPush?product=' + beamer_config.product_id
      if (beamer_config.language) b += '&language=' + beamer_config.language
      else {
        var c = window.navigator.userLanguage || window.navigator.language
        c && 1 < c.length && ((c = c.substring(0, 2).toUpperCase()), (b += '&language=' + c))
      }
      'undefined' !== typeof a && !0 === a && (Beamer.pushRefused = !0)
      'undefined' !== typeof Beamer.escapeHtml && (b = Beamer.escapeHtml(b))
      Beamer.appendHtml(
        document.body,
        "<iframe sandbox='allow-same-origin allow-scripts' id='beamerPush' src='" +
          b +
          "' width='0' height='0' frameborder='0' scrolling='no'></iframe>",
      )
    }
}
Beamer.appendPushPermissionScript = function (a) {
  try {
    var b = document.getElementById('beamerPushPermissionScript')
    if (!b) {
      var c = _BEAMER_PUSH_URL + 'embeddedPushScript?product=' + beamer_config.product_id
      if (beamer_config.language) c += '&language=' + beamer_config.language
      else {
        var d = window.navigator.userLanguage || window.navigator.language
        d && 1 < d.length && ((d = d.substring(0, 2).toUpperCase()), (c += '&language=' + d))
      }
      'undefined' !== typeof a && !0 === a && (Beamer.pushRefused = !0)
      Beamer.ajax(c, function (e) {
        b = document.createElement('script')
        b.id = 'beamerPushPermissionScript'
        b.type = 'text/javascript'
        b.innerHTML = e
        document.body.appendChild(b)
      })
    }
  } catch (e) {}
}
Beamer.appendPushPromptScript = function () {
  try {
    Beamer.appendPushSDKScript(function () {
      var a = document.getElementById('beamerPushPromptScript')
      if (!a) {
        var b = _BEAMER_PUSH_URL + 'pushScript?product=' + beamer_config.product_id
        beamer_config.filter
          ? (b += '&role=' + encodeURIComponent(beamer_config.filter))
          : beamer_config.role && (b += '&role=' + encodeURIComponent(beamer_config.role))
        var c = Beamer.getCookie(_BEAMER_USER_ID + '_' + beamer_config.product_id)
        c && (b += '&user_id=' + c)
        beamer_config.language
          ? (b += '&language=' + beamer_config.language)
          : (c = window.navigator.userLanguage || window.navigator.language) &&
            1 < c.length &&
            ((c = c.substring(0, 2).toUpperCase()), (b += '&language=' + c))
        'undefined' != typeof beamer_config.user_id &&
          'user_id' != beamer_config.user_id &&
          (b += '&custom_user_id=' + encodeURIComponent(beamer_config.user_id))
        'undefined' != typeof beamer_config.user_lastname &&
          'lastname' != beamer_config.user_lastname &&
          (b += '&user_lastname=' + encodeURIComponent(beamer_config.user_lastname))
        'undefined' != typeof beamer_config.user_firstname &&
          'firstname' != beamer_config.user_firstname &&
          (b += '&user_firstname=' + encodeURIComponent(beamer_config.user_firstname))
        'undefined' != typeof beamer_config.user_email &&
          'email' != beamer_config.user_email &&
          (b += '&user_email=' + encodeURIComponent(beamer_config.user_email))
        'undefined' != typeof beamer_config.user_token &&
          'user_token' != beamer_config.user_token &&
          (b += '&user_token=' + encodeURIComponent(beamer_config.user_token))
        'undefined' !== typeof refuse && !0 === refuse && (b += '&refuse=true')
        Beamer.ajax(b, function (d) {
          a = document.createElement('script')
          a.id = 'beamerPushPromptScript'
          a.type = 'text/javascript'
          a.innerHTML = d
          document.body.appendChild(a)
        })
      }
    })
  } catch (a) {}
}
Beamer.appendPushSDKScript = function (a) {
  try {
    var b = document.getElementById('beamerPushSDKAppScript')
    b ||
      ((b = document.createElement('script')),
      (b.id = 'beamerPushSDKAppScript'),
      (b.type = 'text/javascript'),
      (b.onload = function () {
        var c = document.getElementById('beamerPushSDKMessagingScript')
        c ||
          ((c = document.createElement('script')),
          (c.id = 'beamerPushSDKMessagingScript'),
          (c.type = 'text/javascript'),
          (c.onload = function () {
            'undefined' !== typeof a && Beamer.isFunction(a) && a()
          }),
          (c.src = 'https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging-compat.js'),
          document.head.appendChild(c))
      }),
      (b.src = 'https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js'),
      document.head.appendChild(b))
  } catch (c) {}
}
Beamer.appendNPSScript = function () {
  var a = function () {
    try {
      Beamer.appendScript('beamerNpsScript', _BEAMER_URL + 'js/beamer-nps-embed.js')
    } catch (b) {}
  }
  'undefined' !== typeof beamer_config.nps_delay && 0 < beamer_config.nps_delay
    ? setTimeout(a, beamer_config.nps_delay)
    : a()
}
Beamer.appendBoostedAnnouncementsScript = function () {
  try {
    Beamer.appendScript('beamerBoostedAnnouncementsScript', _BEAMER_URL + 'js/beamer-boosted-embed.js?v=5')
  } catch (a) {}
}
Beamer.appendBoostedAnnouncementStyles = function () {
  Beamer.appendCSS('beamerAnnouncementCSS', _BEAMER_URL + 'styles/beamer-boosted-embed.css?v=7')
  Beamer.appendFont()
}
Beamer.appendUtilitiesIframe = function (a) {
  if ('undefined' === typeof Beamer.config.disableUtilitiesIframe || !Beamer.config.disableUtilitiesIframe)
    try {
      if (!document.getElementById('beamerUtilities')) {
        var b = 'undefined' !== typeof Beamer.customDomain ? Beamer.customDomain : _BEAMER_URL
        b += 'utilities?app_id=' + beamer_config.product_id
        'undefined' !== typeof Beamer.escapeHtml && (b = Beamer.escapeHtml(b))
        Beamer.appendHtml(
          document.body,
          "<iframe id='beamerUtilities' src='" + b + "' width='0' height='0' frameborder='0' scrolling='no'></iframe>",
        )
      }
      'undefined' !== typeof Beamer.customDomain && Beamer.setIframeCookies()
      'undefined' !== typeof a && a && Beamer.initUpdatesListener()
    } catch (c) {
      Beamer.logError(c)
    }
}
Beamer.setIframeCookies = function () {
  var a = _BEAMER_USER_ID + '_' + beamer_config.product_id,
    b = Beamer.getCookie(a),
    c = 'setCookies:' + JSON.stringify([{ name: a, value: b, expiration: 300 }])
  for (a = 1; 10 >= a; a++)
    setTimeout(function () {
      Beamer.sendMessageToIframe(c, 'beamerUtilities')
    }, 500 * a)
}
Beamer.initUpdatesListener = function () {
  var a = 'initUpdatesListener'
  'undefined' !== typeof beamer_config.user_id && '' !== beamer_config.user_id && (a += ':' + beamer_config.user_id)
  for (var b = 1; 10 >= b; b++)
    setTimeout(function () {
      Beamer.sendMessageToIframe(a, 'beamerUtilities')
    }, 500 * b)
}
Beamer.stopUpdatesListener = function () {
  Beamer.sendMessageToIframe('stopUpdatesListener', 'beamerUtilities')
  setTimeout(function () {
    Beamer.forEachElement('beamerUtilities', function (a) {
      a.parentNode.removeChild(a)
    })
  }, 1e3)
}
Beamer.removeNotificationIframe = function () {
  Beamer.forEachElement('beamerPush', function (a) {
    a.parentNode.removeChild(a)
  })
}
Beamer.showNotificationPrompt = function (a) {
  if ('undefined' === typeof Beamer.notificationPromptShown || !Beamer.notificationPromptShown) {
    if ('undefined' !== typeof Beamer.pushDomain || (_BEAMER_PUSH_PROMPT_TYPE && 'popup' == _BEAMER_PUSH_PROMPT_TYPE)) {
      var b = Beamer.getCookie(_BEAMER_LAST_PUSH_PROMPT_INTERACTION + '_' + beamer_config.product_id)
      if ('undefined' !== typeof b && '' !== b)
        try {
          if (((b = parseInt(b)), 864e5 > new Date().getTime() - b)) return
        } catch (c) {}
      Beamer.notificationPromptShown = !0
    }
    setTimeout(function () {
      if ('undefined' !== typeof Beamer.pushDomain) Beamer.appendPushPromptScript()
      else if (_BEAMER_PUSH_PROMPT_TYPE)
        if ('popup' == _BEAMER_PUSH_PROMPT_TYPE) {
          Beamer.appendStyles(!0)
          var c = document.getElementById('beamerPushModal')
          if (!c) {
            c = _BEAMER_LOGO_URL
              ? '<div class="pushContentImage" style="background-image:url(\'' + _BEAMER_LOGO_URL + '\')"></div>'
              : '<div class="pushContentImage"></div>'
            var d = '',
              e = '',
              g = '',
              f = '',
              h = ''
            null != Beamer.config.pushBodyBackgroundColor
              ? ((d =
                  '<div class="pushContent" style="background-color:' + Beamer.config.pushBodyBackgroundColor + ';">'),
                (e =
                  '<div class="pushActions" style="background-color:' + Beamer.config.pushBodyBackgroundColor + ';">'))
              : ((d = '<div class="pushContent">'), (e = '<div class="pushActions">'))
            g =
              null != Beamer.config.pushBodyTextColor
                ? '<div class="pushContentText" id="beamerPushModalContent" style="color:' +
                  Beamer.config.pushBodyTextColor +
                  ';">'
                : '<div class="pushContentText" id="beamerPushModalContent">'
            f =
              null != Beamer.config.pushPrimaryButtonBackgroundColor && null != Beamer.config.pushPrimaryButtonTextColor
                ? '<a id="pushConfirmation" class="pushButton" href="javascript:void(0)" role="button" style="background-color:' +
                  Beamer.config.pushPrimaryButtonBackgroundColor +
                  ' !important; color:' +
                  Beamer.config.pushPrimaryButtonTextColor +
                  ' !important;">'
                : null != Beamer.config.pushPrimaryButtonBackgroundColor &&
                    null == Beamer.config.pushPrimaryButtonTextColor
                  ? '<a id="pushConfirmation" class="pushButton" href="javascript:void(0)" role="button" style="background-color:' +
                    Beamer.config.pushPrimaryButtonBackgroundColor +
                    ' !important;">'
                  : null == Beamer.config.pushPrimaryButtonBackgroundColor &&
                      null != Beamer.config.pushPrimaryButtonTextColor
                    ? '<a id="pushConfirmation" class="pushButton" href="javascript:void(0)" role="button" style="color:' +
                      Beamer.config.pushPrimaryButtonTextColor +
                      ' !important;">'
                    : '<a id="pushConfirmation" class="pushButton" href="javascript:void(0)" role="button">'
            h =
              null != Beamer.config.pushSecondaryButtonTextColor
                ? '<a id="pushActionRefuse" href="javascript:void(0)" role="button" style="color:' +
                  Beamer.config.pushSecondaryButtonTextColor +
                  ';">'
                : '<a id="pushActionRefuse" href="javascript:void(0)" role="button">'
            c =
              '<div class="pushModal" id="beamerPushModal" role="dialog" aria-describedby="beamerPushModalContent">' +
              d +
              c +
              g +
              _BEAMER_PUSH_PROMPT_LABEL +
              '</div></div>' +
              e +
              h +
              _BEAMER_PUSH_PROMPT_REFUSE +
              '</a>' +
              f +
              _BEAMER_PUSH_PROMPT_ACCEPT +
              '</a></div></div>'
            Beamer.appendHtml(document.body, c)
            Beamer.addClick('pushActionRefuse', function () {
              Beamer.hideNotificationPrompt()
              Beamer.refuseNotifications()
              Beamer.setCookie(
                _BEAMER_LAST_PUSH_PROMPT_INTERACTION + '_' + beamer_config.product_id,
                new Date().getTime(),
                300,
              )
            })
            Beamer.addClick('pushConfirmation', function () {
              Beamer.openNotificationPopup()
              Beamer.hideNotificationPrompt()
              Beamer.setCookie(
                _BEAMER_LAST_PUSH_PROMPT_INTERACTION + '_' + beamer_config.product_id,
                new Date().getTime(),
                300,
              )
            })
          }
          setTimeout(function () {
            Beamer.addClass('beamerPushModal', 'active')
          }, 300)
        } else
          'sidebar' == _BEAMER_PUSH_PROMPT_TYPE &&
            (_BEAMER_IS_OPEN
              ? (Beamer.sendMessageToIframe('requestNotificationsPermission'), (_BEAMER_SHOW_PUSH_PROMPT = !1))
              : (_BEAMER_SHOW_PUSH_PROMPT = !0))
    }, a)
  }
}
Beamer.hideNotificationPrompt = function () {
  _BEAMER_PUSH_PROMPT_TYPE &&
    'popup' == _BEAMER_PUSH_PROMPT_TYPE &&
    (Beamer.removeClass('.pushModal', 'active'),
    setTimeout(function () {
      for (var a = document.getElementsByClassName('pushModal'), b = 0; b < a.length; b++) {
        var c = a[b]
        c.parentNode.removeChild(c)
      }
    }, 500))
}
Beamer.refuseNotifications = function () {
  Beamer.appendPushScript(!0)
}
Beamer.openNotificationPopup = function () {
  var a = _BEAMER_PUSH_URL + 'push?product=' + beamer_config.product_id,
    b = Beamer.getCookie(_BEAMER_USER_ID + '_' + beamer_config.product_id)
  b && (a += '&user_id=' + encodeURIComponent(b))
  beamer_config.language
    ? (a += '&language=' + beamer_config.language)
    : (b = window.navigator.userLanguage || window.navigator.language) &&
      1 < b.length &&
      ((b = b.substring(0, 2).toUpperCase()), (a += '&language=' + b))
  a += '&ref=' + encodeURIComponent(window.location.href)
  a = window.open(
    a,
    'Enable notifications',
    'scrollbars=no, width=800, height=600, top=' +
      ((window.innerHeight
        ? window.innerHeight
        : document.documentElement.clientHeight
          ? document.documentElement.clientHeight
          : screen.height) /
        2 -
        300 +
        (void 0 != window.screenTop ? window.screenTop : window.screenY)) +
      ', left=' +
      ((window.innerWidth
        ? window.innerWidth
        : document.documentElement.clientWidth
          ? document.documentElement.clientWidth
          : screen.width) /
        2 -
        400 +
        (void 0 != window.screenLeft ? window.screenLeft : window.screenX)),
  )
  window.focus && a.focus()
}
Beamer.appendAlert = function (a, b) {
  if (
    Beamer.enabled &&
    ('undefined' !== typeof beamer_config.product_id || 'undefined' !== typeof beamer_config.product)
  ) {
    var c = function () {
        if (!Beamer.isEmbedMode() && ('undefined' == typeof beamer_config.alert || beamer_config.alert)) {
          if (
            0 === Beamer.findElements(beamer_config.selector).length ||
            ('undefined' !== typeof beamer_config.force_button && beamer_config.force_button)
          ) {
            if (
              !(
                void 0 == beamer_config.button ||
                beamer_config.button ||
                ('undefined' !== typeof beamer_config.force_button && beamer_config.force_button)
              )
            )
              return
            if (0 === Beamer.findElements('beamerSelector').length) {
              beamer_config.selector =
                beamer_config.selector && '' !== beamer_config.selector
                  ? beamer_config.selector + ', beamerSelector'
                  : 'beamerSelector'
              var f = !1
              beamer_config.button_position &&
                ((f = beamer_config.button_position.trim()),
                (f = 'top-left' == f || 'top-right' == f || 'bottom-right' == f || 'bottom-left' == f))
              var h = 'beamer_defaultBeamerSelector '
              h = f ? h + beamer_config.button_position : h + 'bottom-right'
              beamer_config.icon && (h += ' ' + beamer_config.icon)
              f = '<div id="beamerSelector" class="' + h + '" tabindex="0" role="button"'
              h = Beamer.getFromStorage(_BEAMER_SELECTOR_COLOR)
              Beamer.appendHtml(
                document.body,
                (h ? f + (' style="display: none; background-color: ' + h + ';"') : f + ' style="display: none;"') +
                  '></div>',
              )
              Beamer.setPosition('.beamer_defaultBeamerSelector')
              Beamer.defaultSelector = !0
              _BEAMER_CSS_LOADED
                ? Beamer.clearDisplayFromElement('.beamer_defaultBeamerSelector')
                : setTimeout(function () {
                    Beamer.clearDisplayFromElement('.beamer_defaultBeamerSelector')
                  }, 5e3)
            }
          }
          Beamer.forEachElement(beamer_config.selector, function (k) {
            Beamer.addClass(k, 'beamer_beamerSelector')
            Beamer.isElementClickable(k) && (Beamer.addClick(k, Beamer.toggle), Beamer.removeHref(k))
          })
        }
      },
      d = Beamer.getDateCookie(),
      e = Beamer.getBoostedAnnouncementDateCookie(),
      g = encodeURIComponent(window.location.host)
    e = Beamer.buildUnreadUrl(g, d, e, a)
    g = 8e3 < e.length
    Beamer.lastRequestTimestamp = new Date().getTime()
    Beamer.ajax(
      e,
      function (f) {
        f = JSON.parse(f)
        Beamer.setParameters(f)
        'undefined' !== typeof f.lastViewDate &&
          '' !== f.lastViewDate.trim() &&
          ((d = f.lastViewDate), Beamer.setDateCookie(d, 300))
        if (void 0 != beamer_config.mobile && !beamer_config.mobile && Beamer.isMobile())
          try {
            console.log('Mobile version is disabled by configuration. (mobile:false).')
          } catch (n) {}
        else {
          Beamer.isInApp() && Beamer.appendPopperScript()
          Beamer.appendStyles()
          Beamer.isEmbedMode() &&
          ('undefined' === typeof beamer_config.show || beamer_config.show || Beamer.hasOpenHash())
            ? (Beamer.hasOpenHash() && (Beamer.isHashOpen = !0),
              setTimeout(function () {
                Beamer.show()
              }, 500))
            : Beamer.hasOpenHash() &&
              ((Beamer.isHashOpen = !0),
              Beamer.isInApp() && 'undefined' === typeof Popper
                ? setTimeout(function (n) {
                    Beamer.show()
                  }, 2e3)
                : Beamer.show())
          c()
          var h = !1
          a || (Beamer.notificationColor = Beamer.getConfigParameter(f, 'notificationColor'))
          Beamer.isHashOpen && !a
            ? ((Beamer.notificationNumber = 0), (Beamer.notificationActive = !1))
            : 0 < f.number
              ? ((h = f.number > Beamer.notificationNumber),
                (Beamer.notificationNumber = f.number),
                (Beamer.notificationActive = !0))
              : null == d || '' == d || ('undefined' !== typeof f.forceDeviceSync && f.forceDeviceSync)
                ? 'undefined' !== typeof beamer_config.first_visit_unread
                  ? 0 < beamer_config.first_visit_unread
                    ? ((Beamer.notificationNumber = beamer_config.first_visit_unread), (Beamer.notificationActive = !0))
                    : ((Beamer.notificationNumber = 0),
                      (Beamer.notificationActive = !1),
                      setTimeout(function () {
                        Beamer.setDateCookie(new Date().toISOString(), 300)
                      }, 500))
                  : ((Beamer.notificationNumber = 0), (Beamer.notificationActive = !0))
                : ((Beamer.notificationNumber = 0), (Beamer.notificationActive = !1))
          ;('undefined' == typeof beamer_config.alert ||
            beamer_config.alert ||
            ('undefined' !== typeof beamer_config.counter && beamer_config.counter)) &&
            Beamer.drawAlert()
          Beamer.enableFaviconNotification && Beamer.drawFavicon()
          if (!a && Beamer.defaultSelector) {
            var k = Beamer.getConfigParameter(f, 'defaultSelectorColor')
            Beamer.setColor('beamerSelector', k)
            Beamer.saveInStorage(_BEAMER_SELECTOR_COLOR, k)
          }
          a || Beamer.saveInStorage(_BEAMER_HEADER_COLOR, Beamer.getConfigParameter(f, 'headerColor'))
          'undefined' != typeof beamer_config.callback && beamer_config.callback(f.callbackNumber, f.priority)
          !f.priority ||
            ('undefined' !== typeof beamer_config.ignore_auto_open && beamer_config.ignore_auto_open) ||
            (Beamer.isMobile() &&
              'undefined' !== typeof beamer_config.ignore_auto_open_mobile &&
              beamer_config.ignore_auto_open_mobile) ||
            setTimeout(function () {
              Beamer.show()
            }, 500)
          ;(('undefined' !== typeof f.lastPostTitle && '' !== f.lastPostTitle) ||
            'undefined' !== typeof f.lastPostId) &&
            Beamer.showLastPost(f)
          k = Beamer.getConfigParameter(f, 'pushNotificationsPromptEnabled')
          ;(('undefined' !== typeof k && k) || (a && Beamer.pushEnabled)) &&
            (!a || ('undefined' !== typeof b && b)) &&
            ((Beamer.pushDomain = Beamer.getConfigParameter(f, 'pushDomain')),
            (Beamer.extendedPushDomain = Beamer.getConfigParameter(f, 'extendedPushDomain')),
            (Beamer.pushEnabled = !0),
            a ||
              ((_BEAMER_PUSH_PROMPT_TYPE = beamer_config.notification_prompt
                ? beamer_config.notification_prompt
                : Beamer.getConfigParameter(f, 'pushNotificationsPromptType')),
              (k = Beamer.getConfigParameter(f, 'pushNotificationsPrompt')) && (_BEAMER_PUSH_PROMPT_LABEL = k),
              (k = Beamer.getConfigParameter(f, 'pushNotificationsPromptAccept')) && (_BEAMER_PUSH_PROMPT_ACCEPT = k),
              (k = Beamer.getConfigParameter(f, 'pushNotificationsPromptRefuse')) && (_BEAMER_PUSH_PROMPT_REFUSE = k),
              (k = Beamer.getConfigParameter(f, 'logoUrl')) && (_BEAMER_LOGO_URL = k)),
            'undefined' !== typeof beamer_config.notification_prompt_delay &&
            0 < beamer_config.notification_prompt_delay &&
            ('undefined' === typeof b || !b)
              ? (Beamer.notificationScriptTimeout = setTimeout(function () {
                  Beamer.appendPushScript()
                  delete Beamer.notificationScriptTimeout
                }, beamer_config.notification_prompt_delay))
              : Beamer.appendPushScript())
          a ||
            ((k = Beamer.getConfigParameter(f, 'customDomain')),
            'undefined' !== typeof k && ((Beamer.customDomain = k), Beamer.appendUtilitiesIframe()),
            Beamer.initDomObserver(),
            (k = Beamer.getConfigParameter(f, 'enableSoundNotification')),
            'undefined' !== typeof k && k && (Beamer.enableSoundNotification = !0),
            (k = Beamer.getConfigParameter(f, 'enableFaviconNotification')),
            'undefined' !== typeof k && k && ((Beamer.enableFaviconNotification = !0), Beamer.appendFaviconScript()))
          h && (_BEAMER_IS_OPEN || Beamer.playSound())
          k = Beamer.getConfigParameter(f, 'enableAutoRefresh')
          var l = Beamer.getConfigParameter(f, 'activateAutoRefresh')
          if (
            !Beamer.isEmbedMode() &&
            ('undefined' === typeof beamer_config.auto_refresh || beamer_config.auto_refresh) &&
            'undefined' !== typeof l &&
            l &&
            'undefined' !== typeof k &&
            k
          ) {
            if (h || ('undefined' !== typeof b && b))
              (_BEAMER_IS_OPEN ? (Beamer.removeOnHide = !0) : Beamer.removeIframe(),
                Beamer.setCookie(_BEAMER_LAST_UPDATE + '_' + beamer_config.product_id, new Date().getTime(), 300))
            h = Beamer.getConfigParameter(f, 'autoRefreshTimeout')
            'undefined' !== typeof h
              ? (Beamer.autoRefreshTimeout = h)
              : ('undefined' !== typeof Beamer.autoRefreshTimeout && Beamer.autoRefreshTimeout) ||
                (Beamer.autoRefreshTimeout = 1201e3)
            h = Beamer.getConfigParameter(f, 'enableUpdatesListener')
            'undefined' !== typeof h && h
              ? ((f = Beamer.getConfigParameter(f, 'updatesDelay')),
                'undefined' !== typeof f && 0 <= f && (Beamer.updatesMaxDelay = f),
                Beamer.appendUtilitiesIframe(!0))
              : Beamer.prepareAutoRefresh()
          } else
            'undefined' !== typeof b &&
              b &&
              (_BEAMER_IS_OPEN ? (Beamer.removeOnHide = !0) : Beamer.removeIframe(),
              Beamer.setCookie(_BEAMER_LAST_UPDATE + '_' + beamer_config.product_id, new Date().getTime(), 300))
        }
      },
      function () {
        var f = 'undefined' !== typeof beamer_config.onerror ? beamer_config.onerror : beamer_config.onError
        if (f && Beamer.isFunction(f) && ((f = f()), 'undefined' !== typeof f && !1 === f)) return
        c()
      },
      g ? 'POST' : 'GET',
    )
  }
}
Beamer.appendFeedbackButtons = function () {
  if (
    'undefined' !== typeof Beamer.config.ideasEnabled &&
    Beamer.config.ideasEnabled &&
    'undefined' !== typeof beamer_config.feedback_button &&
    beamer_config.feedback_button
  ) {
    var a = function () {
      _BEAMER_CSS_LOADED ? Beamer.appendDefaultIdeasButton() : setTimeout(a, 200)
    }
    a()
  }
  Beamer.bindFeedbackButtons()
}
Beamer.appendDefaultIdeasButton = function () {
  if (!(0 < Beamer.findElements('.beamer_ideasFormButton').length)) {
    var a =
        'undefined' !== typeof beamer_config.feedback_button_position
          ? beamer_config.feedback_button_position
          : 'right',
      b = 'undefined' !== typeof Beamer.config.feedbackButtonText ? Beamer.config.feedbackButtonText : 'Feedback',
      c = ''
    if (
      'undefined' !== typeof Beamer.config.feedbackButtonColor ||
      'undefined' !== typeof Beamer.config.feedbackButtonTextColor
    )
      ((c = ' style="'),
        'undefined' !== typeof Beamer.config.feedbackButtonColor &&
          (c += 'background-color: ' + Beamer.escapeHtml(Beamer.config.feedbackButtonColor) + ';'),
        'undefined' !== typeof Beamer.config.feedbackButtonTextColor &&
          (c += 'color: ' + Beamer.escapeHtml(Beamer.config.feedbackButtonTextColor) + ';'),
        (c += '"'))
    a =
      '<div class="beamer_ideasFormButton"' +
      c +
      ' data-position="' +
      Beamer.escapeHtml(a) +
      '" tabindex="0" role="button"><span>' +
      Beamer.escapeHtml(b) +
      '</span></div>'
    Beamer.appendHtml(document.body, a)
    Beamer.addClick('.beamer_ideasFormButton', function (d) {
      Beamer.showIdeas(!0, d)
    })
  }
}
Beamer.bindFeedbackButtons = function () {
  'undefined' !== typeof Beamer.config.ideasEnabled &&
    Beamer.config.ideasEnabled &&
    ('undefined' !== typeof beamer_config.ideas_selector && '' !== beamer_config.ideas_selector.trim()
      ? (0 > beamer_config.ideas_selector.indexOf('.beamerIdeasTrigger') &&
          (beamer_config.ideas_selector += ',.beamerIdeasTrigger'),
        0 > beamer_config.ideas_selector.indexOf('a[href="#beamerIdeasTrigger"]') &&
          (beamer_config.ideas_selector += ',a[href="#beamerIdeasTrigger"]'))
      : (beamer_config.ideas_selector = '.beamerIdeasTrigger,a[href="#beamerIdeasTrigger"]'),
    Beamer.addClass(beamer_config.ideas_selector, 'beamer_beamerSelector'),
    Beamer.addClick(beamer_config.ideas_selector, Beamer.handleIdeasButtonClick),
    'undefined' !== typeof beamer_config.ideas_form_selector && '' !== beamer_config.ideas_form_selector.trim()
      ? (0 > beamer_config.ideas_form_selector.indexOf('.beamerIdeasFormTrigger') &&
          (beamer_config.ideas_form_selector += ',.beamerIdeasFormTrigger'),
        0 > beamer_config.ideas_form_selector.indexOf('a[href="#beamerIdeasFormTrigger"]') &&
          (beamer_config.ideas_form_selector += ',a[href="#beamerIdeasFormTrigger"]'))
      : (beamer_config.ideas_form_selector = '.beamerIdeasFormTrigger,a[href="#beamerIdeasFormTrigger"]'),
    Beamer.addClass(beamer_config.ideas_form_selector, 'beamer_beamerSelector'),
    Beamer.addClick(beamer_config.ideas_form_selector, Beamer.handleIdeasFormButtonClick))
  'undefined' !== typeof Beamer.config.roadmapEnabled &&
    Beamer.config.roadmapEnabled &&
    ('undefined' !== typeof beamer_config.roadmap_selector && '' !== beamer_config.roadmap_selector.trim()
      ? (0 > beamer_config.roadmap_selector.indexOf('.beamerRoadmapTrigger') &&
          (beamer_config.roadmap_selector += ',.beamerRoadmapTrigger'),
        0 > beamer_config.roadmap_selector.indexOf('a[href="#beamerRoadmapTrigger"]') &&
          (beamer_config.roadmap_selector += ',a[href="#beamerRoadmapTrigger"]'))
      : (beamer_config.roadmap_selector = '.beamerRoadmapTrigger,a[href="#beamerRoadmapTrigger"]'),
    Beamer.addClass(beamer_config.roadmap_selector, 'beamer_beamerSelector'),
    Beamer.addClick(beamer_config.roadmap_selector, Beamer.handleRoadmapButtonClick))
}
Beamer.handleIdeasButtonClick = function (a) {
  Beamer.showIdeas(!1, a)
}
Beamer.handleIdeasFormButtonClick = function (a) {
  Beamer.showIdeas(!0, a)
}
Beamer.handleRoadmapButtonClick = function (a) {
  Beamer.showRoadmap(!1, a)
}
Beamer.removeFeedbackButtons = function () {
  Beamer.forEachElement('.beamer_ideasFormButton', function (a) {
    a.parentNode.removeChild(a)
  })
  'undefined' !== typeof beamer_config.ideas_selector &&
    '' !== beamer_config.ideas_selector &&
    Beamer.removeClass(beamer_config.ideas_selector, 'beamer_beamerSelector')
  'undefined' !== typeof beamer_config.ideas_form_selector &&
    '' !== beamer_config.ideas_form_selector &&
    Beamer.removeClass(beamer_config.ideas_form_selector, 'beamer_beamerSelector')
  'undefined' !== typeof beamer_config.roadmap_selector &&
    '' !== beamer_config.roadmap_selector &&
    Beamer.removeClass(beamer_config.roadmap_selector, 'beamer_beamerSelector')
}
Beamer.prepareAutoRefresh = function (a) {
  'undefined' === typeof a && (a = Beamer.autoRefreshTimeout)
  'undefined' !== typeof a &&
    ('undefined' !== typeof Beamer.autoTimeout && clearTimeout(Beamer.autoTimeout),
    (Beamer.autoTimeout = setTimeout(function () {
      Beamer.appendAlert(!0)
    }, a)))
}
Beamer.buildFeedUrl = function (a, b, c) {
  var d = _BEAMER_URL + a
  d = -1 < d.indexOf('?') ? d + '&' : d + '?'
  d =
    'undefined' != typeof beamer_config.product_id
      ? d + ('app_id=' + beamer_config.product_id)
      : d + ('id=' + beamer_config.product)
  'undefined' !== typeof window._BEAMER_CHANGELOG_POST_ID &&
    window._BEAMER_CHANGELOG_POST_ID &&
    (d += '&featureId=' + encodeURIComponent(window._BEAMER_CHANGELOG_POST_ID))
  if (0 !== a.indexOf('popup')) {
    if (
      ((c = Beamer.getDateCookie()),
      (a =
        'undefined' !== typeof beamer_config.filter_by_url && beamer_config.filter_by_url
          ? encodeURIComponent(window.location.href)
          : encodeURIComponent(window.location.host)),
      (d += '&url=' + a + '&lastView=' + encodeURI(c)),
      'undefined' !== typeof beamer_config.filter_by_url &&
        (d = beamer_config.filter_by_url ? d + '&filterByUrl=true' : d + '&filterByUrl=false'),
      'undefined' != typeof beamer_config.role
        ? (d += '&role=' + encodeURIComponent(beamer_config.role))
        : 'undefined' != typeof beamer_config.filter && (d += '&role=' + encodeURIComponent(beamer_config.filter)),
      'undefined' != typeof beamer_config.force_filter &&
        (d += '&force_filter=' + encodeURIComponent(beamer_config.force_filter)),
      beamer_config.language && (d += '&language=' + beamer_config.language),
      (c = Beamer.getCookie(_BEAMER_USER_ID + '_' + beamer_config.product_id)) && (d += '&user_id=' + c),
      'undefined' != typeof beamer_config.user_id &&
        'user_id' != beamer_config.user_id &&
        (d += '&custom_user_id=' + encodeURIComponent(beamer_config.user_id)),
      'undefined' != typeof beamer_config.user_token &&
        'user_token' != beamer_config.user_token &&
        (d += '&user_token=' + encodeURIComponent(beamer_config.user_token)),
      'undefined' != typeof beamer_config.user_lastname &&
        'lastname' != beamer_config.user_lastname &&
        (d += '&lastname=' + encodeURIComponent(beamer_config.user_lastname)),
      'undefined' != typeof beamer_config.user_firstname &&
        'firstname' != beamer_config.user_firstname &&
        (d += '&firstname=' + encodeURIComponent(beamer_config.user_firstname)),
      'undefined' != typeof beamer_config.user_email &&
        'email' != beamer_config.user_email &&
        (d += '&email=' + encodeURIComponent(beamer_config.user_email)),
      Beamer.isEmbedMode() && (d += '&embed=' + beamer_config.embed),
      'undefined' !== typeof beamer_config.display)
    )
      if (
        ((c = 'popup'),
        'undefined' !== typeof beamer_config.theme && (c += ' ' + beamer_config.theme),
        'popup' === beamer_config.display)
      )
        d += '&theme=' + c
      else if ('in-app' === beamer_config.display || 'compact' === beamer_config.display)
        d += '&theme=' + c + '&in_app=true'
  } else
    ((a = encodeURIComponent(window.location.host)),
      (d += '&url=' + a),
      'undefined' != typeof beamer_config.user_token &&
        'user_token' != beamer_config.user_token &&
        (d += '&user_token=' + encodeURIComponent(beamer_config.user_token)),
      'undefined' !== typeof c &&
        c &&
        ((c = Beamer.getCookie(_BEAMER_USER_ID + '_' + beamer_config.product_id)) && (d += '&user_id=' + c),
        'undefined' != typeof beamer_config.user_id &&
          'user_id' != beamer_config.user_id &&
          (d += '&custom_user_id=' + encodeURIComponent(beamer_config.user_id)),
        'undefined' != typeof beamer_config.user_lastname &&
          'lastname' != beamer_config.user_lastname &&
          (d += '&lastname=' + encodeURIComponent(beamer_config.user_lastname)),
        'undefined' != typeof beamer_config.user_firstname &&
          'firstname' != beamer_config.user_firstname &&
          (d += '&firstname=' + encodeURIComponent(beamer_config.user_firstname)),
        'undefined' != typeof beamer_config.user_email &&
          'email' != beamer_config.user_email &&
          (d += '&email=' + encodeURIComponent(beamer_config.user_email))))
  'undefined' !== typeof beamer_config.theme &&
    ('undefined' === typeof beamer_config.display ||
      ('popup' !== beamer_config.display &&
        'in-app' !== beamer_config.display &&
        'compact' !== beamer_config.display)) &&
    (d += '&theme=' + beamer_config.theme)
  'undefined' != typeof beamer_config.header_color &&
    (d += '&headerColor=' + encodeURIComponent(beamer_config.header_color))
  'undefined' != typeof beamer_config.standalone_logo &&
    (d += '&standaloneLogoUrl=' + encodeURIComponent(beamer_config.standalone_logo))
  'undefined' != typeof beamer_config.product_name &&
    (d += '&productName=' + encodeURIComponent(beamer_config.product_name))
  'undefined' != typeof b && (d += '&featureId=' + encodeURIComponent(b))
  'undefined' !== typeof beamer_config.hide_feedback &&
    (d += '&hideFeedback=' + encodeURIComponent(beamer_config.hide_feedback))
  try {
    var e = -new Date().getTimezoneOffset()
    d += '&tzOffset=' + encodeURIComponent(e)
  } catch (g) {
    try {
      console.error(g)
    } catch (f) {}
  }
  return d
}
Beamer.buildNewsUrl = function (a) {
  return Beamer.buildFeedUrl('news')
}
Beamer.buildUnreadUrl = function (a, b, c, d) {
  var e = _BEAMER_URL_BACK
  e =
    ('undefined' !== typeof d && d ? e + 'realtimeUpdates' : e + 'numberFeatures') +
    ('?url=' + a + '&product=' + beamer_config.product_id + '&v=1')
  a = Beamer.getConfigParameter(beamer_config, 'filterByUrl')
  'undefined' === typeof a && (a = beamer_config.filter_by_url)
  'undefined' === typeof a &&
    ((a = Beamer.getCookie(_BEAMER_FILTER_BY_URL + '_' + beamer_config.product_id)),
    'undefined' !== typeof a && '' !== a.trim() && (beamer_config.filter_by_url = 'true' === a || !0 === a ? !0 : !1))
  a = Beamer.getConfigParameter(beamer_config, 'filterByUrl')
  'undefined' === typeof a && (a = beamer_config.filter_by_url)
  'undefined' !== typeof a &&
    (a
      ? ((a = encodeURIComponent(window.location.href)), (e += '&fullUrl=' + a), (Beamer.fullUrl = a))
      : (e += '&filterByUrl=false'))
  beamer_config.language
    ? (e += '&language=' + beamer_config.language)
    : (a = window.navigator.userLanguage || window.navigator.language) &&
      1 < a.length &&
      ((a = a.substring(0, 2).toUpperCase()), (e += '&language=' + a))
  'undefined' !== typeof beamer_config.role
    ? (e += '&role=' + encodeURIComponent(beamer_config.role))
    : 'undefined' !== typeof beamer_config.filter && (e += '&role=' + encodeURIComponent(beamer_config.filter))
  'undefined' !== typeof beamer_config.force_filter &&
    (e += '&force_filter=' + encodeURIComponent(beamer_config.force_filter))
  'undefined' !== typeof b && null !== b && '' !== b && (e += '&date=' + b)
  'undefined' !== typeof c && null !== c && '' !== c && (e += '&boostedAnnouncementDate=' + c)
  c = Beamer.getCookie(_BEAMER_USER_ID + '_' + beamer_config.product_id)
  if (null === c || '' === c) c = Beamer.uuidv4()
  Beamer.setCookie(_BEAMER_USER_ID + '_' + beamer_config.product_id, c, 300)
  c && 'undefined' !== typeof b && null !== b && '' !== b
    ? (e += '&user_id=' + c)
    : c && !_BEAMER_MASSIVE && (e += '&user_id=' + c)
  'undefined' !== typeof beamer_config.user_id &&
    'user_id' !== beamer_config.user_id &&
    (e += '&custom_user_id=' + encodeURIComponent(beamer_config.user_id))
  'undefined' !== typeof beamer_config.user_token &&
    'user_token' !== beamer_config.user_token &&
    (e += '&user_token=' + encodeURIComponent(beamer_config.user_token))
  'undefined' !== typeof beamer_config.user_lastname &&
    'lastname' !== beamer_config.user_lastname &&
    (e += '&lastname=' + encodeURIComponent(beamer_config.user_lastname))
  'undefined' !== typeof beamer_config.user_firstname &&
    'firstname' !== beamer_config.user_firstname &&
    (e += '&firstname=' + encodeURIComponent(beamer_config.user_firstname))
  'undefined' !== typeof beamer_config.user_email &&
    'email' !== beamer_config.user_email &&
    (e += '&email=' + encodeURIComponent(beamer_config.user_email))
  'undefined' !== typeof d && d
    ? ((e += '&auto=true'),
      'undefined' !== typeof Beamer.lastUpdateTimestamp && (e += '&_=' + Beamer.lastUpdateTimestamp))
    : ((b = Beamer.getCookie(_BEAMER_LAST_UPDATE + '_' + beamer_config.product_id)),
      'undefined' !== typeof b && null !== b && '' !== b && (e += '&_=' + b),
      'undefined' !== typeof beamer_config.source &&
        '' !== beamer_config.source.trim() &&
        (e += '&source=' + encodeURIComponent(beamer_config.source)))
  'undefined' !== typeof beamer_config.ignore_boosted_announcements &&
    (e += '&ignoreBoosted=' + encodeURIComponent(beamer_config.ignore_boosted_announcements))
  return (e = Beamer.appendCustomParameters(e))
}
Beamer.appendCustomParameters = function (a) {
  for (var b in beamer_config)
    if (beamer_config.hasOwnProperty(b) && !(-1 < Beamer.reservedParameters.indexOf(b))) {
      var c = beamer_config[b]
      'undefined' === typeof c ||
        'object' === typeof c ||
        Beamer.isFunction(c) ||
        (-1 === b.indexOf('_at', b.length - 3) &&
          -1 === b.indexOf('_blob', b.length - 5) &&
          ('boolean' === typeof c ? (b = 'b_' + b) : 'number' === typeof c && (b = 'n_' + b)),
        (a += '&c_' + b + '=' + encodeURIComponent(c)))
    }
  return a
}
Beamer.setParameters = function (a) {
  var b = Beamer.getConfigParameter(a, 'pushNotificationPromptDelay')
  'undefined' !== typeof b &&
    'undefined' === typeof beamer_config.notification_prompt_delay &&
    (beamer_config.notification_prompt_delay = b)
  b = Beamer.getConfigParameter(a, 'mobile')
  'undefined' !== typeof b && 'undefined' === typeof beamer_config.mobile && (beamer_config.mobile = b)
  b = Beamer.getConfigParameter(a, 'embed')
  'undefined' !== typeof b && 'undefined' === typeof beamer_config.embed && (beamer_config.embed = b)
  b = Beamer.getConfigParameter(a, 'enableEmbed')
  'undefined' === typeof b || b || (beamer_config.embed = !1)
  b = Beamer.getConfigParameter(a, 'filterByUrl')
  'undefined' !== typeof b
    ? ('undefined' === typeof beamer_config.filter_by_url && (beamer_config.filter_by_url = b),
      Beamer.setCookie(_BEAMER_FILTER_BY_URL + '_' + beamer_config.product_id, b, 0.01334))
    : Beamer.setCookie(_BEAMER_FILTER_BY_URL + '_' + beamer_config.product_id, !1, 0.01334)
  b = Beamer.getConfigParameter(a, 'alert')
  'undefined' !== typeof b && 'undefined' === typeof beamer_config.alert && (beamer_config.alert = b)
  b = Beamer.getConfigParameter(a, 'button')
  'undefined' !== typeof b && 'undefined' === typeof beamer_config.button && (beamer_config.button = b)
  b = Beamer.getConfigParameter(a, 'ignoreAutoOpen')
  'undefined' !== typeof b &&
    'undefined' === typeof beamer_config.ignore_auto_open &&
    (beamer_config.ignore_auto_open = b)
  b = Beamer.getConfigParameter(a, 'ignoreAutoOpenMobile')
  'undefined' !== typeof b &&
    'undefined' === typeof beamer_config.ignore_auto_open_mobile &&
    (beamer_config.ignore_auto_open_mobile = b)
  b = Beamer.getConfigParameter(a, 'bounce')
  'undefined' !== typeof b && 'undefined' === typeof beamer_config.bounce && (beamer_config.bounce = b)
  b = Beamer.getConfigParameter(a, 'right')
  'undefined' !== typeof b && 'undefined' === typeof beamer_config.right && (beamer_config.right = b)
  b = Beamer.getConfigParameter(a, 'top')
  'undefined' !== typeof b && 'undefined' === typeof beamer_config.top && (beamer_config.top = b)
  b = Beamer.getConfigParameter(a, 'bottom')
  'undefined' !== typeof b && 'undefined' === typeof beamer_config.bottom && (beamer_config.bottom = b)
  b = Beamer.getConfigParameter(a, 'left')
  'undefined' !== typeof b && 'undefined' === typeof beamer_config.left && (beamer_config.left = b)
  b = Beamer.getConfigParameter(a, 'selector')
  'undefined' !== typeof b &&
    ('undefined' === typeof beamer_config.selector ||
      ('undefined' !== typeof Beamer.defaultSelector && Beamer.defaultSelector) ||
      ('undefined' !== typeof Beamer.noSelector && Beamer.noSelector)) &&
    ((beamer_config.selector = b), (Beamer.defaultSelector = !1), (Beamer.noSelector = !1))
  b = Beamer.getConfigParameter(a, 'feedbackButton')
  'undefined' !== typeof b &&
    'undefined' === typeof beamer_config.feedback_button &&
    (beamer_config.feedback_button = b)
  b = Beamer.getConfigParameter(a, 'feedbackButtonPosition')
  'undefined' !== typeof b &&
    'undefined' === typeof beamer_config.feedback_button_position &&
    (beamer_config.feedback_button_position = b)
  b = Beamer.getConfigParameter(a, 'ideasSelector')
  'undefined' !== typeof b && 'undefined' === typeof beamer_config.ideas_selector && (beamer_config.ideas_selector = b)
  b = Beamer.getConfigParameter(a, 'ideasFormSelector')
  'undefined' !== typeof b &&
    'undefined' === typeof beamer_config.ideas_form_selector &&
    (beamer_config.ideas_form_selector = b)
  b = Beamer.getConfigParameter(a, 'roadmapSelector')
  'undefined' !== typeof b &&
    'undefined' === typeof beamer_config.roadmap_selector &&
    (beamer_config.roadmap_selector = b)
  b = Beamer.getConfigParameter(a, 'display')
  'undefined' !== typeof b && 'undefined' === typeof beamer_config.display && (beamer_config.display = b)
  b = Beamer.getConfigParameter(a, 'filter')
  'undefined' !== typeof b && 'undefined' === typeof beamer_config.filter && (beamer_config.filter = b)
  b = Beamer.getConfigParameter(a, 'buttonPosition')
  'undefined' !== typeof b &&
    'undefined' === typeof beamer_config.button_position &&
    (beamer_config.button_position = b)
  b = Beamer.getConfigParameter(a, 'icon')
  'undefined' !== typeof b && 'undefined' === typeof beamer_config.icon && (beamer_config.icon = b)
  b = Beamer.getConfigParameter(a, 'displayPosition')
  'undefined' !== typeof b &&
    'undefined' === typeof beamer_config.display_position &&
    (beamer_config.display_position = b)
  b = Beamer.getConfigParameter(a, 'forceButton')
  'undefined' !== typeof b && 'undefined' === typeof beamer_config.force_button && (beamer_config.force_button = b)
  b = Beamer.getConfigParameter(a, 'hasGoogleTrackingId')
  'undefined' !== typeof b && (Beamer.hasGoogleTrackingId = b)
  b = Beamer.getConfigParameter(a, 'hasGA4TrackingId')
  'undefined' !== typeof b && (Beamer.hasGA4TrackingId = b)
  a = Beamer.getConfigParameter(a, 'lastPushUpdateTime')
  'undefined' !== typeof a &&
    (('undefined' !== typeof Beamer.config && Beamer.config) || (Beamer.config = {}),
    (Beamer.config.lastPushUpdateTime = a))
}
Beamer.makeRelative = function (a) {
  try {
    var b = 'undefined' !== typeof jQuery && 'static' == $(a).css('position')
    if (!b) {
      var c = window.getComputedStyle(a, null)
      b = c && c.getPropertyValue('position') && 'static' == c.getPropertyValue('position')
    }
    b && Beamer.addClass(a, 'beamer_beamerSelectorRelative')
  } catch (d) {}
}
Beamer.drawAlert = function () {
  if (Beamer.isEmbedMode() || ('undefined' !== typeof beamer_config.counter && !beamer_config.counter))
    Beamer.forEachElement(beamer_config.selector, function (d) {
      ;-1 === Beamer.elements.indexOf(d) && Beamer.elements.push(d)
    })
  else {
    var a = '1'
    null != Beamer.notificationNumber &&
      0 < Beamer.notificationNumber &&
      (a = 99 < Beamer.notificationNumber ? '99+' : '' + Beamer.notificationNumber)
    var b = 'beamer_icon'
    'undefined' !== typeof beamer_config.bounce && !1 === beamer_config.bounce && (b += ' noBouncy')
    var c = "<div class='" + b + "' style='display: none;'>" + a + '</div>'
    Beamer.forEachElement(beamer_config.selector, function (d) {
      ;-1 < Beamer.elements.indexOf(d)
        ? (d.getElementsByClassName('beamer_icon')[0].innerHTML = a)
        : (Beamer.elements.push(d),
          Beamer.makeRelative(d),
          Beamer.appendHtml(d, c),
          ('undefined' == typeof beamer_config.alert || beamer_config.alert) &&
            Beamer.isElementClickable(d) &&
            ((d = d.getElementsByClassName('beamer_icon')[0]), Beamer.addClick(d, Beamer.toggle)))
    })
    Beamer.defaultSelector || Beamer.setPosition('.beamer_icon')
    Beamer.setColor('.beamer_icon', Beamer.notificationColor)
    Beamer.notificationActive &&
      (_BEAMER_CSS_LOADED
        ? Beamer.clearDisplayFromElement('.beamer_icon')
        : setTimeout(function () {
            Beamer.clearDisplayFromElement('.beamer_icon')
          }, 5e3),
      Beamer.addClass('.beamer_icon', 'active'))
  }
}
Beamer.clearAlert = function () {
  Beamer.removeClass('.beamer_icon', 'active')
  Beamer.notificationNumber = 0
  Beamer.notificationActive = !1
  Beamer.drawFavicon()
}
Beamer.setPosition = function (a) {
  Beamer.forEachElement(a, function (b) {
    null != beamer_config.right && (b.style.right = beamer_config.right + 'px')
    null != beamer_config.top && (b.style.top = beamer_config.top + 'px')
    null != beamer_config.bottom && (b.style.bottom = beamer_config.bottom + 'px')
    null != beamer_config.left && (b.style.left = beamer_config.left + 'px')
  })
}
Beamer.setColor = function (a, b) {
  Beamer.forEachElement(a, function (c) {
    c.style.backgroundColor = b
  })
}
Beamer.clearAllCookies = function () {
  try {
    for (var a = Beamer.getTopDomain(), b = document.cookie.split(';'), c = 0; c < b.length; c++) {
      var d = b[c].trim()
      if (0 === d.indexOf('_BEAMER')) {
        var e = d.indexOf('='),
          g = (-1 < e ? d.substr(0, e) : d) + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
        a && '' !== a.trim() && (g += ';domain=.' + a)
        document.cookie = g
      }
    }
  } catch (f) {}
}
Beamer.setCookie = function (a, b, c) {
  var d = new Date()
  d.setTime(d.getTime() + 864e5 * c)
  c = 'expires=' + d.toUTCString()
  c = a + '=' + b + ';' + c + ';path=/'
  try {
    var e = Beamer.getTopDomain()
    e && '' !== e.trim() && (c += ';domain=.' + e)
  } catch (g) {}
  document.cookie = c + ';SameSite=None;Secure'
  Beamer.saveInStorage(a, b)
}
Beamer.getCookie = function (a) {
  for (var b = a + '=', c = document.cookie.split(';'), d = null, e = 0; e < c.length; e++) {
    var g = c[e]
    try {
      g = decodeURIComponent(g)
    } catch (k) {}
    for (; ' ' == g.charAt(0); ) g = g.substring(1)
    if (0 == g.indexOf(b))
      if (0 === a.indexOf(_BEAMER_DATE))
        if (((g = g.substring(b.length, g.length)), d)) {
          var f = Beamer.parseDate(g),
            h = Beamer.parseDate(d)
          f && h && f.getTime() > h.getTime() && (d = g)
        } else d = g
      else d = g.substring(b.length, g.length)
  }
  if (null != d) return d
  g = Beamer.getFromStorage(a)
  return void 0 !== g && null !== g ? g : ''
}
Beamer.removeCookie = function (a) {
  Beamer.setCookie(a, '', -1)
  Beamer.removeFromStorage(a)
}
Beamer.getDateCookie = function () {
  return Beamer.getCookie(Beamer.buildDateCookieName(beamer_config.user_id))
}
Beamer.setDateCookie = function (a, b) {
  Beamer.setCookie(Beamer.buildDateCookieName(beamer_config.user_id), a, b)
}
Beamer.buildDateCookieName = function (a) {
  var b = _BEAMER_DATE + '_' + beamer_config.product_id
  'undefined' !== typeof beamer_config.multi_user &&
    beamer_config.multi_user &&
    'undefined' != typeof a &&
    'user_id' != a &&
    (b += '_' + a)
  return b
}
Beamer.updateBoostedAnnouncementDate = function (a, b) {
  'undefined' != typeof beamer_config.user_token &&
  'user_token' != beamer_config.user_token &&
  '' !== beamer_config.user_token
    ? ((a =
        _BEAMER_URL_BACK +
        'updateBoostedDate?product=' +
        beamer_config.product_id +
        '&user_token=' +
        encodeURIComponent(beamer_config.user_token)),
      Beamer.ajax(a))
    : 'undefined' != typeof beamer_config.user_id &&
      'user_id' != beamer_config.user_id &&
      '' !== beamer_config.user_id &&
      ((a =
        _BEAMER_URL_BACK +
        'updateBoostedDate?product=' +
        beamer_config.product_id +
        '&custom_user_id=' +
        encodeURIComponent(beamer_config.user_id)),
      'undefined' != typeof beamer_config.user_token &&
        'user_token' != beamer_config.user_token &&
        '' !== beamer_config.user_token &&
        (a += '&user_token=' + encodeURIComponent(beamer_config.user_token)),
      Beamer.ajax(a))
  Beamer.setBoostedAnnouncementDateCookie(new Date().toISOString(), 300)
}
Beamer.trackViews = function (a, b) {
  a = _BEAMER_URL_BACK + 'track?product=' + beamer_config.product_id + '&id=' + a
  'undefined' !== typeof b && (a += '&code=' + encodeURIComponent(b))
  beamer_config.language
    ? (a += '&language=' + beamer_config.language)
    : (b = window.navigator.userLanguage || window.navigator.language) &&
      1 < b.length &&
      ((b = b.substring(0, 2).toUpperCase()), (a += '&language=' + b))
  'undefined' !== typeof beamer_config.role
    ? (a += '&role=' + encodeURIComponent(beamer_config.role))
    : 'undefined' !== typeof beamer_config.filter && (a += '&role=' + encodeURIComponent(beamer_config.filter))
  ;(b = Beamer.getCookie(_BEAMER_USER_ID + '_' + beamer_config.product_id)) &&
    !_BEAMER_MASSIVE &&
    (a += '&user_id=' + b)
  'undefined' != typeof beamer_config.user_token &&
    'user_token' != beamer_config.user_token &&
    (a += '&user_token=' + encodeURIComponent(beamer_config.user_token))
  'undefined' !== typeof beamer_config.user_id &&
    'user_id' !== beamer_config.user_id &&
    (a += '&custom_user_id=' + encodeURIComponent(beamer_config.user_id))
  'undefined' !== typeof beamer_config.user_lastname &&
    'lastname' !== beamer_config.user_lastname &&
    (a += '&lastname=' + encodeURIComponent(beamer_config.user_lastname))
  'undefined' !== typeof beamer_config.user_firstname &&
    'firstname' !== beamer_config.user_firstname &&
    (a += '&firstname=' + encodeURIComponent(beamer_config.user_firstname))
  'undefined' !== typeof beamer_config.user_email &&
    'email' !== beamer_config.user_email &&
    (a += '&email=' + encodeURIComponent(beamer_config.user_email))
  'undefined' !== typeof navigator.sendBeacon ? navigator.sendBeacon(a) : Beamer.ajax(a, null, null, 'POST')
}
Beamer.getBoostedAnnouncementDateCookie = function () {
  return Beamer.getCookie(Beamer.buildBoostedAnnouncementDateCookieName(beamer_config.user_id))
}
Beamer.setBoostedAnnouncementDateCookie = function (a, b) {
  Beamer.setCookie(Beamer.buildBoostedAnnouncementDateCookieName(beamer_config.user_id), a, b)
}
Beamer.buildBoostedAnnouncementDateCookieName = function (a) {
  var b = _BEAMER_BOOSTED_ANNOUNCEMENT_DATE + '_' + beamer_config.product_id
  'undefined' !== typeof beamer_config.multi_user &&
    beamer_config.multi_user &&
    'undefined' != typeof a &&
    'user_id' != a &&
    (b += '_' + a)
  return b
}
Beamer.getTopDomain = function () {
  return 'undefined' !== typeof Beamer.topDomain ? Beamer.topDomain : document.location.hostname
}
Beamer.parseDate = function (a) {
  try {
    var b = a.split(/\D+/)
    return 7 === b.length
      ? new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]))
      : new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4]))
  } catch (c) {
    try {
      return new Date(a)
    } catch (d) {}
  }
}
Beamer.showPicture = function (a) {
  Beamer.hidePicture()
  var b = document.createElement('div')
  b.id = 'beamerPicture'
  b.className = 'beamer_hideable'
  b.tabindex = '-1'
  var c = document.createElement('div')
  c.className = 'iframeCointaner'
  var d = document.createElement('img')
  d.src = a
  c.appendChild(d)
  b.appendChild(c)
  Beamer.appendHtmlElement(document.body, b)
  Beamer.addClick('beamerPicture', Beamer.hidePicture)
  setTimeout(function () {
    Beamer.addClass('beamerPicture', 'beamer_visible')
    Beamer.focusElement('beamerPicture')
  }, 15)
}
Beamer.hidePicture = function () {
  Beamer.removeClass('beamerPicture', 'beamer_visible')
  Beamer.forEachElement('beamerPicture', function (a) {
    setTimeout(function () {
      try {
        document.body.removeChild(a)
      } catch (b) {}
    }, 5)
  })
  _BEAMER_IS_OPEN && Beamer.sendMessageToIframe('showPanel')
}
Beamer.showElement = function (a) {
  Beamer.forEachElement(a, function (b) {
    b.style.display = 'block'
  })
}
Beamer.hideElement = function (a) {
  Beamer.forEachElement(a, function (b) {
    b.style.display = 'none'
  })
}
Beamer.clearDisplayFromElement = function (a) {
  Beamer.forEachElement(a, function (b) {
    b.style.display = ''
  })
}
Beamer.focusElement = function (a) {
  Beamer.forEachElement(a, function (b) {
    'iframe' === b.tagName.toLowerCase() ? b.contentWindow.focus() : 'undefined' !== typeof b.focus && b.focus()
  })
}
Beamer.ajax = function (a, b, c, d, e) {
  'undefined' === typeof e && (e = 0)
  if ('undefined' === typeof d || '' === d.trim()) d = 'GET'
  if ('POST' === d && 0 < a.indexOf('?')) {
    var g = a.split('?')
    a = g[0]
    g = g[1]
  }
  var f = new XMLHttpRequest()
  f.onreadystatechange = function () {
    var h = 'undefined' !== typeof this && 'undefined' !== typeof this.readyState ? this : f
    if (4 == h.readyState)
      if (200 == h.status) 'undefined' !== typeof b && b && b(h.responseText)
      else if (400 > h.status || 403 < h.status)
        5 > e
          ? setTimeout(
              function () {
                Beamer.ajax(a, b, c, d, e)
              },
              e * (36e4 * Math.random() + 36e4 * (e + 1)),
            )
          : 'undefined' !== typeof c && c && c(h.responseText)
  }
  try {
    f.crossDomain = !0
  } catch (h) {}
  f.open(d, a, !0)
  f.withCredentials = !1
  'POST' === d && g && f.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
  f.send(g)
  e++
}
Beamer.uuidv4 = function () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (a) {
    var b = (16 * Math.random()) | 0
    return ('x' == a ? b : (b & 3) | 8).toString(16)
  })
}
Beamer.isMobile = function () {
  var a = !1,
    b = navigator.userAgent || navigator.vendor || window.opera
  if (
    /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od|ad)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
      b,
    ) ||
    /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
      b.substr(0, 4),
    )
  )
    a = !0
  return a
}
Beamer.isAndroid = function () {
  try {
    return -1 < navigator.userAgent.toLowerCase().indexOf('android')
  } catch (a) {
    return !1
  }
}
Beamer.isWindows = function () {
  try {
    return -1 !== ['Win32', 'Win64', 'Windows', 'WinCE'].indexOf(window.navigator.platform)
  } catch (a) {
    return !1
  }
}
Beamer.isSafari = function () {
  try {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  } catch (a) {
    return !1
  }
}
Beamer.isFirefox = function () {
  try {
    return -1 < navigator.userAgent.toLowerCase().indexOf('firefox')
  } catch (a) {
    return !1
  }
}
Beamer.isIE = function () {
  try {
    var a = window.navigator.userAgent
    return 0 < a.indexOf('MSIE ') || 0 < a.indexOf('Trident/')
  } catch (b) {
    return !1
  }
}
Beamer.isFacebookApp = function () {
  try {
    var a = navigator.userAgent || navigator.vendor || window.opera
    return -1 < a.indexOf('FBAN') || -1 < a.indexOf('FBAV')
  } catch (b) {
    return !1
  }
}
Beamer.isInstagramApp = function () {
  try {
    return -1 < (navigator.userAgent || navigator.vendor || window.opera).indexOf('Instagram')
  } catch (a) {
    return !1
  }
}
Beamer.isInApp = function () {
  return (
    'undefined' !== typeof beamer_config.display &&
    ('in-app' === beamer_config.display || 'compact' === beamer_config.display)
  )
}
Beamer.forEachElement = function (a, b) {
  a = Beamer.findElements(a)
  for (var c = 0; c < a.length; c++) b(a[c])
}
Beamer.findElements = function (a) {
  var b = [],
    c = function (h, k) {
      for (var l = !1, n = 0; n < k.length; n++)
        if (k[n] === h) {
          l = !0
          break
        }
      l || k.push(h)
    }
  if (a) {
    a = a.split(',')
    for (var d = 0; d < a.length; d++) {
      var e = a[d].trim()
      if (e.startsWith('a[')) {
        e = document.querySelectorAll(e)
        for (var g = 0; g < e.length; g++) {
          try {
            var f = e.item(g)
          } catch (h) {
            f = e[g]
          }
          f && c(f, b)
        }
      } else if (0 === e.indexOf('.'))
        for (e = document.getElementsByClassName(e.replace('.', '')), g = 0; g < e.length; g++) {
          try {
            f = e.item(g)
          } catch (h) {
            f = e[g]
          }
          f && c(f, b)
        }
      else (e = document.getElementById(e.replace('#', ''))) && c(e, b)
    }
  }
  return b
}
Beamer.triggerClick = function (a, b, c, d) {
  var e = 'undefined' !== typeof beamer_config.onclick ? beamer_config.onclick : beamer_config.onClick
  if (e && Beamer.isFunction(e)) {
    if (!1 === e(a, b, c)) return !1
    d()
  } else Beamer.defaultOnClick(c, d)
  return !0
}
Beamer.openUrl = function (a, b, c) {
  if (
    !(
      a.trim().toLowerCase().startsWith('javascript') ||
      -1 < a.replace(/\s+/gi, '').toLowerCase().indexOf('javascript:')
    )
  ) {
    var d = document.createElement('a')
    d.href = a
    if ('https:' === d.protocol || 'http:' === d.protocol || 'mailto:' === d.protocol) {
      d = function () {
        b ? window.open(a, '_blank', 'noopener') : (window.location.href = a)
      }
      try {
        navigator.sendBeacon ? Beamer.triggerClick(a, b, c) && d() : Beamer.triggerClick(a, b, c, d)
      } catch (e) {
        d()
      }
    }
  }
}
Beamer.openCta = function (a, b, c, d, e) {
  var g = function () {
      Beamer.openUrl(a, b, c)
    },
    f = '',
    h = Beamer.getCookie(_BEAMER_USER_ID + '_' + beamer_config.product_id)
  'undefined' !== typeof h && '' !== h && (f += '&userId=' + encodeURIComponent(h))
  'undefined' !== typeof beamer_config.user_id && (f += '&customUserId=' + encodeURIComponent(beamer_config.user_id))
  'undefined' !== typeof beamer_config.user_token &&
    (f += '&user_token=' + encodeURIComponent(beamer_config.user_token))
  'undefined' !== typeof beamer_config.user_email && (f += '&email=' + encodeURIComponent(beamer_config.user_email))
  f += '&refUrl=' + encodeURIComponent(window.location.href)
  h =
    _BEAMER_URL +
    'redirectTo?address=' +
    encodeURIComponent(a) +
    '&product=' +
    encodeURIComponent(beamer_config.product_id) +
    '&descriptionId=' +
    d +
    f
  'undefined' !== typeof e && (h += '&origin=' + encodeURIComponent(e))
  'undefined' !== typeof navigator.sendBeacon
    ? (navigator.sendBeacon(h), g())
    : Beamer.ajax(
        h,
        g,
        function () {
          a = _BEAMER_URL + 'redirect?address=' + encodeURIComponent(a) + '&descriptionId=' + d + f
          g()
        },
        'POST',
      )
}
Beamer.defaultOnClick = function (a, b) {
  b && b()
}
Beamer.defaultOnOpen = function () {}
Beamer.defaultOnClose = function () {}
Beamer.bindEscape = function () {
  try {
    Beamer.addEventListener(document, 'keydown', function (a) {
      try {
        27 == ('which' in a ? a.which : a.keyCode) &&
          (0 < Beamer.findElements('beamerPicture').length
            ? Beamer.hidePicture()
            : _BEAMER_IS_OPEN && (Beamer.isEmbedMode() || Beamer.hide()))
      } catch (b) {}
    })
  } catch (a) {}
}
Beamer.isFunction = function (a) {
  return a && '[object Function]' === {}.toString.call(a)
}
Beamer.isElementVisible = function (a) {
  try {
    var b = window.getComputedStyle(a)
    if ('none' === b.display || '0' === b.opacity || 'hidden' === b.visibility) return !1
    var c = a.parentNode
    return c && c !== document.body ? Beamer.isElementVisible(c) : !0
  } catch (d) {
    return !1
  }
}
Beamer.isElementClickable = function (a) {
  a = a.getAttribute('data-beamer-click')
  return 'undefined' === typeof a || null === a || 'true' === a.trim()
}
Beamer.buildStandaloneUrl = function () {
  if ('undefined' !== typeof Beamer.customDomain) {
    var a = Beamer.customDomain
    beamer_config.language && (a += beamer_config.language.toLowerCase() + '/')
    'undefined' != typeof beamer_config.role
      ? (a += '?role=' + encodeURIComponent(beamer_config.role))
      : 'undefined' != typeof beamer_config.filter && (a += '?role=' + encodeURIComponent(beamer_config.filter))
  } else
    ((a = _BEAMER_URL + 'standalone?'),
      (a =
        'undefined' != typeof beamer_config.product_id
          ? a + ('app_id=' + beamer_config.product_id)
          : a + ('id=' + beamer_config.product_id)),
      'undefined' != typeof beamer_config.role
        ? (a += '&role=' + encodeURIComponent(beamer_config.role))
        : 'undefined' != typeof beamer_config.filter && (a += '&role=' + encodeURIComponent(beamer_config.filter)),
      beamer_config.language && (a += '&language=' + beamer_config.language))
  return a
}
Beamer.sendMessageToIframe = function (a, b) {
  Beamer.forEachElement(b ? b : 'beamerNews', function (c) {
    c && c.contentWindow
      ? c.contentWindow.postMessage(a, '*')
      : setTimeout(function () {
          c && c.contentWindow && c.contentWindow.postMessage(a, '*')
        }, 500)
  })
}
Beamer.saveInStorage = function (a, b) {
  try {
    if (window.localStorage) {
      b && 'string' !== typeof b && (b = JSON.stringify(b))
      var c = '_' + beamer_config.product_id
      0 > a.indexOf(c) && (a += c)
      localStorage.setItem(a, b)
    }
  } catch (d) {}
}
Beamer.getFromStorage = function (a) {
  try {
    if (window.localStorage) {
      var b = '_' + beamer_config.product_id
      0 > a.indexOf(b) && (a += b)
      return localStorage.getItem(a)
    }
  } catch (c) {}
}
Beamer.removeFromStorage = function (a) {
  try {
    if (window.localStorage) {
      var b = '_' + beamer_config.product_id
      0 > a.indexOf(b) && (a += b)
      return localStorage.removeItem(a)
    }
  } catch (c) {}
}
Beamer.clearProductStorage = function () {
  Beamer.removeFromStorage(_BEAMER_SELECTOR_COLOR)
  Beamer.removeFromStorage(_BEAMER_HEADER_COLOR)
  Beamer.removeFromStorage('_BEAMER_LAST_ERROR')
  Beamer.removeCookie(_BEAMER_FIRST_VISIT + '_' + beamer_config.product_id)
  Beamer.removeCookie(_BEAMER_USER_ID + '_' + beamer_config.product_id)
  Beamer.removeCookie(_BEAMER_LAST_POST_SHOWN + '_' + beamer_config.product_id)
  Beamer.removeCookie(_BEAMER_SOUND_PLAYED + '_' + beamer_config.product_id)
  Beamer.removeCookie(_BEAMER_LAST_PUSH_PROMPT_INTERACTION + '_' + beamer_config.product_id)
  Beamer.removeCookie(_BEAMER_LAST_UPDATE + '_' + beamer_config.product_id)
  Beamer.removeCookie(_BEAMER_FILTER_BY_URL + '_' + beamer_config.product_id)
  'undefined' !== typeof _BEAMER_NPS_LAST_SHOWN &&
    Beamer.removeCookie(_BEAMER_NPS_LAST_SHOWN + '_' + beamer_config.product_id)
  Beamer.removeCookie(Beamer.buildDateCookieName(beamer_config.user_id))
  Beamer.removeCookie(Beamer.buildBoostedAnnouncementDateCookieName(beamer_config.user_id))
}
Beamer.hasOpenHash = function () {
  if (window.location.hash)
    for (var a = window.location.hash.substr(1).split('&'), b = 0; b < a.length; b++)
      if ('_b' === a[b] || '_b=true' === a[b]) return !0
  return !1
}
Beamer.initDomObserver = function () {
  if (!Beamer.observing && 'MutationObserver' in window)
    try {
      ;((Beamer.domMutated = !1),
        (Beamer.domObserver = new MutationObserver(function () {
          Beamer.domMutated = !0
          Beamer.pauseDomObserver()
        })),
        Beamer.startDomObserver(),
        (Beamer.observing = !0),
        (Beamer.domMutationsProcessInterval = setInterval(Beamer.processDomMutations, 2e3)))
    } catch (a) {}
}
Beamer.startDomObserver = function () {
  Beamer.domObserver.observe(document.documentElement, {
    childList: !0,
    subtree: !0,
    attributes: !0,
    attributeFilter: ['class', 'id', 'href'],
  })
}
Beamer.pauseDomObserver = function () {
  Beamer.domObserver.disconnect()
}
Beamer.stopDomObserver = function () {
  Beamer.observing &&
    Beamer.domObserver &&
    (Beamer.pauseDomObserver(),
    delete Beamer.domObserver,
    (Beamer.observing = !1),
    'undefined' !== typeof Beamer.domMutationsProcessInterval &&
      (clearInterval(Beamer.domMutationsProcessInterval), delete Beamer.domMutationsProcessInterval))
}
Beamer.processDomMutations = function () {
  try {
    if (Beamer.domMutated) {
      var a = (Beamer.domMutated = !1)
      Beamer.forEachElement(beamer_config.selector, function (b) {
        ;-1 === Beamer.elements.indexOf(b) &&
          ((a = !0), 'undefined' == typeof beamer_config.alert || beamer_config.alert) &&
          (Beamer.addClass(b, 'beamer_beamerSelector'),
          Beamer.isElementClickable(b) && (Beamer.addClick(b, Beamer.toggle), Beamer.removeHref(b)))
        !_BEAMER_IS_OPEN &&
          Beamer.isInApp() &&
          Beamer.isElementVisible(b) &&
          Beamer.forEachElement('beamerNews, beamerLoader', function (c) {
            Beamer.setPopperPosition(c, b)
            Beamer.initPopper(c, b)
          })
      })
      a &&
        ('undefined' == typeof beamer_config.alert ||
          beamer_config.alert ||
          ('undefined' !== typeof beamer_config.counter && beamer_config.counter)) &&
        ('undefined' == typeof beamer_config.counter || beamer_config.counter) &&
        Beamer.drawAlert()
      Beamer.appendFeedbackButtons()
      Beamer.startDomObserver()
    }
  } catch (b) {}
}
Beamer.initUrlObserver = function () {
  if (!Beamer.observingUrl) {
    var a = window.location.href
    Beamer.urlObserverInterval = setInterval(function () {
      window.location.href !== a && ((a = window.location.href), Beamer.updateUrl())
    }, 200)
    Beamer.observingUrl = !0
  }
}
Beamer.stopUrlObserver = function () {
  Beamer.observingUrl &&
    (clearInterval(Beamer.urlObserverInterval), delete Beamer.urlObserverInterval, (Beamer.observingUrl = !1))
}
Beamer.playSound = function () {
  try {
    if (Beamer.enableSoundNotification) {
      var a = Beamer.getDateCookie()
      if (void 0 !== a && null !== a && '' !== a) {
        var b = _BEAMER_SOUND_PLAYED + '_' + beamer_config.product_id,
          c = Beamer.getCookie(b)
        if (void 0 === c || null === c || 'true' != c)
          ('Audio' in window &&
            ('undefined' == typeof Beamer.soundNotification &&
              ((Beamer.soundNotification = new Audio(_BEAMER_URL + 'audio/notification.mp3')),
              (Beamer.soundNotification.volume = 0.2)),
            Beamer.soundNotification.play()['catch'](function (d) {
              try {
                console.log('Sound blocked by browser')
              } catch (e) {}
            })),
            Beamer.setCookie(b, !0, 7))
      }
    }
  } catch (d) {
    try {
      console.log('Sound blocked by browser')
    } catch (e) {}
  }
}
Beamer.appendFaviconScript = function () {
  try {
    Beamer.appendScript('beamerFaviconScript', _BEAMER_STATIC_URL + 'favico.js', function () {
      Beamer.drawFavicon()
    })
  } catch (a) {}
}
Beamer.drawFavicon = function () {
  try {
    if (Beamer.enableFaviconNotification && 'Favico' in window) {
      if ('undefined' == typeof Beamer.favicons) {
        Beamer.favicons = []
        for (var a = document.getElementsByTagName('head')[0].getElementsByTagName('link'), b = 0; b < a.length; b++)
          /(^|\s)icon(\s|$)/i.test(a[b].getAttribute('rel')) &&
            Beamer.favicons.push(new Favico({ animation: 'fade', bgColor: Beamer.notificationColor, element: a[b] }))
      }
      var c = Math.min(Beamer.notificationNumber, 99)
      0 == c && Beamer.notificationActive && (c = 1)
      for (b = 0; b < Beamer.favicons.length; b++) Beamer.favicons[b].badge(c)
    }
  } catch (d) {}
}
Beamer.appendPopperScript = function () {
  try {
    Beamer.appendScript('beamerPopperScript', _BEAMER_STATIC_URL + 'beamerPop.js')
  } catch (a) {}
}
Beamer.initPopper = function (a, b, c) {
  for (var d = 0; d < Beamer.popperElements.length; d++)
    if (Beamer.popperElements[d].element === a && Beamer.popperElements[d].container === b) return
  d =
    !0 === Beamer.enableTooltipAutoFlipControl
      ? {
          placement: 'auto',
          modifiers: {
            flip: { behavior: ['bottom', 'right', 'top', 'left'] },
            offset: { offset: '0,8' },
            preventOverflow: { boundariesElement: 'window' },
          },
        }
      : { placement: 'auto', modifiers: { flip: { padding: 20, boundariesElement: 'viewport' } } }
  'undefined' !== typeof c && c
    ? (d.modifiers.offset = { offset: '0,15' })
    : ((d.modifiers.offset = { offset: '10,10' }),
      (d.modifiers.arrow = { enabled: !1 }),
      (d.modifiers.preventOverflow = { padding: 20, boundariesElement: 'viewport' }))
  'undefined' !== typeof beamer_config.display_position &&
    ('top-right' === beamer_config.display_position
      ? (d.placement = 'top-end')
      : 'right-top' === beamer_config.display_position
        ? (d.placement = 'right-start')
        : 'right' === beamer_config.display_position
          ? (d.placement = 'right')
          : 'right-bottom' === beamer_config.display_position
            ? (d.placement = 'right-end')
            : 'bottom-right' === beamer_config.display_position
              ? (d.placement = 'bottom-end')
              : 'bottom' === beamer_config.display_position
                ? (d.placement = 'bottom')
                : 'bottom-left' === beamer_config.display_position
                  ? (d.placement = 'bottom-start')
                  : 'left-bottom' === beamer_config.display_position
                    ? (d.placement = 'left-end')
                    : 'left' === beamer_config.display_position
                      ? (d.placement = 'left')
                      : 'left-top' === beamer_config.display_position
                        ? (d.placement = 'left-start')
                        : 'top-left' === beamer_config.display_position
                          ? (d.placement = 'top-start')
                          : 'top' === beamer_config.display_position && (d.placement = 'top'),
    ('undefined' !== typeof c && c) || (d.modifiers.preventOverflow.enabled = !1),
    (d.modifiers.flip.enabled = !1))
  d = new Popper(b, a, d)
  ;('undefined' !== typeof c && c) || d.disableEventListeners()
  Beamer.popperElements.push({ element: a, popper: d, container: b })
}
Beamer.updatePopper = function (a) {
  for (var b = 0; b < Beamer.popperElements.length; b++)
    ('undefined' !== typeof a && Beamer.popperElements[b].container !== a) ||
      Beamer.popperElements[b].popper.scheduleUpdate()
}
Beamer.setPopperPosition = function (a, b) {
  try {
    var c = b.getBoundingClientRect(),
      d = (window.pageXOffset || document.documentElement.scrollLeft) - (document.documentElement.clientLeft || 0),
      e = (window.pageYOffset || document.documentElement.scrollTop) - (document.documentElement.clientTop || 0),
      g = a.offsetHeight ? a.offsetHeight : a.clientHeight,
      f = a.offsetWidth ? a.offsetWidth : a.clientWidth,
      h = c.top + e - g / 2,
      k = c.left + d + (b.offsetWidth ? b.offsetWidth : b.clientWidth) / 2
    if ('undefined' !== typeof window.innerWidth) {
      var l = window.innerWidth
      h = h - e + g + 20 >= window.innerHeight ? h - 10 : h + 10
      k = k - d + f + 20 >= l ? k - 10 : k + 10
    }
    a.style.top = Math.max(0, h) + 'px'
    a.style.left = Math.max(0, k) + 'px'
  } catch (n) {}
}
Beamer.showLastPost = function (a) {
  if ('undefined' === typeof Beamer.lastDisplayedPostId || Beamer.lastDisplayedPostId !== a.lastPostId)
    ((Beamer.lastDisplayedPostId = a.lastPostId),
      'undefined' !== typeof a.lastPostBoostedAnnouncementType
        ? 4 === a.lastPostBoostedAnnouncementType
          ? Beamer.showLastPostTitle(
              a.lastPostTitle,
              a.lastPostId,
              a.lastPostCategory,
              a.lastPostCategoryColor,
              a.lastPostRtl,
              a.lastPostLinkUrl,
              a.lastPostOpenLinkInNewWindow,
              a.lastPostBoostedAnnouncementWatermark,
              !0,
              !1,
              a.lastPostBoostedCode,
            )
          : Beamer.showBoostedAnnouncement(a)
        : Beamer.showLastPostTitle(
            a.lastPostTitle,
            a.lastPostId,
            a.lastPostCategory,
            a.lastPostCategoryColor,
            a.lastPostRtl,
          ))
}
Beamer.showBoostedAnnouncement = function (a) {
  Beamer.appendBoostedAnnouncementStyles()
  Beamer.appendBoostedAnnouncementsScript()
  var b = function () {
    'undefined' === typeof Beamer.showAnnouncement ? setTimeout(b, 1500) : Beamer.showAnnouncement(a)
  }
  b()
}
Beamer.showLastPostTitle = function (a, b, c, d, e, g, f, h, k, l, n) {
  function u() {
    var v = setInterval(function () {
      if ('undefined' !== typeof Popper) {
        clearInterval(v)
        var m = new IntersectionObserver(
          function (q, r) {
            q = $jscomp.makeIterator(q)
            for (var p = q.next(); !p.done; p = q.next())
              if (((p = p.value), p.isIntersecting && Beamer.isElementVisible(p.target))) {
                r.disconnect()
                w()
                break
              }
          },
          { threshold: 0 },
        )
        Beamer.forEachElement(beamer_config.selector, function (q) {
          try {
            m.observe(q)
          } catch (r) {
            console.error('Beamer: failed to observe element', q, r)
          }
        })
      }
    }, 100)
  }
  if ('undefined' === typeof k || !k) {
    var t = Beamer.getDateCookie()
    if (void 0 === t || null === t || '' === t) return
    t = Beamer.getCookie(_BEAMER_LAST_POST_SHOWN + '_' + beamer_config.product_id)
    if ('undefined' !== typeof t && t == b) return
  }
  Beamer.appendStyles(!0)
  Beamer.appendPopperScript()
  var w = function () {
    if ('undefined' === typeof Popper) setTimeout(w, 1500)
    else {
      var v = !1
      Beamer.forEachElement(beamer_config.selector, function (p) {
        Beamer.isElementVisible(p) && (v = !0)
      })
      if (v) {
        var m = Beamer.findElements('beamerLastPostTitle')
        m && 0 !== m.length
          ? (m = m[0])
          : (Beamer.appendHtml(document.body, '<div id="beamerLastPostTitle"></div>'),
            (m = Beamer.findElements('beamerLastPostTitle')[0]))
        'undefined' !== typeof e && e
          ? Beamer.addClass('beamerLastPostTitle', 'rtl')
          : Beamer.removeClass('beamerLastPostTitle', 'rtl')
        m.onclick = function (p) {
          ;-1 === p.target.className.indexOf('beamerTitleWatermark') &&
            -1 === p.target.className.indexOf('beamerTitleWatermarkLink') &&
            ('undefined' !== typeof l && l
              ? (Beamer.closeLastPostTitle(p),
                'undefined' !== typeof g ? window.open(g, '_blank', 'noopener,noreferrer') : BeamerPreview.show())
              : 'undefined' !== typeof g && '' !== g.trim()
                ? (Beamer.openCta(g, f, a, b, 'boosted-tooltip'), Beamer.closeLastPostTitle(p))
                : Beamer.show())
        }
        var q = ''
        'undefined' !== typeof c &&
          c &&
          (q = '<span class="beamerCategory" style="background-color:' + d + '">' + Beamer.escapeHtml(c) + '</span>')
        q =
          q +
          '<span class="beamerTitle">' +
          Beamer.escapeHtml(a) +
          '</span><svg class="beamerClose" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path><path d="M0 0h24v24H0z" fill="none"></path></svg><div class="popper__arrow" x-arrow></div>'
        'undefined' !== typeof h &&
          h &&
          '' !== h &&
          (q +=
            '<div class="beamerTitleWatermark"><a class="beamerTitleWatermarkLink" href="' +
            h +
            '" target="_blank">by Beamer</a></div>')
        m.innerHTML = q
        Beamer.forEachElement(beamer_config.selector, function (p) {
          Beamer.isElementVisible(p) && (Beamer.setPopperPosition(m, p), Beamer.initPopper(m, p, !0))
        })
        var r = Beamer.getConfigParameter(beamer_config, 'lastPostBoostedShowOnce')
        setTimeout(function () {
          Beamer.updatePopper()
          Beamer.addClass(m, 'active')
          Beamer.waitLastPostTitleClose()
          Beamer.removeEventListener(m, 'mouseenter', Beamer.clearLastPostTitleClose)
          Beamer.addEventListener(m, 'mouseenter', Beamer.clearLastPostTitleClose)
          Beamer.removeEventListener(m, 'mouseleave', Beamer.waitLastPostTitleClose)
          Beamer.addEventListener(m, 'mouseleave', Beamer.waitLastPostTitleClose)
          Beamer.forEachElement('.beamerClose', function (p) {
            Beamer.addEventListener(p, 'click', function (x) {
              Beamer.closeLastPostTitle(x, 'undefined' === r || !r)
            })
          })
        }, 1e3)
        ;('undefined' !== typeof l && l) ||
          (Beamer.setCookie(_BEAMER_LAST_POST_SHOWN + '_' + beamer_config.product_id, b, 300),
          'undefined' !== typeof k &&
            k &&
            ('undefined' !== r && r && Beamer.updateBoostedAnnouncementDate(), Beamer.trackViews(b, n)))
      }
    }
  }
  if (void 0 !== Beamer.enableHiddenTooltipObserver && !0 === Beamer.enableHiddenTooltipObserver)
    Beamer.onWindowVisible(u)
  else Beamer.onWindowVisible(w)
}
Beamer.closeLastPostTitle = function (a, b) {
  a && a.stopPropagation()
  Beamer.removeClass('beamerLastPostTitle', 'active')
  Beamer.forEachElement('beamerLastPostTitle', function (c) {
    setTimeout(function () {
      'undefined' !== typeof c &&
        c &&
        'undefined' !== typeof c.parentNode &&
        c.parentNode &&
        c.parentNode.removeChild(c)
    }, 500)
  })
  'undefined' !== b && b && Beamer.updateBoostedAnnouncementDate()
}
Beamer.waitLastPostTitleClose = function () {
  Beamer.clearLastPostTitleClose()
  Beamer.lastPostTitleCloseTimeout = setTimeout(function () {
    Beamer.closeLastPostTitle()
    delete Beamer.lastPostTitleCloseTimeout
  }, 2e4)
}
Beamer.clearLastPostTitleClose = function () {
  'undefined' !== typeof Beamer.lastPostTitleCloseTimeout &&
    Beamer.lastPostTitleCloseTimeout &&
    (clearTimeout(Beamer.lastPostTitleCloseTimeout), delete Beamer.lastPostTitleCloseTimeout)
}
Beamer.initVisibilityObserver = function () {
  try {
    if ('undefined' !== typeof document.hidden) {
      var a = 'hidden'
      var b = 'visibilitychange'
    } else
      'undefined' !== typeof document.msHidden
        ? ((a = 'msHidden'), (b = 'msvisibilitychange'))
        : 'undefined' !== typeof document.webkitHidden && ((a = 'webkitHidden'), (b = 'webkitvisibilitychange'))
    Beamer.updateWindowVisibility(0 == document[a])
    Beamer.visibilityObserverInitialized ||
      (Beamer.addEventListener(document, b, function (c) {
        Beamer.updateWindowVisibility(0 == document[a])
      }),
      (Beamer.visibilityObserverInitialized = !0))
  } catch (c) {
    Beamer.updateWindowVisibility(!0)
  }
}
Beamer.updateWindowVisibility = function (a) {
  Beamer.windowVisible = a
  if (Beamer.windowVisible) for (; 0 < Beamer.windowVisibleBinds.length; ) Beamer.windowVisibleBinds.shift()()
}
Beamer.onWindowVisible = function (a) {
  Beamer.windowVisibleBinds.push(a)
  Beamer.initVisibilityObserver()
}
Beamer.mouseEnterHandler = function () {
  Beamer.mouseInIframe = !0
  Beamer.scrollX = window.scrollX
  Beamer.scrollY = window.scrollY
}
Beamer.mouseLeaveHandler = function () {
  Beamer.mouseInIframe = !1
}
Beamer.scrollHandler = function () {
  Beamer.isInApp() && Beamer.mouseInIframe && window.scrollTo(Beamer.scrollX, Beamer.scrollY)
}
Beamer.bindWindowEvents = function () {
  Beamer.addEventListener(window, 'message', function (a) {
    var b =
      'https://app.getbeamer.com' === a.origin ||
      'https://push.getbeamer.com' === a.origin ||
      'https://backend.getbeamer.com' === a.origin
    b || 'undefined' === typeof Beamer.customDomain || (b = 0 === Beamer.customDomain.indexOf(a.origin))
    if (a.data && 'string' === typeof a.data && '{' !== a.data[0] && -1 < a.data.indexOf(':'))
      try {
        var c = a.data.indexOf(':')
        var d = a.data.substring(0, c)
        var e = JSON.parse(a.data.substr(c + 1))
      } catch (g) {
        return
      }
    else d = a.data
    if (
      b ||
      (('requestNotificationsPermission' == d ||
        'removeNotificationsIframe' == d ||
        'refuseNotifications' == d ||
        'openNotificationsPopup' == d) &&
        0 === window.location.href.indexOf(a.origin))
    ) {
      if ('hide' == d) Beamer.hide()
      else if ('hidePreview' == d) BeamerPreview.hide()
      else if ('loaded' == d)
        (Beamer.hideLoader(),
          (a = 'setRefUrl:' + JSON.stringify({ url: window.location.href })),
          Beamer.sendMessageToIframe(a),
          Beamer.sendMessageToIframe(a, 'beamerAnnouncementPopup'))
      else if ('showPicture' == d) Beamer.showPicture(e.url)
      else if ('hidePicture' == d) Beamer.hidePicture()
      else if ('openUrl' == d) Beamer.openUrl(e.url, e.openInNewWindow, e.postTitle)
      else if ('requestNotificationsPermission' == d) Beamer.showNotificationPrompt(1500)
      else if ('removeNotificationsIframe' == d) Beamer.removeNotificationIframe()
      else if ('refuseNotifications' == d) Beamer.refuseNotifications()
      else if ('openNotificationsPopup' == d) Beamer.openNotificationPopup()
      else if ('triggerClick' == d) Beamer.triggerClick(e.url, e.openInNewWindow, e.postTitle)
      else if ('triggerInputFocus' == d) {
        if (beamer_config.onInputFocus && Beamer.isFunction(beamer_config.onInputFocus))
          beamer_config.onInputFocus(e.context, e.title)
      } else if ('triggerInputBlur' == d) {
        if (beamer_config.onInputBlur && Beamer.isFunction(beamer_config.onInputBlur))
          beamer_config.onInputBlur(e.context, e.title)
      } else
        'requestUserData' == d
          ? Beamer.sendUserData(e.id)
          : 'updatesAvailable' == d
            ? ('undefined' !== typeof Beamer.updateTimeout && clearTimeout(Beamer.updateTimeout),
              'undefined' !== typeof e && 'undefined' !== typeof e.immediate && e.immediate
                ? (Beamer.appendAlert(!0), delete Beamer.updateTimeout)
                : (Beamer.updateTimeout = setTimeout(
                    function () {
                      Beamer.appendAlert(!0)
                      delete Beamer.updateTimeout
                    },
                    Math.max(100, Math.ceil(Math.random() * Beamer.updatesMaxDelay)),
                  )))
            : 'prepareAutoRefresh' == d
              ? Beamer.prepareAutoRefresh()
              : 'switchIframe' == d && Beamer.switchIframe(e.url)
      if ('undefined' !== typeof Beamer.windowEventCallbacks && 'undefined' !== typeof Beamer.windowEventCallbacks[d])
        for (a = 0; a < Beamer.windowEventCallbacks[d].length; a++) Beamer.windowEventCallbacks[d][a](e)
    }
  })
}
Beamer.bindWindowEvent = function (a, b) {
  'undefined' === typeof Beamer.windowEventCallbacks && (Beamer.windowEventCallbacks = {})
  'undefined' === typeof Beamer.windowEventCallbacks[a] && (Beamer.windowEventCallbacks[a] = [])
  Beamer.windowEventCallbacks[a].push(b)
}
Beamer.unbindWindowEvent = function (a, b) {
  'undefined' === typeof Beamer.windowEventCallbacks && (Beamer.windowEventCallbacks = {})
  'undefined' === typeof Beamer.windowEventCallbacks[a] && (Beamer.windowEventCallbacks[a] = [])
  b = Beamer.windowEventCallbacks[a].indexOf(b)
  ;-1 < b && Beamer.windowEventCallbacks[a].splice(b)
}
Beamer.appendScript = function (a, b, c) {
  try {
    var d = document.getElementById(a)
    d ||
      ((d = document.createElement('script')),
      (d.id = a),
      (d.type = 'text/javascript'),
      (d.onload = c),
      (d.src = b),
      document.head.appendChild(d))
  } catch (e) {}
}
Beamer.appendCSS = function (a, b) {
  var c = document.getElementById(a)
  c ||
    ((c = document.createElement('link')),
    (c.id = a),
    (c.type = 'text/css'),
    (c.rel = 'stylesheet'),
    (c.href = b),
    document.head.appendChild(c))
}
Beamer.logError = function (a) {
  try {
    var b = 'undefined' !== typeof a.stack ? a.stack : 'undefined' !== typeof a.toString ? a.toString() : a.message
  } catch (e) {
    b = a.message
  }
  a = new Date().getTime()
  var c = Beamer.getFromStorage('_BEAMER_LAST_ERROR')
  try {
    if (
      'undefined' !== typeof c &&
      c &&
      '' !== c &&
      ((c = JSON.parse(c)), 'undefined' !== typeof c.error && c.error == b && 36e5 > a - c.time)
    )
      return
  } catch (e) {}
  var d = 'https://functions.getbeamer.com/log?error=' + encodeURIComponent(b)
  d += '&productId=' + encodeURIComponent(beamer_config.product_id)
  c = Beamer.getCookie(_BEAMER_USER_ID + '_' + beamer_config.product_id)
  'undefined' !== typeof c && '' !== c && (d += '&userId=' + encodeURIComponent(c))
  c = { error: b, time: a }
  Beamer.saveInStorage('_BEAMER_LAST_ERROR', c)
  Beamer.ajax(d, null, null, 'POST')
}
Beamer.sendUserData = function (a) {
  var b = 'updateUserData:' + JSON.stringify(Beamer.buildUserData())
  Beamer.sendMessageToIframe(b, a)
}
Beamer.buildUserData = function () {
  var a = { ref: encodeURIComponent(window.location.href) },
    b = Beamer.getCookie(_BEAMER_USER_ID + '_' + beamer_config.product_id)
  'undefined' !== typeof b && (a.user_id = b)
  'undefined' !== typeof beamer_config.user_id && (a.custom_user_id = beamer_config.user_id)
  'undefined' !== typeof beamer_config.user_email && (a.email = beamer_config.user_email)
  'undefined' !== typeof beamer_config.user_firstname && (a.firstname = beamer_config.user_firstname)
  'undefined' !== typeof beamer_config.user_lastname && (a.lastname = beamer_config.user_lastname)
  'undefined' !== typeof beamer_config.filter && (a.filter = beamer_config.filter)
  'undefined' !== typeof Beamer.config.lastPushUpdateTime && (a.lastPushUpdateTime = Beamer.config.lastPushUpdateTime)
  !0 === Beamer.pushRefused && (a.refuse = !0)
  return a
}
Beamer.shouldShowNPS = function (a, b) {
  var c = window.location.href,
    d = !0
  try {
    if ('undefined' !== typeof a && 0 < a.length) {
      d = !1
      for (var e = 0; e < a.length; e++)
        try {
          var g = new RegExp(a[e].replace(/[-[\]{}()+?.,\\^$|#\s]/g, '\\$&').replace(/\*/g, '.*'))
          if (g.test(c)) {
            d = !0
            break
          }
        } catch (f) {}
      if (!d) return !1
    }
    if ('undefined' !== typeof b && 0 < b.length)
      for (e = 0; e < b.length; e++)
        try {
          if (((g = new RegExp(b[e].replace(/[-[\]{}()+?.,\\^$|#\s]/g, '\\$&').replace(/\*/g, '.*'))), g.test(c)))
            return !1
        } catch (f) {}
  } catch (f) {}
  return d
}
Beamer.forceShowNPS = function (a) {
  Beamer.appendNPSScript()
  var b = function () {
    'undefined' === typeof Beamer.initNPS ? setTimeout(b, 1500) : Beamer.initNPS(null, !0)
  }
  b()
}
Beamer.getConfigParameter = function (a, b) {
  if ('undefined' !== typeof a && 'undefined' !== typeof a[b]) return a[b]
  if ('undefined' !== typeof Beamer.config) return Beamer.config[b]
}
Beamer.escapeHtml = function (a) {
  try {
    return a
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  } catch (b) {
    return a
  }
}
Beamer.checkUrlAllowed = function (a) {
  return new Promise(function (b, c) {
    try {
      for (var d = window.location.href.split(/(?:\/|\.|\?|&)/), e = [], g = 0; g < d.length; g++) {
        var f = d[g]
        '' !== f.trim() && e.push(f)
      }
      d = []
      if ('undefined' !== typeof a.blockedUrls) {
        f = []
        for (g = 0; g < a.blockedUrls.length; g++) f.push(Beamer.matchesUrlParts(e.slice(), a.blockedUrls[g].slice()))
        d.push(
          Promise.all(f).then(function (h) {
            for (var k = 0; k < h.length; k++) if (h[k]) return !1
            return !0
          }),
        )
      }
      if ('undefined' !== typeof a.allowedUrls) {
        f = []
        for (g = 0; g < a.allowedUrls.length; g++) f.push(Beamer.matchesUrlParts(e.slice(), a.allowedUrls[g].slice()))
        d.push(
          Promise.all(f).then(function (h) {
            for (var k = 0; k < h.length; k++) if (h[k]) return !0
            return !1
          }),
        )
      }
      return Promise.all(d).then(function (h) {
        for (var k = 0; k < h.length; k++)
          if (!h[k]) {
            c()
            return
          }
        b()
      })
    } catch (h) {
      return (Beamer.logError(h), Promise.resolve(!1))
    }
  })
}
Beamer.matchesUrlParts = function (a, b, c, d) {
  return new Promise(function (e) {
    if (0 !== b.length || 'undefined' === typeof c || !c || ('undefined' !== typeof d && '*' !== d))
      if (0 < a.length) {
        if ('undefined' === typeof d && ((d = b.shift()), '*' === d)) {
          e(Beamer.matchesUrlParts(a, b, !0))
          return
        }
        e(Beamer.matchesUrlPart(a, b, c, d))
      } else if ('undefined' !== typeof d) e(!1)
      else {
        if (0 < b.length) for (; '*' === b[0]; ) b.shift()
        e(0 === b.length && 0 === a.length)
      }
    else e(!0)
  })
}
Beamer.matchesUrlPart = function (a, b, c, d, e) {
  'undefined' === typeof e && (e = a.shift())
  return Beamer.hash(e).then(function (g) {
    return g !== d
      ? 'undefined' !== typeof c && c && 0 < a.length
        ? Beamer.matchesUrlParts(a, b, !0, d)
        : 0 < b.length && '*' === b[0]
          ? 1 < e.length
            ? Beamer.matchesUrlPart(a, b, c, d, e.slice(0, -1))
            : Beamer.matchesUrlParts(a, b, !0, d)
          : !1
      : Beamer.matchesUrlParts(a, b)
  })
}
Beamer.hash = function (a) {
  return '*' === a
    ? Promise.resolve(a)
    : crypto.subtle.digest('SHA-512', new TextEncoder().encode(a)).then(function (b) {
        return Array.from(new Uint8Array(b))
          .map(function (c) {
            return c.toString(16).padStart(2, '0')
          })
          .join('')
      })
}
Beamer.isEmbedMode = function () {
  return 'undefined' !== typeof beamer_config.embed &&
    beamer_config.embed &&
    'undefined' !== typeof beamer_config.selector &&
    '.beamerTrigger,a[href="#beamerTrigger"]' !== beamer_config.selector &&
    '.beamerTrigger,a[href="#beamerTrigger"], beamerSelector' !== beamer_config.selector
    ? !0
    : !1
}
Beamer.build()
