(() => {
  "use strict";

  const scriptUrl =
    document.currentScript?.src ||
    new URL("./newsletter.js", window.location.href).href;

  const assetBase = new URL("./", scriptUrl);
  const stylesheetUrl = new URL("newsletter.css", assetBase).href;
  const logoUrl = new URL("Stw_Logo.png", assetBase).href;

  function loadStylesheet() {
    const existing = document.querySelector(
      "link[data-stw-newsletter-styles]"
    );

    if (existing?.sheet) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const link = existing || document.createElement("link");
      let settled = false;

      const finish = (callback) => {
        if (settled) return;
        settled = true;
        callback();
      };

      link.addEventListener(
        "load",
        () => finish(resolve),
        { once: true }
      );

      link.addEventListener(
        "error",
        () =>
          finish(() =>
            reject(new Error("Newsletter styles failed to load"))
          ),
        { once: true }
      );

      if (!existing) {
        link.rel = "stylesheet";
        link.href = stylesheetUrl;
        link.dataset.stwNewsletterStyles = "true";
        document.head.appendChild(link);
      }

      window.setTimeout(() => {
        if (link.sheet) {
          finish(resolve);
        } else {
          finish(() =>
            reject(new Error("Newsletter styles timed out"))
          );
        }
      }, 5000);
    });
  }

  function mountNewsletter() {
    const existing = document.getElementById("stwNewsletter");
    if (existing) return existing;

    const holder = document.createElement("div");

    holder.innerHTML = `
      <div
        class="stw-newsletter"
        id="stwNewsletter"
        data-arena-channel="newsletter_html"
        aria-hidden="true"
        hidden
      >
        <div class="stw-newsletter__veil" aria-hidden="true"></div>

        <section
          class="stw-newsletter__dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="stwNewsletterTitle"
          aria-describedby="stwNewsletterDescription"
        >
          <button
            class="stw-newsletter__close"
            type="button"
            aria-label="Close newsletter"
          ></button>

          <img
            class="stw-newsletter__logo"
            src="${logoUrl}"
            alt=""
            aria-hidden="true"
          />

          <figure class="stw-newsletter__photo">
            <img alt="" decoding="async" />
            <figcaption class="stw-newsletter__photo-index">
              image 02 / private record
            </figcaption>
          </figure>

          <div class="stw-newsletter__copy">
            <p class="stw-newsletter__eyebrow">
              newsletter / private correspondence
            </p>

            <h2
              class="stw-newsletter__title"
              id="stwNewsletterTitle"
            >
              letters from<br />the archive
            </h2>

            <p
              class="stw-newsletter__offer"
              id="stwNewsletterDescription"
            >
              early notice of new garments, private offerings,
              and notes from the archive
            </p>

            <form
              class="stw-newsletter__form"
              method="post"
              data-mailchimp-action="https://springtimewishes.us3.list-manage.com/subscribe/post?u=32f106db056071216c335f2ed&amp;id=374a4e895b&amp;f_id=004ec6e5f0"
              novalidate
            >
              <div class="stw-newsletter__form-row">
                <label class="sr" for="stwNewsletterEmail">
                  email address
                </label>

                <input
                  class="stw-newsletter__field"
                  id="stwNewsletterEmail"
                  type="email"
                  name="EMAIL"
                  autocomplete="email"
                  inputmode="email"
                  placeholder="email address"
                  required
                />

                <button
                  class="stw-newsletter__submit"
                  type="submit"
                >
                  receive letters
                </button>
              </div>

              <div
                class="stw-newsletter__honeypot"
                aria-hidden="true"
              >
                <label>
                  leave this field empty
                  <input
                    type="text"
                    name="STW_WEBSITE"
                    tabindex="-1"
                    autocomplete="off"
                  />
                </label>
              </div>

              <p class="stw-newsletter__fineprint">
                occasional correspondence from springtime wishes.
                leave whenever you wish.
              </p>

              <p
                class="stw-newsletter__status"
                role="status"
                aria-live="polite"
              ></p>
            </form>
          </div>
        </section>
      </div>
    `;

    const root = holder.firstElementChild;
    document.body.appendChild(root);

    return root;
  }

  const stylesReady = loadStylesheet();
  const root = mountNewsletter();

  const dialog = root.querySelector(
    ".stw-newsletter__dialog"
  );

  const closeButton = root.querySelector(
    ".stw-newsletter__close"
  );

  const photo = root.querySelector(
    ".stw-newsletter__photo img"
  );

  const form = root.querySelector(
    ".stw-newsletter__form"
  );

  const email = root.querySelector(
    'input[name="EMAIL"]'
  );

  const submit = root.querySelector(
    ".stw-newsletter__submit"
  );

  const status = root.querySelector(
    ".stw-newsletter__status"
  );

  const arenaChannel =
    root.dataset.arenaChannel || "newsletter_html";

  const mailchimpAction =
    (form.dataset.mailchimpAction || "").trim();

  const forcePreview =
    new URLSearchParams(window.location.search).get(
      "newsletter"
    ) === "preview";

  const reducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

  const transitionTime = reducedMotion ? 20 : 1700;
  const openDelay = reducedMotion ? 250 : 1450;

  const storageKey = "stw-newsletter-state-v1";
  const closedFor = 7 * 24 * 60 * 60 * 1000;
  const subscribedFor = 365 * 24 * 60 * 60 * 1000;

  let previousFocus = null;
  let closeTimer = 0;
  let focusTimer = 0;
  let submitTimer = 0;
  let opened = false;

  const safeStorage = {
    get() {
      try {
        return JSON.parse(
          window.localStorage.getItem(storageKey) || "null"
        );
      } catch (_) {
        return null;
      }
    },

    set(type) {
      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({
            type,
            at: Date.now(),
          })
        );
      } catch (_) {
        /* El anuncio funciona aunque localStorage no esté disponible. */
      }
    },
  };

  function mayOpen() {
    if (forcePreview) return true;

    const state = safeStorage.get();

    if (!state || !state.at) return true;

    const age = Date.now() - state.at;

    return state.type === "subscribed"
      ? age > subscribedFor
      : age > closedFor;
  }

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  }

  function openNewsletter() {
    if (opened || !mayOpen()) return;

    opened = true;
    previousFocus = document.activeElement;

    root.hidden = false;
    root.setAttribute("aria-hidden", "false");

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        root.classList.add("is-open");
      });
    });

    if (
      window.matchMedia(
        "(hover: hover) and (pointer: fine)"
      ).matches
    ) {
      window.clearTimeout(focusTimer);

      focusTimer = window.setTimeout(() => {
        if (opened) {
          email.focus({ preventScroll: true });
        }
      }, Math.min(900, transitionTime));
    }
  }

  function closeNewsletter({ remember = true } = {}) {
    if (!opened) return;

    if (remember) {
      safeStorage.set("closed");
    }

    opened = false;
    root.classList.remove("is-open");

    window.clearTimeout(focusTimer);
    window.clearTimeout(closeTimer);

    closeTimer = window.setTimeout(() => {
      root.hidden = true;
      root.setAttribute("aria-hidden", "true");

      if (
        previousFocus &&
        typeof previousFocus.focus === "function"
      ) {
        previousFocus.focus({ preventScroll: true });
      }
    }, transitionTime);
  }

  function imageUrlFromBlock(block) {
    return (
      block?.image?.display?.url ||
      block?.image?.large?.url ||
      block?.image?.original?.url ||
      ""
    );
  }

  async function getArenaPhoto(channel) {
    const response = await fetch(
      `https://api.are.na/v2/channels/${encodeURIComponent(
        channel
      )}/contents?per=100`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Are.na request failed: ${response.status}`
      );
    }

    const data = await response.json();

    const block = (data.contents || []).find(
      (item) =>
        item.class === "Image" &&
        imageUrlFromBlock(item)
    );

    if (!block) {
      throw new Error(
        "No image block found in the Are.na channel"
      );
    }

    return imageUrlFromBlock(block);
  }

  function preloadPhoto(url) {
    return new Promise((resolve, reject) => {
      const preload = new Image();

      preload.onload = () => {
        photo.src = url;
        resolve();
      };

      preload.onerror = reject;
      preload.src = url;
    });
  }

  function plainMailchimpMessage(value) {
    const holder = document.createElement("div");
    holder.innerHTML = String(value || "");

    return (holder.textContent || "")
      .replace(/^\d+\s*-\s*/, "")
      .trim();
  }

  function subscribeWithMailchimp() {
    return new Promise((resolve, reject) => {
      if (!mailchimpAction) {
        reject(
          new Error("Mailchimp connection pending")
        );
        return;
      }

      let url;

      try {
        url = new URL(mailchimpAction);
      } catch (_) {
        reject(
          new Error(
            "Mailchimp form address is invalid"
          )
        );
        return;
      }

      url.pathname = url.pathname.replace(
        /\/post\/?$/,
        "/post-json"
      );

      const formData = new FormData(form);

      formData.forEach((value, key) => {
        url.searchParams.set(key, value);
      });

      const userId = url.searchParams.get("u");
      const audienceId = url.searchParams.get("id");

      if (userId && audienceId) {
        url.searchParams.set(
          `b_${userId}_${audienceId}`,
          ""
        );
      }

      const callbackName =
        `stwMailchimp_${Date.now()}_` +
        Math.random().toString(36).slice(2);

      url.searchParams.set("c", callbackName);

      const script = document.createElement("script");
      let settled = false;

      const finish = (error, result) => {
        if (settled) return;

        settled = true;
        window.clearTimeout(submitTimer);
        script.remove();

        try {
          delete window[callbackName];
        } catch (_) {
          window[callbackName] = undefined;
        }

        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      };

      window[callbackName] = (result) => {
        if (result?.result === "success") {
          finish(null, result);
        } else {
          finish(
            new Error(
              plainMailchimpMessage(result?.msg) ||
              "Please check the email address and try again"
            )
          );
        }
      };

      script.onerror = () => {
        finish(
          new Error(
            "The subscription could not be completed. Please try again"
          )
        );
      };

      script.src = url.toString();
      document.body.appendChild(script);

      submitTimer = window.setTimeout(() => {
        finish(
          new Error(
            "The subscription took too long. Please try again"
          )
        );
      }, 12000);
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("");

    if (!email.checkValidity()) {
      email.reportValidity();
      return;
    }

    submit.disabled = true;
    submit.textContent = "entering...";

    try {
      await subscribeWithMailchimp();

      safeStorage.set("subscribed");
      setStatus(
        "your address has entered the archive."
      );

      submit.textContent = "received";

      window.setTimeout(() => {
        closeNewsletter({ remember: false });
      }, 950);
    } catch (error) {
      const pending =
        error?.message ===
        "Mailchimp connection pending";

      setStatus(
        pending
          ? "mailchimp connection pending."
          : error?.message || "please try again.",
        true
      );

      submit.disabled = false;
      submit.textContent = "receive letters";
    }
  }

  function trapFocus(event) {
    if (!opened || event.key !== "Tab") return;

    const focusable = [
      closeButton,
      email,
      submit,
    ].filter((element) => !element.disabled);

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (
      event.shiftKey &&
      document.activeElement === first
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      document.activeElement === last
    ) {
      event.preventDefault();
      first.focus();
    }
  }

  closeButton.addEventListener("click", () => {
    closeNewsletter();
  });

  form.addEventListener("submit", handleSubmit);
  dialog.addEventListener("keydown", trapFocus);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && opened) {
      closeNewsletter();
    }
  });

  root.hidden = true;
  root.setAttribute("aria-hidden", "true");

  if (mayOpen()) {
    Promise.all([
      stylesReady,
      getArenaPhoto(arenaChannel).then(
        preloadPhoto
      ),
    ])
      .then(() => {
        window.setTimeout(
          openNewsletter,
          openDelay
        );
      })
      .catch((error) => {
        console.warn(
          "Springtime Wishes newsletter image failed:",
          error
        );
      });
  }

  window.stwNewsletter = {
    open: openNewsletter,

    close: () =>
      closeNewsletter({ remember: false }),
  };
})();