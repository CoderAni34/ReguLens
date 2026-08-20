import React, { useState } from "react";

function Tasks() {
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const tasks = [
    {
      id: "TSK-001",
      title: "Prepare annual compliance report",
      description:
        "Collect required information and prepare the annual compliance report.",
      deadline: "10 Dec 2026",
      priority: "High",
      status: "To Do",
      obligation: "OB-001",
      assignedTo: "Compliance Team",
    },
    {
      id: "TSK-002",
      title: "Collect supporting documents",
      description:
        "Gather all required records and supporting documents for submission.",
      deadline: "12 Dec 2026",
      priority: "High",
      status: "In Progress",
      obligation: "OB-001",
      assignedTo: "Operations Team",
    },
    {
      id: "TSK-003",
      title: "Review documentation requirements",
      description:
        "Review the required documentation and identify missing records.",
      deadline: "20 Dec 2026",
      priority: "Medium",
      status: "To Do",
      obligation: "OB-002",
      assignedTo: "Documentation Team",
    },
    {
      id: "TSK-004",
      title: "Update compliance policies",
      description:
        "Update internal compliance policies based on regulatory requirements.",
      deadline: "05 Jan 2027",
      priority: "High",
      status: "In Progress",
      obligation: "OB-003",
      assignedTo: "Legal Team",
    },
    {
      id: "TSK-005",
      title: "Complete internal review",
      description:
        "Perform the final internal compliance review and prepare findings.",
      deadline: "18 Jan 2027",
      priority: "Low",
      status: "Completed",
      obligation: "OB-004",
      assignedTo: "Internal Audit",
    },
  ];

  const filteredTasks =
    selectedStatus === "All"
      ? tasks
      : tasks.filter((task) => task.status === selectedStatus);

  const todoCount = tasks.filter(
    (task) => task.status === "To Do"
  ).length;

  const inProgressCount = tasks.filter(
    (task) => task.status === "In Progress"
  ).length;

  const completedCount = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  return (
    <main className="obligations-page">
      {/* HEADER */}
      <div className="obligations-header">
        <div className="obligations-header-content">
          <span className="page-badge">
            ✓ TASK MANAGEMENT
          </span>

          <h1>Tasks</h1>

          <p>
            Track and manage tasks required to complete your compliance
            obligations.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() => setShowAddModal(true)}
        >
          + Add
          <br />
          Task
        </button>
      </div>

      {/* STATISTICS */}
      <div className="obligation-stats">
        <div className="obligation-stat-card">
          <span>Total Tasks</span>
          <strong>{tasks.length}</strong>
        </div>

        <div className="obligation-stat-card">
          <span>To Do</span>
          <strong className="warning-text">
            {todoCount}
          </strong>
        </div>

        <div className="obligation-stat-card">
          <span>In Progress</span>
          <strong className="danger-text">
            {inProgressCount}
          </strong>
        </div>

        <div className="obligation-stat-card">
          <span>Completed</span>
          <strong className="success-text">
            {completedCount}
          </strong>
        </div>
      </div>

      {/* TASK SECTION */}
      <div className="obligations-section">
        <div className="obligations-toolbar">
          <div>
            <h2>All Tasks</h2>

            <p>
              {filteredTasks.length} tasks found
            </p>
          </div>

          <div className="filter-buttons">
            {[
              "All",
              "To Do",
              "In Progress",
              "Completed",
            ].map((status) => (
              <button
                key={status}
                className={
                  selectedStatus === status
                    ? "filter-btn active"
                    : "filter-btn"
                }
                onClick={() => setSelectedStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="obligations-divider" />

        {/* TASK LIST */}
        <div className="obligations-list">
          {filteredTasks.map((task) => (
            <div
              className="obligation-card"
              key={task.id}
              onClick={() => setSelectedTask(task)}
            >
              <div className="obligation-main">
                <span className="obligation-id">
                  {task.id}
                </span>

                <h3>{task.title}</h3>

                <p>{task.description}</p>
              </div>

              <div className="obligation-info">
                <div className="info-item">
                  <span>DEADLINE</span>

                  <strong>{task.deadline}</strong>
                </div>

                <div className="info-item">
                  <span>PRIORITY</span>

                  <strong
                    className={`priority ${task.priority.toLowerCase()}`}
                  >
                    {task.priority}
                  </strong>
                </div>

                <div className="info-item">
                  <span>STATUS</span>

                  <strong
                    className={`obligation-status ${task.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {task.status}
                  </strong>
                </div>
              </div>

              <span className="arrow">
                →
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* TASK DETAILS MODAL */}
      {selectedTask && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="obligation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-modal"
              onClick={() => setSelectedTask(null)}
            >
              ×
            </button>

            <span className="obligation-id">
              {selectedTask.id}
            </span>

            <h2>{selectedTask.title}</h2>

            <p className="modal-description">
              {selectedTask.description}
            </p>

            <div className="modal-grid">
              <div>
                <span>Deadline</span>

                <strong>
                  {selectedTask.deadline}
                </strong>
              </div>

              <div>
                <span>Assigned To</span>

                <strong>
                  {selectedTask.assignedTo}
                </strong>
              </div>

              <div>
                <span>Related Obligation</span>

                <strong>
                  {selectedTask.obligation}
                </strong>
              </div>

              <div>
                <span>Status</span>

                <strong
                  className={`obligation-status ${selectedTask.status
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {selectedTask.status}
                </strong>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setSelectedTask(null)}
              >
                Close
              </button>

              <button className="primary-btn small-btn">
                Edit Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD TASK MODAL */}
      {showAddModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="obligation-modal add-obligation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-modal"
              onClick={() => setShowAddModal(false)}
            >
              ×
            </button>

            <span className="page-badge">
              NEW TASK
            </span>

            <h2>Add Task</h2>

            <p className="modal-description">
              Create and assign a new compliance task.
            </p>

            <div className="add-form">
              <div className="form-group">
                <label>Task Title</label>

                <input
                  type="text"
                  placeholder="Enter task title"
                />
              </div>

              <div className="form-group">
                <label>Description</label>

                <textarea
                  rows="4"
                  placeholder="Describe the task"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Deadline</label>

                  <input type="date" />
                </div>

                <div className="form-group">
                  <label>Priority</label>

                  <select defaultValue="Medium">
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
                />
              </div>

              <div className="form-group">
                <label>Related Obligation</label>

                <select defaultValue="">
                  <option value="" disabled>
                    Select obligation
                  </option>

                  <option>OB-001</option>
                  <option>OB-002</option>
                  <option>OB-003</option>
                  <option>OB-004</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>

              <button
                className="primary-btn small-btn"
                onClick={() => setShowAddModal(false)}
              >
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