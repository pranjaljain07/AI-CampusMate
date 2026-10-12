document.addEventListener("DOMContentLoaded", () => {
  let adminData = null;
  let selectedAttStudentId = 1;
  let selectedResStudentId = 1;

  const urlParams = new URLSearchParams(window.location.search);
  const querySid = urlParams.get('sid');
  if (querySid) {
    localStorage.setItem('campusmate_sid', querySid);
    sessionStorage.setItem('campusmate_sid', querySid);
  }

  function getSid() {
    return localStorage.getItem('campusmate_sid') || sessionStorage.getItem('campusmate_sid') || querySid || '';
  }

  async function authFetch(url, options = {}) {
    const sid = getSid();
    const headers = { ...(options.headers || {}) };
    if (sid) {
      headers['Authorization'] = `Bearer ${sid}`;
      headers['X-Session-ID'] = sid;
    }
    let targetUrl = url;
    if (sid && !url.includes('sid=')) {
      targetUrl += (url.includes('?') ? '&' : '?') + 'sid=' + encodeURIComponent(sid);
    }
    return fetch(targetUrl, {
      ...options,
      headers,
      credentials: 'include',
    });
  }

  const tabBtns = document.querySelectorAll("[data-tab]");
  const adminPanels = document.querySelectorAll(".admin-panel");
  const toastEl = document.getElementById("admin-toast");

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.remove("hidden");
    setTimeout(() => {
      toastEl.classList.add("hidden");
    }, 3500);
  }

  function switchAdminTab(tabName) {
    adminPanels.forEach((p) => {
      if (p.id === `admin-tab-${tabName}`) {
        p.classList.remove("hidden");
      } else {
        p.classList.add("hidden");
      }
    });
    tabBtns.forEach((b) => {
      if (b.getAttribute("data-tab") === tabName) {
        b.classList.add("active");
      } else {
        b.classList.remove("active");
      }
    });
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab");
      if (target) switchAdminTab(target);
    });
  });

  const logoutBtn = document.getElementById("admin-logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      logoutBtn.disabled = true;

      const sid = getSid();
      try {
        await fetch("/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": sid ? `Bearer ${sid}` : "",
            "X-Session-ID": sid || "",
          },
          credentials: "include",
          body: JSON.stringify({ sid }),
        });
      } catch (err) {
        try {
          await fetch("/api/auth/logout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": sid ? `Bearer ${sid}` : "",
              "X-Session-ID": sid || "",
            },
            credentials: "include",
            body: JSON.stringify({ sid }),
          });
        } catch (e2) {}
      }

      localStorage.removeItem("campusmate_sid");
      sessionStorage.removeItem("campusmate_sid");
      localStorage.removeItem("campusmate_user");
      sessionStorage.removeItem("campusmate_user");
      localStorage.clear();
      sessionStorage.clear();

      window.location.href = "/login";
    });
  }

  const refreshBtn = document.getElementById("refresh-admin-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      fetchAdminOverview(true);
    });
  }

  async function fetchAdminOverview(notify = false) {
    try {
      const res = await authFetch("/api/admin/overview");
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("campusmate_sid");
        sessionStorage.removeItem("campusmate_sid");
        window.location.href = "/login";
        return;
      }
      adminData = await res.json();
      renderAllAdminSections();
      if (notify) showToast("Synchronized latest records from MySQL (ai_database).");
    } catch (err) {
      console.error("Failed to load admin overview:", err);
    }
  }

  function renderAllAdminSections() {
    if (!adminData) return;

    if (adminData.admin) {
      document.getElementById("admin-name-display").textContent = adminData.admin.name;
      document.getElementById("admin-role-display").textContent =
        adminData.admin.designation || "Administrator · MIET";
    }

    document.getElementById("admin-kpi-students").textContent = (adminData.students || []).length;
    document.getElementById("admin-kpi-notices").textContent = (adminData.notices || []).length;
    document.getElementById("admin-kpi-assignments").textContent = (adminData.assignments || []).length;
    document.getElementById("admin-kpi-timetable").textContent = (adminData.timetable || []).length;

    renderStudentsTable();
    renderAttendanceManager();
    renderResultsManager();
    renderNoticesManager();
    renderAssignmentsManager();
    renderTimetableManager();
    renderEventsManager();
  }

  function renderStudentsTable() {
    const tbody = document.getElementById("admin-students-tbody");
    tbody.innerHTML = "";
    (adminData.students || []).forEach((s) => {
      const att = Number(s.overall_attendance || 0);
      const attClass = att < 75 ? "status-text-danger" : "status-text-nominal";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="tabular-nums">${s.id}</td>
        <td class="tabular-nums"><strong>${s.roll_no}</strong></td>
        <td><strong>${s.name}</strong></td>
        <td>${s.email}</td>
        <td>${s.branch} · Sem ${s.semester} (${s.section})</td>
        <td class="num-col"><span class="${attClass}">${att.toFixed(2)}%</span></td>
        <td class="num-col"><strong>${Number(s.sgpa).toFixed(2)}</strong></td>
        <td class="num-col"><strong>${Number(s.cgpa).toFixed(2)}</strong></td>
        <td>${s.advisor}</td>
        <td>
          <button type="button" class="btn btn-secondary btn-sm jump-att-btn" data-sid="${s.id}">Attendance</button>
          <button type="button" class="btn btn-secondary btn-sm jump-res-btn" data-sid="${s.id}">Results</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll(".jump-att-btn").forEach((b) => {
      b.addEventListener("click", () => {
        selectedAttStudentId = Number(b.getAttribute("data-sid"));
        renderAttendanceManager();
        switchAdminTab("attendance");
      });
    });

    document.querySelectorAll(".jump-res-btn").forEach((b) => {
      b.addEventListener("click", () => {
        selectedResStudentId = Number(b.getAttribute("data-sid"));
        renderResultsManager();
        switchAdminTab("results");
      });
    });
  }

  function renderAttendanceManager() {
    const selector = document.getElementById("att-student-selector");
    selector.innerHTML = "";
    (adminData.students || []).forEach((s) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `segmented-btn ${s.id === selectedAttStudentId ? "active" : ""}`;
      btn.textContent = `${s.name} (${s.roll_no.slice(-3)})`;
      btn.addEventListener("click", () => {
        selectedAttStudentId = s.id;
        renderAttendanceManager();
      });
      selector.appendChild(btn);
    });

    const tbody = document.getElementById("admin-attendance-tbody");
    tbody.innerHTML = "";
    const rows = (adminData.attendance || []).filter((a) => a.student_id === selectedAttStudentId);

    rows.forEach((r) => {
      const pct = Number(r.percentage || 0);
      const statusHtml =
        pct < 75
          ? `<span class="status-text-danger">Below 75%</span>`
          : `<span class="status-text-nominal">Eligible</span>`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${r.student_name}</strong></td>
        <td class="tabular-nums"><strong>${r.subject_code}</strong></td>
        <td>${r.subject}</td>
        <td class="num-col">
          <input type="number" min="0" class="form-input tabular-nums" style="width: 74px; padding: 0.3rem 0.5rem; text-align: right;" id="att-in-${r.id}" value="${r.attended_classes}" />
        </td>
        <td class="num-col">
          <input type="number" min="1" class="form-input tabular-nums" style="width: 74px; padding: 0.3rem 0.5rem; text-align: right;" id="tot-in-${r.id}" value="${r.total_classes}" />
        </td>
        <td class="num-col"><strong>${pct.toFixed(2)}%</strong></td>
        <td>${statusHtml}</td>
        <td>
          <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
            <button type="button" class="btn btn-secondary btn-sm att-action-btn" data-sid="${r.student_id}" data-code="${r.subject_code}" data-act="increment_present">+1 Present</button>
            <button type="button" class="btn btn-secondary btn-sm att-action-btn" data-sid="${r.student_id}" data-code="${r.subject_code}" data-act="increment_absent">+1 Absent</button>
            <button type="button" class="btn btn-secondary btn-sm att-action-btn" data-sid="${r.student_id}" data-code="${r.subject_code}" data-act="decrement_present">-1 Att</button>
            <button type="button" class="btn btn-primary btn-sm att-save-btn" data-id="${r.id}" data-sid="${r.student_id}" data-code="${r.subject_code}">Save</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll(".att-action-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const student_id = Number(btn.getAttribute("data-sid"));
        const subject_code = btn.getAttribute("data-code");
        const action = btn.getAttribute("data-act");
        await authFetch("/api/admin/attendance", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_id, subject_code, action }),
        });
        await fetchAdminOverview();
        showToast(`Updated ${subject_code} attendance in MySQL.`);
      });
    });

    document.querySelectorAll(".att-save-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const rowId = btn.getAttribute("data-id");
        const student_id = Number(btn.getAttribute("data-sid"));
        const subject_code = btn.getAttribute("data-code");
        const attended_classes = Number(document.getElementById(`att-in-${rowId}`).value);
        const total_classes = Number(document.getElementById(`tot-in-${rowId}`).value);

        await authFetch("/api/admin/attendance", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_id,
            subject_code,
            action: "set",
            attended_classes,
            total_classes,
          }),
        });
        await fetchAdminOverview();
        showToast(`Saved exact attendance for ${subject_code} in MySQL.`);
      });
    });
  }

  function renderResultsManager() {
    const selector = document.getElementById("res-student-selector");
    selector.innerHTML = "";
    (adminData.students || []).forEach((s) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `segmented-btn ${s.id === selectedResStudentId ? "active" : ""}`;
      btn.textContent = `${s.name} (SGPA: ${Number(s.sgpa).toFixed(2)})`;
      btn.addEventListener("click", () => {
        selectedResStudentId = s.id;
        renderResultsManager();
      });
      selector.appendChild(btn);
    });

    const stObj = (adminData.students || []).find((s) => s.id === selectedResStudentId) || {};
    document.getElementById("res-student-heading").textContent = `Subject Marks & Grade Sheet — ${stObj.name || ""}`;
    document.getElementById("res-student-gpa-badge").innerHTML = `
      <span>Roll No: <strong class="tabular-nums">${stObj.roll_no || ""}</strong></span>
      <span class="meta-sep">·</span>
      <span class="tabular-nums">SGPA: <strong>${Number(stObj.sgpa || 0).toFixed(2)}</strong></span>
      <span class="meta-sep">·</span>
      <span class="tabular-nums">CGPA: <strong>${Number(stObj.cgpa || 0).toFixed(2)}</strong></span>
    `;

    const tbody = document.getElementById("admin-results-tbody");
    tbody.innerHTML = "";
    const rows = (adminData.results || []).filter((r) => r.student_id === selectedResStudentId);

    rows.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="tabular-nums"><strong>${r.subject_code}</strong></td>
        <td><strong>${r.subject}</strong></td>
        <td class="num-col">${r.credits}</td>
        <td class="num-col">
          <input type="number" min="0" max="30" class="form-input tabular-nums" style="width: 74px; padding: 0.3rem 0.5rem; text-align: right;" id="res-int-${r.id}" value="${r.internal_marks}" />
        </td>
        <td class="num-col">
          <input type="number" min="0" max="70" class="form-input tabular-nums" style="width: 74px; padding: 0.3rem 0.5rem; text-align: right;" id="res-ext-${r.id}" value="${r.external_marks}" />
        </td>
        <td class="num-col"><strong>${r.total_marks} / 100</strong></td>
        <td><strong>${r.grade}</strong></td>
        <td>
          <button type="button" class="btn btn-primary btn-sm res-save-btn" data-id="${r.id}" data-sid="${r.student_id}" data-code="${r.subject_code}">Update Marks &amp; GPA</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll(".res-save-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        const student_id = Number(btn.getAttribute("data-sid"));
        const subject_code = btn.getAttribute("data-code");
        const internal_marks = Number(document.getElementById(`res-int-${id}`).value);
        const external_marks = Number(document.getElementById(`res-ext-${id}`).value);

        await authFetch("/api/admin/results", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_id, subject_code, internal_marks, external_marks }),
        });
        await fetchAdminOverview();
        showToast(`Updated marks and recalculated SGPA/CGPA for ${subject_code} in MySQL.`);
      });
    });
  }

  function renderNoticesManager() {
    const list = document.getElementById("admin-notices-list");
    list.innerHTML = "";
    (adminData.notices || []).forEach((n) => {
      const div = document.createElement("div");
      div.className = "feed-item";
      const impTag = n.is_important
        ? `<span class="status-text-danger">Important</span> <span class="meta-sep">·</span>`
        : "";
      div.innerHTML = `
        <div class="meta-inline">
          ${impTag}
          <span class="tabular-nums"><strong>${n.ref_no}</strong></span>
          <span class="meta-sep">·</span>
          <span>${n.category}</span>
          <span class="meta-sep">·</span>
          <span class="tabular-nums">Deadline: ${n.deadline_date || "None"}</span>
        </div>
        <div class="feed-item-title">${n.title}</div>
        <div class="feed-item-body">${n.content}</div>
        <div style="display: flex; gap: 0.5rem;">
          <button type="button" class="btn btn-secondary btn-sm edit-notice-btn" data-id="${n.id}">Edit</button>
          <button type="button" class="btn btn-danger btn-sm del-notice-btn" data-id="${n.id}">Delete</button>
        </div>
      `;
      list.appendChild(div);
    });

    document.querySelectorAll(".edit-notice-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-id"));
        const item = (adminData.notices || []).find((x) => x.id === id);
        if (!item) return;
        document.getElementById("notice-form-title").textContent = `Edit Notice #${item.id}`;
        document.getElementById("notice-id").value = item.id;
        document.getElementById("notice-ref").value = item.ref_no;
        document.getElementById("notice-title").value = item.title;
        document.getElementById("notice-category").value = item.category;
        document.getElementById("notice-deadline").value = item.deadline_date || "";
        document.getElementById("notice-content").value = item.content;
        document.getElementById("notice-important").checked = Boolean(item.is_important);
      });
    });

    document.querySelectorAll(".del-notice-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.getAttribute("data-id"));
        await authFetch(`/api/admin/notices/${id}`, { method: "DELETE" });
        await fetchAdminOverview();
        showToast("Deleted circular from MySQL.");
      });
    });
  }

  const noticeForm = document.getElementById("admin-notice-form");
  if (noticeForm) {
    noticeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("notice-id").value;
      const payload = {
        ref_no: document.getElementById("notice-ref").value.trim(),
        title: document.getElementById("notice-title").value.trim(),
        category: document.getElementById("notice-category").value,
        deadline_date: document.getElementById("notice-deadline").value || null,
        content: document.getElementById("notice-content").value.trim(),
        is_important: document.getElementById("notice-important").checked,
      };
      if (id) {
        await authFetch(`/api/admin/notices/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        showToast("Updated notice in MySQL.");
      } else {
        await authFetch("/api/admin/notices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        showToast("Published new notice to MySQL.");
      }
      noticeForm.reset();
      document.getElementById("notice-id").value = "";
      document.getElementById("notice-form-title").textContent = "Add New Circular";
      await fetchAdminOverview();
    });
  }

  document.getElementById("notice-reset-btn")?.addEventListener("click", () => {
    noticeForm.reset();
    document.getElementById("notice-id").value = "";
    document.getElementById("notice-form-title").textContent = "Add New Circular";
  });

  function renderAssignmentsManager() {
    const list = document.getElementById("admin-assignments-list");
    list.innerHTML = "";
    (adminData.assignments || []).forEach((a) => {
      const div = document.createElement("div");
      div.className = "feed-item";
      div.innerHTML = `
        <div class="meta-inline">
          <span class="tabular-nums"><strong>${a.subject_code} · ${a.subject}</strong></span>
          <span class="meta-sep">·</span>
          <span class="tabular-nums">Deadline: ${a.deadline}</span>
          <span class="meta-sep">·</span>
          <span class="tabular-nums">Max Marks: ${a.max_marks}</span>
        </div>
        <div class="feed-item-title">${a.title}</div>
        <div class="feed-item-body">${a.description}</div>
        <div style="display: flex; gap: 0.5rem;">
          <button type="button" class="btn btn-secondary btn-sm edit-assign-btn" data-id="${a.id}">Edit</button>
          <button type="button" class="btn btn-danger btn-sm del-assign-btn" data-id="${a.id}">Delete</button>
        </div>
      `;
      list.appendChild(div);
    });

    document.querySelectorAll(".edit-assign-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-id"));
        const a = (adminData.assignments || []).find((x) => x.id === id);
        if (!a) return;
        document.getElementById("assignment-form-title").textContent = `Edit Assignment #${a.id}`;
        document.getElementById("assignment-id").value = a.id;
        document.getElementById("assignment-code").value = a.subject_code;
        document.getElementById("assignment-subject").value = a.subject;
        document.getElementById("assignment-title").value = a.title;
        document.getElementById("assignment-deadline").value = a.deadline;
        document.getElementById("assignment-marks").value = a.max_marks;
        document.getElementById("assignment-desc").value = a.description;
      });
    });

    document.querySelectorAll(".del-assign-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.getAttribute("data-id"));
        await authFetch(`/api/admin/assignments/${id}`, { method: "DELETE" });
        await fetchAdminOverview();
        showToast("Deleted assignment from MySQL.");
      });
    });
  }

  const assignForm = document.getElementById("admin-assignment-form");
  if (assignForm) {
    assignForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("assignment-id").value;
      const payload = {
        subject_code: document.getElementById("assignment-code").value.trim(),
        subject: document.getElementById("assignment-subject").value.trim(),
        title: document.getElementById("assignment-title").value.trim(),
        deadline: document.getElementById("assignment-deadline").value,
        max_marks: Number(document.getElementById("assignment-marks").value),
        description: document.getElementById("assignment-desc").value.trim(),
      };
      if (id) {
        await authFetch(`/api/admin/assignments/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        showToast("Updated assignment in MySQL.");
      } else {
        await authFetch("/api/admin/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        showToast("Added new assignment to MySQL.");
      }
      assignForm.reset();
      document.getElementById("assignment-id").value = "";
      document.getElementById("assignment-form-title").textContent = "Add New Assignment";
      await fetchAdminOverview();
    });
  }

  document.getElementById("assignment-reset-btn")?.addEventListener("click", () => {
    assignForm.reset();
    document.getElementById("assignment-id").value = "";
    document.getElementById("assignment-form-title").textContent = "Add New Assignment";
  });

  function renderTimetableManager() {
    const tbody = document.getElementById("admin-timetable-tbody");
    tbody.innerHTML = "";
    (adminData.timetable || []).forEach((t) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${t.day_of_week}</strong></td>
        <td class="tabular-nums">${t.time_slot}</td>
        <td><strong>${t.subject_code}</strong> · ${t.subject} (${t.lecture_type})</td>
        <td>${t.faculty}</td>
        <td>${t.classroom}</td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn btn-secondary btn-sm edit-tt-btn" data-id="${t.id}">Edit</button>
            <button type="button" class="btn btn-danger btn-sm del-tt-btn" data-id="${t.id}">Delete</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll(".edit-tt-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-id"));
        const t = (adminData.timetable || []).find((x) => x.id === id);
        if (!t) return;
        document.getElementById("timetable-form-title").textContent = `Edit Lecture #${t.id}`;
        document.getElementById("tt-id").value = t.id;
        document.getElementById("tt-day").value = t.day_of_week;
        document.getElementById("tt-type").value = t.lecture_type;
        document.getElementById("tt-code").value = t.subject_code;
        document.getElementById("tt-subject").value = t.subject;
        document.getElementById("tt-faculty").value = t.faculty;
        document.getElementById("tt-slot").value = t.time_slot;
        document.getElementById("tt-room").value = t.classroom;
      });
    });

    document.querySelectorAll(".del-tt-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.getAttribute("data-id"));
        await authFetch(`/api/admin/timetable/${id}`, { method: "DELETE" });
        await fetchAdminOverview();
        showToast("Removed lecture slot from MySQL.");
      });
    });
  }

  const ttForm = document.getElementById("admin-timetable-form");
  if (ttForm) {
    ttForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("tt-id").value;
      const payload = {
        day_of_week: document.getElementById("tt-day").value,
        lecture_type: document.getElementById("tt-type").value,
        subject_code: document.getElementById("tt-code").value.trim(),
        subject: document.getElementById("tt-subject").value.trim(),
        faculty: document.getElementById("tt-faculty").value.trim(),
        time_slot: document.getElementById("tt-slot").value.trim(),
        classroom: document.getElementById("tt-room").value.trim(),
      };
      if (id) {
        await authFetch(`/api/admin/timetable/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        showToast("Updated timetable slot in MySQL.");
      } else {
        await authFetch("/api/admin/timetable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        showToast("Added new lecture slot to MySQL.");
      }
      ttForm.reset();
      document.getElementById("tt-id").value = "";
      document.getElementById("timetable-form-title").textContent = "Add Lecture Slot";
      await fetchAdminOverview();
    });
  }

  document.getElementById("timetable-reset-btn")?.addEventListener("click", () => {
    ttForm.reset();
    document.getElementById("tt-id").value = "";
    document.getElementById("timetable-form-title").textContent = "Add Lecture Slot";
  });

  function renderEventsManager() {
    const list = document.getElementById("admin-events-list");
    list.innerHTML = "";
    (adminData.events || []).forEach((ev) => {
      const div = document.createElement("div");
      div.className = "feed-item";
      div.innerHTML = `
        <div class="meta-inline">
          <span class="status-text-nominal">${ev.category}</span>
          <span class="meta-sep">·</span>
          <span class="tabular-nums">${ev.event_date} (${ev.event_time})</span>
          <span class="meta-sep">·</span>
          <span>${ev.venue}</span>
        </div>
        <div class="feed-item-title">${ev.title}</div>
        <div class="feed-item-body">${ev.description}</div>
        <div style="display: flex; gap: 0.5rem;">
          <button type="button" class="btn btn-secondary btn-sm edit-ev-btn" data-id="${ev.id}">Edit</button>
          <button type="button" class="btn btn-danger btn-sm del-ev-btn" data-id="${ev.id}">Delete</button>
        </div>
      `;
      list.appendChild(div);
    });

    document.querySelectorAll(".edit-ev-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-id"));
        const ev = (adminData.events || []).find((x) => x.id === id);
        if (!ev) return;
        document.getElementById("event-form-title").textContent = `Edit Event #${ev.id}`;
        document.getElementById("event-id").value = ev.id;
        document.getElementById("event-title").value = ev.title;
        document.getElementById("event-category").value = ev.category;
        document.getElementById("event-date").value = ev.event_date;
        document.getElementById("event-time").value = ev.event_time;
        document.getElementById("event-venue").value = ev.venue;
        document.getElementById("event-organizer").value = ev.organizer;
        document.getElementById("event-desc").value = ev.description;
      });
    });

    document.querySelectorAll(".del-ev-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.getAttribute("data-id"));
        await authFetch(`/api/admin/events/${id}`, { method: "DELETE" });
        await fetchAdminOverview();
        showToast("Deleted campus event from MySQL.");
      });
    });
  }

  const eventForm = document.getElementById("admin-event-form");
  if (eventForm) {
    eventForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("event-id").value;
      const payload = {
        title: document.getElementById("event-title").value.trim(),
        category: document.getElementById("event-category").value.trim(),
        event_date: document.getElementById("event-date").value,
        event_time: document.getElementById("event-time").value.trim(),
        venue: document.getElementById("event-venue").value.trim(),
        organizer: document.getElementById("event-organizer").value.trim(),
        description: document.getElementById("event-desc").value.trim(),
        registration_status: "Open",
      };
      if (id) {
        await authFetch(`/api/admin/events/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        showToast("Updated campus event in MySQL.");
      } else {
        await authFetch("/api/admin/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        showToast("Added new campus event to MySQL.");
      }
      eventForm.reset();
      document.getElementById("event-id").value = "";
      document.getElementById("event-form-title").textContent = "Add Campus Event";
      await fetchAdminOverview();
    });
  }

  document.getElementById("event-reset-btn")?.addEventListener("click", () => {
    eventForm.reset();
    document.getElementById("event-id").value = "";
    document.getElementById("event-form-title").textContent = "Add Campus Event";
  });

  fetchAdminOverview();
});
