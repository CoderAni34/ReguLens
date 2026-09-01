import React, { useState, useEffect, useMemo } from "react";
import { getTasks, updateTask, createTask, getObligations } from "../services/api";

function Tasks() {
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    deadline: "",
    priority: "Medium",
    responsible_unit: "",
    obligation_id: "",
  });

  const fetchTasksData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksData, obsData] = await Promise.all([
        getTasks(),
        getObligations().catch(() => []),
      ]);
      setTasks(tasksData || []);
      setObligations(obsData || []);
    } catch (err) {
      console.error("Failed to load tasks:", err);
      setError(err.message || "Failed to load compliance tasks from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksData();
  }, []);

  const filteredTasks = useMemo(() => {
    if (selectedStatus === "All") {
      return tasks;
    }
    return tasks.filter(
      (task) => (task.status || "To Do").toLowerCase() === selectedStatus.toLowerCase()
    );
  }, [tasks, selectedStatus]);

  const todoCount = useMemo(
    () => tasks.filter((t) => (t.status || "").toLowerCase() === "to do").length,
    [tasks]
  );

  const inProgressCount = useMemo(
    () => tasks.filter((t) => (t.status || "").toLowerCase() === "in progress").length,
    [tasks]
  );

  const completedCount = useMemo(
    () => tasks.filter((t) => (t.status || "").toLowerCase() === "completed").length,
    [tasks]
  );

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdatingId(taskId);
    try {
      const updated = await updateTask(taskId, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: updated.status } : t))
      );
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask((prev) => ({ ...prev, status: updated.status }));
      }
    } catch (err) {
      alert(`Failed to update task status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !newTask.description.trim() || !newTask.obligation_id) {
      alert("Please fill in required fields (Task Title, Description, and Related Obligation).");
      return;
    }

    try {
      const created = await createTask({
        obligation_id: parseInt(newTask.obligation_id, 10),
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        deadline: newTask.deadline || "Not specified",
        priority: newTask.priority,
        responsible_unit: newTask.responsible_unit.trim() || "Compliance Team",
        status: "To Do",
      });

      setTasks((prev) => [created, ...prev]);
      setNewTask({
        title: "",
        description: "",
        deadline: "",
        priority: "Medium",
        responsible_unit: "",
        obligation_id: "",
      });
      setShowAddModal(false);
    } catch (err) {
      alert(`Failed to create task: ${err.message}`);
    }
  };

  return (
    <main className="obligations-page">
      {/* HEADER */}
      <div className="obligations-header">
        <div className="obligations-header-content">
          <span className="page-badge">✓ TASK MANAGEMENT</span>
          <h1>Tasks</h1>
          <p>
            Track and manage tasks required to complete your compliance obligations.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() => setShowAddModal(true)}
        >
          + Add Task
        </button>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div style={{
          backgroundColor: "rgba(239, 68, 68, 0.12)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          color: "#f87171",
          padding: "14px 18px",
          borderRadius: "8px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span>⚠️ {error}</span>
          <button
            onClick={fetchTasksData}
            style={{
              background: "rgba(239, 68, 68, 0.2)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#fff",
              padding: "4px 10px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* STATISTICS */}
      <div className="obligation-stats">
        <div className="obligation-stat-card">
          <span>Total Tasks</span>
          <strong>{tasks.length}</strong>
        </div>

        <div className="obligation-stat-card">
          <span>To Do</span>
          <strong className="warning-text">{todoCount}</strong>
        </div>

        <div className="obligation-stat-card">
          <span>In Progress</span>
          <strong className="danger-text">{inProgressCount}</strong>
        </div>

        <div className="obligation-stat-card">
          <span>Completed</span>
          <strong className="success-text">{completedCount}</strong>
        </div>
      </div>

      {/* TASK SECTION */}
      <div className="obligations-section">
        <div className="obligations-toolbar">
          <div>
            <h2>All Tasks</h2>
            <p>{filteredTasks.length} tasks found</p>
          </div>

          <div className="filter-buttons">
            {["All", "To Do", "In Progress", "Completed"].map((status) => (
              <button
                key={status}
                className={selectedStatus === status ? "filter-btn active" : "filter-btn"}
                onClick={() => setSelectedStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="obligations-divider" />

        {/* LOADING STATE */}
        {loading && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>⏳</div>
            <p>Loading tasks from compliance database...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredTasks.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">☑️</div>
            <h3>No tasks found.</h3>
            <p style={{ fontSize: "14px", maxWidth: "450px", margin: "0 auto 20px" }}>
              Upload and analyze regulatory documents to automatically derive compliance tasks.
            </p>
          </div>
        )}

        {/* TASK LIST */}
        {!loading && filteredTasks.length > 0 && (
          <div className="obligations-list">
            {filteredTasks.map((task) => {
              const displayId = `TSK-${String(task.id).padStart(3, "0")}`;
              const statusStr = task.status || "To Do";
              const statusClass = statusStr.toLowerCase().replace(" ", "-");
              const priorityClass = (task.priority || "Medium").toLowerCase();

              return (
                <div
                  className="obligation-card"
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="obligation-main">
                    <span className="obligation-id">{displayId}</span>
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                  </div>

                  <div className="obligation-info">
                    <div className="info-item">
                      <span>DEADLINE</span>
                      <strong>{task.deadline || "Not specified"}</strong>
                    </div>

                    <div className="info-item">
                      <span>PRIORITY</span>
                      <strong className={`priority ${priorityClass}`}>
                        {task.priority || "Medium"}
                      </strong>
                    </div>

                    <div className="info-item">
                      <span>STATUS</span>
                      <strong className={`obligation-status ${statusClass}`}>
                        {statusStr}
                      </strong>
                    </div>
                  </div>

                  <span className="arrow">→</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TASK DETAILS MODAL */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="obligation-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedTask(null)}>
              ×
            </button>

            <span className="obligation-id">
              {`TSK-${String(selectedTask.id).padStart(3, "0")}`}
            </span>

            <h2>{selectedTask.title}</h2>

            <p className="modal-description">{selectedTask.description}</p>

            <div className="modal-grid">
              <div>
                <span>Deadline</span>
                <strong>{selectedTask.deadline || "Not specified"}</strong>
              </div>

              <div>
                <span>Assigned To</span>
                <strong>{selectedTask.responsible_unit || "Compliance Team"}</strong>
              </div>

              <div>
                <span>Related Obligation</span>
                <strong>
                  {selectedTask.obligation_id ? `OB-${String(selectedTask.obligation_id).padStart(3, "0")}` : "N/A"}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong className={`obligation-status ${(selectedTask.status || "To Do").toLowerCase().replace(" ", "-")}`}>
                  {selectedTask.status || "To Do"}
                </strong>
              </div>
            </div>

            {/* Quick Status Update */}
            <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span className="modal-label" style={{ fontSize: "13px", marginBottom: 0 }}>Update Status:</span>
              {["To Do", "In Progress", "Completed"].map((st) => (
                <button
                  key={st}
                  disabled={updatingId === selectedTask.id}
                  onClick={() => handleStatusChange(selectedTask.id, st)}
                  className={(selectedTask.status || "To Do") === st ? "modal-status-btn active" : "modal-status-btn"}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="modal-actions" style={{ marginTop: "24px" }}>
              <button className="secondary-btn" onClick={() => setSelectedTask(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD TASK MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="obligation-modal add-obligation-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowAddModal(false)}>
              ×
            </button>

            <span className="page-badge">NEW TASK</span>

            <h2>Add Task</h2>

            <p className="modal-description">Create and assign a new compliance task.</p>

            <div className="add-form">
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  placeholder="Enter task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  rows="4"
                  placeholder="Describe the task"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Deadline</label>
                  <input
                    type="date"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Assigned To</label>
                <input
                  type="text"
                  placeholder="e.g. Compliance Team"
                  value={newTask.responsible_unit}
                  onChange={(e) => setNewTask({ ...newTask, responsible_unit: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Related Obligation *</label>
                <select
                  value={newTask.obligation_id}
                  onChange={(e) => setNewTask({ ...newTask, obligation_id: e.target.value })}
                >
                  <option value="" disabled>
                    Select obligation
                  </option>
                  {obligations.map((obs) => (
                    <option key={obs.id} value={obs.id}>
                      OB-{String(obs.id).padStart(3, "0")}: {obs.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>

              <button className="primary-btn small-btn" onClick={handleCreateTask}>
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Tasks;