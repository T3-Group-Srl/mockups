/*
 * Mini-runtime per il mockup Kartshop Viterbo.
 * Legge il template <template id="dc-tpl"> e la classe Component dello
 * script type="text/x-dc", poi renderizza in #dc-root.
 * Supporta: {{segnaposto}}, <sc-for list as>, <sc-if value>, eventi
 * onClick / onChange / onSubmit, setState con nuovo render.
 */
(function () {
  'use strict';

  function DCLogic(props) {
    this.props = props || {};
    this.state = {};
  }
  DCLogic.prototype.setState = function (patch) {
    var p = typeof patch === 'function' ? patch(this.state, this.props) : patch;
    this.state = Object.assign({}, this.state, p);
    render();
  };
  DCLogic.prototype.forceUpdate = function () { render(); };
  window.DCLogic = DCLogic;

  var tpl, comp, root;
  var HOLE = /\{\{([^}]+)\}\}/g;
  var WHOLE = /^\s*\{\{([^}]+)\}\}\s*$/;

  function lookup(scope, path) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, scope);
  }

  function interp(str, scope) {
    return str.replace(HOLE, function (m, p) {
      var v = lookup(scope, p);
      return v == null || v === false ? '' : String(v);
    });
  }

  function holeOf(attrValue) {
    var m = WHOLE.exec(attrValue || '');
    return m ? m[1] : null;
  }

  function renderNode(node, scope, out) {
    if (node.nodeType === 3) {
      out.appendChild(document.createTextNode(interp(node.nodeValue, scope)));
      return;
    }
    if (node.nodeType !== 1) return;
    var tag = node.localName;

    if (tag === 'sc-for') {
      var list = lookup(scope, holeOf(node.getAttribute('list'))) || [];
      var as = node.getAttribute('as');
      list.forEach(function (item, i) {
        var s = Object.create(scope);
        s[as] = item;
        s.$index = i;
        node.childNodes.forEach(function (c) { renderNode(c, s, out); });
      });
      return;
    }
    if (tag === 'sc-if') {
      if (lookup(scope, holeOf(node.getAttribute('value')))) {
        node.childNodes.forEach(function (c) { renderNode(c, scope, out); });
      }
      return;
    }

    var el = document.createElementNS(node.namespaceURI, node.localName);
    Array.prototype.forEach.call(node.attributes, function (a) {
      var name = a.name;
      if (name.indexOf('hint-') === 0) return;
      var h = holeOf(a.value);
      if (name.indexOf('on') === 0 && h) {
        var fn = lookup(scope, h);
        if (typeof fn === 'function') el.addEventListener(name.slice(2), fn);
        return;
      }
      if (name === 'checked' || name === 'disabled' || name === 'selected') {
        var bv = h ? lookup(scope, h) : true;
        if (bv && bv !== 'false') el.setAttribute(name, '');
        el[name] = !!bv && bv !== 'false';
        return;
      }
      if (h) {
        var v = lookup(scope, h);
        if (v == null) return;
        if (v === false && name.indexOf('aria-') !== 0) return;
        el.setAttribute(name, String(v));
        return;
      }
      el.setAttribute(name, interp(a.value, scope));
    });
    var target = node.localName === 'template' ? el.content : el;
    node.childNodes.forEach(function (c) { renderNode(c, scope, target); });
    out.appendChild(el);
  }

  function render() {
    if (!comp) return;
    // conserva i valori dei campi con id (select ordinamento, ricerca, prezzi)
    var keep = {};
    root.querySelectorAll('input[id],select[id],textarea[id]').forEach(function (f) {
      if (f.type !== 'checkbox' && f.type !== 'radio') keep[f.id] = f.value;
    });
    var focusedId = document.activeElement && document.activeElement.id;
    var vals = comp.renderVals();
    var frag = document.createDocumentFragment();
    tpl.content.childNodes.forEach(function (c) { renderNode(c, vals, frag); });
    root.replaceChildren(frag);
    Object.keys(keep).forEach(function (id) {
      var f = document.getElementById(id);
      if (f) f.value = keep[id];
    });
    if (focusedId) {
      var ff = document.getElementById(focusedId);
      if (ff) ff.focus();
    }
  }

  function boot() {
    tpl = document.getElementById('dc-tpl');
    root = document.getElementById('dc-root');
    var src = document.querySelector('script[type="text/x-dc"]');
    var Component = new Function('DCLogic', src.textContent + '\nreturn Component;')(DCLogic);
    comp = new Component({});
    if (!comp.state) comp.state = {};
    render();
    if (typeof comp.componentDidMount === 'function') comp.componentDidMount();
    if (location.hash) {
      var t = document.getElementById(location.hash.slice(1));
      if (t) t.scrollIntoView();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
