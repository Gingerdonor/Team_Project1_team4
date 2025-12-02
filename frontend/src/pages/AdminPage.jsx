import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaHome,
  FaUsers,
  FaStar,
  FaChartBar,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import "./AdminPage.css";

const MBTI_TYPES = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
];

const AdminPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dashboard
  const [dashboardData, setDashboardData] = useState(null);

  // Analysis Results
  const [analysisResults, setAnalysisResults] = useState([]);
  const [analysisPage, setAnalysisPage] = useState(1);
  const [analysisTotalPages, setAnalysisTotalPages] = useState(1);
  const [analysisFilters, setAnalysisFilters] = useState({
    username: "",
    mbti: "",
  });

  // Celebrities
  const [celebrities, setCelebrities] = useState([]);
  const [celebPage, setCelebPage] = useState(1);
  const [celebTotalPages, setCelebTotalPages] = useState(1);
  const [celebFilters, setCelebFilters] = useState({
    mbti: "",
    name: "",
    tag: "",
  });

  // Modals
  const [editModal, setEditModal] = useState({
    open: false,
    type: null,
    data: null,
  });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    type: null,
    id: null,
  });

  const token = localStorage.getItem("token");

  const fetchWithAuth = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (res.status === 403) {
      setError("관리자 권한이 필요합니다.");
      throw new Error("Forbidden");
    }

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || "오류가 발생했습니다.");
    }

    return res.json();
  };

  // 대시보드 데이터 로드
  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth("/api/admin/dashboard");
      setDashboardData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 분석 결과 로드
  const loadAnalysisResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: analysisPage,
        per_page: 15,
        ...(analysisFilters.username && { username: analysisFilters.username }),
        ...(analysisFilters.mbti && { mbti: analysisFilters.mbti }),
      });

      const data = await fetchWithAuth(`/api/admin/analysis-results?${params}`);
      setAnalysisResults(data.data);
      setAnalysisTotalPages(data.total_pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 유명인 로드
  const loadCelebrities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: celebPage,
        per_page: 15,
        ...(celebFilters.mbti && { mbti: celebFilters.mbti }),
        ...(celebFilters.name && { name: celebFilters.name }),
        ...(celebFilters.tag && { tag: celebFilters.tag }),
      });

      const data = await fetchWithAuth(`/api/admin/celebrities?${params}`);
      setCelebrities(data.data);
      setCelebTotalPages(data.total_pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === "analysis") loadAnalysisResults();
    if (activeTab === "celebrities") loadCelebrities();
  }, [activeTab, analysisPage, celebPage]);

  // 분석 결과 수정
  const handleUpdateAnalysis = async (id, updateData) => {
    try {
      await fetchWithAuth(`/api/admin/analysis-results/${id}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });
      setEditModal({ open: false, type: null, data: null });
      loadAnalysisResults();
    } catch (err) {
      alert(err.message);
    }
  };

  // 분석 결과 삭제
  const handleDeleteAnalysis = async (id) => {
    try {
      await fetchWithAuth(`/api/admin/analysis-results/${id}`, {
        method: "DELETE",
      });
      setDeleteModal({ open: false, type: null, id: null });
      loadAnalysisResults();
    } catch (err) {
      alert(err.message);
    }
  };

  // 유명인 추가/수정
  const handleSaveCelebrity = async (data, isNew = false) => {
    try {
      if (isNew) {
        await fetchWithAuth("/api/admin/celebrities", {
          method: "POST",
          body: JSON.stringify(data),
        });
      } else {
        await fetchWithAuth(`/api/admin/celebrities/${data.id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
      }
      setEditModal({ open: false, type: null, data: null });
      loadCelebrities();
    } catch (err) {
      alert(err.message);
    }
  };

  // 유명인 삭제
  const handleDeleteCelebrity = async (id) => {
    try {
      await fetchWithAuth(`/api/admin/celebrities/${id}`, { method: "DELETE" });
      setDeleteModal({ open: false, type: null, id: null });
      loadCelebrities();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="admin-page">
      {/* 사이드바 */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h2>🔮 Admin</h2>
        </div>
        <nav className="admin-nav">
          <button
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <FaChartBar /> 대시보드
          </button>
          <button
            className={`nav-item ${activeTab === "analysis" ? "active" : ""}`}
            onClick={() => setActiveTab("analysis")}
          >
            <FaUsers /> 분석 결과
          </button>
          <button
            className={`nav-item ${
              activeTab === "celebrities" ? "active" : ""
            }`}
            onClick={() => setActiveTab("celebrities")}
          >
            <FaStar /> 유명인 관리
          </button>
        </nav>
        <button
          className="nav-item home-btn"
          onClick={() => navigate("/selection")}
        >
          <FaHome /> 홈으로
        </button>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="admin-main">
        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* 대시보드 탭 */}
        {activeTab === "dashboard" && dashboardData && (
          <div className="dashboard-content">
            <h1>📊 대시보드</h1>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-value">{dashboardData.total_users}</span>
                <span className="stat-label">전체 사용자</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">
                  {dashboardData.total_analyses}
                </span>
                <span className="stat-label">전체 분석</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">
                  {dashboardData.total_celebrities}
                </span>
                <span className="stat-label">등록 유명인</span>
              </div>
            </div>

            <div className="dashboard-section">
              <h3>MBTI별 유명인 수</h3>
              <div className="mbti-grid">
                {MBTI_TYPES.map((mbti) => (
                  <div key={mbti} className="mbti-stat">
                    <span className="mbti-type">{mbti}</span>
                    <span className="mbti-count">
                      {dashboardData.celebrity_by_mbti[mbti] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-section">
              <h3>최근 분석 결과</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>사용자</th>
                    <th>날짜</th>
                    <th>Persona</th>
                    <th>생성일</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recent_analyses.map((r) => (
                    <tr key={r.id}>
                      <td>{r.username}</td>
                      <td>{r.analysis_date}</td>
                      <td>
                        <span className="mbti-badge">{r.my_persona}</span>
                      </td>
                      <td>{new Date(r.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 분석 결과 탭 */}
        {activeTab === "analysis" && (
          <div className="analysis-content">
            <h1>📝 분석 결과 관리</h1>

            <div className="filters">
              <input
                type="text"
                placeholder="사용자명 검색"
                value={analysisFilters.username}
                onChange={(e) =>
                  setAnalysisFilters({
                    ...analysisFilters,
                    username: e.target.value,
                  })
                }
              />
              <select
                value={analysisFilters.mbti}
                onChange={(e) =>
                  setAnalysisFilters({
                    ...analysisFilters,
                    mbti: e.target.value,
                  })
                }
              >
                <option value="">전체 MBTI</option>
                {MBTI_TYPES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setAnalysisPage(1);
                  loadAnalysisResults();
                }}
              >
                <FaSearch /> 검색
              </button>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>사용자</th>
                  <th>날짜</th>
                  <th>Persona</th>
                  <th>Destiny</th>
                  <th>행운원소</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {analysisResults.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.username}</td>
                    <td>{r.analysis_date}</td>
                    <td>
                      <span className="mbti-badge">{r.my_persona}</span>
                    </td>
                    <td>
                      <span className="mbti-badge secondary">
                        {r.my_destiny}
                      </span>
                    </td>
                    <td>{r.lucky_element}</td>
                    <td className="actions">
                      <button
                        className="edit-btn"
                        onClick={() =>
                          setEditModal({
                            open: true,
                            type: "analysis",
                            data: r,
                          })
                        }
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() =>
                          setDeleteModal({
                            open: true,
                            type: "analysis",
                            id: r.id,
                          })
                        }
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              page={analysisPage}
              totalPages={analysisTotalPages}
              onPageChange={setAnalysisPage}
            />
          </div>
        )}

        {/* 유명인 관리 탭 */}
        {activeTab === "celebrities" && (
          <div className="celebrities-content">
            <div className="content-header">
              <h1>⭐ 유명인 관리</h1>
              <button
                className="add-btn"
                onClick={() =>
                  setEditModal({
                    open: true,
                    type: "celebrity",
                    data: {
                      mbti: "",
                      name: "",
                      tags: [],
                      description: "",
                      image_url: "",
                      isNew: true,
                    },
                  })
                }
              >
                <FaPlus /> 유명인 추가
              </button>
            </div>

            <div className="filters">
              <select
                value={celebFilters.mbti}
                onChange={(e) =>
                  setCelebFilters({ ...celebFilters, mbti: e.target.value })
                }
              >
                <option value="">전체 MBTI</option>
                {MBTI_TYPES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="이름 검색"
                value={celebFilters.name}
                onChange={(e) =>
                  setCelebFilters({ ...celebFilters, name: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="태그 검색"
                value={celebFilters.tag}
                onChange={(e) =>
                  setCelebFilters({ ...celebFilters, tag: e.target.value })
                }
              />
              <button
                onClick={() => {
                  setCelebPage(1);
                  loadCelebrities();
                }}
              >
                <FaSearch /> 검색
              </button>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>MBTI</th>
                  <th>이름</th>
                  <th>태그</th>
                  <th>설명</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {celebrities.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>
                      <span className="mbti-badge">{c.mbti}</span>
                    </td>
                    <td>{c.name}</td>
                    <td>
                      <div className="tags-cell">
                        {c.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="tag">
                            {tag}
                          </span>
                        ))}
                        {c.tags.length > 3 && (
                          <span className="tag more">+{c.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="desc-cell">{c.description}</td>
                    <td className="actions">
                      <button
                        className="edit-btn"
                        onClick={() =>
                          setEditModal({
                            open: true,
                            type: "celebrity",
                            data: c,
                          })
                        }
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() =>
                          setDeleteModal({
                            open: true,
                            type: "celebrity",
                            id: c.id,
                          })
                        }
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              page={celebPage}
              totalPages={celebTotalPages}
              onPageChange={setCelebPage}
            />
          </div>
        )}
      </main>

      {/* 수정 모달 */}
      {editModal.open && (
        <EditModal
          type={editModal.type}
          data={editModal.data}
          onClose={() => setEditModal({ open: false, type: null, data: null })}
          onSave={(data) => {
            if (editModal.type === "analysis") {
              handleUpdateAnalysis(data.id, data);
            } else {
              handleSaveCelebrity(data, data.isNew);
            }
          }}
        />
      )}

      {/* 삭제 확인 모달 */}
      {deleteModal.open && (
        <DeleteModal
          onClose={() => setDeleteModal({ open: false, type: null, id: null })}
          onConfirm={() => {
            if (deleteModal.type === "analysis") {
              handleDeleteAnalysis(deleteModal.id);
            } else {
              handleDeleteCelebrity(deleteModal.id);
            }
          }}
        />
      )}
    </div>
  );
};

// 페이지네이션 컴포넌트
const Pagination = ({ page, totalPages, onPageChange }) => (
  <div className="pagination">
    <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
      이전
    </button>
    <span>
      {page} / {totalPages}
    </span>
    <button
      disabled={page >= totalPages}
      onClick={() => onPageChange(page + 1)}
    >
      다음
    </button>
  </div>
);

// 수정 모달 컴포넌트
const EditModal = ({ type, data, onClose, onSave }) => {
  const [formData, setFormData] = useState(data);
  const [tagsInput, setTagsInput] = useState(data.tags?.join(", ") || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === "celebrity") {
      onSave({
        ...formData,
        tags: tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <FaTimes />
        </button>
        <h2>
          {type === "analysis"
            ? "분석 결과 수정"
            : data.isNew
            ? "유명인 추가"
            : "유명인 수정"}
        </h2>

        <form onSubmit={handleSubmit}>
          {type === "analysis" ? (
            <>
              <div className="form-group">
                <label>My Persona (MBTI)</label>
                <select
                  value={formData.my_persona || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, my_persona: e.target.value })
                  }
                >
                  {MBTI_TYPES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>My Destiny (MBTI)</label>
                <select
                  value={formData.my_destiny || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, my_destiny: e.target.value })
                  }
                >
                  {MBTI_TYPES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>행운의 원소</label>
                <input
                  type="text"
                  value={formData.lucky_element || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, lucky_element: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Persona 설명</label>
                <textarea
                  rows={4}
                  value={formData.persona_description || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      persona_description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Destiny 설명</label>
                <textarea
                  rows={4}
                  value={formData.destiny_description || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      destiny_description: e.target.value,
                    })
                  }
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>MBTI *</label>
                <select
                  value={formData.mbti || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, mbti: e.target.value })
                  }
                  required
                >
                  <option value="">선택하세요</option>
                  {MBTI_TYPES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>이름 *</label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>태그 (콤마로 구분)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="예: 실제인물, 남자, 가수, 한국"
                />
              </div>
              <div className="form-group">
                <label>설명</label>
                <input
                  type="text"
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>이미지 URL</label>
                <input
                  type="text"
                  value={formData.image_url || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                />
              </div>
            </>
          )}

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="save-btn">
              저장
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// 삭제 확인 모달
const DeleteModal = ({ onClose, onConfirm }) => (
  <div className="modal-overlay" onClick={onClose}>
    <motion.div
      className="modal-content delete-modal"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      onClick={(e) => e.stopPropagation()}
    >
      <h2>⚠️ 삭제 확인</h2>
      <p>정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
      <div className="modal-actions">
        <button className="cancel-btn" onClick={onClose}>
          취소
        </button>
        <button className="delete-btn" onClick={onConfirm}>
          삭제
        </button>
      </div>
    </motion.div>
  </div>
);

export default AdminPage;
