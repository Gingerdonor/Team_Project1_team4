import { motion } from "framer-motion";
import "./LoadingEffects.css";

// ===== 우주 폭발 (Cosmic Explosion) =====
export const CosmicExplosion = ({ color }) => (
  <div className="loading-effect explosion-container">
    {/* 1. 섬광 (Flash) */}
    <motion.div
      className="explosion-flash"
      animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
    />

    {/* 2. 충격파 (Shockwaves) */}
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="explosion-shockwave"
        style={{ borderColor: color }}
        animate={{
          width: [0, 300],
          height: [0, 300],
          opacity: [1, 0],
          borderWidth: [5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: i * 0.4,
          ease: "easeOut",
        }}
      />
    ))}

    {/* 3. 파편들 (Debris) */}
    {[...Array(12)].map((_, i) => {
      const debrisId = `debris-${i}`;
      return (
      <motion.div
        key={debrisId}
        style={{
          position: "absolute",
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 10px ${color}`,
        }}
        animate={{
          x: [0, (Math.random() - 0.5) * 300],
          y: [0, (Math.random() - 0.5) * 300],
          opacity: [1, 0],
          scale: [1, 0],
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
      />
    );
    })}
  </div>
);

// ===== 블랙홀 (Black Hole) =====
export const BlackHole = ({ color }) => (
  <div className="loading-effect blackhole-container">
    {/* 1. 강착 원반 (Accretion Disk) */}
    <motion.div
      className="accretion-disk"
      style={{ color }}
      animate={{ rotate: 360, scale: [1, 1.05, 1] }}
      transition={{
        rotate: { duration: 3, repeat: Infinity, ease: "linear" },
        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
      }}
    />

    {/* 2. 사건의 지평선 (Core) */}
    <div className="event-horizon-core" />

    {/* 3. 광자 고리 (Photon Ring) */}
    <div className="photon-ring" style={{ color }} />

    {/* 4. 빨려들어가는 별들 */}
    {[...Array(8)].map((_, i) => {
      const starId = `blackhole-star-${i}`;
      return (
      <motion.div
        key={starId}
        style={{
          position: "absolute",
          width: 3,
          height: 3,
          background: "#fff",
          borderRadius: "50%",
          top: "50%",
          left: "50%",
        }}
        animate={{
          rotate: [i * 45, i * 45 + 360],
          x: [100, 0],
          opacity: [1, 0],
          scale: [1, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: i * 0.2,
          ease: "easeIn",
        }}
      />
    );
    })}
  </div>
);

// ===== 퀀텀 오빗 (Quantum Orbit) =====
export const QuantumOrbit = ({ color }) => (
    <div className="loading-effect quantum-container" style={{ color }}>
      {/* 중앙 코어 */}
      <div className="quantum-core" />

      {/* 궤도 1 */}
      <motion.div
        className="quantum-orbit"
        animate={{ rotateX: [0, 360], rotateY: [0, 360], rotateZ: [0, 360] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <div className="orbit-path" />
      </motion.div>

      {/* 궤도 2 (다른 각도) */}
      <motion.div
        className="quantum-orbit"
        animate={{ rotateX: [120, 480], rotateY: [60, 420] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      >
        <div className="orbit-path" />
      </motion.div>

      {/* 궤도 3 (반대 회전) */}
      <motion.div
        className="quantum-orbit"
        animate={{ rotateX: [240, -120], rotateY: [-60, -420] }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      >
        <div className="orbit-path" />
      </motion.div>
    </div>
  );

// ===== 포탈 (Portal) =====
export const Portal = ({ color }) => (
  <div className="loading-effect portal" style={{ width: 300, height: 300 }}>
    {/* 1. 소용돌이 배경 (Blur 효과) */}
    <motion.div
      className="portal-vortex-advanced"
      style={{ color }}
      animate={{ rotate: 360, scale: [1, 1.1, 1] }}
      transition={{
        rotate: { duration: 2, repeat: Infinity, ease: "linear" },
        scale: { duration: 2, repeat: Infinity },
      }}
    />

    {/* 2. 강렬한 빛의 핵 (Core) */}
    <motion.div
      className="portal-core"
      style={{ color, background: "white" }}
      animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 0.8, repeat: Infinity }}
    />

    {/* 3. 빨려들어가는 입자들 */}
    {[...Array(12)].map((_, i) => {
      const particleId = `portal-particle-${i}`;
      return (
      <motion.div
        key={particleId}
        style={{
          position: "absolute",
          width: 4,
          height: 4,
          background: "white",
          borderRadius: "50%",
          left: "50%",
          top: "50%",
          boxShadow: `0 0 10px ${color}`,
        }}
        animate={{
          rotate: [i * 30, i * 30 + 180], // 회전하며 빨려들어감
          x: [Math.cos(i) * 100, 0], // 밖에서 안으로
          y: [Math.sin(i) * 100, 0],
          opacity: [0, 1, 0],
          scale: [0, 1, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: i * 0.1,
          ease: "easeIn",
        }}
      />
    );
    })}
  </div>
);

// ===== 은하 충돌 (Galaxy Collision) =====
export const GalaxyCollision = ({ color }) => (
  <div className="loading-effect" style={{ width: 250, height: 250 }}>
    {/* 은하 1 */}
    <motion.div
      style={{ position: "absolute", color }}
      animate={{ rotate: 360, x: [30, -30, 30], scale: [1, 0.8, 1] }}
      transition={{
        rotate: { duration: 8, repeat: Infinity, ease: "linear" },
        x: { duration: 5, repeat: Infinity, ease: "easeInOut" },
        scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <div className="galaxy-arm" style={{ top: -20, left: -60 }} />
      <div
        className="galaxy-arm"
        style={{ bottom: -20, right: -60, transform: "rotate(180deg)" }}
      />
      <div
        style={{
          position: "absolute",
          width: 20,
          height: 20,
          background: "#fff",
          borderRadius: "50%",
          boxShadow: `0 0 20px ${color}`,
        }}
      />
    </motion.div>

    {/* 은하 2 (반대 색상) */}
    <motion.div
      style={{ position: "absolute", color: "#fad0c4" }}
      animate={{ rotate: -360, x: [-30, 30, -30], scale: [0.8, 1, 0.8] }}
      transition={{
        rotate: { duration: 10, repeat: Infinity, ease: "linear" },
        x: { duration: 5, repeat: Infinity, ease: "easeInOut" },
        scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <div className="galaxy-arm" style={{ top: -20, left: -60 }} />
      <div
        className="galaxy-arm"
        style={{ bottom: -20, right: -60, transform: "rotate(180deg)" }}
      />
      <div
        style={{
          position: "absolute",
          width: 15,
          height: 15,
          background: "#fff",
          borderRadius: "50%",
          boxShadow: "0 0 20px #fad0c4",
        }}
      />
    </motion.div>
  </div>
);

// ===== 대형 카드 회전 (Spinning Card) =====
export const SpinningCard = ({ color }) => (
  <div className="loading-effect spinning-card-wrapper">
    {/* 1. 배경 마법진 (Magic Circle) */}
    <div className="magic-circle-container" style={{ color }}>
      {/* 바깥 고리 */}
      <motion.div
        className="magic-ring outer"
        animate={{ rotate: 360, scale: [1, 1.05, 1] }}
        transition={{
          rotate: { duration: 10, repeat: Infinity, ease: "linear" },
          scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
        }}
      />
      {/* 안쪽 고리 (반대 방향 회전) */}
      <motion.div
        className="magic-ring inner"
        animate={{ rotate: -360 }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
      />
    </div>

    {/* 2. 메인 카드 */}
    <motion.div
      className="spinning-card-body"
      style={{ borderColor: color }} // 테두리 색상
      animate={{
        rotateY: 360, // Y축 회전
        y: [-10, 10, -10], // 둥둥 떠있는 느낌 (Levitation)
      }}
      transition={{
        rotateY: { duration: 3, repeat: Infinity, ease: "linear" },
        y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      {/* 카드 내부 패턴 */}
      <div className="card-decoration-border" style={{ borderColor: color }} />

      <div
        className="spinning-card-pattern"
        style={{
          background: `radial-gradient(circle at center, ${color}22 0%, transparent 70%)`,
        }}
      >
        {/* 중앙 심볼 */}
        <motion.div
          className="spinning-card-center-symbol"
          style={{ color }}
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🔮
        </motion.div>
      </div>
    </motion.div>
  </div>
);

// ===== 로딩 효과 목록 =====
export const LOADING_EFFECTS = [
  { id: "card_spin", name: "운명의 카드", icon: "🃏", component: SpinningCard },
  {
    id: "explosion",
    name: "우주 폭발",
    icon: "💥",
    component: CosmicExplosion,
  },
  { id: "blackhole", name: "블랙홀", icon: "🕳️", component: BlackHole },
  { id: "portal", name: "포탈", icon: "🌀", component: Portal },
  { id: "quantum", name: "퀀텀 오빗", icon: "⚛️", component: QuantumOrbit },
  {
    id: "collision",
    name: "은하 충돌",
    icon: "🌌",
    component: GalaxyCollision,
  },
];

// ===== 메인 로딩 컴포넌트 =====
const LoadingEffect = ({
  effectId = "card_spin",
  color = "#a18cd1",
  text = "운명을 읽는 중...",
}) => {
  const effect =
    LOADING_EFFECTS.find((e) => e.id === effectId) || LOADING_EFFECTS[0];
  const EffectComponent = effect.component;

  return (
    <div className="loading-wrapper">
      <EffectComponent color={color} />
      <motion.p
        className="loading-text"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{
          marginTop: "2rem",
          fontSize: "1.2rem",
          fontWeight: "bold",
          textShadow: "0 0 10px rgba(255,255,255,0.5)",
        }}
      >
        {text}
      </motion.p>
    </div>
  );
};

export default LoadingEffect;
