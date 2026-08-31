/* ==========================================================================
   Instituto Lumini — comportamentos de interface.
   Portado do design canvas. Nada aqui é necessário para ler o site:
   sem JS, todo o conteúdo aparece e todos os links funcionam.
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var reduzido = window.matchMedia("(prefers-reduced-motion: reduce)");

  // avisa ao <head> que o arquivo chegou; sem isso ele desfaz a animação em 2,5s
  window.__lumini = true;

  /* ------------------------------------------------------------------ *
   * 1. Feixes de luz — deriva própria + paralaxe suave do ponteiro
   * ------------------------------------------------------------------ */
  function feixes() {
    var els = doc.querySelectorAll(".feixe, .rodape__feixes > div");
    if (!els.length || reduzido.matches) return;
    if (window.matchMedia("(hover: none)").matches) return; // sem ponteiro: poupa bateria

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var cx = 0, cy = 0, raf = 0, ativo = true;

    window.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });

    // pausa fora da aba
    doc.addEventListener("visibilitychange", function () {
      ativo = !doc.hidden;
      if (ativo) raf = requestAnimationFrame(tick); else cancelAnimationFrame(raf);
    });

    function tick(agora) {
      var w = window.innerWidth || 1, h = window.innerHeight || 1;
      var tx = (mx / w - 0.5) * 96, ty = (my / h - 0.5) * 54;
      cx += (tx - cx) * 0.045;
      cy += (ty - cy) * 0.045;
      var t = agora / 1000;
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var d = parseFloat(el.getAttribute("data-depth") || "1");
        var ph = i * 1.9;
        var dx = Math.sin(t * 0.11 + ph) * 22 * d;
        var dy = Math.cos(t * 0.085 + ph * 1.3) * 13 * d;
        el.style.transform = "translate3d(" + (cx * d + dx) + "px," + (cy * d + dy) + "px,0)";
      }
      if (ativo) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------------ *
   * 2. Revelação na rolagem + contadores numéricos
   * ------------------------------------------------------------------ */
  function conta(node) {
    if (node.dataset.contado) return;
    node.dataset.contado = "1";
    var alvo = parseInt(node.dataset.count, 10);
    if (isNaN(alvo)) return;
    if (reduzido.matches) { node.textContent = alvo; return; }
    var dur = 1100, t0 = performance.now();
    (function passo(agora) {
      var p = Math.min(1, (agora - t0) / dur);
      node.textContent = Math.round(alvo * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(passo);
    })(t0);
  }

  function revela() {
    var blocos = doc.querySelectorAll(".revela");
    if (!blocos.length) return;

    if (reduzido.matches || !("IntersectionObserver" in window)) {
      blocos.forEach(function (b) {
        b.setAttribute("data-visivel", "");
        b.querySelectorAll("[data-count]").forEach(conta);
      });
      return;
    }

    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.setAttribute("data-visivel", "");
        e.target.querySelectorAll("[data-count]").forEach(conta);
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

    blocos.forEach(function (b) { io.observe(b); });
  }

  /* ------------------------------------------------------------------ *
   * 3. Menu móvel — foco preso, Esc, rolagem travada
   * ------------------------------------------------------------------ */
  function menu() {
    var botao = doc.querySelector("[data-abre-menu]");
    var painel = doc.querySelector(".menu-movel");
    if (!botao || !painel) return;
    var fecharBtn = painel.querySelector(".menu-movel__fechar");
    var focoAnterior = null;

    var focaveis = function () {
      return painel.querySelectorAll('a[href], button:not([disabled])');
    };

    function abrir() {
      focoAnterior = doc.activeElement;
      painel.setAttribute("data-aberto", "");
      botao.setAttribute("aria-expanded", "true");
      doc.body.setAttribute("data-travado", "");
      (fecharBtn || focaveis()[0]).focus();
    }

    function fechar() {
      painel.removeAttribute("data-aberto");
      botao.setAttribute("aria-expanded", "false");
      doc.body.removeAttribute("data-travado");
      if (focoAnterior) focoAnterior.focus();
    }

    botao.addEventListener("click", abrir);
    if (fecharBtn) fecharBtn.addEventListener("click", fechar);
    painel.addEventListener("click", function (e) {
      if (e.target.closest("a")) fechar();
    });

    doc.addEventListener("keydown", function (e) {
      if (!painel.hasAttribute("data-aberto")) return;
      if (e.key === "Escape") { e.preventDefault(); fechar(); return; }
      if (e.key !== "Tab") return;
      var lista = focaveis();
      if (!lista.length) return;
      var primeiro = lista[0], ultimo = lista[lista.length - 1];
      if (e.shiftKey && doc.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && doc.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    });

    // ao voltar para a largura de desktop, garante estado limpo
    window.matchMedia("(min-width: 1151px)").addEventListener("change", function (e) {
      if (e.matches && painel.hasAttribute("data-aberto")) fechar();
    });
  }

  /* ------------------------------------------------------------------ *
   * 4. Holofote que segue o ponteiro (retrato da fundadora)
   * ------------------------------------------------------------------ */
  function holofote() {
    if (reduzido.matches) return;
    doc.querySelectorAll(".holofote").forEach(function (caixa) {
      var luz = caixa.querySelector(".holofote__luz");
      if (!luz) return;
      caixa.addEventListener("mousemove", function (e) {
        var r = caixa.getBoundingClientRect();
        luz.style.background =
          "radial-gradient(240px 240px at " + (e.clientX - r.left) + "px " + (e.clientY - r.top) + "px," +
          " rgba(255,255,255,0.38) 0%, rgba(201,169,110,0.14) 38%, rgba(255,255,255,0) 68%)";
      }, { passive: true });
    });
  }

  /* ------------------------------------------------------------------ *
   * 5. Mapa — carrega sozinho quando a seção se aproxima da tela.
   *    Automático para quem vê; nada é baixado por quem nunca desce
   *    até ali (o iframe do Google pesa mais que o site inteiro).
   * ------------------------------------------------------------------ */
  function mapa() {
    var caixa = doc.querySelector("[data-mapa]");
    if (!caixa) return;

    function carregar() {
      if (caixa.hasAttribute("data-carregado")) return;
      caixa.setAttribute("data-carregado", "");
      var frame = doc.createElement("iframe");
      frame.src = caixa.getAttribute("data-mapa");
      frame.title = "Mapa com a localização do Instituto Lumini";
      frame.loading = "lazy";
      frame.referrerPolicy = "no-referrer-when-downgrade";
      frame.setAttribute("allowfullscreen", "");
      caixa.innerHTML = "";
      caixa.appendChild(frame);
    }

    if (!("IntersectionObserver" in window)) { carregar(); return; }
    var io = new IntersectionObserver(function (entradas) {
      if (entradas.some(function (e) { return e.isIntersecting; })) { io.disconnect(); carregar(); }
    }, { rootMargin: "500px 0px" });   // começa a carregar antes de aparecer
    io.observe(caixa);
  }

  /* ------------------------------------------------------------------ *
   * 6. Copiar endereço — confirmação no próprio rótulo do botão
   * ------------------------------------------------------------------ */
  function copiarEndereco() {
    var botao = doc.querySelector("[data-copiar-endereco]");
    if (!botao) return;
    var rotulo = botao.querySelector("[data-rotulo]");
    var original = rotulo ? rotulo.textContent : "";

    botao.addEventListener("click", function () {
      var texto = botao.getAttribute("data-copiar-endereco");
      function confirmou() {
        if (!rotulo) return;
        rotulo.textContent = "Endereço copiado";
        setTimeout(function () { rotulo.textContent = original; }, 2200);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(confirmou);
      } else {
        var area = doc.createElement("textarea");
        area.value = texto; area.style.position = "fixed"; area.style.opacity = "0";
        doc.body.appendChild(area); area.select();
        try { doc.execCommand("copy"); confirmou(); } catch (e) {}
        doc.body.removeChild(area);
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * 7. Início
   * ------------------------------------------------------------------ */
  // A classe .js já foi marcada por script inline no <head>.
  // Rede de proteção: se qualquer inicialização falhar, tudo vira visível —
  // um efeito perdido é aceitável, uma página em branco não é.
  function iniciar() {
    try { revela(); } catch (e) {
      doc.querySelectorAll(".revela").forEach(function (b) { b.setAttribute("data-visivel", ""); });
    }
    try { menu(); }     catch (e) {}
    try { holofote(); } catch (e) {}
    try { mapa(); }     catch (e) {}
    try { copiarEndereco(); } catch (e) {}
    try { feixes(); }   catch (e) {}
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
