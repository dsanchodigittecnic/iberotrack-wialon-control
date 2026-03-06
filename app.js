const DEFAULT_BASE_URL = "https://hst-api.wialon.com";
const RESOURCE_DRIVERS_FLAG = 256;
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
    missingParams: "Missing Wialon parameters. Use a fresh authHash and optionally baseUrl.",
    authHashRequired: "This published app uses the official Wialon SDK and requires a fresh authHash. SID alone is not enough here.",
    sdkMissing: "The Wialon SDK did not load.",
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
    expiredAuthHash: "The authHash is invalid or expired. Generate a new one and open the app again within 2 minutes.",
    invalidSid: "The SID is invalid or expired.",
  },
  es: {
    eyebrow: "Cuenta Wialon",
    title: "Conductores",
    subtitle: "Cargando el contexto de la cuenta desde los parametros de la URL.",
    session: "Sesion",
    unknownUser: "Usuario desconocido",
    noHost: "Sin host configurado",
    sectionTitle: "Conductores disponibles",
    sectionSubtitle: "Recursos con conductores accesibles para la sesion autenticada.",
    reload: "Recargar",
    loading: "Cargando conductores desde Wialon...",
    noDrivers: "No se encontraron conductores en los recursos accesibles de esta cuenta.",
    missingParams: "Faltan parametros de Wialon. Usa un authHash reciente y opcionalmente baseUrl.",
    authHashRequired: "Esta app publicada usa el SDK oficial de Wialon y necesita un authHash reciente. Solo con SID no basta aqui.",
    sdkMissing: "No se pudo cargar el SDK de Wialon.",
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
    expiredAuthHash: "El authHash no es valido o ya caduco. Genera uno nuevo y abre la app otra vez dentro de 2 minutos.",
    invalidSid: "El SID no es valido o ya caduco.",
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
  const baseUrl = sanitizeBaseUrl(params.get("baseUrl") || DEFAULT_BASE_URL);

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

function requireSdk() {
  if (!window.wialon || !window.wialon.core || !window.wialon.core.Session) {
    throw new Error(t("sdkMissing"));
  }
}

function loginWithAuthHash(baseUrl, authHash) {
  return new Promise((resolve, reject) => {
    const session = wialon.core.Session.getInstance();
    session.initSession(baseUrl);
    session.loginAuthHash(authHash, (code) => {
      if (code) {
        reject(new Error(resolveWialonError(code)));
        return;
      }

      const user = session.getCurrUser();
      resolve({ session, user });
    });
  });
}

function getActiveSessionUserName(session) {
  const currentUser = session.getCurrUser ? session.getCurrUser() : null;
  return currentUser && currentUser.getName ? currentUser.getName() : "";
}

function hasActiveSession(session) {
  return Boolean(session && session.getId && session.getId());
}

function updateDataFlags(session, specs) {
  return new Promise((resolve, reject) => {
    session.updateDataFlags(specs, (code) => {
      if (code) {
        reject(new Error(resolveWialonError(code)));
        return;
      }
      resolve();
    });
  });
}

function remoteCall(svc, params) {
  return new Promise((resolve, reject) => {
    wialon.core.Remote.getInstance().remoteCall(svc, params, (code, data) => {
      if (code) {
        reject(new Error(resolveWialonError(code)));
        return;
      }
      resolve(data);
    });
  });
}

async function callWialonBySid(baseUrl, sid, svc, params) {
  const url = new URL(`${baseUrl}/wialon/ajax.html`);
  url.searchParams.set("svc", svc);
  url.searchParams.set("params", JSON.stringify(params));
  url.searchParams.set("sid", sid);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`${t("requestError")} HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (payload && typeof payload.error !== "undefined") {
    if (payload.error === 1 || payload.error === 1003) {
      throw new Error(t("invalidSid"));
    }
    throw new Error(`${t("requestError")} Code ${payload.error}`);
  }

  return payload;
}

function resolveWialonError(code) {
  const sdkText = window.wialon && wialon.core && wialon.core.Errors
    ? wialon.core.Errors.getErrorText(code)
    : "";

  if (sdkText && /invalid user name or password/i.test(sdkText)) {
    return t("expiredAuthHash");
  }

  if (code === 1 || code === 4 || code === 5 || code === 1003) {
    return t("expiredAuthHash");
  }

  return sdkText || `${t("requestError")} Code ${code}`;
}

async function authenticate(sessionParams) {
  const session = wialon.core.Session.getInstance();

  // Reuse active SDK session to avoid reusing authHash on manual reloads.
  if (hasActiveSession(session)) {
    return {
      sdkSession: session,
      userName: sessionParams.user || getActiveSessionUserName(session) || "",
      authMode: t("authModeHash"),
    };
  }

  if (sessionParams.sid) {
    return {
      sid: sessionParams.sid,
      userName: sessionParams.user || "",
      authMode: t("authModeSid"),
      transport: "sid",
    };
  }

  if (!sessionParams.authHash) {
    throw new Error(t("missingParams"));
  }

  const { session: loggedSession, user } = await loginWithAuthHash(sessionParams.baseUrl, sessionParams.authHash);

  return {
    sdkSession: loggedSession,
    userName: sessionParams.user || (user && user.getName ? user.getName() : "") || "",
    authMode: t("authModeHash"),
    transport: "sdk",
  };
}

async function loadDrivers() {
  state.session = parseSessionParams();
  state.locale = state.session.lang;
  applyStaticCopy();
  dom.driversGrid.innerHTML = "";

  try {
    requireSdk();
  } catch (error) {
    showStatus(error.message, "error");
    updateSessionSummary(state.session, t("session"));
    return;
  }

  if (!state.session.authHash && !state.session.sid) {
    showStatus(t("missingParams"), "warning");
    updateSessionSummary(state.session, t("session"));
    return;
  }

  showStatus(t("loading"), "info");

  try {
    const auth = await authenticate(state.session);
    state.session.user = auth.userName;
    updateSessionSummary({ ...state.session, user: auth.userName }, auth.authMode);
    let resourcesResponse;
    let unitsById = new Map();

    if (auth.transport === "sid") {
      const [resourcesRaw, unitsRaw] = await Promise.all([
        callWialonBySid(state.session.baseUrl, auth.sid, "core/search_items", {
          spec: {
            itemsType: "avl_resource",
            propName: "drivers",
            propValueMask: "*",
            sortType: "sys_name",
            propType: "propitemname",
          },
          force: 1,
          flags: RESOURCE_DRIVERS_FLAG | 1,
          from: 0,
          to: 0,
        }),
        callWialonBySid(state.session.baseUrl, auth.sid, "core/search_items", {
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

      resourcesResponse = resourcesRaw;
      unitsById = new Map((unitsRaw.items || []).map((unit) => [String(unit.id), unit.nm || `${unit.id}`]));
    } else {
      const session = auth.sdkSession;
      session.loadLibrary("resourceDrivers");

      await updateDataFlags(session, [
        {
          type: "type",
          data: "avl_unit",
          flags: UNIT_BASE_FLAG,
          mode: 0,
        },
        {
          type: "type",
          data: "avl_resource",
          flags: wialon.util.Number.or(
            wialon.item.Item.dataFlag.base,
            wialon.item.Resource.dataFlag.drivers,
          ),
          mode: 0,
        },
      ]);

      const [resourcesSdk, units] = await Promise.all([
        remoteCall("core/search_items", {
          spec: {
            itemsType: "avl_resource",
            propName: "drivers",
            propValueMask: "*",
            sortType: "sys_name",
            propType: "propitemname",
          },
          force: 1,
          flags: RESOURCE_DRIVERS_FLAG | 1,
          from: 0,
          to: 0,
        }),
        Promise.resolve(session.getItems("avl_unit") || []),
      ]);

      resourcesResponse = resourcesSdk;
      unitsById = new Map(units.map((unit) => [String(unit.getId()), unit.getName()]));
    }

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
