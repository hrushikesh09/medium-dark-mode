(function () {
  var BG_DARK = '#202124';
  var SEPARATOR = '#3a3b3d';
  var ICON_LIGHT = '#c9c9c9';
  var HIGHLIGHT = '#4c4d4c';
  var SIDES = ['Top', 'Right', 'Bottom', 'Left'];
  var ICON_TAGS = { svg: 1, path: 1, circle: 1, rect: 1, line: 1, polygon: 1, polyline: 1, use: 1, ellipse: 1 };

  function parseColor(str) {
    var m = str && str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  }

  function isWhite(c) {
    return !!c && c.a > 0.5 && c.r > 235 && c.g > 235 && c.b > 235;
  }

  function isBlackish(c) {
    return !!c && c.a > 0.5 && c.r < 60 && c.g < 60 && c.b < 60;
  }

  function hasMaskImage(cs) {
    var m = cs.maskImage || cs.webkitMaskImage;
    return !!m && m !== 'none';
  }

  function fixBackground(el, cs) {
    var bg = parseColor(cs.backgroundColor);
    if (isWhite(bg)) {
      el.style.setProperty('background-color', BG_DARK, 'important');
      return;
    }
    // Icons drawn via `background-color` clipped by a `mask-image` (instead
    // of a colored <svg>) use background-color as the icon's "ink" color, so
    // a near-black one needs lightening rather than darkening.
    if (hasMaskImage(cs) && isBlackish(bg)) {
      el.style.setProperty('background-color', ICON_LIGHT, 'important');
    }
  }

  function fixBorders(el, cs) {
    for (var i = 0; i < SIDES.length; i++) {
      var side = SIDES[i];
      var width = parseFloat(cs['border' + side + 'Width']);
      var style = cs['border' + side + 'Style'];
      if (!width || style === 'none') continue;
      var color = parseColor(cs['border' + side + 'Color']);
      if (isWhite(color)) {
        el.style.setProperty('border-' + side.toLowerCase() + '-color', SEPARATOR, 'important');
      }
    }
  }

  function fixIcon(el, cs) {
    if (!ICON_TAGS[el.tagName.toLowerCase()]) return;
    var fill = parseColor(cs.fill);
    if (isBlackish(fill)) {
      el.style.setProperty('fill', ICON_LIGHT, 'important');
    }
    var stroke = parseColor(cs.stroke);
    if (isBlackish(stroke)) {
      el.style.setProperty('stroke', ICON_LIGHT, 'important');
    }
  }

  function fixElement(el) {
    if (el.nodeType !== 1) return;
    var cs = getComputedStyle(el);
    fixBackground(el, cs);
    fixBorders(el, cs);
    fixIcon(el, cs);
  }

  function scan(root) {
    fixElement(root);
    var all = root.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) fixElement(all[i]);
  }

  scan(document.documentElement);

  var observer = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      if (m.type === 'attributes') {
        fixElement(m.target);
      } else {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) scan(node);
        });
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
  });

  // Hover/selected states (e.g. topic pills) turn white only while active,
  // via whichever nested element actually renders the pill's visible
  // surface -- not necessarily the <button>/<a> being hovered. Walk up from
  // the real hover target and recolor whichever ancestor is actually white.
  var hoverFixedEl = null;

  function findWhiteAncestor(el) {
    var depth = 0;
    while (el && depth < 6) {
      if (isWhite(parseColor(getComputedStyle(el).backgroundColor))) return el;
      el = el.parentElement;
      depth++;
    }
    return null;
  }

  document.addEventListener('pointerover', function (e) {
    var start = e.target;
    setTimeout(function () {
      var target = findWhiteAncestor(start);
      if (target) {
        target.style.setProperty('background-color', HIGHLIGHT, 'important');
        hoverFixedEl = target;
      }
    }, 0);
  }, true);

  document.addEventListener('pointerout', function () {
    if (hoverFixedEl) {
      hoverFixedEl.style.removeProperty('background-color');
      hoverFixedEl = null;
    }
  }, true);
})();
