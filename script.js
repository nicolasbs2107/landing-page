/* =============================================================
   COMANDAÍ — LANDING PAGE (JavaScript puro, sem bibliotecas)
   ============================================================= */

/* -------------------------------------------------------------
   CONFIGURAÇÃO — ALTERE AQUI
   ------------------------------------------------------------- */

// WHATSAPP — ALTERAR: seu link do WhatsApp. TODOS os CTAs usam esta variável.
// Formato: "https://wa.me/5511999999999" (55 + DDD + número, somente números)
const WHATSAPP_URL = "COLOCAR_LINK_AQUI";

// Mensagem inicial enviada ao abrir a conversa
const WHATSAPP_MESSAGE =
  "Olá, Nicolas! Vi a Comandaí e gostaria de conhecer melhor o sistema para o meu estabelecimento.";

// META PIXEL: o ID fica no <head> do index.html (window.META_PIXEL_ID).

/* -------------------------------------------------------------
   UTM — captura de utm_source, utm_medium, utm_campaign, utm_content
   Ficam em window.LANDING_UTM e no sessionStorage para futura análise.
   ------------------------------------------------------------- */
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];

function captureUTM() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = {};
  UTM_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) fromUrl[key] = value;
  });

  let stored = {};
  try {
    stored = JSON.parse(sessionStorage.getItem("comandai_utm") || "{}");
  } catch (e) {
    stored = {};
  }

  // A URL atual tem prioridade; se não houver UTMs nela, mantém as da sessão.
  const utm = Object.keys(fromUrl).length ? fromUrl : stored;

  try {
    sessionStorage.setItem("comandai_utm", JSON.stringify(utm));
  } catch (e) {
    /* navegação privada ou armazenamento bloqueado: segue sem salvar */
  }

  window.LANDING_UTM = utm;
  return utm;
}

/* -------------------------------------------------------------
   WHATSAPP + META PIXEL
   Todos os botões com a classe .whatsapp-lead recebem o link.
   O atributo data-source identifica qual botão foi clicado.
   ------------------------------------------------------------- */
function buildWhatsAppLink() {
  const base = (WHATSAPP_URL || "").trim();
  if (!/^https?:\/\//i.test(base)) return null;
  const separator = base.includes("?") ? "&" : "?";
  return base + separator + "text=" + encodeURIComponent(WHATSAPP_MESSAGE);
}

function trackWhatsAppClick(source) {
  // Qualquer falha do Pixel é ignorada: o WhatsApp abre de qualquer forma.
  try {
    if (typeof fbq === "function") {
      fbq("track", "Lead");
      fbq("trackCustom", "WhatsAppClick", {
        source: source
      });
    }
  } catch (e) {
    /* ignora erros do Pixel */
  }

  // GOOGLE ANALYTICS (FUTURO): quando instalar o GA4, descomente:
  // try {
  //   if (typeof gtag === "function") {
  //     gtag("event", "generate_lead", { method: "whatsapp", source: source, ...window.LANDING_UTM });
  //   }
  // } catch (e) {}
}

function setupWhatsApp() {
  const link = buildWhatsAppLink();

  if (!link) {
    console.warn("[Comandaí] Defina WHATSAPP_URL no script.js (ex.: https://wa.me/5511999999999).");
  }

  document.querySelectorAll(".whatsapp-lead").forEach((btn) => {
    if (link) {
      btn.setAttribute("href", link);
      btn.setAttribute("target", "_blank");
      btn.setAttribute("rel", "noopener noreferrer");
    }

    btn.addEventListener("click", (event) => {
      if (!link) {
        event.preventDefault();
        console.warn("[Comandaí] WhatsApp ainda não configurado.");
        return;
      }
      const source = btn.dataset.source || "cta";
      trackWhatsAppClick(source);
      // Não bloqueia a navegação: o link abre normalmente em nova aba.
    });
  });
}

/* -------------------------------------------------------------
   HEADER com fundo ao rolar + botão flutuante do WhatsApp
   ------------------------------------------------------------- */
function setupScrollUI() {
  const header = document.querySelector(".site-header");
  const floatBtn = document.querySelector(".wa-float");
  let ticking = false;

  const update = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", y > 10);
    if (floatBtn) floatBtn.classList.toggle("is-visible", y > 420);
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );
  update();
}

/* -------------------------------------------------------------
   ANIMAÇÕES DISCRETAS — IntersectionObserver
   Desativadas para quem usa prefers-reduced-motion.
   ------------------------------------------------------------- */
function setupReveal() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return;

  const items = document.querySelectorAll(".reveal");
  document.documentElement.classList.add("js-anim");

  // Pequeno atraso em cascata entre itens irmãos
  items.forEach((el) => {
    const siblings = Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal"));
    const i = siblings.indexOf(el);
    if (i > 0) el.style.setProperty("--d", Math.min(i * 70, 280) + "ms");
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.1 }
  );

  items.forEach((el) => observer.observe(el));
}

/* -------------------------------------------------------------
   INICIALIZAÇÃO
   ------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  captureUTM();
  setupWhatsApp();
  setupScrollUI();
  setupReveal();

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
});
