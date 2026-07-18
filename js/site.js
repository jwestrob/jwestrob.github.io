const PROFILE_URL = "https://scholar.google.com/citations?user=AqcNAskAAAAJ";
const STRUCTURE_URL = "/data/structures/protein-fragment.json";
const GAIA_PAPER_ID = "AqcNAskAAAAJ:-f6ydRqryjwC";
const FEATURED_PAPERS = new Map([
  [
    GAIA_PAPER_ID,
    { rank: 0, label: "Co-first author · Science Advances" },
  ],
  [
    "AqcNAskAAAAJ:aqlVkmm33-oC",
    { rank: 1, label: "Giant proteins preprint" },
  ],
  [
    "AqcNAskAAAAJ:UebtZRa9Y70C",
    { rank: 2, label: "Chloroflexi preprint" },
  ],
]);

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function setupNavigation() {
  const header = $(".site-header");
  const toggle = $(".nav-toggle");
  const nav = $(".site-nav");
  if (!header || !toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const open = header.dataset.open !== "true";
    header.dataset.open = String(open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Close" : "Menu";
  });

  nav.addEventListener("click", () => {
    header.dataset.open = "false";
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "Menu";
  });
}

class StructureViewer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d", { alpha: false });
    this.loading = $("#structure-loading");
    this.status = $("#structure-status");
    this.model = null;
    this.rotationX = -0.12;
    this.rotationY = 0.56;
    this.dragging = false;
    this.dragOrigin = null;
    this.visible = true;
    this.frame = null;
    this.lastFrame = 0;
    this.mobileQuery = matchMedia("(max-width: 700px)");
    this.reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
    this.lowPower =
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
      (navigator.deviceMemory && navigator.deviceMemory <= 4);

    this.bind();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement);
    this.visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        this.visible = entry.isIntersecting;
        this.updateAnimation();
      },
      { threshold: 0.05 },
    );
    this.visibilityObserver.observe(canvas);
    this.load();
  }

  get staticMode() {
    return this.mobileQuery.matches || this.reducedQuery.matches || this.lowPower;
  }

  async load() {
    try {
      const response = await fetch(STRUCTURE_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.model = await response.json();
      this.loading.hidden = true;
      this.resize();
      this.updateStatus();
      this.updateAnimation();
    } catch (error) {
      this.loading.textContent = "Structure unavailable";
      this.drawFallback();
      console.warn("Structure:", error);
    }
  }

  bind() {
    this.canvas.addEventListener("pointerdown", (event) => {
      this.dragging = true;
      this.dragOrigin = {
        x: event.clientX,
        y: event.clientY,
        rx: this.rotationX,
        ry: this.rotationY,
      };
      this.canvas.setPointerCapture(event.pointerId);
    });

    this.canvas.addEventListener("pointermove", (event) => {
      if (!this.dragging || !this.dragOrigin) return;
      this.rotationY =
        this.dragOrigin.ry + (event.clientX - this.dragOrigin.x) * 0.009;
      this.rotationX =
        this.dragOrigin.rx + (event.clientY - this.dragOrigin.y) * 0.009;
      this.draw();
    });

    const finish = (event) => {
      if (!this.dragging) return;
      this.dragging = false;
      this.dragOrigin = null;
      if (this.canvas.hasPointerCapture(event.pointerId)) {
        this.canvas.releasePointerCapture(event.pointerId);
      }
    };
    this.canvas.addEventListener("pointerup", finish);
    this.canvas.addEventListener("pointercancel", finish);

    this.canvas.addEventListener("keydown", (event) => {
      const step = 0.09;
      if (event.key === "ArrowLeft") this.rotationY -= step;
      else if (event.key === "ArrowRight") this.rotationY += step;
      else if (event.key === "ArrowUp") this.rotationX -= step;
      else if (event.key === "ArrowDown") this.rotationX += step;
      else return;
      event.preventDefault();
      this.draw();
    });

    const onMediaChange = (query, callback) => {
      if (query.addEventListener) query.addEventListener("change", callback);
      else query.addListener(callback);
    };
    onMediaChange(this.mobileQuery, () => {
      this.updateStatus();
      this.resize();
      this.updateAnimation();
    });
    onMediaChange(this.reducedQuery, () => {
      this.updateStatus();
      this.updateAnimation();
    });
    document.addEventListener("visibilitychange", () => this.updateAnimation());
  }

  updateStatus() {
    if (!this.status) return;
    this.status.textContent = this.staticMode
      ? "drag to rotate · animation off"
      : "slow rotation · drag to rotate";
  }

  updateAnimation() {
    const shouldAnimate =
      this.model && !this.staticMode && this.visible && !document.hidden;
    if (!shouldAnimate && this.frame) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    } else if (shouldAnimate && !this.frame) {
      this.lastFrame = 0;
      this.frame = requestAnimationFrame((time) => this.animate(time));
    }
    if (this.model) this.draw();
  }

  animate(time) {
    this.frame = null;
    if (this.staticMode || !this.visible || document.hidden || !this.model) {
      return;
    }
    if (time - this.lastFrame >= 1000 / 18) {
      this.rotationY += 0.0034;
      this.lastFrame = time;
      this.draw();
    }
    this.frame = requestAnimationFrame((nextTime) => this.animate(nextTime));
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = this.staticMode ? 1 : Math.min(window.devicePixelRatio || 1, 1.4);
    const width = Math.max(300, Math.round(rect.width * dpr));
    const height = Math.max(300, Math.round(rect.height * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.draw();
  }

  project(point, width, height) {
    const [x0, y0, z0] = point;
    const cy = Math.cos(this.rotationY);
    const sy = Math.sin(this.rotationY);
    const cx = Math.cos(this.rotationX);
    const sx = Math.sin(this.rotationX);
    const x1 = x0 * cy + z0 * sy;
    const z1 = -x0 * sy + z0 * cy;
    const y1 = y0 * cx - z1 * sx;
    const z2 = y0 * sx + z1 * cx;
    const perspective = 2.8 / (2.8 + z2 * 0.58);
    const scale = Math.min(width, height) * 0.42;
    return [
      width * 0.5 + x1 * scale * perspective,
      height * 0.5 - y1 * scale * perspective,
      z2,
    ];
  }

  draw() {
    if (!this.context || !this.canvas.width || !this.canvas.height) return;
    if (!this.model) {
      this.drawFallback();
      return;
    }

    const context = this.context;
    const width = this.canvas.width;
    const height = this.canvas.height;
    context.fillStyle = "#0b0905";
    context.fillRect(0, 0, width, height);
    this.drawGrid(context, width, height);

    const points = this.model.points;
    const stride = this.staticMode ? 2 : 1;
    let previous = this.project(points[0], width, height);

    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    for (let i = stride; i < points.length; i += stride) {
      const current = this.project(points[i], width, height);
      const depth = Math.max(0, Math.min(1, (current[2] + 1) / 2));
      context.strokeStyle = `rgba(${176 + Math.round(depth * 68)},${
        128 + Math.round(depth * 62)
      },${48 + Math.round(depth * 65)},${0.28 + depth * 0.67})`;
      context.lineWidth = 0.8 + depth * 1.25;
      context.beginPath();
      context.moveTo(previous[0], previous[1]);
      context.lineTo(current[0], current[1]);
      context.stroke();
      previous = current;
    }
    context.restore();
  }

  drawGrid(context, width, height) {
    const spacing = Math.max(42, Math.round(Math.min(width, height) / 8));
    context.save();
    context.strokeStyle = "rgba(205,164,79,0.055)";
    context.lineWidth = 1;
    for (let x = width % spacing; x < width; x += spacing) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = height % spacing; y < height; y += spacing) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    context.restore();
  }

  drawFallback() {
    if (!this.context) return;
    this.context.fillStyle = "#0b0905";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

class PublicationFeed {
  constructor(root) {
    this.root = root;
    this.records = [];
    this.limit = 12;
    this.query = "";
    this.list = $("#paper-list", root);
    this.more = $("#paper-more", root);
    this.bind();
    this.load();
  }

  bind() {
    $("#paper-query", this.root)?.addEventListener("input", (event) => {
      this.query = event.target.value.trim().toLocaleLowerCase();
      this.limit = 12;
      this.render();
    });
    this.more?.addEventListener("click", () => {
      this.limit = Number.POSITIVE_INFINITY;
      this.render();
    });
  }

  async load() {
    try {
      const response = await fetch("/data/scholar.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      this.records = data.publications || [];
      this.render();
    } catch (error) {
      this.list.replaceChildren(this.errorElement());
      this.more.hidden = true;
      console.warn("Papers:", error);
    }
  }

  filteredRecords() {
    return this.records
      .filter((record) => {
        if (!this.query) return true;
        return [record.title, record.authors, record.venue, record.year]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase()
          .includes(this.query);
      })
      .sort(
        (a, b) =>
          (FEATURED_PAPERS.get(a.id)?.rank ?? Number.POSITIVE_INFINITY) -
            (FEATURED_PAPERS.get(b.id)?.rank ?? Number.POSITIVE_INFINITY) ||
          (b.year || 0) - (a.year || 0) ||
          (b.citations || 0) - (a.citations || 0) ||
          a.title.localeCompare(b.title),
      );
  }

  render() {
    const filtered = this.filteredRecords();
    const shown = filtered.slice(0, this.limit);
    this.list.replaceChildren(...shown.map((record) => this.paperElement(record)));

    this.more.hidden = shown.length >= filtered.length;
    if (!this.more.hidden) {
      this.more.textContent = "Show all papers";
    }
    if (!filtered.length) {
      const empty = document.createElement("p");
      empty.className = "noscript-note";
      empty.textContent = "Try another search.";
      this.list.append(empty);
    }
  }

  paperElement(record) {
    const article = document.createElement("article");
    article.className = "paper";
    const featured = FEATURED_PAPERS.get(record.id);
    if (featured) article.classList.add("paper-featured");

    const year = document.createElement("div");
    year.className = "paper-year";
    year.textContent = record.year || "—";

    const copy = document.createElement("div");
    if (featured) {
      const contribution = document.createElement("p");
      contribution.className = "paper-contribution";
      contribution.textContent = featured.label;
      copy.append(contribution);
    }
    const title = document.createElement("a");
    title.className = "paper-title";
    title.href = record.scholarUrl || PROFILE_URL;
    title.target = "_blank";
    title.rel = "noopener";
    title.textContent = record.title;
    copy.append(title);

    if (record.authors) {
      const authors = document.createElement("p");
      authors.className = "paper-authors";
      this.appendAuthors(authors, record.authors, record.id);
      copy.append(authors);
      if (record.id === GAIA_PAPER_ID) {
        const equalContribution = document.createElement("p");
        equalContribution.className = "paper-equal-contribution";
        const marker = document.createElement("sup");
        marker.textContent = "*";
        equalContribution.append(marker, " Equal contribution");
        copy.append(equalContribution);
      }
    }
    if (record.venue) {
      const venue = document.createElement("p");
      venue.className = "paper-venue";
      venue.textContent = record.venue;
      copy.append(venue);
    }

    const cites =
      record.citations > 0 && record.citedByUrl
        ? document.createElement("a")
        : document.createElement("span");
    cites.className = "paper-cites";
    cites.textContent = record.citations
      ? `${record.citations} citations`
      : "0 citations";
    if (cites.tagName === "A") {
      cites.href = record.citedByUrl;
      cites.target = "_blank";
      cites.rel = "noopener";
    }

    article.append(year, copy, cites);
    return article;
  }

  appendAuthors(element, authorText, recordId) {
    const isGaia = recordId === GAIA_PAPER_ID;
    const namePattern = isGaia
      ? /\b(?:N Jha|J Kravitz|(?:JA|J)\s+West-Roberts)\b/g
      : /\b(?:JA|J)\s+West-Roberts\b/g;
    let cursor = 0;
    let jacobFound = false;
    for (const match of authorText.matchAll(namePattern)) {
      element.append(authorText.slice(cursor, match.index));
      const isJacob = /^(?:JA|J)\s+West-Roberts$/.test(match[0]);
      jacobFound ||= isJacob;
      if (isJacob) {
        const name = document.createElement("strong");
        name.textContent = match[0];
        element.append(name);
      } else {
        element.append(match[0]);
      }
      if (isGaia) {
        const marker = document.createElement("sup");
        marker.className = "equal-contribution-marker";
        marker.setAttribute("aria-hidden", "true");
        marker.textContent = "*";
        element.append(marker);
      }
      cursor = match.index + match[0].length;
    }
    element.append(authorText.slice(cursor));
    if (!jacobFound) {
      element.append(" · ");
      const name = document.createElement("strong");
      name.textContent = "Jacob West-Roberts";
      element.append(name);
    }
  }

  errorElement() {
    const paragraph = document.createElement("p");
    paragraph.className = "noscript-note";
    paragraph.append("See ");
    const link = document.createElement("a");
    link.href = PROFILE_URL;
    link.textContent = "Google Scholar";
    paragraph.append(link);
    paragraph.append(" for the publication list.");
    return paragraph;
  }
}

function setupContactForm() {
  const form = $("#contact-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();
    if (!name || !email || !message) {
      $("#form-status").textContent = "Please fill out all three fields.";
      return;
    }
    const subject = encodeURIComponent(`Website note from ${name}`);
    const body = encodeURIComponent(`${message}\n\nFrom: ${name}\nEmail: ${email}`);
    $("#form-status").textContent = "Opening your email app…";
    window.location.href =
      `mailto:jacobwestroberts@gmail.com?subject=${subject}&body=${body}`;
  });
}

setupNavigation();
if ($("#structure-canvas")) new StructureViewer($("#structure-canvas"));
if ($("#papers-page")) new PublicationFeed($("#papers-page"));
setupContactForm();
$("#current-year").textContent = String(new Date().getFullYear());
