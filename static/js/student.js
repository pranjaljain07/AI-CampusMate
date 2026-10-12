document.addEventListener("DOMContentLoaded", () => {
  let studentBundle = null;

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

  const tabTriggers = document.querySelectorAll("[data-tab]");
  const tabPanels = document.querySelectorAll(".tab-panel");

  function switchTab(tabId) {
    tabPanels.forEach((panel) => {
      if (panel.id === `tab-${tabId}`) {
        panel.classList.remove("hidden");
      } else {
        panel.classList.add("hidden");
      }
    });

    tabTriggers.forEach((btn) => {
      if (btn.classList.contains("sidebar-link") || btn.classList.contains("topbar-nav-link")) {
        if (btn.getAttribute("data-tab") === tabId) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      }
    });

    // Scroll smoothly to top of viewport
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  tabTriggers.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const trigger = e.currentTarget;
      const target = trigger.getAttribute("data-tab");
      if (target) switchTab(target);
    });
  });

  const logoutBtn = document.getElementById("logout-btn");
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

  function formatMarkdownText(raw) {
    if (!raw) return "";
    const escaped = raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return escaped
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br/>");
  }

  function computeInitials(name) {
    if (!name) return "ST";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  function renderStudentDashboard(data) {
    studentBundle = data;
    const st = data.student || {};
    const initials = computeInitials(st.name);

    // Sidebar & Profile updates
    const sideName = document.getElementById("sidebar-student-name");
    if (sideName) sideName.textContent = `${st.name || "Student"} (${st.roll_no || ""})`;

    const sideMeta = document.getElementById("sidebar-student-meta");
    if (sideMeta) sideMeta.textContent = `Branch: ${st.branch || "CS"} · Sem ${st.semester || 5} · Sec ${st.section || "A"}`;

    const sideAvatar = document.getElementById("sidebar-student-avatar");
    if (sideAvatar) sideAvatar.textContent = initials;

    const profAvatar = document.getElementById("profile-avatar");
    if (profAvatar) profAvatar.textContent = initials;

    const cardName = document.getElementById("profile-card-name");
    if (cardName) cardName.textContent = st.name || "Student";

    const cardRoll = document.getElementById("profile-card-roll");
    if (cardRoll) cardRoll.textContent = `Roll No: ${st.roll_no || ""} · Batch: ${st.batch || ""}`;

    const welcomeHeading = document.getElementById("welcome-heading");
    if (welcomeHeading) welcomeHeading.textContent = `Welcome back, ${st.name || "Student"}`;

    const profMeta = document.getElementById("student-profile-meta");
    if (profMeta) {
      profMeta.innerHTML = `
        <span>Roll No: <strong class="tabular-nums">${st.roll_no}</strong></span>
        <span class="meta-sep">·</span>
        <span>Enrollment: <strong class="tabular-nums">${st.enrollment_no}</strong></span>
        <span class="meta-sep">·</span>
        <span>Branch: <strong>${st.branch} (Sem ${st.semester})</strong></span>
        <span class="meta-sep">·</span>
        <span>Institutional Email: <strong>${st.email}</strong></span>
      `;
    }

    // Low Attendance Warning Banner
    const lowBanner = document.getElementById("low-attendance-alert");
    const lowSubjects = data.low_attendance_warnings || [];
    if (lowSubjects.length > 0) {
      const listStr = lowSubjects
        .map((s) => `${s.subject} (${s.subject_code}: ${Number(s.percentage).toFixed(2)}%)`)
        .join(", ");
      lowBanner.innerHTML = `
        <div class="alert-content-row">
          <span class="alert-icon">⚠️</span>
          <div>
            <strong>Low-Attendance Warning (Below 75% AKTU Threshold):</strong>
            <span>Your attendance is below the eligibility threshold in: <strong>${listStr}</strong>. Please ensure regular attendance in upcoming lectures to avoid detention from PUT exams.</span>
          </div>
        </div>
      `;
      lowBanner.classList.remove("hidden");
    } else {
      lowBanner.classList.add("hidden");
    }

    // KPI Card 1: Attendance
    const numOverallAtt = Number(data.overall_attendance || 0);
    const overallAttStr = numOverallAtt.toFixed(2);
    const kpiAtt = document.getElementById("kpi-attendance");
    if (kpiAtt) kpiAtt.textContent = `${overallAttStr}%`;

    const kpiAttSub = document.getElementById("kpi-attendance-sub");
    if (kpiAttSub) kpiAttSub.textContent = `${data.total_attended} / ${data.total_conducted} lectures attended`;

    const kpiAttBar = document.getElementById("kpi-attendance-bar");
    if (kpiAttBar) {
      kpiAttBar.style.width = `${Math.min(100, Math.max(0, numOverallAtt))}%`;
      kpiAttBar.className = "kpi-progress-fill";
      if (numOverallAtt >= 80) {
        kpiAttBar.classList.add("bar-green");
      } else if (numOverallAtt >= 75) {
        kpiAttBar.classList.add("bar-amber");
      } else {
        kpiAttBar.classList.add("bar-red");
      }
    }

    const kpiAttBadge = document.getElementById("kpi-attendance-badge");
    if (kpiAttBadge) {
      kpiAttBadge.className = "kpi-standing-pill " + (numOverallAtt >= 80 ? "pill-green" : (numOverallAtt >= 75 ? "pill-amber" : "pill-red"));
      kpiAttBadge.textContent = numOverallAtt >= 80 ? "Healthy (≥80%)" : (numOverallAtt >= 75 ? "Eligible (≥75%)" : "Shortage (<75%)");
    }

    // KPI Card 2: SGPA
    const kpiSgpa = document.getElementById("kpi-sgpa");
    if (kpiSgpa) kpiSgpa.textContent = Number(st.sgpa || 0).toFixed(2);

    // KPI Card 3: CGPA
    const kpiCgpa = document.getElementById("kpi-cgpa");
    if (kpiCgpa) kpiCgpa.textContent = Number(st.cgpa || 0).toFixed(2);

    const kpiAdvisor = document.getElementById("kpi-advisor");
    if (kpiAdvisor) kpiAdvisor.textContent = `Advisor: ${st.advisor || "Assigned Faculty"}`;

    // KPI Card 4: Assignments
    const kpiAssign = document.getElementById("kpi-assignments");
    if (kpiAssign) kpiAssign.textContent = (data.assignments || []).length;

    const kpiExamsSub = document.getElementById("kpi-exams-sub");
    if (kpiExamsSub) kpiExamsSub.textContent = `${(data.exams || []).length} scheduled PUT exams`;

    // Subject-Wise Attendance Summary (Overview) & Full Ledger
    const ovAttBody = document.getElementById("overview-attendance-body");
    const fullAttBody = document.getElementById("full-attendance-body");
    if (ovAttBody) ovAttBody.innerHTML = "";
    if (fullAttBody) fullAttBody.innerHTML = "";

    (data.attendance || []).forEach((row) => {
      const pct = Number(row.percentage || 0);
      const isLow = pct < 75;
      const isApproaching = pct >= 75 && pct < 80;

      let statusBadgeClass = "badge-success";
      let statusText = "Eligible (≥75%)";
      let barClass = "progress-nominal";
      let pctBadgeClass = "pct-badge-green";

      if (isLow) {
        statusBadgeClass = "badge-danger";
        statusText = "Shortage (<75%)";
        barClass = "progress-danger";
        pctBadgeClass = "pct-badge-red";
      } else if (isApproaching) {
        statusBadgeClass = "badge-warning";
        statusText = "Approaching Limit";
        barClass = "progress-warning";
        pctBadgeClass = "pct-badge-amber";
      }

      if (ovAttBody) {
        const trOv = document.createElement("tr");
        trOv.innerHTML = `
          <td><span class="subject-code-chip">${row.subject_code}</span></td>
          <td><strong class="subject-name-cell">${row.subject}</strong></td>
          <td class="num-col"><span class="tabular-nums font-semibold">${row.attended_classes}</span><span class="text-muted"> / ${row.total_classes}</span></td>
          <td class="num-col">
            <span class="pct-badge ${pctBadgeClass}">${pct.toFixed(2)}%</span>
          </td>
          <td><span class="status-badge ${statusBadgeClass}">${statusText}</span></td>
        `;
        ovAttBody.appendChild(trOv);
      }

      if (fullAttBody) {
        const trFull = document.createElement("tr");
        trFull.innerHTML = `
          <td><span class="subject-code-chip">${row.subject_code}</span></td>
          <td><strong class="subject-name-cell">${row.subject}</strong></td>
          <td><span class="faculty-tag-inline">${row.faculty}</span></td>
          <td class="num-col"><strong class="tabular-nums">${row.attended_classes}</strong></td>
          <td class="num-col"><span class="tabular-nums text-muted">${row.total_classes}</span></td>
          <td class="num-col" style="min-width: 170px;">
            <div class="table-progress-wrap">
              <div class="progress-track"><div class="progress-fill ${barClass}" style="width: ${Math.min(100, pct)}%"></div></div>
              <span class="pct-badge ${pctBadgeClass}">${pct.toFixed(2)}%</span>
            </div>
          </td>
          <td><span class="status-badge ${statusBadgeClass}">${statusText}</span></td>
        `;
        fullAttBody.appendChild(trFull);
      }
    });

    // Today's Schedule
    const schedTitle = document.getElementById("today-schedule-title");
    if (schedTitle) schedTitle.textContent = `Today's Schedule (${data.current_day})`;

    const todayContainer = document.getElementById("overview-today-classes");
    if (todayContainer) {
      todayContainer.innerHTML = "";
      const todayRows = data.today_timetable || [];
      if (todayRows.length === 0) {
        todayContainer.innerHTML = `
          <div class="schedule-empty-state">
            <span class="empty-icon">☕</span>
            <p>No lectures scheduled for today (${data.current_day}). Enjoy your study break!</p>
          </div>
        `;
      } else {
        todayRows.forEach((cls, idx) => {
          const div = document.createElement("div");
          const isUpcoming = idx === 0;
          div.className = `schedule-card ${isUpcoming ? "schedule-card-highlight" : ""}`;
          div.innerHTML = `
            <div class="schedule-card-top">
              <span class="time-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span>${cls.time_slot}</span>
              </span>
              <span class="session-type-pill ${cls.lecture_type && cls.lecture_type.toLowerCase().includes('lab') ? 'session-lab' : 'session-lecture'}">${cls.lecture_type}</span>
              ${isUpcoming ? '<span class="status-badge badge-active-slot">Next Session</span>' : ''}
            </div>
            <div class="schedule-subject-name">${cls.subject} <span class="subject-code-tag">${cls.subject_code}</span></div>
            <div class="schedule-card-bottom">
              <span class="room-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>${cls.classroom}</span>
              </span>
              <span class="faculty-tag">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span>${cls.faculty}</span>
              </span>
            </div>
          `;
          todayContainer.appendChild(div);
        });
      }
    }

    // Student Profile Table
    const profileTable = document.getElementById("student-profile-table");
    if (profileTable) {
      profileTable.innerHTML = `
        <tr>
          <th><span class="field-icon">👤</span> Full Name</th>
          <td><strong>${st.name}</strong></td>
        </tr>
        <tr>
          <th><span class="field-icon">🆔</span> University Roll No</th>
          <td><span class="tabular-nums font-semibold">${st.roll_no}</span></td>
        </tr>
        <tr>
          <th><span class="field-icon">📄</span> Enrollment Number</th>
          <td><span class="tabular-nums">${st.enrollment_no}</span></td>
        </tr>
        <tr>
          <th><span class="field-icon">✉️</span> Institutional Email</th>
          <td><span class="email-link">${st.email}</span></td>
        </tr>
        <tr>
          <th><span class="field-icon">🎓</span> Branch &amp; Semester</th>
          <td><strong>${st.branch}</strong> · Semester ${st.semester} (Section ${st.section})</td>
        </tr>
        <tr>
          <th><span class="field-icon">📅</span> Academic Batch</th>
          <td><span class="tabular-nums">${st.batch}</span></td>
        </tr>
        <tr>
          <th><span class="field-icon">📞</span> Contact Number</th>
          <td><span class="tabular-nums">${st.phone}</span></td>
        </tr>
        <tr>
          <th><span class="field-icon">👨‍🏫</span> Faculty Advisor</th>
          <td><strong>${st.advisor}</strong></td>
        </tr>
        <tr>
          <th><span class="field-icon">📊</span> Standing Performance</th>
          <td>
            <div class="score-pills-row">
              <span class="score-pill score-sgpa">SGPA: <strong>${Number(st.sgpa).toFixed(2)}</strong></span>
              <span class="score-pill score-cgpa">CGPA: <strong>${Number(st.cgpa).toFixed(2)}</strong></span>
            </div>
          </td>
        </tr>
      `;
    }

    // Overview Notices List
    const ovNotices = document.getElementById("overview-notices-list");
    if (ovNotices) {
      ovNotices.innerHTML = "";
      (data.notices || []).slice(0, 3).forEach((n) => {
        const div = document.createElement("div");
        div.className = `feed-item ${n.is_important ? "feed-item-important" : "feed-item-normal"}`;
        const priorityBadge = n.is_important
          ? `<span class="notice-badge badge-important">⚠️ Important Notice</span>`
          : `<span class="notice-badge badge-circular">General Circular</span>`;
        div.innerHTML = `
          <div class="notice-meta-bar">
            ${priorityBadge}
            <span class="notice-badge badge-category">${n.category}</span>
            <span class="notice-date"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> ${n.posted_date}</span>
            <span class="meta-sep">·</span>
            <span class="ref-tag">Ref: ${n.ref_no}</span>
          </div>
          <div class="feed-item-title">${n.title}</div>
          <div class="meta-inline"><span class="issuer-text">Issued by: <strong>${n.posted_by}</strong></span></div>
        `;
        ovNotices.appendChild(div);
      });
    }

    // Timetable
    renderTimetableRows("ALL");

    // Assignments
    const assignContainer = document.getElementById("assignments-list-container");
    if (assignContainer) {
      assignContainer.innerHTML = "";
      const assignments = data.assignments || [];
      if (assignments.length === 0) {
        assignContainer.innerHTML = `<div class="schedule-empty-state"><p>No assignments currently pending.</p></div>`;
      } else {
        assignments.forEach((a) => {
          const div = document.createElement("div");
          div.className = "feed-item assignment-card";
          div.innerHTML = `
            <div class="assignment-meta-bar">
              <span class="subject-code-chip">${a.subject_code}</span>
              <strong class="subject-name-cell">${a.subject}</strong>
              <span class="meta-sep">·</span>
              <span class="status-badge badge-warning deadline-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Deadline: ${a.deadline}
              </span>
              <span class="meta-sep">·</span>
              <span class="tabular-nums marks-pill">Max Marks: ${a.max_marks}</span>
              <span class="meta-sep">·</span>
              <span class="faculty-tag-inline">Faculty: ${a.faculty}</span>
            </div>
            <div class="feed-item-title">${a.title}</div>
            <div class="feed-item-body">${a.description}</div>
          `;
          assignContainer.appendChild(div);
        });
      }
    }

    // Results Summary
    const gpaSummary = document.getElementById("results-gpa-summary");
    if (gpaSummary) {
      gpaSummary.innerHTML = `
        <span class="gpa-summary-chip chip-student">Student: <strong>${st.name}</strong></span>
        <span class="gpa-summary-chip chip-sgpa">Semester SGPA: <strong>${Number(st.sgpa).toFixed(2)}</strong></span>
        <span class="gpa-summary-chip chip-cgpa">Cumulative CGPA: <strong>${Number(st.cgpa).toFixed(2)}</strong></span>
      `;
    }

    // Results Table
    const resBody = document.getElementById("results-table-body");
    if (resBody) {
      resBody.innerHTML = "";
      (data.results || []).forEach((r) => {
        const tr = document.createElement("tr");

        let gradeClass = "grade-badge-blue";
        if (r.grade === "O" || r.grade === "A+") gradeClass = "grade-badge-emerald";
        else if (r.grade === "A") gradeClass = "grade-badge-indigo";
        else if (r.grade === "B+") gradeClass = "grade-badge-cyan";
        else if (r.grade === "B") gradeClass = "grade-badge-amber";
        else if (r.grade === "F") gradeClass = "grade-badge-danger";

        tr.innerHTML = `
          <td><span class="subject-code-chip">${r.subject_code}</span></td>
          <td><strong class="subject-name-cell">${r.subject}</strong></td>
          <td class="num-col"><span class="tabular-nums font-semibold">${r.credits}</span></td>
          <td class="num-col"><span class="tabular-nums">${r.internal_marks} / ${r.max_internal}</span></td>
          <td class="num-col"><span class="tabular-nums">${r.external_marks} / ${r.max_external}</span></td>
          <td class="num-col"><strong class="tabular-nums total-marks-cell">${r.total_marks} / 100</strong></td>
          <td><span class="grade-badge ${gradeClass}">${r.grade}</span></td>
          <td class="num-col"><span class="tabular-nums font-semibold">${r.grade_points}</span></td>
        `;
        resBody.appendChild(tr);
      });
    }

    // Exams Table
    const examsBody = document.getElementById("exams-table-body");
    if (examsBody) {
      examsBody.innerHTML = "";
      (data.exams || []).forEach((ex) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><span class="exam-date-pill"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg> <strong>${ex.exam_date}</strong></span></td>
          <td><span class="tabular-nums time-slot-pill">${ex.exam_time}</span></td>
          <td><span class="subject-code-chip">${ex.subject_code}</span></td>
          <td><strong class="subject-name-cell">${ex.subject}</strong></td>
          <td><span class="room-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path></svg> ${ex.room}</span></td>
          <td class="num-col"><span class="tabular-nums font-semibold">${ex.max_marks}</span></td>
          <td><span class="syllabus-notes">${ex.syllabus_notes || "Complete Unit 1-5 Syllabus"}</span></td>
        `;
        examsBody.appendChild(tr);
      });
    }

    // Full Notices with AI Summarizer
    const noticesFull = document.getElementById("notices-full-list");
    if (noticesFull) {
      noticesFull.innerHTML = "";
      (data.notices || []).forEach((n) => {
        const div = document.createElement("div");
        div.className = `feed-item ${n.is_important ? "feed-item-important" : "feed-item-normal"}`;
        const impLabel = n.is_important
          ? `<span class="notice-badge badge-important">⚠️ Important Priority</span>`
          : `<span class="notice-badge badge-circular">General Circular</span>`;

        div.innerHTML = `
          <div class="notice-meta-bar">
            ${impLabel}
            <span class="notice-badge badge-category">${n.category}</span>
            <span class="notice-date"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg> Issued: ${n.posted_date}</span>
            <span class="meta-sep">·</span>
            <span class="tabular-nums ref-tag">Ref: ${n.ref_no}</span>
            ${n.deadline_date ? `<span class="meta-sep">·</span><span class="status-badge badge-warning">Deadline: ${n.deadline_date}</span>` : ""}
            <span class="meta-sep">·</span>
            <span class="issuer-text">By: <strong>${n.posted_by}</strong></span>
          </div>
          <div class="feed-item-title">${n.title}</div>
          <div class="feed-item-body">${n.content}</div>
          <div class="notice-action-row">
            <button type="button" class="btn btn-ai-action btn-sm summarize-notice-btn" data-notice-id="${n.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <span>Summarize Circular with Gemini AI</span>
            </button>
          </div>
          <div id="notice-summary-${n.id}" class="summary-box hidden"></div>
        `;
        noticesFull.appendChild(div);
      });

      // Bind Summarize Buttons
      document.querySelectorAll(".summarize-notice-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const noticeId = Number(btn.getAttribute("data-notice-id"));
          const targetBox = document.getElementById(`notice-summary-${noticeId}`);
          btn.disabled = true;
          btn.innerHTML = `<span class="spinner-inline"></span><span>Generating AI Summary via Google Gemini...</span>`;

          try {
            const res = await authFetch("/api/ai/summarize-notice", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ notice_id: noticeId }),
            });
            const payload = await res.json();
            const s = payload.summary || {};

            const pts = (s.important_points || []).map((p) => `<li>${p}</li>`).join("");
            const dls = (s.deadlines || []).map((d) => `<li><strong>${d}</strong></li>`).join("");
            const dates = (s.important_dates || []).map((d) => `<li>${d}</li>`).join("");
            const acts = (s.action_items || []).map((a) => `<li>${a}</li>`).join("");

            targetBox.innerHTML = `
              <div class="summary-header">
                <span class="ai-spark-icon">✨</span>
                <h5>Google Gemini AI Executive Circular Summary</h5>
              </div>
              <div class="summary-section summary-overview">
                <strong>Executive Overview:</strong>
                <p>${s.summary || "Summary generated successfully."}</p>
              </div>
              <div class="summary-grid">
                <div class="summary-col">
                  <strong>Important Key Points:</strong>
                  <ul>${pts || "<li>No special points noted.</li>"}</ul>
                </div>
                <div class="summary-col">
                  <strong>Critical Deadlines &amp; Dates:</strong>
                  <ul>${dls || dates ? `${dls}${dates}` : "<li>None specified in circular.</li>"}</ul>
                </div>
              </div>
              <div class="summary-section summary-actions">
                <strong>Required Student Action Items:</strong>
                <ul>${acts || "<li>Review information and follow standard guidelines.</li>"}</ul>
              </div>
            `;
            targetBox.classList.remove("hidden");
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>Refresh Gemini Summary</span>`;
            btn.disabled = false;
          } catch (err) {
            targetBox.innerHTML = `<p class="status-text-danger">Failed to summarize notice via Gemini API.</p>`;
            targetBox.classList.remove("hidden");
            btn.disabled = false;
            btn.innerHTML = `<span>Summarize Circular with Gemini AI</span>`;
          }
        });
      });
    }

    // Full Campus Events
    const eventsFull = document.getElementById("events-full-list");
    if (eventsFull) {
      eventsFull.innerHTML = "";
      (data.events || []).forEach((ev) => {
        const div = document.createElement("div");
        div.className = "feed-item event-card";
        div.innerHTML = `
          <div class="notice-meta-bar">
            <span class="notice-badge badge-category">${ev.category}</span>
            <span class="notice-date"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg> <strong>Date: ${ev.event_date} (${ev.event_time})</strong></span>
            <span class="meta-sep">·</span>
            <span class="room-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path></svg> ${ev.venue}</span>
            <span class="meta-sep">·</span>
            <span class="status-badge badge-success">${ev.registration_status}</span>
          </div>
          <div class="feed-item-title">${ev.title}</div>
          <div class="feed-item-body">${ev.description}</div>
          <div class="meta-inline"><span class="issuer-text">Organized by: <strong>${ev.organizer}</strong></span></div>
        `;
        eventsFull.appendChild(div);
      });
    }
  }

  function renderTimetableRows(dayFilter) {
    if (!studentBundle) return;
    const tbody = document.getElementById("timetable-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    const rows = (studentBundle.timetable || []).filter(
      (r) => dayFilter === "ALL" || r.day_of_week === dayFilter
    );

    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem; color: var(--text-muted);">No classes scheduled for ${dayFilter}.</td></tr>`;
      return;
    }

    rows.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><span class="day-badge"><strong>${r.day_of_week}</strong></span></td>
        <td><span class="tabular-nums time-slot-pill">${r.time_slot}</span></td>
        <td><span class="subject-code-chip">${r.subject_code}</span></td>
        <td><strong class="subject-name-cell">${r.subject}</strong></td>
        <td><span class="session-type-pill ${r.lecture_type && r.lecture_type.toLowerCase().includes('lab') ? 'session-lab' : 'session-lecture'}">${r.lecture_type}</span></td>
        <td><span class="faculty-tag-inline">${r.faculty}</span></td>
        <td><span class="room-badge">${r.classroom}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  document.querySelectorAll("#timetable-day-filter .segmented-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("#timetable-day-filter .segmented-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderTimetableRows(btn.getAttribute("data-day"));
    });
  });

  // AI Chat Assistant
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatMessages = document.getElementById("chat-messages");
  const chatSendBtn = document.getElementById("chat-send-btn");
  let isAiGenerating = false;

  function appendChatMessage(sender, text, isUser) {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${isUser ? "chat-bubble-user" : "chat-bubble-ai"}`;
    bubble.innerHTML = `
      <div class="chat-bubble-sender">
        ${!isUser ? '<span class="ai-spark-icon">✨</span> ' : ''}${sender}
      </div>
      <div class="chat-bubble-text">${isUser ? text : formatMarkdownText(text)}</div>
    `;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function sendQuestionToGemini(questionText) {
    if (isAiGenerating) return;
    const stName = studentBundle?.student?.name || "Student";
    appendChatMessage(`${stName} (CS Sem 5)`, questionText, true);
    chatInput.value = "";
    chatSendBtn.disabled = true;
    isAiGenerating = true;

    // Loading indicator bubble
    const loadingBubble = document.createElement("div");
    loadingBubble.id = "chat-typing-indicator";
    loadingBubble.className = "chat-bubble chat-bubble-ai chat-typing-bubble";
    loadingBubble.innerHTML = `
      <div class="chat-bubble-sender"><span class="ai-spark-icon">✨</span> AI CampusMate · Gemini Thinking...</div>
      <div class="typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-label">Analyzing live MySQL records for your query...</span>
      </div>
    `;
    chatMessages.appendChild(loadingBubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const res = await authFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: questionText }),
      });
      const data = await res.json();
      const existingIndicator = document.getElementById("chat-typing-indicator");
      if (existingIndicator) existingIndicator.remove();

      appendChatMessage(
        "AI CampusMate · Google Gemini + MySQL Context",
        data.reply || data.error || "Unable to generate response.",
        false
      );
    } catch (err) {
      const existingIndicator = document.getElementById("chat-typing-indicator");
      if (existingIndicator) existingIndicator.remove();
      appendChatMessage("AI CampusMate", "Connection error while contacting backend.", false);
    } finally {
      isAiGenerating = false;
      chatSendBtn.disabled = false;
      chatSendBtn.innerHTML = `
        <span>Send Question</span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      `;
    }
  }

  if (chatForm) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = chatInput.value.trim();
      if (!q) return;
      sendQuestionToGemini(q);
    });
  }

  document.querySelectorAll(".prompt-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const prompt = btn.getAttribute("data-prompt");
      if (prompt) {
        switchTab("assistant");
        sendQuestionToGemini(prompt);
      }
    });
  });

  async function loadDashboard() {
    try {
      const response = await authFetch("/api/student/dashboard");
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("campusmate_sid");
        sessionStorage.removeItem("campusmate_sid");
        window.location.href = "/login";
        return;
      }
      const data = await response.json();
      renderStudentDashboard(data);
    } catch (err) {
      console.error("Failed to fetch student dashboard data:", err);
    }
  }

  loadDashboard();
});
