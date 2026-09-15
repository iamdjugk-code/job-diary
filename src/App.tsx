import { useEffect, useMemo, useState } from "react";
import "./App.css";

type JobStatus =
  | "지원완료"
  | "서류 검토중"
  | "서류 합격"
  | "면접 예정"
  | "면접 완료"
  | "최종 합격"
  | "최종 탈락";

type JobApplication = {
  id: number;
  company: string;
  position: string;
  date: string;
  status: JobStatus;
  memo: string;
};

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

type TodoByDate = {
  [date: string]: Todo[];
};

const statusList: JobStatus[] = [
  "지원완료",
  "서류 검토중",
  "서류 합격",
  "면접 예정",
  "면접 완료",
  "최종 합격",
  "최종 탈락",
];

function getTodayString() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function App() {
  const today = getTodayString();

  const [selectedDate, setSelectedDate] = useState(today);

  const [calendarDate, setCalendarDate] =
    useState(() => {
      const date = new Date();

      return {
        year: date.getFullYear(),
        month: date.getMonth(),
      };
    });

  const [todosByDate, setTodosByDate] =
    useState<TodoByDate>(() => {
      const saved = localStorage.getItem(
        "job-diary-todos-by-date"
      );

      return saved ? JSON.parse(saved) : {};
    });

  const [applications, setApplications] =
    useState<JobApplication[]>(() => {
      const saved = localStorage.getItem(
        "job-diary-applications"
      );

      return saved ? JSON.parse(saved) : [];
    });

  const [todoText, setTodoText] = useState("");

  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [applicationDate, setApplicationDate] =
    useState(today);
  const [status, setStatus] =
    useState<JobStatus>("지원완료");
  const [memo, setMemo] = useState("");

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [searchText, setSearchText] = useState("");

  const [filterStatus, setFilterStatus] =
    useState<"전체" | JobStatus>("전체");

  const [activeTab, setActiveTab] =
    useState<
      "dashboard" | "applications" | "calendar"
    >("dashboard");

  const todos = todosByDate[selectedDate] || [];

  /* =========================
     저장
  ========================= */

  useEffect(() => {
    localStorage.setItem(
      "job-diary-todos-by-date",
      JSON.stringify(todosByDate)
    );
  }, [todosByDate]);

  useEffect(() => {
    localStorage.setItem(
      "job-diary-applications",
      JSON.stringify(applications)
    );
  }, [applications]);

  /* =========================
     날짜
  ========================= */



  /* =========================
     할 일
  ========================= */

  const addTodo = () => {
    if (!todoText.trim()) return;

    const newTodo: Todo = {
      id: Date.now(),
      text: todoText.trim(),
      completed: false,
    };

    setTodosByDate((prev) => ({
      ...prev,
      [selectedDate]: [
        ...(prev[selectedDate] || []),
        newTodo,
      ],
    }));

    setTodoText("");
  };

  const toggleTodo = (id: number) => {
    setTodosByDate((prev) => ({
      ...prev,
      [selectedDate]: (
        prev[selectedDate] || []
      ).map((todo) =>
        todo.id === id
          ? {
              ...todo,
              completed: !todo.completed,
            }
          : todo
      ),
    }));
  };

  const deleteTodo = (id: number) => {
    setTodosByDate((prev) => ({
      ...prev,
      [selectedDate]: (
        prev[selectedDate] || []
      ).filter((todo) => todo.id !== id),
    }));
  };

  /* =========================
     지원 기록
  ========================= */

  const resetForm = () => {
    setCompany("");
    setPosition("");
    setApplicationDate(today);
    setStatus("지원완료");
    setMemo("");
    setEditingId(null);
  };

  const saveApplication = () => {
    if (!company.trim()) {
      alert("회사명을 입력해주세요.");
      return;
    }

    if (!position.trim()) {
      alert("직무를 입력해주세요.");
      return;
    }

    if (editingId !== null) {
      setApplications((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                company: company.trim(),
                position: position.trim(),
                date: applicationDate,
                status,
                memo: memo.trim(),
              }
            : item
        )
      );
    } else {
      const newApplication: JobApplication = {
        id: Date.now(),
        company: company.trim(),
        position: position.trim(),
        date: applicationDate,
        status,
        memo: memo.trim(),
      };

      setApplications((prev) => [
        newApplication,
        ...prev,
      ]);
    }

    resetForm();
  };

  const editApplication = (
    application: JobApplication
  ) => {
    setEditingId(application.id);
    setCompany(application.company);
    setPosition(application.position);
    setApplicationDate(application.date);
    setStatus(application.status);
    setMemo(application.memo);

    setActiveTab("applications");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteApplication = (id: number) => {
    if (
      !window.confirm(
        "이 지원 기록을 삭제할까요?"
      )
    ) {
      return;
    }

    setApplications((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  /* =========================
     통계
  ========================= */

  const totalApplications =
    applications.length;

  const documentPassed =
    applications.filter(
      (item) => item.status === "서류 합격"
    ).length;

  const interviews =
    applications.filter(
      (item) => item.status === "면접 예정"
    ).length;

  const finalPassed =
    applications.filter(
      (item) => item.status === "최종 합격"
    ).length;

  const finalFailed =
    applications.filter(
      (item) => item.status === "최종 탈락"
    ).length;

  const decidedApplications =
    documentPassed +
    finalFailed +
    finalPassed;

  const documentRate =
    totalApplications === 0
      ? 0
      : Math.round(
          (documentPassed / totalApplications) *
            100
        );

  const finalRate =
    totalApplications === 0
      ? 0
      : Math.round(
          (finalPassed / totalApplications) *
            100
        );

  /* =========================
     검색
  ========================= */

  const filteredApplications = useMemo(() => {
    return applications.filter((item) => {
      const keyword =
        searchText.trim().toLowerCase();

      const matchesSearch =
        keyword === "" ||
        item.company
          .toLowerCase()
          .includes(keyword) ||
        item.position
          .toLowerCase()
          .includes(keyword);

      const matchesStatus =
        filterStatus === "전체" ||
        item.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [
    applications,
    searchText,
    filterStatus,
  ]);

  /* =========================
     할 일 진행률
  ========================= */

  const completedTodos = todos.filter(
    (todo) => todo.completed
  ).length;

  const progress =
    todos.length === 0
      ? 0
      : Math.round(
          (completedTodos / todos.length) * 100
        );

  /* =========================
     달력
  ========================= */

  const calendarDays = useMemo(() => {
    const firstDay = new Date(
      calendarDate.year,
      calendarDate.month,
      1
    ).getDay();

    const lastDate = new Date(
      calendarDate.year,
      calendarDate.month + 1,
      0
    ).getDate();

    const days: (
      | number
      | null
    )[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (
      let day = 1;
      day <= lastDate;
      day++
    ) {
      days.push(day);
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  }, [calendarDate]);

  const getDateString = (day: number) => {
    return [
      calendarDate.year,
      String(calendarDate.month + 1).padStart(
        2,
        "0"
      ),
      String(day).padStart(2, "0"),
    ].join("-");
  };

  const applicationsForDate = (
    dateString: string
  ) => {
    return applications.filter(
      (item) => item.date === dateString
    );
  };

  const moveMonth = (amount: number) => {
    const date = new Date(
      calendarDate.year,
      calendarDate.month + amount,
      1
    );

    setCalendarDate({
      year: date.getFullYear(),
      month: date.getMonth(),
    });
  };

  const goToCalendarDate = (
    dateString: string
  ) => {
    const date = new Date(
      `${dateString}T00:00:00`
    );

    setCalendarDate({
      year: date.getFullYear(),
      month: date.getMonth(),
    });

    setSelectedDate(dateString);
  };

  const statusClass = (status: JobStatus) => {
    switch (status) {
      case "서류 합격":
        return "status-document";
      case "면접 예정":
        return "status-interview";
      case "최종 합격":
        return "status-final";
      case "최종 탈락":
        return "status-failed";
      case "면접 완료":
        return "status-complete";
      default:
        return "status-default";
    }
  };

  return (
    <div className="app">

      {/* HEADER */}

      <header className="header">
        <div className="header-inner">

          <div className="logo">
            JOB DIARY
          </div>

          <p className="header-date">
            {formatDate(selectedDate)}
          </p>

          <h1>
            생각하지 말고
            <br />
            그냥 넣자.
          </h1>

          <p className="subtitle">
            하나씩 기록하고,
            하나씩 앞으로.
          </p>

        </div>
      </header>

      {/* NAV */}

      <nav className="navigation">

        <button
          className={
            activeTab === "dashboard"
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() =>
            setActiveTab("dashboard")
          }
        >
          대시보드
        </button>

        <button
          className={
            activeTab === "applications"
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() =>
            setActiveTab("applications")
          }
        >
          지원 기록
        </button>

        <button
          className={
            activeTab === "calendar"
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() =>
            setActiveTab("calendar")
          }
        >
          지원 달력
        </button>

      </nav>

      <main className="container">

        {/* ==================================================
            DASHBOARD
        ================================================== */}

        {activeTab === "dashboard" && (
          <>

            <section className="section">

              <div className="section-title">

                <div>
                  <p className="section-label">
                    TODAY
                  </p>

                  <h2>
                    오늘의 진행률
                  </h2>
                </div>

                <strong className="progress-number">
                  {progress}%
                </strong>

              </div>

              <div className="progress-box">

                <div className="progress-info">
                  <span>
                    {completedTodos} /{" "}
                    {todos.length} 완료
                  </span>

                  <span>
                    {todos.length === 0
                      ? "오늘의 할 일을 추가해보세요."
                      : ""}
                  </span>
                </div>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

              </div>

            </section>

            {/* 취준 통계 */}

            <section className="section">

              <div className="section-title">
                <div>
                  <p className="section-label">
                    JOB STATUS
                  </p>

                  <h2>
                    취준 현황
                  </h2>
                </div>
              </div>

              <div className="summary-grid">

                <div className="summary-card">
                  <span>
                    전체 지원
                  </span>

                  <strong>
                    {totalApplications}
                  </strong>
                </div>

                <div className="summary-card">
                  <span>
                    서류 합격
                  </span>

                  <strong>
                    {documentPassed}
                  </strong>
                </div>

                <div className="summary-card">
                  <span>
                    면접 예정
                  </span>

                  <strong>
                    {interviews}
                  </strong>
                </div>

                <div className="summary-card">
                  <span>
                    최종 합격
                  </span>

                  <strong>
                    {finalPassed}
                  </strong>
                </div>

              </div>

            </section>

            {/* 합격률 */}

            <section className="section">

              <div className="section-title">
                <div>
                  <p className="section-label">
                    ANALYSIS
                  </p>

                  <h2>
                    지원 결과 분석
                  </h2>
                </div>
              </div>

              <div className="analysis-card">

                <div className="analysis-row">

                  <div>
                    <span>
                      서류 합격률
                    </span>

                    <strong>
                      {documentRate}%
                    </strong>
                  </div>

                  <div className="analysis-bar">
                    <div
                      style={{
                        width: `${documentRate}%`,
                      }}
                    />
                  </div>

                </div>

                <div className="analysis-row">

                  <div>
                    <span>
                      최종 합격률
                    </span>

                    <strong>
                      {finalRate}%
                    </strong>
                  </div>

                  <div className="analysis-bar">
                    <div
                      style={{
                        width: `${finalRate}%`,
                      }}
                    />
                  </div>

                </div>

                <div className="analysis-bottom">

                  <span>
                    결과 확인 {decidedApplications}건
                  </span>

                  <span>
                    탈락 {finalFailed}건
                  </span>

                </div>

              </div>

            </section>

            {/* 할 일 */}

            <section className="section">

              <div className="section-title">

                <div>
                  <p className="section-label">
                    TODO
                  </p>

                  <h2>
                    오늘의 할 일
                  </h2>
                </div>

                <button
                  className="more-button"
                  onClick={() =>
                    setActiveTab(
                      "dashboard"
                    )
                  }
                >
                  {formatDate(
                    selectedDate
                  )}
                </button>

              </div>

              <div className="todo-input">

                <input
                  value={todoText}
                  placeholder="오늘 할 일을 적어보세요"
                  onChange={(e) =>
                    setTodoText(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addTodo();
                    }
                  }}
                />

                <button onClick={addTodo}>
                  추가
                </button>

              </div>

              <div className="todo-list">

                {todos.length === 0 ? (
                  <div className="empty">
                    아직 등록된 할 일이 없어요.
                  </div>
                ) : (
                  todos.map((todo) => (
                    <div
                      className="todo-item"
                      key={todo.id}
                    >

                      <button
                        className={
                          todo.completed
                            ? "check checked"
                            : "check"
                        }
                        onClick={() =>
                          toggleTodo(
                            todo.id
                          )
                        }
                      >
                        {todo.completed
                          ? "✓"
                          : ""}
                      </button>

                      <span
                        className={
                          todo.completed
                            ? "todo-completed"
                            : ""
                        }
                      >
                        {todo.text}
                      </span>

                      <button
                        className="delete-button"
                        onClick={() =>
                          deleteTodo(
                            todo.id
                          )
                        }
                      >
                        ×
                      </button>

                    </div>
                  ))
                )}

              </div>

            </section>

          </>
        )}

        {/* ==================================================
            APPLICATIONS
        ================================================== */}

        {activeTab === "applications" && (
          <>

            <section className="section">

              <div className="section-title">

                <div>
                  <p className="section-label">
                    APPLICATION
                  </p>

                  <h2>
                    지원 기록
                  </h2>
                </div>

                <span className="count">
                  {applications.length}
                </span>

              </div>

              <div className="application-form">

                <div className="input-group">
                  <label>
                    회사명
                  </label>

                  <input
                    value={company}
                    placeholder="예: ○○교육"
                    onChange={(e) =>
                      setCompany(
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="input-group">
                  <label>
                    직무
                  </label>

                  <input
                    value={position}
                    placeholder="예: 교육 운영"
                    onChange={(e) =>
                      setPosition(
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="input-group">
                  <label>
                    지원일
                  </label>

                  <input
                    type="date"
                    value={applicationDate}
                    onChange={(e) =>
                      setApplicationDate(
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="input-group">
                  <label>
                    현재 상태
                  </label>

                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(
                        e.target
                          .value as JobStatus
                      )
                    }
                  >
                    {statusList.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="input-group full">
                  <label>
                    메모
                  </label>

                  <textarea
                    value={memo}
                    placeholder="채용공고 특징이나 면접 메모 등을 적어보세요."
                    onChange={(e) =>
                      setMemo(
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="form-buttons">

                  {editingId !== null && (
                    <button
                      className="cancel-button"
                      onClick={resetForm}
                    >
                      취소
                    </button>
                  )}

                  <button
                    className="add-application-button"
                    onClick={
                      saveApplication
                    }
                  >
                    {editingId !== null
                      ? "수정 저장"
                      : "지원 기록 추가"}
                  </button>

                </div>

              </div>

            </section>

            <section className="section">

              <div className="search-box">
                <input
                  value={searchText}
                  placeholder="회사명 또는 직무 검색"
                  onChange={(e) =>
                    setSearchText(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="filter-scroll">

                <button
                  className={
                    filterStatus === "전체"
                      ? "filter-button active"
                      : "filter-button"
                  }
                  onClick={() =>
                    setFilterStatus(
                      "전체"
                    )
                  }
                >
                  전체
                </button>

                {statusList.map(
                  (item) => (
                    <button
                      key={item}
                      className={
                        filterStatus ===
                        item
                          ? "filter-button active"
                          : "filter-button"
                      }
                      onClick={() =>
                        setFilterStatus(
                          item
                        )
                      }
                    >
                      {item}
                    </button>
                  )
                )}

              </div>

            </section>

            <section className="section">

              <div className="application-list">

                {filteredApplications.length ===
                0 ? (
                  <div className="empty-box">
                    검색 결과가 없습니다.
                  </div>
                ) : (
                  filteredApplications.map(
                    (item) => (
                      <article
                        className="application-card"
                        key={item.id}
                      >

                        <div className="application-top">

                          <div>
                            <h3>
                              {item.company}
                            </h3>

                            <p>
                              {item.position}
                            </p>
                          </div>

                          <div className="card-actions">

                            <button
                              onClick={() =>
                                editApplication(
                                  item
                                )
                              }
                            >
                              수정
                            </button>

                            <button
                              onClick={() =>
                                deleteApplication(
                                  item.id
                                )
                              }
                            >
                              삭제
                            </button>

                          </div>

                        </div>

                        <div className="application-info">

                          <span>
                            {item.date}
                          </span>

                          <span
                            className={`status ${statusClass(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>

                        </div>

                        {item.memo && (
                          <p className="memo">
                            {item.memo}
                          </p>
                        )}

                      </article>
                    )
                  )
                )}

              </div>

            </section>

          </>
        )}

        {/* ==================================================
            CALENDAR
        ================================================== */}

        {activeTab === "calendar" && (
          <>

            <section className="section">

              <div className="calendar-header">

                <button
                  className="calendar-arrow"
                  onClick={() =>
                    moveMonth(-1)
                  }
                >
                  ‹
                </button>

                <h2>
                  {calendarDate.year}년{" "}
                  {calendarDate.month + 1}월
                </h2>

                <button
                  className="calendar-arrow"
                  onClick={() =>
                    moveMonth(1)
                  }
                >
                  ›
                </button>

              </div>

              <button
                className="calendar-today"
                onClick={() => {
                  goToCalendarDate(
                    today
                  );
                }}
              >
                오늘로 이동
              </button>

            </section>

            <section className="calendar">

              <div className="weekday-row">

                {[
                  "일",
                  "월",
                  "화",
                  "수",
                  "목",
                  "금",
                  "토",
                ].map((day) => (
                  <div key={day}>
                    {day}
                  </div>
                ))}

              </div>

              <div className="calendar-grid">

                {calendarDays.map(
                  (day, index) => {

                    if (day === null) {
                      return (
                        <div
                          className="calendar-day empty-day"
                          key={index}
                        />
                      );
                    }

                    const dateString =
                      getDateString(day);

                    const dayApplications =
                      applicationsForDate(
                        dateString
                      );

                    const isToday =
                      dateString === today;

                    const isSelected =
                      dateString ===
                      selectedDate;

                    return (
                      <button
                        className={
                          isSelected
                            ? "calendar-day selected"
                            : "calendar-day"
                        }
                        key={dateString}
                        onClick={() => {
                          setSelectedDate(
                            dateString
                          );
                        }}
                      >

                        <span
                          className={
                            isToday
                              ? "day-number today"
                              : "day-number"
                          }
                        >
                          {day}
                        </span>

                        {dayApplications.length >
                          0 && (
                          <div className="calendar-applications">

                            {dayApplications
                              .slice(0, 3)
                              .map(
                                (
                                  application
                                ) => (
                                  <span
                                    className={`calendar-dot ${statusClass(
                                      application.status
                                    )}`}
                                    key={
                                      application.id
                                    }
                                    title={`${application.company} - ${application.status}`}
                                  />
                                )
                              )}

                            {dayApplications.length >
                              3 && (
                              <small>
                                +
                                {dayApplications.length -
                                  3}
                              </small>
                            )}

                          </div>
                        )}

                      </button>
                    );
                  }
                )}

              </div>

            </section>

            {/* 선택 날짜 */}

            <section className="section">

              <div className="section-title">

                <div>
                  <p className="section-label">
                    SELECTED DATE
                  </p>

                  <h2>
                    {formatDate(
                      selectedDate
                    )}
                  </h2>
                </div>

              </div>

              {applicationsForDate(
                selectedDate
              ).length === 0 ? (

                <div className="empty-box">
                  이 날 지원한 회사가 없습니다.
                </div>

              ) : (

                <div className="recent-list">

                  {applicationsForDate(
                    selectedDate
                  ).map((item) => (

                    <div
                      className="recent-item"
                      key={item.id}
                      onClick={() =>
                        editApplication(
                          item
                        )
                      }
                    >

                      <div>
                        <strong>
                          {item.company}
                        </strong>

                        <span>
                          {item.position}
                        </span>
                      </div>

                      <span
                        className={`status ${statusClass(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>

                    </div>

                  ))}

                </div>

              )}

            </section>

          </>
        )}

      </main>

      <footer>
        <p>
          생각하지 말고 그냥 넣자.
        </p>
      </footer>

    </div>
  );
}

export default App;