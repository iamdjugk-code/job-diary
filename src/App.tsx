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

  // 상세 정보
  jobUrl?: string;
  site?: string;
  location?: string;
  commuteMinutes?: string;
  employmentType?: string;
  workHours?: string;
  salary?: string;
  deadline?: string;
};

type TodoPriority = "high" | "normal" | "low";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
  priority: TodoPriority;
};

type TodoByDate = {
  [date: string]: Todo[];
};

type PomodoroMode = "focus" | "break" | "longBreak";

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
   const [pomodoroMessage, setPomodoroMessage] =
    useState("");

  const [activeTab, setActiveTab] = useState<
    "dashboard" | "applications" | "calendar" | "pomodoro"
  >("dashboard");
    const [selectedTodoId, setSelectedTodoId] =
    useState<number | null>(null);

  /* =========================
     할 일
  ========================= */

  const [todosByDate, setTodosByDate] = useState<TodoByDate>(() => {
    const saved = localStorage.getItem("job-diary-todos-by-date");

    if (!saved) return {};

    try {
      const parsed = JSON.parse(saved);

      return Object.fromEntries(
        Object.entries(parsed).map(([date, items]) => [
          date,
          (items as Todo[]).map((todo) => ({
            ...todo,
            priority: todo.priority || "normal",
          })),
        ])
      );
    } catch {
      return {};
    }
  });

  const [todoText, setTodoText] = useState("");
  const [todoPriority, setTodoPriority] =
    useState<TodoPriority>("normal");
  

  const [editingTodoId, setEditingTodoId] =
    useState<number | null>(null);

 const todos = [...(todosByDate[selectedDate] || [])].sort((a, b) => {
  // 완료하지 않은 할 일을 먼저 보여주기
  if (a.completed !== b.completed) {
    return a.completed ? 1 : -1;
  }

  // 같은 완료 상태에서는 우선순위 순서
  const priorityOrder = {
    high: 0,
    normal: 1,
    low: 2,
  };

  return priorityOrder[a.priority] - priorityOrder[b.priority];
});

  const selectedTodo =
    selectedTodoId !== null
      ? todos.find((todo) => todo.id === selectedTodoId)
      : null;

  /* =========================
     지원 기록
  ========================= */

  const [applications, setApplications] = useState<JobApplication[]>(() => {
    const saved = localStorage.getItem("job-diary-applications");

    if (!saved) return [];

    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [applicationDate, setApplicationDate] = useState(today);
  const [status, setStatus] =
    useState<JobStatus>("지원완료");
  const [memo, setMemo] = useState("");
  const [editingId, setEditingId] =
    useState<number | null>(null);
    const [jobUrl, setJobUrl] = useState("");
const [site, setSite] = useState("");
const [location, setLocation] = useState("");
const [commuteMinutes, setCommuteMinutes] =
  useState("");
const [employmentType, setEmploymentType] =
  useState("");
const [workHours, setWorkHours] = useState("");
const [salary, setSalary] = useState("");
const [deadline, setDeadline] = useState("");

const [detailFormOpen, setDetailFormOpen] =
  useState(false);

const [expandedApplicationId, setExpandedApplicationId] =
  useState<number | null>(null);

  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] =
    useState<"전체" | JobStatus>("전체");

  /* =========================
     달력
  ========================= */

  const [calendarDate, setCalendarDate] = useState(() => {
    const date = new Date();

    return {
      year: date.getFullYear(),
      month: date.getMonth(),
    };
  });

  /* =========================
     뽀모도로
  ========================= */

  const [focusMinutes, setFocusMinutes] = useState<number>(() => {
    const saved = localStorage.getItem("job-diary-pomodoro-focus");
    return saved ? Number(saved) : 20;
  });

  const [breakMinutes, setBreakMinutes] = useState<number>(() => {
    const saved = localStorage.getItem("job-diary-pomodoro-break");
    return saved ? Number(saved) : 10;
  });

  const [longBreakMinutes, setLongBreakMinutes] =
    useState<number>(() => {
      const saved = localStorage.getItem(
        "job-diary-pomodoro-long-break"
      );

      return saved ? Number(saved) : 20;
    });

  const [cyclesBeforeLongBreak, setCyclesBeforeLongBreak] =
    useState<number>(() => {
      const saved = localStorage.getItem(
        "job-diary-pomodoro-cycles"
      );

      return saved ? Number(saved) : 4;
    });

  const [pomodoroMode, setPomodoroMode] =
    useState<PomodoroMode>("focus");

  const [pomodoroSeconds, setPomodoroSeconds] =
    useState(focusMinutes * 60);

  const [isPomodoroRunning, setIsPomodoroRunning] =
    useState(false);

  const [completedPomodoros, setCompletedPomodoros] =
    useState<number>(() => {
      const saved = localStorage.getItem(
        "job-diary-pomodoro-completed"
      );

      return saved ? Number(saved) : 0;
    });


  const [soundEnabled, setSoundEnabled] = useState(true);

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

  useEffect(() => {
    localStorage.setItem(
      "job-diary-pomodoro-focus",
      String(focusMinutes)
    );
  }, [focusMinutes]);

  useEffect(() => {
    localStorage.setItem(
      "job-diary-pomodoro-break",
      String(breakMinutes)
    );
  }, [breakMinutes]);

  useEffect(() => {
    localStorage.setItem(
      "job-diary-pomodoro-long-break",
      String(longBreakMinutes)
    );
  }, [longBreakMinutes]);

  useEffect(() => {
    localStorage.setItem(
      "job-diary-pomodoro-cycles",
      String(cyclesBeforeLongBreak)
    );
  }, [cyclesBeforeLongBreak]);

  useEffect(() => {
    localStorage.setItem(
      "job-diary-pomodoro-completed",
      String(completedPomodoros)
    );
  }, [completedPomodoros]);

  /* =========================
     알림
  ========================= */

  const playAlarm = () => {
    if (!soundEnabled) return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;

      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();

      const playBeep = (delay: number) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = 880;

        gain.gain.setValueAtTime(
          0.0001,
          audioContext.currentTime + delay
        );

        gain.gain.exponentialRampToValueAtTime(
          0.25,
          audioContext.currentTime + delay + 0.02
        );

        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          audioContext.currentTime + delay + 0.35
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start(
          audioContext.currentTime + delay
        );

        oscillator.stop(
          audioContext.currentTime + delay + 0.4
        );
      };

      playBeep(0);
      playBeep(0.5);
      playBeep(1);

      setTimeout(() => {
        audioContext.close();
      }, 1800);
    } catch {
      // 브라우저가 소리를 허용하지 않는 경우
    }
  };

  const showNotification = (message: string) => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("🍅 JOB DIARY", {
          body: message,
        });
      }
    }
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("이 브라우저에서는 알림을 사용할 수 없어요.");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      alert("알림이 허용되었습니다.");
    }
  };

  /* =========================
     뽀모도로
  ========================= */

  useEffect(() => {
    if (!isPomodoroRunning) return;

    const timer = window.setInterval(() => {
      setPomodoroSeconds((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        playAlarm();

        if (pomodoroMode === "focus") {
          setCompletedPomodoros((count) => {
            const nextCount = count + 1;
            setPomodoroMessage("집중 시간이 끝났어요! 🍅");
            if (selectedTodoId !== null) {
  setTodosByDate((prev) => ({
    ...prev,
    [selectedDate]: (prev[selectedDate] || []).map(
      (todo) =>
        todo.id === selectedTodoId
          ? {
              ...todo,
              completed: true,
            }
          : todo
    ),
  }));

  setSelectedTodoId(null);
}

            const shouldLongBreak =
              nextCount % cyclesBeforeLongBreak === 0;

showNotification(
  shouldLongBreak
    ? "집중 시간이 끝났어요! 긴 휴식을 시작합니다."
    : "집중 시간이 끝났어요! 휴식을 시작합니다."
);

            setPomodoroMode(
              shouldLongBreak ? "longBreak" : "break"
            );

            return nextCount;
          });

          const shouldLongBreak =
            (completedPomodoros + 1) %
              cyclesBeforeLongBreak ===
            0;

          const nextBreak = shouldLongBreak
            ? longBreakMinutes
            : breakMinutes;

          return nextBreak * 60;
        }

        setPomodoroMessage(
  "휴식이 끝났어요! 다시 집중해볼까요? 🍅"
);

showNotification(
  "휴식이 끝났어요! 다시 집중해볼까요?"
);

setPomodoroMode("focus");

return focusMinutes * 60;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    isPomodoroRunning,
    pomodoroMode,
    focusMinutes,
    breakMinutes,
    longBreakMinutes,
    cyclesBeforeLongBreak,
    completedPomodoros,
    soundEnabled,
  ]);

  const formatPomodoroTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  const resetPomodoro = () => {
    setIsPomodoroRunning(false);
    setPomodoroMessage("");
    setPomodoroMode("focus");
    setPomodoroSeconds(focusMinutes * 60);
  };

  const changeFocusMinutes = (value: number) => {
    const next = Math.min(60, Math.max(1, value));

    setFocusMinutes(next);

    if (!isPomodoroRunning && pomodoroMode === "focus") {
      setPomodoroSeconds(next * 60);
    }
  };

  const changeBreakMinutes = (value: number) => {
    const next = Math.min(60, Math.max(1, value));

    setBreakMinutes(next);

    if (!isPomodoroRunning && pomodoroMode === "break") {
      setPomodoroSeconds(next * 60);
    }
  };

  const changeLongBreakMinutes = (value: number) => {
    const next = Math.min(60, Math.max(1, value));

    setLongBreakMinutes(next);

    if (
      !isPomodoroRunning &&
      pomodoroMode === "longBreak"
    ) {
      setPomodoroSeconds(next * 60);
    }
  };

  /* =========================
     할 일 기능
  ========================= */

  const priorityLabel = (priority: TodoPriority) => {
    switch (priority) {
      case "high":
        return "높음";
      case "low":
        return "낮음";
      default:
        return "보통";
    }
  };

  const addTodo = () => {
    if (!todoText.trim()) return;

    if (editingTodoId !== null) {
      saveTodoEdit();
      return;
    }

   const newTodo: Todo = {
  id: Date.now(),
  text: todoText.trim(),
  completed: false,
  priority: todoPriority,
};

    setTodosByDate((prev) => ({
      ...prev,
      [selectedDate]: [
        ...(prev[selectedDate] || []),
        newTodo,
      ],
    }));

    setTodoText("");
setTodoPriority("normal");
  };

  const toggleTodo = (id: number) => {
  setTodosByDate((prev) => ({
    ...prev,
    [selectedDate]: (prev[selectedDate] || []).map((todo) =>
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
  const todo = (todosByDate[selectedDate] || []).find(
    (item) => item.id === id
  );

  if (!todo) return;

  const confirmed = window.confirm(
    `"${todo.text}" 할 일을 삭제할까요?`
  );

  if (!confirmed) return;

  setTodosByDate((prev) => ({
    ...prev,
    [selectedDate]: (prev[selectedDate] || []).filter(
      (item) => item.id !== id
    ),
  }));

  if (selectedTodoId === id) {
    setSelectedTodoId(null);
  }

  if (editingTodoId === id) {
    cancelTodoEdit();
  }
};

  const editTodo = (todo: Todo) => {
  setTodoText(todo.text);
  setTodoPriority(todo.priority || "normal");
  setEditingTodoId(todo.id);
};

const saveTodoEdit = () => {
  if (!todoText.trim()) return;
  if (editingTodoId === null) return;

  setTodosByDate((prev) => ({
    ...prev,
    [selectedDate]: (prev[selectedDate] || []).map((todo) =>
      todo.id === editingTodoId
        ? {
            ...todo,
            text: todoText.trim(),
            priority: todoPriority,
          }
        : todo
    ),
  }));

  setTodoText("");
  setTodoPriority("normal");
  setEditingTodoId(null);
};

  const cancelTodoEdit = () => {
    setTodoText("");
    setTodoPriority("normal");
    setEditingTodoId(null);
  };

 const startTodoFocus = (todoId: number) => {
  setSelectedTodoId(todoId);
  setPomodoroMode("focus");
  setPomodoroSeconds(focusMinutes * 60);
  setIsPomodoroRunning(false);
  setActiveTab("pomodoro");
};

  /* =========================
     지원 기록 기능
  ========================= */

 const resetForm = () => {
  setCompany("");
  setPosition("");
  setApplicationDate(today);
  setStatus("지원완료");
  setMemo("");

  setJobUrl("");
  setSite("");
  setLocation("");
  setCommuteMinutes("");
  setEmploymentType("");
  setWorkHours("");
  setSalary("");
  setDeadline("");

  setDetailFormOpen(false);
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

            jobUrl: jobUrl.trim(),
            site: site.trim(),
            location: location.trim(),
            commuteMinutes: commuteMinutes.trim(),
            employmentType:
              employmentType.trim(),
            workHours: workHours.trim(),
            salary: salary.trim(),
            deadline: deadline.trim(),
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

    jobUrl: jobUrl.trim(),
    site: site.trim(),
    location: location.trim(),
    commuteMinutes: commuteMinutes.trim(),
    employmentType:
      employmentType.trim(),
    workHours: workHours.trim(),
    salary: salary.trim(),
    deadline: deadline.trim(),
  };

  setApplications((prev) => [
    newApplication,
    ...prev,
  ]);
}

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

    resetForm();
  };

  const editApplication = (item: JobApplication) => {
  setCompany(item.company);
  setPosition(item.position);
  setApplicationDate(item.date);
  setStatus(item.status);
  setMemo(item.memo);

  setJobUrl(item.jobUrl || "");
  setSite(item.site || "");
  setLocation(item.location || "");
  setCommuteMinutes(item.commuteMinutes || "");
  setEmploymentType(item.employmentType || "");
  setWorkHours(item.workHours || "");
  setSalary(item.salary || "");
  setDeadline(item.deadline || "");

  setDetailFormOpen(
    Boolean(
      item.jobUrl ||
      item.site ||
      item.location ||
      item.commuteMinutes ||
      item.employmentType ||
      item.workHours ||
      item.salary ||
      item.deadline
    )
  );

  setEditingId(item.id);
  setActiveTab("applications");

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

  const deleteApplication = (id: number) => {
    const confirmed = window.confirm(
      "이 지원 기록을 삭제할까요?"
    );

    if (!confirmed) return;

    setApplications((prev) =>
      prev.filter((item) => item.id !== id)
    );

    if (editingId === id) {
      resetForm();
    }
  };

  /* =========================
     통계
  ========================= */

  const totalApplications = applications.length;

  const documentPassed = applications.filter(
    (item) => item.status === "서류 합격"
  ).length;

  const interviews = applications.filter(
    (item) => item.status === "면접 예정"
  ).length;

  const finalPassed = applications.filter(
    (item) => item.status === "최종 합격"
  ).length;

  const finalFailed = applications.filter(
    (item) => item.status === "최종 탈락"
  ).length;

  const decidedApplications =
    documentPassed + finalFailed + finalPassed;

  const documentRate =
    totalApplications === 0
      ? 0
      : Math.round(
          (documentPassed / totalApplications) * 100
        );

  const finalRate =
    totalApplications === 0
      ? 0
      : Math.round(
          (finalPassed / totalApplications) * 100
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
     진행률
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

    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= lastDate; day++) {
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
      String(calendarDate.month + 1).padStart(2, "0"),
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

  const statusClass = (
    jobStatus: JobStatus
  ) => {
    switch (jobStatus) {
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

  const pomodoroTitle =
    pomodoroMode === "focus"
      ? "집중 시간"
      : pomodoroMode === "break"
      ? "휴식 시간"
      : "긴 휴식";

  /* =========================
     화면
  ========================= */

  return (
    <div className="app">

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
            하나씩 기록하고, 하나씩 앞으로.
          </p>

        </div>
      </header>

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

        <button
          className={
            activeTab === "pomodoro"
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() =>
            setActiveTab("pomodoro")
          }
        >
          🍅 집중
        </button>

      </nav>

      <main className="container">

        {/* =========================
            DASHBOARD
        ========================= */}

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
                    {completedTodos} / {todos.length} 완료
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
                  <span>전체 지원</span>
                  <strong>
                    {totalApplications}
                  </strong>
                </div>

                <div className="summary-card">
                  <span>서류 합격</span>
                  <strong>
                    {documentPassed}
                  </strong>
                </div>

                <div className="summary-card">
                  <span>면접 예정</span>
                  <strong>
                    {interviews}
                  </strong>
                </div>

                <div className="summary-card">
                  <span>최종 합격</span>
                  <strong>
                    {finalPassed}
                  </strong>
                </div>

              </div>

            </section>

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
                    <span>서류 합격률</span>
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
                    <span>최종 합격률</span>
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

            {/* 오늘의 할 일 */}

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

                <span className="todo-count">
                  {todos.length}
                </span>

              </div>

             <div className="todo-input">

  <input
    value={todoText}
    placeholder={
      editingTodoId !== null
        ? "할 일을 수정해보세요"
        : "오늘 할 일을 적어보세요"
    }
    onChange={(e) =>
      setTodoText(e.target.value)
    }
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        if (editingTodoId !== null) {
          saveTodoEdit();
        } else {
          addTodo();
        }
      }
    }}
  />

  <select
  className="priority-select"
  value={todoPriority}
  onChange={(e) =>
    setTodoPriority(
      e.target.value as TodoPriority
    )
  }
>
  <option value="high">🔴 높음</option>
  <option value="normal">🟡 보통</option>
  <option value="low">🟢 낮음</option>
</select>

  {editingTodoId !== null ? (
    <>
      <button onClick={saveTodoEdit}>
        저장
      </button>

      <button
        className="todo-cancel-button"
        onClick={cancelTodoEdit}
      >
        취소
      </button>
    </>
  ) : (
    <button onClick={addTodo}>
      추가
    </button>
  )}

</div>
            

              <div className="todo-list">

                {todos.length === 0 ? (
                  <div className="empty">
                    아직 등록된 할 일이 없어요.
                  </div>
                ) : (
                  todos.map((todo) => (

                    <div
                      className={`todo-item priority-${todo.priority}`}
                      key={todo.id}
                    >

                      <button
                        className={
                          todo.completed
                            ? "check checked"
                            : "check"
                        }
                        onClick={() =>
                          toggleTodo(todo.id)
                        }
                      >
                        {todo.completed ? "✓" : ""}
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

                      <span className="todo-priority">
                        {priorityLabel(
                          todo.priority
                        )}
                      </span>

                      {!todo.completed && (
                        <button
                          className="todo-focus-button"
                          onClick={() =>
                            startTodoFocus(todo.id)
                          }
                        >
                          🍅 집중
                        </button>
                      )}

                      <button
                        className="todo-edit-button"
                        onClick={() =>
                          editTodo(todo)
                        }
                      >
                        수정
                      </button>

                      <button
                        className="delete-button"
                        onClick={() =>
                          deleteTodo(todo.id)
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

        {/* =========================
            POMODORO
        ========================= */}

        {activeTab === "pomodoro" && (
          <>

            <section className="section">

              <div className="section-title">

                <div>

                  <p className="section-label">
                    POMODORO
                  </p>

                  <h2>
                    🍅 집중
                  </h2>

                </div>

                <span className="pomodoro-count">
                  {completedPomodoros}
                </span>

              </div>
              {selectedTodo ? (
  <div className="selected-todo-box">

    <div className="selected-todo-content">
      <span>
        지금 할 일
      </span>

      <strong>
        {selectedTodo.text}
      </strong>
    </div>

    <button
      type="button"
      className="selected-todo-clear"
      onClick={() => {
        setSelectedTodoId(null);
        setIsPomodoroRunning(false);
        setPomodoroMode("focus");
        setPomodoroSeconds(focusMinutes * 60);
      }}
    >
      해제
    </button>

  </div>
) : (
  <div className="selected-todo-empty">
    <span>지금 집중할 일이 없어요.</span>
    <small>
      대시보드에서 🍅 집중을 눌러보세요.
    </small>
  </div>
)}

              <div className="pomodoro-card">

                <p className="pomodoro-mode">
                  {pomodoroTitle}
                </p>

                <div className="pomodoro-time">
                  {selectedTodoId !== null && (
  <div className="pomodoro-selected-todo">
    {(
      todosByDate[selectedDate] || []
    ).find(
      (todo) => todo.id === selectedTodoId
    )?.text}
  </div>
)}
                  {formatPomodoroTime(
                    pomodoroSeconds
                  )}
                </div>
               

                <div className="pomodoro-buttons">

                  <button
  className="pomodoro-start"
  onClick={() => {
    if (!isPomodoroRunning) {
      setPomodoroMessage("");
    }

    setIsPomodoroRunning(
      !isPomodoroRunning
    );
  }}
>
  {isPomodoroRunning
    ? "일시정지"
    : "시작"}
</button>

                  <button
                    className="pomodoro-reset"
                    onClick={resetPomodoro}
                  >
                    초기화
                  </button>

                </div>
                {pomodoroMessage && (
  <div className="pomodoro-message">
    {pomodoroMessage}
  </div>
)}

                <p className="pomodoro-description">
                  {pomodoroMode === "focus"
                    ? "집중해서 하나만 해보세요."
                    : "잠깐 쉬어도 괜찮아요."}
                </p>

              </div>

            </section>

            <section className="section">

              <div className="section-title">

                <div>

                  <p className="section-label">
                    SETTINGS
                  </p>

                  <h2>
                    타이머 설정
                  </h2>

                </div>

              </div>

              <div className="timer-settings">

                <div className="setting-row">

                  <span>
                    집중 시간
                  </span>

                  <div className="setting-control">

                    <button
                      onClick={() =>
                        changeFocusMinutes(
                          focusMinutes - 1
                        )
                      }
                    >
                      −
                    </button>

                    <strong>
                      {focusMinutes}분
                    </strong>

                    <button
                      onClick={() =>
                        changeFocusMinutes(
                          focusMinutes + 1
                        )
                      }
                    >
                      ＋
                    </button>

                  </div>

                </div>

                <div className="setting-row">

                  <span>
                    짧은 휴식
                  </span>

                  <div className="setting-control">

                    <button
                      onClick={() =>
                        changeBreakMinutes(
                          breakMinutes - 1
                        )
                      }
                    >
                      −
                    </button>

                    <strong>
                      {breakMinutes}분
                    </strong>

                    <button
                      onClick={() =>
                        changeBreakMinutes(
                          breakMinutes + 1
                        )
                      }
                    >
                      ＋
                    </button>

                  </div>

                </div>

                <div className="setting-row">

                  <span>
                    긴 휴식
                  </span>

                  <div className="setting-control">

                    <button
                      onClick={() =>
                        changeLongBreakMinutes(
                          longBreakMinutes - 1
                        )
                      }
                    >
                      −
                    </button>

                    <strong>
                      {longBreakMinutes}분
                    </strong>

                    <button
                      onClick={() =>
                        changeLongBreakMinutes(
                          longBreakMinutes + 1
                        )
                      }
                    >
                      ＋
                    </button>

                  </div>

                </div>

                <div className="setting-row">

                  <span>
                    긴 휴식 주기
                  </span>

                  <div className="setting-control">

                    <button
                      onClick={() =>
                        setCyclesBeforeLongBreak(
                          Math.max(
                            1,
                            cyclesBeforeLongBreak - 1
                          )
                        )
                      }
                    >
                      −
                    </button>

                    <strong>
                      {cyclesBeforeLongBreak}회
                    </strong>

                    <button
                      onClick={() =>
                        setCyclesBeforeLongBreak(
                          Math.min(
                            10,
                            cyclesBeforeLongBreak + 1
                          )
                        )
                      }
                    >
                      ＋
                    </button>

                  </div>

                </div>

                <div className="setting-row">

                  <span>
                    종료 알림 소리
                  </span>

                  <button
                    className={
                      soundEnabled
                        ? "sound-toggle on"
                        : "sound-toggle"
                    }
                    onClick={() =>
                      setSoundEnabled(
                        !soundEnabled
                      )
                    }
                  >
                    {soundEnabled
                      ? "켜짐"
                      : "꺼짐"}
                  </button>

                </div>

                <button
                  className="notification-button"
                  onClick={
                    requestNotificationPermission
                  }
                >
                  🔔 브라우저 알림 허용
                </button>
                <button
  className="pomodoro-clear-count-button"
  onClick={() => {
    setCompletedPomodoros(0);
  }}
>
  집중 횟수 초기화
</button>

              </div>

              <p className="setting-help">
                기본값은 집중 20분 + 휴식 10분이에요.
              </p>

            </section>

          </>
        )}

        {/* =========================
            APPLICATIONS
        ========================= */}

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
                      setCompany(e.target.value)
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
                      setPosition(e.target.value)
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
                        e.target.value as JobStatus
                      )
                    }
                  >

                    {statusList.map((item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    ))}

                  </select>

                </div>
                <div className="application-detail-toggle">
  <button
    type="button"
    onClick={() =>
      setDetailFormOpen(!detailFormOpen)
    }
  >
    {detailFormOpen
      ? "− 상세 정보 접기"
      : "＋ 상세 정보 추가"}
  </button>
</div>

{detailFormOpen && (
  <div className="application-detail-form">

    <div className="input-group">
      <label>채용 사이트</label>
      <input
        value={site}
        placeholder="예: 사람인"
        onChange={(e) =>
          setSite(e.target.value)
        }
      />
    </div>

    <div className="input-group">
      <label>근무 지역</label>
      <input
        value={location}
        placeholder="예: 서울 마포구"
        onChange={(e) =>
          setLocation(e.target.value)
        }
      />
    </div>

    <div className="input-group">
      <label>편도 소요시간</label>
      <input
        value={commuteMinutes}
        placeholder="예: 1시간 20분"
        onChange={(e) =>
          setCommuteMinutes(e.target.value)
        }
      />
    </div>

    <div className="input-group">
      <label>고용 형태</label>
      <input
        value={employmentType}
        placeholder="예: 정규직"
        onChange={(e) =>
          setEmploymentType(e.target.value)
        }
      />
    </div>

    <div className="input-group">
      <label>근무 시간</label>
      <input
        value={workHours}
        placeholder="예: 09:00 ~ 18:00"
        onChange={(e) =>
          setWorkHours(e.target.value)
        }
      />
    </div>

    <div className="input-group">
      <label>연봉 / 급여</label>
      <input
        value={salary}
        placeholder="예: 3,000만원"
        onChange={(e) =>
          setSalary(e.target.value)
        }
      />
    </div>

    <div className="input-group">
      <label>마감일</label>
      <input
        type="date"
        value={deadline}
        onChange={(e) =>
          setDeadline(e.target.value)
        }
      />
    </div>

    <div className="input-group">
      <label>채용공고 주소</label>
      <input
        value={jobUrl}
        placeholder="채용공고 URL을 붙여넣으세요"
        onChange={(e) =>
          setJobUrl(e.target.value)
        }
      />
    </div>

  </div>
)}

                <div className="input-group full">

                  <label>
                    메모
                  </label>

                  <textarea
                    value={memo}
                    placeholder="채용공고 특징이나 면접 메모 등을 적어보세요."
                    onChange={(e) =>
                      setMemo(e.target.value)
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
                    onClick={saveApplication}
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
                    setSearchText(e.target.value)
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
                    setFilterStatus("전체")
                  }
                >
                  전체
                </button>

                {statusList.map((item) => (
                  <button
                    key={item}
                    className={
                      filterStatus === item
                        ? "filter-button active"
                        : "filter-button"
                    }
                    onClick={() =>
                      setFilterStatus(item)
                    }
                  >
                    {item}
                  </button>
                ))}

              </div>

            </section>

            <section className="section">

              <div className="application-list">

                {filteredApplications.length === 0 ? (
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
                                editApplication(item)
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
                        <div className="application-detail-button">
  <button
    type="button"
    onClick={() =>
      setExpandedApplicationId(
        expandedApplicationId === item.id
          ? null
          : item.id
      )
    }
  >
    {expandedApplicationId === item.id
      ? "상세 정보 접기"
      : "상세 정보 보기"}
  </button>
</div>

{expandedApplicationId === item.id && (
  <div className="application-detail">

    {item.site && (
      <div>
        <span>채용 사이트</span>
        <strong>{item.site}</strong>
      </div>
    )}

    {item.location && (
      <div>
        <span>근무 지역</span>
        <strong>{item.location}</strong>
      </div>
    )}

    {item.commuteMinutes && (
      <div>
        <span>편도 소요시간</span>
        <strong>
          {item.commuteMinutes}
        </strong>
      </div>
    )}

    {item.employmentType && (
      <div>
        <span>고용 형태</span>
        <strong>
          {item.employmentType}
        </strong>
      </div>
    )}

    {item.workHours && (
      <div>
        <span>근무 시간</span>
        <strong>
          {item.workHours}
        </strong>
      </div>
    )}

    {item.salary && (
      <div>
        <span>연봉 / 급여</span>
        <strong>
          {item.salary}
        </strong>
      </div>
    )}

    {item.deadline && (
      <div>
        <span>마감일</span>
        <strong>
          {item.deadline}
        </strong>
      </div>
    )}

    {item.jobUrl && (
      <a
        className="job-link"
        href={item.jobUrl}
        target="_blank"
        rel="noreferrer"
      >
        채용공고 열기 ↗
      </a>
    )}

  </div>
)}

                      </article>

                    )
                  )
                )}

              </div>

            </section>

          </>
        )}

        {/* =========================
            CALENDAR
        ========================= */}

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
                onClick={() =>
                  goToCalendarDate(today)
                }
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
                      dateString === selectedDate;

                    return (
                      <button
                        className={
                          isSelected
                            ? "calendar-day selected"
                            : "calendar-day"
                        }
                        key={dateString}
                        onClick={() =>
                          setSelectedDate(
                            dateString
                          )
                        }
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

                        {dayApplications.length > 0 && (
                          <div className="calendar-applications">

                            {dayApplications
                              .slice(0, 3)
                              .map(
                                (application) => (
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
                                {dayApplications.length - 3}
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

            <section className="section">

              <div className="section-title">

                <div>

                  <p className="section-label">
                    SELECTED DATE
                  </p>

                  <h2>
                    {formatDate(selectedDate)}
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
                        editApplication(item)
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
        생각하지 말고 그냥 넣자.
      </footer>

    </div>
  );
}

export default App;