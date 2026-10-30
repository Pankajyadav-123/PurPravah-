import "./style.css";

const root = document.querySelector("#app");
const departments = {
  roads: "Roads",
  electricity: "Electricity",
  sanitation: "Sanitation",
  water: "Water",
  general: "General services",
};
const statuses = {
  under_verification: "Needs review",
  assigned: "Assigned",
  in_progress: "In progress",
  resolved: "Resolved",
  rejected: "Rejected",
};
const categories = {
  road_damage: "Road damage",
  electricity: "Electricity",
  garbage: "Garbage & sanitation",
  water_leakage: "Water leakage",
  other: "Other civic issue",
};

const state = {
  checkingSession: true,
  sessionCheckFailed: false,
  user: null,
  view: "overview",
  summary: null,
  performance: [],
  complaints: [],
  feedback: [],
  feedbackError: "",
  search: "",
  statusFilter: "all",
  departmentFilter: "all",
  modal: null,
  mobileNavOpen: false,
  notice: "",
  noticeType: "error",
  loadingData: false,
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function departmentName(value) {
  return value ? departments[value] ?? value : "Unassigned";
}

function statusPill(status) {
  return `<span class="status status-${escapeHtml(status)}">${escapeHtml(statuses[status] ?? status)}</span>`;
}

async function api(path, { method = "GET", body } = {}) {
  const apiPath = path.startsWith("/auth/admin/") ? path : `/admin-api${path}`;
  const response = await fetch(`/api${apiPath}`, {
    method,
    credentials: "include",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let result = null;
  try {
    result = await response.json();
  } catch {
    if (!response.ok) throw new Error(`Request failed (${response.status}).`);
  }
  if (!response.ok) {
    throw new Error(result?.error ?? `Request failed (${response.status}).`);
  }
  return result;
}

function setNotice(message, type = "error") {
  state.notice = message;
  state.noticeType = type;
  render();
}

async function refreshDashboard() {
  state.loadingData = true;
  state.notice = "";
  render();
  try {
    const [summary, performance, complaints] = await Promise.all([
      api("/dashboard/summary"),
      api("/departments/performance"),
      api("/complaints"),
    ]);
    state.summary = summary;
    state.performance = performance;
    state.complaints = complaints;
    try {
      state.feedback = await api("/admin/feedback");
      state.feedbackError = "";
    } catch (error) {
      state.feedbackError = error instanceof Error ? error.message : "Could not load citizen feedback.";
    }
  } catch (error) {
    state.notice = error instanceof Error ? error.message : "Could not load the admin dashboard.";
    state.noticeType = "error";
  } finally {
    state.loadingData = false;
    render();
  }
}

function loginView() {
  if (state.checkingSession) {
    return `<main class="auth-wrap"><div class="loader"></div><p>Checking your admin session…</p></main>`;
  }
  if (state.sessionCheckFailed) {
    return `
      <main class="auth-wrap">
        <section class="auth-card">
          <p class="eyebrow">Session check failed</p>
          <h1>Could not verify your session.</h1>
          <p class="muted">Check your connection and try again. You may need to sign in if your session has expired.</p>
          ${state.notice ? `<div class="notice notice-${state.noticeType}">${escapeHtml(state.notice)}</div>` : ""}
          <button class="button button-primary full-width" data-action="retry-session">Try again</button>
        </section>
      </main>`;
  }
  if (state.user && state.user.role !== "admin") {
    return `
      <main class="auth-wrap">
        <section class="auth-card">
          <p class="eyebrow">Admin access only</p>
          <h1>This account is not an administrator.</h1>
          <p class="muted">Sign out and use an account that has administrator access.</p>
          <button class="button button-primary full-width" data-action="logout">Sign out</button>
        </section>
      </main>`;
  }
  return `
    <main class="auth-wrap">
      <section class="auth-card">
        <p class="eyebrow">City administration</p>
        <h1>Admin sign in</h1>
        <p class="muted">Sign in with your administrator account.</p>
        ${state.notice ? `<div class="notice notice-${state.noticeType}">${escapeHtml(state.notice)}</div>` : ""}
        <form id="login-form" class="form-stack">
          <label>Email address<input name="email" type="email" autocomplete="username" required maxlength="254" /></label>
          <label>Password<input name="password" type="password" autocomplete="current-password" required maxlength="128" /></label>
          <button class="button button-primary full-width" type="submit">Sign in to admin desk</button>
        </form>
      </section>
    </main>`;
}

function metricCard(label, value, caption) {
  return `
    <article class="metric-card">
      <div>
        <p class="metric-label">${escapeHtml(label)}</p>
        <p class="metric-value">${escapeHtml(value)}</p>
        <p class="metric-caption">${escapeHtml(caption)}</p>
      </div>
    </article>`;
}

function requestRows(items, compact = false) {
  if (!items.length) {
    return `<div class="empty-state"><strong>No reports to show</strong><p>New civic reports will appear here.</p></div>`;
  }
  return `<div class="table-scroll"><table class="requests-table">
    <thead><tr><th>Report</th><th>Department</th><th>Status</th><th>Received</th>${compact ? "" : "<th>Action</th>"}</tr></thead>
    <tbody>${items.map((item) => `
      <tr data-request-row data-status="${escapeHtml(item.status)}"
          data-department="${escapeHtml(item.department ?? "unassigned")}"
          data-search="${escapeHtml(`${item.publicId} ${item.description} ${item.address} ${item.reporterName} ${item.reporterId}`.toLowerCase())}">
        <td>
          <div class="request-id">${escapeHtml(item.publicId)}</div>
          <div class="request-title">${escapeHtml(categories[item.category] ?? item.category)}</div>
          <div class="request-location">${escapeHtml(item.address)}</div>
          <div class="request-reporter">From ${escapeHtml(item.reporterName)}</div>
        </td>
        <td>${escapeHtml(departmentName(item.department))}</td>
        <td>${statusPill(item.status)}${item.suspectedDuplicate ? '<span class="duplicate-flag">Possible duplicate</span>' : ""}</td>
        <td class="date-cell">${escapeHtml(formatDate(item.createdAt))}</td>
        ${compact ? "" : `<td>${actionButtons(item)}</td>`}
      </tr>`).join("")}</tbody>
  </table></div>`;
}

function actionButtons(item) {
  if (item.status === "under_verification") {
    return `<button class="button button-small button-primary" data-action="review" data-id="${escapeHtml(item.id)}">Review & assign</button>`;
  }
  if (item.status === "assigned") {
    return `<div class="row-actions">
      <button class="button button-small button-secondary" data-action="reassign" data-id="${escapeHtml(item.id)}">Change team</button>
      <button class="button button-small button-primary" data-action="start" data-id="${escapeHtml(item.id)}">Start work</button>
    </div>`;
  }
  if (item.status === "in_progress") {
    return `<div class="row-actions">
      <button class="button button-small button-secondary" data-action="reassign" data-id="${escapeHtml(item.id)}">Change team</button>
      <button class="button button-small button-primary" data-action="resolve" data-id="${escapeHtml(item.id)}">Mark resolved</button>
    </div>`;
  }
  return `<span class="muted">—</span>`;
}

function departmentRows() {
  if (!state.performance.length) return `<p class="muted">No department data available.</p>`;
  return `<div class="table-scroll"><table class="department-table">
    <thead><tr><th>Department</th><th>Total</th><th>Pending</th><th>In progress</th><th>Resolved</th><th>Avg. hours</th></tr></thead>
    <tbody>${state.performance.map((row) => `
      <tr>
        <td><strong>${escapeHtml(departmentName(row.department))}</strong></td>
        <td>${row.total}</td><td>${row.pending}</td><td>${row.inProgress}</td><td>${row.resolved}</td>
        <td>${Number(row.averageResolutionHours ?? 0).toFixed(1)}</td>
      </tr>`).join("")}</tbody>
  </table></div>`;
}

function overviewView() {
  const summary = state.summary;
  if (!summary) return `<div class="panel"><div class="loader"></div></div>`;
  const awaiting = state.complaints.filter((item) => item.status === "under_verification").length;
  const unassigned = state.complaints.filter((item) =>
    !item.department && !["rejected", "resolved"].includes(item.status)).length;
  return `
    <section class="welcome-row">
      <div><p class="eyebrow">City administration</p><h1>Good day, ${escapeHtml(state.user.name.split(" ")[0])}</h1><p class="muted">Track new civic reports, route work to teams, and follow service progress.</p></div>
      <button class="button button-secondary" data-action="refresh">Refresh data</button>
    </section>
    <section class="metrics-grid">
      ${metricCard("All reports", summary.total, "Across the city")}
      ${metricCard("New / needs review", summary.needsReview, `${awaiting} in the latest 200 reports`)}
      ${metricCard("In progress", summary.inProgress, "Being handled by a department")}
      ${metricCard("Resolved", summary.resolved, `Average ${Number(summary.averageResolutionHours ?? 0).toFixed(1)} hours`)}
    </section>
    <section class="split-grid">
      <article class="panel">
        <div class="panel-heading"><div><p class="eyebrow">Latest activity</p><h2>Recent reports</h2></div><button class="text-button" data-view="requests">View all</button></div>
        ${requestRows(summary.recent ?? [], true)}
      </article>
      <article class="panel">
        <div class="panel-heading"><div><p class="eyebrow">Work distribution</p><h2>By department</h2></div><button class="text-button" data-view="departments">Details</button></div>
        <div class="department-list">${state.performance.map((row) => {
          const total = Math.max(1, row.total);
          const progress = Math.min(100, Math.round((row.resolved / total) * 100));
          return `<div class="department-item">
            <div class="department-item-top"><strong>${escapeHtml(departmentName(row.department))}</strong><span>${row.total} reports, ${row.pending} pending</span></div>
            <div class="progress-track"><span style="width:${progress}%"></span></div>
            <div class="progress-caption">${progress}% resolved</div>
          </div>`;
        }).join("")}</div>
        <div class="unassigned-note"><strong>${unassigned}</strong> unassigned in the latest 200 reports, <strong>${awaiting}</strong> awaiting review</div>
      </article>
    </section>
    ${state.loadingData ? '<p class="muted loading-inline">Refreshing data…</p>' : ""}`;
}

function requestsView() {
  const filtered = state.complaints.filter((item) => {
    const matchesStatus = state.statusFilter === "all" || item.status === state.statusFilter;
    const matchesDepartment = state.departmentFilter === "all"
      || (state.departmentFilter === "unassigned" ? !item.department : item.department === state.departmentFilter);
    const needle = state.search.trim().toLowerCase();
    const searchable = `${item.publicId} ${item.description} ${item.address} ${item.reporterName} ${item.reporterId}`.toLowerCase();
    return matchesStatus && matchesDepartment && (!needle || searchable.includes(needle));
  });
  return `
    <section class="welcome-row">
      <div><p class="eyebrow">Service desk</p><h1>All civic reports</h1><p class="muted">Review new reports, confirm their department, and track work through completion.</p></div>
      <button class="button button-secondary" data-action="refresh">Refresh data</button>
    </section>
    <section class="panel">
      <div class="filters">
        <label class="search-field"><input id="request-search" type="search" placeholder="Search ID, resident or location" value="${escapeHtml(state.search)}" /></label>
        <select id="status-filter" aria-label="Filter by status">
          <option value="all">All statuses</option>
          ${Object.entries(statuses).map(([value, label]) => `<option value="${value}" ${state.statusFilter === value ? "selected" : ""}>${label}</option>`).join("")}
        </select>
        <select id="department-filter" aria-label="Filter by department">
          <option value="all">All departments</option><option value="unassigned" ${state.departmentFilter === "unassigned" ? "selected" : ""}>Unassigned</option>
          ${Object.entries(departments).map(([value, label]) => `<option value="${value}" ${state.departmentFilter === value ? "selected" : ""}>${label}</option>`).join("")}
        </select>
        <span class="results-count">${filtered.length} reports</span>
      </div>
      ${filtered.length ? requestRows(filtered) : `<div class="empty-state"><strong>No matching reports</strong><p>Try another search or filter.</p></div>`}
      ${state.loadingData ? '<p class="muted loading-inline">Refreshing data…</p>' : ""}
    </section>`;
}

function departmentsView() {
  return `
    <section class="welcome-row">
      <div><p class="eyebrow">Service performance</p><h1>Department overview</h1><p class="muted">Compare incoming work, active assignments, and completed reports.</p></div>
      <button class="button button-secondary" data-action="refresh">Refresh data</button>
    </section>
    <section class="panel">
      <div class="panel-heading"><div><p class="eyebrow">Live report totals</p><h2>Workload by department</h2></div></div>
      ${departmentRows()}
    </section>
    <section class="panel department-help">
      <h2>What the counts mean</h2>
      <p><strong>Pending</strong> includes reports awaiting review or assigned to a department. <strong>In progress</strong> are reports currently being worked on. <strong>Resolved</strong> are completed reports with a resolution record.</p>
    </section>`;
}

function feedbackView() {
  if (state.feedbackError) {
    return `
      <section class="welcome-row">
        <div><p class="eyebrow">Citizen feedback</p><h1>Ratings & feedback</h1><p class="muted">Feedback submitted for resolved reports.</p></div>
        <button class="button button-secondary" data-action="refresh">Refresh data</button>
      </section>
      <div class="notice notice-error">${escapeHtml(state.feedbackError)}</div>`;
  }
  if (!state.feedback.length) {
    return `
      <section class="welcome-row">
        <div><p class="eyebrow">Citizen feedback</p><h1>Ratings & feedback</h1><p class="muted">Feedback submitted for resolved reports.</p></div>
        <button class="button button-secondary" data-action="refresh">Refresh data</button>
      </section>
      <section class="panel empty-state"><strong>No feedback received yet</strong><p>Citizen ratings and comments will appear here after a report is resolved.</p></section>`;
  }
  const averageRating = state.feedback.reduce((sum, item) => sum + item.rating, 0) / state.feedback.length;
  return `
    <section class="welcome-row">
      <div><p class="eyebrow">Citizen feedback</p><h1>Ratings & feedback</h1><p class="muted">Feedback submitted for resolved reports.</p></div>
      <button class="button button-secondary" data-action="refresh">Refresh data</button>
    </section>
    <section class="feedback-summary">
      <article class="metric-card"><div><p class="metric-label">Average rating</p><p class="metric-value">${averageRating.toFixed(1)} / 5</p><p class="metric-caption">From the latest ${state.feedback.length} submissions</p></div></article>
      <article class="metric-card"><div><p class="metric-label">Feedback received</p><p class="metric-value">${state.feedback.length}</p><p class="metric-caption">Latest submissions shown</p></div></article>
    </section>
    <section class="feedback-list" aria-label="Citizen ratings and comments">
      ${state.feedback.map((item) => `
        <article class="panel feedback-card">
          <div class="feedback-card-heading">
            <div>
              <p class="eyebrow">${escapeHtml(item.publicId)} · ${escapeHtml(categories[item.category] ?? item.category)}</p>
              <h2>${escapeHtml(item.reporterName)}</h2>
            </div>
            <time class="feedback-date">${escapeHtml(formatDate(item.createdAt))}</time>
          </div>
          <div class="feedback-rating" role="img" aria-label="${item.rating} out of 5 stars">
            <span>${"★".repeat(item.rating)}<span class="feedback-empty-stars">${"☆".repeat(5 - item.rating)}</span></span>
            <strong>${item.rating} / 5</strong>
          </div>
          <p class="feedback-comment">${item.comment ? escapeHtml(item.comment) : "No written comment provided."}</p>
          <p class="feedback-department">Department: ${escapeHtml(departmentName(item.department))}</p>
        </article>`).join("")}
    </section>`;
}

function modalView() {
  const complaint = state.complaints.find((item) => item.id === state.modal?.id);
  if (!complaint || !state.modal) return "";
  const isReview = state.modal.type === "review";
  const isResolve = state.modal.type === "resolve";
  const currentDepartment = complaint.department ?? "roads";
  return `
    <div class="modal-backdrop">
      <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button class="modal-close" data-action="close-modal" aria-label="Close">×</button>
        <p class="eyebrow">${escapeHtml(complaint.publicId)} · ${escapeHtml(categories[complaint.category] ?? complaint.category)}</p>
        <h2 id="modal-title">${isReview ? "Review & route report" : isResolve ? "Complete this report" : "Change department"}</h2>
        <p class="modal-location">${escapeHtml(complaint.address)}</p>
        <p class="modal-description">${escapeHtml(complaint.description)}</p>
        <div class="modal-meta"><span>Resident: ${escapeHtml(complaint.reporterName)}</span>${statusPill(complaint.status)}<span>Current team: ${escapeHtml(departmentName(complaint.department))}</span></div>
        ${complaint.photoUrl ? `<a class="photo-link" href="${escapeHtml(complaint.photoUrl)}" target="_blank" rel="noreferrer">Open report photo ↗</a>` : ""}
        ${state.notice ? `<div class="notice notice-${state.noticeType}">${escapeHtml(state.notice)}</div>` : ""}
        ${isResolve
          ? `<form id="resolve-form" class="form-stack">
              <label>Completion note<textarea name="note" maxlength="1000" placeholder="Describe the completed work"></textarea></label>
              <label>After-work photo<input name="resolutionPhoto" type="file" accept="image/*" required /><small>Upload a photo to document resolution.</small></label>
              <button class="button button-primary full-width" type="submit">Upload photo & mark resolved</button>
            </form>`
          : `<form id="review-form" class="form-stack">
              <label>Action<select name="action">
                ${isReview ? '<option value="verify">Verify and assign</option><option value="reject">Reject report</option>' : ""}
                ${!isReview || complaint.status !== "resolved" ? '<option value="reassign">Reassign department</option>' : ""}
              </select></label>
              <label>Department<select name="department">
                ${Object.entries(departments).map(([value, label]) => `<option value="${value}" ${currentDepartment === value ? "selected" : ""}>${label}</option>`).join("")}
              </select></label>
              <label>Note<textarea name="note" maxlength="1000" placeholder="Optional note visible in the report history"></textarea></label>
              <button class="button button-primary full-width" type="submit">${isReview ? "Save review" : "Save department assignment"}</button>
            </form>`}
      </section>
    </div>`;
}

function appView() {
  const activeView = state.view === "requests" ? requestsView()
    : state.view === "departments" ? departmentsView()
      : state.view === "feedback" ? feedbackView() : overviewView();
  return `
    <div class="app-shell">
      ${state.mobileNavOpen ? '<button class="mobile-nav-backdrop" data-action="close-nav" aria-label="Close navigation"></button>' : ""}
      <aside class="sidebar ${state.mobileNavOpen ? "is-open" : ""}">
        <a class="brand" href="#" data-view="overview"><strong>PurPravah</strong></a>
        <button class="mobile-nav-close" data-action="close-nav" aria-label="Close navigation">×</button>
        <nav>
          <button class="nav-link ${state.view === "overview" ? "active" : ""}" data-view="overview">Dashboard</button>
          <button class="nav-link ${state.view === "requests" ? "active" : ""}" data-view="requests">All reports <em>${state.summary?.needsReview ?? 0}</em></button>
          <button class="nav-link ${state.view === "departments" ? "active" : ""}" data-view="departments">Departments</button>
          <button class="nav-link ${state.view === "feedback" ? "active" : ""}" data-view="feedback">Feedback <em>${state.feedback.length}</em></button>
        </nav>
        <button class="mobile-nav-logout" data-action="logout">Sign out</button>
      </aside>
      <div class="main-column">
        <header class="topbar"><div class="mobile-brand"><strong>Admin desk</strong></div><div class="topbar-user"><span class="avatar">${escapeHtml(state.user.name.trim().slice(0, 1).toUpperCase())}</span><span class="user-name">${escapeHtml(state.user.name)}</span><button class="text-button desktop-logout" data-action="logout">Sign out</button><button class="mobile-nav-toggle" data-action="toggle-nav" aria-label="Open navigation" aria-expanded="${state.mobileNavOpen}">☰</button></div></header>
        <main class="content">
          ${state.notice && !state.modal ? `<div class="notice notice-${state.noticeType}">${escapeHtml(state.notice)}<button data-action="dismiss-notice" aria-label="Dismiss">×</button></div>` : ""}
          ${activeView}
        </main>
      </div>
      ${modalView()}
    </div>`;
}

function render() {
  if (state.checkingSession || !state.user || state.user.role !== "admin") {
    root.innerHTML = loginView();
    return;
  }
  root.innerHTML = appView();
}

function findComplaint(id) {
  return state.complaints.find((item) => item.id === id);
}

async function uploadResolutionPhoto(file) {
  if (!file || !file.type.startsWith("image/")) {
    throw new Error("Choose an image file for the completion photo.");
  }
  const signed = await api("/uploads/signature", {
    method: "POST",
    body: { purpose: "resolution" },
  });
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", signed.apiKey);
  form.append("timestamp", String(signed.timestamp));
  form.append("signature", signed.signature);
  form.append("folder", signed.folder);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/image/upload`, {
    method: "POST",
    body: form,
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The photo upload service returned an invalid response.");
  }
  if (!response.ok) {
    throw new Error(result?.error?.message ?? "The completion photo could not be uploaded.");
  }
  return result.secure_url;
}

async function runAction(button, action) {
  button.disabled = true;
  try {
    await action();
    state.modal = null;
    state.notice = "";
    await refreshDashboard();
    state.notice = "Report updated successfully.";
    state.noticeType = "success";
    render();
  } catch (error) {
    state.notice = error instanceof Error ? error.message : "The update could not be completed.";
    state.noticeType = "error";
    render();
  } finally {
    button.disabled = false;
  }
}

root.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const submitButton = form.querySelector('[type="submit"]');
  if (form.id === "login-form") {
    submitButton.disabled = true;
    const data = new FormData(form);
    try {
      const result = await api("/auth/admin/login", {
        method: "POST",
        body: { email: data.get("email"), password: data.get("password") },
      });
      if (result.user?.role !== "admin") {
        await api("/auth/admin/logout", { method: "POST" });
        throw new Error("This account does not have administrator access.");
      }
      state.user = result.user;
      state.notice = "";
      render();
      await refreshDashboard();
    } catch (error) {
      state.notice = error instanceof Error ? error.message : "Sign in failed.";
      state.noticeType = "error";
      render();
    }
    return;
  }

  const complaintId = state.modal?.id;
  if (form.id === "review-form" && complaintId) {
    const data = new FormData(form);
    const action = data.get("action");
    const payload = {
      action,
      note: String(data.get("note") ?? ""),
      ...(action === "reject" ? {} : { department: data.get("department") }),
    };
    await runAction(submitButton, () => api(`/complaints/${encodeURIComponent(complaintId)}/review`, {
      method: "POST",
      body: payload,
    }));
  }
  if (form.id === "resolve-form" && complaintId) {
    const data = new FormData(form);
    await runAction(submitButton, async () => {
      const resolutionPhotoUrl = await uploadResolutionPhoto(data.get("resolutionPhoto"));
      await api(`/complaints/${encodeURIComponent(complaintId)}/status`, {
        method: "PATCH",
        body: {
          status: "resolved",
          note: String(data.get("note") ?? "").trim() || "Work completed by the city team.",
          resolutionPhotoUrl,
        },
      });
    });
  }
});

root.addEventListener("click", async (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    event.preventDefault();
    state.view = viewButton.dataset.view;
    state.mobileNavOpen = false;
    state.notice = "";
    render();
    return;
  }
  const button = event.target.closest("[data-action]");
  if (!button) {
    if (event.target.classList.contains("modal-backdrop")) {
      state.modal = null;
      state.notice = "";
      render();
    }
    return;
  }
  const action = button.dataset.action;
  if (action === "toggle-nav") {
    state.mobileNavOpen = !state.mobileNavOpen;
    render();
  } else if (action === "close-nav") {
    state.mobileNavOpen = false;
    render();
  } else if (action === "retry-session") {
    void initialize();
  } else if (action === "dismiss-notice") {
    state.notice = "";
    render();
  } else if (action === "close-modal") {
    state.modal = null;
    state.notice = "";
    render();
  } else if (action === "refresh") {
    await refreshDashboard();
  } else if (action === "logout") {
    try {
      await api("/auth/admin/logout", { method: "POST" });
      state.user = null;
      state.summary = null;
      state.performance = [];
      state.complaints = [];
      state.mobileNavOpen = false;
      state.notice = "";
      render();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Sign out failed.");
    }
  } else if (action === "review" || action === "reassign" || action === "resolve") {
    state.modal = { id: button.dataset.id, type: action };
    state.notice = "";
    render();
  } else if (action === "start") {
    const complaint = findComplaint(button.dataset.id);
    if (!complaint) return;
    await runAction(button, () => api(`/complaints/${encodeURIComponent(complaint.id)}/status`, {
      method: "PATCH",
      body: { status: "in_progress", note: "Work started by the city team." },
    }));
  }
});

root.addEventListener("input", (event) => {
  if (event.target.id === "request-search") {
    state.search = event.target.value;
    filterRequestRows();
  }
});

root.addEventListener("change", (event) => {
  if (event.target.id === "status-filter") state.statusFilter = event.target.value;
  if (event.target.id === "department-filter") state.departmentFilter = event.target.value;
  if (event.target.id === "status-filter" || event.target.id === "department-filter") {
    render();
  }
});

function filterRequestRows() {
  const needle = state.search.trim().toLowerCase();
  const rows = [...root.querySelectorAll("[data-request-row]")];
  let visible = 0;
  for (const row of rows) {
    const matches = (state.statusFilter === "all" || row.dataset.status === state.statusFilter)
      && (state.departmentFilter === "all"
        || (state.departmentFilter === "unassigned" ? row.dataset.department === "unassigned" : row.dataset.department === state.departmentFilter))
      && (!needle || row.dataset.search.includes(needle));
    row.hidden = !matches;
    if (matches) visible += 1;
  }
  const count = root.querySelector(".results-count");
  if (count) count.textContent = `${visible} reports`;
}

async function initialize() {
  state.checkingSession = true;
  state.sessionCheckFailed = false;
  state.notice = "";
  render();
  try {
    const session = await api("/auth/admin/session");
    state.user = session.authenticated && session.user?.role === "admin" ? session.user : null;
    if (state.user) await refreshDashboard();
  } catch (error) {
    state.notice = error instanceof Error ? error.message : "Could not check the admin session.";
    state.noticeType = "error";
    state.sessionCheckFailed = true;
  } finally {
    state.checkingSession = false;
    render();
  }
}

initialize();
