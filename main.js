/* ============================================================
   SITE SETTINGS — edit these values, everything updates.
   ============================================================ */
const SITE = {
  // Free form-to-email key from https://web3forms.com (enter your email there, paste the key here).
  // Leave empty and the form will open WhatsApp with the message instead.
  web3formsKey: "",
  // WhatsApp number with country code, digits only, e.g. "919876543210"
  whatsapp: "918291597777",
};

(function () {
  // Mobile menu
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  // Footer year
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  // WhatsApp links
  const waBase = SITE.whatsapp ? "https://wa.me/" + SITE.whatsapp : null;
  document.querySelectorAll("[data-wa]").forEach((a) => {
    if (!waBase) { a.style.display = "none"; return; }
    const msg = a.getAttribute("data-wa") || "Hello AegisXpert, I'd like to know more about your security services.";
    a.href = waBase + "?text=" + encodeURIComponent(msg);
  });

  // Back to top
  const top = document.querySelector(".to-top");
  if (top) {
    window.addEventListener("scroll", () => top.classList.toggle("show", window.scrollY > 600), { passive: true });
    top.addEventListener("click", () => window.scrollTo({ top: 0 }));
  }

  // Reveal on scroll
  const els = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
  } else {
    els.forEach((el) => el.classList.add("in"));
  }

  // Pre-select service from ?service= on contact page
  const params = new URLSearchParams(location.search);
  const svcSelect = document.getElementById("f-service");
  if (svcSelect && params.get("service")) {
    const want = params.get("service").toLowerCase();
    [...svcSelect.options].forEach((o) => { if (o.text.toLowerCase().includes(want)) svcSelect.value = o.value; });
  }

  // Contact form
  const form = document.getElementById("contact-form");
  if (!form) return;
  const status = form.querySelector(".form-status");
  const btn = form.querySelector("button[type=submit]");

  function validate() {
    let ok = true;
    form.querySelectorAll(".field[data-required]").forEach((f) => {
      const input = f.querySelector("input,textarea,select");
      let valid = input.value.trim() !== "";
      if (valid && input.type === "email") valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      if (valid && input.type === "tel") valid = input.value.replace(/\D/g, "").length >= 10;
      f.classList.toggle("invalid", !valid);
      if (!valid) ok = false;
    });
    return ok;
  }
  form.addEventListener("input", (e) => {
    const f = e.target.closest(".field");
    if (f && f.classList.contains("invalid")) validate();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.className = "form-status";
    if (form.querySelector('[name="botcheck"]').checked) return;
    if (!validate()) {
      status.textContent = "Please fill in the highlighted fields.";
      status.className = "form-status fail";
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    delete data.botcheck;

    if (!SITE.web3formsKey) {
      const text = `New enquiry from website\nName: ${data.name}\nCompany: ${data.company || "-"}\nPhone: ${data.phone}\nEmail: ${data.email}\nService: ${data.service}\nCity: ${data.city || "-"}\n\n${data.message}`;
      if (waBase) {
        window.open(waBase + "?text=" + encodeURIComponent(text), "_blank", "noopener");
      } else {
        location.href = "mailto:" + form.dataset.email + "?subject=" + encodeURIComponent("Website enquiry — " + data.name) + "&body=" + encodeURIComponent(text);
      }
      status.textContent = "Thanks! Your enquiry is ready to send — please confirm it in the window that opened.";
      status.className = "form-status ok";
      return;
    }

    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = "Sending…";
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ access_key: SITE.web3formsKey, subject: "New website enquiry — " + data.name, from_name: "AegisXpert Website", ...data }),
      });
      const json = await res.json();
      if (json.success) {
        form.reset();
        status.textContent = "Thank you! We've received your enquiry and will call you back shortly.";
        status.className = "form-status ok";
      } else throw new Error(json.message);
    } catch (err) {
      status.textContent = "Sorry, something went wrong. Please call or email us directly.";
      status.className = "form-status fail";
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  });
})();
