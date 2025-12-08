import { useState, useEffect, useCallback } from "react";
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
  FaImage,
  FaUpload,
  FaCopy,
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
  // we don't need the loading value in this file, only setter
  const [, setLoading] = useState(false);
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

  // Images
  const [images, setImages] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);

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

  // API 호출 헬퍼
  const fetchWithAuth = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem("token");
    const headers = {
      ...(options.headers || {}),
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "요청 실패");
    }
    return res.json();
  }, []);

  // 대시보드 로드
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth("/api/admin/dashboard");
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  // 분석 결과 로드
  const loadAnalysisResults = useCallback(async () => {
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
      // console.error(err);
    } finally {
      setLoading(false);
    }
  }, [analysisPage, analysisFilters, fetchWithAuth]);

  // 유명인 로드
  const loadCelebrities = useCallback(async () => {
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
      // console.error(err);
    } finally {
      setLoading(false);
    }
  }, [celebPage, celebFilters, fetchWithAuth]);

  // 이미지 목록 로드
  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth("/api/admin/images");
      setImages(data.images || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  // 이미지 업로드
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/images", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "업로드 실패");
      }

      await loadImages();
      alert("이미지가 업로드되었습니다.");
    } catch (err) {
      alert(err.message);
    } finally {
      setImageUploading(false);
      e.target.value = "";
    }
  };

  // 이미지 삭제
  const handleImageDelete = async (filename) => {
    if (!confirm("정말 이 이미지를 삭제하시겠습니까?")) return;

    try {
      await fetchWithAuth(`/api/admin/images/${filename}`, {
        method: "DELETE",
      });
      await loadImages();
      alert("이미지가 삭제되었습니다.");
    } catch (err) {
      alert(err.message);
    }
  };

  // URL 복사
  const handleCopyUrl = (url) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl).then(
      () => alert("URL이 클립보드에 복사되었습니다."),
      () => alert("클립보드 복사에 실패했습니다.")
    );
  };

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === "dashboard") loadDashboard();
    else if (activeTab === "analysis") loadAnalysisResults();
    else if (activeTab === "celebrities") loadCelebrities();
    else if (activeTab === "images") loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // 분석 결과 수정
  const handleEditAnalysis = async (data) => {
    try {
      await fetchWithAuth(`/api/admin/analysis-results/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
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

  // 유명인 저장 (추가/수정)
  const handleSaveCelebrity = async (data) => {
    try {
      if (data.isNew) {
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

  // 파일 크기 포맷
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes  } B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)  } KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)  } MB`;
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
            type="button"
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <FaChartBar /> 대시보드
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === "analysis" ? "active" : ""}`}
            onClick={() => setActiveTab("analysis")}
          >
            <FaUsers /> 분석 결과
          </button>
          <button
            type="button"
            className={`nav-item ${
              activeTab === "celebrities" ? "active" : ""
            }`}
            onClick={() => setActiveTab("celebrities")}
          >
            <FaStar /> 유명인 관리
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === "images" ? "active" : ""}`}
            onClick={() => setActiveTab("images")}
          >
            <FaImage /> 이미지 관리
          </button>
          <button
            type="button"
            className="nav-item home-btn"
            onClick={() => navigate("/")}
          >
            <FaHome /> 홈으로
          </button>
        </nav>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="admin-main">
        {error && (
          <div className="error-banner">
            {error}
            <button type="button" onClick={() => setError(null)}>
              <FaTimes />
            </button>
          </div>
        )}

        {/* 대시보드 탭 */}
        {activeTab === "dashboard" && dashboardData && (
          <div className="dashboard-tab">
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
          <div className="analysis-tab">
            <h1>📋 분석 결과 관리</h1>

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
                type="button"
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
                        type="button"
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
                        type="button"
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
          <div className="celebrities-tab">
            <div className="content-header">
              <h1>⭐ 유명인 관리</h1>
              <button
                type="button"
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
                type="button"
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
                        {c.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="tag">
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
                        type="button"
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
                        type="button"
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

        {/* 이미지 관리 탭 */}
        {activeTab === "images" && (
          <div className="images-tab">
            <h1>🖼️ 이미지 관리</h1>

            <div className="image-upload-section">
              <label className="upload-btn">
                <FaUpload /> {imageUploading ? "업로드 중..." : "이미지 업로드"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={imageUploading}
                  style={{ display: "none" }}
                />
              </label>
              <span className="upload-hint">
                * 허용 형식: JPG, PNG, GIF, WebP (최대 5MB)
              </span>
            </div>

            <div className="image-grid">
              {images.length === 0 ? (
                <p className="no-images">업로드된 이미지가 없습니다.</p>
              ) : (
                images.map((img) => (
                  <motion.div
                    key={img.filename}
                    className="image-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="image-preview">
                      <img src={img.url} alt={img.filename} />
                    </div>
                    <div className="image-info">
                      <p className="image-filename" title={img.filename}>
                        {img.filename}
                      </p>
                      <p className="image-size">{formatFileSize(img.size)}</p>
                    </div>
                    <div className="image-actions">
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={() => handleCopyUrl(img.url)}
                        title="URL 복사"
                      >
                        <FaCopy />
                      </button>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => handleImageDelete(img.filename)}
                        title="삭제"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* 수정 모달 */}
      {editModal.open && (
        <EditModal
          type={editModal.type}
          data={editModal.data}
          onClose={() => setEditModal({ open: false, type: null, data: null })}
          onSave={
            editModal.type === "analysis"
              ? handleEditAnalysis
              : handleSaveCelebrity
          }
        />
      )}

      {/* 삭제 확인 모달 */}
      {deleteModal.open && (
        <DeleteModal
          type={deleteModal.type}
          onClose={() => setDeleteModal({ open: false, type: null, id: null })}
          onConfirm={() =>
            deleteModal.type === "analysis"
              ? handleDeleteAnalysis(deleteModal.id)
              : handleDeleteCelebrity(deleteModal.id)
          }
        />
      )}
    </div>
  );
};

// 페이지네이션 컴포넌트
const Pagination = ({ page, totalPages, onPageChange }) => (
  <div className="pagination">
    <button
      type="button"
      disabled={page <= 1}
      onClick={() => onPageChange(page - 1)}
    >
      이전
    </button>
    <span>
      {page} / {totalPages}
    </span>
    <button
      type="button"
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
    <div
      className="modal-overlay"
      onClick={onClose}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <motion.div
        className="modal-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose}>
          <FaTimes />
        </button>
        <h2>
          {(() => {
            if (type === "analysis") return "분석 결과 수정";
            if (data && data.isNew) return "유명인 추가";
            return "유명인 수정";
          })()}
        </h2>

        <form onSubmit={handleSubmit}>
          {type === "analysis" ? (
            <>
              <div className="form-group">
                <label htmlFor="my-persona">My Persona (MBTI)</label>
                <select
                  id="my-persona"
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
                <label htmlFor="my-destiny">My Destiny (MBTI)</label>
                <select
                  id="my-destiny"
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
                <label htmlFor="lucky-element">행운의 원소</label>
                <input
                  id="lucky-element"
                  type="text"
                  value={formData.lucky_element || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, lucky_element: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="persona-desc">Persona 설명</label>
                <textarea
                  id="persona-desc"
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
                <label htmlFor="destiny-desc">Destiny 설명</label>
                <textarea
                  id="destiny-desc"
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
                <label htmlFor="celeb-mbti">MBTI *</label>
                <select
                  id="celeb-mbti"
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
                <label htmlFor="celeb-name">이름 *</label>
                <input
                  id="celeb-name"
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="celeb-tags">태그 (콤마로 구분)</label>
                <input
                  id="celeb-tags"
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="예: 실제인물, 남자, 가수, 한국"
                />
              </div>
              <div className="form-group">
                <label htmlFor="celeb-desc">설명</label>
                <input
                  id="celeb-desc"
                  type="text"
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="celeb-img">이미지 URL</label>
                <input
                  id="celeb-img"
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
  <div
    className="modal-overlay"
    onClick={onClose}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === "Escape") onClose();
    }}
  >
    <motion.div
      className="modal-content delete-modal"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      onClick={(e) => e.stopPropagation()}
    >
      <h2>⚠️ 삭제 확인</h2>
      <p>정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
      <div className="modal-actions">
        <button type="button" className="cancel-btn" onClick={onClose}>
          취소
        </button>
        <button type="button" className="delete-btn" onClick={onConfirm}>
          삭제
        </button>
      </div>
    </motion.div>
  </div>
);

export default AdminPage;
