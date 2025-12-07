import { motion } from "framer-motion";
import { useMemo } from "react";
import "./LoadingEffects.css";

// ===== 1. 우주 폭발 (Cosmic Explosion) =====
export const CosmicExplosion = ({ color }) => {
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        angle: (i / 20) * 360,
        distance: 80 + Math.random() * 40,
        size: 4 + Math.random() * 8,
        isColored: i % 2 === 0,
        delay: Math.random() * 0.3,
      })),
    []
  );

  return (
    <div className="loading-effect cosmic-explosion">
      <motion.div
        className="explosion-core"
        style={{ background: color }}
        animate={{
          scale: [0, 1.5, 0.8, 1.2, 1],
          opacity: [1, 0.8, 1, 0.9, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 0.5,
        }}
      />
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="explosion-particle"
          style={{
            background: p.isColored ? color : "#fff",
            width: p.size,
            height: p.size,
          }}
          animate={{
            x: [0, Math.cos((p.angle * Math.PI) / 180) * p.distance, 0],
            y: [0, Math.sin((p.angle * Math.PI) / 180) * p.distance, 0],
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: p.delay,
            repeatDelay: 0.5,
          }}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`ring-${i}`}
          className="explosion-ring"
          style={{ borderColor: color }}
          animate={{
            scale: [0, 3],
            opacity: [1, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.3,
            repeatDelay: 0.5,
          }}
        />
      ))}
    </div>
  );
};

// ===== 2. 불꽃놀이 (Fireworks) =====
export const Fireworks = ({ color }) => {
  const fireworkGroups = useMemo(
    () => {
      const colors = [color, "#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff"];
      return Array.from({ length: 5 }, (groupIdx, idx) => ({
        id: idx,
        left: 20 + idx * 15,
        top: 30 + (idx % 2) * 20,
        color: colors[idx % colors.length],
        sparks: Array.from({ length: 12 }, (_, sparkIdx) => ({
          id: sparkIdx,
          angle: (sparkIdx / 12) * 360,
        })),
      }));
    },
    [color]
  );

  return (
    <div className="loading-effect fireworks">
      {fireworkGroups.map((group) => (
        <div
          key={group.id}
          className="firework-group"
          style={{
            left: `${group.left}%`,
            top: `${group.top}%`,
          }}
        >
          {group.sparks.map((spark) => (
            <motion.div
              key={spark.id}
              className="firework-spark"
              style={{ background: group.color }}
              animate={{
                x: [0, Math.cos((spark.angle * Math.PI) / 180) * 50],
                y: [0, Math.sin((spark.angle * Math.PI) / 180) * 50],
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: group.id * 0.4,
                repeatDelay: 1.5,
              }}
            />
          ))}
          <motion.div
            className="firework-center"
            style={{ background: group.color }}
            animate={{
              scale: [0, 1.5, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              delay: group.id * 0.4,
              repeatDelay: 1.5,
            }}
          />
        </div>
      ))}
    </div>
  );
};

// ===== 3. 에너지 폭발 (Energy Burst) =====
export const EnergyBurst = ({ color }) => {
  const sparks = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 2,
        repeatDelay: Math.random(),
      })),
    []
  );

  return (
    <div className="loading-effect energy-burst">
      <motion.div
        className="energy-core"
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          boxShadow: `0 0 60px ${color}`,
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
        }}
      />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <motion.div
          key={i}
          className="energy-beam"
          style={{
            background: `linear-gradient(90deg, ${color}, transparent)`,
            transform: `rotate(${i * 45}deg)`,
          }}
          animate={{
            scaleX: [0, 1.5, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
      {sparks.map((spark) => (
        <motion.div
          key={spark.id}
          className="electric-spark"
          style={{
            background: color,
            left: `${spark.left}%`,
            top: `${spark.top}%`,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
            delay: spark.delay,
            repeatDelay: spark.repeatDelay,
          }}
        />
      ))}
    </div>
  );
};

// ===== 4. 블랙홀 (Black Hole) =====
export const BlackHole = ({ color }) => {
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => {
        const startAngle = (i / 30) * 360;
        const startDistance = 100 + Math.random() * 30;
        return {
          id: i,
          startX: Math.cos((startAngle * Math.PI) / 180) * startDistance,
          startY: Math.sin((startAngle * Math.PI) / 180) * startDistance,
          color: i % 3 === 0 ? color : "#fff",
          duration: 2 + Math.random(),
        };
      }),
    [color]
  );

  return (
    <div className="loading-effect black-hole">
      <motion.div
        className="event-horizon"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        <div className="accretion-disk" style={{ borderColor: color }} />
      </motion.div>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absorbed-particle"
          style={{ background: particle.color }}
          animate={{
            x: [particle.startX, 0],
            y: [particle.startY, 0],
            scale: [1, 0],
            opacity: [1, 0],
            rotate: [0, 720],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.id * 0.1,
            ease: "easeIn",
          }}
        />
      ))}
      <div className="singularity" />
    </div>
  );
};

// ===== 5. 피닉스 (Phoenix) =====
export const Phoenix = ({ color }) => {
  const fireParticles = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => ({
        id: i,
        colorType: i % 3,
        left: 30 + Math.random() * 40,
        yEnd: -100 - Math.random() * 50,
        xStart: (Math.random() - 0.5) * 60,
        xEnd: (Math.random() - 0.5) * 100,
        duration: 1 + Math.random(),
        delay: Math.random() * 0.5,
      })),
    []
  );

  const getFireColor = (type) => {
    if (type === 0) return color;
    if (type === 1) return "#ff6b35";
    return "#f7c815";
  };

  return (
    <div className="loading-effect phoenix">
      <motion.div
        className="phoenix-wing left"
        style={{
          background: `linear-gradient(135deg, ${color}, #ff6b35, #f7c815)`,
        }}
        animate={{
          rotate: [-15, 15, -15],
          scale: [0.9, 1.1, 0.9],
        }}
        transition={{ duration: 1, repeat: Infinity }}
      />
      <motion.div
        className="phoenix-wing right"
        style={{
          background: `linear-gradient(-135deg, ${color}, #ff6b35, #f7c815)`,
        }}
        animate={{
          rotate: [15, -15, 15],
          scale: [0.9, 1.1, 0.9],
        }}
        transition={{ duration: 1, repeat: Infinity }}
      />
      {fireParticles.map((p) => (
        <motion.div
          key={p.id}
          className="fire-particle"
          style={{
            background: getFireColor(p.colorType),
            left: `${p.left}%`,
          }}
          animate={{
            y: [0, p.yEnd],
            x: [p.xStart, p.xEnd],
            scale: [1, 0],
            opacity: [1, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
          }}
        />
      ))}
      <motion.div
        className="phoenix-core"
        style={{ background: color }}
        animate={{
          scale: [1, 1.3, 1],
          boxShadow: [
            `0 0 30px ${color}`,
            `0 0 60px ${color}`,
            `0 0 30px ${color}`,
          ],
        }}
        transition={{ duration: 0.5, repeat: Infinity }}
      />
    </div>
  );
};

// ===== 6. 번개 폭풍 (Lightning Storm) =====
export const LightningStorm = ({ color }) => (
  <div className="loading-effect lightning-storm">
    <div className="storm-clouds">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="cloud"
          style={{ left: `${i * 30}%` }}
          animate={{ x: [-10, 10, -10] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
        />
      ))}
    </div>
    {[0, 1, 2].map((i) => (
      <motion.svg
        key={i}
        className="lightning-bolt"
        viewBox="0 0 50 100"
        style={{ left: `${20 + i * 25}%` }}
        animate={{
          opacity: [0, 1, 1, 0],
          scaleY: [0.5, 1, 1, 0.5],
        }}
        transition={{
          duration: 0.3,
          repeat: Infinity,
          delay: i * 0.8,
          repeatDelay: 1.5,
        }}
      >
        <path
          d="M25 0 L15 40 L25 35 L10 100 L35 50 L25 55 L40 0 Z"
          fill={color}
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
        />
      </motion.svg>
    ))}
    <motion.div
      className="lightning-flash"
      animate={{ opacity: [0, 0.3, 0] }}
      transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2 }}
    />
  </div>
);

// ===== 7. 초신성 (Supernova) =====
export const Supernova = ({ color }) => {
  const debris = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => {
        const angle = Math.random() * 360;
        const distance = 50 + Math.random() * 100;
        return {
          id: i,
          xEnd: Math.cos((angle * Math.PI) / 180) * distance,
          yEnd: Math.sin((angle * Math.PI) / 180) * distance,
          color: i % 2 === 0 ? color : "#fff",
          size: 2 + Math.random() * 6,
          delay: 1 + Math.random() * 0.5,
        };
      }),
    [color]
  );

  return (
    <div className="loading-effect supernova">
      <motion.div
        className="supernova-core"
        style={{ background: color }}
        animate={{
          scale: [1, 0.3, 3, 1],
          opacity: [1, 1, 0.5, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          times: [0, 0.3, 0.5, 1],
        }}
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="supernova-wave"
          style={{ borderColor: color }}
          animate={{
            scale: [0, 4],
            opacity: [1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 1 + i * 0.2,
            repeatDelay: 1,
          }}
        />
      ))}
      {debris.map((d) => (
        <motion.div
          key={d.id}
          className="star-debris"
          style={{
            background: d.color,
            width: d.size,
            height: d.size,
          }}
          animate={{
            x: [0, d.xEnd],
            y: [0, d.yEnd],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: d.delay,
            repeatDelay: 1,
          }}
        />
      ))}
    </div>
  );
};

// ===== 8. 포탈 (Portal) =====
export const Portal = ({ color }) => {
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => {
        const angle = (i / 20) * 360;
        return {
          id: i,
          startX: Math.cos((angle * Math.PI) / 180) * 100,
          startY: Math.sin((angle * Math.PI) / 180) * 100,
        };
      }),
    []
  );

  return (
    <div className="loading-effect portal">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="portal-ring"
          style={{
            borderColor: color,
            width: 120 + i * 30,
            height: 120 + i * 30,
          }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{
            duration: 4 - i * 0.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
      <motion.div
        className="portal-vortex"
        style={{
          background: `conic-gradient(from 0deg, ${color}, transparent, ${color}, transparent, ${color})`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="portal-particle"
          style={{ background: color }}
          animate={{
            x: [p.startX, 0],
            y: [p.startY, 0],
            scale: [1, 0],
            opacity: [1, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: p.id * 0.1,
          }}
        />
      ))}
      <motion.div
        className="portal-center"
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </div>
  );
};

// ===== 9. 용암 (Lava) =====
export const Lava = ({ color }) => {
  const bubbles = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        left: 10 + Math.random() * 80,
        size: 20 + Math.random() * 30,
        duration: 2 + Math.random(),
        delay: Math.random() * 2,
      })),
    []
  );

  const splashes = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        id: i,
        color: i % 2 === 0 ? color : "#ff6b35",
        left: Math.random() * 100,
        yEnd: -50 - Math.random() * 50,
        xStart: (Math.random() - 0.5) * 40,
        xEnd: (Math.random() - 0.5) * 80,
        delay: Math.random() * 2,
      })),
    [color]
  );

  return (
    <div className="loading-effect lava">
      {bubbles.map((b) => (
        <motion.div
          key={b.id}
          className="lava-bubble"
          style={{
            background: `radial-gradient(circle, #ff6b35 30%, ${color} 100%)`,
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
          }}
          animate={{
            y: [100, -20],
            scale: [0, 1, 1.5, 0],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: b.duration,
            repeat: Infinity,
            delay: b.delay,
          }}
        />
      ))}
      {splashes.map((s) => (
        <motion.div
          key={s.id}
          className="lava-splash"
          style={{
            background: s.color,
            left: `${s.left}%`,
          }}
          animate={{
            y: [0, s.yEnd, 20],
            x: [s.xStart, s.xEnd],
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: s.delay,
          }}
        />
      ))}
      <motion.div
        className="lava-surface"
        style={{
          background: `linear-gradient(0deg, ${color} 0%, #ff6b35 50%, #f7c815 100%)`,
        }}
        animate={{ y: [5, -5, 5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );
};

// ===== 10. 은하 충돌 (Galaxy Collision) =====
export const GalaxyCollision = ({ color }) => {
  const stars = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        color: i % 2 === 0 ? color : "#fad0c4",
        left: 40 + Math.random() * 20,
        top: 40 + Math.random() * 20,
        xEnd: (Math.random() - 0.5) * 100,
        yEnd: (Math.random() - 0.5) * 100,
        delay: Math.random() * 2,
      })),
    [color]
  );

  return (
    <div className="loading-effect galaxy-collision">
      <motion.div
        className="galaxy-1"
        animate={{
          x: [50, 0],
          rotate: 360,
        }}
        transition={{
          x: { duration: 3, repeat: Infinity, repeatType: "reverse" },
          rotate: { duration: 10, repeat: Infinity, ease: "linear" },
        }}
      >
        <div className="galaxy-core" style={{ background: color }} />
        <div className="galaxy-spiral" style={{ borderColor: color }} />
      </motion.div>
      <motion.div
        className="galaxy-2"
        animate={{
          x: [-50, 0],
          rotate: -360,
        }}
        transition={{
          x: { duration: 3, repeat: Infinity, repeatType: "reverse" },
          rotate: { duration: 8, repeat: Infinity, ease: "linear" },
        }}
      >
        <div className="galaxy-core" style={{ background: "#fad0c4" }} />
        <div className="galaxy-spiral" style={{ borderColor: "#fad0c4" }} />
      </motion.div>
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="collision-star"
          style={{
            background: star.color,
            left: `${star.left}%`,
            top: `${star.top}%`,
          }}
          animate={{
            x: [0, star.xEnd],
            y: [0, star.yEnd],
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: star.delay,
          }}
        />
      ))}
    </div>
  );
};

// ===== 11. 대형 카드 회전 (Spinning Card) =====
export const SpinningCard = ({ color }) => (
  <div className="loading-effect spinning-card-wrapper">
    <motion.div
      className="spinning-card-body"
      style={{
        borderColor: color,
        boxShadow: `0 0 30px ${color}44`,
      }}
      animate={{
        rotateY: 360,
      }}
      transition={{
        duration: 2, // 회전 속도 (초)
        repeat: Infinity,
        ease: "linear",
      }}
    >
      {/* 카드의 뒷면 무늬 (FlipCard와 유사한 느낌으로 연출) */}
      <div
        className="spinning-card-pattern"
        style={{
          background: `repeating-linear-gradient(
              45deg,
              ${color}11,
              ${color}11 10px,
              ${color}22 10px,
              ${color}22 20px
            )`,
        }}
      >
        <div className="spinning-card-center-symbol">🔮</div>
      </div>
    </motion.div>

    {/* 주변을 감싸는 신비로운 빛 */}
    <motion.div
      className="spinning-card-glow"
      style={{ background: color }}
      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
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
  { id: "fireworks", name: "불꽃놀이", icon: "🎆", component: Fireworks },
  { id: "energy", name: "에너지 버스트", icon: "⚡", component: EnergyBurst },
  { id: "blackhole", name: "블랙홀", icon: "🕳️", component: BlackHole },
  { id: "phoenix", name: "피닉스", icon: "🔥", component: Phoenix },
  { id: "lightning", name: "번개 폭풍", icon: "🌩️", component: LightningStorm },
  { id: "supernova", name: "초신성", icon: "🌟", component: Supernova },
  { id: "portal", name: "포탈", icon: "🌀", component: Portal },
  { id: "lava", name: "용암", icon: "🌋", component: Lava },
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
      >
        {text}
      </motion.p>
    </div>
  );
};

export default LoadingEffect;
