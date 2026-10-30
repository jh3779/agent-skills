// 프로젝트 관리 대시보드 - 작업 목록 화면 상단 (모바일·데스크톱 공용)
import "./TaskHeader.css";

export default function TaskHeader({ onCreate, onDeleteAll, onExport, onImport, onShare, onArchive, onSettings }) {
  return (
    <div className="task-header">
      <h2 className="title">My Tasks</h2>
      <span className="badge new">NEW</span>
      <span className="badge hot">HOT</span>

      <div className="toolbar">
        <button className="btn primary" onClick={onExport}>Export</button>
        <button className="btn primary" onClick={onImport}>Import</button>
        <button className="btn primary" onClick={onShare}>Share</button>
        <button className="btn primary" onClick={onArchive}>Archive</button>
        <button className="btn primary" onClick={onCreate}>+ New Task</button>
        <button className="btn primary" onClick={onDeleteAll}>Delete All</button>
        <div className="icon" onClick={onSettings}>⚙</div>
      </div>

      <div className="filters">
        <label>Status</label><label>Priority</label><label>Assignee</label>
        <select><option>All</option></select>
        <select><option>All</option></select>
        <select><option>All</option></select>
        <label>Due</label><select><option>All</option></select>
        <label>Tag</label><select><option>All</option></select>
        <label>Project</label><select><option>All</option></select>
        <label>Sprint</label><select><option>All</option></select>
      </div>
    </div>
  );
}
