const DEFAULT_BASE_URL = "https://hst-api.wialon.com";
const RESOURCE_DRIVERS_FLAG = 256;
const RESOURCE_BASE_FLAG = 1;
const UNIT_BASE_FLAG = 1;

const translations = {
  en: {
    eyebrow: "Wialon account",
    title: "Drivers",
    subtitle: "Loading the account context from the URL parameters.",
    session: "Session",
    unknownUser: "Unknown user",
    noHost: "No host configured",
    sectionTitle: "Available drivers",
    sectionSubtitle: "Resources with driver records available for the authenticated session.",
    reload: "Reload",
    loading: "Loading drivers from Wialon...",
    noDrivers: "No drivers were found in the accessible resources for this account.",
    missingParams: "Missing Wialon parameters. Open the app with at least sid or authHash, plus baseUrl.",
    source: "Resource",
    unit: "Assigned unit",
    phone: "Phone",
    code: "Code",
    description: "Description",
    driver: "Driver",
    notAssigned: "Not assigned",
    noPhone: "No phone",
    noCode: "No code",
    noDescription: "No description",
    accountUser: "Account user",
    totalDrivers: "drivers loaded",
    authModeSid: "Authenticated via SID",
    authModeHash: "Authenticated via authHash",
    requestError: "The Wialon request failed.",
  },
  es: {
    eyebrow: "Cuenta Wialon",
    title: "Conductores",
    subtitle: "Cargando el contexto de la cuenta desde los parámetros de la URL.",
    session: "Sesion",
    unknownUser: "Usuario desconocido",
    noHost: "Sin host configurado",
    sectionTitle: "Conductores disponibles",
    sectionSubtitle: "Recursos con conductores accesibles para la sesion autenticada.",
    reload: "Recargar",
    loading: "Cargando conductores desde Wialon...",
    noDrivers: "No se encontraron conductores en los recursos accesibles de esta cuenta.",
    missingParams: "Faltan parametros de Wialon. Abre la app con al menos sid o authHash, ademas de baseUrl.",
    source: "Recurso",
    unit: "Unidad asignada",
    phone: "Telefono",
    code: "Codigo",
    description: "Descripcion",
    driver: "Conductor",
    notAssigned: "Sin asignar",
    noPhone: "Sin telefono",
    noCode: "Sin codigo",
    noDescription: "Sin descripcion",
    accountUser: "Usuario de la cuenta",
    totalDrivers: "conductores cargados",
    authModeSid: "Autenticado por SID",
    authModeHash: "Autenticado por authHash",
    requestError: "La peticion a Wialon fallo.",
  },
};

const dom = {
  eyebrow: document.getElementById("eyebrow"),
  title: document.getElementById("title"),
  subtitle: document.getElementById("subtitle"),
  sessionLabel: document.getElementById("session-label"),
  sessionUser: document.getElementById("session-user"),
  sessionHost: document.getElementById("session-host"),
  sectionTitle: document.getElementById("section-title"),
  sectionSubtitle: document.getElementById("section-subtitle"),
  refreshButton: document.getElementById("refresh-button"),
  statusPanel: document.getElementById("status-panel"),
  driversGrid: document.getElementById("drivers-grid"),
  template: document.getElementById("driver-card-template"),
};

const state = {
  locale: "en",
  session: null,
};

function parseSessionParams() {
  const params = new URLSearchParams(window.location.search);
  const lang = (params.get("lang") || "en").toLowerCase().startsWith("es") ? "es" : "en";
  const baseUrl = sanitizeBaseUrl(params.get("baseUrl") || params.get("hostUrl") || DEFAULT_BASE_URL);

  return {
    sid: params.get("sid") || "",
    authHash: params.get("authHash") || "",
    hostUrl: params.get("hostUrl") || "",
    baseUrl,
    user: params.get("user") || "",
    branch: params.get("b") || "",
    version: params.get("v") || "",
    lang,
  };
}

function sanitizeBaseUrl(url) {
  return (url || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function t(key) {
  return translations[state.locale][key] || translations.en[key] || key;
}

function applyStaticCopy() {
  dom.eyebrow.textContent = t("eyebrow");
  dom.title.textContent = t("title");
  dom.subtitle.textContent = t("subtitle");
  dom.sessionLabel.textContent = t("session");
  dom.sectionTitle.textContent = t("sectionTitle");
  dom.sectionSubtitle.textContent = t("sectionSubtitle");
  dom.refreshButton.textContent = t("reload");
}

function showStatus(message, tone = "info") {
  dom.statusPanel.textContent = message;
  dom.statusPanel.className = `status-panel status-panel--${tone} is-visible`;
}

function clearStatus() {
  dom.statusPanel.textContent = "";
  dom.statusPanel.className = "status-panel status-panel--info";
}

function updateSessionSummary(session, authMode) {
  dom.sessionUser.textContent = session.user || t("unknownUser");
  dom.sessionHost.textContent = session.baseUrl || session.hostUrl || t("noHost");
  dom.sessionLabel.textContent = authMode;
}

async function callWialon(baseUrl, sid, svc, params) {
  const url = new URL(`${baseUrl}/wialon/ajax.html`);
  url.searchParams.set("svc", svc);
  url.searchParams.set("params", JSON.stringify(params));

  if (sid) {
    url.searchParams.set("sid", sid);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`${t("requestError")} HTTP ${response.status}`);
  }

  const payload = await response.json();

  if (payload && typeof payload.error !== "undefined") {
    throw new Error(`${t("requestError")} Code ${payload.error}`);
  }

  return payload;
}

async function ensureSession(session) {
  if (session.sid) {
    return {
      ...session,
      sid: session.sid,
      authMode: t("authModeSid"),
    };
  }

  if (!session.authHash) {
    throw new Error(t("missingParams"));
  }

  const authResult = await callWialon(session.baseUrl, "", "core/use_auth_hash", {
    authHash: session.authHash,
  });

  return {
    ...session,
    sid: authResult.eid,
    user: session.user || (authResult.user && authResult.user.nm) || "",
    authMode: t("authModeHash"),
  };
}

async function loadDrivers() {
  state.session = parseSessionParams();
  state.locale = state.session.lang;
  applyStaticCopy();

  if (!state.session.baseUrl || (!state.session.sid && !state.session.authHash)) {
    showStatus(t("missingParams"), "warning");
    dom.driversGrid.innerHTML = "";
    updateSessionSummary(state.session, t("session"));
    return;
  }

  showStatus(t("loading"), "info");
  dom.driversGrid.innerHTML = "";

  try {
    const session = await ensureSession(state.session);
    state.session = session;
    updateSessionSummary(session, session.authMode);

    const [resourcesResponse, unitsResponse] = await Promise.all([
      callWialon(session.baseUrl, session.sid, "core/search_items", {
        spec: {
          itemsType: "avl_resource",
          propName: "drivers",
          propValueMask: "*",
          sortType: "sys_name",
          propType: "propitemname",
        },
        force: 1,
        flags: RESOURCE_BASE_FLAG | RESOURCE_DRIVERS_FLAG,
        from: 0,
        to: 0,
      }),
      callWialon(session.baseUrl, session.sid, "core/search_items", {
        spec: {
          itemsType: "avl_unit",
          propName: "sys_name",
          propValueMask: "*",
          sortType: "sys_name",
        },
        force: 1,
        flags: UNIT_BASE_FLAG,
        from: 0,
        to: 0,
      }),
    ]);

    const unitsById = new Map(
      (unitsResponse.items || []).map((unit) => [String(unit.id), unit.nm || `${unit.id}`]),
    );

    const drivers = flattenDrivers(resourcesResponse.items || [], unitsById);

    renderDrivers(drivers);

    if (!drivers.length) {
      showStatus(t("noDrivers"), "warning");
      return;
    }

    showStatus(`${drivers.length} ${t("totalDrivers")}`, "info");
  } catch (error) {
    showStatus(error.message || t("requestError"), "error");
  }
}

function flattenDrivers(resources, unitsById) {
  return resources.flatMap((resource) => {
    const driversMap = resource.drvrs || {};

    return Object.entries(driversMap).map(([driverId, driver]) => ({
      id: driverId,
      name: driver.n || `${t("driver")} #${driverId}`,
      phone: driver.p || "",
      code: driver.c || "",
      description: driver.ds || "",
      unitId: driver.bu ? String(driver.bu) : "",
      unitName: driver.bu ? unitsById.get(String(driver.bu)) || `${driver.bu}` : "",
      resourceId: resource.id,
      resourceName: resource.nm || `${resource.id}`,
    }));
  });
}

function renderDrivers(drivers) {
  dom.driversGrid.innerHTML = "";

  const fragment = document.createDocumentFragment();

  drivers
    .sort((left, right) => left.name.localeCompare(right.name))
    .forEach((driver) => {
      const node = dom.template.content.cloneNode(true);
      const card = node.querySelector(".driver-card");
      const avatar = node.querySelector(".driver-avatar");
      const name = node.querySelector(".driver-name");
      const meta = node.querySelector(".driver-meta");
      const badges = node.querySelector(".driver-badges");
      const details = node.querySelector(".driver-details");

      avatar.textContent = getInitials(driver.name);
      name.textContent = driver.name;
      meta.textContent = `${t("accountUser")}: ${state.session.user || t("unknownUser")}`;

      badges.appendChild(createBadge(driver.resourceName));
      badges.appendChild(createBadge(driver.unitName || t("notAssigned"), !driver.unitName));

      details.appendChild(createDetailRow(t("source"), driver.resourceName));
      details.appendChild(createDetailRow(t("unit"), driver.unitName || t("notAssigned")));
      details.appendChild(createDetailRow(t("phone"), driver.phone || t("noPhone")));
      details.appendChild(createDetailRow(t("code"), driver.code || t("noCode")));
      details.appendChild(createDetailRow(t("description"), driver.description || t("noDescription")));

      card.dataset.driverId = driver.id;
      fragment.appendChild(node);
    });

  dom.driversGrid.appendChild(fragment);
}

function createBadge(text, muted = false) {
  const badge = document.createElement("span");
  badge.className = `badge${muted ? " badge--muted" : ""}`;
  badge.textContent = text;
  return badge;
}

function createDetailRow(label, value) {
  const wrapper = document.createElement("div");
  const term = document.createElement("dt");
  const description = document.createElement("dd");

  wrapper.className = "detail-row";
  term.textContent = label;
  description.textContent = value;

  wrapper.appendChild(term);
  wrapper.appendChild(description);
  return wrapper;
}

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => (part[0] ? part[0].toUpperCase() : ""))
    .join("") || "DR";
}

dom.refreshButton.addEventListener("click", () => {
  clearStatus();
  loadDrivers();
});

loadDrivers();


